import { Injectable } from '@nestjs/common';
import { AppConfig } from '../../../../platform/config/app-config.js';
@Injectable()
export class AuthConfig {
  readonly signingKey: Uint8Array;
  readonly verificationKey: string;
  readonly issuer: string;
  readonly audience: string;
  readonly emailMode: 'ses' | 'file';
  readonly emailFrom: string;
  readonly awsRegion: string;
  readonly inbox: string;
  constructor(config: AppConfig) {
    this.signingKey = Buffer.from(config.auth.jwtSecret, 'base64');
    this.verificationKey = config.auth.verificationSecret;
    this.issuer = config.auth.issuer;
    this.audience = config.auth.audience;
    this.emailMode = config.auth.emailMode;
    this.emailFrom = config.auth.emailFrom;
    this.awsRegion = config.auth.awsRegion;
    this.inbox = config.auth.inbox;
  }
}
