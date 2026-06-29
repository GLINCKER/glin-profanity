"""
Unicode normalization utilities for profanity detection.

Handles homoglyphs, full-width characters, diacritics, and other Unicode tricks.
"""

import re
import unicodedata
from typing import TypedDict

# Homoglyph mapping: visually similar Unicode characters to ASCII equivalents.
# Kept in sync with packages/js/src/utils/unicode.ts (HOMOGLYPHS) so both
# implementations normalize identically.
HOMOGLYPHS: dict[str, str] = {
    # Cyrillic homoglyphs (look like Latin)
    "а": "a",  # Cyrillic small a
    "А": "A",  # Cyrillic capital A
    "е": "e",  # Cyrillic small e
    "Е": "E",  # Cyrillic capital E
    "к": "k",  # Cyrillic small ka
    "К": "K",  # Cyrillic capital Ka
    "о": "o",  # Cyrillic small o
    "О": "O",  # Cyrillic capital O
    "р": "p",  # Cyrillic small er
    "Р": "P",  # Cyrillic capital Er
    "с": "c",  # Cyrillic small es
    "С": "C",  # Cyrillic capital Es
    "у": "u",  # Cyrillic small u (map to u, not y)
    "У": "U",  # Cyrillic capital U
    "х": "x",  # Cyrillic small ha
    "Х": "X",  # Cyrillic capital Ha
    "і": "i",  # Cyrillic small i (Ukrainian)
    "І": "I",  # Cyrillic capital I (Ukrainian)
    "ј": "j",  # Cyrillic small je
    "Ј": "J",  # Cyrillic capital Je
    "ѕ": "s",  # Cyrillic small dze
    "Ѕ": "S",  # Cyrillic capital Dze
    # Currency and special symbols that look like letters
    "¢": "c",  # Cent sign
    "ƒ": "f",  # Latin small f with hook (florin)
    # Greek homoglyphs
    "α": "a",  # Greek small alpha
    "Α": "A",  # Greek capital Alpha
    "β": "b",  # Greek small beta (sort of)
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
    "Ս": "U",  # Armenian capital seh (looks like U)
    "ս": "u",  # Armenian small seh (looks like u)
    "Υ": "Y",  # Greek capital Upsilon
    "χ": "x",  # Greek small chi
    "Χ": "X",  # Greek capital Chi
    # Mathematical symbols
    "ℂ": "C",  # Double-struck capital C
    "ℍ": "H",  # Double-struck capital H
    "ℕ": "N",  # Double-struck capital N
    "ℙ": "P",  # Double-struck capital P
    "ℚ": "Q",  # Double-struck capital Q
    "ℝ": "R",  # Double-struck capital R
    "ℤ": "Z",  # Double-struck capital Z
    # Subscript/superscript
    "ᵃ": "a", "ᵇ": "b", "ᶜ": "c", "ᵈ": "d", "ᵉ": "e",
    "ᶠ": "f", "ᵍ": "g", "ʰ": "h", "ⁱ": "i", "ʲ": "j",
    "ᵏ": "k", "ˡ": "l", "ᵐ": "m", "ⁿ": "n", "ᵒ": "o",
    "ᵖ": "p", "ʳ": "r", "ˢ": "s", "ᵗ": "t", "ᵘ": "u",
    "ᵛ": "v", "ʷ": "w", "ˣ": "x", "ʸ": "y", "ᶻ": "z",
    # Small caps
    "ᴀ": "A", "ʙ": "B", "ᴄ": "C", "ᴅ": "D", "ᴇ": "E",
    "ꜰ": "F", "ɢ": "G", "ʜ": "H", "ɪ": "I", "ᴊ": "J",
    "ᴋ": "K", "ʟ": "L", "ᴍ": "M", "ɴ": "N", "ᴏ": "O",
    "ᴘ": "P", "ǫ": "Q", "ʀ": "R", "ꜱ": "S", "ᴛ": "T",
    "ᴜ": "U", "ᴠ": "V", "ᴡ": "W", "ʏ": "Y", "ᴢ": "Z",
    # Circled letters
    "ⓐ": "a", "ⓑ": "b", "ⓒ": "c", "ⓓ": "d", "ⓔ": "e",
    "ⓕ": "f", "ⓖ": "g", "ⓗ": "h", "ⓘ": "i", "ⓙ": "j",
    "ⓚ": "k", "ⓛ": "l", "ⓜ": "m", "ⓝ": "n", "ⓞ": "o",
    "ⓟ": "p", "ⓠ": "q", "ⓡ": "r", "ⓢ": "s", "ⓣ": "t",
    "ⓤ": "u", "ⓥ": "v", "ⓦ": "w", "ⓧ": "x", "ⓨ": "y",
    "ⓩ": "z",
    # Full-width letters
    "ａ": "a", "ｂ": "b", "ｃ": "c", "ｄ": "d", "ｅ": "e",
    "ｆ": "f", "ｇ": "g", "ｈ": "h", "ｉ": "i", "ｊ": "j",
    "ｋ": "k", "ｌ": "l", "ｍ": "m", "ｎ": "n", "ｏ": "o",
    "ｐ": "p", "ｑ": "q", "ｒ": "r", "ｓ": "s", "ｔ": "t",
    "ｕ": "u", "ｖ": "v", "ｗ": "w", "ｘ": "x", "ｙ": "y",
    "ｚ": "z",
    # Mirrored/rotated
    "ɐ": "a", "ɔ": "c", "ǝ": "e", "ɟ": "j", "ɥ": "h",
    "ɯ": "m", "ɹ": "r", "ʇ": "t", "ʌ": "v", "ʍ": "w",
    # Common lookalikes
    "ł": "l", "Ł": "L",
    "ø": "o", "Ø": "O",
    "đ": "d", "Đ": "D",
    "ħ": "h", "Ħ": "H",
    "ı": "i", "İ": "I",
    "ĸ": "k",
    "ŀ": "l", "Ŀ": "L",
    "ŋ": "n", "Ŋ": "N",
    "œ": "oe", "Œ": "OE",
    "ſ": "s",
    "ŧ": "t", "Ŧ": "T",
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

# Combining Japanese (han)dakuten. These are nonspacing marks (category 'Mn')
# but encode a phonemic kana distinction, so they must survive diacritic folding.
_KANA_VOICED_SOUND_MARKS = frozenset(("\u3099", "\u309A"))


def is_latin_script_letter(char: str) -> bool:
    """Return True for Basic Latin and Latin Extended letters (not Cyrillic/CJK/etc.)."""
    if not char or not char.isalpha():
        return False
    code = ord(char)
    return code <= 0x024F or 0x1E00 <= code <= 0x1EFF


def text_should_skip_latin_obfuscation_normalization(text: str) -> bool:
    """
    Skip homoglyph and leetspeak normalization when text contains non-Latin letters.

    Preserves Spanish/Portuguese accented Latin while avoiding Cyrillic→Latin
    homoglyph false positives (e.g. поспал → pocpal matching ``oc``).
    Mixed Latin obfuscation (e.g. ``fսck`` with one Armenian homoglyph) still
    normalizes because Latin letters dominate.
    """
    latin_letters = 0
    non_latin_letters = 0
    for char in text:
        if not char.isalpha():
            continue
        if is_latin_script_letter(char):
            latin_letters += 1
        else:
            non_latin_letters += 1
    if non_latin_letters == 0:
        return False
    return non_latin_letters >= latin_letters


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


def homoglyph_to_ascii(char: str) -> str:
    """Return the ASCII lookalike for a single homoglyph character."""
    return HOMOGLYPHS.get(char, char)


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
        # Remove combining diacritical marks (category 'Mn' = Mark, Nonspacing),
        # but keep Japanese voiced/semi-voiced sound marks: ソ vs ゾ (and ハ/バ/パ)
        # is a phonemic distinction, not a foldable diacritic. Dropping it makes
        # クソ match ゾクゾク (ゾ→ソ) and ビッチ collapse to ヒッチ. Recompose with
        # NFC afterwards so the kept marks fold back into precomposed kana
        # (ソ + ゙ -> ゾ).
        normalized = "".join(
            c
            for c in normalized
            if unicodedata.category(c) != "Mn" or c in _KANA_VOICED_SOUND_MARKS
        )
        normalized = unicodedata.normalize("NFC", normalized)

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
