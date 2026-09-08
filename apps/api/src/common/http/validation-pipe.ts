import { ValidationPipe } from '@nestjs/common';
import { AppException } from '../errors/app-exception.js';
import { flattenValidationErrors } from '../errors/flatten-validation-errors.js';

export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors) =>
      new AppException({
        status: 400,
        code: 'VALIDATION_ERROR',
        title: 'Validation failed',
        detail: 'One or more fields failed validation',
        errors: flattenValidationErrors(errors),
      }),
  });
}
