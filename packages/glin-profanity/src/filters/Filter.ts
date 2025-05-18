import dictionary from '../data/dictionary';
import { Language, CheckProfanityResult, SeverityLevel } from '../types/types';

export interface FilterConfig {
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
}

class Filter {
  private words: Map<string, number>;
  private caseSensitive: boolean;
  private wordBoundaries: boolean;
  private replaceWith?: string;
  private severityLevels: boolean;
  private ignoreWords: Set<string>;
  private logProfanity: boolean;
  private allowObfuscatedMatch: boolean;
  private fuzzyToleranceLevel: number;

  constructor(config?: FilterConfig) {
    let words: string[] = [];

    this.caseSensitive = config?.caseSensitive ?? false;
    this.allowObfuscatedMatch = config?.allowObfuscatedMatch ?? false;
    this.wordBoundaries = config?.wordBoundaries ?? !this.allowObfuscatedMatch;
    this.replaceWith = config?.replaceWith;
    this.severityLevels = config?.severityLevels ?? false;
    this.ignoreWords = new Set(
      config?.ignoreWords?.map((word) => word.toLowerCase()) || [],
    );
    this.logProfanity = config?.logProfanity ?? false;
    this.fuzzyToleranceLevel = config?.fuzzyToleranceLevel ?? 0.8;

    if (config?.allLanguages) {
      for (const lang in dictionary) {
        if (dictionary.hasOwnProperty(lang)) {
          words = [...words, ...dictionary[lang as Language]];
        }
      }
    } else {
      const languages = config?.languages || ['english'];
      const languagesChecks = new Set<Language>(languages);
      languagesChecks.forEach((lang) => {
        words = [...words, ...dictionary[lang]];
      });
    }

    if (config?.customWords) {
      words = [...words, ...config.customWords];
    }

    this.words = new Map(words.map((word) => [word.toLowerCase(), 1]));
  }

  private debugLog(...args: any[]) {
    if (this.logProfanity) {
      console.log('[glin-profanity]', ...args);
    }
  }

  private normalizeObfuscated(text: string): string {
    let normalized = text.replace(/([a-zA-Z])\1{1,}/g, '$1$1');
    const charMap: { [key: string]: string } = {
      '@': 'a',
      $: 's',
      '!': 'i',
      '1': 'i',
      '*': '',
    };
    normalized = normalized.replace(/[@$!1*]/g, (m) => charMap[m] || m);
    return normalized;
  }

  private getRegex(word: string): RegExp {
    const flags = this.caseSensitive ? 'g' : 'gi';
    const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const boundary = this.wordBoundaries ? '\\b' : '';
    return new RegExp(`${boundary}${escapedWord}${boundary}`, flags);
  }

  private isFuzzyToleranceMatch(word: string, text: string): boolean {
    const simplifiedText = text.toLowerCase().replace(/[^a-z]/g, '');
    const simplifiedWord = word.toLowerCase();
    let matchCount = 0;
    let index = 0;

    for (let i = 0; i < simplifiedText.length; i++) {
      if (simplifiedText[i] === simplifiedWord[index]) {
        matchCount++;
        index++;
        if (index === simplifiedWord.length) break;
      }
    }

    const score = matchCount / simplifiedWord.length;
    return score >= this.fuzzyToleranceLevel;
  }

  private evaluateSeverity(
    word: string,
    text: string,
  ): SeverityLevel | undefined {
    if (this.wordBoundaries && this.getRegex(word).test(text)) {
      return SeverityLevel.Exact;
    }
    if (this.getRegex(word).test(text)) return SeverityLevel.Exact;
    if (this.isFuzzyToleranceMatch(word, text)) return SeverityLevel.Fuzzy;
    return undefined;
  }

  isProfane(value: string): boolean {
    let input = this.allowObfuscatedMatch
      ? this.normalizeObfuscated(value)
      : value;

    for (const word of this.words.keys()) {
      if (
        !this.ignoreWords.has(word.toLowerCase()) &&
        this.evaluateSeverity(word, input) !== undefined
      ) {
        return true;
      }
    }
    return false;
  }

  matches(word: string): boolean {
    return this.isProfane(word);
  }

  checkProfanity(text: string): CheckProfanityResult {
    let input = this.allowObfuscatedMatch
      ? this.normalizeObfuscated(text)
      : text;

    input = input.toLowerCase();

    const profaneWords: string[] = [];
    const severityMap: Record<string, SeverityLevel> = {};

    for (const dictWord of this.words.keys()) {
      if (this.ignoreWords.has(dictWord.toLowerCase())) continue;

      const severity = this.evaluateSeverity(dictWord, input);
      if (severity !== undefined) {
        const regex = this.getRegex(dictWord);
        let match;
        while ((match = regex.exec(input)) !== null) {
          profaneWords.push(match[0]);
          if (severityMap[match[0]] === undefined) {
            severityMap[match[0]] = severity;
          }
        }
      }
    }

    if (profaneWords.length > 0) {
      this.debugLog('Detected:', profaneWords);
    }

    let processedText = text;
    if (this.replaceWith && profaneWords.length > 0) {
      const uniqueWords = Array.from(new Set(profaneWords));
      for (const word of uniqueWords) {
        const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const replacementRegex = this.wordBoundaries
          ? new RegExp(`\\b${escaped}\\b`, 'gi')
          : new RegExp(escaped, 'gi');
        processedText = processedText.replace(
          replacementRegex,
          this.replaceWith,
        );
      }
    }

    return {
      containsProfanity: profaneWords.length > 0,
      profaneWords: Array.from(new Set(profaneWords)),
      processedText: this.replaceWith ? processedText : undefined,
      severityMap:
        this.severityLevels && Object.keys(severityMap).length > 0
          ? severityMap
          : undefined,
    };
  }

  checkProfanityWithMinSeverity(
    text: string,
    minSeverity: SeverityLevel = SeverityLevel.Exact,
  ): { filteredWords: string[]; result: CheckProfanityResult } {
    const result = this.checkProfanity(text);
    const filteredWords =
      result.severityMap && result.profaneWords.length > 0
        ? result.profaneWords.filter((word) => {
            const severity = result.severityMap?.[word];
            return typeof severity === 'number' && severity >= minSeverity;
          })
        : [];

    return { filteredWords, result };
  }
}

export { Filter };
