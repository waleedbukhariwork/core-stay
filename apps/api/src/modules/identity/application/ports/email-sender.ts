export abstract class EmailSender {
  abstract sendVerification(email: string, code: string): Promise<void>;
}
