import type { RefreshToken } from '../../domain/refresh-token.js';
export interface RefreshTokenRepository {
  findByHash(hash: string): Promise<RefreshToken | undefined>;
  save(token: RefreshToken): Promise<void>;
}
