import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { ArticleService } from '../article/article.service';
import { AnalyzeTask } from './dto/analyze-article.dto';
import { GeneratePromptDto } from './dto/generate-prompt.dto';
import { SummaryLength } from './dto/summarize-article.dto';
import { TranslateArticleDto } from './dto/translate-article.dto';
import { AiCacheService } from './ai-cache.service';
import { GeminiService } from './gemini.service';
import { AiUsageService } from './ai-usage.service';
import {
  AnalyzeArticleResponseDto,
  GeneratePromptResponseDto,
  SummarizeArticleResponseDto,
  TranslateArticleResponseDto,
} from './models/ai-response.model';
import {
  buildAnalyzePrompt,
  buildGenericPrompt,
  buildSummarizePrompt,
  buildTranslatePrompt,
} from './prompts/article.prompts';

interface ParsedTranslateResponse {
  translatedText: string;
  detectedLanguage: string;
}

interface ParsedAnalyzeResponse {
  analysis: string;
  suggestions: string[];
  severity: 'info' | 'warning' | 'error';
}

interface ConversationTurn {
  prompt: string;
  response: string;
}

@Injectable()
export class AiService {
  private readonly conversations = new Map<string, ConversationTurn[]>();

  constructor(
    private readonly articleService: ArticleService,
    private readonly cache: AiCacheService,
    private readonly gemini: GeminiService,
    private readonly usage: AiUsageService,
  ) {}

  async summarizeArticle(
    articleId: string,
    maxLength: SummaryLength,
  ): Promise<SummarizeArticleResponseDto> {
    this.usage.recordRequest('summarize');
    const article = await this.articleService.findOne(articleId);
    const cacheKey = this.cacheKey('summarize', article.id, article.updatedAt, { maxLength });
    const cached = this.cache.get<SummarizeArticleResponseDto>(cacheKey);

    if (cached) {
      return cached;
    }

    const summary = await this.gemini.generateText(
      buildSummarizePrompt(article.title, article.content, maxLength),
    );
    const result = {
      articleId: article.id,
      summary,
      originalLength: article.content.length,
      summaryLength: summary.length,
    };

    this.cache.set(cacheKey, result);
    return result;
  }

  async translateArticle(
    articleId: string,
    dto: TranslateArticleDto,
  ): Promise<TranslateArticleResponseDto> {
    this.usage.recordRequest('translate');
    const article = await this.articleService.findOne(articleId);
    const cacheKey = this.cacheKey('translate', article.id, article.updatedAt, {
      sourceLanguage: dto.sourceLanguage ?? null,
      targetLanguage: dto.targetLanguage,
    });
    const cached = this.cache.get<TranslateArticleResponseDto>(cacheKey);

    if (cached) {
      return cached;
    }

    const responseText = await this.gemini.generateText(
      buildTranslatePrompt(article.title, article.content, dto.targetLanguage, dto.sourceLanguage),
      { responseMimeType: 'application/json' },
    );
    const parsed = this.parseTranslateResponse(responseText, dto.sourceLanguage);
    const result = {
      articleId: article.id,
      translatedText: parsed.translatedText,
      detectedLanguage: parsed.detectedLanguage,
    };

    this.cache.set(cacheKey, result);
    return result;
  }

  async analyzeArticle(articleId: string, task: AnalyzeTask): Promise<AnalyzeArticleResponseDto> {
    this.usage.recordRequest('analyze');
    const article = await this.articleService.findOne(articleId);
    const responseText = await this.gemini.generateText(
      buildAnalyzePrompt(article.title, article.content, task),
      { responseMimeType: 'application/json' },
    );
    const parsed = this.parseAnalyzeResponse(responseText);

    return {
      articleId: article.id,
      analysis: parsed.analysis,
      suggestions: parsed.suggestions,
      severity: parsed.severity,
    };
  }

  async generate(dto: GeneratePromptDto): Promise<GeneratePromptResponseDto> {
    this.usage.recordRequest('generate');
    const sessionId = dto.sessionId ?? randomUUID();
    const history = this.conversations.get(sessionId) ?? [];
    const context = history
      .slice(-4)
      .map((turn) => [`User: ${turn.prompt}`, `Assistant: ${turn.response}`].join('\n'))
      .join('\n\n');
    const prompt = context
      ? buildGenericPrompt([`Conversation so far:\n${context}`, `New request:\n${dto.prompt}`].join('\n\n'))
      : buildGenericPrompt(dto.prompt);
    const text = await this.gemini.generateText(prompt);

    this.conversations.set(sessionId, [...history, { prompt: dto.prompt, response: text }].slice(-8));

    return { text, sessionId };
  }

  private cacheKey(endpoint: string, articleId: string, updatedAt: number, params: object): string {
    return JSON.stringify({ articleId, endpoint, params, updatedAt });
  }

  private parseTranslateResponse(text: string, sourceLanguage?: string): ParsedTranslateResponse {
    const parsed = this.parseJsonObject(text);

    if (this.isRecord(parsed) && typeof parsed.translatedText === 'string') {
      return {
        translatedText: parsed.translatedText,
        detectedLanguage:
          typeof parsed.detectedLanguage === 'string'
            ? parsed.detectedLanguage
            : sourceLanguage ?? 'unknown',
      };
    }

    return {
      translatedText: text,
      detectedLanguage: sourceLanguage ?? 'unknown',
    };
  }

  private parseAnalyzeResponse(text: string): ParsedAnalyzeResponse {
    const parsed = this.parseJsonObject(text);

    if (this.isRecord(parsed) && typeof parsed.analysis === 'string') {
      return {
        analysis: parsed.analysis,
        suggestions: this.parseSuggestions(parsed.suggestions),
        severity: this.parseSeverity(parsed.severity),
      };
    }

    return {
      analysis: text,
      suggestions: ['Review the generated analysis manually because Gemini did not return structured JSON.'],
      severity: 'warning',
    };
  }

  private parseJsonObject(text: string): unknown {
    const cleaned = text
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '');

    try {
      return JSON.parse(cleaned) as unknown;
    } catch {
      return undefined;
    }
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private parseSuggestions(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  }

  private parseSeverity(value: unknown): 'info' | 'warning' | 'error' {
    return value === 'info' || value === 'warning' || value === 'error' ? value : 'info';
  }
}
