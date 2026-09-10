import type { Session } from '../../domain/session.js';
export interface SessionRepository {
  findOwner(id: string): Promise<{ userId: string } | undefined>;
  findForUpdate(id: string): Promise<Session | undefined>;
  save(session: Session): Promise<void>;
  revoke(userId: string, now: Date, sessionId?: string): Promise<void>;
}
