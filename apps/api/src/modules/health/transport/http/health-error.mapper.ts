import { AppException } from '../../../../platform/http/errors/app-exception.js';
import { DatabaseUnavailable } from '../../application/database-probe.js';
export function mapHealthFailure(error: unknown): AppException | undefined {
  if (error instanceof DatabaseUnavailable)
    return new AppException({
      status: 503,
      code: 'DATABASE_UNAVAILABLE',
      title: 'Service Unavailable',
      detail: 'Database connectivity check failed',
    });
  return undefined;
}
