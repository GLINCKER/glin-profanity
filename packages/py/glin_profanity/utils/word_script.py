"""Word-script classification and boundary checks for Latin vs CJK dictionary entries."""

from __future__ import annotations

import unicodedata
from typing import Literal

WordScript = Literal["latin", "cjk"]

# Single-grapheme CJK hits require non-CJK neighbors (avoids 性 in 性格).
CJK_MIN_STANDALONE_GRAPHEMES = 2

# Single CJK characters that are unambiguously profane regardless of neighbors.
# Unlike 性/骚/逼/淫/奸/賤/妓/尻/糞/裸 (which have common benign uses such as
# 性格/骚扰/逼近/淫雨/奸细/贫贱/芸妓/お尻/粪便/裸露), these characters effectively
# only occur in profane contexts, so we keep flagging them even when surrounded
# by other CJK characters (e.g. 挨肏, 肏她, 肏屄).
UNAMBIGUOUS_CJK_SINGLE_PROFANITY = frozenset("肏屄屌膣姦姘")


def is_cjk_character(char: str) -> bool:
    """Return True when the code point belongs to a CJK-related script block."""
    if not char:
        return False

    code = ord(char[0])
    return (
        0x4E00 <= code <= 0x9FFF  # CJK Unified Ideographs
        or 0x3400 <= code <= 0x4DBF  # Extension A
        or 0x3040 <= code <= 0x309F  # Hiragana
        or 0x30A0 <= code <= 0x30FF  # Katakana
        or 0x31F0 <= code <= 0x31FF  # Katakana phonetic extensions
        or 0xAC00 <= code <= 0xD7AF  # Hangul syllables
        or 0x1100 <= code <= 0x11FF  # Hangul Jamo
        or 0x3130 <= code <= 0x318F  # Hangul compatibility Jamo
        or 0x3100 <= code <= 0x312F  # Bopomofo
        or 0xFF66 <= code <= 0xFF9F  # Halfwidth katakana
    )


def classify_word_script(word: str) -> WordScript:
    """
    Classify a dictionary entry by its characters (not by configured language).

    ASCII-only entries from Japanese/Chinese lists still use Latin ``\\b`` rules.
    """
    for char in word:
        if is_cjk_character(char):
            return "cjk"
    return "latin"


def is_unicode_word_char(char: str) -> bool:
    """Unicode-aware word character (Python ``\\w`` / JS ``\\b`` with ``u`` flag)."""
    if not char:
        return False
    if char == "_":
        return True
    category = unicodedata.category(char)
    return category[0] in {"L", "N"}


def is_latin_word_boundary_before(text: str, index: int) -> bool:
    """Word boundary at index using Unicode-aware ``\\w`` semantics.

    CJK neighbors are treated as non-word for Latin tokens: CJK has no spaces,
    so a Latin/pinyin token embedded in CJK (e.g. ``jb`` in ``我的jb大``) should
    still be recognized as a standalone token rather than a continuation.
    """
    left_is_word = (
        index > 0
        and is_unicode_word_char(text[index - 1])
        and not is_cjk_character(text[index - 1])
    )
    right_is_word = (
        index < len(text)
        and is_unicode_word_char(text[index])
        and not is_cjk_character(text[index])
    )
    return left_is_word != right_is_word


def has_latin_word_boundary(text: str, start: int, end: int) -> bool:
    return is_latin_word_boundary_before(text, start) and is_latin_word_boundary_before(
        text, end
    )


def _grapheme_count_in_span(text: str, start: int, end: int) -> int:
    count = 0
    index = 0
    length = len(text)
    while index < length:
        seg_start = index
        index += 1
        while index < length and unicodedata.category(text[index]) in {"Mn", "Me", "Mc"}:
            index += 1
        if index > start and seg_start < end:
            count += 1
        if seg_start >= end:
            break
    return count


def has_cjk_word_boundary(text: str, start: int, end: int) -> bool:
    """
    CJK boundary: multi-grapheme substring matches anywhere; single-grapheme
    matches require non-CJK neighbors (e.g. x乳x, hello操world).
    """
    if _grapheme_count_in_span(text, start, end) >= CJK_MIN_STANDALONE_GRAPHEMES:
        return True

    if text[start:end] in UNAMBIGUOUS_CJK_SINGLE_PROFANITY:
        return True

    before = text[start - 1] if start > 0 else ""
    after = text[end] if end < len(text) else ""
    if before and is_cjk_character(before):
        return False
    if after and is_cjk_character(after):
        return False
    return True


def match_has_word_boundary(
    text: str,
    start: int,
    end: int,
    script: WordScript,
    word_boundaries_enabled: bool,
) -> bool:
    """Return whether a match at [start, end) satisfies boundary rules for its script."""
    if not word_boundaries_enabled:
        return True
    if script == "cjk":
        return has_cjk_word_boundary(text, start, end)
    return has_latin_word_boundary(text, start, end)
