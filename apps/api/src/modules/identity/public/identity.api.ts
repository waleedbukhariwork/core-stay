export type AuthenticatedActor = Readonly<{
  kind: 'user';
  userId: string;
  sessionId: string;
}>;
export abstract class IdentityApi {
  abstract authenticate(accessToken: string): Promise<AuthenticatedActor>;
  abstract assertAuthenticated(actor: AuthenticatedActor): void;
}
