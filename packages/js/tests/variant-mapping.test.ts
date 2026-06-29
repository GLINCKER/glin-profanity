import { mapVariantSpanToOriginal, isNestedProfaneSpan, trimProfaneSpanEdges } from '../src/utils/variantMapping';

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

  test('maps accent-stripped variant back to original word', () => {
    const original = ' mamá se fue?';
    const variant = ' mama se fue?';
    const span = mapVariantSpanToOriginal(original, variant, 1, 5);
    expect(span.matchedText).toBe('mamá');
  });

  test('maps leetspeak parenthesis substitution back to original span', () => {
    const original = '(miro su camel toe bien marcado en sus tangas)';
    const variant = 'cmiro su camel toe bien marcado en sus tangas)';
    const span = mapVariantSpanToOriginal(original, variant, 9, 18);
    expect(span.matchedText).toBe('camel toe');
  });

  test('does not stretch a fully masked word across following words', () => {
    // "f******" -> "fuck": the masked letters must not consume the rest of
    // the sentence. The word is not literally recoverable, so the span drops.
    const original = 'throat f****** myself while f****** your face';
    const variant = 'throat fuck myself while fuck your face';
    const span = mapVariantSpanToOriginal(original, variant, 7, 11);
    expect(span.matchedText).toBe('');
  });

  test('does not stretch span across unicode punctuation drift', () => {
    // "…" -> ".." shifts indices; the mapped span for "cazzo" stays tight.
    const original = 'amico…cazzo ci stavi';
    const variant = 'amico..cazzo ci stavi';
    const span = mapVariantSpanToOriginal(original, variant, 7, 12);
    expect(span.matchedText).toBe('cazzo');
  });

  test('trims leading dots from gay span edges', () => {
    const span = trimProfaneSpanEdges('Sei un...gay?', 7, 12);
    expect(span.matchedText).toBe('gay');
  });

  test('maps profanity after emoji variation selector without FE0F in span', () => {
    const original = '❤️fuck';
    const variant = '❤fuck';
    const span = mapVariantSpanToOriginal(original, variant, 1, 5);
    expect(span.matchedText).toBe('fuck');
    expect(span.start).toBe(2);
    expect(span.end).toBe(6);
  });

  test('maps profanity after keycap-style emoji without variation selector bleed', () => {
    const original = '#️fuck';
    const variant = '#fuck';
    const span = mapVariantSpanToOriginal(original, variant, 1, 5);
    expect(span.matchedText).toBe('fuck');
    expect(span.start).toBe(2);
    expect(span.end).toBe(6);
  });
});

describe('isNestedProfaneSpan', () => {
  test('detects nested profanity spans with word boundaries', () => {
    expect(isNestedProfaneSpan('sh!t', 'piece of sh!t')).toBe(true);
  });

  test('does not treat ass in classic as nested', () => {
    expect(isNestedProfaneSpan('ass', 'classic')).toBe(false);
  });

  test('uses Unicode word boundaries (matches Python \\w semantics)', () => {
    // ß is a word character in Unicode \w; ass after ß is not word-bounded.
    expect(isNestedProfaneSpan('ass', 'xßass')).toBe(false);
  });
});
