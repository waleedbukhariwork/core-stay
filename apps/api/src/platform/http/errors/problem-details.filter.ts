import {
  APPLICATION_ERROR_MAPPERS,
  type ApplicationErrorMapper,
} from './application-error-mapper.js';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
  Inject,
  Optional,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { toProblemDetails } from './to-problem-details.js';

type RequestWithId = Request & { id?: string };

function requestIdFrom(request: RequestWithId): string | undefined {
  if (typeof request.id === 'string' && request.id.length > 0) {
    return request.id;
  }
  const header = request.headers['x-request-id'];
  return typeof header === 'string' ? header : undefined;
}

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  constructor(
    @Optional()
    @Inject(APPLICATION_ERROR_MAPPERS)
    private readonly mappers: ApplicationErrorMapper[] = [],
  ) {}

  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const request = http.getRequest<RequestWithId>();
    const translated =
      this.mappers
        .map((mapper) => mapper(exception))
        .find((mapped) => mapped !== undefined) ?? exception;
    const problem = toProblemDetails(translated, requestIdFrom(request));

    if (problem.status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error({
        requestId: problem.requestId,
        code: problem.code,
        name: translated instanceof Error ? translated.name : 'unknown',
      });
    }

    response
      .status(problem.status)
      .type('application/problem+json')
      .json(problem);
  }
}
