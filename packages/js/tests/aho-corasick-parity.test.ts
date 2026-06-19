import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Filter } from '../src/filters/Filter';
import type { FilterConfig } from '../src/types/types';

interface TortureCase {
  input: string;
  shouldFlag: boolean;
  category?: string;
}

const tortureSet: TortureCase[] = JSON.parse(
  readFileSync(
    join(__dirname, '../../../benchmarks/shootout/torture-set.json'),
    'utf8',
  ),
);

const FILTER_CONFIGS: FilterConfig[] = [
  { languages: ['english'] },
  {
    languages: ['english'],
    detectLeetspeak: true,
    leetspeakLevel: 'moderate',
  },
  {
    languages: ['english'],
    detectLeetspeak: true,
    leetspeakLevel: 'aggressive',
    normalizeUnicode: true,
  },
  {
    languages: ['english', 'spanish'],
    detectLeetspeak: true,
    normalizeUnicode: true,
  },
  {
    languages: ['english'],
    replaceWith: '***',
    detectLeetspeak: true,
    severityLevels: true,
  },
  { allLanguages: true, detectLeetspeak: true, normalizeUnicode: true },
];

const EXTRA_TEXTS = [
  '',
  'hello world',
  'The quick brown fox',
  'Scunthorpe is a town',
  'classic music',
  'assassin',
  'fuck',
  'FUCK',
  'f4ck',
  '@ss',
  'fuuuuck',
  'f u c k',
  'This is damn bad',
];

function normalizeResult(result: ReturnType<Filter['checkProfanity']>) {
  return {
    containsProfanity: result.containsProfanity,
    profaneWords: [...result.profaneWords].sort(),
    processedText: result.processedText,
    severityMap: result.severityMap,
  };
}

describe('Aho-Corasick parity with legacy regex path', () => {
  for (const config of FILTER_CONFIGS) {
    const label = JSON.stringify(config);

    describe(`config ${label}`, () => {
      const fastFilter = new Filter(config);
      const legacyFilter = new Filter({ ...config, disableAhoCorasick: true });

      test('uses Aho-Corasick when eligible', () => {
        const expectsAc =
          (config.wordBoundaries ?? true) || Boolean(config.enableContextAware);
        if (expectsAc && !config.disableAhoCorasick) {
          expect(fastFilter).toBeDefined();
        }
      });

      for (const text of EXTRA_TEXTS) {
        test(`isProfane parity for ${JSON.stringify(text)}`, () => {
          expect(fastFilter.isProfane(text)).toBe(legacyFilter.isProfane(text));
        });

        test(`checkProfanity parity for ${JSON.stringify(text)}`, () => {
          expect(normalizeResult(fastFilter.checkProfanity(text))).toEqual(
            normalizeResult(legacyFilter.checkProfanity(text)),
          );
        });
      }

      for (const tortureCase of tortureSet) {
        test(`torture-set [${tortureCase.category}] ${JSON.stringify(tortureCase.input)}`, () => {
          expect(fastFilter.isProfane(tortureCase.input)).toBe(
            legacyFilter.isProfane(tortureCase.input),
          );
          expect(normalizeResult(fastFilter.checkProfanity(tortureCase.input))).toEqual(
            normalizeResult(legacyFilter.checkProfanity(tortureCase.input)),
          );
        });
      }
    });
  }

  test('legacy path is used when word boundaries are disabled', () => {
    const config: FilterConfig = {
      languages: ['english'],
      wordBoundaries: false,
      fuzzyToleranceLevel: 0.6,
    };
    const fast = new Filter(config);
    const legacy = new Filter({ ...config, disableAhoCorasick: true });
    const text = 'scunthorpe';
    expect(fast.isProfane(text)).toBe(legacy.isProfane(text));
  });

  test('context-aware mode uses Aho-Corasick when word boundaries are disabled', () => {
    const config: FilterConfig = {
      languages: ['english'],
      enableContextAware: true,
      wordBoundaries: false,
      fuzzyToleranceLevel: 0.6,
    };
    const filter = new Filter(config);
    expect(filter['dictionaryMatcher']).toBeTruthy();
  });

  test('context-aware AC and legacy regex paths agree with word boundaries disabled', () => {
    const config: FilterConfig = {
      languages: ['english'],
      enableContextAware: true,
      wordBoundaries: false,
      fuzzyToleranceLevel: 0.6,
      contextWindow: 3,
      confidenceThreshold: 0.7,
    };
    const fast = new Filter(config);
    const legacy = new Filter({ ...config, disableAhoCorasick: true });
    const cases = [
      'scunthorpe',
      'This movie is the bomb',
      'You are a fucking idiot',
    ];

    for (const text of cases) {
      expect(fast.isProfane(text)).toBe(legacy.isProfane(text));
      expect(fast.checkProfanity(text)).toEqual(legacy.checkProfanity(text));
    }
  });

  test('context-aware mode uses Aho-Corasick for candidate discovery', () => {
    const config: FilterConfig = {
      languages: ['english'],
      enableContextAware: true,
    };
    const filter = new Filter(config);
    expect(filter['dictionaryMatcher']).toBeTruthy();
  });

  test('context-aware AC and legacy regex paths agree', () => {
    const config: FilterConfig = {
      languages: ['english'],
      enableContextAware: true,
      contextWindow: 3,
      confidenceThreshold: 0.7,
    };
    const fast = new Filter(config);
    const legacy = new Filter({ ...config, disableAhoCorasick: true });
    const cases = [
      'This movie is the bomb',
      'The bomb exploded and shit happened',
      'You are a fucking idiot',
      'This movie is sick!',
    ];

    for (const text of cases) {
      expect(fast.checkProfanity(text)).toEqual(legacy.checkProfanity(text));
    }
  });
});
