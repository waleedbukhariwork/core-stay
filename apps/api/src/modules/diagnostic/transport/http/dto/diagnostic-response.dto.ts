export interface DiagnosticQuestionDto {
  id: string;
  category: string;
  interactionType: string;
  skill: { id: string; label: string };
  concept: { id: string; label: string };
  prompt: string;
  context: string | null;
  code: string | null;
  options: { id: string; label: string }[];
  confidenceRequested: boolean;
}
export interface DiagnosticReviewDto {
  question: DiagnosticQuestionDto;
  selectedOptionId: string;
  correct: boolean;
  correctOptionId: string;
  explanation: string;
  keyIdea: string;
  confidence: 'guessing' | 'somewhat_sure' | 'very_sure' | null;
}
export interface DiagnosticResponseDto {
  status: 'active' | 'completed';
  diagnosticId: string;
  version: string;
  startedAt: string;
  completedAt: string | null;
  progress: { answered: number; total: number };
  question: DiagnosticQuestionDto | null;
  confidence: {
    question: DiagnosticQuestionDto;
    selectedOptionId: string;
  } | null;
  review: DiagnosticReviewDto | null;
}
