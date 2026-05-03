import { Injectable } from '@nestjs/common';

import { AiUsageResponseDto } from './models/ai-response.model';

interface TokenUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

@Injectable()
export class AiUsageService {
  private totalRequests = 0;
  private readonly requestsByEndpoint = new Map<string, number>();
  private totalPromptTokens = 0;
  private totalCompletionTokens = 0;
  private totalTokens = 0;
  private totalLatencyMs = 0;
  private latencySamples = 0;
  private cacheHits = 0;
  private cacheMisses = 0;

  recordRequest(endpoint: string): void {
    this.totalRequests += 1;
    this.requestsByEndpoint.set(endpoint, (this.requestsByEndpoint.get(endpoint) ?? 0) + 1);
  }

  recordGeminiCall(latencyMs: number, usage?: TokenUsage): void {
    this.totalLatencyMs += latencyMs;
    this.latencySamples += 1;

    if (!usage) {
      return;
    }

    this.totalPromptTokens += usage.promptTokens ?? 0;
    this.totalCompletionTokens += usage.completionTokens ?? 0;
    this.totalTokens += usage.totalTokens ?? 0;
  }

  recordCacheHit(): void {
    this.cacheHits += 1;
  }

  recordCacheMiss(): void {
    this.cacheMisses += 1;
  }

  snapshot(): AiUsageResponseDto {
    const cacheLookups = this.cacheHits + this.cacheMisses;

    return {
      totalRequests: this.totalRequests,
      requestsByEndpoint: Object.fromEntries(this.requestsByEndpoint),
      totalPromptTokens: this.totalPromptTokens,
      totalCompletionTokens: this.totalCompletionTokens,
      totalTokens: this.totalTokens,
      averageLatencyMs:
        this.latencySamples > 0 ? Math.round(this.totalLatencyMs / this.latencySamples) : undefined,
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      cacheHitRatio: cacheLookups > 0 ? Number((this.cacheHits / cacheLookups).toFixed(4)) : 0,
    };
  }
}
