/**
 * @fileoverview Evasion normalization for profanity detection.
 * Handles HTML injection, separator obfuscation, and asterisk masking.
 * @module utils/evasion
 */

const MAX_UNICODE_CODEPOINT = 0x10ffff;

function isValidUnicodeScalar(code: number): boolean {
  if (!Number.isFinite(code) || code < 0 || code > MAX_UNICODE_CODEPOINT) {
    return false;
  }
  return code < 0xd800 || code > 0xdfff;
}

function safeCodePoint(code: number, fallback: string): string {
  if (!isValidUnicodeScalar(code)) {
    return fallback;
  }
  try {
    return String.fromCodePoint(code);
  } catch {
    return fallback;
  }
}

/**
 * Removes HTML tags and decodes common numeric/named entities.
 */
export function stripHtmlAndDecodeEntities(text: string): string {
  let result = text.replace(/<[^>]*>/g, '');

  result = result.replace(/&#(\d+);/g, (entity, dec: string) => {
    const code = parseInt(dec, 10);
    return safeCodePoint(code, entity);
  });

  result = result.replace(/&#x([0-9a-fA-F]+);/g, (entity, hex: string) => {
    const code = parseInt(hex, 16);
    return safeCodePoint(code, entity);
  });

  return result
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'");
}

/**
 * Collapses single alphanumerics separated by spaces, dots, underscores, or hyphens.
 * Handles patterns like "f.u.c.k", "f_u_c_k", and "b-i-t-c-h".
 */
export function collapseSeparatedCharacters(text: string): string {
  const pattern =
    /\b([a-zA-Z0-9@$!#*])(?:[\s._\-]+([a-zA-Z0-9@$!#*])){2,}\b/g;

  return text.replace(pattern, (match) => match.replace(/[\s._\-]+/g, ''));
}

/**
 * Expands common asterisk-masked profanity abbreviations.
 */
export function normalizeMaskedProfanity(text: string): string {
  return text
    .replace(/\bf\*+cking\b/gi, 'fucking')
    .replace(/\bf\*+ck\b/gi, 'fuck')
    .replace(/\bs\*+hit\b/gi, 'shit')
    .replace(/\bf\*{2,}(?=\W|$)/gi, 'fuck')
    .replace(/\bf\s+yourself\b/gi, 'fuck yourself');
}

/**
 * Applies all evasion normalization steps before Unicode/leetspeak handling.
 */
export function normalizeEvasion(text: string): string {
  let result = text;
  result = stripHtmlAndDecodeEntities(result);
  result = collapseSeparatedCharacters(result);
  result = normalizeMaskedProfanity(result);
  return result;
}
