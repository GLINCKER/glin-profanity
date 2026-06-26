/**
 * Maps span positions from a normalized variant back to the original text.
 * Assumes normalization is order-preserving (no reordering of characters).
 */

import { homoglyphToAscii } from './unicode';

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

const SKIPPABLE_ORIGINAL_CHARS = new Set(['*', '.', '_', '-', ' ']);

function charsEqual(a: string, b: string): boolean {
  return a === b || a.toLowerCase() === b.toLowerCase();
}

function charsAlign(originalChar: string, variantChar: string): boolean {
  if (charsEqual(originalChar, variantChar)) {
    return true;
  }

  const leet = LEET_TO_ASCII[originalChar] ?? LEET_TO_ASCII[originalChar.toLowerCase()];
  if (leet !== undefined && charsEqual(leet, variantChar)) {
    return true;
  }

  const homoglyph = homoglyphToAscii(originalChar);
  if (homoglyph !== originalChar && charsEqual(homoglyph, variantChar)) {
    return true;
  }

  return false;
}

function isSkippableOriginalChar(char: string): boolean {
  return SKIPPABLE_ORIGINAL_CHARS.has(char);
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
    return {
      start: idx,
      end: idx + needle.length,
      matchedText: original.slice(idx, idx + needle.length),
    };
  }

  return {
    start: Math.min(variantStart, original.length),
    end: Math.min(variantEnd, original.length),
    matchedText: original.slice(
      Math.min(variantStart, original.length),
      Math.min(variantEnd, original.length),
    ),
  };
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
    return {
      start: variantStart,
      end: variantEnd,
      matchedText: original.slice(variantStart, variantEnd),
    };
  }

  let originalIndex = 0;
  let variantIndex = 0;
  let origStart = -1;
  let origEnd = -1;

  while (variantIndex < variant.length && originalIndex <= original.length) {
    if (variantIndex === variantStart && origStart === -1) {
      origStart = originalIndex;
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

    if (charsAlign(originalChar, variantChar)) {
      variantIndex++;
      originalIndex++;
      continue;
    }

    if (isSkippableOriginalChar(originalChar)) {
      originalIndex++;
      continue;
    }

    originalIndex++;
  }

  if (origStart === -1) {
    origStart = 0;
  }
  if (origEnd === -1) {
    origEnd = original.length;
  }

  const matchedText = original.slice(origStart, origEnd);
  if (!matchedText || origStart >= origEnd) {
    return fallbackSpan(original, variant, variantStart, variantEnd);
  }

  return { start: origStart, end: origEnd, matchedText };
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

    const beforeOk = idx === 0 || !/\w/.test(longer[idx - 1]!);
    const afterIdx = idx + shorter.length;
    const afterOk =
      afterIdx === longer.length || !/\w/.test(longer[afterIdx]!);

    if (beforeOk && afterOk) {
      return true;
    }

    searchFrom = idx + 1;
  }

  return false;
}
