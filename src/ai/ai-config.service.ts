import { Injectable } from '@nestjs/common';

@Injectable()
export class AiConfigService {
  get geminiApiKey(): string | undefined {
    return process.env.GEMINI_API_KEY;
  }

  get geminiBaseUrl(): string {
    return this.normalizeBaseUrl(
      process.env.GEMINI_API_BASE_URL ?? 'https://generativelanguage.googleapis.com',
    );
  }

  get geminiModel(): string {
    return process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';
  }

  get rateLimitRpm(): number {
    return this.parsePositiveInt(process.env.AI_RATE_LIMIT_RPM, 20);
  }

  get cacheTtlSec(): number {
    return this.parsePositiveInt(process.env.AI_CACHE_TTL_SEC, 300);
  }

  private normalizeBaseUrl(value: string): string {
    return value.replace(/\/+$/, '');
  }

  private parsePositiveInt(value: string | undefined, fallback: number): number {
    if (!value) {
      return fallback;
    }

    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }
}
