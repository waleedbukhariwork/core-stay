export interface CredentialRepository {
  create(userId: string, password: string, now: Date): Promise<void>;
  matches(userId: string | undefined, password: string): Promise<boolean>;
}
