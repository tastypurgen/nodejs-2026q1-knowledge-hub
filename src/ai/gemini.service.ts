import {
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';

import { AiConfigService } from './ai-config.service';
import { AiUsageService } from './ai-usage.service';

interface GeminiPart {
  text?: string;
}

interface GeminiContent {
  parts?: GeminiPart[];
}

interface GeminiCandidate {
  content?: GeminiContent;
}

interface GeminiUsageMetadata {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
  usageMetadata?: GeminiUsageMetadata;
}

export interface GenerateTextOptions {
  responseMimeType?: 'application/json' | 'text/plain';
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly timeoutMs = 15_000;
  private readonly maxRetries = 3;

  constructor(
    private readonly config: AiConfigService,
    private readonly usage: AiUsageService,
  ) {}

  async generateText(prompt: string, options?: GenerateTextOptions): Promise<string> {
    const apiKey = this.config.geminiApiKey;
    if (!apiKey) {
      throw new InternalServerErrorException('Gemini API key is not configured.');
    }

    const startedAt = Date.now();
    const response = await this.requestWithRetry(prompt, apiKey, options);
    this.usage.recordGeminiCall(Date.now() - startedAt, {
      promptTokens: response.usageMetadata?.promptTokenCount,
      completionTokens: response.usageMetadata?.candidatesTokenCount,
      totalTokens: response.usageMetadata?.totalTokenCount,
    });

    const text = response.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? '')
      .join('')
      .trim();

    if (!text) {
      throw new ServiceUnavailableException('Gemini returned an empty response.');
    }

    return text;
  }

  private async requestWithRetry(
    prompt: string,
    apiKey: string,
    options?: GenerateTextOptions,
  ): Promise<GeminiResponse> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      try {
        const response = await this.sendRequest(prompt, apiKey, options);
        if (response.status === 401 || response.status === 403) {
          throw new InternalServerErrorException('Gemini authentication failed.');
        }

        if (response.status === 429 || response.status >= 500) {
          if (attempt < this.maxRetries) {
            await this.waitBeforeRetry(attempt);
            continue;
          }

          throw new ServiceUnavailableException('Gemini is temporarily unavailable.');
        }

        if (!response.ok) {
          throw new ServiceUnavailableException('Gemini rejected the generation request.');
        }

        return (await response.json()) as GeminiResponse;
      } catch (error) {
        if (error instanceof InternalServerErrorException || error instanceof ServiceUnavailableException) {
          throw error;
        }

        lastError = error;
        if (attempt < this.maxRetries) {
          await this.waitBeforeRetry(attempt);
          continue;
        }
      }
    }

    this.logger.warn(`Gemini request failed after retries: ${this.describeError(lastError)}`);
    throw new ServiceUnavailableException('Gemini request failed due to a network or timeout issue.');
  }

  private async sendRequest(
    prompt: string,
    apiKey: string,
    options?: GenerateTextOptions,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      return await fetch(this.endpointUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            ...(options?.responseMimeType ? { responseMimeType: options.responseMimeType } : {}),
          },
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  private endpointUrl(): string {
    const model = this.config.geminiModel.replace(/^models\//, '');
    return `${this.config.geminiBaseUrl}/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  }

  private async waitBeforeRetry(attempt: number): Promise<void> {
    const delayMs = 300 * 2 ** attempt;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  private describeError(error: unknown): string {
    if (error instanceof Error) {
      return error.name;
    }

    return 'unknown error';
  }
}
