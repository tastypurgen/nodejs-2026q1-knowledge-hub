import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Category } from './models/category.model';

@Injectable()
export class CategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapCategory(category: any): Category {
    return {
      id: category.id,
      name: category.name,
      description: category.description ?? '',
    };
  }

  async findAll(): Promise<Category[]> {
    const categories = await this.prisma.category.findMany();
    return categories.map(this.mapCategory);
  }

  async findById(id: string): Promise<Category | null> {
    const category = await this.prisma.category.findUnique({ where: { id } });
    return category ? this.mapCategory(category) : null;
  }

  async create(data: Pick<Category, 'name' | 'description'>): Promise<Category> {
    const category = await this.prisma.category.create({
      data: {
        name: data.name,
        description: data.description,
      },
    });
    return this.mapCategory(category);
  }

  async update(id: string, data: Partial<Pick<Category, 'name' | 'description'>>): Promise<Category | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    const category = await this.prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
      },
    });
    return this.mapCategory(category);
  }

  async delete(id: string): Promise<Category | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    const category = await this.prisma.category.delete({ where: { id } });
    return this.mapCategory(category);
  }
}
