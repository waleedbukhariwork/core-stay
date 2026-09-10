import { Module } from '@nestjs/common';
import { AuthController } from './transport/http/auth.controller.js';
import { AuthGuard } from './transport/http/auth.guard.js';
import { AuthRateGuard } from './transport/http/auth-rate.guard.js';
import { AuthService } from './application/auth.service.js';
import { EmailVerificationService } from './application/email-verification.service.js';
import { SessionService } from './application/session.service.js';
import { ActorAuthenticator } from './application/actor-authenticator.js';
import { SessionAccessPolicy } from './application/policies/session-access.policy.js';
import { IdentityApi } from './public/identity.api.js';
import { Clock } from './application/ports/clock.js';
import { SessionTokens } from './application/ports/session-tokens.js';
import { VerificationCodes } from './application/ports/verification-codes.js';
import { EmailSender } from './application/ports/email-sender.js';
import { IdentityUnitOfWork } from './application/ports/identity-unit-of-work.js';
import { SystemClock } from './infrastructure/system-clock.js';
import { AuthConfig } from './infrastructure/config/auth-config.js';
import { TokenService } from './infrastructure/crypto/token.service.js';
import { PasswordHasher } from './infrastructure/crypto/password-hasher.js';
import { HmacVerificationCodes } from './infrastructure/crypto/hmac-verification-codes.js';
import { ConfiguredEmailSender } from './infrastructure/email/email.sender.js';
import { DrizzleIdentityUnitOfWork } from './infrastructure/persistence/drizzle-identity-unit-of-work.js';
@Module({
  controllers: [AuthController],
  providers: [
    AuthConfig,
    AuthGuard,
    AuthRateGuard,
    AuthService,
    EmailVerificationService,
    SessionService,
    SessionAccessPolicy,
    PasswordHasher,
    ActorAuthenticator,
    { provide: IdentityApi, useExisting: ActorAuthenticator },
    { provide: Clock, useClass: SystemClock },
    { provide: SessionTokens, useClass: TokenService },
    { provide: VerificationCodes, useClass: HmacVerificationCodes },
    { provide: EmailSender, useClass: ConfiguredEmailSender },
    { provide: IdentityUnitOfWork, useClass: DrizzleIdentityUnitOfWork },
  ],
  exports: [IdentityApi],
})
export class IdentityModule {}
