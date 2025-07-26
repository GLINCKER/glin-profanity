"""
Type definitions for glin-profanity Python package.
Unified API that mirrors the JavaScript/TypeScript package structure.
"""

from enum import IntEnum
from typing import Dict, List, Literal, Optional, TypedDict

# Supported languages - unified list with JavaScript
Language = Literal[
    "arabic",
    "chinese", 
    "czech",
    "danish",
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
    context_score: Optional[float]
    reason: Optional[str]
    is_whitelisted: Optional[bool]


class CheckProfanityResult(TypedDict, total=False):
    """Result of profanity check operation - unified field names."""
    contains_profanity: bool
    profane_words: List[str]
    processed_text: Optional[str]
    severity_map: Optional[Dict[str, SeverityLevel]]
    matches: Optional[List[Match]]
    context_score: Optional[float]
    reason: Optional[str]


class ContextAwareConfig(TypedDict, total=False):
    """Configuration for context-aware filtering - unified with JavaScript."""
    enable_context_aware: bool
    context_window: int
    confidence_threshold: float
    domain_whitelists: Optional[Dict[str, List[str]]]


class FilterConfig(ContextAwareConfig, total=False):
    """Main filter configuration options - unified with JavaScript."""
    languages: Optional[List[Language]]
    all_languages: bool
    case_sensitive: bool
    word_boundaries: bool
    custom_words: Optional[List[str]]
    replace_with: Optional[str]
    severity_levels: bool
    ignore_words: Optional[List[str]]
    log_profanity: bool
    allow_obfuscated_match: bool
    fuzzy_tolerance_level: float


class FilteredProfanityResult(TypedDict):
    """Result with minimum severity filtering."""
    result: CheckProfanityResult
    filtered_words: List[str]