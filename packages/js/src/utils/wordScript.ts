/**
 * Word-script classification and boundary checks for Latin vs CJK dictionary entries.
 *
 * Latin entries use Unicode-aware `\w` semantics (Python `\w` / JS `\b` with `u`).
 * CJK entries use substring matching with a minimum grapheme length guard.
 */

export type WordScript = 'latin' | 'cjk';

/** Single-grapheme CJK hits require non-CJK neighbors (avoids 性 in 性格). */
export const CJK_MIN_STANDALONE_GRAPHEMES = 2;

/**
 * Single CJK characters that are unambiguously profane regardless of neighbors.
 * Unlike 性/骚/逼/淫/奸/賤/妓/尻/糞/裸 (which have common benign uses such as
 * 性格/骚扰/逼近/淫雨/奸细/贫贱/芸妓/お尻/粪便/裸露), these characters effectively
 * only occur in profane contexts, so we keep flagging them even when surrounded
 * by other CJK characters (e.g. 挨肏, 肏她, 肏屄).
 */
export const UNAMBIGUOUS_CJK_SINGLE_PROFANITY = new Set('肏屄屌膣姦姘');

/**
 * Returns true when the code point belongs to a CJK-related script block.
 */
export function isCjkCharacter(char: string): boolean {
  const code = char.codePointAt(0);
  if (code === undefined) {
    return false;
  }

  return (
    (code >= 0x4e00 && code <= 0x9fff) || // CJK Unified Ideographs
    (code >= 0x3400 && code <= 0x4dbf) || // Extension A
    (code >= 0x3040 && code <= 0x309f) || // Hiragana
    (code >= 0x30a0 && code <= 0x30ff) || // Katakana
    (code >= 0x31f0 && code <= 0x31ff) || // Katakana phonetic extensions
    (code >= 0xac00 && code <= 0xd7af) || // Hangul syllables
    (code >= 0x1100 && code <= 0x11ff) || // Hangul Jamo
    (code >= 0x3130 && code <= 0x318f) || // Hangul compatibility Jamo
    (code >= 0x3100 && code <= 0x312f) || // Bopomofo
    (code >= 0xff66 && code <= 0xff9f) // Halfwidth katakana
  );
}

/**
 * Classify a dictionary entry by its characters (not by configured language).
 * ASCII-only entries from Japanese/Chinese lists still use Latin `\b` rules.
 */
export function classifyWordScript(word: string): WordScript {
  for (const char of word) {
    if (isCjkCharacter(char)) {
      return 'cjk';
    }
  }
  return 'latin';
}

/** Unicode-aware word character (Python `\w` / JS `\b` with `u` flag). */
export function isUnicodeWordChar(char: string): boolean {
  if (!char) {
    return false;
  }
  if (char === '_') {
    return true;
  }
  return /[\p{L}\p{N}]/u.test(char);
}

/**
 * Word boundary at index using Unicode-aware `\w` semantics.
 *
 * CJK neighbors are treated as non-word for Latin tokens: CJK has no spaces,
 * so a Latin/pinyin token embedded in CJK (e.g. `jb` in `我的jb大`) should still
 * be recognized as a standalone token rather than a continuation.
 */
export function isLatinWordBoundaryBefore(text: string, index: number): boolean {
  const leftIsWord =
    index > 0 && isUnicodeWordChar(text[index - 1]!) && !isCjkCharacter(text[index - 1]!);
  const rightIsWord =
    index < text.length && isUnicodeWordChar(text[index]!) && !isCjkCharacter(text[index]!);
  return leftIsWord !== rightIsWord;
}

export function hasLatinWordBoundary(text: string, start: number, end: number): boolean {
  return (
    isLatinWordBoundaryBefore(text, start) && isLatinWordBoundaryBefore(text, end)
  );
}

function graphemeCountInSpan(text: string, start: number, end: number): number {
  let count = 0;
  let index = 0;

  while (index < text.length) {
    const segStart = index;
    index += 1;
    while (index < text.length && /\p{M}/u.test(text[index]!)) {
      index += 1;
    }
    if (index > start && segStart < end) {
      count += 1;
    }
    if (segStart >= end) {
      break;
    }
  }
  return count;
}

/**
 * CJK boundary: multi-grapheme substring matches anywhere; single-grapheme
 * matches require non-CJK neighbors (e.g. x乳x, hello操world).
 */
export function hasCjkWordBoundary(text: string, start: number, end: number): boolean {
  if (graphemeCountInSpan(text, start, end) >= CJK_MIN_STANDALONE_GRAPHEMES) {
    return true;
  }

  if (UNAMBIGUOUS_CJK_SINGLE_PROFANITY.has(text.slice(start, end))) {
    return true;
  }

  const before = start > 0 ? text[start - 1]! : '';
  const after = end < text.length ? text[end]! : '';
  if (before && isCjkCharacter(before)) {
    return false;
  }
  if (after && isCjkCharacter(after)) {
    return false;
  }
  return true;
}

/**
 * Returns whether a match at [start, end) satisfies boundary rules for its script.
 */
export function matchHasWordBoundary(
  text: string,
  start: number,
  end: number,
  script: WordScript,
  wordBoundariesEnabled: boolean,
): boolean {
  if (!wordBoundariesEnabled) {
    return true;
  }
  if (script === 'cjk') {
    return hasCjkWordBoundary(text, start, end);
  }
  return hasLatinWordBoundary(text, start, end);
}
