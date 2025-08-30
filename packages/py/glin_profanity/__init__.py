"""
Glin-Profanity: A lightweight and efficient Python package for profanity detection.

Provides multi-language support, context-aware filtering, and customizable
configurations for detecting and filtering profane language in text inputs.
"""
 
__version__ = "2.3.6" 
__author__ = "glinr"
__email__ = "contact@glincker.com"

from .filters.filter import Filter
from .types.types import (
    CheckProfanityResult,
    FilterConfig,
    FilteredProfanityResult,
    Language,
    Match,
    SeverityLevel,
)

__all__ = [
    "CheckProfanityResult",
    "Filter",
    "FilterConfig",
    "FilteredProfanityResult",
    "Language",
    "Match",
    "SeverityLevel",
]
