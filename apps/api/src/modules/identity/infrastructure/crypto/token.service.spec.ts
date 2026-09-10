import { randomBytes, randomUUID } from 'node:crypto';
import { decodeJwt, SignJWT } from 'jose';
import { describe, it, expect } from 'vitest';
import { TokenService } from './token.service.js';
import { AuthConfig } from '../config/auth-config.js';
import { AUTH_POLICY } from '../../domain/auth-policy.js';
const config: AuthConfig = {
  signingKey: randomBytes(32),
  issuer: 'test',
  audience: 'mobile',
  verificationKey: randomBytes(32).toString('base64'),
  emailMode: 'file',
  emailFrom: '',
  awsRegion: 'us-east-1',
  inbox: '/tmp/codecore-test-inbox',
};
const now = new Date('2026-09-01T00:00:00Z');
const service = new TokenService(config, { now: () => now });
const userId = randomUUID();
const sessionId = randomUUID();
describe('TokenService', () => {
  it('issues minimal exact claims with a ten-minute lifetime', async () => {
    const raw = await service.access(userId, sessionId);
    const claims = decodeJwt(raw);
    expect(Object.keys(claims).sort()).toEqual([
      'aud',
      'exp',
      'iat',
      'iss',
      'sid',
      'sub',
    ]);
    expect(claims.exp! - claims.iat!).toBe(AUTH_POLICY.accessSeconds);
    expect(await service.verify(raw)).toEqual({
      userId,
      sessionId,
      expiresAt: now.getTime() + AUTH_POLICY.accessSeconds * 1000,
    });
  });
  it.each([
    'issuer',
    'audience',
    'signature',
    'algorithm',
    'expiration',
    'missing',
    'principal',
  ])('rejects invalid %s', async (kind) => {
    const raw = await new SignJWT({
      sid: kind === 'principal' ? 'bad' : sessionId,
    })
      .setProtectedHeader({
        alg: kind === 'algorithm' ? 'HS384' : 'HS256',
        typ: 'JWT',
      })
      .setSubject(userId)
      .setIssuer(kind === 'issuer' ? 'other' : config.issuer)
      .setAudience(kind === 'audience' ? 'other' : config.audience)
      .setIssuedAt(Math.floor(now.getTime() / 1000))
      .setExpirationTime(
        Math.floor(now.getTime() / 1000) + (kind === 'expiration' ? 0 : 600),
      )
      .sign(kind === 'signature' ? randomBytes(32) : config.signingKey);
    if (kind === 'missing') {
      const missing = await new SignJWT({})
        .setProtectedHeader({ alg: 'HS256' })
        .sign(config.signingKey);
      await expect(service.verify(missing)).rejects.toMatchObject({
        code: 'ACCESS_TOKEN_INVALID',
      });
    } else
      await expect(service.verify(raw)).rejects.toMatchObject({
        code:
          kind === 'expiration'
            ? 'ACCESS_TOKEN_EXPIRED'
            : 'ACCESS_TOKEN_INVALID',
      });
  });
  it('generates unique high-entropy opaque material and digests', () => {
    const first = service.refresh();
    const second = service.refresh();
    expect(first.raw).toMatch(/^[\w-]{43}$/);
    expect(first.raw).not.toBe(second.raw);
    expect(first.hash).toBe(service.digest(first.raw));
    expect(first.hash).toMatch(/^[a-f0-9]{64}$/);
  });
});
