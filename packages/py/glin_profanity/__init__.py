"""
Glin-Profanity: A lightweight and efficient Python package for profanity detection.

Provides multi-language support, context-aware filtering, leetspeak detection,
Unicode normalization, and customizable configurations for detecting and
filtering profane language in text inputs.

Examples:
    >>> from glin_profanity import Filter
    >>> filter = Filter({"detect_leetspeak": True})
    >>> filter.is_profane("@ss")
    True
    >>> filter.is_profane("fück")
    True
"""

__version__ = "3.0.0"
__author__ = "glinr"
__email__ = "contact@glincker.com"

from .filters.filter import Filter
from .types.types import (
    CheckProfanityResult,
    FilterConfig,
    FilteredProfanityResult,
    Language,
    LeetspeakLevel,
    Match,
    SeverityLevel,
)
from .utils import (
    CharacterSetsResult,
    collapse_repeated_characters,
    collapse_spaced_characters,
    contains_leetspeak,
    contains_unicode_obfuscation,
    convert_full_width,
    convert_homoglyphs,
    detect_character_sets,
    generate_leetspeak_variants,
    normalize_leetspeak,
    normalize_nfkd,
    normalize_unicode,
    remove_zero_width_characters,
)

__all__ = [
    # Core
    "Filter",
    # Types
    "CheckProfanityResult",
    "FilterConfig",
    "FilteredProfanityResult",
    "Language",
    "LeetspeakLevel",
    "Match",
    "SeverityLevel",
    # Leetspeak utilities
    "normalize_leetspeak",
    "collapse_spaced_characters",
    "collapse_repeated_characters",
    "contains_leetspeak",
    "generate_leetspeak_variants",
    # Unicode utilities
    "CharacterSetsResult",
    "normalize_unicode",
    "remove_zero_width_characters",
    "convert_full_width",
    "convert_homoglyphs",
    "normalize_nfkd",
    "contains_unicode_obfuscation",
    "detect_character_sets",
]
