import { CheckProfanityResult, Language, SeverityLevel, FilterConfig } from '../types/types';

export interface ProfanityCheckerConfig {
  languages?: Language[];
  allLanguages?: boolean;
  caseSensitive?: boolean;
  wordBoundaries?: boolean;
  customWords?: string[];
  replaceWith?: string;
  severityLevels?: boolean;
  allowObfuscatedMatch?: boolean;
  fuzzyToleranceLevel?: number;
  minSeverity?: SeverityLevel;
  autoReplace?: boolean;
  customActions?: (result: CheckProfanityResult) => void;
}

export interface ProfanityCheckResult extends CheckProfanityResult {
  filteredWords: string[];
  autoReplaced: string;
}

export type { 
  CheckProfanityResult, 
  Language, 
  SeverityLevel,
  FilterConfig 
} from '../types/types';