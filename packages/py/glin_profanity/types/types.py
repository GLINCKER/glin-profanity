"""
Type definitions for glin-profanity Python package.
Unified API that mirrors the JavaScript/TypeScript package structure.
"""

from __future__ import annotations

from enum import IntEnum
from typing import Literal, TypedDict

# Supported languages - unified list with JavaScript
Language = Literal[
    "arabic",
    "chinese",
    "czech",
    "danish",
    "dutch",
    "english",
    "esperanto",
    "finnish",
    "french",
    "german",
    "hindi",
    "hungarian",
    "italian",
    "japanese",
    "korean",
    "norwegian",
    "persian",
    "polish",
    "portuguese",
    "russian",
    "spanish",
    "swedish",
    "thai",
    "turkish",
]


class SeverityLevel(IntEnum):
    """Severity levels for profanity matches - unified with JavaScript."""

    EXACT = 1
    FUZZY = 2


class Match(TypedDict, total=False):
    """Represents a profanity match in text - unified with JavaScript."""

    word: str
    index: int
    severity: SeverityLevel
    context_score: float | None
    reason: str | None
    is_whitelisted: bool | None


class CheckProfanityResult(TypedDict, total=False):
    """Result of profanity check operation - unified field names."""

    contains_profanity: bool
    profane_words: list[str]
    processed_text: str | None
    severity_map: dict[str, SeverityLevel] | None
    matches: list[Match] | None
    context_score: float | None
    reason: str | None


class ContextAwareConfig(TypedDict, total=False):
    """Configuration for context-aware filtering - unified with JavaScript."""

    enable_context_aware: bool
    context_window: int
    confidence_threshold: float
    domain_whitelists: dict[str, list[str]] | None


# Leetspeak detection intensity levels
LeetspeakLevel = Literal["basic", "moderate", "aggressive"]


class FilterConfig(ContextAwareConfig, total=False):
    """Main filter configuration options - unified with JavaScript."""

    languages: list[Language] | None
    all_languages: bool
    case_sensitive: bool
    word_boundaries: bool
    custom_words: list[str] | None
    replace_with: str | None
    severity_levels: bool
    ignore_words: list[str] | None
    log_profanity: bool
    allow_obfuscated_match: bool
    fuzzy_tolerance_level: float

    # Leetspeak detection options
    detect_leetspeak: bool  # Enable leetspeak detection (e.g., "f4ck" -> "fuck")
    leetspeak_level: LeetspeakLevel  # Detection intensity: 'basic', 'moderate', 'aggressive'

    # Unicode normalization options
    normalize_unicode: bool  # Enable Unicode normalization to detect homoglyphs

    # Caching options
    cache_results: bool  # Cache profanity check results for repeated strings
    max_cache_size: int  # Maximum cache size when caching is enabled


class FilteredProfanityResult(TypedDict):
    """Result with minimum severity filtering."""

    result: CheckProfanityResult
    filtered_words: list[str]
