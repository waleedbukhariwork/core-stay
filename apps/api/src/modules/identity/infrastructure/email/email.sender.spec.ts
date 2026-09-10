import { randomBytes } from 'node:crypto';
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadAppConfig } from '../../../../platform/config/load-config.js';
import { AuthConfig } from '../config/auth-config.js';
import { ConfiguredEmailSender } from './email.sender.js';
const config = () =>
  new AuthConfig(
    loadAppConfig({
      APP_ENV: 'production',
      PORT: '4999',
      DATABASE_URL: 'postgres://unused/test',
      AUTH_JWT_SECRET: randomBytes(32).toString('base64'),
      AUTH_VERIFICATION_SECRET: randomBytes(32).toString('base64'),
      AUTH_ISSUER: 'test',
      AUTH_AUDIENCE: 'mobile',
      AUTH_EMAIL_MODE: 'ses',
      AUTH_EMAIL_FROM: 'codecore@example.com',
      AWS_REGION: 'us-east-1',
    }),
  );
describe('SES verification adapter', () => {
  afterEach(() => vi.restoreAllMocks());
  it('sends the code through SES without console output', async () => {
    const send = vi
      .spyOn(SESv2Client.prototype, 'send')
      .mockImplementation(async () => ({ MessageId: 'test' }));
    const log = vi.spyOn(console, 'log');
    const error = vi.spyOn(console, 'error');
    await new ConfiguredEmailSender(config()).sendVerification(
      'engineer@example.com',
      '123456',
    );
    expect(send).toHaveBeenCalledOnce();
    const command = send.mock.calls[0]![0] as SendEmailCommand;
    expect(command.input.Destination).toEqual({
      ToAddresses: ['engineer@example.com'],
    });
    expect(command.input.Content?.Simple?.Body?.Text?.Data).toContain('123456');
    expect(log).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });
  it('maps SES failures without leaking provider messages', async () => {
    vi.spyOn(SESv2Client.prototype, 'send').mockImplementation(async () => {
      throw new Error('secret-provider-details');
    });
    await expect(
      new ConfiguredEmailSender(config()).sendVerification(
        'engineer@example.com',
        '123456',
      ),
    ).rejects.toMatchObject({
      code: 'EMAIL_DELIVERY_UNAVAILABLE',
      message: 'Authentication request failed',
    });
  });
});
