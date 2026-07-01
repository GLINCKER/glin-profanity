"""Tests for filter cache, config export, and reason formatting."""

from glin_profanity import Filter


class TestResultCache:
    def test_ignore_words_change_invalidates_cached_result(self) -> None:
        filter_instance = Filter({"languages": ["english"], "cache_results": True})
        first = filter_instance.check_profanity("hello fuck world")
        assert first["contains_profanity"] is True

        filter_instance.ignore_words.add("fuck")
        second = filter_instance.check_profanity("hello fuck world")
        assert second["contains_profanity"] is False

    def test_replace_with_change_invalidates_cached_processed_text(self) -> None:
        filter_instance = Filter(
            {
                "languages": ["english"],
                "cache_results": True,
                "replace_with": "***",
            }
        )
        first = filter_instance.check_profanity("hello fuck world")
        assert first["processed_text"] == "hello *** world"

        filter_instance.replace_with = "XXX"
        second = filter_instance.check_profanity("hello fuck world")
        assert second["processed_text"] == "hello XXX world"


class TestGetConfig:
    def test_exports_round_trip_fields(self) -> None:
        config = {
            "languages": ["english", "spanish"],
            "all_languages": False,
            "custom_words": ["badword"],
            "detect_leetspeak": True,
            "disable_aho_corasick": True,
            "domain_whitelists": {"english": ["clinical"]},
        }
        exported = Filter(config).get_config()
        assert exported["languages"] == ["english", "spanish"]
        assert exported["custom_words"] == ["badword"]
        assert exported["disable_aho_corasick"] is True
        assert exported["domain_whitelists"] == {"english": ["clinical"]}


class TestReasonFormatting:
    def test_flagged_without_words_uses_generic_reason(self) -> None:
        filter_instance = Filter(
            {
                "languages": ["english"],
                "word_boundaries": False,
                "fuzzy_tolerance_level": 0.6,
                "disable_aho_corasick": True,
            }
        )
        result = filter_instance.check_profanity("This movie is the bomb")
        assert result["contains_profanity"] is True
        assert result["profane_words"]
        assert "potential profanity matches" in result["reason"]
