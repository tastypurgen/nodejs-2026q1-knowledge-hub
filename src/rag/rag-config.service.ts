import { Injectable } from '@nestjs/common';

@Injectable()
export class RagConfigService {
  get geminiApiKey(): string | undefined {
    return process.env.GEMINI_API_KEY;
  }

  get geminiApiBaseUrl(): string {
    return (
      process.env.GEMINI_API_BASE_URL ??
      'https://generativelanguage.googleapis.com'
    ).replace(/\/+$/, '');
  }

  get geminiModel(): string {
    return process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';
  }

  get geminiEmbeddingModel(): string {
    return process.env.GEMINI_EMBEDDING_MODEL ?? 'text-embedding-004';
  }

  get vectorDbUrl(): string {
    return (process.env.RAG_VECTOR_DB_URL ?? 'http://vectordb:6333').replace(
      /\/+$/,
      '',
    );
  }

  get vectorCollection(): string {
    return process.env.RAG_VECTOR_COLLECTION ?? 'knowledge_hub_articles';
  }

  get chunkSize(): number {
    return this.getPositiveInt('RAG_CHUNK_SIZE', 800);
  }

  get chunkOverlap(): number {
    const overlap = this.getPositiveInt('RAG_CHUNK_OVERLAP', 200);
    return Math.min(overlap, Math.max(0, this.chunkSize - 1));
  }

  get conversationMaxMessages(): number {
    return this.getPositiveInt('RAG_CONVERSATION_MAX_MESSAGES', 20);
  }

  private getPositiveInt(name: string, fallback: number): number {
    const raw = process.env[name];
    if (!raw) {
      return fallback;
    }

    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }
}
