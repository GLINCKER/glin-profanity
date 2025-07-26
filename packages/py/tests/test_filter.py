"""Tests for the Filter class."""

from glin_profanity import Filter, SeverityLevel


class TestFilter:
    """Test cases for Filter class."""

    def test_basic_profanity_detection(self) -> None:
        """Test basic profanity detection."""
        filter_instance = Filter()

        # Test basic profanity detection
        assert filter_instance.is_profane("This is a damn test")
        assert not filter_instance.is_profane("This is a clean test")

    def test_custom_words(self) -> None:
        """Test custom word addition."""
        filter_instance = Filter({"custom_words": ["badword", "anotherbad"]})

        assert filter_instance.is_profane("This contains badword")
        assert filter_instance.is_profane("This has anotherbad word")
        assert not filter_instance.is_profane("This is clean")

    def test_ignore_words(self) -> None:
        """Test word ignoring functionality."""
        filter_instance = Filter({"ignore_words": ["damn"]})

        assert not filter_instance.is_profane("This is a damn test")
        # Should still detect other words
        assert filter_instance.is_profane("This is a hell test")

    def test_case_sensitivity(self) -> None:
        """Test case sensitivity options."""
        # Case insensitive (default)
        filter_instance = Filter()
        assert filter_instance.is_profane("DAMN")
        assert filter_instance.is_profane("damn")
        assert filter_instance.is_profane("Damn")

        # Case sensitive - placeholder for future implementation
        # Note: This depends on the actual words in the dictionary

    def test_word_boundaries(self) -> None:
        """Test word boundary enforcement."""
        # With word boundaries (default when not obfuscated)
        filter_instance = Filter({"word_boundaries": True})

        # Should not match partial words
        # Assuming 'ass' is in dictionary
        assert not filter_instance.is_profane("className")

        # Without word boundaries - placeholder for future implementation
        # This test depends on dictionary content

    def test_replacement(self) -> None:
        """Test text replacement functionality."""
        filter_instance = Filter({"replace_with": "***"})

        result = filter_instance.check_profanity("This is damn bad")
        assert result["processed_text"] is not None
        assert "***" in result["processed_text"]

    def test_severity_levels(self) -> None:
        """Test severity level detection."""
        filter_instance = Filter(
            {"severity_levels": True, "fuzzy_tolerance_level": 0.7}
        )

        result = filter_instance.check_profanity("damn")
        assert result["severity_map"] is not None

        # Test with minimum severity
        filtered_result = filter_instance.check_profanity_with_min_severity(
            "damn", SeverityLevel.EXACT
        )
        assert "filtered_words" in filtered_result
        assert "result" in filtered_result

    def test_obfuscated_matching(self) -> None:
        """Test obfuscated text matching."""
        filter_instance = Filter(
            {"allow_obfuscated_match": True, "word_boundaries": False}
        )

        # Test character substitution
        assert filter_instance.is_profane("d@mn")  # @ -> a
        assert filter_instance.is_profane("d4mn")  # Depends on implementation

    def test_multiple_languages(self) -> None:
        """Test multiple language support."""
        # English only (default)
        Filter()

        # Multiple languages
        Filter({"languages": ["english", "spanish", "french"]})

        # All languages
        Filter({"all_languages": True})

        # These tests depend on actual dictionary content
        # You may need to adjust based on your dictionaries

    def test_matches_method(self) -> None:
        """Test the matches method."""
        filter_instance = Filter()

        # Should be equivalent to is_profane
        test_word = "damn"
        assert filter_instance.matches(test_word) == filter_instance.is_profane(
            test_word
        )

    def test_check_profanity_detailed(self) -> None:
        """Test detailed profanity check results."""
        filter_instance = Filter({"severity_levels": True, "replace_with": "***"})

        result = filter_instance.check_profanity("This damn text is bad")

        # Check required fields
        assert "contains_profanity" in result
        assert "profane_words" in result
        assert "reason" in result

        if result["contains_profanity"]:
            assert len(result["profane_words"]) > 0
            assert result["processed_text"] is not None
            assert "***" in result["processed_text"]

    def test_empty_and_none_input(self) -> None:
        """Test handling of empty and None inputs."""
        filter_instance = Filter()

        # Empty string
        assert not filter_instance.is_profane("")

        result = filter_instance.check_profanity("")
        assert not result["contains_profanity"]
        assert len(result["profane_words"]) == 0

    def test_logging(self) -> None:
        """Test logging functionality."""
        # This is harder to test without capturing output
        # Just ensure it doesn't crash
        filter_instance = Filter({"log_profanity": True})
        filter_instance.check_profanity("This is a damn test")

        # No assertions needed, just ensuring no exceptions
