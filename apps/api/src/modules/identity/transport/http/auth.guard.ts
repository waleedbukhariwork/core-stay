import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import {
  IdentityApi,
  type AuthenticatedActor,
} from '../../public/identity.api.js';
import { authHttpError } from './auth-http-error.js';
export type AuthRequest = Request & { principal: AuthenticatedActor };
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly identity: IdentityApi) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const header = request.headers.authorization;
    if (!header || !/^Bearer [^ ]+$/.test(header))
      throw authHttpError('ACCESS_TOKEN_INVALID', 401);
    request.principal = await this.identity.authenticate(header.slice(7));
    return true;
  }
}
