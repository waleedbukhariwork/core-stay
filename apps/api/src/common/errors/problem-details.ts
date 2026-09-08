import { FieldError } from './field-error.js';

export const PROBLEM_TYPE_BASE = 'https://codecore.dev/problems';

export type ProblemDetails = {
  type: string;
  title: string;
  status: number;
  code: string;
  requestId: string;
  detail?: string;
  errors?: FieldError[];
};

export function problemType(slug: string): string {
  return `${PROBLEM_TYPE_BASE}/${slug}`;
}
