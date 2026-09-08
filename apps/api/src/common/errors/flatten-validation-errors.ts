import { ValidationError } from 'class-validator';
import { FieldError } from './field-error.js';

export function flattenValidationErrors(
  errors: ValidationError[],
  parent = '',
): FieldError[] {
  const result: FieldError[] = [];
  for (const error of errors) {
    const field = parent ? `${parent}.${error.property}` : error.property;
    if (error.constraints) {
      for (const message of Object.values(error.constraints)) {
        result.push({ field, message });
      }
    }
    if (error.children?.length) {
      result.push(...flattenValidationErrors(error.children, field));
    }
  }
  return result;
}
