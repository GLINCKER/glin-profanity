import { useState } from 'react';
import { Filter } from '../filters/Filter';
import { CheckProfanityResult, Language } from '../types/types';
import globalWhitelistData from '../data/globalWhitelist.json';

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

export const useProfanityChecker = (config?: ProfanityCheckerConfig) => {
  const [result, setResult] = useState<CheckProfanityResult | null>(null);
  const filterConfig = {
    ...config,
    globalWhitelist: globalWhitelistData.whitelist,  
  };

  const filter = new Filter(filterConfig);

  const checkText = (text: string) => {
    const checkResult = filter.checkProfanity(text);
    setResult(checkResult);
    if (config?.customActions) {
      config.customActions(checkResult);
    }
  };

  const checkTextAsync = async (text: string) => {
    return new Promise<CheckProfanityResult>((resolve) => {
      const checkResult = filter.checkProfanity(text);
      setResult(checkResult);
      if (config?.customActions) {
        config.customActions(checkResult);
      }
      resolve(checkResult);
    });
  };

  return {
    result,
    checkText,
    checkTextAsync,
  };
};
