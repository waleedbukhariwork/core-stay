import { Injectable } from '@nestjs/common';
import {
  IdentityUnitOfWork,
  type IdentityTransaction,
} from './ports/identity-unit-of-work.js';
import { VerificationCodes } from './ports/verification-codes.js';
import { AUTH_POLICY } from '../domain/auth-policy.js';
import {
  identityFailure,
  IdentityFailure,
} from '../domain/identity-failure.js';
import { Clock } from './ports/clock.js';
import { EmailSender } from './ports/email-sender.js';
import { SessionService } from './session.service.js';
import type { AuthenticatedSession } from './authenticated-session.js';
import { normalizeEmail, type User } from '../domain/user.js';
import type { Challenge } from '../domain/verification-challenge.js';
import {
  canVerifyEmail,
  assertResendAllowed,
  verificationFailure,
  rejectVerificationAttempt,
} from '../domain/verification-policy.js';
@Injectable()
export class EmailVerificationService {
  constructor(
    private readonly work: IdentityUnitOfWork,
    private readonly codes: VerificationCodes,
    private readonly clock: Clock,
    private readonly email: EmailSender,
    private readonly sessions: SessionService,
  ) {}
  async issue(tx: IdentityTransaction, user: User): Promise<void> {
    const now = this.clock.now();
    assertResendAllowed(await tx.verification.findForUpdate(user.id), now);
    const { id, code, digest } = this.codes.generate();
    const challenge: Challenge = {
      id,
      userId: user.id,
      digest,
      expiresAt: new Date(
        now.getTime() + AUTH_POLICY.verificationSeconds * 1000,
      ),
      attempts: 0,
      consumedAt: null,
      lastSentAt: now,
      createdAt: now,
    };
    await tx.verification.save(challenge);
    // Preserves synchronous delivery/rollback semantics; see ADR 0007.
    await this.email.sendVerification(user.email, code);
  }
  async resend(email: string): Promise<void> {
    await this.work.transaction(async (tx) => {
      const user = await tx.accounts.findByEmailForUpdate(
        normalizeEmail(email),
      );
      if (!canVerifyEmail(user)) return;
      await this.issue(tx, user);
    });
  }
  async verify(email: string, code: string): Promise<AuthenticatedSession> {
    const result = await this.work.transaction(async (tx) => {
      const user = await tx.accounts.findByEmailForUpdate(
        normalizeEmail(email),
      );
      if (!canVerifyEmail(user)) return identityFailure('VERIFICATION_INVALID');
      const challenge = await tx.verification.findForUpdate(user.id);
      const now = this.clock.now();
      const failure = verificationFailure(challenge, now);
      if (failure) return failure;
      if (!challenge) return identityFailure('VERIFICATION_INVALID');
      if (!this.codes.matches(challenge.id, challenge.digest, code)) {
        const rejection = rejectVerificationAttempt(challenge);
        await tx.verification.save(rejection.challenge);
        return rejection.failure;
      }
      await tx.verification.save({ ...challenge, consumedAt: now });
      return this.sessions.create(
        tx,
        await tx.accounts.markEmailVerified(user.id, now),
      );
    });
    // Failed guesses must commit before transport receives the failure.
    if (result instanceof IdentityFailure) throw result;
    return result;
  }
}
