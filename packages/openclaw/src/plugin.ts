/**
 * OpenClaw Plugin - TypeScript Tools Registration
 *
 * This module provides TypeScript-based tools that can be registered
 * with OpenClaw's plugin system for advanced integrations.
 *
 * @example
 * ```typescript
 * // In your OpenClaw plugin
 * import { registerProfanityTools } from 'openclaw-profanity/plugin';
 *
 * export default function(api) {
 *   registerProfanityTools(api);
 * }
 * ```
 *
 * @remarks
 * Works with OpenClaw, Moltbot (legacy), and Clawdbot (legacy).
 *
 * @packageDocumentation
 */

import { Filter } from 'glin-profanity';
import type { FilterConfig, Language, CheckProfanityResult } from 'glin-profanity';

/**
 * OpenClaw API interface (minimal type for plugin registration)
 */
export interface OpenClawAPI {
  registerTool: (tool: OpenClawTool) => void;
}

/**
 * OpenClaw tool definition
 */
export interface OpenClawTool {
  name: string;
  description: string;
  parameters: unknown;
  execute: (id: string, params: Record<string, unknown>) => Promise<ToolResult>;
}

/**
 * Tool execution result
 */
export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

/**
 * TypeBox schema generator (lazy-loaded)
 */
function getTypeBox() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@sinclair/typebox');
  } catch {
    // Fallback schema if TypeBox not available
    return {
      Type: {
        Object: (props: Record<string, unknown>) => ({ type: 'object', properties: props }),
        String: () => ({ type: 'string' }),
        Boolean: () => ({ type: 'boolean' }),
        Array: (items: unknown) => ({ type: 'array', items }),
        Optional: (schema: unknown) => ({ ...schema as object, optional: true }),
        Number: () => ({ type: 'number' }),
      },
    };
  }
}

/**
 * Default filter configuration
 */
const defaultConfig: Partial<FilterConfig> = {
  languages: ['english'] as Language[],
  detectLeetspeak: true,
  normalizeUnicode: true,
  severityLevels: true,
  cacheResults: true,
};

/**
 * Create a filter instance with configuration
 */
function createFilter(config?: Partial<FilterConfig>): Filter {
  return new Filter({ ...defaultConfig, ...config });
}

/**
 * Check profanity tool definition
 */
export const checkProfanityTool: OpenClawTool = {
  name: 'check_profanity',
  description: 'Check text for profanity in 24 languages. Detects leetspeak and unicode obfuscation.',
  get parameters() {
    const { Type } = getTypeBox();
    return Type.Object({
      text: Type.String(),
      languages: Type.Optional(Type.Array(Type.String())),
      detectLeetspeak: Type.Optional(Type.Boolean()),
    });
  },
  async execute(_id, params) {
    const filter = createFilter({
      languages: (params.languages as Language[]) || ['english'],
      detectLeetspeak: params.detectLeetspeak as boolean ?? true,
    });

    const result = filter.checkProfanity(params.text as string);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          containsProfanity: result.containsProfanity,
          profaneWords: result.profaneWords,
          processedText: result.processedText,
          matches: result.matches,
        }, null, 2),
      }],
    };
  },
};

/**
 * Censor text tool definition
 */
export const censorTextTool: OpenClawTool = {
  name: 'censor_text',
  description: 'Censor profanity in text by replacing bad words with asterisks or custom replacement.',
  get parameters() {
    const { Type } = getTypeBox();
    return Type.Object({
      text: Type.String(),
      replacement: Type.Optional(Type.String()),
      languages: Type.Optional(Type.Array(Type.String())),
    });
  },
  async execute(_id, params) {
    const filter = createFilter({
      languages: (params.languages as Language[]) || ['english'],
      replaceWith: (params.replacement as string) || '***',
    });

    const result = filter.checkProfanity(params.text as string);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          originalText: params.text,
          censoredText: result.processedText,
          wordsCensored: result.profaneWords.length,
          profaneWords: result.profaneWords,
        }, null, 2),
      }],
    };
  },
};

/**
 * Batch check tool definition
 */
export const batchCheckTool: OpenClawTool = {
  name: 'batch_check_profanity',
  description: 'Check multiple texts for profanity at once. Efficient for bulk processing.',
  get parameters() {
    const { Type } = getTypeBox();
    return Type.Object({
      texts: Type.Array(Type.String()),
      languages: Type.Optional(Type.Array(Type.String())),
    });
  },
  async execute(_id, params) {
    const filter = createFilter({
      languages: (params.languages as Language[]) || ['english'],
    });

    const texts = params.texts as string[];
    const results = texts.map((text, index) => {
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
      content: [{
        type: 'text',
        text: JSON.stringify({
          totalChecked: texts.length,
          flaggedCount,
          cleanCount: texts.length - flaggedCount,
          results,
        }, null, 2),
      }],
    };
  },
};

/**
 * Analyze context tool definition
 */
export const analyzeContextTool: OpenClawTool = {
  name: 'analyze_profanity_context',
  description: 'Analyze profanity with context awareness. Understands when words are used positively.',
  get parameters() {
    const { Type } = getTypeBox();
    return Type.Object({
      text: Type.String(),
      contextWindow: Type.Optional(Type.Number()),
      languages: Type.Optional(Type.Array(Type.String())),
    });
  },
  async execute(_id, params) {
    const filter = createFilter({
      languages: (params.languages as Language[]) || ['english'],
      enableContextAware: true,
      contextWindow: (params.contextWindow as number) || 3,
    });

    const result = filter.checkProfanity(params.text as string);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          containsProfanity: result.containsProfanity,
          profaneWords: result.profaneWords,
          matches: result.matches?.map(m => ({
            word: m.word,
            index: m.index,
            severity: m.severity,
            contextScore: m.contextScore,
            isWhitelisted: m.isWhitelisted,
            reason: m.reason,
          })),
          analysis: {
            totalMatches: result.matches?.length || 0,
            whitelisted: result.matches?.filter(m => m.isWhitelisted).length || 0,
            flagged: result.matches?.filter(m => !m.isWhitelisted).length || 0,
          },
        }, null, 2),
      }],
    };
  },
};

/**
 * Get supported languages tool
 */
export const getSupportedLanguagesTool: OpenClawTool = {
  name: 'get_supported_languages',
  description: 'Get list of all 24 supported languages for profanity detection.',
  get parameters() {
    const { Type } = getTypeBox();
    return Type.Object({});
  },
  async execute() {
    const languages = [
      'arabic', 'chinese', 'czech', 'danish', 'dutch', 'english',
      'esperanto', 'finnish', 'french', 'german', 'hindi', 'hungarian',
      'italian', 'japanese', 'korean', 'norwegian', 'persian', 'polish',
      'portuguese', 'russian', 'spanish', 'swedish', 'thai', 'turkish',
    ];

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          count: languages.length,
          languages,
          note: 'Pass languages array to other tools to filter specific languages.',
        }, null, 2),
      }],
    };
  },
};

/**
 * All available profanity tools
 */
export const profanityTools = {
  checkProfanity: checkProfanityTool,
  censorText: censorTextTool,
  batchCheck: batchCheckTool,
  analyzeContext: analyzeContextTool,
  getSupportedLanguages: getSupportedLanguagesTool,
};

/**
 * Register all profanity tools with OpenClaw API
 *
 * @example
 * ```typescript
 * // In your OpenClaw plugin entry
 * export default function(api) {
 *   registerProfanityTools(api);
 * }
 * ```
 */
export function registerProfanityTools(api: OpenClawAPI): void {
  api.registerTool(checkProfanityTool);
  api.registerTool(censorTextTool);
  api.registerTool(batchCheckTool);
  api.registerTool(analyzeContextTool);
  api.registerTool(getSupportedLanguagesTool);
}

/**
 * Default export for OpenClaw plugin discovery
 *
 * @remarks
 * OpenClaw (and legacy Moltbot/Clawdbot) will automatically
 * call this function when loading the plugin.
 */
export default function openclawPlugin(api: OpenClawAPI): void {
  registerProfanityTools(api);
}

export type { CheckProfanityResult, FilterConfig, Language };
