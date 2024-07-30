import badWords from '../data/badWords.json';

interface BadWords {
  [key: string]: string[];
}

const badWordsList: BadWords = badWords;

export interface CheckProfanityResult {
  containsProfanity: boolean;
  profaneWords: string[];
}

export const checkProfanity = (text: string, language: string = 'en'): CheckProfanityResult => {
  const words = text.split(/\s+/);
  const badWordsForLanguage = badWordsList[language] || [];
  const profaneWords = words.filter(word => badWordsForLanguage.includes(word.toLowerCase()));

  return {
    containsProfanity: profaneWords.length > 0,
    profaneWords
  };
};
