/**
 * @fileoverview Utility functions for glin-profanity.
 * @module utils
 */

export {
  normalizeEvasion,
  stripHtmlAndDecodeEntities,
  collapseSeparatedCharacters,
  normalizeMaskedProfanity,
} from './evasion';

export {
  normalizeLeetspeak,
  collapseSpacedCharacters,
  collapseRepeatedCharacters,
  containsLeetspeak,
  generateLeetspeakVariants,
  type LeetspeakLevel,
  type LeetspeakOptions,
} from './leetspeak';

export {
  normalizeUnicode,
  removeZeroWidthCharacters,
  convertFullWidth,
  convertHomoglyphs,
  normalizeNFKD,
  containsUnicodeObfuscation,
  detectCharacterSets,
  type UnicodeNormalizationOptions,
} from './unicode';

export {
  classifyWordScript,
  hasCjkWordBoundary,
  hasLatinWordBoundary,
  isCjkCharacter,
  matchHasWordBoundary,
  type WordScript,
} from './wordScript';
