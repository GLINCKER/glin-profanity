"""Word-script classification and boundary checks for Latin vs CJK dictionary entries."""

from __future__ import annotations

import re
from typing import Literal

WordScript = Literal["latin", "cjk"]

# Mirrors JavaScript ``\\b`` word character class without the ``u`` flag.
_LATIN_WORD_CHAR = re.compile(r"[A-Za-z0-9_]")


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


def is_latin_word_boundary_before(text: str, index: int) -> bool:
    """JavaScript ``\\b`` boundary at index (between word and non-word ASCII chars)."""
    left_is_word = index > 0 and bool(_LATIN_WORD_CHAR.match(text[index - 1]))
    right_is_word = index < len(text) and bool(_LATIN_WORD_CHAR.match(text[index]))
    return left_is_word != right_is_word


def has_latin_word_boundary(text: str, start: int, end: int) -> bool:
    return is_latin_word_boundary_before(text, start) and is_latin_word_boundary_before(
        text, end
    )


def has_cjk_word_boundary(_text: str, _start: int, _end: int) -> bool:
    """Substring match anywhere, including ASCII-adjacent or digit-wrapped CJK."""
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
