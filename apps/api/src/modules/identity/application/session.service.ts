import { Injectable } from '@nestjs/common';
import {
  IdentityUnitOfWork,
  type IdentityTransaction,
} from './ports/identity-unit-of-work.js';
import { SessionTokens } from './ports/session-tokens.js';
import type { AuthenticatedActor } from '../public/identity.api.js';
import { Clock } from './ports/clock.js';
import { AUTH_POLICY } from '../domain/auth-policy.js';
import {
  identityFailure,
  IdentityFailure,
} from '../domain/identity-failure.js';
import type { User } from '../domain/user.js';
import type { AuthenticatedSession } from './authenticated-session.js';
import { SessionAccessPolicy } from './policies/session-access.policy.js';
import { isActiveVerified } from '../domain/account-policy.js';
import { refreshFailure } from '../domain/session-policy.js';
@Injectable()
export class SessionService {
  constructor(
    private readonly repository: IdentityUnitOfWork,
    private readonly tokens: SessionTokens,
    private readonly clock: Clock,
    private readonly access: SessionAccessPolicy,
  ) {}
  async create(
    tx: IdentityTransaction,
    user: User,
  ): Promise<AuthenticatedSession> {
    const now = this.clock.now();
    const id = this.tokens.newId();
    const expiresAt = new Date(
      now.getTime() + AUTH_POLICY.sessionSeconds * 1000,
    );
    const refresh = this.tokens.refresh();
    await tx.sessions.save({
      id,
      userId: user.id,
      createdAt: now,
      lastUsedAt: now,
      expiresAt,
      revokedAt: null,
    });
    await tx.refreshTokens.save({
      id: refresh.id,
      sessionId: id,
      tokenHash: refresh.hash,
      expiresAt,
      consumedAt: null,
      replacedByTokenId: null,
      createdAt: now,
    });
    return {
      user,
      accessToken: await this.tokens.access(user.id, id),
      refreshToken: refresh.raw,
      expiresIn: AUTH_POLICY.accessSeconds,
    };
  }
  async refresh(raw: string): Promise<AuthenticatedSession> {
    const result = await this.repository.transaction(async (tx) => {
      const token = await tx.refreshTokens.findByHash(this.tokens.digest(raw));
      if (!token) return identityFailure('REFRESH_TOKEN_INVALID');
      // Every workflow locks user before session, including logout-all.
      const identity = await tx.sessions.findOwner(token.sessionId);
      if (!identity) return identityFailure('REFRESH_TOKEN_INVALID');
      const user = await tx.accounts.findByIdForUpdate(identity.userId);
      const initialSession = await tx.sessions.findForUpdate(token.sessionId);
      if (!initialSession) return identityFailure('REFRESH_TOKEN_INVALID');
      const now = this.clock.now();
      const current = (await tx.refreshTokens.findByHash(token.tokenHash))!;
      if (current.consumedAt) {
        await tx.sessions.revoke(initialSession.userId, now, initialSession.id);
        return identityFailure('SESSION_REVOKED');
      }
      const failure = refreshFailure(initialSession, current, now);
      if (failure) return failure;
      if (!isActiveVerified(user)) return identityFailure('SESSION_REVOKED');
      const replacement = this.tokens.refresh();
      await tx.refreshTokens.save({
        id: replacement.id,
        sessionId: initialSession.id,
        tokenHash: replacement.hash,
        expiresAt: initialSession.expiresAt,
        consumedAt: null,
        replacedByTokenId: null,
        createdAt: now,
      });
      await tx.refreshTokens.save({
        ...current,
        consumedAt: now,
        replacedByTokenId: replacement.id,
      });
      await tx.sessions.save({ ...initialSession, lastUsedAt: now });
      return {
        user,
        accessToken: await this.tokens.access(user.id, initialSession.id),
        refreshToken: replacement.raw,
        expiresIn: AUTH_POLICY.accessSeconds,
      };
    });
    // Throw after commit so reuse revocation cannot be rolled back.
    if (result instanceof IdentityFailure) throw result;
    return result;
  }
  async me(principal: AuthenticatedActor): Promise<User> {
    this.access.assertActor(principal);
    return this.repository.transaction(async (tx) => {
      const user = await tx.accounts.findByIdForUpdate(principal.userId);
      const session = await tx.sessions.findForUpdate(principal.sessionId);
      this.access.assertOwnership(principal, session);
      if (
        !user ||
        user.status !== 'active' ||
        !user.emailVerifiedAt ||
        !session ||
        session.userId !== user.id ||
        session.revokedAt
      )
        throw identityFailure('SESSION_REVOKED');
      if (session.expiresAt <= this.clock.now())
        throw identityFailure('SESSION_EXPIRED');
      return user;
    });
  }
  async logout(principal: AuthenticatedActor, all = false): Promise<void> {
    this.access.assertActor(principal);
    await this.repository.transaction(async (tx) => {
      await tx.accounts.findByIdForUpdate(principal.userId);
      this.access.assertOwnership(
        principal,
        await tx.sessions.findForUpdate(principal.sessionId),
      );
      await tx.sessions.revoke(
        principal.userId,
        this.clock.now(),
        all ? undefined : principal.sessionId,
      );
    });
  }
}
