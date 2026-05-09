import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { AiRateLimitGuard } from './ai-rate-limit.guard';
import { AiService } from './ai.service';
import { AiUsageService } from './ai-usage.service';
import { AnalyzeArticleDto } from './dto/analyze-article.dto';
import { GeneratePromptDto } from './dto/generate-prompt.dto';
import { SummarizeArticleDto } from './dto/summarize-article.dto';
import { TranslateArticleDto } from './dto/translate-article.dto';
import {
  AiUsageResponseDto,
  AnalyzeArticleResponseDto,
  GeneratePromptResponseDto,
  SummarizeArticleResponseDto,
  TranslateArticleResponseDto,
} from './models/ai-response.model';

@ApiTags('ai')
@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly usageService: AiUsageService,
  ) {}

  @Post('articles/:articleId/summarize')
  @UseGuards(AiRateLimitGuard)
  @ApiOkResponse({ type: SummarizeArticleResponseDto })
  summarizeArticle(
    @Param('articleId', new ParseUUIDPipe({ version: '4' })) articleId: string,
    @Body() dto: SummarizeArticleDto,
  ): Promise<SummarizeArticleResponseDto> {
    return this.aiService.summarizeArticle(articleId, dto.maxLength);
  }

  @Post('articles/:articleId/translate')
  @UseGuards(AiRateLimitGuard)
  @ApiOkResponse({ type: TranslateArticleResponseDto })
  translateArticle(
    @Param('articleId', new ParseUUIDPipe({ version: '4' })) articleId: string,
    @Body() dto: TranslateArticleDto,
  ): Promise<TranslateArticleResponseDto> {
    return this.aiService.translateArticle(articleId, dto);
  }

  @Post('articles/:articleId/analyze')
  @UseGuards(AiRateLimitGuard)
  @ApiOkResponse({ type: AnalyzeArticleResponseDto })
  analyzeArticle(
    @Param('articleId', new ParseUUIDPipe({ version: '4' })) articleId: string,
    @Body() dto: AnalyzeArticleDto,
  ): Promise<AnalyzeArticleResponseDto> {
    return this.aiService.analyzeArticle(articleId, dto.task);
  }

  @Post('generate')
  @UseGuards(AiRateLimitGuard)
  @ApiOkResponse({ type: GeneratePromptResponseDto })
  generate(@Body() dto: GeneratePromptDto): Promise<GeneratePromptResponseDto> {
    return this.aiService.generate(dto);
  }

  @Get('usage')
  @ApiOkResponse({ type: AiUsageResponseDto })
  usage(): AiUsageResponseDto {
    return this.usageService.snapshot();
  }
}
