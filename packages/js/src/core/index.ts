import { Filter, FilterConfig } from '../filters/Filter';
import { ProfanityCheckerConfig, ProfanityCheckResult } from './types';
import globalWhitelistData from '@shared/dictionaries/globalWhitelist.json';

function createFilterConfig(config?: ProfanityCheckerConfig): FilterConfig {
  const effective: FilterConfig = {
    ...(config ?? {}),
    ignoreWords: (globalWhitelistData as any).whitelist,
    fuzzyToleranceLevel: config?.fuzzyToleranceLevel ?? 0.8,
  };

  if (effective.allowObfuscatedMatch && effective.wordBoundaries) {
    console.warn(
      '[Glin-Profanity] Obfuscated match enabled → wordBoundaries will be ignored internally.',
    );
  }

  return effective;
}

export function checkProfanity(text: string, config?: ProfanityCheckerConfig): ProfanityCheckResult {
  const filterConfig = createFilterConfig(config);
  const filter = new Filter(filterConfig);
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

  // Custom actions
  config?.customActions?.(checkResult);

  return {
    ...checkResult,
    filteredWords,
    autoReplaced,
  };
}

export async function checkProfanityAsync(text: string, config?: ProfanityCheckerConfig): Promise<ProfanityCheckResult> {
  return Promise.resolve(checkProfanity(text, config));
}

export function isWordProfane(word: string, config?: ProfanityCheckerConfig): boolean {
  return checkProfanity(word, config).containsProfanity;
}