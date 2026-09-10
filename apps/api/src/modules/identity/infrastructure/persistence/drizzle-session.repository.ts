import { and, eq } from 'drizzle-orm';
import type { DatabaseTransaction } from '../../../../platform/database/database-transaction.js';
import type { SessionRepository } from '../../application/ports/session.repository.js';
import type { Session } from '../../domain/session.js';
import { authSessions } from './auth.schema.js';
export class DrizzleSessionRepository implements SessionRepository {
  constructor(private readonly db: DatabaseTransaction) {}
  async findOwner(id: string): Promise<{ userId: string } | undefined> {
    return (
      await this.db
        .select({ userId: authSessions.userId })
        .from(authSessions)
        .where(eq(authSessions.id, id))
    )[0];
  }
  async findForUpdate(id: string): Promise<Session | undefined> {
    return (
      await this.db
        .select()
        .from(authSessions)
        .where(eq(authSessions.id, id))
        .for('update')
    )[0];
  }
  async save(session: Session): Promise<void> {
    await this.db
      .insert(authSessions)
      .values(session)
      .onConflictDoUpdate({ target: authSessions.id, set: session });
  }
  async revoke(userId: string, now: Date, sessionId?: string): Promise<void> {
    await this.db
      .update(authSessions)
      .set({ revokedAt: now })
      .where(
        and(
          eq(authSessions.userId, userId),
          sessionId ? eq(authSessions.id, sessionId) : undefined,
        ),
      );
  }
}
