"""
Unicode normalization utilities for profanity detection.

Handles homoglyphs, full-width characters, diacritics, and other Unicode tricks.
"""

import re
import unicodedata
from typing import TypedDict

# Homoglyph mapping: visually similar Unicode characters to ASCII equivalents
HOMOGLYPHS: dict[str, str] = {
    # Cyrillic homoglyphs (look like Latin)
    "а": "a",  # Cyrillic small a
    "А": "A",  # Cyrillic capital A
    "е": "e",  # Cyrillic small e
    "Е": "E",  # Cyrillic capital E
    "о": "o",  # Cyrillic small o
    "О": "O",  # Cyrillic capital O
    "р": "p",  # Cyrillic small er
    "Р": "P",  # Cyrillic capital Er
    "с": "c",  # Cyrillic small es
    "С": "C",  # Cyrillic capital Es
    "у": "y",  # Cyrillic small u
    "У": "Y",  # Cyrillic capital U
    "х": "x",  # Cyrillic small ha
    "Х": "X",  # Cyrillic capital Ha
    "і": "i",  # Cyrillic small i (Ukrainian)
    "І": "I",  # Cyrillic capital I (Ukrainian)
    "ј": "j",  # Cyrillic small je
    "Ј": "J",  # Cyrillic capital Je
    "ѕ": "s",  # Cyrillic small dze
    "Ѕ": "S",  # Cyrillic capital Dze
    # Greek homoglyphs
    "α": "a",  # Greek small alpha
    "Α": "A",  # Greek capital Alpha
    "β": "b",  # Greek small beta
    "Β": "B",  # Greek capital Beta
    "ε": "e",  # Greek small epsilon
    "Ε": "E",  # Greek capital Epsilon
    "η": "n",  # Greek small eta
    "Η": "H",  # Greek capital Eta
    "ι": "i",  # Greek small iota
    "Ι": "I",  # Greek capital Iota
    "κ": "k",  # Greek small kappa
    "Κ": "K",  # Greek capital Kappa
    "ν": "v",  # Greek small nu (looks like v)
    "Ν": "N",  # Greek capital Nu
    "ο": "o",  # Greek small omicron
    "Ο": "O",  # Greek capital Omicron
    "ρ": "p",  # Greek small rho
    "Ρ": "P",  # Greek capital Rho
    "τ": "t",  # Greek small tau
    "Τ": "T",  # Greek capital Tau
    "υ": "u",  # Greek small upsilon
    "Υ": "Y",  # Greek capital Upsilon
    "χ": "x",  # Greek small chi
    "Χ": "X",  # Greek capital Chi
    # Common lookalikes
    "ł": "l",
    "Ł": "L",
    "ø": "o",
    "Ø": "O",
    "đ": "d",
    "Đ": "D",
    "ħ": "h",
    "Ħ": "H",
    "ı": "i",
    "İ": "I",
    "ŋ": "n",
    "Ŋ": "N",
    "œ": "oe",
    "Œ": "OE",
    "ſ": "s",
    "ŧ": "t",
    "Ŧ": "T",
}

# Zero-width and invisible characters to remove
ZERO_WIDTH_CHARS = [
    "\u200B",  # Zero-width space
    "\u200C",  # Zero-width non-joiner
    "\u200D",  # Zero-width joiner
    "\u200E",  # Left-to-right mark
    "\u200F",  # Right-to-left mark
    "\u2060",  # Word joiner
    "\u2061",  # Function application
    "\u2062",  # Invisible times
    "\u2063",  # Invisible separator
    "\u2064",  # Invisible plus
    "\uFEFF",  # Byte order mark / zero-width no-break space
    "\u00AD",  # Soft hyphen
    "\u034F",  # Combining grapheme joiner
    "\u061C",  # Arabic letter mark
    "\u180E",  # Mongolian vowel separator
]


def normalize_unicode(
    text: str,
    nfkd: bool = True,
    homoglyphs: bool = True,
    full_width: bool = True,
    remove_diacritics: bool = True,
    remove_zero_width: bool = True,
) -> str:
    """
    Normalize Unicode text for consistent profanity detection.

    Args:
        text: The input text containing potential Unicode obfuscation
        nfkd: Apply NFKD normalization to decompose characters
        homoglyphs: Convert homoglyphs (lookalike characters) to ASCII
        full_width: Convert full-width characters to half-width
        remove_diacritics: Remove diacritical marks (accents, umlauts, etc.)
        remove_zero_width: Remove zero-width characters

    Returns:
        The normalized text

    Examples:
        >>> normalize_unicode("fück")
        'fuck'
        >>> normalize_unicode("fυck")  # Greek upsilon
        'fuck'
        >>> normalize_unicode("ｆｕｃｋ")  # Full-width
        'fuck'
    """
    normalized = text

    # Step 1: Remove zero-width characters
    if remove_zero_width:
        normalized = remove_zero_width_characters(normalized)

    # Step 2: Convert full-width to half-width
    if full_width:
        normalized = convert_full_width(normalized)

    # Step 3: Apply homoglyph conversion
    if homoglyphs:
        normalized = convert_homoglyphs(normalized)

    # Step 4: Apply NFKD normalization and remove diacritics
    if nfkd or remove_diacritics:
        normalized = normalize_nfkd(normalized, remove_diacritics)

    return normalized


def remove_zero_width_characters(text: str) -> str:
    """
    Remove zero-width and invisible characters from text.

    Args:
        text: The input text

    Returns:
        Text with zero-width characters removed
    """
    pattern = "[" + "".join(re.escape(c) for c in ZERO_WIDTH_CHARS) + "]"
    return re.sub(pattern, "", text)


def convert_full_width(text: str) -> str:
    """
    Convert full-width ASCII characters to half-width.

    Full-width characters (U+FF01 to U+FF5E) are used in CJK text
    but can also be used to evade filters.

    Args:
        text: The input text

    Returns:
        Text with full-width characters converted

    Examples:
        >>> convert_full_width("ＡＢＣ")
        'ABC'
        >>> convert_full_width("ｆｕｃｋ")
        'fuck'
    """
    result = []
    for char in text:
        code = ord(char)
        # Full-width ASCII starts at U+FF01 (!) and maps to U+0021
        if 0xFF01 <= code <= 0xFF5E:
            result.append(chr(code - 0xFEE0))
        else:
            result.append(char)
    return "".join(result)


def convert_homoglyphs(text: str) -> str:
    """
    Convert homoglyph characters to their ASCII equivalents.

    Args:
        text: The input text

    Returns:
        Text with homoglyphs converted
    """
    result = []
    for char in text:
        result.append(HOMOGLYPHS.get(char, char))
    return "".join(result)


def normalize_nfkd(text: str, remove_diacritics: bool = True) -> str:
    """
    Apply NFKD normalization and optionally remove diacritical marks.

    NFKD decomposes characters into base characters and combining marks.

    Args:
        text: The input text
        remove_diacritics: Whether to remove diacritical marks

    Returns:
        Normalized text

    Examples:
        >>> normalize_nfkd("fück")
        'fuck'
        >>> normalize_nfkd("café")
        'cafe'
    """
    # NFKD = Normalization Form Compatibility Decomposition
    normalized = unicodedata.normalize("NFKD", text)

    if remove_diacritics:
        # Remove combining diacritical marks (category 'Mn' = Mark, Nonspacing)
        normalized = "".join(c for c in normalized if unicodedata.category(c) != "Mn")

    return normalized


def contains_unicode_obfuscation(text: str) -> bool:
    """
    Detect if text contains potential Unicode obfuscation.

    Args:
        text: The input text to analyze

    Returns:
        True if Unicode obfuscation patterns are detected

    Examples:
        >>> contains_unicode_obfuscation("hello")
        False
        >>> contains_unicode_obfuscation("fυck")  # Greek letter
        True
        >>> contains_unicode_obfuscation("ｆｕｃｋ")  # Full-width
        True
    """
    # Check for zero-width characters
    for char in ZERO_WIDTH_CHARS:
        if char in text:
            return True

    # Check for full-width characters
    for char in text:
        code = ord(char)
        if 0xFF01 <= code <= 0xFF5E:
            return True

    # Check for homoglyphs
    for char in text:
        if char in HOMOGLYPHS:
            return True

    # Check for combining characters
    if re.search(r"[\u0300-\u036f]", text):
        return True

    # Check if NFKD normalization would change the text
    if text != unicodedata.normalize("NFKD", text):
        return True

    return False


class CharacterSetsResult(TypedDict):
    """Result of character set detection."""

    has_latin: bool
    has_cyrillic: bool
    has_greek: bool
    has_full_width: bool
    has_mixed: bool


def detect_character_sets(text: str) -> CharacterSetsResult:
    """
    Get the character sets being used in text.

    Helps identify mixed-script attacks (e.g., mixing Latin and Cyrillic).

    Args:
        text: The input text

    Returns:
        Object with detected character set information
    """
    has_latin = bool(re.search(r"[a-zA-Z]", text))
    has_cyrillic = bool(re.search(r"[\u0400-\u04FF]", text))
    has_greek = bool(re.search(r"[\u0370-\u03FF]", text))
    has_full_width = bool(re.search(r"[\uFF01-\uFF5E]", text))

    script_count = sum([has_latin, has_cyrillic, has_greek, has_full_width])

    return {
        "has_latin": has_latin,
        "has_cyrillic": has_cyrillic,
        "has_greek": has_greek,
        "has_full_width": has_full_width,
        "has_mixed": script_count > 1,
    }
