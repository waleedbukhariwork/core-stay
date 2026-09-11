import { engineeringProfiles } from '../../modules/profile/infrastructure/persistence/profile.schema.js';
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
  engineeringProfiles,
  users,
  userStatus,
  passwordCredentials,
  verificationChallenges,
  authSessions,
  refreshTokens,
};
export const schema = {
  engineeringProfiles,
  users,
  passwordCredentials,
  verificationChallenges,
  authSessions,
  refreshTokens,
};
