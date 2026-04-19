import {
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
  forwardRef,
} from '@nestjs/common';

import { ArticleService } from '../article/article.service';
import { applyCollectionQuery } from '../common/utils/collection-query.util';
import type { CommentListQueryDto } from './dto/comment-list-query.dto';
import type { CreateCommentDto } from './dto/create-comment.dto';
import { CommentResponseDto } from './models/comment.model';
import { CommentRepository } from './comment.repository';

@Injectable()
export class CommentService {
  constructor(
    private readonly commentRepository: CommentRepository,
    @Inject(forwardRef(() => ArticleService))
    private readonly articleService: ArticleService,
  ) {}

  findAll(query: CommentListQueryDto) {
    const comments = this.commentRepository
      .findByArticleId(query.articleId)
      .map((comment) => new CommentResponseDto(comment));

    return applyCollectionQuery(comments, query);
  }

  create(dto: CreateCommentDto): CommentResponseDto {
    if (!this.articleService.exists(dto.articleId)) {
      throw new UnprocessableEntityException(
        `Article with id ${dto.articleId} does not exist`,
      );
    }

    const comment = this.commentRepository.create({
      content: dto.content,
      articleId: dto.articleId,
      authorId: dto.authorId ?? null,
    });

    return new CommentResponseDto(comment);
  }

  remove(id: string): void {
    const deletedComment = this.commentRepository.delete(id);
    if (!deletedComment) {
      throw new NotFoundException(`Comment with id ${id} not found`);
    }
  }

  removeByAuthor(authorId: string): void {
    this.commentRepository.deleteByAuthorId(authorId);
  }

  removeByArticle(articleId: string): void {
    this.commentRepository.deleteByArticleId(articleId);
  }
}
