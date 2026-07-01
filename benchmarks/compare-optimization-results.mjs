#!/usr/bin/env node
/**
 * Compare before/after optimization benchmark JSON files.
 * Usage: node benchmarks/compare-optimization-results.mjs before.json after.json
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const [beforePath, afterPath] = process.argv.slice(2);

if (!beforePath || !afterPath) {
  console.error('Usage: node compare-optimization-results.mjs before.json after.json');
  process.exit(1);
}

const before = JSON.parse(readFileSync(beforePath, 'utf8'));
const after = JSON.parse(readFileSync(afterPath, 'utf8'));

const beforeMap = new Map(before.benchmarks.map((b) => [b.name, b]));
const afterMap = new Map(after.benchmarks.map((b) => [b.name, b]));

const names = [...new Set([...beforeMap.keys(), ...afterMap.keys()])].sort();

function pctChange(oldVal, newVal) {
  if (!oldVal || !newVal) return 'N/A';
  const change = ((newVal - oldVal) / oldVal) * 100;
  const sign = change > 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
}

function fmt(n) {
  return n == null ? '—' : n.toLocaleString();
}

const rows = [];
for (const name of names) {
  const b = beforeMap.get(name);
  const a = afterMap.get(name);
  if (!b || !a) continue;
  rows.push({
    name,
    before_ops: b.ops_per_sec,
    after_ops: a.ops_per_sec,
    before_us: b.avg_us,
    after_us: a.avg_us,
    ops_change: pctChange(b.ops_per_sec, a.ops_per_sec),
    latency_change: pctChange(b.avg_us, a.avg_us),
  });
}

const keyRows = rows.filter((r) =>
  [
    'init:shootout',
    'init:context_aware',
    'init:all_languages',
    'shootout/isProfane/clean_short',
    'shootout/isProfane/evasion_wordbreak',
    'shootout/isProfane/evasion_html',
    'shootout/isProfane/evasion_masked',
    'shootout/isProfane/cjk_chinese',
    'shootout_legacy/isProfane/clean_short',
    'shootout_legacy/isProfane/evasion_wordbreak',
    'context_aware/isProfane/context_whitelist',
    'context_aware/isProfane/context_profanity',
    'context_aware/checkProfanity/context_profanity',
    'torture_set_60x_isProfane',
    'cached_shootout/checkProfanity/clean_short_hit',
    'all_languages/isProfane/clean_short',
  ].some((k) => r.name.includes(k.replace(/\//g, '/')) || r.name === k),
);

// Fix key row matching - use exact name match
const KEY_NAMES = new Set([
  'init:shootout',
  'init:context_aware',
  'init:all_languages',
  'shootout/isProfane/clean_short',
  'shootout/isProfane/evasion_wordbreak',
  'shootout/isProfane/evasion_html',
  'shootout/isProfane/evasion_masked',
  'shootout/isProfane/cjk_chinese',
  'shootout_legacy/isProfane/clean_short',
  'shootout_legacy/isProfane/evasion_wordbreak',
  'context_aware/isProfane/context_whitelist',
  'context_aware/isProfane/context_profanity',
  'context_aware/checkProfanity/context_profanity',
  'torture_set_60x_isProfane',
  'cached_shootout/checkProfanity/clean_short_hit',
  'all_languages/isProfane/clean_short',
]);

const summaryRows = rows.filter((r) => KEY_NAMES.has(r.name));

let md = `# Optimization Performance Comparison (JS)\n\n`;
md += `_Before: ${before.label} (${before.node}) | After: ${after.label} (${after.node})_\n\n`;
md += `_Generated: ${new Date().toISOString().split('T')[0]}_\n\n`;
md += `> Negative latency change = faster. Positive ops/sec change = faster.\n\n`;

md += `## Key Workloads\n\n`;
md += `| Benchmark | Before (ops/s) | After (ops/s) | Δ throughput | Before (µs) | After (µs) | Δ latency |\n`;
md += `|-----------|----------------|---------------|--------------|--------------|------------|----------|\n`;
for (const r of summaryRows) {
  md += `| ${r.name} | ${fmt(r.before_ops)} | ${fmt(r.after_ops)} | ${r.ops_change} | ${r.before_us} | ${r.after_us} | ${r.latency_change} |\n`;
}

const shootoutBefore = beforeMap.get('shootout/isProfane/clean_short');
const shootoutAfter = afterMap.get('shootout/isProfane/clean_short');
const legacyBefore = beforeMap.get('shootout_legacy/isProfane/clean_short');
const legacyAfter = afterMap.get('shootout_legacy/isProfane/clean_short');
const acBefore = beforeMap.get('shootout/isProfane/clean_short');
const acAfter = afterMap.get('shootout/isProfane/clean_short');

md += `\n## Summary\n\n`;
if (shootoutBefore && shootoutAfter) {
  md += `- **Shootout config (clean text)**: ${shootoutBefore.ops_per_sec.toLocaleString()} → ${shootoutAfter.ops_per_sec.toLocaleString()} ops/s (${pctChange(shootoutBefore.ops_per_sec, shootoutAfter.ops_per_sec)})\n`;
}
if (legacyBefore && legacyAfter) {
  md += `- **Legacy regex path (clean text)**: ${legacyBefore.ops_per_sec.toLocaleString()} → ${legacyAfter.ops_per_sec.toLocaleString()} ops/s (${pctChange(legacyBefore.ops_per_sec, legacyAfter.ops_per_sec)})\n`;
}
const tortureB = beforeMap.get('torture_set_60x_isProfane');
const tortureA = afterMap.get('torture_set_60x_isProfane');
if (tortureB && tortureA) {
  md += `- **Torture-set batch (60 texts)**: ${tortureB.avg_us}µs → ${tortureA.avg_us}µs per call (${pctChange(tortureB.avg_us, tortureA.avg_us)} latency)\n`;
}

md += `\n## Full Matrix\n\n`;
md += `| Benchmark | Before ops/s | After ops/s | Δ | Before µs | After µs | Δ |\n`;
md += `|-----------|-------------|------------|---|----------|---------|---|\n`;
for (const r of rows) {
  md += `| ${r.name} | ${fmt(r.before_ops)} | ${fmt(r.after_ops)} | ${r.ops_change} | ${r.before_us} | ${r.after_us} | ${r.latency_change} |\n`;
}

const outPath = join(__dirname, 'optimization-comparison-js.md');
writeFileSync(outPath, md, 'utf8');
console.log(`Written ${outPath}`);
console.log('\nKey results:');
for (const r of summaryRows) {
  console.log(`  ${r.name}: ${r.before_ops} → ${r.after_ops} ops/s (${r.ops_change})`);
}
