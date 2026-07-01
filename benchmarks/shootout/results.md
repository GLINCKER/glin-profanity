# Benchmark Results — glin-profanity Shootout

_Generated: 2026-06-19  |  Torture-set: 60 cases  |  Node v25.3.0_

## Accuracy

| Library | Precision | Recall | F1 | False-Positive Rate | TP | FP | FN | TN |
|---------|-----------|--------|----|---------------------|----|----|----|----|
| glin-profanity | 100.0% | 100.0% | 100.0% | 0.0% | 43 | 0 | 0 | 17 |
| obscenity | 96.7% | 67.4% | 79.5% | 5.9% | 29 | 1 | 14 | 16 |
| bad-words | 100.0% | 37.2% | 54.2% | 0.0% | 16 | 0 | 27 | 17 |
| leo-profanity | 100.0% | 20.9% | 34.6% | 0.0% | 9 | 0 | 34 | 17 |
| @2toad/profanity | 100.0% | 39.5% | 56.7% | 0.0% | 17 | 0 | 26 | 17 |

## Recall by Category

| Library | clean | false-positive-trap | basic | leetspeak | homoglyph | zero-width | word-break | html-injection | in-sentence | in-sentence-leetspeak | uppercase | mixed-case | extra-spaces | repeated-chars | prompt-injection-not-profanity |
|---------|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| glin-profanity | OK | OK | 5/5 | 7/7 | 5/5 | 3/3 | 6/6 | 3/3 | 4/4 | 3/3 | 2/2 | 2/2 | 1/1 | 2/2 | OK |
| obscenity | OK | 1 FP | 5/5 | 7/7 | 5/5 | 1/3 | 0/6 | 0/3 | 2/4 | 3/3 | 2/2 | 2/2 | 0/1 | 2/2 | OK |
| bad-words | OK | OK | 5/5 | 2/7 | 0/5 | 1/3 | 2/6 | 0/3 | 1/4 | 1/3 | 2/2 | 2/2 | 0/1 | 0/2 | OK |
| leo-profanity | OK | OK | 5/5 | 0/7 | 0/5 | 0/3 | 0/6 | 0/3 | 0/4 | 0/3 | 2/2 | 2/2 | 0/1 | 0/2 | OK |
| @2toad/profanity | OK | OK | 5/5 | 3/7 | 0/5 | 1/3 | 2/6 | 0/3 | 1/4 | 1/3 | 2/2 | 2/2 | 0/1 | 0/2 | OK |

## Performance (ops/sec, 20 inputs per iteration)

| Library | ops/sec | avg latency |
|---------|---------|-------------|
| glin-profanity | 2,203 | 563.4 µs |
| obscenity | 2,924 | 348.1 µs |
| bad-words | 162 | 6226.6 µs |
| leo-profanity | 274,328 | 3.7 µs |
| @2toad/profanity 🏆 | 608,350 | 1.7 µs |

## Bundle Size (unminified JS dist)

| Library | Size |
|---------|------|
| glin-profanity | 129.2 KB |
| obscenity | 1.8 KB |
| bad-words | 2.8 KB |
| leo-profanity | 12.5 KB |
| @2toad/profanity | 5.2 KB |

## Notes

- **glin-profanity** configured with `detectLeetspeak: true, leetspeakLevel: 'aggressive', normalizeUnicode: true`
- All competitors run with default settings
- Torture-set covers: clean text, false-positive traps, basic profanity, leetspeak, homoglyphs, zero-width chars, word-break separators, HTML injection, uppercase, mixed-case, repeated chars
- Performance measured with [tinybench](https://github.com/tinylibs/tinybench), 20 inputs per iteration, 500ms warmup
- Bundle sizes are unminified source files; minified + gzipped sizes will be smaller
