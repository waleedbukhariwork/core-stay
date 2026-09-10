import { Injectable } from '@nestjs/common';
import { IdentityUnitOfWork } from './ports/identity-unit-of-work.js';
import { EmailVerificationService } from './email-verification.service.js';
import { SessionService } from './session.service.js';
import type { AuthenticatedSession } from './authenticated-session.js';
import { Clock } from './ports/clock.js';
import { identityFailure } from '../domain/identity-failure.js';
import { normalizeEmail } from '../domain/user.js';
import { assertLoginAllowed } from '../domain/account-policy.js';
import { canVerifyEmail } from '../domain/verification-policy.js';
@Injectable()
export class AuthService {
  constructor(
    private readonly work: IdentityUnitOfWork,
    private readonly verification: EmailVerificationService,
    private readonly sessions: SessionService,
    private readonly clock: Clock,
  ) {}
  async register(email: string, password: string): Promise<void> {
    await this.work.transaction(async (tx) => {
      const existing = await tx.accounts.findByEmailForUpdate(
        normalizeEmail(email),
      );
      if (existing) {
        if (
          !canVerifyEmail(existing) ||
          !(await tx.credentials.matches(existing.id, password))
        )
          throw identityFailure('ACCOUNT_ALREADY_EXISTS');
        throw identityFailure('REGISTRATION_PENDING');
      }
      const user = await tx.accounts.create(email.trim(), this.clock.now());
      await tx.credentials.create(user.id, password, this.clock.now());
      await this.verification.issue(tx, user);
    });
  }
  login(email: string, password: string): Promise<AuthenticatedSession> {
    return this.work.transaction(async (tx) => {
      const user = await tx.accounts.findByEmailForUpdate(
        normalizeEmail(email),
      );
      assertLoginAllowed(
        user,
        await tx.credentials.matches(user?.id, password),
      );
      return this.sessions.create(tx, user);
    });
  }
}
