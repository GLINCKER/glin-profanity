"""Scanner protocol and built-in scanner implementations."""

from .base import (
    ScanDecision,
    ScanMatch,
    Scanner,
    ScanResult,
    allow_result,
    block_result,
)
from .patterns.injection_patterns import INJECTION_PATTERNS, InjectionPattern
from .prompt_injection import (
    PromptInjectionScanner,
    check_prompt_injection,
    default_prompt_injection_scanner,
)

__all__ = [
    # Base
    "Scanner",
    "ScanDecision",
    "ScanMatch",
    "ScanResult",
    "allow_result",
    "block_result",
    # Patterns
    "INJECTION_PATTERNS",
    "InjectionPattern",
    # Prompt injection scanner
    "PromptInjectionScanner",
    "check_prompt_injection",
    "default_prompt_injection_scanner",
]
