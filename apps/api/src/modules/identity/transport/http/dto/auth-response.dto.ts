export class UserResponseDto {
  id: string;
  email: string;
  emailVerified: boolean;
  status: string;
}
export class SessionResponseDto {
  user: UserResponseDto;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
export class VerificationResponseDto {
  status: 'awaitingEmailVerification';
  resendAfter: number;
  expiresIn: number;
}
