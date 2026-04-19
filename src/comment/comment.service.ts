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

  async findAll(query: CommentListQueryDto) {
    const comments = (await this.commentRepository.findByArticleId(query.articleId))
      .map((comment) => new CommentResponseDto(comment));

    return applyCollectionQuery(comments, query);
  }

  async findOne(id: string): Promise<CommentResponseDto> {
    const comment = await this.commentRepository.findById(id);
    if (!comment) {
      throw new NotFoundException(`Comment with id ${id} not found`);
    }

    return new CommentResponseDto(comment);
  }

  async create(dto: CreateCommentDto): Promise<CommentResponseDto> {
    if (!(await this.articleService.exists(dto.articleId))) {
      throw new UnprocessableEntityException(
        `Article with id ${dto.articleId} does not exist`,
      );
    }

    const comment = await this.commentRepository.create({
      content: dto.content,
      articleId: dto.articleId,
      authorId: dto.authorId ?? null,
    });

    return new CommentResponseDto(comment);
  }

  async remove(id: string): Promise<void> {
    const deletedComment = await this.commentRepository.delete(id);
    if (!deletedComment) {
      throw new NotFoundException(`Comment with id ${id} not found`);
    }
  }
}
