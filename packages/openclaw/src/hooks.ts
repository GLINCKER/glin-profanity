/**
 * OpenClaw Hooks - Automatic Message Moderation
 *
 * Hooks allow automatic interception and processing of messages
 * before they are sent or after they are received.
 *
 * The profanity guard hook automatically moderates all messages
 * across WhatsApp, Telegram, Discord, Slack, iMessage, etc.
 *
 * @example
 * ```typescript
 * import { createProfanityGuard } from 'openclaw-profanity/hooks';
 *
 * const guard = createProfanityGuard({
 *   mode: 'moderate',
 *   blockProfanity: false,
 *   censorProfanity: true,
 * });
 *
 * // In your hook
 * export default guard;
 * ```
 *
 * @remarks
 * Compatible with OpenClaw, Moltbot (legacy), and Clawdbot (legacy).
 *
 * @packageDocumentation
 */

import { Filter } from 'glin-profanity';
import type { FilterConfig, Language, CheckProfanityResult } from 'glin-profanity';

/**
 * Moderation mode determines strictness level
 */
export type ModerationMode = 'strict' | 'moderate' | 'lenient';

/**
 * Hook action to take when profanity is detected
 */
export type HookAction = 'block' | 'censor' | 'warn' | 'log';

/**
 * Profanity guard configuration
 */
export interface ProfanityGuardConfig {
  /** Moderation strictness level */
  mode?: ModerationMode;
  /** Languages to check (default: ['english']) */
  languages?: Language[];
  /** Block messages with profanity */
  blockProfanity?: boolean;
  /** Automatically censor profanity */
  censorProfanity?: boolean;
  /** Replacement string for censoring */
  censorReplacement?: string;
  /** Log all profanity incidents */
  logIncidents?: boolean;
  /** Custom callback when profanity is detected */
  onProfanityDetected?: (result: ProfanityIncident) => void | Promise<void>;
  /** Whitelist specific words */
  whitelist?: string[];
  /** Channels/platforms to skip */
  skipChannels?: string[];
}

/**
 * Profanity incident information
 */
export interface ProfanityIncident {
  /** Original message */
  originalMessage: string;
  /** Processed/censored message */
  processedMessage?: string;
  /** Profane words found */
  profaneWords: string[];
  /** Action taken */
  action: HookAction;
  /** Timestamp */
  timestamp: Date;
  /** Source channel (if available) */
  channel?: string;
  /** User ID (if available) */
  userId?: string;
  /** Full check result */
  checkResult: CheckProfanityResult;
}

/**
 * Hook message context
 */
export interface HookMessageContext {
  /** Message content */
  message: string;
  /** Source channel/platform */
  channel?: string;
  /** User identifier */
  userId?: string;
  /** Direction: incoming or outgoing */
  direction?: 'incoming' | 'outgoing';
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Hook result
 */
export interface HookResult {
  /** Whether to proceed with the message */
  proceed: boolean;
  /** Modified message (if any) */
  message?: string;
  /** Reason for blocking (if blocked) */
  reason?: string;
  /** Incident details */
  incident?: ProfanityIncident;
}

/**
 * Mode-based configuration presets
 */
const modePresets: Record<ModerationMode, Partial<FilterConfig>> = {
  strict: {
    detectLeetspeak: true,
    normalizeUnicode: true,
    enableContextAware: false, // No context exemptions
  },
  moderate: {
    detectLeetspeak: true,
    normalizeUnicode: true,
    enableContextAware: true, // Allow context-based exemptions
    contextWindow: 3,
  },
  lenient: {
    detectLeetspeak: false, // Only obvious profanity
    normalizeUnicode: false,
    enableContextAware: true,
    contextWindow: 5,
  },
};

/**
 * Create a profanity guard hook
 *
 * @example
 * ```typescript
 * // Basic usage
 * const guard = createProfanityGuard();
 *
 * // Strict mode that blocks profanity
 * const strictGuard = createProfanityGuard({
 *   mode: 'strict',
 *   blockProfanity: true,
 * });
 *
 * // Moderate mode that censors
 * const censorGuard = createProfanityGuard({
 *   mode: 'moderate',
 *   censorProfanity: true,
 *   censorReplacement: '[CENSORED]',
 * });
 *
 * // Multi-language
 * const multiLangGuard = createProfanityGuard({
 *   languages: ['english', 'spanish', 'french'],
 * });
 * ```
 */
export function createProfanityGuard(config: ProfanityGuardConfig = {}) {
  const {
    mode = 'moderate',
    languages = ['english'],
    blockProfanity = false,
    censorProfanity = true,
    censorReplacement = '***',
    logIncidents = true,
    onProfanityDetected,
    whitelist = [],
    skipChannels = [],
  } = config;

  // Create filter with mode presets
  const filterConfig: Partial<FilterConfig> = {
    ...modePresets[mode],
    languages,
    replaceWith: censorReplacement,
    ignoreWords: whitelist,
  };

  const filter = new Filter(filterConfig);

  // Incident log (in-memory, could be persisted)
  const incidentLog: ProfanityIncident[] = [];

  /**
   * Process a message through the guard
   */
  async function processMessage(context: HookMessageContext): Promise<HookResult> {
    const { message, channel, userId } = context;

    // Skip if channel is in skip list
    if (channel && skipChannels.includes(channel)) {
      return { proceed: true, message };
    }

    // Check for profanity
    const result = filter.checkProfanity(message);

    // No profanity - proceed normally
    if (!result.containsProfanity) {
      return { proceed: true, message };
    }

    // Determine action
    let action: HookAction;
    let processedMessage = message;
    let proceed = true;

    if (blockProfanity) {
      action = 'block';
      proceed = false;
    } else if (censorProfanity) {
      action = 'censor';
      processedMessage = result.processedText || message;
    } else {
      action = 'warn';
    }

    // Create incident
    const incident: ProfanityIncident = {
      originalMessage: message,
      processedMessage: action === 'censor' ? processedMessage : undefined,
      profaneWords: result.profaneWords,
      action,
      timestamp: new Date(),
      channel,
      userId,
      checkResult: result,
    };

    // Log incident
    if (logIncidents) {
      incidentLog.push(incident);
    }

    // Call custom callback
    if (onProfanityDetected) {
      await onProfanityDetected(incident);
    }

    return {
      proceed,
      message: processedMessage,
      reason: !proceed ? `Profanity detected: ${result.profaneWords.join(', ')}` : undefined,
      incident,
    };
  }

  /**
   * OpenClaw hook handler
   *
   * @remarks
   * This is the main hook function that OpenClaw (or Moltbot/Clawdbot)
   * will call for each message.
   */
  async function hookHandler(
    message: string,
    context?: Partial<HookMessageContext>
  ): Promise<HookResult> {
    return processMessage({
      message,
      ...context,
    });
  }

  return {
    /** Process a message */
    processMessage,

    /** Hook handler for OpenClaw */
    handler: hookHandler,

    /** Get incident log */
    getIncidentLog: () => [...incidentLog],

    /** Clear incident log */
    clearIncidentLog: () => {
      incidentLog.length = 0;
    },

    /** Get incident count */
    getIncidentCount: () => incidentLog.length,

    /** Get filter instance */
    getFilter: () => filter,

    /** Update whitelist (note: requires recreating the filter) */
    addToWhitelist: (words: string[]) => {
      // Note: glin-profanity uses ignoreWords at construction time
      // To add words dynamically, you need to create a new guard instance
      console.warn('Dynamic whitelist update not supported. Create a new guard with the updated whitelist.');
      whitelist.push(...words);
    },

    /** Get configuration */
    getConfig: () => ({
      mode,
      languages,
      blockProfanity,
      censorProfanity,
      censorReplacement,
      logIncidents,
      whitelist,
      skipChannels,
    }),
  };
}

/**
 * Quick guard - Simple one-function check
 *
 * @example
 * ```typescript
 * const result = quickGuard('Hello world');
 * if (!result.proceed) {
 *   console.log('Message blocked:', result.reason);
 * }
 * ```
 */
export function quickGuard(
  message: string,
  options?: { block?: boolean; censor?: boolean; languages?: Language[] }
): HookResult {
  const filter = new Filter({
    languages: options?.languages || ['english'],
    detectLeetspeak: true,
    normalizeUnicode: true,
    replaceWith: options?.censor ? '***' : undefined,
  });

  const result = filter.checkProfanity(message);

  if (!result.containsProfanity) {
    return { proceed: true, message };
  }

  if (options?.block) {
    return {
      proceed: false,
      reason: `Profanity detected: ${result.profaneWords.join(', ')}`,
    };
  }

  if (options?.censor) {
    return {
      proceed: true,
      message: result.processedText || message,
    };
  }

  return {
    proceed: true,
    message,
    reason: `Warning: profanity detected: ${result.profaneWords.join(', ')}`,
  };
}

/**
 * Default export for OpenClaw hook discovery
 *
 * @remarks
 * This creates a moderate-mode guard with censoring enabled,
 * which is a safe default for most platforms.
 */
export default createProfanityGuard({
  mode: 'moderate',
  censorProfanity: true,
  logIncidents: true,
});

export type { CheckProfanityResult, FilterConfig, Language };
