/**
 * LangChain Tool Integration for glin-profanity
 *
 * Provides ready-to-use tools for LangChain agents and chains.
 * Compatible with LangChain.js and Python (via equivalent API).
 *
 * @example
 * ```typescript
 * import { createAgent } from 'langchain';
 * import { profanityCheckTool, censorTextTool, batchCheckTool } from 'glin-profanity/ai/langchain';
 *
 * const agent = createAgent({
 *   model: 'gpt-4o',
 *   tools: [profanityCheckTool, censorTextTool, batchCheckTool],
 * });
 *
 * const result = await agent.invoke('Check if "Hello world" contains profanity');
 * ```
 *
 * @packageDocumentation
 * @module glin-profanity/ai/langchain
 */

import { Filter } from '../filters/Filter';
import type { FilterConfig, Language, CheckProfanityResult } from '../types/types';

/**
 * LangChain tool definition interface
 */
export interface LangChainTool<T = unknown> {
  name: string;
  description: string;
  schema: unknown;
  invoke: (input: T) => Promise<unknown>;
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
 * Supported languages list
 */
const SUPPORTED_LANGUAGES = [
  'arabic', 'chinese', 'czech', 'danish', 'dutch', 'english',
  'finnish', 'french', 'german', 'hindi', 'hungarian', 'italian',
  'japanese', 'korean', 'norwegian', 'polish', 'portuguese', 'russian',
  'spanish', 'swedish', 'thai', 'turkish', 'ukrainian', 'vietnamese'
] as const;

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
 * Gets the Zod library (lazy load to avoid hard dependency)
 */
function getZod() {
  try {
    return require('zod');
  } catch {
    throw new Error('Zod is required for LangChain tools. Install it with: npm install zod');
  }
}

/**
 * Creates a profanity check tool for LangChain
 *
 * @example
 * ```typescript
 * import { tool } from '@langchain/core/tools';
 * import { createProfanityCheckTool } from 'glin-profanity/ai/langchain';
 *
 * const profanityTool = createProfanityCheckTool();
 * const result = await profanityTool.invoke({ text: 'Hello world' });
 * ```
 */
export function createProfanityCheckTool() {
  const { z } = getZod();

  const schema = z.object({
    text: z.string().describe('The text to check for profanity'),
    languages: z.array(z.string()).optional().describe('Languages to check against (e.g., ["english", "spanish"])'),
    detectLeetspeak: z.boolean().optional().default(true).describe('Enable leetspeak detection (e.g., "f4ck" → "fuck")'),
    normalizeUnicode: z.boolean().optional().default(true).describe('Enable Unicode homoglyph normalization'),
  });

  return {
    name: 'check_profanity',
    description: 'Check if text contains profanity. Returns detailed information about detected profane words, severity levels, and supports 24 languages with leetspeak and Unicode obfuscation detection.',
    schema,
    invoke: async (input: CheckProfanityInput) => {
      const filter = createFilter({
        languages: input.languages as Language[],
        detectLeetspeak: input.detectLeetspeak,
        normalizeUnicode: input.normalizeUnicode,
      });
      const result = filter.checkProfanity(input.text);
      return JSON.stringify({
        containsProfanity: result.containsProfanity,
        profaneWords: result.profaneWords,
        severityMap: result.severityMap,
        wordCount: input.text.split(/\s+/).length,
      });
    },
  };
}

/**
 * Creates a censor text tool for LangChain
 */
export function createCensorTextTool() {
  const { z } = getZod();

  const schema = z.object({
    text: z.string().describe('The text to censor'),
    replacement: z.string().optional().default('***').describe('The character or string to replace profanity with'),
    languages: z.array(z.string()).optional().describe('Languages to check against'),
  });

  return {
    name: 'censor_text',
    description: 'Censor profanity in text by replacing profane words with a replacement string. Returns the censored text and information about what was modified.',
    schema,
    invoke: async (input: CensorTextInput) => {
      const filter = createFilter({
        languages: input.languages as Language[],
        replaceWith: input.replacement || '***',
      });
      const result = filter.checkProfanity(input.text);
      return JSON.stringify({
        originalText: input.text,
        censoredText: result.processedText || input.text,
        profaneWordsFound: result.profaneWords,
        wasModified: result.containsProfanity,
      });
    },
  };
}

/**
 * Creates a batch check tool for LangChain
 */
export function createBatchCheckTool() {
  const { z } = getZod();

  const schema = z.object({
    texts: z.array(z.string()).describe('Array of texts to check for profanity'),
    languages: z.array(z.string()).optional().describe('Languages to check against'),
    detectLeetspeak: z.boolean().optional().default(true).describe('Enable leetspeak detection'),
  });

  return {
    name: 'batch_check_profanity',
    description: 'Check multiple texts for profanity in a single call. More efficient than checking texts individually.',
    schema,
    invoke: async (input: BatchCheckInput) => {
      const filter = createFilter({
        languages: input.languages as Language[],
        detectLeetspeak: input.detectLeetspeak,
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
      return JSON.stringify({
        totalTexts: input.texts.length,
        flaggedCount,
        cleanCount: input.texts.length - flaggedCount,
        results,
      });
    },
  };
}

/**
 * Creates a context-aware analysis tool for LangChain
 */
export function createContextAnalysisTool() {
  const { z } = getZod();

  const schema = z.object({
    text: z.string().describe('The text to analyze'),
    languages: z.array(z.string()).optional().describe('Languages to check against'),
    contextWindow: z.number().optional().default(3).describe('Number of words around a match to consider for context'),
    confidenceThreshold: z.number().optional().default(0.7).describe('Minimum confidence score (0-1) to flag as profanity'),
  });

  return {
    name: 'analyze_context',
    description: 'Perform context-aware profanity analysis using NLP to distinguish between truly offensive content and false positives (e.g., "Scunthorpe" is not offensive).',
    schema,
    invoke: async (input: AnalyzeContextInput) => {
      const filter = createFilter({
        languages: input.languages as Language[],
        enableContextAware: true,
        contextWindow: input.contextWindow,
        confidenceThreshold: input.confidenceThreshold,
      });
      const result = filter.checkProfanity(input.text);
      return JSON.stringify({
        containsProfanity: result.containsProfanity,
        profaneWords: result.profaneWords,
        contextScore: result.contextScore,
        matches: result.matches,
        reason: result.reason,
      });
    },
  };
}

/**
 * Creates a supported languages tool for LangChain
 */
export function createSupportedLanguagesTool() {
  const { z } = getZod();

  const schema = z.object({});

  return {
    name: 'get_supported_languages',
    description: 'Get the list of supported languages for profanity detection.',
    schema,
    invoke: async () => {
      return JSON.stringify({
        languages: SUPPORTED_LANGUAGES,
        count: SUPPORTED_LANGUAGES.length,
      });
    },
  };
}

/**
 * Pre-built profanity check tool instance
 * Use directly with LangChain agents
 */
export const profanityCheckTool = createProfanityCheckTool();

/**
 * Pre-built censor text tool instance
 */
export const censorTextTool = createCensorTextTool();

/**
 * Pre-built batch check tool instance
 */
export const batchCheckTool = createBatchCheckTool();

/**
 * Pre-built context analysis tool instance
 */
export const contextAnalysisTool = createContextAnalysisTool();

/**
 * Pre-built supported languages tool instance
 */
export const supportedLanguagesTool = createSupportedLanguagesTool();

/**
 * All profanity tools bundled together
 *
 * @example
 * ```typescript
 * import { createAgent } from 'langchain';
 * import { allProfanityTools } from 'glin-profanity/ai/langchain';
 *
 * const agent = createAgent({
 *   model: 'gpt-4o',
 *   tools: allProfanityTools,
 * });
 * ```
 */
export const allProfanityTools = [
  profanityCheckTool,
  censorTextTool,
  batchCheckTool,
  contextAnalysisTool,
  supportedLanguagesTool,
];

/**
 * Creates all profanity tools with custom configuration
 *
 * @param config - Optional filter configuration to apply to all tools
 * @returns Array of LangChain-compatible tools
 *
 * @example
 * ```typescript
 * const tools = createAllProfanityTools({
 *   languages: ['english', 'spanish'],
 *   detectLeetspeak: true,
 * });
 * ```
 */
export function createAllProfanityTools() {
  return [
    createProfanityCheckTool(),
    createCensorTextTool(),
    createBatchCheckTool(),
    createContextAnalysisTool(),
    createSupportedLanguagesTool(),
  ];
}

export type { CheckProfanityResult, FilterConfig, Language };
