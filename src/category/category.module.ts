import { Module, forwardRef } from '@nestjs/common';

import { ArticleModule } from '../article/article.module';
import { CategoryController } from './category.controller';
import { CategoryRepository } from './category.repository';
import { CategoryService } from './category.service';

@Module({
  imports: [forwardRef(() => ArticleModule)],
  controllers: [CategoryController],
  providers: [CategoryRepository, CategoryService],
  exports: [CategoryService],
})
export class CategoryModule {}
