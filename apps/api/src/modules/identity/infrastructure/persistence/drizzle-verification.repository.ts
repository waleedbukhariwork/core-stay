import { eq } from 'drizzle-orm';
import type { DatabaseTransaction } from '../../../../platform/database/database-transaction.js';
import type { VerificationRepository } from '../../application/ports/verification.repository.js';
import type { Challenge } from '../../domain/verification-challenge.js';
import { verificationChallenges } from './auth.schema.js';
export class DrizzleVerificationRepository implements VerificationRepository {
  constructor(private readonly db: DatabaseTransaction) {}
  async findForUpdate(userId: string): Promise<Challenge | undefined> {
    return (
      await this.db
        .select()
        .from(verificationChallenges)
        .where(eq(verificationChallenges.userId, userId))
        .for('update')
    )[0];
  }
  async save(challenge: Challenge): Promise<void> {
    await this.db
      .insert(verificationChallenges)
      .values(challenge)
      .onConflictDoUpdate({
        target: verificationChallenges.userId,
        set: challenge,
      });
  }
}
