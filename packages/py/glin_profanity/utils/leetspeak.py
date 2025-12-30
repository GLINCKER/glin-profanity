"""
Leetspeak detection and normalization utilities.

Converts leetspeak/1337 speak text back to standard characters for profanity detection.
"""

import re
from typing import Literal

LeetspeakLevel = Literal["basic", "moderate", "aggressive"]

# Basic character substitution map (numbers only)
BASIC_SUBSTITUTIONS: dict[str, str] = {
    "0": "o",
    "1": "i",
    "3": "e",
    "4": "a",
    "5": "s",
    "7": "t",
    "8": "b",
    "9": "g",
}

# Moderate character substitution map (numbers + common symbols)
MODERATE_SUBSTITUTIONS: dict[str, str] = {
    **BASIC_SUBSTITUTIONS,
    "@": "a",
    "$": "s",
    "!": "i",
    "(": "c",
    "<": "c",
    "{": "c",
    "[": "c",
    "+": "t",
    "#": "h",
}

# Aggressive single-character substitutions
AGGRESSIVE_SUBSTITUTIONS: dict[str, str] = {
    **MODERATE_SUBSTITUTIONS,
    "|": "i",
    "6": "g",
    "2": "z",
    "%": "z",
}

# Aggressive multi-character substitution patterns
AGGRESSIVE_MULTI_CHAR: list[tuple[str, str]] = [
    (r"/\\", "a"),
    (r"/-\\", "a"),
    (r"\^", "a"),
    (r"\|3", "b"),
    (r"13", "b"),
    (r"\|\)", "d"),
    (r"\|>", "d"),
    (r"\|=", "f"),
    (r"ph", "f"),
    (r"\|-\|", "h"),
    (r"\}\{", "h"),
    (r"\|<", "k"),
    (r"\|_", "l"),
    (r"\|2", "r"),
    (r"\|_\|", "u"),
    (r"\\/", "v"),
    (r"vv", "w"),
]


def normalize_leetspeak(
    text: str,
    level: LeetspeakLevel = "moderate",
    collapse_repeated: bool = True,
    max_repeated: int = 2,
    remove_spaced_chars: bool = True,
) -> str:
    """
    Normalize leetspeak text to standard characters.

    Args:
        text: The input text containing potential leetspeak
        level: Detection intensity ('basic', 'moderate', 'aggressive')
        collapse_repeated: Whether to collapse repeated characters
        max_repeated: Maximum allowed consecutive repeated characters
        remove_spaced_chars: Whether to remove spaces between single characters

    Returns:
        The normalized text with leetspeak characters replaced

    Examples:
        >>> normalize_leetspeak("f4ck")
        'fack'
        >>> normalize_leetspeak("sh!t")
        'shit'
        >>> normalize_leetspeak("@ss")
        'ass'
        >>> normalize_leetspeak("f u c k")
        'fuck'
    """
    normalized = text

    # Step 1: Handle spaced characters (f u c k -> fuck)
    if remove_spaced_chars:
        normalized = collapse_spaced_characters(normalized)

    # Step 2: Apply multi-character patterns first (aggressive only)
    if level == "aggressive":
        for pattern, replacement in AGGRESSIVE_MULTI_CHAR:
            normalized = re.sub(pattern, replacement, normalized, flags=re.IGNORECASE)

    # Step 3: Apply single-character substitutions
    substitutions = _get_substitution_map(level)
    result = []
    for char in normalized:
        result.append(substitutions.get(char, char))
    normalized = "".join(result)

    # Step 4: Collapse repeated characters (fuuuuck -> fuck)
    if collapse_repeated:
        normalized = collapse_repeated_characters(normalized, max_repeated)

    return normalized


def _get_substitution_map(level: LeetspeakLevel) -> dict[str, str]:
    """Get the appropriate substitution map based on the detection level."""
    if level == "basic":
        return BASIC_SUBSTITUTIONS
    elif level == "aggressive":
        return AGGRESSIVE_SUBSTITUTIONS
    return MODERATE_SUBSTITUTIONS


def collapse_spaced_characters(text: str) -> str:
    """
    Collapse sequences of spaced single characters into words.

    Args:
        text: The input text

    Returns:
        Text with spaced characters collapsed

    Examples:
        >>> collapse_spaced_characters("f u c k")
        'fuck'
        >>> collapse_spaced_characters("hello f u c k world")
        'hello fuck world'
    """
    # Match sequences of single characters separated by spaces
    # At least 3 characters to avoid false positives
    pattern = r"\b([a-zA-Z0-9@$!#])\s+([a-zA-Z0-9@$!#])(\s+[a-zA-Z0-9@$!#])+\b"

    def replace_match(match: re.Match[str]) -> str:
        return re.sub(r"\s+", "", match.group(0))

    return re.sub(pattern, replace_match, text)


def collapse_repeated_characters(text: str, max_repeated: int = 2) -> str:
    """
    Collapse repeated consecutive characters beyond a threshold.

    Args:
        text: The input text
        max_repeated: Maximum allowed consecutive repeated characters

    Returns:
        Text with repeated characters collapsed

    Examples:
        >>> collapse_repeated_characters("fuuuuck", 1)
        'fuck'
        >>> collapse_repeated_characters("shiiiit", 1)
        'shit'
    """
    pattern = rf"(.)\1{{{max_repeated},}}"
    return re.sub(pattern, lambda m: m.group(1) * max_repeated, text, flags=re.IGNORECASE)


def contains_leetspeak(text: str) -> bool:
    """
    Detect if text contains potential leetspeak patterns.

    Args:
        text: The input text to analyze

    Returns:
        True if leetspeak patterns are detected

    Examples:
        >>> contains_leetspeak("hello")
        False
        >>> contains_leetspeak("h3ll0")
        True
        >>> contains_leetspeak("@ss")
        True
    """
    patterns = [
        r"[0-9]",  # Contains numbers (potential leetspeak)
        r"[@$!#]",  # Contains common leetspeak symbols
        r"(.)\1{3,}",  # Excessive character repetition
        r"\b[a-zA-Z]\s+[a-zA-Z]\s+[a-zA-Z]\b",  # Spaced characters
    ]

    return any(re.search(pattern, text) for pattern in patterns)


def generate_leetspeak_variants(word: str, level: LeetspeakLevel = "moderate") -> list[str]:
    """
    Generate all possible leetspeak variants of a word.

    Args:
        word: The base word to generate variants for
        level: The leetspeak level to use for variant generation

    Returns:
        List of possible leetspeak variants

    Examples:
        >>> "ass" in generate_leetspeak_variants("ass")
        True
        >>> "@ss" in generate_leetspeak_variants("ass")
        True
    """
    variants: set[str] = {word.lower()}
    substitutions = _get_substitution_map(level)

    # Create reverse mapping (a -> ['4', '@'], etc.)
    reverse_map: dict[str, list[str]] = {}
    for leet, normal in substitutions.items():
        if normal not in reverse_map:
            reverse_map[normal] = []
        reverse_map[normal].append(leet)

    # Generate variants by substituting each character
    # Only for short words to avoid explosion
    if len(word) <= 6:
        _generate_variants_recursive(word, 0, "", variants, reverse_map)

    return list(variants)


def _generate_variants_recursive(
    word: str,
    index: int,
    current: str,
    variants: set[str],
    reverse_map: dict[str, list[str]],
) -> None:
    """Recursively generate leetspeak variants."""
    if index >= len(word):
        variants.add(current)
        return

    char = word[index].lower()
    _generate_variants_recursive(word, index + 1, current + char, variants, reverse_map)

    # Add leetspeak variants for this character
    if char in reverse_map:
        for leet_char in reverse_map[char]:
            _generate_variants_recursive(word, index + 1, current + leet_char, variants, reverse_map)
