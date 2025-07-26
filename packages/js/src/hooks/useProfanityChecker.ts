import { useMemo, useState } from 'react';
import { Filter, FilterConfig } from '../filters/Filter';
import { CheckProfanityResult, Language, SeverityLevel } from '../types/types';
import globalWhitelistData from '@shared/dictionaries/globalWhitelist.json';

export interface ProfanityCheckerConfig {
  languages?: Language[];
  allLanguages?: boolean;
  caseSensitive?: boolean;
  wordBoundaries?: boolean;
  customWords?: string[];
  replaceWith?: string;
  severityLevels?: boolean;
  allowObfuscatedMatch?: boolean;
  fuzzyToleranceLevel?: number;
  minSeverity?: SeverityLevel;
  autoReplace?: boolean;
  customActions?: (result: CheckProfanityResult) => void;
}

export const useProfanityChecker = (config?: ProfanityCheckerConfig) => {
  const [result, setResult] = useState<CheckProfanityResult | null>(null);

  const filterConfig: FilterConfig = useMemo(() => {
    const effective: FilterConfig = {
      ...(config ?? {}),
      ignoreWords: globalWhitelistData.whitelist,
      fuzzyToleranceLevel: config?.fuzzyToleranceLevel ?? 0.8,
    };

    if (effective.allowObfuscatedMatch && effective.wordBoundaries) {
      console.warn(
        '[Glin-Profanity] Obfuscated match enabled → wordBoundaries will be ignored internally.',
      );
    }

    return effective;
  }, [config]);

  const filter = useMemo(() => new Filter(filterConfig), [filterConfig]);

  const checkText = (text: string) => {
    const checkResult = filter.checkProfanity(text);

    // Filter based on minSeverity (if provided)
    const filteredWords =
      config?.minSeverity && checkResult.severityMap
        ? checkResult.profaneWords.filter(
            (word) =>
              checkResult.severityMap &&
              checkResult.severityMap[word] >= config.minSeverity!,
          )
        : checkResult.profaneWords;

    // Optional auto-replace
    const autoReplaced =
      config?.autoReplace && checkResult.processedText
        ? checkResult.processedText
        : text;

    setResult(checkResult);
    config?.customActions?.(checkResult);

    return {
      ...checkResult,
      filteredWords,
      autoReplaced,
    };
  };

  const checkTextAsync = async (text: string) => {
    return new Promise<CheckProfanityResult>((resolve) => {
      const checkResult = checkText(text); // sync call
      resolve(checkResult);
    });
  };

  const isWordProfane = (word: string) => {
    return filter.checkProfanity(word).containsProfanity;
  };

  const reset = () => setResult(null);

  return {
    result,
    checkText,
    checkTextAsync,
    reset,
    isDirty: result?.containsProfanity ?? false,
    isWordProfane,
  };
};
