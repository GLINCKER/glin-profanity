import { Filter } from '../src/filters/Filter';
import type { FilterConfig } from '../src/types/types';
import {
  classifyWordScript,
  hasCjkWordBoundary,
  hasLatinWordBoundary,
  isCjkCharacter,
} from '../src/utils/wordScript';

describe('wordScript utilities', () => {
  test('isCjkCharacter detects CJK scripts', () => {
    expect(isCjkCharacter('你')).toBe(true);
    expect(isCjkCharacter('エ')).toBe(true);
    expect(isCjkCharacter('병')).toBe(true);
    expect(isCjkCharacter('a')).toBe(false);
  });

  test('classifyWordScript uses characters not language', () => {
    expect(classifyWordScript('他妈的')).toBe('cjk');
    expect(classifyWordScript('エッチ')).toBe('cjk');
    expect(classifyWordScript('sm')).toBe('latin');
    expect(classifyWordScript('fuck')).toBe('latin');
  });

  test('hasLatinWordBoundary matches JS \\b semantics', () => {
    expect(hasLatinWordBoundary('hello fuck world', 6, 10)).toBe(true);
    expect(hasLatinWordBoundary('scunthorpe', 5, 9)).toBe(false);
    expect(hasLatinWordBoundary('classic', 2, 5)).toBe(false);
  });

  test('hasCjkWordBoundary allows substring matches including ASCII adjacency', () => {
    expect(hasCjkWordBoundary('你他妈的', 1, 4)).toBe(true);
    expect(hasCjkWordBoundary('hello操world', 5, 6)).toBe(true);
    expect(hasCjkWordBoundary('hello他妈的', 5, 8)).toBe(true);
    expect(hasCjkWordBoundary('123エッチ456', 3, 6)).toBe(true);
  });
});

describe('CJK automatic matching strategy', () => {
  const chineseFilter = new Filter({ languages: ['chinese'] });
  const japaneseFilter = new Filter({ languages: ['japanese'] });
  const koreanFilter = new Filter({ languages: ['korean'] });
  const englishFilter = new Filter({ languages: ['english'] });
  const mixedFilter = new Filter({ languages: ['english', 'chinese'] });

  describe('detects CJK profanity with default wordBoundaries', () => {
    test('Chinese', () => {
      expect(chineseFilter.isProfane('你他妈的')).toBe(true);
      expect(chineseFilter.checkProfanity('他妈的').profaneWords.length).toBeGreaterThan(0);
    });

    test('Japanese', () => {
      expect(japaneseFilter.isProfane('このエッチな話')).toBe(true);
      expect(japaneseFilter.isProfane('エッチ')).toBe(true);
    });

    test('Korean', () => {
      expect(koreanFilter.isProfane('이 병신')).toBe(true);
      expect(koreanFilter.isProfane('병신')).toBe(true);
    });

    test('Japanese ASCII entries still use Latin boundaries', () => {
      expect(japaneseFilter.isProfane('hello xx world')).toBe(true);
      expect(japaneseFilter.isProfane('xxtra')).toBe(false);
    });

    test('detects CJK profanity wrapped in or adjacent to ASCII', () => {
      expect(chineseFilter.isProfane('hello他妈的')).toBe(true);
      expect(chineseFilter.isProfane('x乳x')).toBe(true);
      expect(chineseFilter.isProfane('123他妈的456')).toBe(true);
      expect(japaneseFilter.isProfane('abcエッチdef')).toBe(true);
    });
  });

  describe('preserves English false-positive protection', () => {
    test('does not flag scunthorpe or classic for English words', () => {
      expect(englishFilter.isProfane('scunthorpe')).toBe(false);
      expect(englishFilter.isProfane('classic')).toBe(false);
      expect(englishFilter.isProfane('assassin')).toBe(false);
    });

    test('still detects standalone English profanity', () => {
      expect(englishFilter.isProfane('hello fuck world')).toBe(true);
    });

    test('mixed filter does not false-positive English traps', () => {
      expect(mixedFilter.isProfane('scunthorpe')).toBe(false);
      expect(mixedFilter.isProfane('classic')).toBe(false);
    });
  });

  describe('mixed-language filters', () => {
    test('detects both English and Chinese in one filter', () => {
      expect(mixedFilter.isProfane('hello fuck')).toBe(true);
      expect(mixedFilter.isProfane('你他妈的')).toBe(true);
    });
  });

  describe('AC and legacy parity for CJK', () => {
    const cases = ['你他妈的', '他妈的', 'エッチ', '병신', 'hello fuck', 'scunthorpe', 'hello他妈的', 'x乳x', 'abcエッチdef'];

    const configs: FilterConfig[] = [
      { languages: ['chinese'] },
      { languages: ['japanese'] },
      { languages: ['korean'] },
      { languages: ['english', 'chinese'] },
    ];

    for (const config of configs) {
      describe(JSON.stringify(config), () => {
        const fast = new Filter(config);
        const legacy = new Filter({ ...config, disableAhoCorasick: true });

        for (const text of cases) {
          test(`parity for ${JSON.stringify(text)}`, () => {
            expect(fast.isProfane(text)).toBe(legacy.isProfane(text));
            expect(fast.checkProfanity(text).containsProfanity).toBe(
              legacy.checkProfanity(text).containsProfanity,
            );
          });
        }
      });
    }
  });

  describe('replacement with CJK words', () => {
    test('replaces Chinese profanity without requiring \\b', () => {
      const filter = new Filter({
        languages: ['chinese'],
        replaceWith: '***',
      });
      const result = filter.checkProfanity('你他妈的');
      expect(result.processedText).toContain('***');
      expect(result.processedText).not.toContain('他妈的');
    });
  });
});
