export type IdentityFailureCode =
  | 'ACCOUNT_ALREADY_EXISTS'
  | 'REGISTRATION_PENDING'
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_NOT_VERIFIED'
  | 'VERIFICATION_INVALID'
  | 'VERIFICATION_EXPIRED'
  | 'VERIFICATION_ATTEMPTS_EXCEEDED'
  | 'VERIFICATION_RESEND_TOO_SOON'
  | 'SESSION_REVOKED'
  | 'SESSION_EXPIRED'
  | 'REFRESH_TOKEN_INVALID'
  | 'ACCESS_TOKEN_INVALID'
  | 'ACCESS_TOKEN_EXPIRED'
  | 'EMAIL_DELIVERY_UNAVAILABLE';
export class IdentityFailure extends Error {
  constructor(
    readonly code: IdentityFailureCode,
    readonly reason?: 'attempt_limit_reached',
  ) {
    super('Authentication request failed');
    this.name = 'IdentityFailure';
  }
}
export function identityFailure(
  code: IdentityFailureCode,
  reason?: 'attempt_limit_reached',
): IdentityFailure {
  return new IdentityFailure(code, reason);
}
