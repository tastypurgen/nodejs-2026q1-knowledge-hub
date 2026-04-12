import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Comment } from './models/comment.model';

@Injectable()
export class CommentRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapComment(comment: any): Comment {
    return {
      id: comment.id,
      content: comment.content,
      articleId: comment.articleId,
      authorId: comment.authorId,
      createdAt: comment.createdAt.getTime(),
    };
  }

  async findAll(): Promise<Comment[]> {
    const comments = await this.prisma.comment.findMany();
    return comments.map(this.mapComment);
  }

  async findById(id: string): Promise<Comment | undefined> {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    return comment ? this.mapComment(comment) : undefined;
  }

  async findByArticleId(articleId: string): Promise<Comment[]> {
    const comments = await this.prisma.comment.findMany({ where: { articleId } });
    return comments.map(this.mapComment);
  }

  async create(data: Pick<Comment, 'content' | 'articleId' | 'authorId'>): Promise<Comment> {
    const comment = await this.prisma.comment.create({
      data: {
        content: data.content,
        articleId: data.articleId,
        authorId: data.authorId ?? null,
      },
    });
    return this.mapComment(comment);
  }

  async delete(id: string): Promise<Comment | undefined> {
    const comment = await this.findById(id);
    if (!comment) {
      return undefined;
    }

    const deletedComment = await this.prisma.comment.delete({ where: { id } });
    return this.mapComment(deletedComment);
  }
}
