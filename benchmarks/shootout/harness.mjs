/**
 * glin-profanity Competitive Benchmark Shootout
 *
 * Accuracy (precision, recall, F1, FPR) + ops/sec across the torture-set.
 *
 * Run: cd benchmarks/shootout && npm install && npm run build-glin && node harness.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Bench } from 'tinybench';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Load torture-set
// ---------------------------------------------------------------------------
const tortureCases = JSON.parse(
  readFileSync(join(__dirname, 'torture-set.json'), 'utf8'),
);

// ---------------------------------------------------------------------------
// Load competitors
// ---------------------------------------------------------------------------

// glin-profanity
import { Filter as GlinFilter } from '../../packages/js/dist/index.js';
const glinFilter = new GlinFilter({
  languages: ['english'],
  detectLeetspeak: true,
  leetspeakLevel: 'aggressive',
  normalizeUnicode: true,
});

// obscenity
import {
  RegExpMatcher,
  englishDataset,
  englishRecommendedTransformers,
} from './node_modules/obscenity/dist/index.js';
const obscenityMatcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

// bad-words — CJS package, use createRequire
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const BadWords = require('bad-words');
const badWordsFilter = new BadWords();

// leo-profanity
const leoProfanity = require('leo-profanity');
leoProfanity.loadDictionary('en');

// @2toad/profanity
const { Profanity: ToadProfanity } = require('@2toad/profanity');
const toadFilter = new ToadProfanity();

// ---------------------------------------------------------------------------
// Runner definitions
// ---------------------------------------------------------------------------
const runners = [
  {
    name: 'glin-profanity',
    check: (text) => glinFilter.isProfane(text),
  },
  {
    name: 'obscenity',
    check: (text) => obscenityMatcher.hasMatch(text),
  },
  {
    name: 'bad-words',
    check: (text) => {
      try {
        return badWordsFilter.isProfane(text);
      } catch {
        return false;
      }
    },
  },
  {
    name: 'leo-profanity',
    check: (text) => leoProfanity.check(text),
  },
  {
    name: '@2toad/profanity',
    check: (text) => toadFilter.exists(text),
  },
];

// ---------------------------------------------------------------------------
// Accuracy evaluation
// ---------------------------------------------------------------------------
function evaluateAccuracy(runner, cases) {
  let tp = 0, fp = 0, fn = 0, tn = 0;
  const failures = [];

  for (const { input, shouldFlag, category } of cases) {
    const flagged = runner.check(input);
    if (shouldFlag && flagged) tp++;
    else if (!shouldFlag && flagged) { fp++; failures.push({ input, expected: false, got: true, category }); }
    else if (shouldFlag && !flagged) { fn++; failures.push({ input, expected: true, got: false, category }); }
    else tn++;
  }

  const precision = tp + fp > 0 ? tp / (tp + fp) : 1;
  const recall    = tp + fn > 0 ? tp / (tp + fn) : 1;
  const f1        = precision + recall > 0
    ? 2 * precision * recall / (precision + recall)
    : 0;
  const fpr = fp + tn > 0 ? fp / (fp + tn) : 0;

  return { tp, fp, fn, tn, precision, recall, f1, fpr, failures };
}

console.log('='.repeat(70));
console.log('glin-profanity Competitive Shootout');
console.log('='.repeat(70));
console.log(`Torture-set size: ${tortureCases.length} cases`);
console.log();

// Accuracy results
const accuracyResults = [];
for (const runner of runners) {
  const acc = evaluateAccuracy(runner, tortureCases);
  accuracyResults.push({ name: runner.name, ...acc });
  console.log(`[${runner.name}] TP=${acc.tp} FP=${acc.fp} FN=${acc.fn} TN=${acc.tn} | P=${pct(acc.precision)} R=${pct(acc.recall)} F1=${pct(acc.f1)} FPR=${pct(acc.fpr)}`);
  if (acc.failures.length > 0) {
    console.log(`  Failures (${acc.failures.length}):`);
    for (const f of acc.failures) {
      console.log(`    ${f.expected ? 'MISS' : 'FALSE+'} [${f.category}] "${f.input}"`);
    }
  }
  console.log();
}

// ---------------------------------------------------------------------------
// Performance benchmark (ops/sec)
// ---------------------------------------------------------------------------
console.log('Running ops/sec benchmarks (this takes ~30s)...');
console.log();

// Use a mixed sample for benchmark: 20 cases spanning clean + profane
const benchSample = tortureCases.slice(0, 20).map((c) => c.input);

const bench = new Bench({ time: 500, iterations: 1000 });

for (const runner of runners) {
  bench.add(runner.name, () => {
    for (const text of benchSample) {
      runner.check(text);
    }
  });
}

await bench.run();

console.log('Ops/sec (higher is better — 20 inputs per iteration):');
const perfResults = bench.tasks.map((t) => ({
  name: t.name,
  opsPerSec: t.result?.hz ?? 0,
  avgMs: t.result?.mean ?? 0,
}));
for (const r of perfResults) {
  console.log(`  ${r.name.padEnd(22)} ${Math.round(r.opsPerSec).toLocaleString()} ops/sec  (avg ${(r.avgMs * 1000).toFixed(1)} µs)`);
}

// ---------------------------------------------------------------------------
// Bundle size (minified dist)
// ---------------------------------------------------------------------------
import { statSync } from 'node:fs';
function safeSize(path) {
  try { return statSync(path).size; } catch { return null; }
}

const bundleSizes = {
  'glin-profanity': safeSize(join(__dirname, '../../packages/js/dist/index.js')),
  'obscenity': safeSize(join(__dirname, 'node_modules/obscenity/dist/index.js')),
  'bad-words': safeSize(join(__dirname, 'node_modules/bad-words/lib/badwords.js')),
  'leo-profanity': safeSize(join(__dirname, 'node_modules/leo-profanity/src/index.js')),
  '@2toad/profanity': safeSize(join(__dirname, 'node_modules/@2toad/profanity/dist/profanity.js')),
};

// ---------------------------------------------------------------------------
// Write results.md
// ---------------------------------------------------------------------------
const now = new Date().toISOString().split('T')[0];

let md = `# Benchmark Results — glin-profanity Shootout\n\n`;
md += `_Generated: ${now}  |  Torture-set: ${tortureCases.length} cases  |  Node ${process.version}_\n\n`;

// Accuracy table
md += `## Accuracy\n\n`;
md += `| Library | Precision | Recall | F1 | False-Positive Rate | TP | FP | FN | TN |\n`;
md += `|---------|-----------|--------|----|---------------------|----|----|----|----|\n`;
for (const r of accuracyResults) {
  md += `| ${r.name} | ${pct(r.precision)} | ${pct(r.recall)} | ${pct(r.f1)} | ${pct(r.fpr)} | ${r.tp} | ${r.fp} | ${r.fn} | ${r.tn} |\n`;
}

// Category breakdown
const categories = [...new Set(tortureCases.map((c) => c.category))];
md += `\n## Recall by Category\n\n`;
md += `| Library | ${categories.join(' | ')} |\n`;
md += `|---------|${categories.map(() => '---').join('|')}|\n`;
for (const runner of runners) {
  const cols = categories.map((cat) => {
    const inCat = tortureCases.filter((c) => c.category === cat);
    const positive = inCat.filter((c) => c.shouldFlag);
    if (positive.length === 0) {
      // FP check for clean categories
      const fp = inCat.filter((c) => !c.shouldFlag && runner.check(c.input)).length;
      return fp === 0 ? `OK` : `${fp} FP`;
    }
    const detected = positive.filter((c) => runner.check(c.input)).length;
    return `${detected}/${positive.length}`;
  });
  md += `| ${runner.name} | ${cols.join(' | ')} |\n`;
}

// Performance table
md += `\n## Performance (ops/sec, 20 inputs per iteration)\n\n`;
md += `| Library | ops/sec | avg latency |\n`;
md += `|---------|---------|-------------|\n`;
const maxOps = Math.max(...perfResults.map((r) => r.opsPerSec));
for (const r of perfResults) {
  const bar = r.opsPerSec === maxOps ? ' 🏆' : '';
  md += `| ${r.name}${bar} | ${Math.round(r.opsPerSec).toLocaleString()} | ${(r.avgMs * 1000).toFixed(1)} µs |\n`;
}

// Bundle sizes
md += `\n## Bundle Size (unminified JS dist)\n\n`;
md += `| Library | Size |\n`;
md += `|---------|------|\n`;
for (const [lib, size] of Object.entries(bundleSizes)) {
  md += `| ${lib} | ${size ? (size / 1024).toFixed(1) + ' KB' : 'N/A'} |\n`;
}

md += `\n## Notes\n\n`;
md += `- **glin-profanity** configured with \`detectLeetspeak: true, leetspeakLevel: 'aggressive', normalizeUnicode: true\`\n`;
md += `- All competitors run with default settings\n`;
md += `- Torture-set covers: clean text, false-positive traps, basic profanity, leetspeak, homoglyphs, zero-width chars, word-break separators, HTML injection, uppercase, mixed-case, repeated chars\n`;
md += `- Performance measured with [tinybench](https://github.com/tinylibs/tinybench), 20 inputs per iteration, 500ms warmup\n`;
md += `- Bundle sizes are unminified source files; minified + gzipped sizes will be smaller\n`;

writeFileSync(join(__dirname, 'results.md'), md, 'utf8');
console.log('\nResults written to benchmarks/shootout/results.md');

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
function pct(n) {
  return (n * 100).toFixed(1) + '%';
}
