import { Injectable } from '@nestjs/common';

import { ArticleStatus } from '../common/enums/article-status.enum';
import {
  fromPrismaArticleStatus,
  toPrismaArticleStatus,
} from '../common/utils/prisma-enum.util';
import { PrismaService } from '../prisma/prisma.service';
import { ChunkingService } from './chunking.service';
import { ConversationMemoryService } from './conversation-memory.service';
import type { RagChatRequestDto } from './dto/rag-chat-request.dto';
import type { RagSearchRequestDto } from './dto/rag-search-request.dto';
import type { ReindexRequestDto } from './dto/reindex-request.dto';
import { GeminiService } from './gemini.service';
import { QdrantService } from './qdrant.service';
import { RagConfigService } from './rag-config.service';
import type { RagArticle, RetrievedChunk } from './rag.types';

@Injectable()
export class RagService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chunking: ChunkingService,
    private readonly gemini: GeminiService,
    private readonly qdrant: QdrantService,
    private readonly config: RagConfigService,
    private readonly conversations: ConversationMemoryService,
  ) {}

  async reindex(dto: ReindexRequestDto) {
    const onlyPublished = dto.onlyPublished ?? true;
    const articles = await this.findArticles({
      onlyPublished,
      articleIds: dto.articleIds,
    });

    let indexedChunks = 0;
    let collectionReady = false;

    for (const article of articles) {
      const chunks = this.chunking.chunkArticle(article);
      if (!chunks.length) {
        await this.qdrant.deleteArticleIfIndexed(article.id);
        continue;
      }

      const embeddings = await Promise.all(
        chunks.map((chunk) => this.gemini.embed(chunk.chunk)),
      );
      const firstEmbedding = embeddings[0];
      if (!firstEmbedding) {
        continue;
      }

      if (!collectionReady) {
        await this.qdrant.ensureCollection(firstEmbedding.length);
        collectionReady = true;
      }

      await this.qdrant.deleteArticleIfIndexed(article.id);
      await this.qdrant.upsertChunks(chunks, embeddings);
      indexedChunks += chunks.length;
    }

    return {
      indexedArticles: articles.length,
      indexedChunks,
      vectorCollection: this.config.vectorCollection,
    };
  }

  async search(dto: RagSearchRequestDto) {
    const limit = dto.limit ?? 5;
    const queryEmbedding = await this.gemini.embed(dto.query);
    await this.qdrant.ensureCollection(queryEmbedding.length);

    const results = await this.qdrant.search(queryEmbedding, limit, {
      articleStatus: dto.articleStatus,
      categoryId: dto.categoryId,
      tags: dto.tags,
    });

    return {
      results: results.map((result) => ({
        articleId: result.articleId,
        articleTitle: result.articleTitle,
        chunk: result.chunk,
        similarity: result.similarity,
      })),
    };
  }

  async chat(dto: RagChatRequestDto) {
    const conversationId = this.conversations.createOrGetConversationId(
      dto.conversationId,
    );
    const queryEmbedding = await this.gemini.embed(dto.question);
    await this.qdrant.ensureCollection(queryEmbedding.length);

    const chunks = await this.qdrant.search(queryEmbedding, 5, {
      articleStatus: ArticleStatus.PUBLISHED,
    });
    const prompt = this.buildGroundedPrompt(dto.question, chunks, conversationId);
    const answer = await this.gemini.generate(prompt);

    this.conversations.addMessage(conversationId, {
      role: 'user',
      content: dto.question,
    });
    this.conversations.addMessage(conversationId, {
      role: 'assistant',
      content: answer,
    });

    return {
      answer,
      sources: chunks.map((chunk) => ({
        articleId: chunk.articleId,
        articleTitle: chunk.articleTitle,
        relevantChunk: chunk.chunk,
      })),
      conversationId,
    };
  }

  async deleteArticle(articleId: string): Promise<void> {
    await this.qdrant.deleteArticle(articleId);
  }

  getConversationHistory(conversationId: string) {
    return {
      conversationId,
      messages: this.conversations.getHistory(conversationId),
    };
  }

  private async findArticles(params: {
    onlyPublished: boolean;
    articleIds?: string[];
  }): Promise<RagArticle[]> {
    const articles = await this.prisma.article.findMany({
      where: {
        ...(params.onlyPublished
          ? { status: toPrismaArticleStatus(ArticleStatus.PUBLISHED) as any }
          : {}),
        ...(params.articleIds?.length ? { id: { in: params.articleIds } } : {}),
      },
      include: { tags: true },
      orderBy: { id: 'asc' },
    });

    return articles.map((article) => ({
      id: article.id,
      title: article.title,
      content: article.content,
      status: fromPrismaArticleStatus(article.status),
      categoryId: article.categoryId,
      tags: article.tags.map((tag) => tag.name).sort(),
      updatedAt: article.updatedAt.getTime(),
    }));
  }

  private buildGroundedPrompt(
    question: string,
    chunks: RetrievedChunk[],
    conversationId: string,
  ): string {
    const context = chunks
      .map(
        (chunk, index) =>
          `[Source ${index + 1}] Article: ${chunk.articleTitle} (${chunk.articleId})\n${chunk.chunk}`,
      )
      .join('\n\n');
    const history = this.conversations
      .getHistory(conversationId)
      .map((message) => `${message.role}: ${message.content}`)
      .join('\n');

    return [
      'You are the Knowledge Hub assistant.',
      'Answer the user question using only the provided article sources.',
      'If the sources do not contain the answer, say that the knowledge base does not contain enough information.',
      'Cite the relevant source numbers in the answer.',
      '',
      history ? `Conversation history:\n${history}\n` : '',
      `Sources:\n${context || 'No relevant sources were retrieved.'}`,
      '',
      `Question: ${question}`,
      'Answer:',
    ].join('\n');
  }
}
