import { AppException } from '../../../../platform/http/errors/app-exception.js';
export function authHttpError(code: string, status: number): AppException {
  return new AppException({
    code,
    status,
    title: 'Authentication request failed',
  });
}
