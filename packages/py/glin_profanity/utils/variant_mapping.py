"""Map span positions from normalized variant text back to the original."""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass

from glin_profanity.utils.leetspeak import AGGRESSIVE_SUBSTITUTIONS, MODERATE_SUBSTITUTIONS
from glin_profanity.utils.unicode import homoglyph_to_ascii

_LEET_TO_ASCII = {
    "@": "a",
    "$": "s",
    "!": "i",
    "1": "i",
    "0": "o",
    "3": "e",
    "4": "a",
    "5": "s",
    "7": "t",
    "8": "b",
    "9": "g",
}

_LEET_SUBSTITUTIONS: dict[str, str] = {
    **MODERATE_SUBSTITUTIONS,
    **AGGRESSIVE_SUBSTITUTIONS,
}

_SKIPPABLE_ORIGINAL_CHARS = {"*", ".", "_", "-", " "}

# Keep leetspeak/masking symbols when they belong to the obfuscated token.
_EDGE_MASKING_CHARS = frozenset("@$!#*")


@dataclass(frozen=True)
class OriginalSpan:
    start: int
    end: int
    matched_text: str


def _normalize_char_for_align(char: str) -> str:
    mapped = homoglyph_to_ascii(char)
    decomposed = unicodedata.normalize("NFKD", mapped)
    base = "".join(c for c in decomposed if unicodedata.combining(c) == 0)
    return base.lower()


def _chars_equal(left: str, right: str) -> bool:
    return left == right or left.lower() == right.lower()


def _chars_align(original_char: str, variant_char: str) -> bool:
    if _chars_equal(original_char, variant_char):
        return True

    original_norm = _normalize_char_for_align(original_char)
    variant_norm = _normalize_char_for_align(variant_char)
    if original_norm and original_norm == variant_norm:
        return True

    mapped = _LEET_TO_ASCII.get(original_char) or _LEET_TO_ASCII.get(
        original_char.lower()
    )
    if mapped is not None and mapped.lower() == variant_norm:
        return True

    substituted = _LEET_SUBSTITUTIONS.get(original_char) or _LEET_SUBSTITUTIONS.get(
        original_char.lower()
    )
    if substituted is not None and substituted.lower() == variant_norm:
        return True

    homoglyph = homoglyph_to_ascii(original_char)
    if homoglyph != original_char and _normalize_char_for_align(homoglyph) == variant_norm:
        return True

    return False


def _is_skippable_original_char(char: str) -> bool:
    return char in _SKIPPABLE_ORIGINAL_CHARS


def _is_combining_mark(char: str) -> bool:
    return bool(char) and unicodedata.combining(char) != 0


def _should_trim_edge_punctuation(char: str) -> bool:
    if char in _EDGE_MASKING_CHARS:
        return False
    if char in {".", "_", "-"}:
        return True
    category = unicodedata.category(char)
    return category.startswith("P") or category.startswith("Z")


def trim_profane_span_edges(text: str, start: int, end: int) -> OriginalSpan:
    """Drop leading/trailing whitespace and outer punctuation from a profane span."""
    if start >= end:
        return OriginalSpan(start=start, end=end, matched_text="")

    while start < end and text[start].isspace():
        start += 1
    while start < end and text[end - 1].isspace():
        end -= 1

    while start < end and text[start] in {".", "_", "-"}:
        start += 1
    while start < end and text[end - 1] in {".", "_", "-"}:
        end -= 1

    while start < end and _should_trim_edge_punctuation(text[start]):
        start += 1
    while start < end and _should_trim_edge_punctuation(text[end - 1]):
        end -= 1

    return OriginalSpan(start=start, end=end, matched_text=text[start:end])


def _finalize_span(original: str, start: int, end: int) -> OriginalSpan:
    return trim_profane_span_edges(original, start, end)


def _fallback_span(
    original: str, variant: str, variant_start: int, variant_end: int
) -> OriginalSpan:
    needle = variant[variant_start:variant_end]
    if not needle:
        return OriginalSpan(start=0, end=0, matched_text="")

    idx = original.lower().find(needle.lower())
    if idx >= 0:
        return _finalize_span(original, idx, idx + len(needle))

    start = min(variant_start, len(original))
    end = min(variant_end, len(original))
    return _finalize_span(original, start, end)


def map_variant_span_to_original(
    original: str,
    variant: str,
    variant_start: int,
    variant_end: int,
) -> OriginalSpan:
    """Locate the original span for ``variant[variant_start:variant_end]``."""
    if variant_start >= variant_end:
        return OriginalSpan(start=0, end=0, matched_text="")

    if original == variant:
        return _finalize_span(original, variant_start, variant_end)

    original_index = 0
    variant_index = 0
    orig_start = -1
    orig_end = -1

    while variant_index < len(variant) and original_index <= len(original):
        if variant_index == variant_start and orig_start == -1:
            orig_start = original_index
        if variant_index == variant_end:
            orig_end = original_index
            break

        if original_index >= len(original):
            variant_index += 1
            continue

        variant_char = variant[variant_index]
        original_char = original[original_index]

        if _is_combining_mark(original_char):
            original_index += 1
            continue

        if _chars_align(original_char, variant_char):
            variant_index += 1
            original_index += 1
            continue

        if _is_skippable_original_char(original_char):
            original_index += 1
            continue

        original_index += 1

    if orig_end == -1 and variant_index >= variant_end:
        orig_end = original_index

    if orig_start == -1 or orig_end == -1:
        return _fallback_span(original, variant, variant_start, variant_end)

    if orig_start >= orig_end:
        return _fallback_span(original, variant, variant_start, variant_end)

    matched_text = original[orig_start:orig_end]
    if not matched_text:
        return _fallback_span(original, variant, variant_start, variant_end)

    return _finalize_span(original, orig_start, orig_end)


ProfaneSpan = tuple[str, int, int]


def dedupe_profane_spans_by_overlap(spans: list[ProfaneSpan]) -> list[ProfaneSpan]:
    """Keep longest original-text span when starts or ranges overlap."""
    if not spans:
        return []

    ordered = sorted(spans, key=lambda item: (item[1], -(item[2] - item[1])))
    kept: list[ProfaneSpan] = []

    for candidate in ordered:
        word, start, end = candidate
        length = end - start

        if any(
            start >= kept_start
            and end <= kept_end
            and (kept_end - kept_start) > length
            for _, kept_start, kept_end in kept
        ):
            continue

        kept = [
            item
            for item in kept
            if not (
                item[1] >= start
                and item[2] <= end
                and length > (item[2] - item[1])
            )
        ]
        kept.append((word, start, end))

    return kept


_NESTED_WORD_BOUNDARY = re.compile(r"\w")


def is_nested_profane_span(shorter: str, longer: str) -> bool:
    """True when shorter is a word-bounded substring of longer."""
    if len(longer) <= len(shorter):
        return False

    search_from = 0
    while search_from <= len(longer) - len(shorter):
        idx = longer.find(shorter, search_from)
        if idx == -1:
            return False

        before_ok = idx == 0 or not _NESTED_WORD_BOUNDARY.match(longer[idx - 1])
        after_idx = idx + len(shorter)
        after_ok = after_idx == len(longer) or not _NESTED_WORD_BOUNDARY.match(
            longer[after_idx]
        )

        if before_ok and after_ok:
            return True

        search_from = idx + 1

    return False
