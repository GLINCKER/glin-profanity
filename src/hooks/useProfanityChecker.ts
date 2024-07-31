import { useState } from 'react';
import { Filter, CheckProfanityResult } from '../filters/Filter';
import { Language } from '../types/Language';

interface ProfanityCheckerConfig {
  languages?: Language[];
  allLanguages?: boolean;
}

export const useProfanityChecker = (config?: ProfanityCheckerConfig) => {
  const [result, setResult] = useState<CheckProfanityResult | null>(null);
  const filter = new Filter(config);

  const checkText = (text: string) => {
    setResult(filter.checkProfanity(text));
  };

  return {
    result,
    checkText
  };
};
