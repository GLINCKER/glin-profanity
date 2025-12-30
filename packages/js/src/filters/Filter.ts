import dictionary from '../data/dictionary';
import { Language, CheckProfanityResult, SeverityLevel, Match, FilterConfig, LeetspeakLevel } from '../types/types';
import { ContextAnalyzer } from '../nlp/contextAnalyzer';
import { normalizeLeetspeak } from '../utils/leetspeak';
import { normalizeUnicode } from '../utils/unicode';

export type { FilterConfig };

/**
 * Core profanity filter class.
 * Provides comprehensive profanity detection with support for multiple languages,
 * leetspeak detection, Unicode normalization, and context-aware filtering.
 *
 * @example
 * ```typescript
 * const filter = new Filter({
 *   languages: ['english'],
 *   detectLeetspeak: true,
 *   normalizeUnicode: true,
 * });
 *
 * filter.isProfane('f4ck');  // Returns: true
 * filter.isProfane('fυck');  // Returns: true (Greek upsilon)
 * ```
 */
class Filter {
  private words: Map<string, number>;
  private caseSensitive: boolean;
  private wordBoundaries: boolean;
  private replaceWith?: string;
  private severityLevels: boolean;
  private ignoreWords: Set<string>;
  private logProfanity: boolean;
  private allowObfuscatedMatch: boolean;
  private fuzzyToleranceLevel: number;
  // Context-aware filtering properties
  private enableContextAware: boolean;
  private contextWindow: number;
  private confidenceThreshold: number;
  private contextAnalyzer?: ContextAnalyzer;
  private primaryLanguage: Language;
  // Leetspeak and Unicode detection
  private detectLeetspeak: boolean;
  private leetspeakLevel: LeetspeakLevel;
  private normalizeUnicodeEnabled: boolean;
  // Caching
  private cacheResults: boolean;
  private maxCacheSize: number;
  private cache: Map<string, CheckProfanityResult>;

  /**
   * Creates a new Filter instance with the specified configuration.
   *
   * @param config - Filter configuration options
   *
   * @example
   * ```typescript
   * // Basic usage
   * const filter = new Filter({ languages: ['english'] });
   *
   * // With leetspeak detection
   * const filter = new Filter({
   *   languages: ['english'],
   *   detectLeetspeak: true,
   *   leetspeakLevel: 'moderate',
   * });
   *
   * // With all advanced features
   * const filter = new Filter({
   *   languages: ['english', 'spanish'],
   *   detectLeetspeak: true,
   *   normalizeUnicode: true,
   *   cacheResults: true,
   *   enableContextAware: true,
   * });
   * ```
   */
  constructor(config?: FilterConfig) {
    const defaultLanguage: Language = 'english';

    // Context-aware settings
    this.enableContextAware = config?.enableContextAware ?? false;
    this.contextWindow = config?.contextWindow ?? 3;
    this.confidenceThreshold = config?.confidenceThreshold ?? 0.7;
    this.primaryLanguage = config?.languages?.[0] || defaultLanguage;

    if (this.enableContextAware) {
      this.contextAnalyzer = new ContextAnalyzer({
        contextWindow: this.contextWindow,
        language: this.primaryLanguage,
        domainWhitelists: config?.domainWhitelists?.[this.primaryLanguage] || []
      });
    }

    // Basic settings
    this.caseSensitive = config?.caseSensitive ?? false;
    this.allowObfuscatedMatch = config?.allowObfuscatedMatch ?? false;
    this.wordBoundaries = config?.wordBoundaries ?? !this.allowObfuscatedMatch;
    this.replaceWith = config?.replaceWith;
    this.severityLevels = config?.severityLevels ?? false;
    this.ignoreWords = new Set(
      config?.ignoreWords?.map((word) => word.toLowerCase()) || [],
    );
    this.logProfanity = config?.logProfanity ?? false;
    this.fuzzyToleranceLevel = config?.fuzzyToleranceLevel ?? 0.8;

    // Leetspeak and Unicode normalization settings
    this.detectLeetspeak = config?.detectLeetspeak ?? false;
    this.leetspeakLevel = config?.leetspeakLevel ?? 'moderate';
    this.normalizeUnicodeEnabled = config?.normalizeUnicode ?? true;

    // Caching settings
    this.cacheResults = config?.cacheResults ?? false;
    this.maxCacheSize = config?.maxCacheSize ?? 1000;
    this.cache = new Map();

    // Build word dictionary
    let words: string[] = [];

    if (config?.allLanguages) {
      for (const lang in dictionary) {
        if (Object.prototype.hasOwnProperty.call(dictionary, lang)) {
          words = [...words, ...dictionary[lang as Language]];
        }
      }
    } else {
      const languages = config?.languages || ['english'];
      const languagesChecks = new Set<Language>(languages);
      languagesChecks.forEach((lang) => {
        words = [...words, ...dictionary[lang]];
      });
    }

    if (config?.customWords) {
      words = [...words, ...config.customWords];
    }

    this.words = new Map(words.map((word) => [word.toLowerCase(), 1]));
  }

  private debugLog(...args: unknown[]) {
    if (this.logProfanity) {
      console.log('[glin-profanity]', ...args);
    }
  }

  /**
   * Normalizes text for profanity detection using all enabled normalization methods.
   * Applies Unicode normalization, leetspeak detection, and obfuscation handling.
   *
   * @param text - The input text to normalize
   * @returns The normalized text
   */
  private normalizeText(text: string): string {
    let normalized = text;

    // Step 1: Apply Unicode normalization (handles homoglyphs, diacritics, etc.)
    if (this.normalizeUnicodeEnabled) {
      normalized = normalizeUnicode(normalized);
    }

    // Step 2: Apply leetspeak normalization
    if (this.detectLeetspeak) {
      normalized = normalizeLeetspeak(normalized, {
        level: this.leetspeakLevel,
        collapseRepeated: true,
        removeSpacedChars: true,
      });
    }

    // Step 3: Apply legacy obfuscation handling (for backward compatibility)
    if (this.allowObfuscatedMatch && !this.detectLeetspeak) {
      normalized = this.normalizeObfuscated(normalized);
    }

    return normalized;
  }

  /**
   * Legacy obfuscation normalization method (for backward compatibility).
   * @deprecated Use normalizeText() with detectLeetspeak option instead.
   */
  private normalizeObfuscated(text: string): string {
    let normalized = text.replace(/([a-zA-Z])\1{1,}/g, '$1$1');
    const charMap: { [key: string]: string } = {
      '@': 'a',
      $: 's',
      '!': 'i',
      '1': 'i',
      '*': '',
    };
    normalized = normalized.replace(/[@$!1*]/g, (m) => charMap[m] || m);
    return normalized;
  }

  /**
   * Clears the result cache.
   * Useful when dictionary or configuration changes.
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Gets the current cache size.
   * @returns Number of cached results
   */
  public getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * Exports the current filter configuration as a JSON-serializable object.
   * Useful for saving configuration to files or sharing between environments.
   *
   * @returns The current filter configuration
   *
   * @example
   * ```typescript
   * const filter = new Filter({
   *   languages: ['english', 'spanish'],
   *   detectLeetspeak: true,
   *   leetspeakLevel: 'aggressive',
   * });
   *
   * const config = filter.getConfig();
   * // Save to file: fs.writeFileSync('filter.config.json', JSON.stringify(config));
   *
   * // Later, restore:
   * // const saved = JSON.parse(fs.readFileSync('filter.config.json'));
   * // const restored = new Filter(saved);
   * ```
   */
  public getConfig(): FilterConfig {
    return {
      languages: [this.primaryLanguage],
      caseSensitive: this.caseSensitive,
      wordBoundaries: this.wordBoundaries,
      replaceWith: this.replaceWith,
      severityLevels: this.severityLevels,
      ignoreWords: Array.from(this.ignoreWords),
      logProfanity: this.logProfanity,
      allowObfuscatedMatch: this.allowObfuscatedMatch,
      fuzzyToleranceLevel: this.fuzzyToleranceLevel,
      enableContextAware: this.enableContextAware,
      contextWindow: this.contextWindow,
      confidenceThreshold: this.confidenceThreshold,
      detectLeetspeak: this.detectLeetspeak,
      leetspeakLevel: this.leetspeakLevel,
      normalizeUnicode: this.normalizeUnicodeEnabled,
      cacheResults: this.cacheResults,
      maxCacheSize: this.maxCacheSize,
    };
  }

  /**
   * Returns the current word dictionary size.
   * Useful for monitoring and debugging.
   *
   * @returns Number of words in the dictionary
   */
  public getWordCount(): number {
    return this.words.size;
  }

  /**
   * Adds a result to the cache, evicting oldest entries if necessary.
   */
  private addToCache(key: string, result: CheckProfanityResult): void {
    if (!this.cacheResults) return;

    // Simple LRU-like eviction: remove oldest entries when at capacity
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, result);
  }

  /**
   * Gets a cached result if available.
   */
  private getFromCache(key: string): CheckProfanityResult | undefined {
    if (!this.cacheResults) return undefined;
    return this.cache.get(key);
  }

  private getRegex(word: string): RegExp {
    const flags = this.caseSensitive ? 'g' : 'gi';
    const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const boundary = this.wordBoundaries ? '\\b' : '';
    return new RegExp(`${boundary}${escapedWord}${boundary}`, flags);
  }

  private isFuzzyToleranceMatch(word: string, text: string): boolean {
    const simplifiedText = text.toLowerCase().replace(/[^a-z]/g, '');
    const simplifiedWord = word.toLowerCase();
    let matchCount = 0;
    let index = 0;

    for (let i = 0; i < simplifiedText.length; i++) {
      if (simplifiedText[i] === simplifiedWord[index]) {
        matchCount++;
        index++;
        if (index === simplifiedWord.length) break;
      }
    }

    const score = matchCount / simplifiedWord.length;
    return score >= this.fuzzyToleranceLevel;
  }

  private evaluateSeverity(
    word: string,
    text: string,
  ): SeverityLevel | undefined {
    if (this.wordBoundaries && this.getRegex(word).test(text)) {
      return SeverityLevel.EXACT;
    }
    if (this.getRegex(word).test(text)) return SeverityLevel.EXACT;
    if (this.isFuzzyToleranceMatch(word, text)) return SeverityLevel.FUZZY;
    return undefined;
  }

  /**
   * Checks if the given text contains profanity.
   *
   * @param value - The text to check
   * @returns True if the text contains profanity
   *
   * @example
   * ```typescript
   * const filter = new Filter({ detectLeetspeak: true });
   *
   * filter.isProfane('hello');     // false
   * filter.isProfane('fuck');      // true
   * filter.isProfane('f4ck');      // true (leetspeak)
   * filter.isProfane('fυck');      // true (Unicode homoglyph)
   * ```
   */
  isProfane(value: string): boolean {
    // Apply all normalizations
    const input = this.normalizeText(value);

    for (const word of this.words.keys()) {
      if (
        !this.ignoreWords.has(word.toLowerCase()) &&
        this.evaluateSeverity(word, input) !== undefined
      ) {
        return true;
      }
    }
    return false;
  }

  matches(word: string): boolean {
    return this.isProfane(word);
  }

  /**
   * Performs a comprehensive profanity check on the given text.
   *
   * @param text - The text to check for profanity
   * @returns Result object containing detected profanity information
   *
   * @example
   * ```typescript
   * const filter = new Filter({
   *   languages: ['english'],
   *   detectLeetspeak: true,
   *   normalizeUnicode: true,
   * });
   *
   * const result = filter.checkProfanity('This is f4ck!ng bad');
   * console.log(result.containsProfanity);  // true
   * console.log(result.profaneWords);       // ['fuck']
   *
   * // With caching for repeated checks
   * const filter2 = new Filter({ cacheResults: true });
   * filter2.checkProfanity('same text');  // Computed
   * filter2.checkProfanity('same text');  // Retrieved from cache
   * ```
   */
  checkProfanity(text: string): CheckProfanityResult {
    // Check cache first
    const cacheKey = text;
    const cachedResult = this.getFromCache(cacheKey);
    if (cachedResult) {
      this.debugLog('Cache hit for:', text.substring(0, 50));
      return cachedResult;
    }

    // Backward compatibility: if not context-aware, run old logic
    if (!this.enableContextAware) {
      // Apply all normalizations
      let input = this.normalizeText(text);
      input = input.toLowerCase();

      const profaneWords: string[] = [];
      const severityMap: Record<string, SeverityLevel> = {};

      for (const dictWord of this.words.keys()) {
        if (this.ignoreWords.has(dictWord.toLowerCase())) continue;

        const severity = this.evaluateSeverity(dictWord, input);
        if (severity !== undefined) {
          const regex = this.getRegex(dictWord);
          let match;
          while ((match = regex.exec(input)) !== null) {
            profaneWords.push(match[0]);
            if (severityMap[match[0]] === undefined) {
              severityMap[match[0]] = severity;
            }
          }
        }
      }

      let processedText = text;
      if (this.replaceWith && profaneWords.length > 0) {
        const uniqueWords = Array.from(new Set(profaneWords));
        for (const word of uniqueWords) {
          const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const replacementRegex = this.wordBoundaries
            ? new RegExp(`\\b${escaped}\\b`, 'gi')
            : new RegExp(escaped, 'gi');
          processedText = processedText.replace(
            replacementRegex,
            this.replaceWith,
          );
        }
      }

      const result: CheckProfanityResult = {
        containsProfanity: profaneWords.length > 0,
        profaneWords: Array.from(new Set(profaneWords)),
        processedText: this.replaceWith ? processedText : undefined,
        severityMap:
          this.severityLevels && Object.keys(severityMap).length > 0
            ? severityMap
            : undefined,
      };

      // Cache the result
      this.addToCache(cacheKey, result);
      return result;
    }

    // Context-aware path
    // Apply all normalizations
    let input = this.normalizeText(text);
    input = input.toLowerCase();
    const originalText = text;
    const profaneWords: string[] = [];
    const severityMap: Record<string, SeverityLevel> = {};
    const matches: Match[] = [];

    for (const dictWord of this.words.keys()) {
      if (this.ignoreWords.has(dictWord.toLowerCase())) continue;
      const severity = this.evaluateSeverity(dictWord, input);
      if (severity !== undefined) {
        const regex = this.getRegex(dictWord);
        let match;
        while ((match = regex.exec(input)) !== null) {
          const matchedWord = match[0];
          const matchIndex = match.index;
          const matchObj: Match = {
            word: matchedWord,
            index: matchIndex,
            severity: severity
          };
          if (this.enableContextAware && this.contextAnalyzer) {
            const contextResult = this.contextAnalyzer.analyzeContext(
              originalText,
              matchedWord,
              matchIndex
            );
            matchObj.contextScore = contextResult.contextScore;
            matchObj.reason = contextResult.reason;
            matchObj.isWhitelisted = contextResult.isWhitelisted;
            if (contextResult.isWhitelisted || (contextResult.contextScore > this.confidenceThreshold)) {
              continue;
            }
          }
          profaneWords.push(matchedWord);
          if (severityMap[matchedWord] === undefined) {
            severityMap[matchedWord] = severity;
          }
          matches.push(matchObj);
        }
      }
    }
    if (profaneWords.length > 0) {
      this.debugLog('Detected:', profaneWords);
    }
    let processedText = text;
    if (this.replaceWith && profaneWords.length > 0) {
      const uniqueWords = Array.from(new Set(profaneWords));
      for (const word of uniqueWords) {
        const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const replacementRegex = this.wordBoundaries
          ? new RegExp(`\\b${escaped}\\b`, 'gi')
          : new RegExp(escaped, 'gi');
        processedText = processedText.replace(
          replacementRegex,
          this.replaceWith,
        );
      }
    }
    let contextScore: number | undefined;
    if (this.enableContextAware && matches.length > 0) {
      const totalScore = matches.reduce((sum, match) =>
        sum + (match.contextScore || 0.5), 0);
      contextScore = totalScore / matches.length;
    }
    const result: CheckProfanityResult = {
      containsProfanity: profaneWords.length > 0,
      profaneWords: Array.from(new Set(profaneWords)),
      processedText: this.replaceWith ? processedText : undefined,
      severityMap: this.severityLevels && Object.keys(severityMap).length > 0 ? severityMap : undefined,
      matches: matches.length > 0 ? matches : undefined,
      contextScore,
      reason: matches.length > 0 ?
        `Found ${matches.length} potential profanity matches` :
        'No profanity detected'
    };

    // Cache the result
    this.addToCache(cacheKey, result);
    return result;
  }

  /**
   * Checks profanity with minimum severity filtering.
   *
   * @param text - The text to check
   * @param minSeverity - Minimum severity level to include in results
   * @returns Object with filtered words and full result
   */
  checkProfanityWithMinSeverity(
    text: string,
    minSeverity: SeverityLevel = SeverityLevel.EXACT,
  ): { filteredWords: string[]; result: CheckProfanityResult } {
    const result = this.checkProfanity(text);
    const filteredWords =
      result.severityMap && result.profaneWords.length > 0
        ? result.profaneWords.filter((word) => {
            const severity = result.severityMap?.[word];
            return typeof severity === 'number' && severity >= minSeverity;
          })
        : [];

    return { filteredWords, result };
  }
}

export { Filter };
