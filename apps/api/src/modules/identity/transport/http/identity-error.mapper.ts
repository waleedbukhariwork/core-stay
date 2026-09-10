import { AppException } from '../../../../platform/http/errors/app-exception.js';
import {
  IdentityFailure,
  type IdentityFailureCode,
} from '../../domain/identity-failure.js';
const statuses: Record<IdentityFailureCode, number> = {
  ACCOUNT_ALREADY_EXISTS: 409,
  REGISTRATION_PENDING: 409,
  INVALID_CREDENTIALS: 401,
  EMAIL_NOT_VERIFIED: 403,
  VERIFICATION_INVALID: 400,
  VERIFICATION_EXPIRED: 400,
  VERIFICATION_ATTEMPTS_EXCEEDED: 429,
  VERIFICATION_RESEND_TOO_SOON: 429,
  SESSION_REVOKED: 401,
  SESSION_EXPIRED: 401,
  REFRESH_TOKEN_INVALID: 401,
  ACCESS_TOKEN_INVALID: 401,
  ACCESS_TOKEN_EXPIRED: 401,
  EMAIL_DELIVERY_UNAVAILABLE: 503,
};
export function mapIdentityFailure(error: unknown): AppException | undefined {
  if (!(error instanceof IdentityFailure)) return undefined;
  return new AppException({
    code: error.code,
    title: 'Authentication request failed',
    status:
      error.reason === 'attempt_limit_reached' ? 400 : statuses[error.code],
  });
}
