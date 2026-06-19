"""
Utility functions for glin-profanity.

This module provides utilities for text normalization including
leetspeak detection and Unicode normalization.
"""

from .evasion import (
    collapse_separated_characters,
    normalize_evasion,
    normalize_masked_profanity,
    strip_html_and_decode_entities,
)
from .leetspeak import (
    LeetspeakLevel,
    collapse_repeated_characters,
    collapse_spaced_characters,
    contains_leetspeak,
    generate_leetspeak_variants,
    normalize_leetspeak,
    normalize_leetspeak_variants,
)
from .unicode import (
    CharacterSetsResult,
    contains_unicode_obfuscation,
    convert_full_width,
    convert_homoglyphs,
    detect_character_sets,
    normalize_nfkd,
    normalize_unicode,
    remove_zero_width_characters,
)
from .word_script import (
    WordScript,
    classify_word_script,
    has_cjk_word_boundary,
    has_latin_word_boundary,
    is_cjk_character,
    is_latin_word_boundary_before,
    match_has_word_boundary,
)

__all__ = [
    # Evasion utilities
    "normalize_evasion",
    "strip_html_and_decode_entities",
    "collapse_separated_characters",
    "normalize_masked_profanity",
    # Leetspeak utilities
    "LeetspeakLevel",
    "normalize_leetspeak",
    "normalize_leetspeak_variants",
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
    # Word-script utilities
    "WordScript",
    "is_cjk_character",
    "classify_word_script",
    "is_latin_word_boundary_before",
    "has_latin_word_boundary",
    "has_cjk_word_boundary",
    "match_has_word_boundary",
]
