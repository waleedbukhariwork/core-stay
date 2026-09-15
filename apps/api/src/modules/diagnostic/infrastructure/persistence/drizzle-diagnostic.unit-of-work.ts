import { Inject, Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from '../../../../platform/database/database.tokens.js';
import type { DatabaseTransaction } from '../../../../platform/database/database-transaction.js';
import type { schema } from '../../../../platform/database/schema.js';
import {
  DiagnosticUnitOfWork,
  type DiagnosticStore,
} from '../../application/ports/diagnostic.unit-of-work.js';
import type {
  Confidence,
  DiagnosticAttempt,
  DiagnosticSession,
} from '../../domain/diagnostic.js';
import {
  diagnosticSessions as sessions,
  diagnosticAttempts as attempts,
} from './diagnostic.schema.js';

const sessionSelection = {
  id: sessions.id,
  diagnosticId: sessions.diagnosticId,
  definitionVersion: sessions.definitionVersion,
  status: sessions.status,
  startedAt: sessions.startedAt,
  completedAt: sessions.completedAt,
};
const attemptSelection = {
  questionId: attempts.questionId,
  skillId: attempts.skillId,
  conceptId: attempts.conceptId,
  difficultyId: attempts.difficultyId,
  interactionType: attempts.interactionType,
  selectedOptionId: attempts.selectedOptionId,
  correct: attempts.correct,
  responseDurationMs: attempts.responseDurationMs,
  confidence: attempts.confidence,
  answeredAt: attempts.answeredAt,
};

class DrizzleDiagnosticStore implements DiagnosticStore {
  constructor(private readonly tx: DatabaseTransaction) {}
  async lockSession(
    userId: string,
    diagnosticId: string,
  ): Promise<DiagnosticSession | undefined> {
    return (
      await this.tx
        .select(sessionSelection)
        .from(sessions)
        .where(
          and(
            eq(sessions.userId, userId),
            eq(sessions.diagnosticId, diagnosticId),
          ),
        )
        .for('update')
    )[0];
  }
  async start(
    userId: string,
    diagnosticId: string,
    version: string,
  ): Promise<DiagnosticSession> {
    // Concurrent first starts wait on the unique key; the losing request resumes the winner.
    await this.tx
      .insert(sessions)
      .values({ userId, diagnosticId, definitionVersion: version })
      .onConflictDoNothing();
    return (await this.lockSession(userId, diagnosticId))!;
  }
  async attempts(sessionId: string): Promise<DiagnosticAttempt[]> {
    return this.tx
      .select(attemptSelection)
      .from(attempts)
      .where(eq(attempts.sessionId, sessionId));
  }
  async answer(
    sessionId: string,
    attempt: Omit<DiagnosticAttempt, 'answeredAt'>,
  ): Promise<DiagnosticAttempt> {
    return (
      await this.tx
        .insert(attempts)
        .values({ sessionId, ...attempt })
        .returning(attemptSelection)
    )[0]!;
  }
  async confidence(
    sessionId: string,
    questionId: string,
    confidence: Confidence,
  ): Promise<void> {
    await this.tx
      .update(attempts)
      .set({ confidence })
      .where(
        and(
          eq(attempts.sessionId, sessionId),
          eq(attempts.questionId, questionId),
        ),
      );
  }
  async complete(sessionId: string): Promise<DiagnosticSession> {
    return (
      await this.tx
        .update(sessions)
        .set({ status: 'completed', completedAt: sql`clock_timestamp()` })
        .where(eq(sessions.id, sessionId))
        .returning(sessionSelection)
    )[0]!;
  }
}

@Injectable()
export class DrizzleDiagnosticUnitOfWork extends DiagnosticUnitOfWork {
  constructor(
    @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>,
  ) {
    super();
  }
  transaction<T>(work: (store: DiagnosticStore) => Promise<T>): Promise<T> {
    return this.db.transaction((tx) => work(new DrizzleDiagnosticStore(tx)));
  }
}
