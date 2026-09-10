import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from '../../application/auth.service.js';
import { EmailVerificationService } from '../../application/email-verification.service.js';
import { SessionService } from '../../application/session.service.js';
import { AuthGuard, type AuthRequest } from './auth.guard.js';
import { AuthRateGuard } from './auth-rate.guard.js';
import {
  EmailDto,
  RegisterDto,
  LoginDto,
  VerifyEmailDto,
  RefreshDto,
} from './dto/auth.dto.js';
import {
  UserResponseDto,
  SessionResponseDto,
  VerificationResponseDto,
} from './dto/auth-response.dto.js';
import {
  mapUser,
  mapSession,
  verificationResponse,
} from './auth-response.mapper.js';
@Controller('auth')
@UseGuards(AuthRateGuard)
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly verification: EmailVerificationService,
    private readonly sessions: SessionService,
  ) {}
  @Post('register')
  @HttpCode(202)
  async register(
    @Body() body: RegisterDto,
  ): Promise<{ data: VerificationResponseDto }> {
    await this.auth.register(body.email, body.password);
    return { data: verificationResponse() };
  }
  @Post('email-verification/verify')
  @HttpCode(200)
  async verify(
    @Body() body: VerifyEmailDto,
  ): Promise<{ data: SessionResponseDto }> {
    return {
      data: mapSession(await this.verification.verify(body.email, body.code)),
    };
  }
  @Post('email-verification/resend')
  @HttpCode(202)
  async resend(
    @Body() body: EmailDto,
  ): Promise<{ data: VerificationResponseDto }> {
    await this.verification.resend(body.email);
    return { data: verificationResponse() };
  }
  @Post('login')
  @HttpCode(200)
  async login(@Body() body: LoginDto): Promise<{ data: SessionResponseDto }> {
    return {
      data: mapSession(await this.auth.login(body.email, body.password)),
    };
  }
  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Body() body: RefreshDto,
  ): Promise<{ data: SessionResponseDto }> {
    return { data: mapSession(await this.sessions.refresh(body.refreshToken)) };
  }
  @Post('logout')
  @UseGuards(AuthGuard)
  @HttpCode(204)
  logout(@Req() request: AuthRequest): Promise<void> {
    return this.sessions.logout(request.principal);
  }
  @Post('logout-all')
  @UseGuards(AuthGuard)
  @HttpCode(204)
  logoutAll(@Req() request: AuthRequest): Promise<void> {
    return this.sessions.logout(request.principal, true);
  }
  @Get('me')
  @UseGuards(AuthGuard)
  async me(@Req() request: AuthRequest): Promise<{ data: UserResponseDto }> {
    return { data: mapUser(await this.sessions.me(request.principal)) };
  }
}
