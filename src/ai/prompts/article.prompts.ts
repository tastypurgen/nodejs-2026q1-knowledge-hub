import { AnalyzeTask } from '../dto/analyze-article.dto';
import { SummaryLength } from '../dto/summarize-article.dto';

const summaryInstructions: Record<SummaryLength, string> = {
  [SummaryLength.SHORT]: 'Return 2-3 concise sentences.',
  [SummaryLength.MEDIUM]: 'Return one compact paragraph with the most important ideas.',
  [SummaryLength.DETAILED]: 'Return 3-5 paragraphs with key details and context preserved.',
};

const analysisInstructions: Record<AnalyzeTask, string> = {
  [AnalyzeTask.REVIEW]: 'Review the article for clarity, correctness, structure, and usefulness.',
  [AnalyzeTask.BUGS]: 'Focus on factual errors, contradictions, missing assumptions, and risky technical claims.',
  [AnalyzeTask.OPTIMIZE]: 'Focus on improvements that make the article more concise, searchable, and actionable.',
  [AnalyzeTask.EXPLAIN]: 'Explain the article content and point out concepts readers may need clarified.',
};

export function buildSummarizePrompt(title: string, content: string, maxLength: SummaryLength): string {
  return [
    'You summarize Knowledge Hub articles for readers.',
    summaryInstructions[maxLength],
    'Return only the summary text. Do not include markdown headings.',
    '',
    `Title: ${title}`,
    '',
    'Article content:',
    content,
  ].join('\n');
}

export function buildTranslatePrompt(
  title: string,
  content: string,
  targetLanguage: string,
  sourceLanguage?: string,
): string {
  const sourceInstruction = sourceLanguage
    ? `The source language is ${sourceLanguage}.`
    : 'Detect the source language.';

  return [
    'Translate this Knowledge Hub article.',
    sourceInstruction,
    `Translate the article content into ${targetLanguage}.`,
    'Return strict JSON with exactly these fields:',
    '{"translatedText":"...","detectedLanguage":"..."}',
    'Do not wrap the JSON in markdown.',
    '',
    `Title: ${title}`,
    '',
    'Article content:',
    content,
  ].join('\n');
}

export function buildAnalyzePrompt(title: string, content: string, task: AnalyzeTask): string {
  return [
    'Analyze this Knowledge Hub article and return strict JSON.',
    analysisInstructions[task],
    'Use this exact shape:',
    '{"analysis":"...","suggestions":["..."],"severity":"info|warning|error"}',
    'Severity must be info for minor or explanatory feedback, warning for meaningful issues, and error for severe correctness or safety problems.',
    'Provide 2-6 concrete suggestions. Do not wrap the JSON in markdown.',
    '',
    `Title: ${title}`,
    '',
    'Article content:',
    content,
  ].join('\n');
}

export function buildGenericPrompt(prompt: string): string {
  return [
    'You are an assistant for a Knowledge Hub API. Provide a practical, concise answer.',
    'Avoid exposing secrets or claiming access to private data not provided in the prompt.',
    '',
    prompt,
  ].join('\n');
}
