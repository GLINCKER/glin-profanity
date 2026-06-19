# glin-profanity Competitive Shootout

Head-to-head accuracy and performance comparison of the most popular Node.js profanity-filtering libraries against a 60-case torture-set.

## Libraries compared

| Library | Version | Approach |
|---------|---------|----------|
| **glin-profanity** | 3.2.1 | Regex + leetspeak + unicode normalization |
| obscenity | 0.4.x | Transformer-chain RegExp matcher |
| bad-words | 3.0.x | Word-boundary regex |
| leo-profanity | 1.6.x | Whitespace-split set lookup |
| @2toad/profanity | 2.2.x | Dynamic regex alternation |

## How to run

```bash
cd benchmarks/shootout
npm install
npm run build-glin      # builds packages/js/dist/
node harness.mjs        # runs accuracy + perf, writes results.md
```

Or in one step:

```bash
npm run run
```

## Torture-set categories

The 60 test cases in `torture-set.json` cover:

| Category | Count | Description |
|----------|-------|-------------|
| clean | 5 | Benign sentences |
| false-positive-trap | 10 | `assassinate`, `scunthorpe`, `shitake`, etc. |
| basic | 5 | Unobfuscated profanity |
| leetspeak | 7 | `a55h0le`, `f@ck`, `b1tch`, `shi7e`, `sh!t`, etc. |
| homoglyph | 5 | `fúck`, `fսck`, `ƒuck`, `fu©k`, `аsshole` |
| zero-width | 3 | Zero-width space/joiner injected mid-word |
| word-break | 6 | `.`, `_`, `-`, space separators |
| html-injection | 3 | `a<br>ss`, `f<b>u</b>ck`, `sh&#105;t` |
| in-sentence | 4 | Profanity embedded in natural sentences |
| in-sentence-leetspeak | 3 | Obfuscated profanity in sentences |
| uppercase / mixed-case | 4 | `FUCK`, `FuCk`, etc. |
| repeated-chars | 2 | `fffffffuck`, `fuuuuuck` |
| extra-spaces | 1 | `f u  c  k` |
| prompt-injection | 2 | Should NOT be flagged as profanity |

## Latest results

See [results.md](./results.md) for the full auto-generated table.

### Accuracy summary (snapshot)

| Library | Precision | Recall | F1 | FPR |
|---------|-----------|--------|----|-----|
| glin-profanity | 100.0% | 100.0% | 100.0% | 0.0% |
| obscenity | 96.7% | 67.4% | 79.5% | 5.9% |
| bad-words | 100.0% | 37.2% | 54.2% | 0.0% |
| leo-profanity | 100.0% | 20.9% | 34.6% | 0.0% |
| @2toad/profanity | 100.0% | 39.5% | 56.7% | 0.0% |

### Key findings

- **glin-profanity achieves 100% F1** on the torture-set with **zero false positives**, including word-break, HTML-injection, and masked in-sentence evasion categories
- `obscenity` is the closest competitor on recall but fires a false positive on "Penistone" (a real UK town name)
- `leo-profanity` and `bad-words` fail on almost all obfuscation categories — any user with basic evasion awareness defeats them
- `@2toad/profanity` handles `b1tch` and `a$$hole` but misses homoglyphs, word-break separators, and repeated-char variants
- All libraries currently miss some obfuscation categories — glin-profanity now covers word-break, HTML-injection, and masked in-sentence cases via evasion normalization

### Performance snapshot

| Library | ops/sec | Notes |
|---------|---------|-------|
| @2toad/profanity | ~600,000 | Fastest; regex alternation with no text normalization |
| leo-profanity | ~280,000 | Fast; simple set lookup, no normalization |
| obscenity | ~2,900 | Transformer chain adds overhead but enables better detection |
| glin-profanity | ~2,500 | Normalization pipeline runs per call; cache (`cacheResults: true`) closes the gap for repeated inputs |
| bad-words | ~160 | Slowest despite simple approach |

> Perf measured with [tinybench](https://github.com/tinylibs/tinybench) on Node 22, 20 inputs per iteration, Apple Silicon M-series.
> Enable `cacheResults: true` in glin-profanity for applications with repeated inputs — the internal cache removes normalization overhead after the first call.

## Files

```
benchmarks/shootout/
  harness.mjs        — main runner (accuracy + perf + results writer)
  torture-set.json   — 60 annotated test cases
  results.md         — auto-generated output table (committed snapshot)
  package.json       — isolated dependencies (tinybench + competitors)
  README.md          — this file
```
