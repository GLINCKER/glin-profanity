import { useState, useCallback } from 'react';
import { checkProfanity, checkProfanityAsync, isWordProfane } from '../core';
import type { ProfanityCheckerConfig } from '../core/types';
import type { CheckProfanityResult } from '../types/types';

export type { ProfanityCheckerConfig };

export const useProfanityChecker = (config?: ProfanityCheckerConfig) => {
  const [result, setResult] = useState<CheckProfanityResult | null>(null);

  const checkText = useCallback((text: string) => {
    const checkResult = checkProfanity(text, config);
    setResult(checkResult);
    return checkResult;
  }, [config]);

  const checkTextAsync = useCallback(async (text: string) => {
    const checkResult = await checkProfanityAsync(text, config);
    setResult(checkResult);
    return checkResult;
  }, [config]);

  const isWordProfaneCallback = useCallback((word: string) => {
    return isWordProfane(word, config);
  }, [config]);

  const reset = useCallback(() => setResult(null), []);

  return {
    result,
    checkText,
    checkTextAsync,
    reset,
    isDirty: result?.containsProfanity ?? false,
    isWordProfane: isWordProfaneCallback,
  };
};
