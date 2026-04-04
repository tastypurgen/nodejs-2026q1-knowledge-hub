import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { ArticleStatus } from '../common/enums/article-status.enum';
import type { Article } from './models/article.model';

@Injectable()
export class ArticleRepository {
  private readonly articles: Article[] = [];

  findAll(): Article[] {
    return [...this.articles];
  }

  findById(id: string): Article | undefined {
    return this.articles.find((article) => article.id === id);
  }

  create(
    data: Pick<Article, 'title' | 'content' | 'status' | 'authorId' | 'categoryId' | 'tags'>,
  ): Article {
    const timestamp = Date.now();
    const article: Article = {
      id: randomUUID(),
      title: data.title,
      content: data.content,
      status: data.status ?? ArticleStatus.DRAFT,
      authorId: data.authorId ?? null,
      categoryId: data.categoryId ?? null,
      tags: data.tags ?? [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.articles.push(article);
    return article;
  }

  update(id: string, data: Partial<Omit<Article, 'id' | 'createdAt' | 'updatedAt'>>): Article | undefined {
    const article = this.findById(id);
    if (!article) {
      return undefined;
    }

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        Object.assign(article, { [key]: value });
      }
    }

    article.updatedAt = Date.now();
    return article;
  }

  delete(id: string): Article | undefined {
    const index = this.articles.findIndex((article) => article.id === id);
    if (index === -1) {
      return undefined;
    }

    const [deletedArticle] = this.articles.splice(index, 1);
    return deletedArticle;
  }
}
