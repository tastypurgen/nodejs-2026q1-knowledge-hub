import { Module } from '@nestjs/common';

import { ArticleModule } from '../article/article.module';
import { AiCacheService } from './ai-cache.service';
import { AiConfigService } from './ai-config.service';
import { AiController } from './ai.controller';
import { AiRateLimitGuard } from './ai-rate-limit.guard';
import { AiRateLimitService } from './ai-rate-limit.service';
import { AiService } from './ai.service';
import { AiUsageService } from './ai-usage.service';
import { GeminiService } from './gemini.service';

@Module({
  imports: [ArticleModule],
  controllers: [AiController],
  providers: [
    AiCacheService,
    AiConfigService,
    AiRateLimitGuard,
    AiRateLimitService,
    AiService,
    AiUsageService,
    GeminiService,
  ],
})
export class AiModule {}
