"""
Vault — stores redacted originals and restores them after pipeline processing.

Design ported from ProtectAI/llm-guard (MIT) — rewritten in Python.
Supports four restore strategies: exact, case_insensitive, fuzzy, combined.

Mirrors packages/js/src/scanners/vault.ts.

@module scanners/vault
"""

import re
from dataclasses import dataclass
from typing import Literal

RestoreStrategy = Literal["exact", "case_insensitive", "fuzzy", "combined"]


@dataclass
class _VaultEntry:
    """A single entry stored in the vault."""

    placeholder: str
    """Placeholder token used in sanitized text, e.g. '[REDACTED_EMAIL_1]'."""

    original: str
    """The original sensitive value."""

    type: str
    """Type string, e.g. 'EMAIL', used in placeholder construction."""


def _levenshtein(a: str, b: str) -> int:
    """
    Levenshtein edit distance between two strings.
    Used by the fuzzy restore strategy (tolerance <= 3).
    """
    m = len(a)
    n = len(b)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(m + 1):
        dp[i][0] = i
    for j in range(n + 1):
        dp[0][j] = j

    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if a[i - 1] == b[j - 1]:
                dp[i][j] = dp[i - 1][j - 1]
            else:
                dp[i][j] = 1 + min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])

    return dp[m][n]


def _escape_regex(s: str) -> str:
    """Escape a string for use inside a compiled regex."""
    return re.escape(s)


def _fuzzy_replace(text: str, needle: str, replacement: str, tolerance: int) -> str:
    """
    Perform a fuzzy replacement in text, substituting needle with replacement
    whenever a window of the same length as needle has Levenshtein distance
    <= tolerance.

    Complexity: O(|text| * |needle|^2) — acceptable for typical prompt sizes.
    """
    if not needle:
        return text

    n = len(needle)
    result_parts: list[str] = []
    i = 0

    while i < len(text):
        window = text[i : i + n]
        if len(window) < max(1, n // 2):
            # Too short for meaningful fuzzy match
            result_parts.append(text[i:])
            break

        # Fast-path: if the window's first character differs from needle's first
        # character, skip the full DP — saves O(n^2) work per position.
        if window[0] != needle[0]:
            result_parts.append(text[i])
            i += 1
            continue

        dist = _levenshtein(window, needle)
        if dist <= tolerance:
            result_parts.append(replacement)
            i += len(window)
        else:
            result_parts.append(text[i])
            i += 1

    return "".join(result_parts)


class Vault:
    """
    Vault stores placeholder->original mappings produced during redaction and
    replaces placeholders with originals when text leaves the pipeline.

    Inspired by ProtectAI/llm-guard vault.py (MIT).
    """

    def __init__(self) -> None:
        self._entries: list[_VaultEntry] = []
        self._counters: dict[str, int] = {}

    def store(self, type: str, original: str) -> str:
        """
        Store an original value and return a unique placeholder string.

        Args:
            type: PII/secret type label (will be upper-cased), e.g. 'email'.
            original: The raw sensitive value to redact.

        Returns:
            The placeholder token, e.g. '[REDACTED_EMAIL_1]'.
        """
        normalized_type = re.sub(r"[^A-Z0-9]", "_", type.upper())
        count = self._counters.get(normalized_type, 0) + 1
        self._counters[normalized_type] = count
        placeholder = f"[REDACTED_{normalized_type}_{count}]"
        self._entries.append(
            _VaultEntry(
                placeholder=placeholder, original=original, type=normalized_type
            )
        )
        return placeholder

    def restore(self, text: str, strategy: RestoreStrategy = "exact") -> str:
        """
        Replace all placeholders in text with their original values.

        Args:
            text: The sanitized text containing placeholder tokens.
            strategy: How to match placeholders (default: 'exact').

        Returns:
            The restored text with originals substituted back.
        """
        result = text

        for entry in self._entries:
            if strategy == "exact":
                result = result.replace(entry.placeholder, entry.original)

            elif strategy == "case_insensitive":
                # Find all case-insensitive occurrences and replace using split/join
                ci_re = re.compile(_escape_regex(entry.placeholder), re.IGNORECASE)
                parts = ci_re.split(result)
                result = entry.original.join(parts)

            elif strategy == "fuzzy":
                result = _fuzzy_replace(result, entry.placeholder, entry.original, 3)

            elif strategy == "combined":
                # Try exact first, then case-insensitive, then fuzzy
                if entry.placeholder in result:
                    result = result.replace(entry.placeholder, entry.original)
                else:
                    ci_pattern = re.compile(
                        _escape_regex(entry.placeholder), re.IGNORECASE
                    )
                    if ci_pattern.search(result):
                        result = ci_pattern.sub(entry.original, result)
                    else:
                        result = _fuzzy_replace(
                            result, entry.placeholder, entry.original, 3
                        )

        return result

    def clear(self) -> None:
        """Remove all stored entries and reset counters."""
        self._entries = []
        self._counters = {}

    def size(self) -> int:
        """Number of entries currently stored."""
        return len(self._entries)

    def get_entries(self) -> list[dict[str, str]]:
        """
        Retrieve a snapshot of all current entries (read-only copy).
        Useful for serialisation or inspection.
        """
        return [
            {"placeholder": e.placeholder, "original": e.original, "type": e.type}
            for e in self._entries
        ]


__all__ = ["Vault", "RestoreStrategy"]
