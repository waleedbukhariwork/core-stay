import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import {
  IdentityApi,
  type AuthenticatedActor,
} from '../../../identity/public/identity.api.js';
import { AppException } from '../../../../platform/http/errors/app-exception.js';

export type DiagnosticRequest = Request & { principal: AuthenticatedActor };
@Injectable()
export class DiagnosticGuard implements CanActivate {
  constructor(private readonly identity: IdentityApi) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<DiagnosticRequest>();
    const header = request.headers.authorization;
    if (!header || !/^Bearer [^ ]+$/.test(header))
      throw new AppException({
        code: 'ACCESS_TOKEN_INVALID',
        title: 'Authentication request failed',
        status: 401,
      });
    request.principal = await this.identity.authenticate(header.slice(7));
    return true;
  }
}
