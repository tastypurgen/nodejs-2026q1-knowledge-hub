import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SummarizeArticleResponseDto {
  @ApiProperty()
  articleId!: string;

  @ApiProperty()
  summary!: string;

  @ApiProperty()
  originalLength!: number;

  @ApiProperty()
  summaryLength!: number;
}

export class TranslateArticleResponseDto {
  @ApiProperty()
  articleId!: string;

  @ApiProperty()
  translatedText!: string;

  @ApiProperty()
  detectedLanguage!: string;
}

export class AnalyzeArticleResponseDto {
  @ApiProperty()
  articleId!: string;

  @ApiProperty()
  analysis!: string;

  @ApiProperty({ type: [String] })
  suggestions!: string[];

  @ApiProperty({ enum: ['info', 'warning', 'error'] })
  severity!: 'info' | 'warning' | 'error';
}

export class GeneratePromptResponseDto {
  @ApiProperty()
  text!: string;

  @ApiProperty()
  sessionId!: string;
}

export class AiUsageResponseDto {
  @ApiProperty()
  totalRequests!: number;

  @ApiProperty({ type: Object })
  requestsByEndpoint!: Record<string, number>;

  @ApiProperty()
  totalPromptTokens!: number;

  @ApiProperty()
  totalCompletionTokens!: number;

  @ApiProperty()
  totalTokens!: number;

  @ApiPropertyOptional()
  averageLatencyMs?: number;

  @ApiProperty()
  cacheHits!: number;

  @ApiProperty()
  cacheMisses!: number;

  @ApiProperty()
  cacheHitRatio!: number;
}
