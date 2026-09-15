import { AppException } from '../../../../platform/http/errors/app-exception.js';
import { DiagnosticFailure } from '../../domain/diagnostic.js';

export function mapDiagnosticFailure(error: unknown): AppException | undefined {
  if (!(error instanceof DiagnosticFailure)) return undefined;
  const status =
    error.code === 'PROFILE_INCOMPLETE'
      ? 403
      : error.code === 'DIAGNOSTIC_UNAVAILABLE'
        ? 503
        : error.code.startsWith('INVALID_')
          ? 400
          : 409;
  return new AppException({
    code: error.code,
    status,
    title: 'Diagnostic request could not be completed',
  });
}
