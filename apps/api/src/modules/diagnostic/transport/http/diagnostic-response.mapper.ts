import type { DiagnosticResult } from '../../application/diagnostic.service.js';
import type { DiagnosticQuestion } from '../../domain/diagnostic.js';
import type {
  DiagnosticQuestionDto,
  DiagnosticResponseDto,
} from './dto/diagnostic-response.dto.js';

function mapQuestion(question: DiagnosticQuestion): DiagnosticQuestionDto {
  return {
    id: question.id,
    category: question.category,
    interactionType: question.interactionType,
    skill: { id: question.skill.id, label: question.skill.label },
    concept: { id: question.concept.id, label: question.concept.label },
    prompt: question.prompt,
    context: question.context,
    code: question.code,
    options: question.options.map((option) => ({
      id: option.id,
      label: option.label,
    })),
    confidenceRequested: question.confidenceRequested,
  };
}
export function mapDiagnostic(
  result: DiagnosticResult | null,
): DiagnosticResponseDto | null {
  if (!result) return null;
  const { session, review } = result;
  return {
    status: session.status,
    diagnosticId: session.diagnosticId,
    version: session.definitionVersion,
    startedAt: session.startedAt.toISOString(),
    completedAt: session.completedAt?.toISOString() ?? null,
    progress: {
      answered: result.answeredQuestions,
      total: result.totalQuestions,
    },
    question: result.question ? mapQuestion(result.question) : null,
    confidence: result.confidenceQuestion
      ? {
          question: mapQuestion(result.confidenceQuestion),
          selectedOptionId: result.confidenceAnswer!,
        }
      : null,
    review: review
      ? {
          question: mapQuestion(review.question),
          selectedOptionId: review.attempt.selectedOptionId,
          correct: review.attempt.correct,
          correctOptionId: review.question.correctOptionId,
          explanation: review.question.explanation,
          keyIdea: review.question.keyIdea,
          confidence: review.attempt.confidence,
        }
      : null,
  };
}
