import { AppException } from '../../../../platform/http/errors/app-exception.js';
import { InvalidPreferences } from '../../domain/profile.js';
export function mapProfileFailure(error: unknown): AppException | undefined {
  if (!(error instanceof InvalidPreferences)) return undefined;
  return new AppException({
    code: 'INVALID_PREFERENCES',
    title: 'Choose valid, compatible preferences',
    status: 400,
  });
}
