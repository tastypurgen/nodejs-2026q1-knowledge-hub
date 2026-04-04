import { Module, forwardRef } from '@nestjs/common';

import { ArticleModule } from '../article/article.module';
import { CommentModule } from '../comment/comment.module';
import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';

@Module({
  imports: [forwardRef(() => ArticleModule), forwardRef(() => CommentModule)],
  controllers: [UserController],
  providers: [UserRepository, UserService],
  exports: [UserService],
})
export class UserModule {}
