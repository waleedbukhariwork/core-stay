import { IdentityUnitOfWork } from './ports/identity-unit-of-work.js';
import { isActiveVerified } from '../domain/account-policy.js';
import { Injectable } from '@nestjs/common';
import {
  IdentityApi,
  type AuthenticatedActor,
} from '../public/identity.api.js';
import { SessionTokens } from './ports/session-tokens.js';
import { Clock } from './ports/clock.js';
import { identityFailure } from '../domain/identity-failure.js';
@Injectable()
export class ActorAuthenticator extends IdentityApi {
  // A copied or deserialized identity must be authenticated again, not trusted by shape.
  private readonly actors = new WeakMap<AuthenticatedActor, number>();
  constructor(
    private readonly tokens: SessionTokens,
    private readonly clock: Clock,
    private readonly repository: IdentityUnitOfWork,
  ) {
    super();
  }
  async authenticate(raw: string): Promise<AuthenticatedActor> {
    const claims = await this.tokens.verify(raw);
    const actor: AuthenticatedActor = Object.freeze({
      kind: 'user',
      userId: claims.userId,
      sessionId: claims.sessionId,
    });
    this.actors.set(actor, claims.expiresAt);
    return actor;
  }
  async assertActiveVerified(actor: AuthenticatedActor): Promise<void> {
    this.assertAuthenticated(actor);
    await this.repository.transaction(async (tx) => {
      const user = await tx.accounts.findByIdForUpdate(actor.userId);
      const session = await tx.sessions.findForUpdate(actor.sessionId);
      this.assertAuthenticated(actor);
      if (
        !isActiveVerified(user) ||
        !session ||
        session.userId !== actor.userId ||
        session.revokedAt
      )
        throw identityFailure('SESSION_REVOKED');
      if (session.expiresAt <= this.clock.now())
        throw identityFailure('SESSION_EXPIRED');
    });
  }
  assertAuthenticated(actor: AuthenticatedActor): void {
    const expiresAt = this.actors.get(actor);
    if (expiresAt === undefined) throw identityFailure('ACCESS_TOKEN_INVALID');
    if (expiresAt <= this.clock.now().getTime())
      throw identityFailure('ACCESS_TOKEN_EXPIRED');
  }
}
