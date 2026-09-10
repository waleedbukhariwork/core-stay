import { eq } from 'drizzle-orm';
import type { DatabaseTransaction } from '../../../../platform/database/database-transaction.js';
import { users } from './users.schema.js';
import { normalizeEmail, type User } from '../../domain/user.js';
import type { AccountRepository } from '../../application/ports/account.repository.js';
export class DrizzleAccountRepository implements AccountRepository {
  constructor(private readonly db: DatabaseTransaction) {}
  async findByEmailForUpdate(email: string): Promise<User | undefined> {
    return (
      await this.db
        .select()
        .from(users)
        .where(eq(users.emailNormalized, email))
        .for('update')
    )[0];
  }
  async findByIdForUpdate(id: string): Promise<User | undefined> {
    return (
      await this.db.select().from(users).where(eq(users.id, id)).for('update')
    )[0];
  }
  async create(email: string, now: Date): Promise<User> {
    return (
      await this.db
        .insert(users)
        .values({
          email,
          emailNormalized: normalizeEmail(email),
          createdAt: now,
          updatedAt: now,
        })
        .returning()
    )[0]!;
  }
  async markEmailVerified(id: string, now: Date): Promise<User> {
    return (
      await this.db
        .update(users)
        .set({ emailVerifiedAt: now, updatedAt: now })
        .where(eq(users.id, id))
        .returning()
    )[0]!;
  }
}
