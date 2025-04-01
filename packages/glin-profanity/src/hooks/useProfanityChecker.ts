import { useMemo, useState } from 'react';
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
  allowObfuscatedMatch?: boolean;
  fuzzyToleranceLevel?: number;
  customActions?: (result: CheckProfanityResult) => void;
}

export const useProfanityChecker = (config?: ProfanityCheckerConfig) => {
  const [result, setResult] = useState<CheckProfanityResult | null>(null);

  const filterConfig = useMemo(() => {
    const effectiveConfig = {
      ...config,
      ignoreWords: globalWhitelistData.whitelist,
      fuzzyToleranceLevel: config?.fuzzyToleranceLevel ?? 0.8, // default fallback
    };

    // Optional - warn developer
    if (
      effectiveConfig.allowObfuscatedMatch &&
      effectiveConfig.wordBoundaries
    ) {
      console.warn(
        '[Glin-Profanity] Obfuscated match enabled → wordBoundaries will be ignored internally.',
      );
    }

    return effectiveConfig;
  }, [config]);

  const filter = useMemo(() => new Filter(filterConfig), [filterConfig]);

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

  const reset = () => setResult(null);

  return {
    result,
    checkText,
    checkTextAsync,
    reset,
  };
};
