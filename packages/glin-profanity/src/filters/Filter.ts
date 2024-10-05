// src/filters/Filter.ts
import globalWhitelistData from '../data/globalWhitelist.json';
import dictionary from '../data/dictionary';
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
  globalWhitelist?: string[];
}

class Filter {
  private words: Map<string, number>;
  private caseSensitive: boolean;
  private wordBoundaries: boolean;
  private replaceWith?: string;
  private severityLevels: boolean;
  private ignoreWords: Set<string>;
  private logProfanity: boolean;
  private globalWhitelist: Set<string>;

  constructor(config?: FilterConfig) {
    let words: string[] = [];
    this.caseSensitive = config?.caseSensitive ?? false;
    this.wordBoundaries = config?.wordBoundaries ?? true;
    this.replaceWith = config?.replaceWith;
    this.severityLevels = config?.severityLevels ?? false;
    this.ignoreWords = new Set(config?.ignoreWords?.map(word => word.toLowerCase()) || []);
    this.logProfanity = config?.logProfanity ?? false;

    const jsonWhitelist = globalWhitelistData.whitelist.map(word => word.toLowerCase());
    const mergedWhitelist = [...jsonWhitelist, ...(config?.globalWhitelist ?? [])];
    this.globalWhitelist = new Set(mergedWhitelist);

    if (config?.allLanguages) {
      for (const lang in dictionary) {
        if (dictionary.hasOwnProperty(lang)) {
          words = [...words, ...dictionary[lang as Language]];
        }
      }
    } else {
      const languages = config?.languages || ['english'];
      const languagesChecks = new Set<Language>(languages);
      if (languagesChecks.size !== 0) {
        languagesChecks.forEach(lang => {
          words = [...words, ...dictionary[lang]];
        });
      }
    }

    if (config?.customWords) {
      words = [...words, ...config.customWords];
    }

    this.words = new Map(words.map(word => [word.toLowerCase(), 1])); // Store words in lowercase
  }

  private getRegex(word: string): RegExp {
    const flags = this.caseSensitive ? 'g' : 'gi';
    const boundary = this.wordBoundaries ? '\\b' : '';
    return new RegExp(`${boundary}${word.replace(/(\W)/g, '\\$1')}${boundary}`, flags);
  }

  private isFuzzyMatch(word: string, text: string): boolean {
    const pattern = `${word.split('').join('[^a-zA-Z]*')}`;
    const regex = new RegExp(pattern, this.caseSensitive ? 'g' : 'gi');
    return regex.test(text);
  }

  private isMergedMatch(word: string, text: string): boolean {
    const pattern = `${word}`;
    const regex = new RegExp(pattern, this.caseSensitive ? 'g' : 'gi');
    return regex.test(text);
  }

  private evaluateSeverity(word: string, text: string): number | undefined {
    if (this.getRegex(word).test(text)) {
      return 1; // Exact match
    } else if (this.isFuzzyMatch(word, text)) {
      return 2; // Fuzzy match
    } else if (this.isMergedMatch(word, text)) {
      return 3; // Merged word match
    }
    return undefined; // No match or irrelevant match
  }

  isProfane(value: string): boolean {
    for (const word of this.words.keys()) {
      if (!this.ignoreWords.has(word.toLowerCase()) && !this.globalWhitelist.has(word.toLowerCase()) && this.evaluateSeverity(word, value) !== undefined) {
        return true;
      }
    }
    return false;
  }

  checkProfanityInSentence(text: string): CheckProfanityResult {
    const words = text.split(/\s+/);
    const profaneWords: string[] = [];
    const severityMap: { [word: string]: number } = {};

    for (const word of words) {
      for (const dictWord of this.words.keys()) {
        const severity = this.evaluateSeverity(dictWord, word);
        if (severity !== undefined && !this.ignoreWords.has(dictWord.toLowerCase())) {
          profaneWords.push(word);
          severityMap[word] = severity; // Use the actual word found in text as the key
        }
      }
    }

    let processedText = text;
    if (this.replaceWith) {
      for (const word of profaneWords) {
        processedText = processedText.replace(new RegExp(word, 'gi'), this.replaceWith);
      }
    }

    return {
      containsProfanity: profaneWords.length > 0,
      profaneWords,
      processedText: this.replaceWith ? processedText : undefined,
      severityMap: Object.keys(severityMap).length > 0 ? severityMap : undefined, // Only return if there are valid severities
    };
  }

  checkProfanity(text: string): CheckProfanityResult {
    const words = text.split(/\s+/);
    const profaneWords: string[] = [];
    const severityMap: { [word: string]: number } = {};

    // Check each word individually
    for (const word of words) {
      for (const dictWord of this.words.keys()) {
        const severity = this.evaluateSeverity(dictWord, word);
        if (severity !== undefined && !this.ignoreWords.has(dictWord.toLowerCase())) {
          profaneWords.push(word);
          severityMap[word] = severity; // Use the actual word found in text as the key
        }
      }
    }

    const sentenceResult = this.checkProfanityInSentence(text);
    profaneWords.push(...sentenceResult.profaneWords);
    Object.assign(severityMap, sentenceResult.severityMap);

    let processedText = text;
    if (this.replaceWith) {
      for (const word of profaneWords) {
        processedText = processedText.replace(new RegExp(word, 'gi'), this.replaceWith);
      }
    }

    return {
      containsProfanity: profaneWords.length > 0,
      profaneWords: Array.from(new Set(profaneWords)),
      processedText: this.replaceWith ? processedText : undefined,
      severityMap: Object.keys(severityMap).length > 0 ? severityMap : undefined,
    };
  }
}

export { Filter };
