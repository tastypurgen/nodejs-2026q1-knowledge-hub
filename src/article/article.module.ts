import { Module, forwardRef } from '@nestjs/common';

import { CommentModule } from '../comment/comment.module';
import { ArticleController } from './article.controller';
import { ArticleRepository } from './article.repository';
import { ArticleService } from './article.service';

@Module({
  imports: [forwardRef(() => CommentModule)],
  controllers: [ArticleController],
  providers: [ArticleRepository, ArticleService],
  exports: [ArticleService],
})
export class ArticleModule {}
