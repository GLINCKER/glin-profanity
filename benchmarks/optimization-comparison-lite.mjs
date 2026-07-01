#!/usr/bin/env node
/**
 * Focused before/after optimization benchmark (JS).
 * Usage: node benchmarks/optimization-comparison-lite.mjs --label before|after
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

const WORKLOADS = [
  {
    id: 'basic_clean',
    config: { languages: ['english'] },
    text: 'The quick brown fox jumps over the lazy dog',
    iterations: 20_000,
  },
  {
    id: 'shootout_clean',
    config: {
      languages: ['english'],
      detectLeetspeak: true,
      leetspeakLevel: 'aggressive',
      normalizeUnicode: true,
    },
    text: 'The quick brown fox jumps over the lazy dog',
    iterations: 20_000,
  },
  {
    id: 'shootout_evasion_mix',
    config: {
      languages: ['english'],
      detectLeetspeak: true,
      leetspeakLevel: 'aggressive',
      normalizeUnicode: true,
    },
    text: 'f.u.c.k and a<br>ss and holy f*** and what a f@cking mess',
    iterations: 10_000,
  },
  {
    id: 'context_aware_insult',
    config: {
      languages: ['english'],
      detectLeetspeak: true,
      leetspeakLevel: 'aggressive',
      normalizeUnicode: true,
      enableContextAware: true,
    },
    text: 'You are a fucking idiot',
    iterations: 10_000,
  },
  {
    id: 'context_aware_whitelist',
    config: {
      languages: ['english'],
      enableContextAware: true,
    },
    text: 'This movie is the bomb',
    iterations: 10_000,
  },
  {
    id: 'cjk_chinese',
    config: { languages: ['chinese'] },
    text: 'hello他妈的',
    iterations: 10_000,
  },
  {
    id: 'all_languages_clean',
    config: { allLanguages: true },
    text: 'The quick brown fox jumps over the lazy dog',
    iterations: 3_000,
  },
];

function measureInit(config, iterations = 300) {
  for (let i = 0; i < 20; i++) new Filter(config);
  const start = performance.now();
  for (let i = 0; i < iterations; i++) new Filter(config);
  const totalMs = performance.now() - start;
  return {
    avg_us: Math.round((totalMs / iterations) * 1000 * 100) / 100,
    ops_per_sec: Math.round((iterations / totalMs) * 1000),
    iterations,
  };
}

function measureIsProfane(filter, text, iterations) {
  for (let i = 0; i < 100; i++) filter.isProfane(text);
  const start = performance.now();
  for (let i = 0; i < iterations; i++) filter.isProfane(text);
  const totalMs = performance.now() - start;
  return {
    avg_us: Math.round((totalMs / iterations) * 1000 * 100) / 100,
    ops_per_sec: Math.round((iterations / totalMs) * 1000),
    iterations,
  };
}

function measureTortureBatch(filter, iterations = 150) {
  const inputs = tortureCases.map((c) => c.input);
  for (let i = 0; i < 3; i++) {
    for (const text of inputs) filter.isProfane(text);
  }
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    for (const text of inputs) filter.isProfane(text);
  }
  const totalMs = performance.now() - start;
  const calls = iterations * inputs.length;
  return {
    avg_us: Math.round((totalMs / calls) * 1000 * 100) / 100,
    ops_per_sec: Math.round((calls / totalMs) * 1000),
    iterations: calls,
  };
}

const results = {
  label,
  node: process.version,
  generated_at: new Date().toISOString(),
  benchmarks: [],
};

const shootoutConfig = WORKLOADS[1].config;
results.benchmarks.push({
  name: 'init_shootout_config',
  ...measureInit(shootoutConfig),
});

const shootoutFilter = new Filter(shootoutConfig);
results.benchmarks.push({
  name: 'torture_set_60_batch',
  ...measureTortureBatch(shootoutFilter),
});

for (const workload of WORKLOADS) {
  const filter = new Filter(workload.config);
  results.benchmarks.push({
    name: workload.id,
    ...measureIsProfane(filter, workload.text, workload.iterations),
  });
}

// Legacy path only when supported
try {
  const legacyFilter = new Filter({ ...shootoutConfig, disableAhoCorasick: true });
  results.benchmarks.push({
    name: 'shootout_legacy_clean',
    ...measureIsProfane(legacyFilter, WORKLOADS[1].text, 20_000),
    has_ac_fast_path: true,
  });
} catch {
  results.benchmarks.push({
    name: 'shootout_legacy_clean',
    ...measureIsProfane(shootoutFilter, WORKLOADS[1].text, 20_000),
    has_ac_fast_path: false,
  });
}

process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
