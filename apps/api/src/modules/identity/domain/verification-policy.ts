import type { Challenge } from './verification-challenge.js';
import type { User } from './user.js';
import { AUTH_POLICY } from './auth-policy.js';
import { identityFailure, type IdentityFailure } from './identity-failure.js';
export function canVerifyEmail(user: User | undefined): user is User {
  return !!user && !user.emailVerifiedAt && user.status === 'active';
}
export function assertResendAllowed(
  previous: Challenge | undefined,
  now: Date,
): void {
  if (
    previous &&
    now.getTime() - previous.lastSentAt.getTime() <
      AUTH_POLICY.resendSeconds * 1000
  )
    throw identityFailure('VERIFICATION_RESEND_TOO_SOON');
}
export function verificationFailure(
  challenge: Challenge | undefined,
  now: Date,
): IdentityFailure | undefined {
  if (!challenge || challenge.consumedAt)
    return identityFailure('VERIFICATION_INVALID');
  if (challenge.expiresAt <= now)
    return identityFailure('VERIFICATION_EXPIRED');
  if (challenge.attempts >= AUTH_POLICY.verificationAttempts)
    return identityFailure('VERIFICATION_ATTEMPTS_EXCEEDED');
  return undefined;
}
export function rejectVerificationAttempt(challenge: Challenge): {
  challenge: Challenge;
  failure: IdentityFailure;
} {
  const next = { ...challenge, attempts: challenge.attempts + 1 };
  return {
    challenge: next,
    failure:
      next.attempts >= AUTH_POLICY.verificationAttempts
        ? identityFailure(
            'VERIFICATION_ATTEMPTS_EXCEEDED',
            'attempt_limit_reached',
          )
        : identityFailure('VERIFICATION_INVALID'),
  };
}
