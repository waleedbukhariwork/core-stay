import type { User } from '../../domain/user.js';
import type { AuthenticatedSession } from '../../application/authenticated-session.js';
import { AUTH_POLICY } from '../../domain/auth-policy.js';
import type {
  UserResponseDto,
  SessionResponseDto,
  VerificationResponseDto,
} from './dto/auth-response.dto.js';
export function mapUser(user: User): UserResponseDto {
  return {
    id: user.id,
    email: user.email,
    emailVerified: user.emailVerifiedAt !== null,
    status: user.status,
  };
}
export function mapSession(session: AuthenticatedSession): SessionResponseDto {
  return {
    user: mapUser(session.user),
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    expiresIn: session.expiresIn,
  };
}
export function verificationResponse(): VerificationResponseDto {
  return {
    status: 'awaitingEmailVerification',
    resendAfter: AUTH_POLICY.resendSeconds,
    expiresIn: AUTH_POLICY.verificationSeconds,
  };
}
