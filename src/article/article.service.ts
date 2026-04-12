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

  async findAll(query: ArticleListQueryDto) {
    const filteredArticles = (await this.articleRepository.findAll({
      status: query.status,
      categoryId: query.categoryId,
      tag: query.tag,
    })).map((article) => new ArticleResponseDto(article));

    return applyCollectionQuery(filteredArticles, query);
  }

  async findOne(id: string): Promise<ArticleResponseDto> {
    const article = await this.articleRepository.findById(id);
    if (!article) {
      throw new NotFoundException(`Article with id ${id} not found`);
    }

    return new ArticleResponseDto(article);
  }

  async create(dto: CreateArticleDto): Promise<ArticleResponseDto> {
    const article = await this.articleRepository.create({
      title: dto.title,
      content: dto.content,
      status: dto.status,
      authorId: dto.authorId ?? null,
      categoryId: dto.categoryId ?? null,
      tags: dto.tags ?? [],
    });

    return new ArticleResponseDto(article);
  }

  async update(id: string, dto: UpdateArticleDto): Promise<ArticleResponseDto> {
    const updatedArticle = await this.articleRepository.update(id, {
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

  async remove(id: string): Promise<void> {
    const deletedArticle = await this.articleRepository.delete(id);
    if (!deletedArticle) {
      throw new NotFoundException(`Article with id ${id} not found`);
    }
  }

  async exists(id: string): Promise<boolean> {
    return !!(await this.articleRepository.findById(id));
  }
}
