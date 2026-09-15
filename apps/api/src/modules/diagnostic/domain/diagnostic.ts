export const CONFIDENCE_VALUES = [
  'guessing',
  'somewhat_sure',
  'very_sure',
] as const;
export type Confidence = (typeof CONFIDENCE_VALUES)[number];
export type QuestionCategory =
  | 'scenario_judgment'
  | 'predict_outcome'
  | 'spot_the_bug'
  | 'better_approach'
  | 'conceptual_reasoning';
export type Concept = Readonly<{ id: string; label: string }>;
export interface DiagnosticQuestion {
  readonly id: string;
  readonly category: QuestionCategory;
  readonly interactionType: 'single_choice';
  readonly skill: Concept;
  readonly concept: Concept;
  readonly difficulty: string;
  readonly prompt: string;
  readonly context: string | null;
  readonly code: string | null;
  readonly options: readonly Readonly<{ id: string; label: string }>[];
  readonly confidenceRequested: boolean;
  readonly correctOptionId: string;
  readonly explanation: string;
  readonly keyIdea: string;
}
export interface DiagnosticDefinition {
  readonly id: string;
  readonly version: string;
  readonly questions: readonly DiagnosticQuestion[];
}
export interface DiagnosticSession {
  id: string;
  diagnosticId: string;
  definitionVersion: string;
  status: 'active' | 'completed';
  startedAt: Date;
  completedAt: Date | null;
}
export interface DiagnosticAttempt {
  questionId: string;
  skillId: string;
  conceptId: string;
  difficultyId: string;
  interactionType: string;
  selectedOptionId: string;
  correct: boolean;
  responseDurationMs: number | null;
  confidence: Confidence | null;
  answeredAt: Date;
}
export type DiagnosticFailureCode =
  | 'PROFILE_INCOMPLETE'
  | 'DIAGNOSTIC_UNAVAILABLE'
  | 'DIAGNOSTIC_NOT_STARTED'
  | 'DIAGNOSTIC_COMPLETED'
  | 'INVALID_DIAGNOSTIC_ANSWER'
  | 'DIAGNOSTIC_ANSWER_CONFLICT'
  | 'DIAGNOSTIC_QUESTION_OUT_OF_ORDER'
  | 'INVALID_DIAGNOSTIC_CONFIDENCE';
export class DiagnosticFailure extends Error {
  constructor(readonly code: DiagnosticFailureCode) {
    super(code);
  }
}
export function nextQuestion(
  definition: DiagnosticDefinition,
  attempts: DiagnosticAttempt[],
): DiagnosticQuestion | undefined {
  return definition.questions.find(
    (question) =>
      !attempts.some((attempt) => attempt.questionId === question.id),
  );
}
export function pendingConfidence(
  definition: DiagnosticDefinition,
  attempts: DiagnosticAttempt[],
): DiagnosticAttempt | undefined {
  return attempts.find(
    (attempt) =>
      attempt.confidence === null &&
      definition.questions.some(
        (question) =>
          question.id === attempt.questionId && question.confidenceRequested,
      ),
  );
}
export function evaluateAnswer(
  question: DiagnosticQuestion,
  selectedOptionId: string,
  duration?: number,
): Omit<DiagnosticAttempt, 'answeredAt'> {
  if (
    !question.options.some((option) => option.id === selectedOptionId) ||
    (duration !== undefined &&
      (!Number.isInteger(duration) || duration < 0 || duration > 86400000))
  ) {
    throw new DiagnosticFailure('INVALID_DIAGNOSTIC_ANSWER');
  }
  return {
    questionId: question.id,
    skillId: question.skill.id,
    conceptId: question.concept.id,
    difficultyId: question.difficulty,
    interactionType: question.interactionType,
    selectedOptionId,
    correct: selectedOptionId === question.correctOptionId,
    responseDurationMs: duration ?? null,
    confidence: null,
  };
}
