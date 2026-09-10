import type { User } from '../domain/user.js';
export type AuthenticatedSession = {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};
