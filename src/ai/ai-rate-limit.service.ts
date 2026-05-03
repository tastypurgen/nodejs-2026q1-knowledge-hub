import { Injectable } from '@nestjs/common';

import { AiConfigService } from './ai-config.service';

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSec?: number;
}

@Injectable()
export class AiRateLimitService {
  private readonly requestTimestamps: number[] = [];

  constructor(private readonly config: AiConfigService) {}

  check(): RateLimitResult {
    const now = Date.now();
    const windowStart = now - 60_000;

    while (this.requestTimestamps.length > 0 && this.requestTimestamps[0] <= windowStart) {
      this.requestTimestamps.shift();
    }

    if (this.requestTimestamps.length >= this.config.rateLimitRpm) {
      const oldest = this.requestTimestamps[0];
      return {
        allowed: false,
        retryAfterSec: Math.max(1, Math.ceil((oldest + 60_000 - now) / 1000)),
      };
    }

    this.requestTimestamps.push(now);
    return { allowed: true };
  }
}
