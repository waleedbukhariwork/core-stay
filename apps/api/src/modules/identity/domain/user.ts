export type User = {
  id: string;
  email: string;
  emailNormalized: string;
  emailVerifiedAt: Date | null;
  status: 'active' | 'disabled';
};
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
