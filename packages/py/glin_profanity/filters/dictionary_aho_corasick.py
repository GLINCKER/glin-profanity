"""Multi-pattern dictionary matcher backed by the Aho-Corasick algorithm."""

from __future__ import annotations

import unicodedata
from dataclasses import dataclass
from typing import Iterable

import ahocorasick

from glin_profanity.utils.word_script import (
    WordScript,
    classify_word_script,
    match_has_word_boundary,
)


@dataclass(frozen=True)
class DictionaryMatch:
    dict_word: str
    start: int
    end: int
    matched_text: str


@dataclass(frozen=True)
class DictionarySearchOptions:
    word_boundaries: bool
    case_sensitive: bool
    ignore_words: set[str]
    word_scripts: dict[str, WordScript]


def _count_graphemes(text: str) -> int:
    return sum(1 for _ in _segment_graphemes(text))


def _segment_graphemes(text: str) -> Iterable[tuple[int, str]]:
    """Yield (string_index, segment) for each extended grapheme cluster."""
    if not text:
        return

    index = 0
    length = len(text)
    while index < length:
        start = index
        index += 1
        while index < length and _is_grapheme_extend(text, index):
            index += 1
        yield start, text[start:index]


def _is_grapheme_extend(text: str, index: int) -> bool:
    char = text[index]
    category = unicodedata.category(char)
    if category in {"Mn", "Me", "Mc"}:
        return True
    if char == "\u200d":  # ZWJ
        return True
    return category == "Cf" and char in {
        "\u200c",  # ZWNJ
        "\u200d",  # ZWJ
        "\ufe0e",
        "\ufe0f",
    }


def _grapheme_start_to_string_index(text: str, grapheme_index: int) -> int:
    for i, (start, _segment) in enumerate(_segment_graphemes(text)):
        if i == grapheme_index:
            return start
    return len(text)


def _grapheme_end_to_exclusive_string_index(
    text: str, end_grapheme_index_inclusive: int
) -> int:
    for i, (start, segment) in enumerate(_segment_graphemes(text)):
        if i == end_grapheme_index_inclusive:
            return start + len(segment)
    return len(text)


def _code_point_end_to_grapheme_end(text: str, end_index_inclusive: int) -> int:
    grapheme_end = -1
    for i, (start, segment) in enumerate(_segment_graphemes(text)):
        segment_end = start + len(segment) - 1
        if start <= end_index_inclusive <= segment_end:
            return i
        if end_index_inclusive < start:
            break
        grapheme_end = i
    return max(grapheme_end, 0)


class DictionaryAhoCorasick:
    """Exact dictionary matching when word boundaries are enabled (no fuzzy path)."""

    def __init__(self, words: list[str]) -> None:
        self._automaton = ahocorasick.Automaton()
        for word in words:
            if word:
                self._automaton.add_word(word, word)
        self._automaton.make_automaton()
        self._word_grapheme_lengths = {
            word: _count_graphemes(word) for word in words if word
        }

    def has_any_match(self, text: str, options: DictionarySearchOptions) -> bool:
        haystack = text if options.case_sensitive else text.lower()

        for end_index_inclusive, dict_word in self._automaton.iter(haystack):
            if dict_word.lower() in options.ignore_words:
                continue

            word_len = self._word_grapheme_lengths.get(
                dict_word, _count_graphemes(dict_word)
            )
            end_grapheme = _code_point_end_to_grapheme_end(haystack, end_index_inclusive)
            start_grapheme = end_grapheme - word_len + 1
            start = _grapheme_start_to_string_index(text, start_grapheme)
            end = _grapheme_end_to_exclusive_string_index(text, end_grapheme)
            script = options.word_scripts.get(dict_word.lower()) or classify_word_script(
                dict_word
            )

            if match_has_word_boundary(
                text, start, end, script, options.word_boundaries
            ):
                return True

        return False

    def find_matches(
        self, text: str, options: DictionarySearchOptions
    ) -> list[DictionaryMatch]:
        haystack = text if options.case_sensitive else text.lower()
        results: list[DictionaryMatch] = []
        seen: set[str] = set()

        for end_index_inclusive, dict_word in self._automaton.iter(haystack):
            if dict_word.lower() in options.ignore_words:
                continue

            word_len = self._word_grapheme_lengths.get(dict_word, _count_graphemes(dict_word))
            end_grapheme = _code_point_end_to_grapheme_end(haystack, end_index_inclusive)
            start_grapheme = end_grapheme - word_len + 1
            start = _grapheme_start_to_string_index(text, start_grapheme)
            end = _grapheme_end_to_exclusive_string_index(text, end_grapheme)
            script = options.word_scripts.get(dict_word.lower()) or classify_word_script(
                dict_word
            )

            if not match_has_word_boundary(
                text, start, end, script, options.word_boundaries
            ):
                continue

            dedupe_key = f"{dict_word}:{start}:{end}"
            if dedupe_key in seen:
                continue
            seen.add(dedupe_key)

            results.append(
                DictionaryMatch(
                    dict_word=dict_word,
                    start=start,
                    end=end,
                    matched_text=text[start:end],
                )
            )

        return results
