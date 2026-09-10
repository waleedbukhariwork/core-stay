import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length, Matches, MaxLength } from 'class-validator';
import { AUTH_POLICY } from '../../../domain/auth-policy.js';
export class EmailDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsEmail()
  @MaxLength(254)
  email: string;
}
export class RegisterDto extends EmailDto {
  @IsString()
  @Length(AUTH_POLICY.passwordMin, AUTH_POLICY.passwordMax)
  password: string;
}
export class LoginDto extends EmailDto {
  @IsString() @Length(1, AUTH_POLICY.passwordMax) password: string;
}
export class VerifyEmailDto extends EmailDto {
  @IsString() @Matches(/^\d{6}$/) code: string;
}
export class RefreshDto {
  @IsString() @Matches(/^[A-Za-z0-9_-]{43}$/) refreshToken: string;
}
