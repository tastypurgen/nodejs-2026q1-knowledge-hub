import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';

import { RagConfigService } from './rag-config.service';

interface GeminiEmbeddingResponse {
  embedding?: {
    values?: number[];
  };
}

interface GeminiGenerateResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);

  constructor(private readonly config: RagConfigService) {}

  async embed(text: string): Promise<number[]> {
    const model = this.config.geminiEmbeddingModel;
    const response = await this.post<GeminiEmbeddingResponse>(
      `v1beta/models/${model}:embedContent`,
      {
        model: `models/${model}`,
        content: {
          parts: [{ text }],
        },
      },
      'embedding',
    );

    const values = response.embedding?.values;
    if (!values?.length) {
      this.logger.error('Gemini embedding response did not include values');
      throw new ServiceUnavailableException('Gemini embedding service is unavailable');
    }

    return values;
  }

  async generate(prompt: string): Promise<string> {
    const response = await this.post<GeminiGenerateResponse>(
      `v1beta/models/${this.config.geminiModel}:generateContent`,
      {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          topP: 0.9,
        },
      },
      'generation',
    );

    const text = response.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? '')
      .join('')
      .trim();

    if (!text) {
      this.logger.error('Gemini generation response did not include text');
      throw new ServiceUnavailableException('Gemini generation service is unavailable');
    }

    return text;
  }

  private async post<T>(
    path: string,
    body: Record<string, unknown>,
    operation: string,
  ): Promise<T> {
    const apiKey = this.config.geminiApiKey;
    if (!apiKey) {
      this.logger.error('Gemini API key is not configured');
      throw new ServiceUnavailableException('Gemini API key is not configured');
    }

    const url = new URL(`${this.config.geminiApiBaseUrl}/${path}`);
    url.searchParams.set('key', apiKey);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        this.logger.error(
          `Gemini ${operation} failed with status ${response.status}`,
        );
        throw new ServiceUnavailableException(
          `Gemini ${operation} service is unavailable`,
        );
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }

      this.logger.error(
        `Gemini ${operation} request failed: ${this.errorMessage(error)}`,
      );
      throw new ServiceUnavailableException(
        `Gemini ${operation} service is unavailable`,
      );
    }
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
