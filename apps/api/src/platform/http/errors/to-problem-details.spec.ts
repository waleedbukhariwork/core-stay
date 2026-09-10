import { HttpException, HttpStatus } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { AppException } from './app-exception.js';
import { toProblemDetails } from './to-problem-details.js';

describe('toProblemDetails', () => {
  it('maps AppException including field errors', () => {
    const problem = toProblemDetails(
      new AppException({
        status: 400,
        code: 'VALIDATION_ERROR',
        title: 'Validation failed',
        detail: 'One or more fields failed validation',
        errors: [{ field: 'name', message: 'must be a string' }],
      }),
      'req-1',
    );

    expect(problem).toMatchObject({
      type: 'https://codecore.dev/problems/validation-error',
      title: 'Validation failed',
      status: 400,
      code: 'VALIDATION_ERROR',
      requestId: 'req-1',
      detail: 'One or more fields failed validation',
      errors: [{ field: 'name', message: 'must be a string' }],
    });
  });

  it('does not expose stack traces or internals for unknown errors', () => {
    const error = new Error('relation "users" does not exist');
    const problem = toProblemDetails(error, 'req-2');
    const serialized = JSON.stringify(problem);

    expect(problem.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(problem.code).toBe('INTERNAL_ERROR');
    expect(serialized).not.toContain('stack');
    expect(serialized).not.toContain('relation');
    expect(serialized).not.toContain(error.message);
  });

  it('maps HttpException without leaking the original body', () => {
    const problem = toProblemDetails(
      new HttpException('secret-internal', HttpStatus.NOT_FOUND),
      'req-3',
    );
    expect(problem.status).toBe(404);
    expect(problem.code).toBe('NOT_FOUND');
    expect(JSON.stringify(problem)).not.toContain('secret-internal');
  });
});
