import { Injectable } from '@nestjs/common';
import { ProfileApi } from '../../profile/public/profile.api.js';
import type { AuthenticatedActor } from '../../identity/public/identity.api.js';
import {
  DiagnosticUnitOfWork,
  type DiagnosticStore,
} from './ports/diagnostic.unit-of-work.js';
import {
  currentDefinition,
  getDefinition,
  INITIAL_DIAGNOSTIC_ID,
} from '../domain/diagnostic-catalog.js';
import {
  CONFIDENCE_VALUES,
  DiagnosticFailure,
  evaluateAnswer,
  nextQuestion,
  pendingConfidence,
  type Confidence,
  type DiagnosticAttempt,
  type DiagnosticDefinition,
  type DiagnosticQuestion,
  type DiagnosticSession,
} from '../domain/diagnostic.js';

export interface DiagnosticResult {
  session: DiagnosticSession;
  totalQuestions: number;
  answeredQuestions: number;
  question: DiagnosticQuestion | null;
  confidenceQuestion: DiagnosticQuestion | null;
  confidenceAnswer: string | null;
  review: { question: DiagnosticQuestion; attempt: DiagnosticAttempt } | null;
}
export interface AnswerInput {
  questionId: string;
  selectedOptionId: string;
  responseDurationMs?: number;
}

@Injectable()
export class DiagnosticService {
  constructor(
    private readonly profiles: ProfileApi,
    private readonly unitOfWork: DiagnosticUnitOfWork,
  ) {}

  private async authorize(actor: AuthenticatedActor): Promise<void> {
    // Profile owns completion and verifies actor provenance, account and live session.
    if (!(await this.profiles.isComplete(actor)))
      throw new DiagnosticFailure('PROFILE_INCOMPLETE');
  }

  async read(
    actor: AuthenticatedActor,
    start = false,
  ): Promise<DiagnosticResult | null> {
    await this.authorize(actor);
    return this.unitOfWork.transaction(async (store) => {
      let session = await store.lockSession(
        actor.userId,
        INITIAL_DIAGNOSTIC_ID,
      );
      if (!session && start) {
        const definition = currentDefinition();
        session = await store.start(
          actor.userId,
          definition.id,
          definition.version,
        );
      }
      if (!session) return null;
      return this.result(
        session,
        getDefinition(session.diagnosticId, session.definitionVersion),
        await store.attempts(session.id),
      );
    });
  }

  async answer(
    actor: AuthenticatedActor,
    input: AnswerInput,
  ): Promise<DiagnosticResult> {
    await this.authorize(actor);
    return this.unitOfWork.transaction(async (store) => {
      const { session, definition, attempts } = await this.load(store, actor);
      const question = definition.questions.find(
        (item) => item.id === input.questionId,
      );
      if (!question) throw new DiagnosticFailure('INVALID_DIAGNOSTIC_ANSWER');
      const evaluated = evaluateAnswer(
        question,
        input.selectedOptionId,
        input.responseDurationMs,
      );
      const existing = attempts.find(
        (attempt) => attempt.questionId === question.id,
      );
      if (existing) {
        // An identical retry reads the original evidence; it never changes duration or answer.
        if (existing.selectedOptionId !== input.selectedOptionId)
          throw new DiagnosticFailure('DIAGNOSTIC_ANSWER_CONFLICT');
        return this.result(session, definition, attempts, {
          question,
          attempt: existing,
        });
      }
      if (session.status === 'completed')
        throw new DiagnosticFailure('DIAGNOSTIC_COMPLETED');
      if (
        pendingConfidence(definition, attempts) ||
        nextQuestion(definition, attempts)?.id !== question.id
      )
        throw new DiagnosticFailure('DIAGNOSTIC_QUESTION_OUT_OF_ORDER');
      const attempt = await store.answer(session.id, evaluated);
      attempts.push(attempt);
      const updated = await this.finish(store, session, definition, attempts);
      return this.result(updated, definition, attempts, { question, attempt });
    });
  }

  async confidence(
    actor: AuthenticatedActor,
    questionId: string,
    confidence: Confidence,
  ): Promise<DiagnosticResult> {
    await this.authorize(actor);
    if (!CONFIDENCE_VALUES.includes(confidence))
      throw new DiagnosticFailure('INVALID_DIAGNOSTIC_CONFIDENCE');
    return this.unitOfWork.transaction(async (store) => {
      const { session, definition, attempts } = await this.load(store, actor);
      const question = definition.questions.find(
        (item) => item.id === questionId,
      );
      const attempt = attempts.find((item) => item.questionId === questionId);
      if (!question?.confidenceRequested || !attempt)
        throw new DiagnosticFailure('INVALID_DIAGNOSTIC_CONFIDENCE');
      if (attempt.confidence !== confidence) {
        if (session.status === 'completed')
          throw new DiagnosticFailure('DIAGNOSTIC_COMPLETED');
        if (
          definition.questions
            .filter((item) =>
              attempts.some((saved) => saved.questionId === item.id),
            )
            .at(-1)?.id !== questionId
        )
          throw new DiagnosticFailure('DIAGNOSTIC_QUESTION_OUT_OF_ORDER');
        await store.confidence(session.id, questionId, confidence);
        attempt.confidence = confidence;
      }
      const updated = await this.finish(store, session, definition, attempts);
      return this.result(updated, definition, attempts, { question, attempt });
    });
  }

  private async load(store: DiagnosticStore, actor: AuthenticatedActor) {
    const session = await store.lockSession(
      actor.userId,
      INITIAL_DIAGNOSTIC_ID,
    );
    if (!session) throw new DiagnosticFailure('DIAGNOSTIC_NOT_STARTED');
    return {
      session,
      definition: getDefinition(
        session.diagnosticId,
        session.definitionVersion,
      ),
      attempts: await store.attempts(session.id),
    };
  }

  private async finish(
    store: DiagnosticStore,
    session: DiagnosticSession,
    definition: DiagnosticDefinition,
    attempts: DiagnosticAttempt[],
  ) {
    if (
      session.status === 'active' &&
      !nextQuestion(definition, attempts) &&
      !pendingConfidence(definition, attempts)
    )
      return store.complete(session.id);
    return session;
  }

  private result(
    session: DiagnosticSession,
    definition: DiagnosticDefinition,
    attempts: DiagnosticAttempt[],
    review: DiagnosticResult['review'] = null,
  ): DiagnosticResult {
    const pending = pendingConfidence(definition, attempts);
    return {
      session,
      totalQuestions: definition.questions.length,
      answeredQuestions: attempts.length,
      question:
        session.status === 'active' && !pending
          ? (nextQuestion(definition, attempts) ?? null)
          : null,
      confidenceQuestion: pending
        ? definition.questions.find(
            (question) => question.id === pending.questionId,
          )!
        : null,
      confidenceAnswer: pending?.selectedOptionId ?? null,
      review:
        review &&
        (!review.question.confidenceRequested ||
          review.attempt.confidence !== null)
          ? review
          : null,
    };
  }
}
