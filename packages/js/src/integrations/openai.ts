/**
 * OpenAI Function Calling Integration for glin-profanity
 *
 * Provides ready-to-use tool definitions for OpenAI's function calling API.
 * Compatible with GPT-4o, GPT-4, GPT-3.5-turbo, and other OpenAI models.
 *
 * @example
 * ```typescript
 * import OpenAI from 'openai';
 * import { profanityTools, executeProfanityTool } from 'glin-profanity/ai/openai';
 *
 * const client = new OpenAI();
 * const response = await client.chat.completions.create({
 *   model: 'gpt-4o',
 *   messages: [{ role: 'user', content: 'Check if this text is appropriate: "Hello world"' }],
 *   tools: profanityTools,
 * });
 *
 * // Handle tool calls
 * const toolCall = response.choices[0]?.message.tool_calls?.[0];
 * if (toolCall) {
 *   const result = await executeProfanityTool(toolCall.function.name, JSON.parse(toolCall.function.arguments));
 * }
 * ```
 *
 * @packageDocumentation
 * @module glin-profanity/ai/openai
 */

import { Filter } from '../filters/Filter';
import type { FilterConfig, Language, CheckProfanityResult } from '../types/types';

/**
 * OpenAI tool definition type
 */
export interface OpenAITool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, unknown>;
      required?: string[];
    };
  };
}

/**
 * Check profanity tool parameters
 */
export interface CheckProfanityParams {
  text: string;
  languages?: string[];
  detectLeetspeak?: boolean;
  normalizeUnicode?: boolean;
}

/**
 * Censor text tool parameters
 */
export interface CensorTextParams {
  text: string;
  replacement?: string;
  languages?: string[];
}

/**
 * Batch check tool parameters
 */
export interface BatchCheckParams {
  texts: string[];
  languages?: string[];
  detectLeetspeak?: boolean;
}

/**
 * Analyze context tool parameters
 */
export interface AnalyzeContextParams {
  text: string;
  languages?: string[];
  contextWindow?: number;
  confidenceThreshold?: number;
}

/**
 * OpenAI-compatible tool definitions for profanity detection
 */
export const profanityTools: OpenAITool[] = [
  {
    type: 'function',
    function: {
      name: 'check_profanity',
      description: 'Check if text contains profanity. Returns detailed information about detected profane words, their locations, and severity levels. Supports 24 languages and advanced detection features like leetspeak and Unicode obfuscation.',
      parameters: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'The text to check for profanity',
          },
          languages: {
            type: 'array',
            items: { type: 'string' },
            description: 'Languages to check against (e.g., ["english", "spanish"]). Defaults to ["english"].',
          },
          detectLeetspeak: {
            type: 'boolean',
            description: 'Enable leetspeak detection (e.g., "f4ck" → "fuck"). Defaults to true.',
          },
          normalizeUnicode: {
            type: 'boolean',
            description: 'Enable Unicode homoglyph normalization. Defaults to true.',
          },
        },
        required: ['text'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'censor_text',
      description: 'Censor profanity in text by replacing profane words with a replacement character or string. Returns the censored text along with information about what was censored.',
      parameters: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'The text to censor',
          },
          replacement: {
            type: 'string',
            description: 'The character or string to replace profanity with. Defaults to "***".',
          },
          languages: {
            type: 'array',
            items: { type: 'string' },
            description: 'Languages to check against. Defaults to ["english"].',
          },
        },
        required: ['text'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'batch_check_profanity',
      description: 'Check multiple texts for profanity in a single call. More efficient than checking texts individually. Returns results for each text.',
      parameters: {
        type: 'object',
        properties: {
          texts: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of texts to check for profanity',
          },
          languages: {
            type: 'array',
            items: { type: 'string' },
            description: 'Languages to check against. Defaults to ["english"].',
          },
          detectLeetspeak: {
            type: 'boolean',
            description: 'Enable leetspeak detection. Defaults to true.',
          },
        },
        required: ['texts'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'analyze_context',
      description: 'Perform context-aware profanity analysis. Uses NLP to distinguish between truly offensive content and false positives (e.g., "Scunthorpe" is not offensive). Returns confidence scores.',
      parameters: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'The text to analyze',
          },
          languages: {
            type: 'array',
            items: { type: 'string' },
            description: 'Languages to check against. Defaults to ["english"].',
          },
          contextWindow: {
            type: 'number',
            description: 'Number of words around a match to consider for context. Defaults to 3.',
          },
          confidenceThreshold: {
            type: 'number',
            description: 'Minimum confidence score (0-1) to flag as profanity. Defaults to 0.7.',
          },
        },
        required: ['text'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_supported_languages',
      description: 'Get the list of supported languages for profanity detection.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
];

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
 * Execute a profanity tool by name with the given arguments
 *
 * @param toolName - The name of the tool to execute
 * @param args - The arguments for the tool
 * @returns The tool execution result
 *
 * @example
 * ```typescript
 * const result = await executeProfanityTool('check_profanity', {
 *   text: 'Hello world',
 *   detectLeetspeak: true,
 * });
 * console.log(result.containsProfanity); // false
 * ```
 */
export async function executeProfanityTool(
  toolName: string,
  args: Record<string, unknown>
): Promise<unknown> {
  switch (toolName) {
    case 'check_profanity': {
      const params = args as unknown as CheckProfanityParams;
      const filter = createFilter({
        languages: params.languages as Language[],
        detectLeetspeak: params.detectLeetspeak,
        normalizeUnicode: params.normalizeUnicode,
      });
      const result = filter.checkProfanity(params.text);
      return {
        containsProfanity: result.containsProfanity,
        profaneWords: result.profaneWords,
        severityMap: result.severityMap,
        wordCount: params.text.split(/\s+/).length,
      };
    }

    case 'censor_text': {
      const params = args as unknown as CensorTextParams;
      const filter = createFilter({
        languages: params.languages as Language[],
        replaceWith: params.replacement || '***',
      });
      const result = filter.checkProfanity(params.text);
      return {
        originalText: params.text,
        censoredText: result.processedText || params.text,
        profaneWordsFound: result.profaneWords,
        wasModified: result.containsProfanity,
      };
    }

    case 'batch_check_profanity': {
      const params = args as unknown as BatchCheckParams;
      const filter = createFilter({
        languages: params.languages as Language[],
        detectLeetspeak: params.detectLeetspeak,
      });
      const results = params.texts.map((text, index) => {
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
        totalTexts: params.texts.length,
        flaggedCount,
        cleanCount: params.texts.length - flaggedCount,
        results,
      };
    }

    case 'analyze_context': {
      const params = args as unknown as AnalyzeContextParams;
      const filter = createFilter({
        languages: params.languages as Language[],
        enableContextAware: true,
        contextWindow: params.contextWindow,
        confidenceThreshold: params.confidenceThreshold,
      });
      const result = filter.checkProfanity(params.text);
      return {
        containsProfanity: result.containsProfanity,
        profaneWords: result.profaneWords,
        contextScore: result.contextScore,
        matches: result.matches,
        reason: result.reason,
      };
    }

    case 'get_supported_languages': {
      return {
        languages: SUPPORTED_LANGUAGES,
        count: SUPPORTED_LANGUAGES.length,
      };
    }

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

/**
 * Zod schemas for OpenAI tool parameters (requires zod peer dependency)
 *
 * @example
 * ```typescript
 * import { zodFunction } from 'openai/helpers/zod';
 * import { profanityToolSchemas } from 'glin-profanity/ai/openai';
 *
 * const tools = [
 *   zodFunction({ name: 'check_profanity', parameters: profanityToolSchemas.checkProfanity }),
 * ];
 * ```
 */
export const profanityToolSchemas = {
  /**
   * Returns Zod schema for check_profanity tool
   * Lazily loaded to avoid requiring zod as a hard dependency
   */
  get checkProfanity() {
    try {
      const { z } = require('zod');
      return z.object({
        text: z.string().describe('The text to check for profanity'),
        languages: z.array(z.string()).optional().describe('Languages to check against'),
        detectLeetspeak: z.boolean().optional().describe('Enable leetspeak detection'),
        normalizeUnicode: z.boolean().optional().describe('Enable Unicode normalization'),
      });
    } catch {
      throw new Error('Zod is required for profanityToolSchemas. Install it with: npm install zod');
    }
  },

  /**
   * Returns Zod schema for censor_text tool
   */
  get censorText() {
    try {
      const { z } = require('zod');
      return z.object({
        text: z.string().describe('The text to censor'),
        replacement: z.string().optional().describe('Replacement character/string'),
        languages: z.array(z.string()).optional().describe('Languages to check against'),
      });
    } catch {
      throw new Error('Zod is required for profanityToolSchemas. Install it with: npm install zod');
    }
  },

  /**
   * Returns Zod schema for batch_check_profanity tool
   */
  get batchCheck() {
    try {
      const { z } = require('zod');
      return z.object({
        texts: z.array(z.string()).describe('Array of texts to check'),
        languages: z.array(z.string()).optional().describe('Languages to check against'),
        detectLeetspeak: z.boolean().optional().describe('Enable leetspeak detection'),
      });
    } catch {
      throw new Error('Zod is required for profanityToolSchemas. Install it with: npm install zod');
    }
  },

  /**
   * Returns Zod schema for analyze_context tool
   */
  get analyzeContext() {
    try {
      const { z } = require('zod');
      return z.object({
        text: z.string().describe('The text to analyze'),
        languages: z.array(z.string()).optional().describe('Languages to check against'),
        contextWindow: z.number().optional().describe('Context window size'),
        confidenceThreshold: z.number().optional().describe('Confidence threshold (0-1)'),
      });
    } catch {
      throw new Error('Zod is required for profanityToolSchemas. Install it with: npm install zod');
    }
  },
};

/**
 * Creates a runnable tools configuration for OpenAI's runTools helper
 *
 * @example
 * ```typescript
 * import OpenAI from 'openai';
 * import { createRunnableTools } from 'glin-profanity/ai/openai';
 *
 * const client = new OpenAI();
 * const runner = client.chat.completions.runTools({
 *   model: 'gpt-4o',
 *   messages: [{ role: 'user', content: 'Check this text for profanity: "Hello world"' }],
 *   tools: createRunnableTools(),
 * });
 *
 * const result = await runner.finalContent();
 * ```
 */
export function createRunnableTools() {
  return profanityTools.map((tool) => ({
    type: 'function' as const,
    function: {
      ...tool.function,
      function: async (args: Record<string, unknown>) => {
        return executeProfanityTool(tool.function.name, args);
      },
      parse: JSON.parse,
    },
  }));
}

export type { CheckProfanityResult, FilterConfig, Language };
