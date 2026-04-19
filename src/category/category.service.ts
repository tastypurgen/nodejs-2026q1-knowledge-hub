import { Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';

import { ArticleService } from '../article/article.service';
import { applyCollectionQuery } from '../common/utils/collection-query.util';
import type { CategoryListQueryDto } from './dto/category-list-query.dto';
import type { CreateCategoryDto } from './dto/create-category.dto';
import type { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryResponseDto } from './models/category.model';
import { CategoryRepository } from './category.repository';

@Injectable()
export class CategoryService {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    @Inject(forwardRef(() => ArticleService))
    private readonly articleService: ArticleService,
  ) {}

  findAll(query: CategoryListQueryDto) {
    const categories = this.categoryRepository
      .findAll()
      .map((category) => new CategoryResponseDto(category));

    return applyCollectionQuery(categories, query);
  }

  findOne(id: string): CategoryResponseDto {
    const category = this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }

    return new CategoryResponseDto(category);
  }

  create(dto: CreateCategoryDto): CategoryResponseDto {
    const category = this.categoryRepository.create(dto);
    return new CategoryResponseDto(category);
  }

  update(id: string, dto: UpdateCategoryDto): CategoryResponseDto {
    const category = this.categoryRepository.update(id, dto);
    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }

    return new CategoryResponseDto(category);
  }

  remove(id: string): void {
    const deletedCategory = this.categoryRepository.delete(id);
    if (!deletedCategory) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }

    this.articleService.clearCategoryByCategory(id);
  }
}
