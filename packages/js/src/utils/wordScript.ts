/**
 * Word-script classification and boundary checks for Latin vs CJK dictionary entries.
 *
 * Latin entries use JavaScript `\b` semantics (ASCII word chars only).
 * CJK entries use substring matching when word boundaries are enabled (no `\b`).
 */

export type WordScript = 'latin' | 'cjk';

/** Mirrors JavaScript `\b` word character class without the `u` flag. */
const LATIN_WORD_CHAR = /[A-Za-z0-9_]/;

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

/** JavaScript `\b` boundary at index (between word and non-word ASCII chars). */
export function isLatinWordBoundaryBefore(text: string, index: number): boolean {
  const leftIsWord = index > 0 && LATIN_WORD_CHAR.test(text[index - 1]!);
  const rightIsWord = index < text.length && LATIN_WORD_CHAR.test(text[index]!);
  return leftIsWord !== rightIsWord;
}

export function hasLatinWordBoundary(text: string, start: number, end: number): boolean {
  return (
    isLatinWordBoundaryBefore(text, start) && isLatinWordBoundaryBefore(text, end)
  );
}

/**
 * CJK boundary: substring match anywhere (including ASCII-adjacent / wrapped text).
 * Latin `\b` does not apply to CJK scripts; adjacency checks would miss obfuscation
 * such as `hello他妈的`, `x乳x`, or `123エッチ456`.
 */
export function hasCjkWordBoundary(_text: string, _start: number, _end: number): boolean {
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
