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
                "languages": ["turkish"],
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
        cls.french_filter = Filter(
            {
                "languages": ["french"],
                "detect_leetspeak": True,
                "normalize_unicode": True,
            }
        )
        cls.chinese_filter = Filter(
            {
                "languages": ["chinese"],
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
        result = self.french_filter.check_profanity(text)
        assert "Cu" not in result["profane_words"]
        assert "con" in result["profane_words"]

    def test_f_dot_u_c_k_maps_to_original(self) -> None:
        result = self.english_filter.check_profanity("say f.u.c.k off")
        assert result["profane_words"] == ["f.u.c.k"]

    def test_cjk_still_maps_to_original(self) -> None:
        result = self.chinese_filter.check_profanity("123肏456")
        assert result["contains_profanity"] is True
        assert result["profane_words"] == ["肏"]

    def test_f_at_ck_fallback_to_original(self) -> None:
        result = self.english_filter.check_profanity("f@ck")
        assert result["contains_profanity"] is True
        assert result["profane_words"] == ["f@ck"]

    def test_masked_word_does_not_stretch_span(self) -> None:
        # "f******" normalizes to "fuck"; the masked letters must not let the
        # span run away across the rest of the sentence (mark-7 regression).
        text = (
            "I shoved my ass back onto your fingers and then shove my cock "
            "back down your throat f****** myself while f****** your face"
        )
        result = self.english_filter.check_profanity(text)
        assert result["contains_profanity"] is True
        assert result["profane_words"] == ["cock", "ass"]

    def test_unicode_punctuation_shift_does_not_stretch_span(self) -> None:
        # "…" -> ".." shifts positions; the span for "cazzo" must stay tight.
        italian = Filter(
            {
                "languages": ["italian"],
                "detect_leetspeak": True,
                "normalize_unicode": True,
            }
        )
        text = "ti giuro amico…cazzo ci stavi a fare tra un po mi tiravi un schiaffo"
        result = italian.check_profanity(text)
        assert result["contains_profanity"] is True
        assert result["profane_words"] == ["cazzo"]

    def test_repeated_chars_fallback_to_original(self) -> None:
        for text in ("fuuuuuck", "fffffffuck"):
            result = self.english_filter.check_profanity(text)
            assert result["contains_profanity"] is True
            assert result["profane_words"] == [text]

    def test_contains_implies_non_empty_profane_words(self) -> None:
        cases = [
            (self.english_filter, "f@ck"),
            (self.english_filter, "fuuuuuck"),
            (self.english_filter, "say f.u.c.k off"),
            (self.chinese_filter, "123肏456"),
        ]
        for filt, text in cases:
            result = filt.check_profanity(text)
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


class TestAccentFoldedAliases:
    def test_accented_entry_matches_diacritic_free_text(self) -> None:
        f = Filter(
            {
                "languages": [],
                "custom_words": ["erección"],
                "normalize_unicode": True,
                "detect_leetspeak": True,
            }
        )
        assert f.check_profanity("le muerdo la ereccion")["contains_profanity"] is True
        assert f.check_profanity("le muerdo la erección")["contains_profanity"] is True

    def test_short_accented_fold_not_aliased(self) -> None:
        # "año" folds to "ano" (length 3 < floor) so no alias is created,
        # preventing año(year) from over-flagging as ano.
        f = Filter(
            {
                "languages": [],
                "custom_words": ["año"],
                "normalize_unicode": True,
                "detect_leetspeak": True,
            }
        )
        assert f.check_profanity("el ano")["contains_profanity"] is False


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

    def test_fuzzy_does_not_surface_unrelated_dict_substring(self) -> None:
        fuzzy_filter = Filter(
            {
                "languages": ["english"],
                "word_boundaries": False,
                "fuzzy_tolerance_level": 0.6,
                "disable_aho_corasick": True,
            }
        )
        text = "class bno session"
        result = fuzzy_filter.check_profanity(text)
        assert "bs" not in result["profane_words"]
