import { Injectable } from '@nestjs/common';

import { AiConfigService } from './ai-config.service';
import { AiUsageService } from './ai-usage.service';

interface CacheEntry<T> {
  expiresAt: number;
  value: T;
}

@Injectable()
export class AiCacheService {
  private readonly cache = new Map<string, CacheEntry<unknown>>();

  constructor(
    private readonly config: AiConfigService,
    private readonly usage: AiUsageService,
  ) {}

  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) {
      this.usage.recordCacheMiss();
      return undefined;
    }

    if (entry.expiresAt <= Date.now()) {
      this.cache.delete(key);
      this.usage.recordCacheMiss();
      return undefined;
    }

    this.usage.recordCacheHit();
    return entry.value as T;
  }

  set<T>(key: string, value: T): void {
    this.cache.set(key, {
      expiresAt: Date.now() + this.config.cacheTtlSec * 1000,
      value,
    });
  }
}
