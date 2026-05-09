import { ArticleStatus } from '../common/enums/article-status.enum';

export interface RagArticle {
  id: string;
  title: string;
  content: string;
  status: ArticleStatus;
  categoryId: string | null;
  tags: string[];
  updatedAt: number;
}

export interface ArticleChunk {
  id: string;
  articleId: string;
  articleTitle: string;
  articleStatus: ArticleStatus;
  categoryId: string | null;
  tags: string[];
  chunkIndex: number;
  chunk: string;
  contentHash: string;
  updatedAt: number;
}

export interface RetrievedChunk {
  articleId: string;
  articleTitle: string;
  articleStatus?: ArticleStatus;
  categoryId?: string | null;
  tags?: string[];
  chunk: string;
  similarity: number;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
}

export interface RagSearchFilters {
  articleStatus?: ArticleStatus;
  categoryId?: string;
  tags?: string[];
}
