/**
 * Glin-Profanity: Lightweight and efficient profanity detection and filtering.
 * 
 * Provides multi-language support, context-aware filtering, and customizable
 * configurations for detecting and filtering profane language in text inputs.
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

// Legacy types (maintain compatibility)
export { SeverityLevel } from './types/types';
export type { 
  Language, 
  CheckProfanityResult, 
  FilterConfig,
  FilteredProfanityResult,
  Match,
  ContextAwareConfig
} from './types/types';
