"""Tests for variant-to-original span mapping."""

from glin_profanity.utils.variant_mapping import (
    is_nested_profane_span,
    map_variant_span_to_original,
    trim_profane_span_edges,
)


class TestVariantMapping:
    def test_maps_collapsed_separators(self) -> None:
        original = "say f.u.c.k off"
        variant = "say fuck off"
        span = map_variant_span_to_original(original, variant, 4, 8)
        assert span.matched_text == "f.u.c.k"
        assert original[span.start : span.end] == "f.u.c.k"

    def test_maps_leetspeak_substitutions(self) -> None:
        span = map_variant_span_to_original("@ss", "ass", 0, 3)
        assert span.matched_text == "@ss"

    def test_maps_repeated_character_collapse(self) -> None:
        span = map_variant_span_to_original("fuuuuuck", "fuck", 0, 4)
        assert span.matched_text == "fuuuuuck"

    def test_maps_asterisk_masking(self) -> None:
        span = map_variant_span_to_original("holy f***", "holy fuck", 5, 9)
        assert span.matched_text == "f***"

    def test_maps_unicode_homoglyphs(self) -> None:
        original = "fυck you"
        variant = "fuck you"
        span = map_variant_span_to_original(original, variant, 0, 4)
        assert span.matched_text == "fυck"

    def test_maps_lowercased_original_tier_to_mixed_case(self) -> None:
        original = "What a FUCK"
        variant = "what a fuck"
        span = map_variant_span_to_original(original, variant, 7, 11)
        assert span.matched_text == "FUCK"

    def test_identity_when_texts_match(self) -> None:
        text = "plain fuck here"
        span = map_variant_span_to_original(text, text, 6, 10)
        assert span.matched_text == "fuck"
        assert span.start == 6
        assert span.end == 10

    def test_maps_accent_stripped_variant_to_original_word(self) -> None:
        original = " mamá se fue?"
        variant = " mama se fue?"
        span = map_variant_span_to_original(original, variant, 1, 5)
        assert span.matched_text == "mamá"

    def test_maps_leetspeak_parenthesis_substitution(self) -> None:
        original = "(miro su camel toe bien marcado en sus tangas)"
        variant = "cmiro su camel toe bien marcado en sus tangas)"
        span = map_variant_span_to_original(original, variant, 9, 18)
        assert span.matched_text == "camel toe"

    def test_trims_leading_dots_from_gay(self) -> None:
        span = trim_profane_span_edges("Sei un...gay?", 7, 12)
        assert span.matched_text == "gay"


class TestNestedProfaneSpan:
    def test_detects_nested_spans(self) -> None:
        assert is_nested_profane_span("sh!t", "piece of sh!t")

    def test_ignores_ass_inside_classic(self) -> None:
        assert not is_nested_profane_span("ass", "classic")
