"""Tests for evasion normalization utilities."""

from glin_profanity import Filter
from glin_profanity.utils.evasion import (
    collapse_separated_characters,
    normalize_evasion,
    strip_html_and_decode_entities,
)
from glin_profanity.utils.unicode import normalize_unicode


class TestEvasionUtilities:
    def test_strip_html_and_decode_entities(self) -> None:
        assert strip_html_and_decode_entities("sh&#105;t") == "shit"
        assert strip_html_and_decode_entities("f<b>u</b>ck") == "fuck"
        assert strip_html_and_decode_entities("a<br>ss") == "ass"

    def test_collapse_separated_characters(self) -> None:
        assert collapse_separated_characters("f.u.c.k") == "fuck"
        assert collapse_separated_characters("f_u_c_k") == "fuck"
        assert collapse_separated_characters("b-i-t-c-h") == "bitch"
        assert collapse_separated_characters("hello.world") == "hello.world"

    def test_normalize_evasion_pipeline(self) -> None:
        assert normalize_evasion("f.u.c.k") == "fuck"
        assert normalize_evasion("This is f*cking ridiculous") == "This is fucking ridiculous"
        assert normalize_evasion("holy f*** that was amazing") == "holy fuck that was amazing"
        assert normalize_evasion("go f yourself") == "go fuck yourself"


class TestEvasionFilterDetection:
    @classmethod
    def setup_class(cls) -> None:
        cls.filter = Filter(
            {
                "languages": ["english"],
                "detect_leetspeak": True,
                "leetspeak_level": "aggressive",
                "normalize_unicode": True,
            }
        )

    def test_detects_shootout_miss_categories(self) -> None:
        cases = [
            "shi7e",
            "fսck",
            "f.u.c.k",
            "f_u_c_k",
            "f-u-c-k",
            "s.h.i.t",
            "b-i-t-c-h",
            "a<br>ss",
            "f<b>u</b>ck",
            "sh&#105;t",
            "This is f*cking ridiculous",
            "holy f*** that was amazing",
            "go f yourself",
            "what a f@cking mess",
        ]
        for text in cases:
            assert self.filter.is_profane(text), f"expected profane: {text!r}"

    def test_does_not_flag_false_positive_traps(self) -> None:
        traps = [
            "scunthorpe",
            "classic",
            "assassinate",
            "Penistone is a town in South Yorkshire",
            "shitake mushrooms are delicious",
        ]
        for text in traps:
            assert not self.filter.is_profane(text), f"unexpected profane: {text!r}"

    def test_armenian_homoglyph_normalizes_to_ascii(self) -> None:
        assert normalize_unicode("fսck") == "fuck"
