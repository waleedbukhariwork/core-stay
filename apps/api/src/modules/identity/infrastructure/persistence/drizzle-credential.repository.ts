import { eq } from 'drizzle-orm';
import type { DatabaseTransaction } from '../../../../platform/database/database-transaction.js';
import type { CredentialRepository } from '../../application/ports/credential.repository.js';
import { passwordCredentials } from './auth.schema.js';
import { PasswordHasher } from '../crypto/password-hasher.js';
export class DrizzleCredentialRepository implements CredentialRepository {
  constructor(
    private readonly db: DatabaseTransaction,
    private readonly passwords: PasswordHasher,
  ) {}
  async create(userId: string, password: string, now: Date): Promise<void> {
    const passwordHash = await this.passwords.hash(password);
    await this.db.insert(passwordCredentials).values({
      userId,
      passwordHash,
      passwordChangedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  }
  async matches(
    userId: string | undefined,
    password: string,
  ): Promise<boolean> {
    const credential = userId
      ? (
          await this.db
            .select()
            .from(passwordCredentials)
            .where(eq(passwordCredentials.userId, userId))
        )[0]
      : undefined;
    return this.passwords.check(credential?.passwordHash, password);
  }
}
