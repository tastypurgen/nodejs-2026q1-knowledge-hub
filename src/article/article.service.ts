import {
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';

import { applyCollectionQuery } from '../common/utils/collection-query.util';
import { CommentService } from '../comment/comment.service';
import type { ArticleListQueryDto } from './dto/article-list-query.dto';
import type { CreateArticleDto } from './dto/create-article.dto';
import type { UpdateArticleDto } from './dto/update-article.dto';
import { ArticleResponseDto } from './models/article.model';
import { ArticleRepository } from './article.repository';

@Injectable()
export class ArticleService {
  constructor(
    private readonly articleRepository: ArticleRepository,
    @Inject(forwardRef(() => CommentService))
    private readonly commentService: CommentService,
  ) {}

  findAll(query: ArticleListQueryDto) {
    const filteredArticles = this.articleRepository
      .findAll()
      .filter((article) => !query.status || article.status === query.status)
      .filter((article) => !query.categoryId || article.categoryId === query.categoryId)
      .filter((article) => !query.tag || article.tags.includes(query.tag))
      .map((article) => new ArticleResponseDto(article));

    return applyCollectionQuery(filteredArticles, query);
  }

  findOne(id: string): ArticleResponseDto {
    const article = this.articleRepository.findById(id);
    if (!article) {
      throw new NotFoundException(`Article with id ${id} not found`);
    }

    return new ArticleResponseDto(article);
  }

  create(dto: CreateArticleDto): ArticleResponseDto {
    const article = this.articleRepository.create({
      title: dto.title,
      content: dto.content,
      status: dto.status,
      authorId: dto.authorId ?? null,
      categoryId: dto.categoryId ?? null,
      tags: dto.tags ?? [],
    });

    return new ArticleResponseDto(article);
  }

  update(id: string, dto: UpdateArticleDto): ArticleResponseDto {
    const updatedArticle = this.articleRepository.update(id, {
      title: dto.title,
      content: dto.content,
      status: dto.status,
      authorId: dto.authorId,
      categoryId: dto.categoryId,
      tags: dto.tags,
    });
    if (!updatedArticle) {
      throw new NotFoundException(`Article with id ${id} not found`);
    }

    return new ArticleResponseDto(updatedArticle);
  }

  remove(id: string): void {
    const deletedArticle = this.articleRepository.delete(id);
    if (!deletedArticle) {
      throw new NotFoundException(`Article with id ${id} not found`);
    }

    this.commentService.removeByArticle(id);
  }

  exists(id: string): boolean {
    return !!this.articleRepository.findById(id);
  }

  clearAuthorByUser(userId: string): void {
    for (const article of this.articleRepository.findAll()) {
      if (article.authorId === userId) {
        this.articleRepository.update(article.id, { authorId: null });
      }
    }
  }

  clearCategoryByCategory(categoryId: string): void {
    for (const article of this.articleRepository.findAll()) {
      if (article.categoryId === categoryId) {
        this.articleRepository.update(article.id, { categoryId: null });
      }
    }
  }
}
