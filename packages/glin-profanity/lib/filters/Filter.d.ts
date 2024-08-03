import { Language, CheckProfanityResult } from '../types/types';
interface FilterConfig {
    languages?: Language[];
    allLanguages?: boolean;
    caseSensitive?: boolean;
    wordBoundaries?: boolean;
    customWords?: string[];
    replaceWith?: string;
    severityLevels?: boolean;
    ignoreWords?: string[];
    logProfanity?: boolean;
}
declare class Filter {
    private words;
    private caseSensitive;
    private wordBoundaries;
    private replaceWith?;
    private severityLevels;
    private ignoreWords;
    private logProfanity;
    constructor(config?: FilterConfig);
    private getRegex;
    isProfane(value: string): boolean;
    checkProfanity(text: string): CheckProfanityResult;
}
export { Filter };
//# sourceMappingURL=Filter.d.ts.map