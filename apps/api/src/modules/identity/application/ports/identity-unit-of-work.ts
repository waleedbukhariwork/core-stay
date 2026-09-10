import type { AccountRepository } from './account.repository.js';
import type { CredentialRepository } from './credential.repository.js';
import type { VerificationRepository } from './verification.repository.js';
import type { SessionRepository } from './session.repository.js';
import type { RefreshTokenRepository } from './refresh-token.repository.js';
export interface IdentityTransaction {
  accounts: AccountRepository;
  credentials: CredentialRepository;
  verification: VerificationRepository;
  sessions: SessionRepository;
  refreshTokens: RefreshTokenRepository;
}
export abstract class IdentityUnitOfWork {
  abstract transaction<T>(
    work: (tx: IdentityTransaction) => Promise<T>,
  ): Promise<T>;
}
