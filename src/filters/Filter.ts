import dictionary from '../data/dictionary';
import { Language } from '../types/Language';

interface CheckProfanityResult {
  containsProfanity: boolean;
  profaneWords: string[];
}

class Filter {
  private words: Set<string>;

  constructor(config?: { languages?: Language[]; allLanguages?: boolean }) {
    let words: string[] = [];

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
    this.words = new Set<string>(words);
  }

  isProfane(value: string): boolean {
    for (const word of this.words) {
      const wordExp = new RegExp(`\\b${word.replace(/(\W)/g, '\\$1')}\\b`, 'gi');
      if (wordExp.test(value)) return true;
    }
    return false;
  }

  checkProfanity(text: string): CheckProfanityResult {
    const words = text.split(/\s+/);
    const profaneWords: string[] = [];

    for (const word of words) {
      if (this.words.has(word.toLowerCase())) {
        profaneWords.push(word);
      }
    }

    return {
      containsProfanity: profaneWords.length > 0,
      profaneWords
    };
  }
}

export { Filter, CheckProfanityResult };
