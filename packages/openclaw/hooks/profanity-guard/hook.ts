/**
 * Profanity Guard Hook for OpenClaw
 *
 * This hook automatically moderates all messages passing through
 * OpenClaw, including WhatsApp, Telegram, Discord, Slack, iMessage, etc.
 *
 * @remarks
 * Compatible with OpenClaw, Moltbot (legacy), and Clawdbot (legacy).
 *
 * Installation:
 * ```bash
 * openclaw hooks install openclaw-profanity
 * ```
 *
 * Or manually add to your hooks directory:
 * ```bash
 * cp -r node_modules/openclaw-profanity/hooks/profanity-guard ~/.openclaw/hooks/
 * ```
 */

import { createProfanityGuard } from '../../src/hooks';

/**
 * Default hook configuration
 *
 * Customize by editing this file or providing environment variables:
 * - PROFANITY_MODE: 'strict' | 'moderate' | 'lenient'
 * - PROFANITY_BLOCK: 'true' | 'false'
 * - PROFANITY_CENSOR: 'true' | 'false'
 * - PROFANITY_LANGUAGES: 'english,spanish,french'
 */
const config = {
  mode: (process.env.PROFANITY_MODE as 'strict' | 'moderate' | 'lenient') || 'moderate',
  blockProfanity: process.env.PROFANITY_BLOCK === 'true',
  censorProfanity: process.env.PROFANITY_CENSOR !== 'false', // Default true
  languages: process.env.PROFANITY_LANGUAGES?.split(',') || ['english'],
  logIncidents: true,
};

// Create the guard
const guard = createProfanityGuard(config);

/**
 * Hook handler - called by OpenClaw for each message
 */
export async function handler(message: string, context?: Record<string, unknown>) {
  const result = await guard.processMessage({
    message,
    channel: context?.channel as string,
    userId: context?.userId as string,
    direction: context?.direction as 'incoming' | 'outgoing',
  });

  return result;
}

/**
 * Hook metadata
 */
export const metadata = {
  name: 'profanity-guard',
  description: 'Automatic content moderation with 24-language profanity detection',
  version: '1.0.0',
  author: 'GLINR',
  config: {
    mode: {
      type: 'string',
      enum: ['strict', 'moderate', 'lenient'],
      default: 'moderate',
      description: 'Moderation strictness level',
    },
    blockProfanity: {
      type: 'boolean',
      default: false,
      description: 'Block messages containing profanity',
    },
    censorProfanity: {
      type: 'boolean',
      default: true,
      description: 'Automatically censor profanity',
    },
    languages: {
      type: 'array',
      default: ['english'],
      description: 'Languages to check for profanity',
    },
  },
};

export default handler;
