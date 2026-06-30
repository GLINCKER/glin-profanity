"""Evasion normalization for profanity detection."""

from __future__ import annotations

import html
import re

_SEPARATED_CHAR_PATTERN = re.compile(
    r"\b([a-zA-Z0-9@$!#*])(?:[\s._\-]+([a-zA-Z0-9@$!#*])){2,}\b"
)
_NUMERIC_ENTITY_PATTERN = re.compile(r"&#(\d+);")
_HEX_ENTITY_PATTERN = re.compile(r"&#x([0-9a-fA-F]+);")
_REMAINING_NUMERIC_ENTITY_PATTERN = re.compile(r"&#(?:\d+|x[0-9a-fA-F]+);")
_MASKED_PATTERNS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"\bf\*+cking\b", re.IGNORECASE), "fucking"),
    (re.compile(r"\bf\*+ck\b", re.IGNORECASE), "fuck"),
    (re.compile(r"\bs\*+hit\b", re.IGNORECASE), "shit"),
    (re.compile(r"\bf\*{2,}(?=\W|$)", re.IGNORECASE), "fuck"),
    (re.compile(r"\bf\s+yourself\b", re.IGNORECASE), "fuck yourself"),
]
_MAX_UNICODE_CODEPOINT = 0x10FFFF


def _is_valid_unicode_scalar(code: int) -> bool:
    if not 0 <= code <= _MAX_UNICODE_CODEPOINT:
        return False
    return not 0xD800 <= code <= 0xDFFF


def _safe_codepoint_char(match: re.Match[str], base: int) -> str:
    """Decode a numeric entity, leaving invalid/out-of-range values unchanged."""
    try:
        code = int(match.group(1), base)
    except ValueError:
        return match.group(0)
    if not _is_valid_unicode_scalar(code):
        return match.group(0)
    return chr(code)


def _escape_remaining_numeric_entities(text: str) -> str:
    """Prevent html.unescape from re-processing invalid numeric entities."""

    def escape(match: re.Match[str]) -> str:
        return match.group(0).replace("&", "&amp;", 1)

    return _REMAINING_NUMERIC_ENTITY_PATTERN.sub(escape, text)


def strip_html_and_decode_entities(text: str) -> str:
    """Remove HTML tags and decode numeric/named entities."""
    result = re.sub(r"<[^>]*>", "", text)

    result = _NUMERIC_ENTITY_PATTERN.sub(
        lambda match: _safe_codepoint_char(match, 10),
        result,
    )
    result = _HEX_ENTITY_PATTERN.sub(
        lambda match: _safe_codepoint_char(match, 16),
        result,
    )
    result = _escape_remaining_numeric_entities(result)
    return html.unescape(result)


def collapse_separated_characters(text: str) -> str:
    """Collapse single alphanumerics separated by spaces, dots, underscores, or hyphens."""

    def replace_match(match: re.Match[str]) -> str:
        return re.sub(r"[\s._\-]+", "", match.group(0))

    return _SEPARATED_CHAR_PATTERN.sub(replace_match, text)


def normalize_masked_profanity(text: str) -> str:
    """Expand common asterisk-masked profanity abbreviations."""
    result = text
    for pattern, replacement in _MASKED_PATTERNS:
        result = pattern.sub(replacement, result)
    return result


def normalize_evasion(text: str) -> str:
    """Apply all evasion normalization steps before Unicode/leetspeak handling."""
    result = strip_html_and_decode_entities(text)
    result = collapse_separated_characters(result)
    return normalize_masked_profanity(result)
