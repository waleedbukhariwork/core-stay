import {
  SessionTokens,
  type VerifiedAccessToken,
} from '../../application/ports/session-tokens.js';
import { Injectable } from '@nestjs/common';
import { randomBytes, createHash, randomUUID } from 'node:crypto';
import { SignJWT, jwtVerify, errors } from 'jose';
import { AuthConfig } from '../config/auth-config.js';
import { AUTH_POLICY } from '../../domain/auth-policy.js';
import { identityFailure } from '../../domain/identity-failure.js';
import { Clock } from '../../application/ports/clock.js';

@Injectable()
export class TokenService extends SessionTokens {
  constructor(
    private readonly config: AuthConfig,
    private readonly clock: Clock,
  ) {
    super();
  }
  newId(): string {
    return randomUUID();
  }
  refresh(): { id: string; raw: string; hash: string } {
    const raw = randomBytes(32).toString('base64url');
    return { id: randomUUID(), raw, hash: this.digest(raw) };
  }
  digest(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }
  access(userId: string, sessionId: string): Promise<string> {
    const now = Math.floor(this.clock.now().getTime() / 1000);
    return new SignJWT({ sid: sessionId })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setSubject(userId)
      .setIssuer(this.config.issuer)
      .setAudience(this.config.audience)
      .setIssuedAt(now)
      .setExpirationTime(now + AUTH_POLICY.accessSeconds)
      .sign(this.config.signingKey);
  }
  async verify(raw: string): Promise<VerifiedAccessToken> {
    try {
      const { payload } = await jwtVerify(raw, this.config.signingKey, {
        algorithms: ['HS256'],
        issuer: this.config.issuer,
        audience: this.config.audience,
        currentDate: this.clock.now(),
        requiredClaims: ['sub', 'sid', 'iat', 'exp'],
        typ: 'JWT',
      });
      const uuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (
        typeof payload.sub !== 'string' ||
        typeof payload.sid !== 'string' ||
        !uuid.test(payload.sub) ||
        !uuid.test(payload.sid)
      )
        throw new Error('Invalid principal');
      return {
        userId: payload.sub,
        sessionId: payload.sid,
        expiresAt: payload.exp! * 1000,
      };
    } catch (error) {
      throw identityFailure(
        error instanceof errors.JWTExpired
          ? 'ACCESS_TOKEN_EXPIRED'
          : 'ACCESS_TOKEN_INVALID',
      );
    }
  }
}
