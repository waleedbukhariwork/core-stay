import type { Challenge } from '../../domain/verification-challenge.js';
export interface VerificationRepository {
  findForUpdate(userId: string): Promise<Challenge | undefined>;
  save(challenge: Challenge): Promise<void>;
}
