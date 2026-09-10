import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { argon2id, hash, verify } from 'argon2';
import { AUTH_POLICY } from '../../domain/auth-policy.js';
@Injectable()
export class PasswordHasher {
  private dummy?: Promise<string>;
  hash(password: string): Promise<string> {
    return hash(password, {
      type: argon2id,
      memoryCost: AUTH_POLICY.argonMemoryKiB,
      timeCost: AUTH_POLICY.argonIterations,
      parallelism: AUTH_POLICY.argonParallelism,
      hashLength: 32,
    });
  }
  async check(encoded: string | undefined, password: string): Promise<boolean> {
    // Unknown identities pay the same Argon2 verification cost.
    const candidate =
      encoded ??
      (await (this.dummy ??= this.hash(randomBytes(32).toString('hex'))));
    const valid = await verify(candidate, password);
    return encoded !== undefined && valid;
  }
}
