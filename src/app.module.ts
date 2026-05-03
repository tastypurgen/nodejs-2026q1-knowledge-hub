import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { AiModule } from './ai/ai.module';
import { ArticleModule } from './article/article.module';
import { CategoryModule } from './category/category.module';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';
import { CommentModule } from './comment/comment.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [PrismaModule, UserModule, ArticleModule, CategoryModule, CommentModule, AiModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
