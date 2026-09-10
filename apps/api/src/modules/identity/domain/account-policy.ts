import type { User } from './user.js';
import { identityFailure } from './identity-failure.js';
export function isActiveVerified(user: User | undefined): user is User {
  return !!user && user.status === 'active' && user.emailVerifiedAt !== null;
}
export function assertLoginAllowed(
  user: User | undefined,
  passwordMatches: boolean,
): asserts user is User {
  if (!passwordMatches || !user || user.status !== 'active')
    throw identityFailure('INVALID_CREDENTIALS');
  if (!user.emailVerifiedAt) throw identityFailure('EMAIL_NOT_VERIFIED');
}
