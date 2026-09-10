import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from '../../../../platform/database/database.tokens.js';
import type { schema } from '../../../../platform/database/schema.js';
import {
  IdentityUnitOfWork,
  type IdentityTransaction,
} from '../../application/ports/identity-unit-of-work.js';
import { identityFailure } from '../../domain/identity-failure.js';
import { PasswordHasher } from '../crypto/password-hasher.js';
import { DrizzleAccountRepository } from './drizzle-account.repository.js';
import { DrizzleCredentialRepository } from './drizzle-credential.repository.js';
import { DrizzleVerificationRepository } from './drizzle-verification.repository.js';
import { DrizzleSessionRepository } from './drizzle-session.repository.js';
import { DrizzleRefreshTokenRepository } from './drizzle-refresh-token.repository.js';
@Injectable()
export class DrizzleIdentityUnitOfWork extends IdentityUnitOfWork {
  constructor(
    @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>,
    private readonly passwords: PasswordHasher,
  ) {
    super();
  }
  async transaction<T>(
    work: (tx: IdentityTransaction) => Promise<T>,
  ): Promise<T> {
    try {
      return await this.db.transaction((db) =>
        work({
          accounts: new DrizzleAccountRepository(db),
          credentials: new DrizzleCredentialRepository(db, this.passwords),
          verification: new DrizzleVerificationRepository(db),
          sessions: new DrizzleSessionRepository(db),
          refreshTokens: new DrizzleRefreshTokenRepository(db),
        }),
      );
    } catch (error) {
      const cause = error as {
        code?: string;
        constraint?: string;
        cause?: { code?: string; constraint?: string };
      };
      const databaseError = cause.cause ?? cause;
      if (
        databaseError.code === '23505' &&
        databaseError.constraint === 'users_email_normalized_unique'
      )
        throw identityFailure('ACCOUNT_ALREADY_EXISTS');
      throw error;
    }
  }
}
