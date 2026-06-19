"""Tests for CJK automatic matching strategy."""

import json

import pytest

from glin_profanity import Filter
from glin_profanity.types.types import FilterConfig
from glin_profanity.utils.word_script import (
    classify_word_script,
    has_cjk_word_boundary,
    has_latin_word_boundary,
    is_cjk_character,
)


class TestWordScriptUtilities:
    def test_is_cjk_character_detects_cjk_scripts(self) -> None:
        assert is_cjk_character("你") is True
        assert is_cjk_character("エ") is True
        assert is_cjk_character("병") is True
        assert is_cjk_character("a") is False

    def test_classify_word_script_uses_characters_not_language(self) -> None:
        assert classify_word_script("他妈的") == "cjk"
        assert classify_word_script("エッチ") == "cjk"
        assert classify_word_script("sm") == "latin"
        assert classify_word_script("fuck") == "latin"

    def test_has_latin_word_boundary_matches_js_b_semantics(self) -> None:
        assert has_latin_word_boundary("hello fuck world", 6, 10) is True
        assert has_latin_word_boundary("scunthorpe", 5, 9) is False
        assert has_latin_word_boundary("classic", 2, 5) is False

    def test_has_cjk_word_boundary_allows_substring_including_ascii_adjacency(
        self,
    ) -> None:
        assert has_cjk_word_boundary("你他妈的", 1, 4) is True
        assert has_cjk_word_boundary("hello操world", 5, 6) is True
        assert has_cjk_word_boundary("hello他妈的", 5, 8) is True
        assert has_cjk_word_boundary("123エッチ456", 3, 6) is True


class TestCjkAutomaticMatchingStrategy:
    @classmethod
    def setup_class(cls) -> None:
        cls.chinese_filter = Filter({"languages": ["chinese"]})
        cls.japanese_filter = Filter({"languages": ["japanese"]})
        cls.korean_filter = Filter({"languages": ["korean"]})
        cls.english_filter = Filter({"languages": ["english"]})
        cls.mixed_filter = Filter({"languages": ["english", "chinese"]})

    def test_chinese_detection_with_default_word_boundaries(self) -> None:
        assert self.chinese_filter.is_profane("你他妈的") is True
        assert len(self.chinese_filter.check_profanity("他妈的")["profane_words"]) > 0

    def test_japanese_detection_with_default_word_boundaries(self) -> None:
        assert self.japanese_filter.is_profane("このエッチな話") is True
        assert self.japanese_filter.is_profane("エッチ") is True

    def test_korean_detection_with_default_word_boundaries(self) -> None:
        assert self.korean_filter.is_profane("이 병신") is True
        assert self.korean_filter.is_profane("병신") is True

    def test_japanese_ascii_entries_still_use_latin_boundaries(self) -> None:
        assert self.japanese_filter.is_profane("hello xx world") is True
        assert self.japanese_filter.is_profane("xxtra") is False

    def test_detects_cjk_profanity_wrapped_in_or_adjacent_to_ascii(self) -> None:
        assert self.chinese_filter.is_profane("hello他妈的") is True
        assert self.chinese_filter.is_profane("x乳x") is True
        assert self.chinese_filter.is_profane("123他妈的456") is True
        assert self.japanese_filter.is_profane("abcエッチdef") is True

    def test_does_not_flag_scunthorpe_or_classic_for_english_words(self) -> None:
        assert self.english_filter.is_profane("scunthorpe") is False
        assert self.english_filter.is_profane("classic") is False
        assert self.english_filter.is_profane("assassin") is False

    def test_still_detects_standalone_english_profanity(self) -> None:
        assert self.english_filter.is_profane("hello fuck world") is True

    def test_mixed_filter_does_not_false_positive_english_traps(self) -> None:
        assert self.mixed_filter.is_profane("scunthorpe") is False
        assert self.mixed_filter.is_profane("classic") is False

    def test_detects_both_english_and_chinese_in_one_filter(self) -> None:
        assert self.mixed_filter.is_profane("hello fuck") is True
        assert self.mixed_filter.is_profane("你他妈的") is True

    def test_replaces_chinese_profanity_without_requiring_b(self) -> None:
        filter_instance = Filter(
            {"languages": ["chinese"], "replace_with": "***"}
        )
        result = filter_instance.check_profanity("你他妈的")
        assert result["processed_text"] is not None
        assert "***" in result["processed_text"]
        assert "他妈的" not in result["processed_text"]


class TestCjkAhoCorasickParity:
    CASES = [
        "你他妈的",
        "他妈的",
        "エッチ",
        "병신",
        "hello fuck",
        "scunthorpe",
        "hello他妈的",
        "x乳x",
        "abcエッチdef",
    ]
    CONFIGS: list[FilterConfig] = [
        {"languages": ["chinese"]},
        {"languages": ["japanese"]},
        {"languages": ["korean"]},
        {"languages": ["english", "chinese"]},
    ]

    @pytest.mark.parametrize("config", CONFIGS, ids=lambda cfg: json.dumps(cfg))
    @pytest.mark.parametrize("text", CASES)
    def test_fast_and_legacy_agree(self, config: FilterConfig, text: str) -> None:
        fast = Filter(config)
        legacy = Filter({**config, "disable_aho_corasick": True})
        assert fast.is_profane(text) == legacy.is_profane(text)
        assert fast.check_profanity(text)["contains_profanity"] == legacy.check_profanity(
            text
        )["contains_profanity"]
