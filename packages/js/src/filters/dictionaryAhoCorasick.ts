import AhoCorasick from 'modern-ahocorasick';
import {
  classifyWordScript,
  matchHasWordBoundary,
  type WordScript,
} from '../utils/wordScript';

/** Grapheme segmenter — runtime API exists in Node 18+ / modern browsers. */
type GraphemeSegment = { segment: string; index: number };
type GraphemeSegmenterInstance = { segment(input: string): Iterable<GraphemeSegment> };
type GraphemeSegmenterConstructor = new (
  locales?: string | string[],
  options?: { granularity: 'grapheme' },
) => GraphemeSegmenterInstance;

const GraphemeSegmenter = (
  Intl as unknown as { Segmenter?: GraphemeSegmenterConstructor }
).Segmenter;

if (typeof GraphemeSegmenter !== 'function') {
  throw new Error(
    'glin-profanity requires Intl.Segmenter (Node 18+ or a modern browser) for ' +
      'Aho-Corasick dictionary matching. Upgrade your runtime or polyfill Intl.Segmenter.',
  );
}

export interface DictionaryMatch {
  dictWord: string;
  start: number;
  end: number;
  matchedText: string;
}

export interface DictionarySearchOptions {
  wordBoundaries: boolean;
  caseSensitive: boolean;
  ignoreWords: Set<string>;
  wordScripts: Map<string, WordScript>;
}

const graphemeSegmenter = new GraphemeSegmenter(undefined, { granularity: 'grapheme' });

function countGraphemes(text: string): number {
  let count = 0;
  for (const _ of graphemeSegmenter.segment(text)) {
    count++;
  }
  return count;
}

function graphemeStartToStringIndex(text: string, graphemeIndex: number): number {
  let i = 0;
  for (const seg of graphemeSegmenter.segment(text)) {
    if (i === graphemeIndex) {
      return seg.index;
    }
    i++;
  }
  return text.length;
}

function graphemeEndToExclusiveStringIndex(
  text: string,
  endGraphemeIndexInclusive: number,
): number {
  let i = 0;
  for (const seg of graphemeSegmenter.segment(text)) {
    if (i === endGraphemeIndexInclusive) {
      return seg.index + seg.segment.length;
    }
    i++;
  }
  return text.length;
}

/**
 * Multi-pattern dictionary matcher backed by the Aho-Corasick algorithm.
 * Used for exact matching when word boundaries are enabled (no fuzzy path).
 */
export class DictionaryAhoCorasick {
  private readonly ac: AhoCorasick;
  private readonly wordGraphemeLengths: Map<string, number>;

  constructor(words: string[]) {
    // Drop empty entries: an empty keyword would "match" at every position.
    const nonEmpty = words.filter((word) => word.length > 0);
    this.ac = new AhoCorasick(nonEmpty);
    this.wordGraphemeLengths = new Map(
      nonEmpty.map((word) => [word, countGraphemes(word)]),
    );
  }

  hasAnyMatch(text: string, options: DictionarySearchOptions): boolean {
    const haystack = options.caseSensitive ? text : text.toLowerCase();

    for (const [endGraphemeIdx, dictWords] of this.ac.search(haystack)) {
      for (const dictWord of dictWords) {
        if (options.ignoreWords.has(dictWord.toLowerCase())) {
          continue;
        }

        const wordLen = this.wordGraphemeLengths.get(dictWord) ?? countGraphemes(dictWord);
        const startGrapheme = endGraphemeIdx - wordLen + 1;
        const start = graphemeStartToStringIndex(text, startGrapheme);
        const end = graphemeEndToExclusiveStringIndex(text, endGraphemeIdx);
        const script =
          options.wordScripts.get(dictWord.toLowerCase()) ??
          classifyWordScript(dictWord);

        if (matchHasWordBoundary(text, start, end, script, options.wordBoundaries)) {
          return true;
        }
      }
    }

    return false;
  }

  findMatches(text: string, options: DictionarySearchOptions): DictionaryMatch[] {
    const haystack = options.caseSensitive ? text : text.toLowerCase();
    // modern-ahocorasick segments by grapheme and returns grapheme indices
    const hits = this.ac.search(haystack);
    const results: DictionaryMatch[] = [];
    const seen = new Set<string>();

    for (const [endGraphemeIdx, dictWords] of hits) {
      for (const dictWord of dictWords) {
        if (options.ignoreWords.has(dictWord.toLowerCase())) {
          continue;
        }

        const wordLen = this.wordGraphemeLengths.get(dictWord) ?? countGraphemes(dictWord);
        const startGrapheme = endGraphemeIdx - wordLen + 1;
        const start = graphemeStartToStringIndex(text, startGrapheme);
        const end = graphemeEndToExclusiveStringIndex(text, endGraphemeIdx);
        const script =
          options.wordScripts.get(dictWord.toLowerCase()) ??
          classifyWordScript(dictWord);

        if (
          !matchHasWordBoundary(text, start, end, script, options.wordBoundaries)
        ) {
          continue;
        }

        const dedupeKey = `${dictWord}:${start}:${end}`;
        if (seen.has(dedupeKey)) {
          continue;
        }
        seen.add(dedupeKey);

        results.push({
          dictWord,
          start,
          end,
          matchedText: text.slice(start, end),
        });
      }
    }

    return results;
  }
}
