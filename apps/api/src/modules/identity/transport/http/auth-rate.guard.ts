import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { Clock } from '../../application/ports/clock.js';
import { AUTH_POLICY } from '../../domain/auth-policy.js';
import { authHttpError } from './auth-http-error.js';
@Injectable()
export class AuthRateGuard implements CanActivate {
  private readonly buckets = new Map<
    string,
    { count: number; until: number }
  >();
  constructor(private readonly clock: Clock) {}
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    response.setHeader('Cache-Control', 'no-store');
    const now = this.clock.now().getTime();
    for (const [key, bucket] of this.buckets)
      if (bucket.until <= now) this.buckets.delete(key);
    // Express uses the socket peer; forwarded IP headers are not trusted by default.
    const key = `${request.ip}:${context.getHandler().name}`;
    let bucket = this.buckets.get(key);
    if (!bucket) {
      if (this.buckets.size >= AUTH_POLICY.rateMaxKeys)
        throw authHttpError('RATE_LIMITED', 429);
      bucket = { count: 0, until: now + AUTH_POLICY.rateWindowMs };
      this.buckets.set(key, bucket);
    }
    if (++bucket.count > AUTH_POLICY.rateAttempts) {
      response.setHeader('Retry-After', Math.ceil((bucket.until - now) / 1000));
      throw authHttpError('RATE_LIMITED', 429);
    }
    return true;
  }
}
