/**
 * Glin-Profanity: Lightweight and efficient profanity detection and filtering.
 *
 * Provides multi-language support, context-aware filtering, leetspeak detection,
 * Unicode normalization, and customizable configurations for detecting and
 * filtering profane language in text inputs.
 *
 * @packageDocumentation
 * @module glin-profanity
 *
 * @example
 * ```typescript
 * import { checkProfanity, Filter } from 'glin-profanity';
 *
 * // Simple usage
 * const result = checkProfanity('hello world');
 * console.log(result.containsProfanity);  // false
 *
 * // Advanced usage with leetspeak detection
 * const filter = new Filter({
 *   languages: ['english'],
 *   detectLeetspeak: true,
 *   normalizeUnicode: true,
 * });
 *
 * filter.isProfane('f4ck');   // true
 * filter.isProfane('fυck');   // true (Greek upsilon)
 * ```
 */

// Core API (framework-agnostic)
export {
  checkProfanity,
  checkProfanityAsync,
  isWordProfane
} from './core';

export type {
  ProfanityCheckerConfig,
  ProfanityCheckResult
} from './core/types';

// React-specific
export { useProfanityChecker } from './hooks/useProfanityChecker';

// Advanced/Low-level
export { Filter } from './filters/Filter';
// Alias for backwards compatibility and better naming
export { Filter as ProfanityFilter } from './filters/Filter';

// Utility functions for text normalization
export {
  normalizeLeetspeak,
  collapseSpacedCharacters,
  collapseRepeatedCharacters,
  containsLeetspeak,
  generateLeetspeakVariants,
  normalizeUnicode,
  removeZeroWidthCharacters,
  convertFullWidth,
  convertHomoglyphs,
  normalizeNFKD,
  containsUnicodeObfuscation,
  detectCharacterSets,
} from './utils';

export type {
  LeetspeakLevel,
  LeetspeakOptions,
  UnicodeNormalizationOptions,
} from './utils';

// Types
export { SeverityLevel } from './types/types';
export type {
  Language,
  CheckProfanityResult,
  FilterConfig,
  FilteredProfanityResult,
  Match,
  ContextAwareConfig,
} from './types/types';

// ML module types (re-exported for convenience)
// The actual ML classes are available via 'glin-profanity/ml' subpath
export type {
  ToxicityLabel,
  ToxicityPrediction,
  MLAnalysisResult,
  MLDetectorConfig,
  HybridAnalysisResult,
} from './ml/types';
