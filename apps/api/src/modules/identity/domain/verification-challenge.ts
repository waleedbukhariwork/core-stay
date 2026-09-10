export type Challenge = {
  id: string;
  userId: string;
  digest: string;
  expiresAt: Date;
  attempts: number;
  consumedAt: Date | null;
  lastSentAt: Date;
  createdAt: Date;
};
