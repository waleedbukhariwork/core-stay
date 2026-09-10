import { Injectable } from '@nestjs/common';
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { AuthConfig } from '../config/auth-config.js';
import { EmailSender } from '../../application/ports/email-sender.js';
import { identityFailure } from '../../domain/identity-failure.js';
@Injectable()
export class ConfiguredEmailSender extends EmailSender {
  private readonly ses: SESv2Client;
  constructor(private readonly config: AuthConfig) {
    super();
    this.ses = new SESv2Client({ region: config.awsRegion, maxAttempts: 2 });
  }
  async sendVerification(email: string, code: string): Promise<void> {
    try {
      if (this.config.emailMode === 'file') {
        await mkdir(this.config.inbox, { recursive: true, mode: 0o700 });
        await writeFile(
          join(this.config.inbox, `${randomUUID()}.json`),
          JSON.stringify({ email, code }),
          { mode: 0o600, flag: 'wx' },
        );
        return;
      }
      await this.ses.send(
        new SendEmailCommand({
          FromEmailAddress: this.config.emailFrom,
          Destination: { ToAddresses: [email] },
          Content: {
            Simple: {
              Subject: { Data: 'Verify your CodeCore email' },
              Body: {
                Text: {
                  Data: `Your CodeCore verification code is ${code}. It expires in 10 minutes. If you did not request this, ignore this email.`,
                },
              },
            },
          },
        }),
        { abortSignal: AbortSignal.timeout(8000) },
      );
    } catch {
      throw identityFailure('EMAIL_DELIVERY_UNAVAILABLE');
    }
  }
}
