import type { Session } from './session.js';
import type { RefreshToken } from './refresh-token.js';
import { identityFailure, type IdentityFailure } from './identity-failure.js';
export function refreshFailure(
  session: Session,
  token: RefreshToken,
  now: Date,
): IdentityFailure | undefined {
  if (session.revokedAt) return identityFailure('SESSION_REVOKED');
  if (session.expiresAt <= now || token.expiresAt <= now)
    return identityFailure('SESSION_EXPIRED');
  return undefined;
}
