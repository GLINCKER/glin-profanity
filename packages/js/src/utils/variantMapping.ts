/**
 * Maps span positions from a normalized variant back to the original text.
 * Assumes normalization is order-preserving (no reordering of characters).
 */

import { hasNonZeroCombiningClass } from './combiningClass';
import { AGGRESSIVE_SUBSTITUTIONS, MODERATE_SUBSTITUTIONS } from './leetspeak';
import { homoglyphToAscii } from './unicode';
import { isUnicodeWordChar } from './wordScript';

export interface OriginalSpan {
  start: number;
  end: number;
  matchedText: string;
}

const LEET_TO_ASCII: Record<string, string> = {
  '@': 'a',
  $: 's',
  '!': 'i',
  '1': 'i',
  '0': 'o',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '7': 't',
  '8': 'b',
  '9': 'g',
};

const LEET_SUBSTITUTIONS: Record<string, string> = {
  ...MODERATE_SUBSTITUTIONS,
  ...AGGRESSIVE_SUBSTITUTIONS,
};

const SKIPPABLE_ORIGINAL_CHARS = new Set(['*', '.', '_', '-', ' ']);

/** Keep leetspeak/masking symbols when they belong to the obfuscated token. */
const EDGE_MASKING_CHARS = new Set(['@', '$', '!', '#', '*']);

function normalizeCharForAlign(char: string): string {
  const mapped = homoglyphToAscii(char);
  const decomposed = mapped.normalize('NFKD');
  let base = '';
  for (const codePoint of decomposed) {
    if (!hasNonZeroCombiningClass(codePoint)) {
      base += codePoint;
    }
  }
  return base.toLowerCase();
}

function charsEqual(a: string, b: string): boolean {
  return a === b || a.toLowerCase() === b.toLowerCase();
}

function charsAlign(originalChar: string, variantChar: string): boolean {
  if (charsEqual(originalChar, variantChar)) {
    return true;
  }

  const originalNorm = normalizeCharForAlign(originalChar);
  const variantNorm = normalizeCharForAlign(variantChar);
  if (originalNorm && originalNorm === variantNorm) {
    return true;
  }

  const leet = LEET_TO_ASCII[originalChar] ?? LEET_TO_ASCII[originalChar.toLowerCase()];
  if (leet !== undefined && leet.toLowerCase() === variantNorm) {
    return true;
  }

  const substituted =
    LEET_SUBSTITUTIONS[originalChar] ?? LEET_SUBSTITUTIONS[originalChar.toLowerCase()];
  if (substituted !== undefined && substituted.toLowerCase() === variantNorm) {
    return true;
  }

  const homoglyph = homoglyphToAscii(originalChar);
  if (homoglyph !== originalChar && normalizeCharForAlign(homoglyph) === variantNorm) {
    return true;
  }

  return false;
}

function isSkippableOriginalChar(char: string): boolean {
  return SKIPPABLE_ORIGINAL_CHARS.has(char);
}

function isCombiningMark(char: string): boolean {
  return hasNonZeroCombiningClass(char);
}

function shouldTrimEdgePunctuation(char: string): boolean {
  if (EDGE_MASKING_CHARS.has(char)) {
    return false;
  }
  if ('._-'.includes(char)) {
    return true;
  }
  return /\p{P}|\p{Z}/u.test(char);
}

/** Drop leading/trailing whitespace and outer punctuation from a profane span. */
export function trimProfaneSpanEdges(text: string, start: number, end: number): OriginalSpan {
  if (start >= end) {
    return { start, end, matchedText: '' };
  }

  while (start < end && /\s/u.test(text[start]!)) {
    start++;
  }
  while (start < end && /\s/u.test(text[end - 1]!)) {
    end--;
  }

  while (start < end && '._-'.includes(text[start]!)) {
    start++;
  }
  while (start < end && '._-'.includes(text[end - 1]!)) {
    end--;
  }

  while (start < end && shouldTrimEdgePunctuation(text[start]!)) {
    start++;
  }
  while (start < end && shouldTrimEdgePunctuation(text[end - 1]!)) {
    end--;
  }

  return { start, end, matchedText: text.slice(start, end) };
}

function finalizeSpan(original: string, start: number, end: number): OriginalSpan {
  return trimProfaneSpanEdges(original, start, end);
}

function fallbackSpan(
  original: string,
  variant: string,
  variantStart: number,
  variantEnd: number,
): OriginalSpan {
  const needle = variant.slice(variantStart, variantEnd);
  if (!needle) {
    return { start: 0, end: 0, matchedText: '' };
  }

  const lowerOriginal = original.toLowerCase();
  const lowerNeedle = needle.toLowerCase();
  const idx = lowerOriginal.indexOf(lowerNeedle);
  if (idx >= 0) {
    return finalizeSpan(original, idx, idx + needle.length);
  }

  // The variant word is not literally present in the original (e.g. it was
  // reconstructed from a fully masked token like "f******"). Returning a
  // guessed coordinate slice here only produces garbage spans, so drop it.
  return { start: 0, end: 0, matchedText: '' };
}

/**
 * Walk original and variant in parallel to locate the original span
 * corresponding to [variantStart, variantEnd) in the variant string.
 */
export function mapVariantSpanToOriginal(
  original: string,
  variant: string,
  variantStart: number,
  variantEnd: number,
): OriginalSpan {
  if (variantStart >= variantEnd) {
    return { start: 0, end: 0, matchedText: '' };
  }

  if (original === variant) {
    return finalizeSpan(original, variantStart, variantEnd);
  }

  let originalIndex = 0;
  let variantIndex = 0;
  let origStart = -1;
  let origEnd = -1;
  let lastAlignedNorm = '';
  let skippedSeparator = false;

  while (variantIndex < variant.length && originalIndex <= original.length) {
    if (variantIndex === variantStart && origStart === -1) {
      origStart = originalIndex;
      lastAlignedNorm = '';
      skippedSeparator = false;
    }
    if (variantIndex === variantEnd) {
      origEnd = originalIndex;
      break;
    }

    if (originalIndex >= original.length) {
      variantIndex++;
      continue;
    }

    const variantChar = variant[variantIndex]!;
    const originalChar = original[originalIndex]!;

    if (isCombiningMark(originalChar)) {
      originalIndex++;
      continue;
    }

    if (charsAlign(originalChar, variantChar)) {
      lastAlignedNorm = normalizeCharForAlign(originalChar) || originalChar.toLowerCase();
      skippedSeparator = false;
      variantIndex++;
      originalIndex++;
      continue;
    }

    if (isSkippableOriginalChar(originalChar)) {
      originalIndex++;
      skippedSeparator = true;
      continue;
    }

    // An extra original word character does not match the variant char.
    // Only tolerate it when it is a collapsed repeat ("fuuuck" -> "fuck")
    // that directly follows the previously aligned char with no separator
    // in between. Otherwise the variant char was removed/masked in the
    // original ("f******" -> "fuck") or positions drifted (NFKD punctuation
    // like "…" -> ".."): stop and let the caller fall back to a literal
    // lookup instead of consuming unrelated words.
    const originalNorm = normalizeCharForAlign(originalChar) || originalChar.toLowerCase();
    if (!skippedSeparator && lastAlignedNorm && originalNorm === lastAlignedNorm) {
      originalIndex++;
      continue;
    }

    break;
  }

  if (origEnd === -1 && variantIndex >= variantEnd) {
    origEnd = originalIndex;
  }

  if (origStart === -1 || origEnd === -1) {
    return fallbackSpan(original, variant, variantStart, variantEnd);
  }

  if (origStart >= origEnd) {
    return fallbackSpan(original, variant, variantStart, variantEnd);
  }

  const matchedText = original.slice(origStart, origEnd);
  if (!matchedText) {
    return fallbackSpan(original, variant, variantStart, variantEnd);
  }

  return finalizeSpan(original, origStart, origEnd);
}

export interface ProfaneSpan {
  word: string;
  start: number;
  end: number;
}

/** Keep longest original-text span when starts or ranges overlap. */
export function dedupeProfaneSpansByOverlap(
  spans: Array<[string, number, number]>,
): Array<[string, number, number]> {
  if (spans.length === 0) {
    return [];
  }

  const ordered = [...spans].sort(
    (left, right) => left[1] - right[1] || right[2] - right[1] - (left[2] - left[1]),
  );
  let kept: Array<[string, number, number]> = [];

  for (const candidate of ordered) {
    const [word, start, end] = candidate;
    const length = end - start;

    if (
      kept.some(
        ([, keptStart, keptEnd]) =>
          start >= keptStart && end <= keptEnd && keptEnd - keptStart > length,
      )
    ) {
      continue;
    }

    kept = kept.filter(
      ([, keptStart, keptEnd]) =>
        !(keptStart >= start && keptEnd <= end && length > keptEnd - keptStart),
    );
    kept.push([word, start, end]);
  }

  return kept;
}

/** True when `shorter` is a word-bounded substring of `longer` (avoids ass/classic). */
export function isNestedProfaneSpan(shorter: string, longer: string): boolean {
  if (longer.length <= shorter.length) {
    return false;
  }

  let searchFrom = 0;
  while (searchFrom <= longer.length - shorter.length) {
    const idx = longer.indexOf(shorter, searchFrom);
    if (idx === -1) {
      return false;
    }

    const beforeOk = idx === 0 || !isUnicodeWordChar(longer[idx - 1]!);
    const afterIdx = idx + shorter.length;
    const afterOk =
      afterIdx === longer.length || !isUnicodeWordChar(longer[afterIdx]!);

    if (beforeOk && afterOk) {
      return true;
    }

    searchFrom = idx + 1;
  }

  return false;
}
