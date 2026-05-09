import {
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';

import { RagConfigService } from './rag-config.service';
import type { ArticleChunk, RagSearchFilters, RetrievedChunk } from './rag.types';

interface QdrantPoint {
  id: string;
  vector: number[];
  payload: Record<string, unknown>;
}

interface QdrantSearchPoint {
  score?: number;
  payload?: Record<string, unknown>;
}

interface QdrantSearchResponse {
  result?: QdrantSearchPoint[];
}

interface QdrantScrollResponse {
  result?: {
    points?: QdrantSearchPoint[];
  };
}

interface QdrantCollectionResponse {
  result?: {
    config?: {
      params?: {
        vectors?:
          | {
              size?: number;
            }
          | Record<string, { size?: number }>;
      };
    };
  };
}

@Injectable()
export class QdrantService {
  private readonly logger = new Logger(QdrantService.name);

  constructor(private readonly config: RagConfigService) {}

  async ensureCollection(vectorSize: number): Promise<void> {
    const collection = this.config.vectorCollection;
    const response = await this.request<QdrantCollectionResponse>(
      `collections/${collection}`,
      { method: 'GET' },
      'collection lookup',
      [404],
    );

    if (response.status === 404) {
      await this.request(
        `collections/${collection}`,
        {
          method: 'PUT',
          body: {
            vectors: {
              size: vectorSize,
              distance: 'Cosine',
            },
          },
        },
        'collection creation',
      );
      return;
    }

    const existingSize = this.getVectorSize(response.data);
    if (existingSize && existingSize !== vectorSize) {
      this.logger.error(
        `Qdrant collection ${collection} has vector size ${existingSize}, expected ${vectorSize}`,
      );
      throw new ServiceUnavailableException(
        'Vector collection has incompatible embedding dimensions',
      );
    }
  }

  async upsertChunks(chunks: ArticleChunk[], embeddings: number[][]): Promise<void> {
    if (chunks.length === 0) {
      return;
    }

    const points: QdrantPoint[] = chunks.map((chunk, index) => {
      const vector = embeddings[index];
      if (!vector) {
        throw new ServiceUnavailableException('Chunk embedding is missing');
      }

      return {
        id: chunk.id,
        vector,
        payload: {
          articleId: chunk.articleId,
          articleTitle: chunk.articleTitle,
          articleStatus: chunk.articleStatus,
          categoryId: chunk.categoryId,
          tags: chunk.tags,
          chunkIndex: chunk.chunkIndex,
          chunk: chunk.chunk,
          contentHash: chunk.contentHash,
          updatedAt: chunk.updatedAt,
        },
      };
    });

    await this.request(
      `collections/${this.config.vectorCollection}/points?wait=true`,
      {
        method: 'PUT',
        body: { points },
      },
      'point upsert',
    );
  }

  async search(
    vector: number[],
    limit: number,
    filters?: RagSearchFilters,
  ): Promise<RetrievedChunk[]> {
    const filter = this.buildFilter(filters);
    const body: Record<string, unknown> = {
      vector,
      limit,
      with_payload: true,
    };

    if (filter) {
      body.filter = filter;
    }

    const response = await this.request<QdrantSearchResponse>(
      `collections/${this.config.vectorCollection}/points/search`,
      {
        method: 'POST',
        body,
      },
      'point search',
    );

    return (response.data.result ?? [])
      .map((point) => this.toRetrievedChunk(point))
      .filter((point): point is RetrievedChunk => point !== undefined);
  }

  async deleteArticle(articleId: string): Promise<void> {
    const filter = this.articleFilter(articleId);
    const exists = await this.hasArticleVectors(filter);
    if (!exists) {
      throw new NotFoundException(`No indexed vectors found for article ${articleId}`);
    }

    await this.request(
      `collections/${this.config.vectorCollection}/points/delete?wait=true`,
      {
        method: 'POST',
        body: { filter },
      },
      'point delete',
    );
  }

  async deleteArticleIfIndexed(articleId: string): Promise<boolean> {
    const filter = this.articleFilter(articleId);
    const exists = await this.hasArticleVectors(filter);
    if (!exists) {
      return false;
    }

    await this.request(
      `collections/${this.config.vectorCollection}/points/delete?wait=true`,
      {
        method: 'POST',
        body: { filter },
      },
      'point delete',
    );
    return true;
  }

  private async hasArticleVectors(filter: Record<string, unknown>): Promise<boolean> {
    const response = await this.request<QdrantScrollResponse>(
      `collections/${this.config.vectorCollection}/points/scroll`,
      {
        method: 'POST',
        body: {
          filter,
          limit: 1,
          with_payload: false,
          with_vector: false,
        },
      },
      'point lookup',
      [404],
    );

    if (response.status === 404) {
      return false;
    }

    return (response.data.result?.points?.length ?? 0) > 0;
  }

  private articleFilter(articleId: string): Record<string, unknown> {
    return {
      must: [
        {
          key: 'articleId',
          match: { value: articleId },
        },
      ],
    };
  }

  private buildFilter(filters?: RagSearchFilters): Record<string, unknown> | undefined {
    const must: Record<string, unknown>[] = [];

    if (filters?.articleStatus) {
      must.push({
        key: 'articleStatus',
        match: { value: filters.articleStatus },
      });
    }

    if (filters?.categoryId) {
      must.push({
        key: 'categoryId',
        match: { value: filters.categoryId },
      });
    }

    for (const tag of filters?.tags ?? []) {
      must.push({
        key: 'tags',
        match: { value: tag },
      });
    }

    return must.length ? { must } : undefined;
  }

  private toRetrievedChunk(point: QdrantSearchPoint): RetrievedChunk | undefined {
    const payload = point.payload;
    if (!payload) {
      return undefined;
    }

    const articleId = this.stringPayload(payload.articleId);
    const articleTitle = this.stringPayload(payload.articleTitle);
    const chunk = this.stringPayload(payload.chunk);
    if (!articleId || !articleTitle || !chunk) {
      return undefined;
    }

    return {
      articleId,
      articleTitle,
      articleStatus: this.stringPayload(payload.articleStatus) as RetrievedChunk['articleStatus'],
      categoryId: this.nullableStringPayload(payload.categoryId),
      tags: Array.isArray(payload.tags)
        ? payload.tags.filter((tag): tag is string => typeof tag === 'string')
        : [],
      chunk,
      similarity: point.score ?? 0,
    };
  }

  private stringPayload(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined;
  }

  private nullableStringPayload(value: unknown): string | null {
    return typeof value === 'string' ? value : null;
  }

  private getVectorSize(response: QdrantCollectionResponse | undefined): number | undefined {
    const vectors = response?.result?.config?.params?.vectors;
    if (!vectors) {
      return undefined;
    }

    if ('size' in vectors && typeof vectors.size === 'number') {
      return vectors.size;
    }

    const firstVector = Object.values(vectors)[0];
    return firstVector?.size;
  }

  private async request<T = unknown>(
    path: string,
    options: {
      method: 'GET' | 'POST' | 'PUT';
      body?: Record<string, unknown>;
    },
    operation: string,
    allowedStatuses: number[] = [],
  ): Promise<{ status: number; data: T }> {
    const url = `${this.config.vectorDbUrl}/${path}`;

    try {
      const response = await fetch(url, {
        method: options.method,
        headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      if (!response.ok && !allowedStatuses.includes(response.status)) {
        this.logger.error(
          `Qdrant ${operation} failed with status ${response.status}`,
        );
        throw new ServiceUnavailableException(
          `Vector database ${operation} is unavailable`,
        );
      }

      const data = response.status === 204 ? undefined : await this.safeJson(response);
      return { status: response.status, data: data as T };
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }

      this.logger.error(
        `Qdrant ${operation} request failed: ${this.errorMessage(error)}`,
      );
      throw new ServiceUnavailableException('Vector database is unavailable');
    }
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  private async safeJson(response: Response): Promise<unknown> {
    try {
      return await response.json();
    } catch {
      return undefined;
    }
  }
}
