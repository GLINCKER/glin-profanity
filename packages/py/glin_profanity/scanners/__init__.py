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
from .patterns.pii_patterns import PII_PATTERNS, PiiPattern
from .patterns.secret_patterns import SECRET_PATTERNS, SecretPattern
from .pii import PiiScanner, scan_pii
from .prompt_injection import (
    PromptInjectionScanner,
    check_prompt_injection,
    default_prompt_injection_scanner,
)
from .secrets import SecretsScanner, scan_secrets
from .vault import RestoreStrategy, Vault

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
    "PII_PATTERNS",
    "PiiPattern",
    "SECRET_PATTERNS",
    "SecretPattern",
    # Prompt injection scanner
    "PromptInjectionScanner",
    "check_prompt_injection",
    "default_prompt_injection_scanner",
    # Secrets scanner
    "SecretsScanner",
    "scan_secrets",
    # PII scanner
    "PiiScanner",
    "scan_pii",
    # Vault
    "Vault",
    "RestoreStrategy",
]
