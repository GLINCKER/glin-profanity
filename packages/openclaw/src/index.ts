/**
 * openclaw-profanity
 *
 * Content moderation plugin for OpenClaw (formerly Moltbot/Clawdbot).
 * Provides profanity detection in 24 languages for AI agents across
 * WhatsApp, Telegram, Discord, Slack, iMessage, and other platforms.
 *
 * This plugin supports multiple integration methods:
 * - Skills: Markdown-based skills for simple use cases
 * - Plugin: TypeScript tools for advanced integrations
 * - Hooks: Auto-moderate all messages automatically
 * - MCP: Model Context Protocol server integration
 *
 * @example
 * ```bash
 * # Install the plugin
 * openclaw plugins install openclaw-profanity
 *
 * # Or use with npm
 * npm install openclaw-profanity
 * ```
 *
 * @example
 * ```typescript
 * // Use in your OpenClaw configuration
 * import { profanityTools, createProfanityGuard } from 'openclaw-profanity';
 *
 * // Register tools
 * api.registerTool(profanityTools.checkProfanity);
 * api.registerTool(profanityTools.censorText);
 *
 * // Or use the auto-guard hook
 * const guard = createProfanityGuard({ blockProfanity: true });
 * ```
 *
 * @packageDocumentation
 * @module openclaw-profanity
 *
 * @remarks
 * Previously known as:
 * - moltbot-profanity (Moltbot era)
 * - clawdbot-profanity (Clawdbot era)
 *
 * Compatible with:
 * - OpenClaw v1.x+
 * - Moltbot (legacy)
 * - Clawdbot (legacy)
 */

// Re-export everything
export * from './plugin';
export * from './skills';
export * from './hooks';
export * from './mcp';

// Re-export core glin-profanity types for convenience
export type {
  CheckProfanityResult,
  FilterConfig,
  Language,
  Match,
  SeverityLevel,
} from 'glin-profanity';

// Version info
export const VERSION = '1.0.0';
export const OPENCLAW_PLUGIN_ID = 'glin-profanity';

/**
 * Plugin metadata for OpenClaw discovery
 *
 * @remarks
 * This metadata helps OpenClaw (and legacy Moltbot/Clawdbot)
 * discover and configure this plugin correctly.
 */
export const pluginMetadata = {
  id: OPENCLAW_PLUGIN_ID,
  name: 'openclaw-profanity',
  description: 'Content moderation with 24-language profanity detection',
  version: VERSION,
  author: 'GLINR',
  homepage: 'https://github.com/GLINCKER/glin-profanity',
  keywords: [
    'openclaw',
    'moltbot',
    'clawdbot',
    'profanity',
    'content-moderation',
    'ai-safety',
  ],
  capabilities: {
    tools: ['check_profanity', 'censor_text', 'batch_check', 'analyze_context'],
    skills: ['profanity_check', 'censor_message', 'content_guard'],
    hooks: ['profanity-guard'],
    mcp: true,
  },
  supportedLanguages: [
    'arabic', 'chinese', 'czech', 'danish', 'dutch', 'english',
    'esperanto', 'finnish', 'french', 'german', 'hindi', 'hungarian',
    'italian', 'japanese', 'korean', 'norwegian', 'persian', 'polish',
    'portuguese', 'russian', 'spanish', 'swedish', 'thai', 'turkish',
  ],
};
