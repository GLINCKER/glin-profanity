import { useState } from 'react';
import { checkProfanity, CheckProfanityResult } from '../filters/profanityFilter';

export const useProfanityChecker = (language: string = 'en') => {
  const [result, setResult] = useState<CheckProfanityResult | null>(null);

  const checkText = (text: string) => {
    const result = checkProfanity(text, language);
    setResult(result);
  };

  return {
    result,
    checkText
  };
};
