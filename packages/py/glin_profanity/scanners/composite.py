"""
Composite scanner — runs multiple scanners over a single input in one call.

Mirrors packages/js/src/scanners/composite.ts.

@module scanners/composite
"""

from typing import Optional

from .base import ScanDecision, ScanResult
from .pii import PiiScanner
from .prompt_injection import PromptInjectionScanner
from .secrets import SecretsScanner
from .vault import Vault

# Decision ordering for worst-of aggregation
_DECISION_RANK: dict[ScanDecision, int] = {
    ScanDecision.ALLOW: 0,
    ScanDecision.HITL: 1,
    ScanDecision.BLOCK: 2,
}

_ALL_SCANNERS = ("prompt_injection", "secrets", "pii")


def scan_all(
    text: str,
    scanners: Optional[list[str]] = None,
    vault: Optional[Vault] = None,
) -> list[ScanResult]:
    """Run multiple scanners on text, return results from each.

    Args:
        text: The text to scan.
        scanners: Subset of ``{"prompt_injection", "secrets", "pii"}``.
            Defaults to all three when ``None`` or empty.
        vault: Optional shared Vault instance.  When provided, secrets and
            PII scanners will redact into it (enabling later restoration).

    Returns:
        A list of :class:`ScanResult` objects — one per requested scanner —
        in the order: prompt_injection, secrets, pii.

    Raises:
        ValueError: If an unknown scanner name is supplied.
    """
    active = list(scanners) if scanners else list(_ALL_SCANNERS)

    unknown = set(active) - set(_ALL_SCANNERS)
    if unknown:
        raise ValueError(
            f"Unknown scanner(s): {sorted(unknown)}.  "
            f"Valid names: {list(_ALL_SCANNERS)}"
        )

    redact = vault is not None
    results: list[ScanResult] = []

    for name in _ALL_SCANNERS:
        if name not in active:
            continue

        if name == "prompt_injection":
            scanner = PromptInjectionScanner()
            results.append(scanner.scan(text))

        elif name == "secrets":
            scanner_s = SecretsScanner(redact=redact, vault=vault)
            results.append(scanner_s.scan(text))

        elif name == "pii":
            scanner_p = PiiScanner(redact=redact, vault=vault)
            results.append(scanner_p.scan(text))

    return results


def worst_decision(results: list[ScanResult]) -> ScanDecision:
    """
    Return the most severe :class:`ScanDecision` across a list of results.

    Order: BLOCK > HITL > ALLOW.

    Args:
        results: List of scan results (may be empty).

    Returns:
        The worst decision found, or ``ScanDecision.ALLOW`` for an empty list.
    """
    if not results:
        return ScanDecision.ALLOW
    return max(results, key=lambda r: _DECISION_RANK[r.decision]).decision


__all__ = ["scan_all", "worst_decision"]
