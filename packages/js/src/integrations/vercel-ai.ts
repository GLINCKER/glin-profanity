/**
 * Vercel AI SDK Integration for glin-profanity
 *
 * Provides ready-to-use tools for the Vercel AI SDK.
 * Compatible with Next.js, Remix, SvelteKit, and other frameworks.
 *
 * @example
 * ```typescript
 * import { generateText } from 'ai';
 * import { openai } from '@ai-sdk/openai';
 * import { profanityTools } from 'glin-profanity/ai/vercel';
 *
 * const { text, toolCalls } = await generateText({
 *   model: openai('gpt-4o'),
 *   prompt: 'Check if "Hello world" contains profanity',
 *   tools: profanityTools,
 * });
 * ```
 *
 * @packageDocumentation
 * @module glin-profanity/ai/vercel
 */

import { Filter } from '../filters/Filter';
import type { FilterConfig, Language, CheckProfanityResult } from '../types/types';

/**
 * Vercel AI SDK tool definition
 */
export interface VercelAITool<TInput = unknown, TOutput = unknown> {
  description: string;
  inputSchema: unknown;
  execute: (input: TInput) => Promise<TOutput>;
}

/**
 * Tool input types
 */
export interface CheckProfanityInput {
  text: string;
  languages?: string[];
  detectLeetspeak?: boolean;
  normalizeUnicode?: boolean;
}

export interface CensorTextInput {
  text: string;
  replacement?: string;
  languages?: string[];
}

export interface BatchCheckInput {
  texts: string[];
  languages?: string[];
  detectLeetspeak?: boolean;
}

export interface AnalyzeContextInput {
  text: string;
  languages?: string[];
  contextWindow?: number;
  confidenceThreshold?: number;
}

/**
 * Tool output types
 */
export interface CheckProfanityOutput {
  containsProfanity: boolean;
  profaneWords: string[];
  severityMap?: Record<string, number>;
  wordCount: number;
}

export interface CensorTextOutput {
  originalText: string;
  censoredText: string;
  profaneWordsFound: string[];
  wasModified: boolean;
}

export interface BatchCheckOutput {
  totalTexts: number;
  flaggedCount: number;
  cleanCount: number;
  results: Array<{
    index: number;
    text: string;
    containsProfanity: boolean;
    profaneWords: string[];
  }>;
}

export interface AnalyzeContextOutput {
  containsProfanity: boolean;
  profaneWords: string[];
  contextScore?: number;
  matches?: unknown[];
  reason?: string;
}

export interface SupportedLanguagesOutput {
  languages: string[];
  count: number;
}

/**
 * Supported languages list
 */
const SUPPORTED_LANGUAGES = [
  'arabic', 'chinese', 'czech', 'danish', 'dutch', 'english',
  'finnish', 'french', 'german', 'hindi', 'hungarian', 'italian',
  'japanese', 'korean', 'norwegian', 'polish', 'portuguese', 'russian',
  'spanish', 'swedish', 'thai', 'turkish', 'ukrainian', 'vietnamese'
] as const;

/**
 * Gets the Zod library (lazy load to avoid hard dependency)
 */
function getZod() {
  try {
    return require('zod');
  } catch {
    throw new Error('Zod is required for Vercel AI SDK tools. Install it with: npm install zod');
  }
}

/**
 * Creates a Filter instance with the given configuration
 */
function createFilter(config?: Partial<FilterConfig>): Filter {
  return new Filter({
    languages: (config?.languages || ['english']) as Language[],
    detectLeetspeak: config?.detectLeetspeak ?? true,
    normalizeUnicode: config?.normalizeUnicode ?? true,
    enableContextAware: config?.enableContextAware ?? false,
    contextWindow: config?.contextWindow ?? 3,
    confidenceThreshold: config?.confidenceThreshold ?? 0.7,
    replaceWith: config?.replaceWith,
    severityLevels: true,
    cacheResults: true,
  });
}

/**
 * Creates a profanity check tool for Vercel AI SDK
 *
 * @example
 * ```typescript
 * import { generateText, tool } from 'ai';
 * import { createCheckProfanityTool } from 'glin-profanity/ai/vercel';
 *
 * const { text } = await generateText({
 *   model: openai('gpt-4o'),
 *   prompt: 'Check this text for profanity: "Hello world"',
 *   tools: {
 *     checkProfanity: createCheckProfanityTool(),
 *   },
 * });
 * ```
 */
export function createCheckProfanityTool(): VercelAITool<CheckProfanityInput, CheckProfanityOutput> {
  const { z } = getZod();

  return {
    description: 'Check if text contains profanity. Returns detailed information about detected profane words, severity levels, and supports 24 languages with leetspeak and Unicode obfuscation detection.',
    inputSchema: z.object({
      text: z.string().describe('The text to check for profanity'),
      languages: z.array(z.string()).optional().describe('Languages to check against (e.g., ["english", "spanish"])'),
      detectLeetspeak: z.boolean().optional().describe('Enable leetspeak detection (e.g., "f4ck" → "fuck")'),
      normalizeUnicode: z.boolean().optional().describe('Enable Unicode homoglyph normalization'),
    }),
    execute: async (input) => {
      const filter = createFilter({
        languages: input.languages as Language[],
        detectLeetspeak: input.detectLeetspeak ?? true,
        normalizeUnicode: input.normalizeUnicode ?? true,
      });
      const result = filter.checkProfanity(input.text);
      return {
        containsProfanity: result.containsProfanity,
        profaneWords: result.profaneWords,
        severityMap: result.severityMap,
        wordCount: input.text.split(/\s+/).length,
      };
    },
  };
}

/**
 * Creates a censor text tool for Vercel AI SDK
 */
export function createCensorTextTool(): VercelAITool<CensorTextInput, CensorTextOutput> {
  const { z } = getZod();

  return {
    description: 'Censor profanity in text by replacing profane words with a replacement string. Returns the censored text and information about what was modified.',
    inputSchema: z.object({
      text: z.string().describe('The text to censor'),
      replacement: z.string().optional().describe('The character or string to replace profanity with. Defaults to "***".'),
      languages: z.array(z.string()).optional().describe('Languages to check against'),
    }),
    execute: async (input) => {
      const filter = createFilter({
        languages: input.languages as Language[],
        replaceWith: input.replacement || '***',
      });
      const result = filter.checkProfanity(input.text);
      return {
        originalText: input.text,
        censoredText: result.processedText || input.text,
        profaneWordsFound: result.profaneWords,
        wasModified: result.containsProfanity,
      };
    },
  };
}

/**
 * Creates a batch check tool for Vercel AI SDK
 */
export function createBatchCheckTool(): VercelAITool<BatchCheckInput, BatchCheckOutput> {
  const { z } = getZod();

  return {
    description: 'Check multiple texts for profanity in a single call. More efficient than checking texts individually.',
    inputSchema: z.object({
      texts: z.array(z.string()).describe('Array of texts to check for profanity'),
      languages: z.array(z.string()).optional().describe('Languages to check against'),
      detectLeetspeak: z.boolean().optional().describe('Enable leetspeak detection'),
    }),
    execute: async (input) => {
      const filter = createFilter({
        languages: input.languages as Language[],
        detectLeetspeak: input.detectLeetspeak ?? true,
      });
      const results = input.texts.map((text, index) => {
        const result = filter.checkProfanity(text);
        return {
          index,
          text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
          containsProfanity: result.containsProfanity,
          profaneWords: result.profaneWords,
        };
      });
      const flaggedCount = results.filter(r => r.containsProfanity).length;
      return {
        totalTexts: input.texts.length,
        flaggedCount,
        cleanCount: input.texts.length - flaggedCount,
        results,
      };
    },
  };
}

/**
 * Creates a context analysis tool for Vercel AI SDK
 */
export function createContextAnalysisTool(): VercelAITool<AnalyzeContextInput, AnalyzeContextOutput> {
  const { z } = getZod();

  return {
    description: 'Perform context-aware profanity analysis using NLP to distinguish between truly offensive content and false positives (e.g., "Scunthorpe" is not offensive).',
    inputSchema: z.object({
      text: z.string().describe('The text to analyze'),
      languages: z.array(z.string()).optional().describe('Languages to check against'),
      contextWindow: z.number().optional().describe('Number of words around a match to consider for context'),
      confidenceThreshold: z.number().optional().describe('Minimum confidence score (0-1) to flag as profanity'),
    }),
    execute: async (input) => {
      const filter = createFilter({
        languages: input.languages as Language[],
        enableContextAware: true,
        contextWindow: input.contextWindow ?? 3,
        confidenceThreshold: input.confidenceThreshold ?? 0.7,
      });
      const result = filter.checkProfanity(input.text);
      return {
        containsProfanity: result.containsProfanity,
        profaneWords: result.profaneWords,
        contextScore: result.contextScore,
        matches: result.matches,
        reason: result.reason,
      };
    },
  };
}

/**
 * Creates a supported languages tool for Vercel AI SDK
 */
export function createSupportedLanguagesTool(): VercelAITool<Record<string, never>, SupportedLanguagesOutput> {
  const { z } = getZod();

  return {
    description: 'Get the list of supported languages for profanity detection.',
    inputSchema: z.object({}),
    execute: async () => {
      return {
        languages: [...SUPPORTED_LANGUAGES],
        count: SUPPORTED_LANGUAGES.length,
      };
    },
  };
}

/**
 * Pre-built profanity tools for Vercel AI SDK
 *
 * @example
 * ```typescript
 * import { generateText } from 'ai';
 * import { openai } from '@ai-sdk/openai';
 * import { profanityTools } from 'glin-profanity/ai/vercel';
 *
 * const { text, toolCalls } = await generateText({
 *   model: openai('gpt-4o'),
 *   prompt: 'Check if "Hello world" contains profanity',
 *   tools: profanityTools,
 * });
 * ```
 */
export const profanityTools = {
  checkProfanity: createCheckProfanityTool(),
  censorText: createCensorTextTool(),
  batchCheckProfanity: createBatchCheckTool(),
  analyzeContext: createContextAnalysisTool(),
  getSupportedLanguages: createSupportedLanguagesTool(),
};

/**
 * Creates all profanity tools with custom configuration
 *
 * @returns Object containing all Vercel AI SDK-compatible tools
 */
export function createAllProfanityTools() {
  return {
    checkProfanity: createCheckProfanityTool(),
    censorText: createCensorTextTool(),
    batchCheckProfanity: createBatchCheckTool(),
    analyzeContext: createContextAnalysisTool(),
    getSupportedLanguages: createSupportedLanguagesTool(),
  };
}

/**
 * Middleware for Next.js API routes to automatically check request bodies
 *
 * @example
 * ```typescript
 * // app/api/chat/route.ts
 * import { profanityMiddleware } from 'glin-profanity/ai/vercel';
 *
 * export async function POST(req: Request) {
 *   const body = await req.json();
 *
 *   // Check for profanity in user message
 *   const check = profanityMiddleware.checkMessage(body.message);
 *   if (check.blocked) {
 *     return Response.json({ error: check.reason }, { status: 400 });
 *   }
 *
 *   // Continue with AI processing...
 * }
 * ```
 */
export const profanityMiddleware = {
  /**
   * Check a message for profanity
   */
  checkMessage(message: string, config?: Partial<FilterConfig>) {
    const filter = createFilter(config);
    const result = filter.checkProfanity(message);
    return {
      blocked: result.containsProfanity,
      reason: result.containsProfanity
        ? `Message contains inappropriate content: ${result.profaneWords.join(', ')}`
        : undefined,
      profaneWords: result.profaneWords,
      censoredMessage: result.processedText,
    };
  },

  /**
   * Censor a message (replace profanity with asterisks)
   */
  censorMessage(message: string, replacement = '***', config?: Partial<FilterConfig>) {
    const filter = createFilter({ ...config, replaceWith: replacement });
    const result = filter.checkProfanity(message);
    return {
      original: message,
      censored: result.processedText || message,
      wasModified: result.containsProfanity,
      profaneWords: result.profaneWords,
    };
  },

  /**
   * Check array of messages (useful for chat history)
   */
  checkMessages(messages: Array<{ role: string; content: string }>, config?: Partial<FilterConfig>) {
    const filter = createFilter(config);
    const results = messages.map((msg, index) => {
      const result = filter.checkProfanity(msg.content);
      return {
        index,
        role: msg.role,
        containsProfanity: result.containsProfanity,
        profaneWords: result.profaneWords,
      };
    });
    const hasIssues = results.some(r => r.containsProfanity);
    return {
      hasIssues,
      flaggedMessages: results.filter(r => r.containsProfanity),
      totalMessages: messages.length,
    };
  },
};

export type { CheckProfanityResult, FilterConfig, Language };
