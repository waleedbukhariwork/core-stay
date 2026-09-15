import { engineeringProfiles } from '../../modules/profile/infrastructure/persistence/profile.schema.js';
import {
  diagnosticSessions,
  diagnosticAttempts,
} from '../../modules/diagnostic/infrastructure/persistence/diagnostic.schema.js';
import {
  users,
  userStatus,
} from '../../modules/identity/infrastructure/persistence/users.schema.js';
import {
  passwordCredentials,
  verificationChallenges,
  authSessions,
  refreshTokens,
} from '../../modules/identity/infrastructure/persistence/auth.schema.js';
export {
  diagnosticSessions,
  diagnosticAttempts,
  engineeringProfiles,
  users,
  userStatus,
  passwordCredentials,
  verificationChallenges,
  authSessions,
  refreshTokens,
};
export const schema = {
  diagnosticSessions,
  diagnosticAttempts,
  engineeringProfiles,
  users,
  passwordCredentials,
  verificationChallenges,
  authSessions,
  refreshTokens,
};
