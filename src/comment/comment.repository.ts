import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import type { Comment } from './models/comment.model';

@Injectable()
export class CommentRepository {
  private readonly comments: Comment[] = [];

  findAll(): Comment[] {
    return [...this.comments];
  }

  findById(id: string): Comment | undefined {
    return this.comments.find((comment) => comment.id === id);
  }

  findByArticleId(articleId: string): Comment[] {
    return this.comments.filter((comment) => comment.articleId === articleId);
  }

  create(data: Pick<Comment, 'content' | 'articleId' | 'authorId'>): Comment {
    const comment: Comment = {
      id: randomUUID(),
      content: data.content,
      articleId: data.articleId,
      authorId: data.authorId ?? null,
      createdAt: Date.now(),
    };

    this.comments.push(comment);
    return comment;
  }

  delete(id: string): Comment | undefined {
    const index = this.comments.findIndex((comment) => comment.id === id);
    if (index === -1) {
      return undefined;
    }

    const [deletedComment] = this.comments.splice(index, 1);
    return deletedComment;
  }

  deleteByAuthorId(authorId: string): void {
    const remainingComments = this.comments.filter((comment) => comment.authorId !== authorId);
    this.comments.splice(0, this.comments.length, ...remainingComments);
  }

  deleteByArticleId(articleId: string): void {
    const remainingComments = this.comments.filter((comment) => comment.articleId !== articleId);
    this.comments.splice(0, this.comments.length, ...remainingComments);
  }
}
