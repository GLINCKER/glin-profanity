declare module 'glin-profanity' {
    export type Language = 'english' | 'french' | 'spanish' | 'german' | 'italian' | 'portuguese' | 'russian' | 'japanese' | 'chinese' | 'korean';
  
    export interface CheckProfanityResult {
      containsProfanity: boolean;
      profaneWords: string[];
      processedText?: string;
      severityMap?: { [word: string]: number };
    }
  
    export interface ProfanityCheckerConfig {
      languages?: Language[];
      allLanguages?: boolean;
      caseSensitive?: boolean;
      wordBoundaries?: boolean;
      customWords?: string[];
      replaceWith?: string;
      severityLevels?: boolean;
      ignoreWords?: string[];
      logProfanity?: boolean;
      customActions?: (result: CheckProfanityResult) => void;
    }
  
    export class Filter {
      constructor(config?: ProfanityCheckerConfig);
      isProfane(value: string): boolean;
      checkProfanity(text: string): CheckProfanityResult;
    }
  
    export function useProfanityChecker(config?: ProfanityCheckerConfig): {
      result: CheckProfanityResult | null;
      checkText: (text: string) => void;
      checkTextAsync: (text: string) => Promise<CheckProfanityResult>;
    };
  }
  