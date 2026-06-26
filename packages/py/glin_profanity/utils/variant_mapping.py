"""Map span positions from normalized variant text back to the original."""

from __future__ import annotations

import re
from dataclasses import dataclass

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

_SKIPPABLE_ORIGINAL_CHARS = {"*", ".", "_", "-", " "}


@dataclass(frozen=True)
class OriginalSpan:
    start: int
    end: int
    matched_text: str


def _chars_equal(left: str, right: str) -> bool:
    return left == right or left.lower() == right.lower()


def _chars_align(original_char: str, variant_char: str) -> bool:
    if _chars_equal(original_char, variant_char):
        return True

    mapped = _LEET_TO_ASCII.get(original_char) or _LEET_TO_ASCII.get(
        original_char.lower()
    )
    if mapped is not None and _chars_equal(mapped, variant_char):
        return True

    homoglyph = homoglyph_to_ascii(original_char)
    if homoglyph != original_char and _chars_equal(homoglyph, variant_char):
        return True

    return False


def _is_skippable_original_char(char: str) -> bool:
    return char in _SKIPPABLE_ORIGINAL_CHARS


def _fallback_span(
    original: str, variant: str, variant_start: int, variant_end: int
) -> OriginalSpan:
    needle = variant[variant_start:variant_end]
    if not needle:
        return OriginalSpan(start=0, end=0, matched_text="")

    idx = original.lower().find(needle.lower())
    if idx >= 0:
        return OriginalSpan(
            start=idx,
            end=idx + len(needle),
            matched_text=original[idx : idx + len(needle)],
        )

    start = min(variant_start, len(original))
    end = min(variant_end, len(original))
    return OriginalSpan(start=start, end=end, matched_text=original[start:end])


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
        return OriginalSpan(
            start=variant_start,
            end=variant_end,
            matched_text=original[variant_start:variant_end],
        )

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

        if _chars_align(original_char, variant_char):
            variant_index += 1
            original_index += 1
            continue

        if _is_skippable_original_char(original_char):
            original_index += 1
            continue

        original_index += 1

    if orig_start == -1:
        orig_start = 0
    if orig_end == -1:
        orig_end = len(original)

    matched_text = original[orig_start:orig_end]
    if not matched_text or orig_start >= orig_end:
        return _fallback_span(original, variant, variant_start, variant_end)

    return OriginalSpan(
        start=orig_start,
        end=orig_end,
        matched_text=matched_text,
    )


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
