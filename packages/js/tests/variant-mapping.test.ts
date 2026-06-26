import { mapVariantSpanToOriginal, isNestedProfaneSpan } from '../src/utils/variantMapping';

describe('mapVariantSpanToOriginal', () => {
  test('maps collapsed separators back to original span', () => {
    const original = 'say f.u.c.k off';
    const variant = 'say fuck off';
    const span = mapVariantSpanToOriginal(original, variant, 4, 8);
    expect(span.matchedText).toBe('f.u.c.k');
    expect(original.slice(span.start, span.end)).toBe('f.u.c.k');
  });

  test('maps leetspeak substitutions back to original span', () => {
    const span = mapVariantSpanToOriginal('@ss', 'ass', 0, 3);
    expect(span.matchedText).toBe('@ss');
  });

  test('maps repeated-character collapse back to original span', () => {
    const span = mapVariantSpanToOriginal('fuuuuuck', 'fuck', 0, 4);
    expect(span.matchedText).toBe('fuuuuuck');
  });

  test('maps asterisk masking back to original span', () => {
    const span = mapVariantSpanToOriginal('holy f***', 'holy fuck', 5, 9);
    expect(span.matchedText).toBe('f***');
  });

  test('maps unicode homoglyphs back to original span', () => {
    const original = 'fυck you';
    const variant = 'fuck you';
    const span = mapVariantSpanToOriginal(original, variant, 0, 4);
    expect(span.matchedText).toBe('fυck');
  });

  test('maps lowercased original tier back to mixed-case text', () => {
    const original = 'What a FUCK';
    const variant = 'what a fuck';
    const span = mapVariantSpanToOriginal(original, variant, 7, 11);
    expect(span.matchedText).toBe('FUCK');
  });

  test('returns identity mapping when texts match', () => {
    const text = 'plain fuck here';
    const span = mapVariantSpanToOriginal(text, text, 6, 10);
    expect(span.matchedText).toBe('fuck');
    expect(span.start).toBe(6);
    expect(span.end).toBe(10);
  });
});

describe('isNestedProfaneSpan', () => {
  test('detects nested profanity spans with word boundaries', () => {
    expect(isNestedProfaneSpan('sh!t', 'piece of sh!t')).toBe(true);
  });

  test('does not treat ass in classic as nested', () => {
    expect(isNestedProfaneSpan('ass', 'classic')).toBe(false);
  });
});
