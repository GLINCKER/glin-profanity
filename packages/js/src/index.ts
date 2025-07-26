/**
 * Glin-Profanity: Lightweight and efficient profanity detection and filtering.
 * 
 * Provides multi-language support, context-aware filtering, and customizable
 * configurations for detecting and filtering profane language in text inputs.
 */

export { Filter } from './filters/Filter';
export { useProfanityChecker } from './hooks/useProfanityChecker';
export { SeverityLevel } from './types/types';
export type { 
  Language, 
  CheckProfanityResult, 
  FilterConfig,
  FilteredProfanityResult,
  Match,
  ContextAwareConfig
} from './types/types';
