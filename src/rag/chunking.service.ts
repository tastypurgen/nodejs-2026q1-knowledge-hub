import { createHash } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { RagConfigService } from './rag-config.service';
import type { ArticleChunk, RagArticle } from './rag.types';

@Injectable()
export class ChunkingService {
  constructor(private readonly config: RagConfigService) {}

  chunkArticle(article: RagArticle): ArticleChunk[] {
    const text = this.normalizeText(`${article.title}\n\n${article.content}`);
    if (!text) {
      return [];
    }

    const chunks = this.splitStable(text);
    return chunks.map((chunk, index) => {
      const contentHash = this.hash(`${article.id}:${index}:${chunk}`);
      return {
        id: this.stableUuid(`${article.id}:${index}:${contentHash}`),
        articleId: article.id,
        articleTitle: article.title,
        articleStatus: article.status,
        categoryId: article.categoryId,
        tags: article.tags,
        chunkIndex: index,
        chunk,
        contentHash,
        updatedAt: article.updatedAt,
      };
    });
  }

  private splitStable(text: string): string[] {
    const size = this.config.chunkSize;
    const overlap = this.config.chunkOverlap;
    const step = Math.max(1, size - overlap);
    const chunks: string[] = [];

    for (let start = 0; start < text.length; start += step) {
      const end = Math.min(text.length, start + size);
      chunks.push(text.slice(start, end).trim());

      if (end === text.length) {
        break;
      }
    }

    return chunks.filter(Boolean);
  }

  private normalizeText(text: string): string {
    return text.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').trim();
  }

  private hash(input: string): string {
    return createHash('sha256').update(input).digest('hex');
  }

  private stableUuid(input: string): string {
    const bytes = createHash('sha256').update(input).digest();
    bytes[6] = (bytes[6] & 0x0f) | 0x50;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = bytes.subarray(0, 16).toString('hex');

    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
      hex.slice(20, 32),
    ].join('-');
  }
}
