import { describe, expect, it } from 'vitest';
import { loadAppConfig } from './load-config.js';

const valid = {
  AUTH_JWT_SECRET: process.env.AUTH_JWT_SECRET,
  AUTH_VERIFICATION_SECRET: process.env.AUTH_VERIFICATION_SECRET,
  AUTH_ISSUER: 'test',
  AUTH_AUDIENCE: 'test-mobile',
  AUTH_EMAIL_MODE: 'file',
  APP_ENV: 'local',
  PORT: '4999',
  DATABASE_URL:
    'postgres://codecore:codecore_local_only_not_for_prod@localhost:55432/codecore',
};

describe('loadAppConfig', () => {
  it('returns typed config for valid local env', () => {
    const config = loadAppConfig(valid);
    expect(config.env).toBe('local');
    expect(config.port).toBe(4999);
    expect(config.isLocal).toBe(true);
    expect(config.logLevel).toBe('debug');
  });

  it('fails fast when required values are missing', () => {
    expect(() => loadAppConfig({ APP_ENV: 'production' })).toThrow(
      /Invalid configuration/,
    );
  });

  it('rejects a non-postgres database url', () => {
    expect(() =>
      loadAppConfig({
        ...valid,
        APP_ENV: 'production',
        DATABASE_URL: 'mysql://localhost/codecore',
      }),
    ).toThrow(/postgres/i);
  });
});
