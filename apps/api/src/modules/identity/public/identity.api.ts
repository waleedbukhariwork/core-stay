export type AuthenticatedActor = Readonly<{
  kind: 'user';
  userId: string;
  sessionId: string;
}>;
export abstract class IdentityApi {
  abstract authenticate(accessToken: string): Promise<AuthenticatedActor>;
  abstract assertActiveVerified(actor: AuthenticatedActor): Promise<void>;
  abstract assertAuthenticated(actor: AuthenticatedActor): void;
}
