export abstract class VerificationCodes {
  abstract generate(): { id: string; code: string; digest: string };
  abstract matches(id: string, digest: string, code: string): boolean;
}
