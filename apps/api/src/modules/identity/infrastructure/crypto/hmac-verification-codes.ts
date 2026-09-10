import { Injectable } from '@nestjs/common';
import {
  createHmac,
  randomInt,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto';
import { VerificationCodes } from '../../application/ports/verification-codes.js';
import { AuthConfig } from '../config/auth-config.js';
@Injectable()
export class HmacVerificationCodes extends VerificationCodes {
  constructor(private readonly config: AuthConfig) {
    super();
  }
  private digest(id: string, code: string): string {
    return createHmac('sha256', this.config.verificationKey)
      .update(`${id}:${code}`)
      .digest('hex');
  }
  generate(): { id: string; code: string; digest: string } {
    const id = randomUUID();
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    return { id, code, digest: this.digest(id, code) };
  }
  matches(id: string, digest: string, code: string): boolean {
    return timingSafeEqual(
      Buffer.from(digest, 'hex'),
      Buffer.from(this.digest(id, code), 'hex'),
    );
  }
}
