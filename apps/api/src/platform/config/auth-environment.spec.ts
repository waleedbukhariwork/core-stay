import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { loadAuthEnvironment } from './auth-environment.js';
const valid = {
  AUTH_JWT_SECRET: randomBytes(32).toString('base64'),
  AUTH_VERIFICATION_SECRET: randomBytes(32).toString('base64'),
  AUTH_ISSUER: 'test',
  AUTH_AUDIENCE: 'mobile',
  AUTH_EMAIL_MODE: 'ses',
  AUTH_EMAIL_FROM: 'codecore@example.com',
  AWS_REGION: 'us-east-1',
};
describe('Auth environment', () => {
  it('accepts explicit independent keys and production SES config', () => {
    expect(loadAuthEnvironment(valid, 'production').emailMode).toBe('ses');
  });
  it.each(['production', 'staging', 'dev'])(
    'cannot expose local email codes in %s',
    (env) => {
      expect(() =>
        loadAuthEnvironment({ ...valid, AUTH_EMAIL_MODE: 'file' }, env),
      ).toThrow(/SES/);
    },
  );
  it.each([
    'AUTH_JWT_SECRET',
    'AUTH_VERIFICATION_SECRET',
    'AUTH_ISSUER',
    'AUTH_AUDIENCE',
    'AUTH_EMAIL_FROM',
    'AWS_REGION',
  ])('requires %s', (key) => {
    expect(() =>
      loadAuthEnvironment({ ...valid, [key]: '' }, 'production'),
    ).toThrow(/Invalid configuration/);
  });
  it('rejects short and reused keys', () => {
    expect(() =>
      loadAuthEnvironment({ ...valid, AUTH_JWT_SECRET: 'short' }, 'production'),
    ).toThrow();
    expect(() =>
      loadAuthEnvironment(
        { ...valid, AUTH_VERIFICATION_SECRET: valid.AUTH_JWT_SECRET },
        'production',
      ),
    ).toThrow();
  });
});
