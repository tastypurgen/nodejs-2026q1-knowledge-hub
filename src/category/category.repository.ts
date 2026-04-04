import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import type { Category } from './models/category.model';

@Injectable()
export class CategoryRepository {
  private readonly categories: Category[] = [];

  findAll(): Category[] {
    return [...this.categories];
  }

  findById(id: string): Category | undefined {
    return this.categories.find((category) => category.id === id);
  }

  create(data: Pick<Category, 'name' | 'description'>): Category {
    const category: Category = {
      id: randomUUID(),
      name: data.name,
      description: data.description,
    };

    this.categories.push(category);
    return category;
  }

  update(id: string, data: Partial<Pick<Category, 'name' | 'description'>>): Category | undefined {
    const category = this.findById(id);
    if (!category) {
      return undefined;
    }

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        Object.assign(category, { [key]: value });
      }
    }

    return category;
  }

  delete(id: string): Category | undefined {
    const index = this.categories.findIndex((category) => category.id === id);
    if (index === -1) {
      return undefined;
    }

    const [deletedCategory] = this.categories.splice(index, 1);
    return deletedCategory;
  }
}
