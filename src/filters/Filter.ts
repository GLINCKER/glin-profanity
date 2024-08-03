import dictionary from '../data/dictionary';
import { Language, CheckProfanityResult } from '../types/types';

interface FilterConfig {
  languages?: Language[];
  allLanguages?: boolean;
  caseSensitive?: boolean;
  wordBoundaries?: boolean;
  customWords?: string[];
}

class Filter {
  private words: Set<string>;
  private caseSensitive: boolean;
  private wordBoundaries: boolean;

  constructor(config?: FilterConfig) {
    let words: string[] = [];
    this.caseSensitive = config?.caseSensitive ?? false;
    this.wordBoundaries = config?.wordBoundaries ?? true;

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

    this.words = new Set<string>(words);
  }

  isProfane(value: string): boolean {
    const flags = this.caseSensitive ? 'g' : 'gi';
    for (const word of this.words) {
      const boundary = this.wordBoundaries ? '\\b' : '';
      const wordExp = new RegExp(`${boundary}${word.replace(/(\W)/g, '\\$1')}${boundary}`, flags);
      if (wordExp.test(value)) return true;
    }
    return false;
  }

  checkProfanity(text: string): CheckProfanityResult {
    const words = text.split(/\s+/);
    const profaneWords: string[] = [];

    for (const word of words) {
      if (this.isProfane(word)) {
        profaneWords.push(word);
      }
    }

    return {
      containsProfanity: profaneWords.length > 0,
      profaneWords,
    };
  }
}

export { Filter };
