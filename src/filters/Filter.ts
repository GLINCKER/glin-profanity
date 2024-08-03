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
}

class Filter {
  private words: Map<string, number>;
  private caseSensitive: boolean;
  private wordBoundaries: boolean;
  private replaceWith?: string;
  private severityLevels: boolean;
  private ignoreWords: Set<string>;
  private logProfanity: boolean;

  constructor(config?: FilterConfig) {
    let words: string[] = [];
    this.caseSensitive = config?.caseSensitive ?? false;
    this.wordBoundaries = config?.wordBoundaries ?? true;
    this.replaceWith = config?.replaceWith;
    this.severityLevels = config?.severityLevels ?? false;
    this.ignoreWords = new Set(config?.ignoreWords?.map(word => word.toLowerCase()) || []);
    this.logProfanity = config?.logProfanity ?? false;

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

    this.words = new Map(words.map(word => [word, 1])); // Default severity level is 1
  }

  private getRegex(word: string): RegExp {
    const flags = this.caseSensitive ? 'g' : 'gi';
    const boundary = this.wordBoundaries ? '\\b' : '';
    return new RegExp(`${boundary}${word.replace(/(\W)/g, '\\$1')}${boundary}`, flags);
  }

  isProfane(value: string): boolean {
    for (const word of this.words.keys()) {
      if (!this.ignoreWords.has(word.toLowerCase()) && this.getRegex(word).test(value)) return true;
    }
    return false;
  }

  checkProfanity(text: string): CheckProfanityResult {
    const words = text.split(/\s+/);
    const profaneWords: string[] = [];
    const severityMap: { [word: string]: number } = {};

    for (const word of words) {
      if (this.words.has(word.toLowerCase()) && !this.ignoreWords.has(word.toLowerCase())) {
        profaneWords.push(word);
        severityMap[word] = this.words.get(word.toLowerCase())!;
      }
    }

    if (this.logProfanity && profaneWords.length > 0) {
      console.log(`Profane words detected: ${profaneWords.join(', ')}`);
    }

    let processedText = text;
    if (this.replaceWith) {
      for (const word of profaneWords) {
        processedText = processedText.replace(this.getRegex(word), this.replaceWith);
      }
    }

    return {
      containsProfanity: profaneWords.length > 0,
      profaneWords,
      processedText: this.replaceWith ? processedText : undefined,
      severityMap: this.severityLevels ? severityMap : undefined,
    };
  }
}

export { Filter };
