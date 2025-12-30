import { CheckProfanityResult, Language, SeverityLevel, FilterConfig as BaseFilterConfig } from '../types/types';
import type { FilterConfig } from '../filters/Filter';

/**
 * Configuration options for the profanity checker hook and functions.
 * Extends FilterConfig with additional convenience options for V3 features.
 */
export interface ProfanityCheckerConfig extends Omit<BaseFilterConfig, 'logProfanity'> {
  /** Minimum severity level to include in results */
  minSeverity?: SeverityLevel;
  /** Auto-replace profanity with replaceWith string */
  autoReplace?: boolean;
  /** Custom callback when profanity is detected */
  customActions?: (result: CheckProfanityResult) => void;
}

export interface ProfanityCheckResult extends CheckProfanityResult {
  filteredWords: string[];
  autoReplaced: string;
}

export type { 
  CheckProfanityResult, 
  Language, 
  SeverityLevel
} from '../types/types';

// Re-export FilterConfig for external use
export type { FilterConfig };