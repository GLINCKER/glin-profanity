#!/usr/bin/env node
/**
 * Standardized glin-profanity performance benchmark.
 * Outputs JSON to stdout for before/after comparison.
 *
 * Usage: node benchmarks/optimization-comparison.mjs [--label before|after]
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = process.env.GLIN_REPO_ROOT
  ? join(process.env.GLIN_REPO_ROOT)
  : join(__dirname, '..');
const { Filter } = await import(join(repoRoot, 'packages/js/dist/index.js'));
const label =
  process.argv.includes('--label')
    ? process.argv[process.argv.indexOf('--label') + 1]
    : 'current';

const tortureCases = JSON.parse(
  readFileSync(join(__dirname, 'shootout/torture-set.json'), 'utf8'),
);

const TEXTS = {
  clean_short: 'The quick brown fox jumps over the lazy dog',
  clean_long:
    'This is a much longer text that contains multiple sentences. ' +
    'It simulates real-world usage where users might submit paragraphs of text. ' +
    'The filter needs to check the entire text for profanity efficiently.',
  profane_basic: 'This contains some shit and other crap',
  evasion_leetspeak: 'what a f@cking mess',
  evasion_wordbreak: 'f.u.c.k',
  evasion_html: 'a<br>ss',
  evasion_masked: 'holy f*** that was amazing',
  cjk_chinese: 'hello他妈的',
  context_whitelist: 'This movie is the bomb',
  context_profanity: 'You are a fucking idiot',
};

const CONFIGS = {
  basic: { languages: ['english'] },
  shootout: {
    languages: ['english'],
    detectLeetspeak: true,
    leetspeakLevel: 'aggressive',
    normalizeUnicode: true,
  },
  shootout_legacy: {
    languages: ['english'],
    detectLeetspeak: true,
    leetspeakLevel: 'aggressive',
    normalizeUnicode: true,
    disableAhoCorasick: true,
  },
  context_aware: {
    languages: ['english'],
    detectLeetspeak: true,
    leetspeakLevel: 'aggressive',
    normalizeUnicode: true,
    enableContextAware: true,
  },
  cjk_chinese: { languages: ['chinese'] },
  multi_lang: { languages: ['english', 'spanish', 'french', 'german'] },
  all_languages: { allLanguages: true },
  cached_shootout: {
    languages: ['english'],
    detectLeetspeak: true,
    leetspeakLevel: 'aggressive',
    normalizeUnicode: true,
    cacheResults: true,
    maxCacheSize: 1000,
  },
};

function measure(name, fn, iterations = 10_000) {
  for (let i = 0; i < 100; i++) {
    fn();
  }
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const totalMs = performance.now() - start;
  const avgUs = (totalMs / iterations) * 1000;
  return {
    name,
    iterations,
    avg_us: Math.round(avgUs * 100) / 100,
    ops_per_sec: Math.round((iterations / totalMs) * 1000),
  };
}

function measureInit(configKey) {
  const config = CONFIGS[configKey];
  const iterations = 500;
  for (let i = 0; i < 20; i++) {
    // eslint-disable-next-line no-new
    new Filter(config);
  }
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    // eslint-disable-next-line no-new
    new Filter(config);
  }
  const totalMs = performance.now() - start;
  return {
    name: `init:${configKey}`,
    iterations,
    avg_us: Math.round((totalMs / iterations) * 1000 * 100) / 100,
    ops_per_sec: Math.round((iterations / totalMs) * 1000),
  };
}

function measureTortureBatch(filter, iterations = 200) {
  const inputs = tortureCases.map((c) => c.input);
  for (let i = 0; i < 5; i++) {
    for (const text of inputs) {
      filter.isProfane(text);
    }
  }
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    for (const text of inputs) {
      filter.isProfane(text);
    }
  }
  const totalMs = performance.now() - start;
  const calls = iterations * inputs.length;
  return {
    name: 'torture_set_60x_isProfane',
    iterations: calls,
    avg_us: Math.round((totalMs / calls) * 1000 * 100) / 100,
    ops_per_sec: Math.round((calls / totalMs) * 1000),
  };
}

const results = {
  label,
  node: process.version,
  generated_at: new Date().toISOString(),
  benchmarks: [],
};

for (const configKey of Object.keys(CONFIGS)) {
  results.benchmarks.push(measureInit(configKey));
}

for (const [configKey, config] of Object.entries(CONFIGS)) {
  const filter = new Filter(config);
  for (const [textKey, text] of Object.entries(TEXTS)) {
    const iter = textKey === 'clean_long' || configKey === 'all_languages' ? 5000 : 10_000;
    results.benchmarks.push({
      ...measure(`${configKey}/isProfane/${textKey}`, () => filter.isProfane(text), iter),
      config: configKey,
      method: 'isProfane',
      text: textKey,
    });
    if (configKey === 'shootout' || configKey === 'context_aware') {
      results.benchmarks.push({
        ...measure(
          `${configKey}/checkProfanity/${textKey}`,
          () => filter.checkProfanity(text),
          Math.min(iter, 5000),
        ),
        config: configKey,
        method: 'checkProfanity',
        text: textKey,
      });
    }
  }
  if (configKey === 'shootout' || configKey === 'context_aware') {
    results.benchmarks.push({
      ...measureTortureBatch(filter),
      config: configKey,
      method: 'isProfane',
      text: 'torture_set_60',
    });
  }
}

if (CONFIGS.cached_shootout) {
  const cached = new Filter(CONFIGS.cached_shootout);
  cached.checkProfanity(TEXTS.clean_short);
  results.benchmarks.push({
    ...measure('cached_shootout/checkProfanity/clean_short_hit', () =>
      cached.checkProfanity(TEXTS.clean_short),
    ),
    config: 'cached_shootout',
    method: 'checkProfanity',
    text: 'clean_short_cached',
  });
}

process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
