"""Aho-Corasick parity tests between fast and legacy regex paths."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from glin_profanity import Filter
from glin_profanity.types.types import CheckProfanityResult, FilterConfig

TORTURE_SET_PATH = (
    Path(__file__).resolve().parents[3] / "benchmarks" / "shootout" / "torture-set.json"
)

FILTER_CONFIGS: list[FilterConfig] = [
    {"languages": ["english"]},
    {
        "languages": ["english"],
        "detect_leetspeak": True,
        "leetspeak_level": "moderate",
    },
    {
        "languages": ["english"],
        "detect_leetspeak": True,
        "leetspeak_level": "aggressive",
        "normalize_unicode": True,
    },
    {
        "languages": ["english", "spanish"],
        "detect_leetspeak": True,
        "normalize_unicode": True,
    },
    {
        "languages": ["english"],
        "replace_with": "***",
        "detect_leetspeak": True,
        "severity_levels": True,
    },
    {"all_languages": True, "detect_leetspeak": True, "normalize_unicode": True},
]

EXTRA_TEXTS = [
    "",
    "hello world",
    "The quick brown fox",
    "Scunthorpe is a town",
    "classic music",
    "assassin",
    "fuck",
    "FUCK",
    "f4ck",
    "@ss",
    "fuuuuck",
    "f u c k",
    "This is damn bad",
]


def _normalize_result(result: CheckProfanityResult) -> dict[str, object]:
    return {
        "contains_profanity": result["contains_profanity"],
        "profane_words": sorted(result.get("profane_words", [])),
        "processed_text": result.get("processed_text"),
        "severity_map": result.get("severity_map"),
    }


@pytest.fixture(scope="module")
def torture_set() -> list[dict[str, object]]:
    with TORTURE_SET_PATH.open(encoding="utf-8") as handle:
        return json.load(handle)


@pytest.mark.parametrize("config", FILTER_CONFIGS, ids=lambda cfg: json.dumps(cfg))
class TestAhoCorasickParity:
    def test_uses_aho_corasick_when_eligible(self, config: FilterConfig) -> None:
        expects_ac = config.get("word_boundaries", True) or config.get(
            "enable_context_aware", False
        )
        if expects_ac and not config.get("disable_aho_corasick"):
            fast_filter = Filter(config)
            assert fast_filter.dictionary_matcher is not None

    @pytest.mark.parametrize("text", EXTRA_TEXTS)
    def test_is_profane_parity(self, config: FilterConfig, text: str) -> None:
        fast_filter = Filter(config)
        legacy_filter = Filter({**config, "disable_aho_corasick": True})
        assert fast_filter.is_profane(text) == legacy_filter.is_profane(text)

    @pytest.mark.parametrize("text", EXTRA_TEXTS)
    def test_check_profanity_parity(self, config: FilterConfig, text: str) -> None:
        fast_filter = Filter(config)
        legacy_filter = Filter({**config, "disable_aho_corasick": True})
        assert _normalize_result(fast_filter.check_profanity(text)) == _normalize_result(
            legacy_filter.check_profanity(text)
        )

    def test_torture_set_parity(self, config: FilterConfig, torture_set: list) -> None:
        fast_filter = Filter(config)
        legacy_filter = Filter({**config, "disable_aho_corasick": True})

        for case in torture_set:
            text = str(case["input"])
            assert fast_filter.is_profane(text) == legacy_filter.is_profane(text)
            assert _normalize_result(fast_filter.check_profanity(text)) == _normalize_result(
                legacy_filter.check_profanity(text)
            )


def test_legacy_path_when_word_boundaries_disabled() -> None:
    config: FilterConfig = {
        "languages": ["english"],
        "word_boundaries": False,
        "fuzzy_tolerance_level": 0.6,
    }
    fast = Filter(config)
    legacy = Filter({**config, "disable_aho_corasick": True})
    assert fast.dictionary_matcher is None
    assert fast.is_profane("scunthorpe") == legacy.is_profane("scunthorpe")


def test_context_aware_mode_uses_aho_corasick_when_word_boundaries_disabled() -> None:
    config: FilterConfig = {
        "languages": ["english"],
        "enable_context_aware": True,
        "word_boundaries": False,
        "fuzzy_tolerance_level": 0.6,
    }
    filter_instance = Filter(config)
    assert filter_instance.dictionary_matcher is not None


def test_context_aware_mode_uses_aho_corasick_for_candidates() -> None:
    config: FilterConfig = {
        "languages": ["english"],
        "enable_context_aware": True,
    }
    filter_instance = Filter(config)
    assert filter_instance.dictionary_matcher is not None


def test_context_aware_ac_and_legacy_regex_paths_agree() -> None:
    config: FilterConfig = {
        "languages": ["english"],
        "enable_context_aware": True,
        "context_window": 3,
        "confidence_threshold": 0.7,
    }
    fast = Filter(config)
    legacy = Filter({**config, "disable_aho_corasick": True})
    cases = [
        "This movie is the bomb",
        "The bomb exploded and shit happened",
        "You are a fucking idiot",
        "This movie is sick!",
    ]

    for text in cases:
        assert fast.check_profanity(text) == legacy.check_profanity(text)
