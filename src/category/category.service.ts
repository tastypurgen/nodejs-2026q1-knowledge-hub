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

  async findAll(query: CategoryListQueryDto) {
    const categories = (await this.categoryRepository.findAll()).map(
      (category) => new CategoryResponseDto(category),
    );

    return applyCollectionQuery(categories, query);
  }

  async findOne(id: string): Promise<CategoryResponseDto> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }

    return new CategoryResponseDto(category);
  }

  async create(dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    const category = await this.categoryRepository.create(dto);
    return new CategoryResponseDto(category);
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<CategoryResponseDto> {
    const category = await this.categoryRepository.update(id, dto);
    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }

    return new CategoryResponseDto(category);
  }

  async remove(id: string): Promise<void> {
    const deletedCategory = await this.categoryRepository.delete(id);
    if (!deletedCategory) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }

    // Cascade is handled by Prisma via SetNull
  }
}
