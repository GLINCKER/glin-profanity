import { CheckProfanityResult, Language } from '../types/types';
interface ProfanityCheckerConfig {
    languages?: Language[];
    allLanguages?: boolean;
    caseSensitive?: boolean;
    wordBoundaries?: boolean;
    customWords?: string[];
    replaceWith?: string;
    severityLevels?: boolean;
    customActions?: (result: CheckProfanityResult) => void;
}
export declare const useProfanityChecker: (config?: ProfanityCheckerConfig) => {
    result: CheckProfanityResult;
    checkText: (text: string) => void;
    checkTextAsync: (text: string) => Promise<CheckProfanityResult>;
};
export {};
//# sourceMappingURL=useProfanityChecker.d.ts.map