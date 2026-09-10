import { randomUUID } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Pool, type PoolClient } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import request from 'supertest';
import {
  beforeAll,
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { AppModule } from '../src/app.module.js';
import { PG_POOL } from '../src/platform/database/database.tokens.js';
import { applyHttpGlobals } from '../src/platform/http/http.module.js';
import { Clock } from '../src/modules/identity/application/ports/clock.js';
import { EmailSender } from '../src/modules/identity/application/ports/email-sender.js';
import { AuthService } from '../src/modules/identity/application/auth.service.js';
import { EmailVerificationService } from '../src/modules/identity/application/email-verification.service.js';
import { SessionService } from '../src/modules/identity/application/session.service.js';
import { SessionTokens } from '../src/modules/identity/application/ports/session-tokens.js';
import { IdentityApi } from '../src/modules/identity/public/identity.api.js';
import { AUTH_POLICY } from '../src/modules/identity/domain/auth-policy.js';
import { identityFailure } from '../src/modules/identity/domain/identity-failure.js';

// Creates and drops ONLY a uniquely named database owned by this test run.
describe('Auth with real PostgreSQL and HTTP', () => {
  let app: INestApplication;
  let admin: Pool;
  let pool: Pool;
  let auth: AuthService;
  let verification: EmailVerificationService;
  let sessions: SessionService;
  let tokens: SessionTokens;
  const database = `codecore_auth_test_${randomUUID().replaceAll('-', '')}`;
  let created = false;
  let now = new Date('2026-09-01T12:00:00Z');
  const clock = { now: () => new Date(now) };
  const emails: { email: string; code: string }[] = [];
  let failEmail = false;
  const sender = {
    sendVerification: async (email: string, code: string) => {
      if (failEmail) throw identityFailure('EMAIL_DELIVERY_UNAVAILABLE');
      emails.push({ email, code });
    },
  };
  const email = 'Engineer+phase2@Example.com';
  const password = 'a safe long passphrase';
  const post = (path: string, body: object) =>
    request(app.getHttpServer()).post(`/api/v1/auth/${path}`).send(body);
  const advance = (seconds: number) => {
    now = new Date(now.getTime() + seconds * 1000);
  };
  const register = () => auth.register(email, password);
  const verified = async () => {
    await register();
    return verification.verify(email, emails.at(-1)!.code);
  };
  beforeAll(async () => {
    const url = process.env.TEST_DATABASE_URL;
    if (!url)
      throw new Error(
        'TEST_DATABASE_URL is required; use local/CI PostgreSQL with CREATEDB permission',
      );
    admin = new Pool({ connectionString: url });
    await admin.query(`CREATE DATABASE "${database}"`);
    created = true;
    const testUrl = new URL(url);
    testUrl.pathname = `/${database}`;
    pool = new Pool({ connectionString: testUrl.toString(), max: 10 });
    const db = drizzle(pool);
    await migrate(db, { migrationsFolder: './drizzle' });
    await migrate(db, { migrationsFolder: './drizzle' });
    const fixture = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PG_POOL)
      .useValue(pool)
      .overrideProvider(Clock)
      .useValue(clock)
      .overrideProvider(EmailSender)
      .useValue(sender)
      .compile();
    app = fixture.createNestApplication();
    applyHttpGlobals(app);
    await app.init();
    auth = app.get(AuthService);
    verification = app.get(EmailVerificationService);
    sessions = app.get(SessionService);
    tokens = app.get(SessionTokens);
  });
  beforeEach(async () => {
    await pool.query('TRUNCATE users CASCADE');
    emails.length = 0;
    failEmail = false;
    advance(86400);
  });
  afterAll(async () => {
    if (app) await app.close();
    else if (pool) await pool.end();
    if (created) await admin.query(`DROP DATABASE "${database}"`);
    if (admin) await admin.end();
  });
  it('applies the reviewed migration once and creates five tables', async () => {
    const rows = await pool.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public'",
    );
    expect(rows.rows).toHaveLength(5);
    expect(
      (await pool.query('SELECT * FROM drizzle.__drizzle_migrations')).rows,
    ).toHaveLength(1);
  });
  it('registers transactionally with canonical email and Argon2id only', async () => {
    const response = await post('register', {
      email: `  ${email}  `,
      password,
    });
    expect(response.status).toBe(202);
    expect(response.body.data).toEqual({
      status: 'awaitingEmailVerification',
      resendAfter: 60,
      expiresIn: 600,
    });
    expect(response.headers['cache-control']).toBe('no-store');
    const user = (await pool.query('SELECT * FROM users')).rows[0];
    expect(user.email).toBe(email);
    expect(user.email_normalized).toBe(email.toLowerCase());
    const credential = (await pool.query('SELECT * FROM password_credentials'))
      .rows[0];
    expect(credential.password_hash).toMatch(/^\$argon2id\$v=19\$/);
    expect(credential.password_hash.split('$')[3].split(',').sort()).toEqual([
      'm=65536',
      'p=1',
      't=3',
    ]);
    expect(JSON.stringify(credential)).not.toContain(password);
    const challenge = (
      await pool.query('SELECT * FROM email_verification_challenges')
    ).rows[0];
    expect(challenge.digest).toMatch(/^[a-f0-9]{64}$/);
    expect(challenge.digest).not.toBe(emails[0]!.code);
    expect(emails[0]!.code).toMatch(/^\d{6}$/);
  });
  it('rejects repeated pending registration without replacing password', async () => {
    await register();
    await expect(
      auth.register(email.toLowerCase(), 'different long password'),
    ).rejects.toMatchObject({ code: 'ACCOUNT_ALREADY_EXISTS' });
    await expect(
      auth.register(email.toLowerCase(), password),
    ).rejects.toMatchObject({ code: 'REGISTRATION_PENDING' });
    await verification.verify(email, emails[0]!.code);
    await expect(auth.login(email, password)).resolves.toHaveProperty(
      'accessToken',
    );
  });
  it('rejects duplicate verified account deliberately', async () => {
    await verified();
    await expect(register()).rejects.toMatchObject({
      code: 'ACCOUNT_ALREADY_EXISTS',
    });
  });
  it('serializes duplicate registration races with database uniqueness', async () => {
    const results = await Promise.allSettled([register(), register()]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const rejected = results.find(
      (r) => r.status === 'rejected',
    ) as PromiseRejectedResult;
    expect(['ACCOUNT_ALREADY_EXISTS', 'REGISTRATION_PENDING']).toContain(
      rejected.reason.code,
    );
    for (const table of [
      'users',
      'password_credentials',
      'email_verification_challenges',
    ])
      expect((await pool.query(`SELECT * FROM ${table}`)).rows).toHaveLength(1);
    expect(emails).toHaveLength(1);
  });
  it('rolls back user, credentials and challenge when email fails', async () => {
    failEmail = true;
    await expect(register()).rejects.toMatchObject({
      code: 'EMAIL_DELIVERY_UNAVAILABLE',
    });
    for (const table of [
      'users',
      'password_credentials',
      'email_verification_challenges',
    ])
      expect((await pool.query(`SELECT * FROM ${table}`)).rows).toHaveLength(0);
  });
  it('rolls back all registration writes when challenge persistence fails', async () => {
    await pool.query(
      'ALTER TABLE email_verification_challenges ADD CONSTRAINT test_failure CHECK (false)',
    );
    try {
      await expect(register()).rejects.toThrow();
      expect((await pool.query('SELECT * FROM users')).rows).toHaveLength(0);
    } finally {
      await pool.query(
        'ALTER TABLE email_verification_challenges DROP CONSTRAINT test_failure',
      );
    }
    expect(emails).toHaveLength(0);
  });
  it('verifies once and creates a session with a safe response and /me', async () => {
    await register();
    const result = await post('email-verification/verify', {
      email,
      code: emails[0]!.code,
    });
    expect(result.status).toBe(200);
    expect(Object.keys(result.body.data).sort()).toEqual([
      'accessToken',
      'expiresIn',
      'refreshToken',
      'user',
    ]);
    expect(Object.keys(result.body.data.user).sort()).toEqual([
      'email',
      'emailVerified',
      'id',
      'status',
    ]);
    expect(result.body.data.user.emailVerified).toBe(true);
    const me = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .auth(result.body.data.accessToken, { type: 'bearer' });
    expect(me.status).toBe(200);
    expect(me.body.data).toEqual(result.body.data.user);
    await expect(
      verification.verify(email, emails[0]!.code),
    ).rejects.toMatchObject({ code: 'VERIFICATION_INVALID' });
    expect((await pool.query('SELECT * FROM auth_sessions')).rows).toHaveLength(
      1,
    );
  });
  it('commits incorrect attempts and locks challenge after five guesses', async () => {
    await register();
    const wrong = emails[0]!.code === '000000' ? '111111' : '000000';
    for (let i = 1; i <= 5; i++)
      await expect(verification.verify(email, wrong)).rejects.toMatchObject({
        code:
          i === 5 ? 'VERIFICATION_ATTEMPTS_EXCEEDED' : 'VERIFICATION_INVALID',
      });
    await expect(
      verification.verify(email, emails[0]!.code),
    ).rejects.toMatchObject({ code: 'VERIFICATION_ATTEMPTS_EXCEEDED' });
    expect(
      (await pool.query('SELECT attempts FROM email_verification_challenges'))
        .rows[0].attempts,
    ).toBe(5);
  });
  it('enforces code expiration using controlled time', async () => {
    await register();
    advance(AUTH_POLICY.verificationSeconds);
    await expect(
      verification.verify(email, emails[0]!.code),
    ).rejects.toMatchObject({ code: 'VERIFICATION_EXPIRED' });
  });
  it('double verification creates exactly one session', async () => {
    await register();
    const results = await Promise.allSettled([
      verification.verify(email, emails[0]!.code),
      verification.verify(email, emails[0]!.code),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect((await pool.query('SELECT * FROM auth_sessions')).rows).toHaveLength(
      1,
    );
  });
  it('enforces resend cooldown and serializes concurrent resends', async () => {
    await register();
    await expect(verification.resend(email)).rejects.toMatchObject({
      code: 'VERIFICATION_RESEND_TOO_SOON',
    });
    const oldDigest = (
      await pool.query('SELECT digest FROM email_verification_challenges')
    ).rows[0].digest;
    advance(60);
    const results = await Promise.allSettled([
      verification.resend(email),
      verification.resend(email),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(emails).toHaveLength(2);
    expect(
      (await pool.query('SELECT digest FROM email_verification_challenges'))
        .rows[0].digest,
    ).not.toBe(oldDigest);
    await expect(
      verification.verify(email, emails[1]!.code),
    ).resolves.toHaveProperty('accessToken');
  });
  it('failed resend preserves the previous valid challenge', async () => {
    await register();
    advance(60);
    failEmail = true;
    await expect(verification.resend(email)).rejects.toMatchObject({
      code: 'EMAIL_DELIVERY_UNAVAILABLE',
    });
    await expect(
      verification.verify(email, emails[0]!.code),
    ).resolves.toHaveProperty('accessToken');
  });
  it('unknown/verified resend does not expose identity', async () => {
    const unknown = await post('email-verification/resend', { email });
    await verified();
    const known = await post('email-verification/resend', { email });
    expect(unknown.status).toBe(202);
    expect(known.body).toEqual(unknown.body);
  });
  it('requires verified credentials and gives generic credential failures', async () => {
    await register();
    await expect(auth.login(email, password)).rejects.toMatchObject({
      code: 'EMAIL_NOT_VERIFIED',
    });
    const wrong = await post('login', { email, password: 'wrong password' });
    const unknown = await post('login', {
      email: 'unknown@example.com',
      password: 'wrong password',
    });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(unknown.body).toEqual(wrong.body);
    expect(wrong.body.code).toBe('INVALID_CREDENTIALS');
  });
  it('verified login creates separate sessions; disabled identities cannot login or refresh', async () => {
    const first = await verified();
    const second = await auth.login(email.toLowerCase(), password);
    expect(second.refreshToken).not.toBe(first.refreshToken);
    await pool.query("UPDATE users SET status='disabled'");
    await expect(auth.login(email, password)).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
    });
    await expect(sessions.refresh(second.refreshToken)).rejects.toMatchObject({
      code: 'SESSION_REVOKED',
    });
  });
  it('rotates refresh tokens atomically and persists only hashes', async () => {
    const first = await verified();
    const next = await sessions.refresh(first.refreshToken);
    expect(next.refreshToken).not.toBe(first.refreshToken);
    expect(next.refreshToken).toMatch(/^[\w-]{43}$/);
    const rows = (
      await pool.query(
        'SELECT * FROM refresh_tokens ORDER BY consumed_at NULLS LAST',
      )
    ).rows;
    expect(rows).toHaveLength(2);
    expect(rows[0].consumed_at).not.toBeNull();
    expect(rows[0].replaced_by_token_id).toBe(rows[1].id);
    expect(JSON.stringify(rows)).not.toContain(first.refreshToken);
    expect(JSON.stringify(rows)).not.toContain(next.refreshToken);
  });
  it('reuse revokes the family while leaving other sessions usable', async () => {
    const first = await verified();
    const other = await auth.login(email, password);
    const next = await sessions.refresh(first.refreshToken);
    await expect(sessions.refresh(first.refreshToken)).rejects.toMatchObject({
      code: 'SESSION_REVOKED',
    });
    await expect(sessions.refresh(next.refreshToken)).rejects.toMatchObject({
      code: 'SESSION_REVOKED',
    });
    await expect(sessions.refresh(other.refreshToken)).resolves.toHaveProperty(
      'accessToken',
    );
  });
  it('concurrent refresh has one winner and revokes its family on reuse', async () => {
    const initial = await verified();
    const results = await Promise.allSettled([
      sessions.refresh(initial.refreshToken),
      sessions.refresh(initial.refreshToken),
    ]);
    const winners = results.filter((r) => r.status === 'fulfilled');
    expect(winners).toHaveLength(1);
    await expect(
      sessions.refresh(winners[0]!.value.refreshToken),
    ).rejects.toMatchObject({ code: 'SESSION_REVOKED' });
  });
  it('rejects expired, unknown and revoked refresh tokens', async () => {
    const initial = await verified();
    advance(AUTH_POLICY.sessionSeconds);
    await expect(sessions.refresh(initial.refreshToken)).rejects.toMatchObject({
      code: 'SESSION_EXPIRED',
    });
    await expect(sessions.refresh('a'.repeat(43))).rejects.toMatchObject({
      code: 'REFRESH_TOKEN_INVALID',
    });
  });
  it('logout revokes current session and logout-all revokes remaining sessions', async () => {
    const first = await verified();
    const second = await auth.login(email, password);
    const logout = await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .auth(first.accessToken, { type: 'bearer' });
    expect(logout.status).toBe(204);
    await expect(sessions.refresh(first.refreshToken)).rejects.toMatchObject({
      code: 'SESSION_REVOKED',
    });
    const all = await request(app.getHttpServer())
      .post('/api/v1/auth/logout-all')
      .auth(second.accessToken, { type: 'bearer' });
    expect(all.status).toBe(204);
    await expect(sessions.refresh(second.refreshToken)).rejects.toMatchObject({
      code: 'SESSION_REVOKED',
    });
    expect(
      (
        await request(app.getHttpServer())
          .get('/api/v1/auth/me')
          .auth(second.accessToken, { type: 'bearer' })
      ).body.code,
    ).toBe('SESSION_REVOKED');
  });
  it('refresh racing logout-all cannot leave a live pre-existing session', async () => {
    const initial = await verified();
    const principal = await app
      .get(IdentityApi)
      .authenticate(initial.accessToken);
    const results = await Promise.allSettled([
      sessions.refresh(initial.refreshToken),
      sessions.logout(principal, true),
    ]);
    expect(results[1].status).toBe('fulfilled');
    expect(
      (await pool.query('SELECT * FROM auth_sessions WHERE revoked_at IS NULL'))
        .rows,
    ).toHaveLength(0);
  });
  it('rejects extra properties and malformed DTOs without leaking secrets', async () => {
    for (const body of [
      { email, password, admin: true },
      { email, password: 'short' },
      { email, password: 'x'.repeat(129) },
      { email: 'bad', password },
    ]) {
      const response = await post('register', body);
      expect(response.status).toBe(400);
      expect(response.headers['content-type']).toContain(
        'application/problem+json',
      );
      expect(JSON.stringify(response.body)).not.toContain(password);
    }
    expect(
      (await post('email-verification/verify', { email, code: 'abc123' }))
        .status,
    ).toBe(400);
    expect((await post('refresh', { refreshToken: 'short' })).status).toBe(400);
  });
  it('guard rejects missing, invalid and expired access tokens', async () => {
    expect(
      (await request(app.getHttpServer()).get('/api/v1/auth/me')).status,
    ).toBe(401);
    expect(
      (
        await request(app.getHttpServer())
          .get('/api/v1/auth/me')
          .auth('invalid', { type: 'bearer' })
      ).body.code,
    ).toBe('ACCESS_TOKEN_INVALID');
    const initial = await verified();
    advance(AUTH_POLICY.accessSeconds);
    expect(
      (
        await request(app.getHttpServer())
          .get('/api/v1/auth/me')
          .auth(initial.accessToken, { type: 'bearer' })
      ).body.code,
    ).toBe('ACCESS_TOKEN_EXPIRED');
  });
  it('failed session creation rolls back verification consumption and identity update', async () => {
    await register();
    await pool.query(
      'ALTER TABLE auth_sessions ADD CONSTRAINT test_failure CHECK (false)',
    );
    try {
      await expect(
        verification.verify(email, emails[0]!.code),
      ).rejects.toThrow();
      expect(
        (
          await pool.query(
            'SELECT consumed_at FROM email_verification_challenges',
          )
        ).rows[0].consumed_at,
      ).toBeNull();
      expect(
        (await pool.query('SELECT email_verified_at FROM users')).rows[0]
          .email_verified_at,
      ).toBeNull();
    } finally {
      await pool.query(
        'ALTER TABLE auth_sessions DROP CONSTRAINT test_failure',
      );
    }
    await expect(
      verification.verify(email, emails[0]!.code),
    ).resolves.toHaveProperty('accessToken');
  });
  it('failed refresh persistence leaves the original token usable', async () => {
    const first = await verified();
    const id = (await pool.query('SELECT id FROM refresh_tokens')).rows[0].id;
    await pool.query(
      `ALTER TABLE refresh_tokens ADD CONSTRAINT test_failure CHECK (id = '${id}')`,
    );
    try {
      await expect(sessions.refresh(first.refreshToken)).rejects.toThrow();
    } finally {
      await pool.query(
        'ALTER TABLE refresh_tokens DROP CONSTRAINT test_failure',
      );
    }
    await expect(sessions.refresh(first.refreshToken)).resolves.toHaveProperty(
      'accessToken',
    );
  });
  it('completes registration, verification, expired access refresh, login and logout over HTTP', async () => {
    expect((await post('register', { email, password })).status).toBe(202);
    const verified = await post('email-verification/verify', {
      email,
      code: emails[0]!.code,
    });
    expect(verified.status).toBe(200);
    advance(AUTH_POLICY.accessSeconds);
    expect(
      (
        await request(app.getHttpServer())
          .get('/api/v1/auth/me')
          .auth(verified.body.data.accessToken, { type: 'bearer' })
      ).body.code,
    ).toBe('ACCESS_TOKEN_EXPIRED');
    const refreshed = await post('refresh', {
      refreshToken: verified.body.data.refreshToken,
    });
    expect(refreshed.status).toBe(200);
    expect(refreshed.body.data.refreshToken).not.toBe(
      verified.body.data.refreshToken,
    );
    expect(
      (
        await request(app.getHttpServer())
          .get('/api/v1/auth/me')
          .auth(refreshed.body.data.accessToken, { type: 'bearer' })
      ).body.data,
    ).toEqual(verified.body.data.user);
    const login = await post('login', { email, password });
    expect(login.status).toBe(200);
    expect(
      (
        await request(app.getHttpServer())
          .post('/api/v1/auth/logout-all')
          .auth(login.body.data.accessToken, { type: 'bearer' })
      ).status,
    ).toBe(204);
    expect(
      (
        await post('refresh', {
          refreshToken: refreshed.body.data.refreshToken,
        })
      ).body.code,
    ).toBe('SESSION_REVOKED');
  });
  it('preserves exact verification error statuses and headers', async () => {
    await register();
    const wrong = emails[0]!.code === '000000' ? '111111' : '000000';
    for (let attempt = 1; attempt <= 5; attempt++) {
      const response = await post('email-verification/verify', {
        email,
        code: wrong,
      });
      expect(response.status).toBe(400);
      expect(response.headers['cache-control']).toBe('no-store');
      expect(response.headers['content-type']).toContain(
        'application/problem+json',
      );
      expect(response.body).toEqual({
        type: `https://codecore.dev/problems/${attempt === 5 ? 'verification-attempts-exceeded' : 'verification-invalid'}`,
        title: 'Authentication request failed',
        status: 400,
        code:
          attempt === 5
            ? 'VERIFICATION_ATTEMPTS_EXCEEDED'
            : 'VERIFICATION_INVALID',
        requestId: 'unknown',
      });
    }
    const locked = await post('email-verification/verify', {
      email,
      code: emails[0]!.code,
    });
    expect(locked.status).toBe(429);
    expect(locked.body.code).toBe('VERIFICATION_ATTEMPTS_EXCEEDED');
    const cooldown = await post('email-verification/resend', { email });
    expect(cooldown.status).toBe(429);
    expect(cooldown.body.code).toBe('VERIFICATION_RESEND_TOO_SOON');
  });
  it('denies fabricated and copied actors at the application boundary', async () => {
    const initial = await verified();
    const actor = await app.get(IdentityApi).authenticate(initial.accessToken);
    for (const untrusted of [
      { ...actor },
      { ...actor, userId: randomUUID() },
    ]) {
      await expect(sessions.me(untrusted)).rejects.toMatchObject({
        code: 'ACCESS_TOKEN_INVALID',
      });
      await expect(sessions.logout(untrusted)).rejects.toMatchObject({
        code: 'ACCESS_TOKEN_INVALID',
      });
      await expect(sessions.logout(untrusted, true)).rejects.toMatchObject({
        code: 'ACCESS_TOKEN_INVALID',
      });
    }
    await expect(sessions.me(actor)).resolves.toMatchObject({
      id: initial.user.id,
    });
    expect(
      (
        await pool.query(
          'SELECT * FROM auth_sessions WHERE revoked_at IS NOT NULL',
        )
      ).rows,
    ).toHaveLength(0);
  });
  it('denies mismatched user/session ownership even with a signed credential', async () => {
    const first = await verified();
    const otherEmail = 'another@example.com';
    await auth.register(otherEmail, password);
    const other = await verification.verify(otherEmail, emails.at(-1)!.code);
    const otherActor = await app
      .get(IdentityApi)
      .authenticate(other.accessToken);
    // Simulates a trusted issuer bug; a valid signature is not resource authorization.
    const raw = await tokens.access(first.user.id, otherActor.sessionId);
    const actor = await app.get(IdentityApi).authenticate(raw);
    await expect(sessions.me(actor)).rejects.toMatchObject({
      code: 'SESSION_REVOKED',
    });
    await expect(sessions.logout(actor)).rejects.toMatchObject({
      code: 'SESSION_REVOKED',
    });
    await expect(sessions.logout(actor, true)).rejects.toMatchObject({
      code: 'SESSION_REVOKED',
    });
    for (const path of ['logout', 'logout-all']) {
      const response = await post(path, {}).auth(raw, { type: 'bearer' });
      expect(response.status).toBe(401);
      expect(response.body.code).toBe('SESSION_REVOKED');
    }
    expect(
      (
        await pool.query(
          'SELECT * FROM auth_sessions WHERE revoked_at IS NOT NULL',
        )
      ).rows,
    ).toHaveLength(0);
    await expect(sessions.refresh(other.refreshToken)).resolves.toHaveProperty(
      'accessToken',
    );
    await expect(sessions.refresh(first.refreshToken)).resolves.toHaveProperty(
      'accessToken',
    );
  });
  it('checks actor expiry again for direct application calls', async () => {
    const initial = await verified();
    const actor = await app.get(IdentityApi).authenticate(initial.accessToken);
    advance(AUTH_POLICY.accessSeconds);
    await expect(sessions.me(actor)).rejects.toMatchObject({
      code: 'ACCESS_TOKEN_EXPIRED',
    });
    await expect(sessions.logout(actor, true)).rejects.toMatchObject({
      code: 'ACCESS_TOKEN_EXPIRED',
    });
    expect(
      (
        await pool.query(
          'SELECT * FROM auth_sessions WHERE revoked_at IS NOT NULL',
        )
      ).rows,
    ).toHaveLength(0);
  });
  it('keeps logout idempotent and allows logout-all from a revoked session with valid access', async () => {
    const initial = await verified();
    const second = await auth.login(email, password);
    for (const path of ['logout', 'logout', 'logout-all']) {
      const response = await post(path, {}).auth(initial.accessToken, {
        type: 'bearer',
      });
      expect(response.status).toBe(204);
      expect(response.text).toBe('');
      expect(response.headers['cache-control']).toBe('no-store');
    }
    await expect(sessions.refresh(second.refreshToken)).rejects.toMatchObject({
      code: 'SESSION_REVOKED',
    });
  });
  it('keeps logout available for an expired server session with still-valid access', async () => {
    const initial = await verified();
    await pool.query('UPDATE auth_sessions SET expires_at = $1', [now]);
    const actor = await app.get(IdentityApi).authenticate(initial.accessToken);
    await expect(sessions.me(actor)).rejects.toMatchObject({
      code: 'SESSION_EXPIRED',
    });
    expect(
      (await post('logout', {}).auth(initial.accessToken, { type: 'bearer' }))
        .status,
    ).toBe(204);
  });
  it('bounds refresh queries independently of sibling session count on one connection', async () => {
    const initial = await verified();
    await pool.query(`INSERT INTO auth_sessions (id, user_id, created_at, last_used_at, expires_at)
      SELECT gen_random_uuid(), user_id, created_at, last_used_at, expires_at
      FROM auth_sessions CROSS JOIN generate_series(1, 50)`);
    const spyOnQuery = (client: PoolClient) => vi.spyOn(client, 'query');
    const spies = new Map<PoolClient, ReturnType<typeof spyOnQuery>>();
    const acquired = (client: PoolClient) => {
      if (!spies.has(client)) spies.set(client, spyOnQuery(client));
    };
    pool.on('acquire', acquired);
    try {
      await sessions.refresh(initial.refreshToken);
      expect(spies.size).toBe(1);
      const calls = [...spies.values()].flatMap((spy) => spy.mock.calls);
      // Includes BEGIN/COMMIT: the read/write budget must not scale with other sessions.
      expect(calls.length).toBeLessThanOrEqual(10);
      expect(calls.length).toBeGreaterThan(2);
    } finally {
      pool.off('acquire', acquired);
      for (const spy of spies.values()) spy.mockRestore();
    }
  });
  it('throttles all five sensitive endpoint families', async () => {
    for (const path of [
      'register',
      'login',
      'email-verification/verify',
      'email-verification/resend',
      'refresh',
    ]) {
      for (let i = 0; i < AUTH_POLICY.rateAttempts; i++)
        expect((await post(path, {})).status).toBe(400);
      const blocked = await post(path, {});
      expect(blocked.status).toBe(429);
      expect(blocked.body.code).toBe('RATE_LIMITED');
      expect(blocked.headers['retry-after']).toBe('60');
    }
  });
});
