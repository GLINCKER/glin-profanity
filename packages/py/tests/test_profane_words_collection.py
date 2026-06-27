"""Tests for profane_words collection from normalized tier with fallbacks."""

from glin_profanity import Filter
from glin_profanity.utils.variant_mapping import dedupe_profane_spans_by_overlap


class TestProfaneSpanDedupe:
    def test_keeps_longer_same_start_prefix(self) -> None:
        spans = [("Am", 0, 2), ("Amm", 0, 3)]
        assert dedupe_profane_spans_by_overlap(spans) == [("Amm", 0, 3)]


class TestNormalizedProfaneWordsCollection:
    @classmethod
    def setup_class(cls) -> None:
        cls.filter = Filter(
            {
                "all_languages": True,
                "detect_leetspeak": True,
                "normalize_unicode": True,
            }
        )
        cls.english_filter = Filter(
            {
                "languages": ["english"],
                "detect_leetspeak": True,
                "normalize_unicode": True,
            }
        )

    def test_amm_bno_q_haces(self) -> None:
        result = self.filter.check_profanity("Amm bno q haces")
        assert result["contains_profanity"] is True
        assert result["profane_words"] == ["Amm"]

    def test_cuéntame_only_reports_con(self) -> None:
        text = "Cuéntame algo *Digo con voz adormilada* Me gusta tu voz"
        result = self.filter.check_profanity(text)
        assert "Cu" not in result["profane_words"]
        assert "con" in result["profane_words"]

    def test_f_dot_u_c_k_maps_to_original(self) -> None:
        result = self.filter.check_profanity("say f.u.c.k off")
        assert result["profane_words"] == ["f.u.c.k"]

    def test_cjk_still_maps_to_original(self) -> None:
        result = self.filter.check_profanity("123肏456")
        assert result["contains_profanity"] is True
        assert result["profane_words"] == ["肏"]

    def test_f_at_ck_fallback_to_original(self) -> None:
        result = self.english_filter.check_profanity("f@ck")
        assert result["contains_profanity"] is True
        assert result["profane_words"] == ["f@ck"]

    def test_repeated_chars_fallback_to_original(self) -> None:
        for text in ("fuuuuuck", "fffffffuck"):
            result = self.english_filter.check_profanity(text)
            assert result["contains_profanity"] is True
            assert result["profane_words"] == [text]

    def test_contains_implies_non_empty_profane_words(self) -> None:
        for text in ("f@ck", "fuuuuuck", "say f.u.c.k off", "123肏456"):
            result = self.english_filter.check_profanity(text)
            if result["contains_profanity"]:
                assert len(result["profane_words"]) > 0

    def test_replace_with_applies_when_contains_profanity(self) -> None:
        masked = Filter(
            {
                "languages": ["english"],
                "detect_leetspeak": True,
                "replace_with": "***",
            }
        ).check_profanity("fuuuuuck")
        assert masked["contains_profanity"] is True
        assert masked["processed_text"] == "***"

    def test_context_aware_matches_is_profane_for_repeated_chars(self) -> None:
        context_filter = Filter(
            {
                "languages": ["english"],
                "detect_leetspeak": True,
                "enable_context_aware": True,
            }
        )
        assert context_filter.is_profane("fuuuuuck") is True
        result = context_filter.check_profanity("fuuuuuck")
        assert result["contains_profanity"] is True
        assert result["profane_words"] == ["fuuuuuck"]
        assert result["reason"] == "Found 1 potential profanity matches"

    def test_ac_path_reason_matches_profane_word_count(self) -> None:
        result = self.english_filter.check_profanity("fuuuuuck")
        assert result["reason"] == "Found 1 potential profanity matches"

    def test_context_aware_whitelist_reason(self) -> None:
        context_filter = Filter(
            {
                "languages": ["english"],
                "enable_context_aware": True,
                "context_window": 3,
                "confidence_threshold": 0.7,
            }
        )
        result = context_filter.check_profanity("This movie is the bomb")
        assert result["contains_profanity"] is False
        assert result["profane_words"] == []
        assert result["reason"] == "No profanity detected"
        assert context_filter.is_profane("This movie is the bomb") is False


class TestLegacyPathProfaneWords:
    def test_word_boundaries_disabled_populates_fuzzy_words(self) -> None:
        legacy = Filter(
            {
                "languages": ["english"],
                "word_boundaries": False,
                "fuzzy_tolerance_level": 0.6,
                "disable_aho_corasick": True,
            }
        )
        result = legacy.check_profanity("This movie is the bomb")
        assert result["contains_profanity"] is True
        assert len(result["profane_words"]) > 0
        assert legacy.is_profane("This movie is the bomb") == result["contains_profanity"]

    def test_context_legacy_tier_fallback(self) -> None:
        context_legacy = Filter(
            {
                "languages": ["english"],
                "detect_leetspeak": True,
                "enable_context_aware": True,
                "disable_aho_corasick": True,
            }
        )
        for text in ("fuuuuuck", "f@ck"):
            assert context_legacy.is_profane(text) is True
            result = context_legacy.check_profanity(text)
            assert result["contains_profanity"] is True
            assert len(result["profane_words"]) > 0
            assert result["profane_words"] == [text]
