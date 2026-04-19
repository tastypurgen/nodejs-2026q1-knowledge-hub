import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';

interface RateLimitBucket {
  resetAt: number;
  count: number;
}

@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  private static readonly buckets = new Map<string, RateLimitBucket>();
  private readonly windowMs = 60_000;
  private readonly maxRequests = 30;

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const key = `${request.ip ?? request.socket.remoteAddress ?? 'unknown'}:${request.path}`;
    const now = Date.now();
    const bucket = AuthRateLimitGuard.buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      AuthRateLimitGuard.buckets.set(key, {
        count: 1,
        resetAt: now + this.windowMs,
      });
      return true;
    }

    bucket.count += 1;
    if (bucket.count > this.maxRequests) {
      throw new HttpException(
        'Too many authentication attempts',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
