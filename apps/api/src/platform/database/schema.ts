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
  users,
  userStatus,
  passwordCredentials,
  verificationChallenges,
  authSessions,
  refreshTokens,
};
export const schema = {
  users,
  passwordCredentials,
  verificationChallenges,
  authSessions,
  refreshTokens,
};
