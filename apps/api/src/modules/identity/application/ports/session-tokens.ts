export type VerifiedAccessToken = {
  userId: string;
  sessionId: string;
  expiresAt: number;
};
export abstract class SessionTokens {
  abstract newId(): string;
  abstract refresh(): { id: string; raw: string; hash: string };
  abstract digest(raw: string): string;
  abstract access(userId: string, sessionId: string): Promise<string>;
  abstract verify(raw: string): Promise<VerifiedAccessToken>;
}
