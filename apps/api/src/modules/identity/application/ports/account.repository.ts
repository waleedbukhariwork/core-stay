import type { User } from '../../domain/user.js';
export interface AccountRepository {
  findByEmailForUpdate(email: string): Promise<User | undefined>;
  findByIdForUpdate(id: string): Promise<User | undefined>;
  create(email: string, now: Date): Promise<User>;
  markEmailVerified(id: string, now: Date): Promise<User>;
}
