import { eq } from 'drizzle-orm';
import type { DatabaseTransaction } from '../../../../platform/database/database-transaction.js';
import type { RefreshTokenRepository } from '../../application/ports/refresh-token.repository.js';
import type { RefreshToken } from '../../domain/refresh-token.js';
import { refreshTokens } from './auth.schema.js';
export class DrizzleRefreshTokenRepository implements RefreshTokenRepository {
  constructor(private readonly db: DatabaseTransaction) {}
  async findByHash(hash: string): Promise<RefreshToken | undefined> {
    return (
      await this.db
        .select()
        .from(refreshTokens)
        .where(eq(refreshTokens.tokenHash, hash))
    )[0];
  }
  async save(token: RefreshToken): Promise<void> {
    await this.db
      .insert(refreshTokens)
      .values(token)
      .onConflictDoUpdate({ target: refreshTokens.id, set: token });
  }
}
