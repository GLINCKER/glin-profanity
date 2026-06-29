import dictionary from '../data/dictionary';
import { Language, CheckProfanityResult, SeverityLevel, Match, FilterConfig, LeetspeakLevel } from '../types/types';
import { ContextAnalyzer } from '../nlp/contextAnalyzer';
import { DictionaryAhoCorasick, type DictionaryMatch } from './dictionaryAhoCorasick';
import { normalizeLeetspeak, normalizeLeetspeakVariants } from '../utils/leetspeak';
import { normalizeEvasion } from '../utils/evasion';
import { mapVariantSpanToOriginal, isNestedProfaneSpan, dedupeProfaneSpansByOverlap } from '../utils/variantMapping';
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
  private allLanguages: boolean;
  private languages: Language[];
  private customWords: string[];
  private disableAhoCorasick: boolean;
  private domainWhitelists?: FilterConfig['domainWhitelists'];
  // Leetspeak and Unicode detection
  private detectLeetspeak: boolean;
  private leetspeakLevel: LeetspeakLevel;
  private normalizeUnicodeEnabled: boolean;
  private enableEvasionNormalization: boolean;
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
    this.allLanguages = config?.allLanguages ?? false;
    this.languages = config?.languages ?? [defaultLanguage];
    this.customWords = config?.customWords ? [...config.customWords] : [];
    this.disableAhoCorasick = config?.disableAhoCorasick ?? false;
    this.domainWhitelists = config?.domainWhitelists;

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
    this.enableEvasionNormalization = config?.enableEvasionNormalization ?? true;

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

    // Accent-folded aliases: the normalized text variant strips diacritics
    // (normalizeUnicode), so an accented entry like "erección" would never
    // match a user who typed "ereccion". Register the diacritic-free form as
    // an extra alias so both spellings are caught. A length floor avoids short
    // ambiguous folds (e.g. año -> ano, which would over-flag).
    if (this.normalizeUnicodeEnabled) {
      words = this.withAccentFoldedAliases(words);
    }

    this.words = new Map();
    this.wordScripts = new Map();
    const acWords: string[] = [];
    const seenAcKeys = new Set<string>();
    for (const word of words) {
      const key = word.toLowerCase();
      this.words.set(key, 1);
      this.wordScripts.set(key, classifyWordScript(word));
      if (!seenAcKeys.has(key)) {
        seenAcKeys.add(key);
        acWords.push(this.caseSensitive ? word : key);
      }
    }
    this.dictionaryMatcher = this.shouldUseAhoCorasick(config)
      ? new DictionaryAhoCorasick(acWords)
      : null;
  }

  private static readonly ACCENT_ALIAS_MIN_LENGTH = 4;

  private withAccentFoldedAliases(words: string[]): string[] {
    const seen = new Set(words.map((word) => word.toLowerCase()));
    const extra: string[] = [];
    for (const word of words) {
      const folded = normalizeUnicode(word);
      const foldedKey = folded.toLowerCase();
      if (foldedKey === word.toLowerCase() || seen.has(foldedKey)) {
        continue;
      }
      if (foldedKey.replace(/ /g, '').length < Filter.ACCENT_ALIAS_MIN_LENGTH) {
        continue;
      }
      seen.add(foldedKey);
      extra.push(folded);
    }
    return [...words, ...extra];
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
    let base = this.enableEvasionNormalization ? normalizeEvasion(text) : text;

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

    if (this.allowObfuscatedMatch && !this.detectLeetspeak) {
      const obfuscated = this.normalizeObfuscated(base);
      return { normal: obfuscated, aggressive: obfuscated };
    }

    return { normal: base, aggressive: base };
  }

  private forEachTextVariant(
    variants: { original: string; normalized: string; aggressive: string },
    callback: (variantText: string, isOriginal: boolean) => boolean | void,
  ): boolean {
    if (callback(variants.original, true)) {
      return true;
    }
    if (variants.normalized !== variants.original && callback(variants.normalized, false)) {
      return true;
    }
    if (
      variants.aggressive !== variants.normalized &&
      variants.aggressive !== variants.original &&
      callback(variants.aggressive, false)
    ) {
      return true;
    }
    return false;
  }

  private resolveAcMatchInOriginal(
    originalText: string,
    variantText: string,
    match: DictionaryMatch,
    _isOriginalVariant: boolean,
  ): { matchedWord: string; start: number; end: number } {
    const span = mapVariantSpanToOriginal(
      originalText,
      variantText,
      match.start,
      match.end,
    );
    return {
      matchedWord: span.matchedText,
      start: span.start,
      end: span.end,
    };
  }

  private resolveRegexMatchInOriginal(
    originalText: string,
    variantText: string,
    matchStart: number,
    matchEnd: number,
    _matchedWord: string,
    _isOriginalVariant: boolean,
  ): { matchedWord: string; start: number; end: number } {
    const span = mapVariantSpanToOriginal(
      originalText,
      variantText,
      matchStart,
      matchEnd,
    );
    return {
      matchedWord: span.matchedText,
      start: span.start,
      end: span.end,
    };
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

  private profaneWordsFromSpans(
    spans: Array<[string, number, number]>,
    severityMap: Record<string, SeverityLevel>,
  ): { profaneWords: Set<string>; severityMap: Record<string, SeverityLevel> } {
    const deduped = dedupeProfaneSpansByOverlap(spans);
    const profaneWords = new Set<string>();
    const resolvedSeverityMap: Record<string, SeverityLevel> = {};

    for (const [word] of deduped) {
      if (!word) {
        continue;
      }
      profaneWords.add(word);
      resolvedSeverityMap[word] = severityMap[word] ?? SeverityLevel.EXACT;
    }

    return { profaneWords, severityMap: resolvedSeverityMap };
  }

  private collectProfaneSpansFromVariantAc(
    text: string,
    variantText: string,
  ): Array<[string, number, number]> {
    const matcher = this.dictionaryMatcher;
    if (!matcher) {
      return [];
    }

    const options = this.getDictionarySearchOptions();
    const spans: Array<[string, number, number]> = [];

    for (const match of matcher.findMatches(variantText, options)) {
      const resolved = this.resolveAcMatchInOriginal(text, variantText, match, false);
      if (resolved.matchedWord) {
        spans.push([resolved.matchedWord, resolved.start, resolved.end]);
      }
    }

    return spans;
  }

  private collectProfaneSpansAc(
    text: string,
    variants: { original: string; normalized: string; aggressive: string },
    containsProfanity = false,
  ): Array<[string, number, number]> {
    let spans = this.collectProfaneSpansFromVariantAc(text, variants.normalized);
    if (spans.length > 0 || !containsProfanity) {
      return dedupeProfaneSpansByOverlap(spans);
    }

    if (variants.original !== variants.normalized) {
      spans = this.collectProfaneSpansFromVariantAc(text, variants.original);
      if (spans.length > 0) {
        return dedupeProfaneSpansByOverlap(spans);
      }
    }

    if (
      variants.aggressive !== variants.normalized &&
      variants.aggressive !== variants.original
    ) {
      spans = this.collectProfaneSpansFromVariantAc(text, variants.aggressive);
    }

    return dedupeProfaneSpansByOverlap(spans);
  }

  private collectMatchesFromVariant(
    dictWord: string,
    variantText: string,
    originalText: string,
    severity: SeverityLevel,
    profaneSpans: Array<[string, number, number]>,
    severityMap: Record<string, SeverityLevel>,
    isOriginalVariant: boolean,
    matches?: Match[],
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
      const resolved = this.resolveRegexMatchInOriginal(
        originalText,
        variantText,
        start,
        end,
        isOriginalVariant ? match[0] : dictWord,
        isOriginalVariant,
      );
      if (!resolved.matchedWord) {
        continue;
      }
      profaneSpans.push([resolved.matchedWord, resolved.start, resolved.end]);
      if (severityMap[resolved.matchedWord] === undefined) {
        severityMap[resolved.matchedWord] = severity;
      }
      matches?.push({
        word: resolved.matchedWord,
        index: resolved.start,
        severity,
      });
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
      languages: [...this.languages],
      allLanguages: this.allLanguages,
      customWords: [...this.customWords],
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
      domainWhitelists: this.domainWhitelists,
      detectLeetspeak: this.detectLeetspeak,
      leetspeakLevel: this.leetspeakLevel,
      normalizeUnicode: this.normalizeUnicodeEnabled,
      enableEvasionNormalization: this.enableEvasionNormalization,
      cacheResults: this.cacheResults,
      maxCacheSize: this.maxCacheSize,
      disableAhoCorasick: this.disableAhoCorasick,
    };
  }

  private resultCacheKey(text: string): string {
    const fingerprint = JSON.stringify({
      ignoreWords: Array.from(this.ignoreWords).sort(),
      replaceWith: this.replaceWith ?? null,
      wordBoundaries: this.wordBoundaries,
      caseSensitive: this.caseSensitive,
      detectLeetspeak: this.detectLeetspeak,
      leetspeakLevel: this.leetspeakLevel,
      normalizeUnicode: this.normalizeUnicodeEnabled,
      enableEvasionNormalization: this.enableEvasionNormalization,
      enableContextAware: this.enableContextAware,
      contextWindow: this.contextWindow,
      confidenceThreshold: this.confidenceThreshold,
      fuzzyToleranceLevel: this.fuzzyToleranceLevel,
      allowObfuscatedMatch: this.allowObfuscatedMatch,
      severityLevels: this.severityLevels,
      wordCount: this.words.size,
    });
    return `${fingerprint}\0${text}`;
  }

  private static formatProfanityReason(
    flagged: boolean,
    profaneWordList: string[],
  ): string {
    if (!flagged) {
      return 'No profanity detected';
    }
    if (profaneWordList.length > 0) {
      return `Found ${profaneWordList.length} potential profanity matches`;
    }
    return 'Profanity detected';
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
      if (this.hasContextAwareAcMatch(value, variants)) {
        return true;
      }
      if (!this.wordBoundaries && this.hasContextAwareLegacyFuzzyMatch(value, variants)) {
        return true;
      }
      return false;
    }

    return this.hasContextAwareLegacyMatch(value, variants);
  }

  private hasContextAwareAcMatch(
    text: string,
    variants: { original: string; normalized: string; aggressive: string },
  ): boolean {
    const options = this.getDictionarySearchOptions();
    const matcher = this.dictionaryMatcher!;

    return this.forEachTextVariant(variants, (variantText, isOriginal) => {
      for (const match of matcher.findMatches(variantText, options)) {
        const resolved = this.resolveAcMatchInOriginal(
          text,
          variantText,
          match,
          isOriginal,
        );
        if (this.passesContextFilter(text, resolved.matchedWord, resolved.start)) {
          return true;
        }
      }
      return false;
    });
  }

  private hasContextAwareLegacyFuzzyMatch(
    text: string,
    variants: { original: string; normalized: string; aggressive: string },
  ): boolean {
    for (const dictWord of this.words.keys()) {
      if (this.ignoreWords.has(dictWord.toLowerCase())) {
        continue;
      }
      if (this.hasContextAwareLegacyFuzzyMatchForWord(text, variants, dictWord)) {
        return true;
      }
    }
    return false;
  }

  private hasContextAwareLegacyFuzzyMatchForWord(
    text: string,
    variants: { original: string; normalized: string; aggressive: string },
    dictWord: string,
  ): boolean {
    const checkVariant = (variantText: string): boolean => {
      if (this.evaluateSeverity(dictWord, variantText) !== SeverityLevel.FUZZY) {
        return false;
      }
      return this.passesContextFilter(text, dictWord, 0);
    };

    if (checkVariant(variants.original)) {
      return true;
    }
    if (variants.normalized !== variants.original && checkVariant(variants.normalized)) {
      return true;
    }
    if (
      variants.aggressive !== variants.normalized &&
      variants.aggressive !== variants.original &&
      checkVariant(variants.aggressive)
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
    const checkVariant = (variantText: string, isOriginal: boolean): boolean => {
      const severity = this.evaluateSeverity(dictWord, variantText);
      if (severity === undefined) {
        return false;
      }

      if (!this.wordBoundaries && severity === SeverityLevel.FUZZY) {
        return this.passesContextFilter(text, dictWord, 0);
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
        const resolved = this.resolveRegexMatchInOriginal(
          text,
          variantText,
          start,
          end,
          isOriginal ? match[0] : dictWord,
          isOriginal,
        );
        if (this.passesContextFilter(text, resolved.matchedWord, resolved.start)) {
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
    const matcher = this.dictionaryMatcher!;

    return this.forEachTextVariant(variants, (variantText) =>
      matcher.hasAnyMatch(variantText, options),
    );
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
    const severityMap: Record<string, SeverityLevel> = {};
    const containsProfanity = this.isProfaneWithAhoCorasick(text);
    const profaneSpans = this.collectProfaneSpansAc(text, variants, containsProfanity);
    const resolved = this.profaneWordsFromSpans(profaneSpans, severityMap);

    return this.buildProfanityResult(
      text,
      resolved.profaneWords,
      resolved.severityMap,
      containsProfanity,
    );
  }

  private collectLegacySpansFromVariant(
    text: string,
    variants: { original: string; normalized: string; aggressive: string },
    variantKey: 'original' | 'normalized' | 'aggressive',
    isOriginalVariant: boolean,
    profaneSpans: Array<[string, number, number]>,
    severityMap: Record<string, SeverityLevel>,
    matches: Match[],
  ): void {
    const variantText = variants[variantKey];
    for (const dictWord of this.words.keys()) {
      if (this.ignoreWords.has(dictWord.toLowerCase())) continue;

      const severity = this.evaluateSeverity(dictWord, variantText);
      if (severity === undefined) {
        continue;
      }

      if (!this.wordBoundaries && severity === SeverityLevel.FUZZY) {
        if (severityMap[dictWord] === undefined) {
          profaneSpans.push([dictWord, 0, dictWord.length]);
          severityMap[dictWord] = severity;
          matches.push({
            word: dictWord,
            index: 0,
            severity,
          });
        }
        continue;
      }

      this.collectMatchesFromVariant(
        dictWord,
        variantText,
        text,
        severity,
        profaneSpans,
        severityMap,
        isOriginalVariant,
        matches,
      );
    }
  }

  private checkProfanityLegacyNonContext(text: string): CheckProfanityResult {
    const variants = this.getTextVariants(text, true);
    const profaneSpans: Array<[string, number, number]> = [];
    const severityMap: Record<string, SeverityLevel> = {};
    const matches: Match[] = [];
    let containsProfanity = false;

    for (const dictWord of this.words.keys()) {
      if (this.ignoreWords.has(dictWord.toLowerCase())) continue;

      if (this.evaluateSeverityOnVariants(dictWord, variants) !== undefined) {
        containsProfanity = true;
      }
    }

    this.collectLegacySpansFromVariant(
      text,
      variants,
      'normalized',
      false,
      profaneSpans,
      severityMap,
      matches,
    );
    if (profaneSpans.length === 0 && containsProfanity) {
      if (variants.original !== variants.normalized) {
        this.collectLegacySpansFromVariant(
          text,
          variants,
          'original',
          true,
          profaneSpans,
          severityMap,
          matches,
        );
      }
      if (
        profaneSpans.length === 0 &&
        variants.aggressive !== variants.normalized &&
        variants.aggressive !== variants.original
      ) {
        this.collectLegacySpansFromVariant(
          text,
          variants,
          'aggressive',
          false,
          profaneSpans,
          severityMap,
          matches,
        );
      }
    }

    const resolved = this.profaneWordsFromSpans(profaneSpans, severityMap);
    const result = this.buildProfanityResult(
      text,
      resolved.profaneWords,
      resolved.severityMap,
      containsProfanity,
    );
    if (matches.length > 0) {
      const dedupedWords = new Set(result.profaneWords);
      result.matches = matches.filter((match) => dedupedWords.has(match.word));
    }
    return result;
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
      if (
        contextResult.isWhitelisted ||
        contextResult.contextScore > this.confidenceThreshold
      ) {
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
    variantKey: 'original' | 'normalized' | 'aggressive' = 'normalized',
  ): void {
    const options = this.getDictionarySearchOptions();
    const matcher = this.dictionaryMatcher!;
    const variantText = variants[variantKey];

    for (const match of matcher.findMatches(variantText, options)) {
      const resolved = this.resolveAcMatchInOriginal(text, variantText, match, false);
      this.recordContextAwareMatch(
        text,
        resolved.matchedWord,
        resolved.start,
        SeverityLevel.EXACT,
        profaneWords,
        severityMap,
        matches,
        seen,
      );
    }
  }

  private collectContextAwareCandidatesFromAcWithFallback(
    text: string,
    variants: { original: string; normalized: string; aggressive: string },
    profaneWords: string[],
    severityMap: Record<string, SeverityLevel>,
    matches: Match[],
    seen: Set<string>,
  ): void {
    this.collectContextAwareCandidatesFromAc(
      text,
      variants,
      profaneWords,
      severityMap,
      matches,
      seen,
    );
    if (profaneWords.length > 0) {
      return;
    }

    if (variants.original !== variants.normalized) {
      this.collectContextAwareCandidatesFromAc(
        text,
        variants,
        profaneWords,
        severityMap,
        matches,
        seen,
        'original',
      );
    }
    if (profaneWords.length > 0) {
      return;
    }

    if (
      variants.aggressive !== variants.normalized &&
      variants.aggressive !== variants.original
    ) {
      this.collectContextAwareCandidatesFromAc(
        text,
        variants,
        profaneWords,
        severityMap,
        matches,
        seen,
        'aggressive',
      );
    }
  }

  private collectContextAwareCandidatesFromLegacyFuzzy(
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

      if (this.evaluateSeverity(dictWord, variants.normalized) !== SeverityLevel.FUZZY) {
        continue;
      }
      this.recordContextAwareMatch(
        text,
        dictWord,
        0,
        SeverityLevel.FUZZY,
        profaneWords,
        severityMap,
        matches,
        seen,
      );
    }
  }

  private collectContextAwareCandidatesFromLegacy(
    text: string,
    variants: { original: string; normalized: string; aggressive: string },
    profaneWords: string[],
    severityMap: Record<string, SeverityLevel>,
    matches: Match[],
    seen: Set<string>,
    variantKey: 'original' | 'normalized' | 'aggressive' = 'normalized',
  ): void {
    const variantText = variants[variantKey];
    const isOriginal = variantKey === 'original';

    for (const dictWord of this.words.keys()) {
      if (this.ignoreWords.has(dictWord.toLowerCase())) {
        continue;
      }

      const severity = this.evaluateSeverity(dictWord, variantText);
      if (severity === undefined) {
        continue;
      }

      if (!this.wordBoundaries && severity === SeverityLevel.FUZZY) {
        this.recordContextAwareMatch(
          text,
          dictWord,
          0,
          severity,
          profaneWords,
          severityMap,
          matches,
          seen,
        );
        continue;
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
        const resolved = this.resolveRegexMatchInOriginal(
          text,
          variantText,
          start,
          end,
          isOriginal ? match[0] : dictWord,
          isOriginal,
        );
        this.recordContextAwareMatch(
          text,
          resolved.matchedWord,
          resolved.start,
          severity,
          profaneWords,
          severityMap,
          matches,
          seen,
        );
      }
    }
  }

  private collectContextAwareCandidatesFromLegacyWithFallback(
    text: string,
    variants: { original: string; normalized: string; aggressive: string },
    profaneWords: string[],
    severityMap: Record<string, SeverityLevel>,
    matches: Match[],
    seen: Set<string>,
  ): void {
    this.collectContextAwareCandidatesFromLegacy(
      text,
      variants,
      profaneWords,
      severityMap,
      matches,
      seen,
    );
    if (profaneWords.length > 0) {
      return;
    }

    if (variants.original !== variants.normalized) {
      this.collectContextAwareCandidatesFromLegacy(
        text,
        variants,
        profaneWords,
        severityMap,
        matches,
        seen,
        'original',
      );
    }
    if (profaneWords.length > 0) {
      return;
    }

    if (
      variants.aggressive !== variants.normalized &&
      variants.aggressive !== variants.original
    ) {
      this.collectContextAwareCandidatesFromLegacy(
        text,
        variants,
        profaneWords,
        severityMap,
        matches,
        seen,
        'aggressive',
      );
    }
  }

  private buildContextAwareResult(
    text: string,
    profaneWords: string[],
    severityMap: Record<string, SeverityLevel>,
    matches: Match[],
    containsProfanity?: boolean,
  ): CheckProfanityResult {
    const profaneWordList = this.dedupeNestedProfaneWords(
      Array.from(new Set(profaneWords)),
    ).sort((a, b) => b.length - a.length || a.localeCompare(b));
    let processedText = text;

    if (this.replaceWith && profaneWordList.length > 0) {
      for (const word of profaneWordList) {
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

    const flagged =
      containsProfanity !== undefined
        ? containsProfanity
        : profaneWordList.length > 0;

    return {
      containsProfanity: flagged,
      profaneWords: profaneWordList,
      processedText: this.replaceWith ? processedText : undefined,
      severityMap:
        this.severityLevels && Object.keys(severityMap).length > 0
          ? severityMap
          : undefined,
      matches:
        matches.length > 0
          ? [...matches].sort((a, b) => a.index - b.index || a.word.localeCompare(b.word))
          : undefined,
      contextScore,
      reason: Filter.formatProfanityReason(flagged, profaneWordList),
    };
  }

  private checkProfanityWithContextAware(text: string): CheckProfanityResult {
    const variants = this.getTextVariants(text, true);
    const containsProfanity = this.isProfaneWithContextAware(text);
    const profaneWords: string[] = [];
    const severityMap: Record<string, SeverityLevel> = {};
    const matches: Match[] = [];
    const seen = new Set<string>();

    if (this.dictionaryMatcher) {
      this.collectContextAwareCandidatesFromAcWithFallback(
        text,
        variants,
        profaneWords,
        severityMap,
        matches,
        seen,
      );
      if (!this.wordBoundaries) {
        this.collectContextAwareCandidatesFromLegacyFuzzy(
          text,
          variants,
          profaneWords,
          severityMap,
          matches,
          seen,
        );
      }
    } else {
      this.collectContextAwareCandidatesFromLegacyWithFallback(
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

    return this.buildContextAwareResult(
      text,
      profaneWords,
      severityMap,
      matches,
      containsProfanity,
    );
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

  private dedupeNestedProfaneWords(words: string[]): string[] {
    return words.filter(
      (word) =>
        !words.some(
          (other) => other !== word && isNestedProfaneSpan(word, other),
        ),
    );
  }

  private buildProfanityResult(
    text: string,
    profaneWords: Set<string>,
    severityMap: Record<string, SeverityLevel>,
    containsProfanity?: boolean,
  ): CheckProfanityResult {
    const profaneWordList = this.dedupeNestedProfaneWords(Array.from(profaneWords)).sort(
      (a, b) => b.length - a.length || a.localeCompare(b),
    );
    let processedText = text;

    if (this.replaceWith && profaneWordList.length > 0) {
      for (const word of profaneWordList) {
        processedText = processedText.replace(
          this.getReplacementRegex(word),
          this.replaceWith,
        );
      }
    }

    const flagged =
      containsProfanity !== undefined
        ? containsProfanity
        : profaneWordList.length > 0;

    return {
      containsProfanity: flagged,
      profaneWords: profaneWordList,
      processedText: this.replaceWith ? processedText : undefined,
      severityMap:
        this.severityLevels && Object.keys(severityMap).length > 0
          ? severityMap
          : undefined,
      reason: Filter.formatProfanityReason(flagged, profaneWordList),
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
    const cacheKey = this.resultCacheKey(text);
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
