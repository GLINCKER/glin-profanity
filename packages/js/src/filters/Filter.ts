import dictionary from '../data/dictionary';
import { Language, CheckProfanityResult, SeverityLevel, Match, FilterConfig, LeetspeakLevel } from '../types/types';
import { ContextAnalyzer } from '../nlp/contextAnalyzer';
import { DictionaryAhoCorasick, type DictionaryMatch } from './dictionaryAhoCorasick';
import { normalizeLeetspeak, normalizeLeetspeakVariants } from '../utils/leetspeak';
import { normalizeEvasion } from '../utils/evasion';
import { normalizeUnicode } from '../utils/unicode';
import {
  classifyWordScript,
  matchHasWordBoundary,
  type WordScript,
} from '../utils/wordScript';

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
  private wordScripts: Map<string, WordScript>;
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
  private regexCache: Map<string, RegExp>;
  private dictionaryMatcher: DictionaryAhoCorasick | null;

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
    this.regexCache = new Map();

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

    this.words = new Map();
    this.wordScripts = new Map();
    for (const word of words) {
      const key = word.toLowerCase();
      this.words.set(key, 1);
      this.wordScripts.set(key, classifyWordScript(word));
    }

    this.dictionaryMatcher = this.shouldUseAhoCorasick(config)
      ? new DictionaryAhoCorasick(Array.from(this.words.keys()))
      : null;
  }

  private shouldUseAhoCorasick(config?: FilterConfig): boolean {
    if (config?.disableAhoCorasick) {
      return false;
    }
    return this.wordBoundaries || this.enableContextAware;
  }

  private getDictionarySearchOptions() {
    return {
      wordBoundaries: this.wordBoundaries,
      caseSensitive: this.caseSensitive,
      ignoreWords: this.ignoreWords,
      wordScripts: this.wordScripts,
    };
  }

  private getWordScript(word: string): WordScript {
    return this.wordScripts.get(word) ?? classifyWordScript(word);
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
   * @param aggressive - If true, collapses to single chars (for repeated char detection)
   * @returns The normalized text
   */
  private normalizeText(text: string, aggressive: boolean = false): string {
    const variants = this.getNormalizedVariants(text);
    return aggressive ? variants.aggressive : variants.normal;
  }

  /**
   * Computes normal and aggressive normalized text in one pass (Unicode + leetspeak).
   */
  private getNormalizedVariants(text: string): { normal: string; aggressive: string } {
    let base = normalizeEvasion(text);

    if (this.normalizeUnicodeEnabled) {
      base = normalizeUnicode(base);
    }

    if (this.detectLeetspeak) {
      return normalizeLeetspeakVariants(base, {
        level: this.leetspeakLevel,
        collapseRepeated: true,
        removeSpacedChars: true,
      });
    }

    if (this.allowObfuscatedMatch) {
      const obfuscated = this.normalizeObfuscated(base);
      return { normal: obfuscated, aggressive: obfuscated };
    }

    return { normal: base, aggressive: base };
  }

  /**
   * Builds the three text variants used for matching (original + normalized + aggressive).
   */
  private getTextVariants(
    text: string,
    lowercase: boolean,
  ): { original: string; normalized: string; aggressive: string } {
    const { normal, aggressive } = this.getNormalizedVariants(text);

    if (lowercase) {
      return {
        original: text.toLowerCase(),
        normalized: normal.toLowerCase(),
        aggressive: aggressive.toLowerCase(),
      };
    }

    return {
      original: text,
      normalized: normal,
      aggressive: aggressive,
    };
  }

  private evaluateSeverityOnVariants(
    word: string,
    variants: { original: string; normalized: string; aggressive: string },
  ): SeverityLevel | undefined {
    let severity = this.evaluateSeverity(word, variants.original);
    if (severity !== undefined) {
      return severity;
    }

    if (variants.normalized !== variants.original) {
      severity = this.evaluateSeverity(word, variants.normalized);
      if (severity !== undefined) {
        return severity;
      }
    }

    if (variants.aggressive !== variants.normalized && variants.aggressive !== variants.original) {
      severity = this.evaluateSeverity(word, variants.aggressive);
      if (severity !== undefined) {
        return severity;
      }
    }

    return undefined;
  }

  private collectMatchesFromVariant(
    dictWord: string,
    variantText: string,
    severity: SeverityLevel,
    profaneWords: Set<string>,
    severityMap: Record<string, SeverityLevel>,
    useMatchText: boolean,
  ): void {
    const regex = this.getRegex(dictWord);
    const script = this.getWordScript(dictWord);
    let match: RegExpExecArray | null;
    while ((match = regex.exec(variantText)) !== null) {
      const start = match.index;
      const end = match.index + match[0].length;
      if (!matchHasWordBoundary(variantText, start, end, script, this.wordBoundaries)) {
        continue;
      }
      const matched = useMatchText ? match[0] : dictWord;
      profaneWords.add(matched);
      if (severityMap[matched] === undefined) {
        severityMap[matched] = severity;
      }
    }
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
    this.regexCache.clear();
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
    const script = this.getWordScript(word);
    const cacheKey = `${script}:${word}`;
    if (this.regexCache.has(cacheKey)) {
      const regex = this.regexCache.get(cacheKey)!;
      regex.lastIndex = 0;
      return regex;
    }
    const flags = this.caseSensitive ? 'g' : 'gi';
    const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const useLatinBoundary = this.wordBoundaries && script === 'latin';
    const boundary = useLatinBoundary ? '\\b' : '';
    const regex = new RegExp(`${boundary}${escapedWord}${boundary}`, flags);
    this.regexCache.set(cacheKey, regex);
    return regex;
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
    const script = this.getWordScript(word);
    const regex = this.getRegex(word);

    if (script === 'cjk' && this.wordBoundaries) {
      let match: RegExpExecArray | null;
      while ((match = regex.exec(text)) !== null) {
        const start = match.index;
        const end = match.index + match[0].length;
        if (matchHasWordBoundary(text, start, end, script, true)) {
          return SeverityLevel.EXACT;
        }
      }
      return undefined;
    }

    if (regex.test(text)) {
      return SeverityLevel.EXACT;
    }
    if (!this.wordBoundaries && this.isFuzzyToleranceMatch(word, text)) {
      return SeverityLevel.FUZZY;
    }
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
    if (this.enableContextAware) {
      return this.isProfaneWithContextAware(value);
    }
    if (this.dictionaryMatcher) {
      return this.isProfaneWithAhoCorasick(value);
    }
    return this.isProfaneLegacy(value);
  }

  private passesContextFilter(
    text: string,
    matchedWord: string,
    matchIndex: number,
  ): boolean {
    if (!this.contextAnalyzer) {
      return true;
    }
    const contextResult = this.contextAnalyzer.analyzeContext(
      text,
      matchedWord,
      matchIndex,
    );
    return !(
      contextResult.isWhitelisted ||
      contextResult.contextScore > this.confidenceThreshold
    );
  }

  private isProfaneWithContextAware(value: string): boolean {
    const variants = this.getTextVariants(value, false);

    if (this.dictionaryMatcher) {
      return this.hasContextAwareAcMatch(value, variants);
    }

    return this.hasContextAwareLegacyMatch(value, variants);
  }

  private hasContextAwareAcMatch(
    text: string,
    variants: { original: string; normalized: string; aggressive: string },
  ): boolean {
    const options = this.getDictionarySearchOptions();
    const matcher = this.dictionaryMatcher!;

    const hasFlaggedMatch = (
      variantText: string,
      useMatchedText: boolean,
    ): boolean => {
      for (const match of matcher.findMatches(variantText, options)) {
        const matchedWord = useMatchedText ? match.matchedText : match.dictWord;
        if (this.passesContextFilter(text, matchedWord, match.start)) {
          return true;
        }
      }
      return false;
    };

    if (hasFlaggedMatch(variants.original, true)) {
      return true;
    }
    if (
      variants.normalized !== variants.original &&
      hasFlaggedMatch(variants.normalized, false)
    ) {
      return true;
    }
    if (
      variants.aggressive !== variants.normalized &&
      variants.aggressive !== variants.original &&
      hasFlaggedMatch(variants.aggressive, false)
    ) {
      return true;
    }
    return false;
  }

  private hasContextAwareLegacyMatch(
    text: string,
    variants: { original: string; normalized: string; aggressive: string },
  ): boolean {
    for (const dictWord of this.words.keys()) {
      if (this.ignoreWords.has(dictWord.toLowerCase())) {
        continue;
      }

      if (
        this.hasContextAwareLegacyMatchForWord(text, variants, dictWord)
      ) {
        return true;
      }
    }
    return false;
  }

  private hasContextAwareLegacyMatchForWord(
    text: string,
    variants: { original: string; normalized: string; aggressive: string },
    dictWord: string,
  ): boolean {
    const checkVariant = (variantText: string, useMatchText: boolean): boolean => {
      const severity = this.evaluateSeverity(dictWord, variantText);
      if (severity === undefined) {
        return false;
      }

      const regex = this.getRegex(dictWord);
      const script = this.getWordScript(dictWord);
      let match: RegExpExecArray | null;
      while ((match = regex.exec(variantText)) !== null) {
        const start = match.index;
        const end = match.index + match[0].length;
        if (!matchHasWordBoundary(variantText, start, end, script, this.wordBoundaries)) {
          continue;
        }
        const matchedWord = useMatchText ? match[0] : dictWord;
        if (this.passesContextFilter(text, matchedWord, start)) {
          return true;
        }
      }
      return false;
    };

    if (checkVariant(variants.original, true)) {
      return true;
    }
    if (variants.normalized !== variants.original && checkVariant(variants.normalized, false)) {
      return true;
    }
    if (
      variants.aggressive !== variants.normalized &&
      variants.aggressive !== variants.original &&
      checkVariant(variants.aggressive, false)
    ) {
      return true;
    }
    return false;
  }

  private isProfaneWithAhoCorasick(value: string): boolean {
    const variants = this.getTextVariants(value, false);
    const options = this.getDictionarySearchOptions();

    if (this.dictionaryMatcher!.hasAnyMatch(variants.original, options)) {
      return true;
    }
    if (
      variants.normalized !== variants.original &&
      this.dictionaryMatcher!.hasAnyMatch(variants.normalized, options)
    ) {
      return true;
    }
    if (
      variants.aggressive !== variants.normalized &&
      variants.aggressive !== variants.original &&
      this.dictionaryMatcher!.hasAnyMatch(variants.aggressive, options)
    ) {
      return true;
    }
    return false;
  }

  private isProfaneLegacy(value: string): boolean {
    const variants = this.getTextVariants(value, false);

    for (const word of this.words.keys()) {
      if (this.ignoreWords.has(word.toLowerCase())) {
        continue;
      }
      if (this.evaluateSeverityOnVariants(word, variants) !== undefined) {
        return true;
      }
    }
    return false;
  }

  matches(word: string): boolean {
    return this.isProfane(word);
  }

  private checkProfanityWithAhoCorasick(text: string): CheckProfanityResult {
    const variants = this.getTextVariants(text, true);
    const profaneWords = new Set<string>();
    const severityMap: Record<string, SeverityLevel> = {};
    const options = this.getDictionarySearchOptions();

    for (const match of this.dictionaryMatcher!.findMatches(variants.original, options)) {
      profaneWords.add(match.matchedText);
      if (severityMap[match.matchedText] === undefined) {
        severityMap[match.matchedText] = SeverityLevel.EXACT;
      }
    }

    if (variants.normalized !== variants.original) {
      for (const match of this.dictionaryMatcher!.findMatches(variants.normalized, options)) {
        profaneWords.add(match.dictWord);
        if (severityMap[match.dictWord] === undefined) {
          severityMap[match.dictWord] = SeverityLevel.EXACT;
        }
      }
    }

    if (
      variants.aggressive !== variants.normalized &&
      variants.aggressive !== variants.original
    ) {
      for (const match of this.dictionaryMatcher!.findMatches(variants.aggressive, options)) {
        profaneWords.add(match.dictWord);
        if (severityMap[match.dictWord] === undefined) {
          severityMap[match.dictWord] = SeverityLevel.EXACT;
        }
      }
    }

    return this.buildProfanityResult(text, profaneWords, severityMap);
  }

  private checkProfanityLegacyNonContext(text: string): CheckProfanityResult {
    const variants = this.getTextVariants(text, true);
    const profaneWords = new Set<string>();
    const severityMap: Record<string, SeverityLevel> = {};

    for (const dictWord of this.words.keys()) {
      if (this.ignoreWords.has(dictWord.toLowerCase())) continue;

      let severity = this.evaluateSeverity(dictWord, variants.original);
      if (severity !== undefined) {
        this.collectMatchesFromVariant(
          dictWord,
          variants.original,
          severity,
          profaneWords,
          severityMap,
          true,
        );
      }

      if (variants.normalized !== variants.original) {
        severity = this.evaluateSeverity(dictWord, variants.normalized);
        if (severity !== undefined) {
          this.collectMatchesFromVariant(
            dictWord,
            variants.normalized,
            severity,
            profaneWords,
            severityMap,
            false,
          );
        }
      }

      if (
        variants.aggressive !== variants.normalized &&
        variants.aggressive !== variants.original
      ) {
        severity = this.evaluateSeverity(dictWord, variants.aggressive);
        if (severity !== undefined) {
          profaneWords.add(dictWord);
          if (severityMap[dictWord] === undefined) {
            severityMap[dictWord] = SeverityLevel.EXACT;
          }
        }
      }
    }

    return this.buildProfanityResult(text, profaneWords, severityMap);
  }

  private recordContextAwareMatch(
    text: string,
    matchedWord: string,
    matchIndex: number,
    severity: SeverityLevel,
    profaneWords: string[],
    severityMap: Record<string, SeverityLevel>,
    matches: Match[],
    seen: Set<string>,
  ): void {
    const dedupeKey = `${matchedWord}:${matchIndex}`;
    if (seen.has(dedupeKey)) {
      return;
    }

    const matchObj: Match = {
      word: matchedWord,
      index: matchIndex,
      severity,
    };

    if (this.contextAnalyzer) {
      const contextResult = this.contextAnalyzer.analyzeContext(
        text,
        matchedWord,
        matchIndex,
      );
      matchObj.contextScore = contextResult.contextScore;
      matchObj.reason = contextResult.reason;
      matchObj.isWhitelisted = contextResult.isWhitelisted;
      if (!this.passesContextFilter(text, matchedWord, matchIndex)) {
        return;
      }
    }

    seen.add(dedupeKey);
    profaneWords.push(matchedWord);
    if (severityMap[matchedWord] === undefined) {
      severityMap[matchedWord] = severity;
    }
    matches.push(matchObj);
  }

  private collectContextAwareCandidatesFromAc(
    text: string,
    variants: { original: string; normalized: string; aggressive: string },
    profaneWords: string[],
    severityMap: Record<string, SeverityLevel>,
    matches: Match[],
    seen: Set<string>,
  ): void {
    const options = this.getDictionarySearchOptions();
    const matcher = this.dictionaryMatcher!;

    const processAcMatch = (match: DictionaryMatch, useMatchedText: boolean) => {
      this.recordContextAwareMatch(
        text,
        useMatchedText ? match.matchedText : match.dictWord,
        match.start,
        SeverityLevel.EXACT,
        profaneWords,
        severityMap,
        matches,
        seen,
      );
    };

    for (const match of matcher.findMatches(variants.original, options)) {
      processAcMatch(match, true);
    }

    if (variants.normalized !== variants.original) {
      for (const match of matcher.findMatches(variants.normalized, options)) {
        processAcMatch(match, false);
      }
    }

    if (
      variants.aggressive !== variants.normalized &&
      variants.aggressive !== variants.original
    ) {
      for (const match of matcher.findMatches(variants.aggressive, options)) {
        processAcMatch(match, false);
      }
    }
  }

  private collectContextAwareCandidatesFromLegacy(
    text: string,
    variants: { original: string; normalized: string; aggressive: string },
    profaneWords: string[],
    severityMap: Record<string, SeverityLevel>,
    matches: Match[],
    seen: Set<string>,
  ): void {
    for (const dictWord of this.words.keys()) {
      if (this.ignoreWords.has(dictWord.toLowerCase())) {
        continue;
      }

      const collectFromVariant = (
        variantText: string,
        useMatchText: boolean,
      ) => {
        const severity = this.evaluateSeverity(dictWord, variantText);
        if (severity === undefined) {
          return;
        }

        const regex = this.getRegex(dictWord);
        const script = this.getWordScript(dictWord);
        let match: RegExpExecArray | null;
        while ((match = regex.exec(variantText)) !== null) {
          const start = match.index;
          const end = match.index + match[0].length;
          if (!matchHasWordBoundary(variantText, start, end, script, this.wordBoundaries)) {
            continue;
          }
          this.recordContextAwareMatch(
            text,
            useMatchText ? match[0] : dictWord,
            start,
            severity,
            profaneWords,
            severityMap,
            matches,
            seen,
          );
        }
      };

      collectFromVariant(variants.original, true);

      if (variants.normalized !== variants.original) {
        collectFromVariant(variants.normalized, false);
      }

      if (
        variants.aggressive !== variants.normalized &&
        variants.aggressive !== variants.original
      ) {
        collectFromVariant(variants.aggressive, false);
      }
    }
  }

  private buildContextAwareResult(
    text: string,
    profaneWords: string[],
    severityMap: Record<string, SeverityLevel>,
    matches: Match[],
  ): CheckProfanityResult {
    let processedText = text;

    if (this.replaceWith && profaneWords.length > 0) {
      const uniqueWords = Array.from(new Set(profaneWords));
      for (const word of uniqueWords) {
        processedText = processedText.replace(
          this.getReplacementRegex(word),
          this.replaceWith,
        );
      }
    }

    let contextScore: number | undefined;
    if (matches.length > 0) {
      const totalScore = matches.reduce(
        (sum, match) => sum + (match.contextScore || 0.5),
        0,
      );
      contextScore = totalScore / matches.length;
    }

    return {
      containsProfanity: profaneWords.length > 0,
      profaneWords: Array.from(new Set(profaneWords)),
      processedText: this.replaceWith ? processedText : undefined,
      severityMap:
        this.severityLevels && Object.keys(severityMap).length > 0
          ? severityMap
          : undefined,
      matches: matches.length > 0 ? matches : undefined,
      contextScore,
      reason:
        matches.length > 0
          ? `Found ${matches.length} potential profanity matches`
          : 'No profanity detected',
    };
  }

  private checkProfanityWithContextAware(text: string): CheckProfanityResult {
    const variants = this.getTextVariants(text, true);
    const profaneWords: string[] = [];
    const severityMap: Record<string, SeverityLevel> = {};
    const matches: Match[] = [];
    const seen = new Set<string>();

    if (this.dictionaryMatcher) {
      this.collectContextAwareCandidatesFromAc(
        text,
        variants,
        profaneWords,
        severityMap,
        matches,
        seen,
      );
    } else {
      this.collectContextAwareCandidatesFromLegacy(
        text,
        variants,
        profaneWords,
        severityMap,
        matches,
        seen,
      );
    }

    if (profaneWords.length > 0) {
      this.debugLog('Detected:', profaneWords);
    }

    return this.buildContextAwareResult(text, profaneWords, severityMap, matches);
  }

  private getReplacementRegex(word: string): RegExp {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!this.wordBoundaries) {
      return new RegExp(escaped, 'gi');
    }
    const script = classifyWordScript(word);
    if (script === 'cjk') {
      return new RegExp(escaped, 'gi');
    }
    return new RegExp(`\\b${escaped}\\b`, 'gi');
  }

  private buildProfanityResult(
    text: string,
    profaneWords: Set<string>,
    severityMap: Record<string, SeverityLevel>,
  ): CheckProfanityResult {
    const profaneWordList = Array.from(profaneWords);
    let processedText = text;

    if (this.replaceWith && profaneWordList.length > 0) {
      for (const word of profaneWordList) {
        processedText = processedText.replace(
          this.getReplacementRegex(word),
          this.replaceWith,
        );
      }
    }

    return {
      containsProfanity: profaneWordList.length > 0,
      profaneWords: profaneWordList,
      processedText: this.replaceWith ? processedText : undefined,
      severityMap:
        this.severityLevels && Object.keys(severityMap).length > 0
          ? severityMap
          : undefined,
    };
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
      const result = this.dictionaryMatcher
        ? this.checkProfanityWithAhoCorasick(text)
        : this.checkProfanityLegacyNonContext(text);
      this.addToCache(cacheKey, result);
      return result;
    }

    const result = this.checkProfanityWithContextAware(text);
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
