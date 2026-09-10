import { HttpException, HttpStatus } from '@nestjs/common';
import { AppException } from './app-exception.js';
import { ProblemDetails, problemType } from './problem-details.js';

function slugForCode(code: string): string {
  return code.toLowerCase().replaceAll('_', '-');
}

function requestIdOf(requestId: string | undefined): string {
  return requestId && requestId.length > 0 ? requestId : 'unknown';
}

export function toProblemDetails(
  exception: unknown,
  requestId?: string,
): ProblemDetails {
  const id = requestIdOf(requestId);

  if (exception instanceof AppException) {
    return {
      type: problemType(slugForCode(exception.code)),
      title: exception.title,
      status: exception.getStatus(),
      code: exception.code,
      requestId: id,
      ...(exception.safeDetail ? { detail: exception.safeDetail } : {}),
      ...(exception.fieldErrors?.length
        ? { errors: exception.fieldErrors }
        : {}),
    };
  }

  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    const code = status === HttpStatus.NOT_FOUND ? 'NOT_FOUND' : 'HTTP_ERROR';
    const title =
      status === HttpStatus.NOT_FOUND ? 'Not Found' : 'Request failed';
    return {
      type: problemType(slugForCode(code)),
      title,
      status,
      code,
      requestId: id,
    };
  }

  return {
    type: problemType('internal'),
    title: 'Internal Server Error',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    code: 'INTERNAL_ERROR',
    requestId: id,
  };
}
