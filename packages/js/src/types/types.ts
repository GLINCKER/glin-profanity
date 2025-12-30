/**
 * Type definitions for glin-profanity JavaScript/TypeScript package.
 * Unified API that mirrors the Python package structure.
 */

/** Severity levels for profanity matches - unified with Python */
export enum SeverityLevel {
  EXACT = 1,
  FUZZY = 2,
}

/** Supported languages - unified list with Python */
export type Language =
  | 'arabic'
  | 'chinese'
  | 'czech'
  | 'danish'
  | 'dutch'
  | 'english'
  | 'esperanto'
  | 'finnish'
  | 'french'
  | 'german'
  | 'hindi'
  | 'hungarian'
  | 'italian'
  | 'japanese'
  | 'korean'
  | 'norwegian'
  | 'persian'
  | 'polish'
  | 'portuguese'
  | 'russian'
  | 'spanish'
  | 'swedish'
  | 'thai'
  | 'turkish';

/** Represents a profanity match in text - unified with Python */
export interface Match {
  word: string;
  index: number;
  severity: SeverityLevel;
  contextScore?: number;
  reason?: string;
  isWhitelisted?: boolean;
}

/** Result of profanity check operation - unified field names */
export interface CheckProfanityResult {
  containsProfanity: boolean;
  profaneWords: string[];
  processedText?: string;
  severityMap?: Record<string, SeverityLevel>;
  matches?: Match[];
  contextScore?: number;
  reason?: string;
}

/** Configuration for context-aware filtering - unified with Python */
export interface ContextAwareConfig {
  enableContextAware?: boolean;
  contextWindow?: number;
  confidenceThreshold?: number;
  domainWhitelists?: Record<string, string[]>;
}

/** Leetspeak detection intensity levels */
export type LeetspeakLevel = 'basic' | 'moderate' | 'aggressive';

/** Main filter configuration options - unified with Python */
export interface FilterConfig extends ContextAwareConfig {
  languages?: Language[];
  allLanguages?: boolean;
  caseSensitive?: boolean;
  wordBoundaries?: boolean;
  customWords?: string[];
  replaceWith?: string;
  severityLevels?: boolean;
  ignoreWords?: string[];
  logProfanity?: boolean;
  allowObfuscatedMatch?: boolean;
  fuzzyToleranceLevel?: number;

  /**
   * Enable leetspeak detection (e.g., "f4ck" → "fuck").
   * @default false
   */
  detectLeetspeak?: boolean;

  /**
   * Leetspeak detection intensity level.
   * - `basic`: Numbers only (0→o, 1→i, 3→e, 4→a, 5→s)
   * - `moderate`: Basic + symbols (@→a, $→s, !→i)
   * - `aggressive`: All known substitutions
   * @default 'moderate'
   */
  leetspeakLevel?: LeetspeakLevel;

  /**
   * Enable Unicode normalization to detect homoglyphs and obfuscation.
   * @default true
   */
  normalizeUnicode?: boolean;

  /**
   * Cache profanity check results for repeated strings.
   * @default false
   */
  cacheResults?: boolean;

  /**
   * Maximum cache size when caching is enabled.
   * @default 1000
   */
  maxCacheSize?: number;
}

/** Result with minimum severity filtering */
export interface FilteredProfanityResult {
  result: CheckProfanityResult;
  filteredWords: string[];
}