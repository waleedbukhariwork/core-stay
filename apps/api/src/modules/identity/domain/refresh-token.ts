export type RefreshToken = {
  id: string;
  sessionId: string;
  tokenHash: string;
  expiresAt: Date;
  consumedAt: Date | null;
  replacedByTokenId: string | null;
  createdAt: Date;
};
