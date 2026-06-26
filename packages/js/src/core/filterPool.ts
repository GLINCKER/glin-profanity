import { Filter, FilterConfig } from '../filters/Filter';
import type { Language } from '../types/types';
import type { ProfanityCheckerConfig } from './types';
import globalWhitelistData from '@shared/dictionaries/globalWhitelist.json';

const FILTER_POOL_MAX = 32;
const filterPool = new Map<string, Filter>();

export function createFilterConfig(config?: ProfanityCheckerConfig): FilterConfig {
  const effective: FilterConfig = {
    ...(config ?? {}),
    ignoreWords: [
      ...(globalWhitelistData as { whitelist: string[] }).whitelist,
      ...(config?.ignoreWords ?? []),
    ],
    fuzzyToleranceLevel: config?.fuzzyToleranceLevel ?? 0.8,
  };

  if (effective.allowObfuscatedMatch && effective.wordBoundaries) {
    console.warn(
      '[Glin-Profanity] Obfuscated match enabled → wordBoundaries will be ignored internally.',
    );
  }

  return effective;
}

function normalizeConfigForKey(config: FilterConfig): FilterConfig {
  const normalized: FilterConfig = { ...config };

  if (normalized.languages) {
    normalized.languages = [...normalized.languages].sort();
  }
  if (normalized.ignoreWords) {
    normalized.ignoreWords = [...normalized.ignoreWords].sort();
  }
  if (normalized.customWords) {
    normalized.customWords = [...normalized.customWords].sort();
  }
  if (normalized.domainWhitelists) {
    const source = normalized.domainWhitelists;
    normalized.domainWhitelists = Object.keys(source)
      .sort()
      .reduce(
        (acc, lang) => {
          acc[lang as Language] = [...(source[lang as Language] ?? [])].sort();
          return acc;
        },
        {} as typeof source,
      );
  }

  return normalized;
}

function configCacheKey(config: FilterConfig): string {
  return JSON.stringify(normalizeConfigForKey(config));
}

/**
 * Returns a shared Filter instance for the given configuration.
 * Instances are evicted in FIFO order when the pool exceeds FILTER_POOL_MAX.
 */
export function getPooledFilter(config: FilterConfig): Filter {
  const key = configCacheKey(config);
  const existing = filterPool.get(key);
  if (existing) {
    filterPool.delete(key);
    filterPool.set(key, existing);
    return existing;
  }

  const filter = new Filter(config);
  if (filterPool.size >= FILTER_POOL_MAX) {
    const oldestKey = filterPool.keys().next().value;
    if (oldestKey) {
      filterPool.delete(oldestKey);
    }
  }
  filterPool.set(key, filter);
  return filter;
}

/** Clears all pooled Filter instances (intended for tests). */
export function clearFilterPool(): void {
  filterPool.clear();
}
