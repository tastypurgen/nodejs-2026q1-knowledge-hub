import { Module, forwardRef } from '@nestjs/common';

import { ArticleModule } from '../article/article.module';
import { CommentController } from './comment.controller';
import { CommentRepository } from './comment.repository';
import { CommentService } from './comment.service';

@Module({
  imports: [forwardRef(() => ArticleModule)],
  controllers: [CommentController],
  providers: [CommentRepository, CommentService],
  exports: [CommentService],
})
export class CommentModule {}
