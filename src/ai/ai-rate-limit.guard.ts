import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { Response } from 'express';

import { AiRateLimitService } from './ai-rate-limit.service';

@Injectable()
export class AiRateLimitGuard implements CanActivate {
  constructor(private readonly rateLimit: AiRateLimitService) {}

  canActivate(context: ExecutionContext): boolean {
    const result = this.rateLimit.check();
    if (result.allowed) {
      return true;
    }

    const response = context.switchToHttp().getResponse<Response>();
    response.setHeader('Retry-After', String(result.retryAfterSec ?? 60));

    throw new HttpException(
      'AI rate limit exceeded. Retry after the provided seconds.',
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
