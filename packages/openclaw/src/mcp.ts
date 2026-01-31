/**
 * MCP (Model Context Protocol) Integration for OpenClaw
 *
 * This module provides MCP server capabilities that can be used
 * with OpenClaw's MCP transport or as a standalone MCP server.
 *
 * The MCP server exposes profanity detection tools that any
 * MCP-compatible client (including OpenClaw) can use.
 *
 * @example
 * ```typescript
 * import { createMCPHandler, mcpTools } from 'openclaw-profanity/mcp';
 *
 * // Get MCP tool definitions
 * const tools = mcpTools;
 *
 * // Or create a full handler
 * const handler = createMCPHandler();
 * const result = await handler.executeTool('check_profanity', { text: 'Hello' });
 * ```
 *
 * @remarks
 * Compatible with:
 * - OpenClaw MCP transport
 * - Claude Desktop MCP
 * - Any MCP-compatible client
 * - Moltbot (legacy) with MCP bridge
 * - Clawdbot (legacy) with MCP bridge
 *
 * @packageDocumentation
 */

import { Filter } from 'glin-profanity';
import type { FilterConfig, Language, CheckProfanityResult } from 'glin-profanity';

/**
 * MCP Tool definition (compatible with MCP spec)
 */
export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, MCPParameterSchema>;
    required?: string[];
  };
}

/**
 * MCP parameter schema
 */
export interface MCPParameterSchema {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
  items?: MCPParameterSchema;
  default?: unknown;
  enum?: string[];
}

/**
 * MCP tool execution result
 */
export interface MCPToolResult {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
}

/**
 * Default filter instance
 */
function createFilter(config?: Partial<FilterConfig>): Filter {
  return new Filter({
    languages: (config?.languages || ['english']) as Language[],
    detectLeetspeak: config?.detectLeetspeak ?? true,
    normalizeUnicode: config?.normalizeUnicode ?? true,
    severityLevels: true,
    cacheResults: true,
    ...config,
  });
}

/**
 * MCP tool: check_profanity
 */
export const checkProfanityMCPTool: MCPToolDefinition = {
  name: 'check_profanity',
  description: 'Check text for profanity in 24 languages. Detects leetspeak and unicode obfuscation.',
  inputSchema: {
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: 'The text to check for profanity',
      },
      languages: {
        type: 'array',
        description: 'Languages to check (default: ["english"])',
        items: { type: 'string' },
      },
      detectLeetspeak: {
        type: 'boolean',
        description: 'Whether to detect leetspeak variations (default: true)',
        default: true,
      },
    },
    required: ['text'],
  },
};

/**
 * MCP tool: censor_text
 */
export const censorTextMCPTool: MCPToolDefinition = {
  name: 'censor_text',
  description: 'Censor profanity in text by replacing bad words with asterisks or custom replacement.',
  inputSchema: {
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: 'The text to censor',
      },
      replacement: {
        type: 'string',
        description: 'Replacement string for profanity (default: "***")',
        default: '***',
      },
      languages: {
        type: 'array',
        description: 'Languages to check',
        items: { type: 'string' },
      },
    },
    required: ['text'],
  },
};

/**
 * MCP tool: batch_check_profanity
 */
export const batchCheckMCPTool: MCPToolDefinition = {
  name: 'batch_check_profanity',
  description: 'Check multiple texts for profanity at once. Efficient for bulk processing.',
  inputSchema: {
    type: 'object',
    properties: {
      texts: {
        type: 'array',
        description: 'Array of texts to check',
        items: { type: 'string' },
      },
      languages: {
        type: 'array',
        description: 'Languages to check',
        items: { type: 'string' },
      },
    },
    required: ['texts'],
  },
};

/**
 * MCP tool: analyze_profanity_context
 */
export const analyzeContextMCPTool: MCPToolDefinition = {
  name: 'analyze_profanity_context',
  description: 'Analyze profanity with context awareness. Understands when words are used appropriately.',
  inputSchema: {
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: 'The text to analyze',
      },
      contextWindow: {
        type: 'number',
        description: 'Number of words to consider for context (default: 3)',
        default: 3,
      },
      languages: {
        type: 'array',
        description: 'Languages to check',
        items: { type: 'string' },
      },
    },
    required: ['text'],
  },
};

/**
 * MCP tool: get_supported_languages
 */
export const getSupportedLanguagesMCPTool: MCPToolDefinition = {
  name: 'get_supported_languages',
  description: 'Get list of all 24 supported languages for profanity detection.',
  inputSchema: {
    type: 'object',
    properties: {},
  },
};

/**
 * All MCP tool definitions
 */
export const mcpTools: MCPToolDefinition[] = [
  checkProfanityMCPTool,
  censorTextMCPTool,
  batchCheckMCPTool,
  analyzeContextMCPTool,
  getSupportedLanguagesMCPTool,
];

/**
 * Execute an MCP tool
 */
export async function executeMCPTool(
  toolName: string,
  args: Record<string, unknown>
): Promise<MCPToolResult> {
  switch (toolName) {
    case 'check_profanity': {
      const filter = createFilter({
        languages: (args.languages as Language[]) || ['english'],
        detectLeetspeak: args.detectLeetspeak as boolean ?? true,
      });
      const result = filter.checkProfanity(args.text as string);
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
    }

    case 'censor_text': {
      const filter = createFilter({
        languages: (args.languages as Language[]) || ['english'],
        replaceWith: (args.replacement as string) || '***',
      });
      const result = filter.checkProfanity(args.text as string);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            originalText: args.text,
            censoredText: result.processedText,
            wordsCensored: result.profaneWords.length,
            profaneWords: result.profaneWords,
          }, null, 2),
        }],
      };
    }

    case 'batch_check_profanity': {
      const filter = createFilter({
        languages: (args.languages as Language[]) || ['english'],
      });
      const texts = args.texts as string[];
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
    }

    case 'analyze_profanity_context': {
      const filter = createFilter({
        languages: (args.languages as Language[]) || ['english'],
        enableContextAware: true,
        contextWindow: (args.contextWindow as number) || 3,
      });
      const result = filter.checkProfanity(args.text as string);
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
    }

    case 'get_supported_languages': {
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
    }

    default:
      return {
        content: [{
          type: 'text',
          text: `Unknown tool: ${toolName}`,
        }],
        isError: true,
      };
  }
}

/**
 * Create an MCP handler for OpenClaw or standalone use
 *
 * @example
 * ```typescript
 * const handler = createMCPHandler();
 *
 * // List available tools
 * const tools = handler.listTools();
 *
 * // Execute a tool
 * const result = await handler.executeTool('check_profanity', {
 *   text: 'Hello world',
 * });
 * ```
 */
export function createMCPHandler() {
  return {
    /** List all available tools */
    listTools: () => mcpTools,

    /** Get a specific tool definition */
    getTool: (name: string) => mcpTools.find(t => t.name === name),

    /** Execute a tool */
    executeTool: (name: string, args: Record<string, unknown>) =>
      executeMCPTool(name, args),

    /** Server info */
    getServerInfo: () => ({
      name: 'glin-profanity-mcp',
      version: '1.0.0',
      description: 'Content moderation MCP server with 24-language profanity detection',
      capabilities: {
        tools: mcpTools.map(t => t.name),
      },
    }),
  };
}

/**
 * MCP server configuration for OpenClaw
 *
 * @remarks
 * Add this to your OpenClaw configuration to enable
 * MCP-based profanity detection.
 *
 * @example
 * ```json5
 * // openclaw.config.json5
 * {
 *   mcp: {
 *     servers: {
 *       "glin-profanity": {
 *         command: "npx",
 *         args: ["-y", "openclaw-profanity", "mcp-server"]
 *       }
 *     }
 *   }
 * }
 * ```
 */
export const mcpServerConfig = {
  name: 'glin-profanity',
  description: 'Content moderation with 24-language profanity detection',
  version: '1.0.0',
  tools: mcpTools.map(t => t.name),
};

export type { CheckProfanityResult, FilterConfig, Language };
