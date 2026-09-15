import type {
  Confidence,
  DiagnosticAttempt,
  DiagnosticSession,
} from '../../domain/diagnostic.js';

export interface DiagnosticStore {
  lockSession(
    userId: string,
    diagnosticId: string,
  ): Promise<DiagnosticSession | undefined>;
  start(
    userId: string,
    diagnosticId: string,
    version: string,
  ): Promise<DiagnosticSession>;
  attempts(sessionId: string): Promise<DiagnosticAttempt[]>;
  answer(
    sessionId: string,
    attempt: Omit<DiagnosticAttempt, 'answeredAt'>,
  ): Promise<DiagnosticAttempt>;
  confidence(
    sessionId: string,
    questionId: string,
    confidence: Confidence,
  ): Promise<void>;
  complete(sessionId: string): Promise<DiagnosticSession>;
}
export abstract class DiagnosticUnitOfWork {
  abstract transaction<T>(
    work: (store: DiagnosticStore) => Promise<T>,
  ): Promise<T>;
}
