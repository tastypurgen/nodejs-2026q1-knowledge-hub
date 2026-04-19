import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ArticleStatus } from '../common/enums/article-status.enum';
import {
  fromPrismaArticleStatus,
  toPrismaArticleStatus,
} from '../common/utils/prisma-enum.util';
import type { Article } from './models/article.model';

export interface ArticleFilters {
  status?: ArticleStatus;
  categoryId?: string;
  tag?: string;
}

@Injectable()
export class ArticleRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapArticle(article: any): Article {
    return {
      id: article.id,
      title: article.title,
      content: article.content,
      status: fromPrismaArticleStatus(article.status),
      authorId: article.authorId,
      categoryId: article.categoryId,
      tags: article.tags ? article.tags.map((t: any) => t.name) : [],
      createdAt: article.createdAt.getTime(),
      updatedAt: article.updatedAt.getTime(),
    };
  }

  async findAll(filters?: ArticleFilters): Promise<Article[]> {
    const where: any = {};
    
    if (filters?.status) {
      where.status = toPrismaArticleStatus(filters.status);
    }
    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }
    if (filters?.tag) {
      where.tags = { some: { name: filters.tag } };
    }

    const articles = await this.prisma.article.findMany({
      where,
      include: { tags: true },
    });

    return articles.map((a) => this.mapArticle(a));
  }

  async findById(id: string): Promise<Article | undefined> {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: { tags: true },
    });
    return article ? this.mapArticle(article) : undefined;
  }

  async create(
    data: Pick<Article, 'title' | 'content' | 'status' | 'authorId' | 'categoryId' | 'tags'>,
  ): Promise<Article> {
    const tagData = data.tags?.map((tagName) => ({
      where: { name: tagName },
      create: { name: tagName },
    })) || [];

    const article = await this.prisma.article.create({
      data: {
        title: data.title,
        content: data.content,
        status: toPrismaArticleStatus(data.status) as any,
        authorId: data.authorId ?? null,
        categoryId: data.categoryId ?? null,
        tags: {
          connectOrCreate: tagData,
        },
      },
      include: { tags: true },
    });

    return this.mapArticle(article);
  }

  async update(id: string, data: Partial<Omit<Article, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Article | undefined> {
    const existing = await this.findById(id);
    if (!existing) {
      return undefined;
    }

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.status !== undefined) updateData.status = toPrismaArticleStatus(data.status) as any;
    if (data.authorId !== undefined) updateData.authorId = data.authorId;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;

    if (data.tags !== undefined) {
      const tagData = data.tags.map((tagName) => ({
        where: { name: tagName },
        create: { name: tagName },
      }));
      updateData.tags = {
        set: [],
        connectOrCreate: tagData,
      };
    }

    const article = await this.prisma.article.update({
      where: { id },
      data: updateData,
      include: { tags: true },
    });

    return this.mapArticle(article);
  }

  async delete(id: string): Promise<Article | undefined> {
    const existing = await this.findById(id);
    if (!existing) {
      return undefined;
    }

    const deletedArticle = await this.prisma.article.delete({
      where: { id },
      include: { tags: true },
    });
    return this.mapArticle(deletedArticle);
  }
}
