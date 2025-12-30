"""Main Filter class for profanity detection and filtering."""

from __future__ import annotations

import re
from typing import Literal

from glin_profanity.data.dictionary import dictionary
from glin_profanity.types.types import (
    CheckProfanityResult,
    FilterConfig,
    Match,
    SeverityLevel,
)
from glin_profanity.utils.leetspeak import normalize_leetspeak
from glin_profanity.utils.unicode import normalize_unicode

LeetspeakLevel = Literal["basic", "moderate", "aggressive"]


class Filter:
    """
    Main profanity filter class.

    Provides functionality to detect and filter profane language in text
    with support for multiple languages, leetspeak detection, Unicode
    normalization, custom configurations, and context-aware filtering.

    Examples:
        >>> filter = Filter({"languages": ["english"], "detect_leetspeak": True})
        >>> filter.is_profane("@ss")
        True
        >>> filter.is_profane("fück")  # Unicode normalization
        True
    """

    def __init__(self, config: FilterConfig | None = None) -> None:
        """
        Initialize the profanity filter.

        Args:
            config: Configuration options for the filter
        """
        config = config or {}

        # Basic configuration
        self.case_sensitive = config.get("case_sensitive", False)
        self.allow_obfuscated_match = config.get("allow_obfuscated_match", False)
        self.word_boundaries = config.get(
            "word_boundaries", not self.allow_obfuscated_match
        )
        self.replace_with = config.get("replace_with")
        self.severity_levels = config.get("severity_levels", False)
        self.log_profanity = config.get("log_profanity", False)
        self.fuzzy_tolerance_level = config.get("fuzzy_tolerance_level", 0.8)

        # Context-aware configuration
        self.enable_context_aware = config.get("enable_context_aware", False)
        self.context_window = config.get("context_window", 3)
        self.confidence_threshold = config.get("confidence_threshold", 0.7)

        # Leetspeak and Unicode normalization configuration
        self.detect_leetspeak = config.get("detect_leetspeak", False)
        self.leetspeak_level: LeetspeakLevel = config.get("leetspeak_level", "moderate")
        self.normalize_unicode_enabled = config.get("normalize_unicode", True)

        # Caching configuration
        self.cache_results = config.get("cache_results", False)
        self.max_cache_size = config.get("max_cache_size", 1000)
        self._cache: dict[str, CheckProfanityResult] = {}

        # Initialize word sets
        ignore_words_list = config.get("ignore_words", [])
        self.ignore_words: set[str] = {word.lower() for word in ignore_words_list}

        # Load dictionary words
        self._load_words(config)

    def _load_words(self, config: FilterConfig) -> None:
        """Load profanity words based on configuration."""
        words: list[str] = []

        if config.get("all_languages", False):
            words = dictionary.get_all_words()
        else:
            languages = config.get("languages", ["english"])
            if languages:
                for lang in languages:
                    words.extend(dictionary.get_words(lang))

        # Add custom words if provided
        custom_words = config.get("custom_words")
        if custom_words:
            words.extend(custom_words)

        # Store as set for faster lookup
        self.words: set[str] = {word.lower() for word in words}

    def _debug_log(self, *args: object) -> None:
        """Log debug information if logging is enabled."""
        if self.log_profanity:
            print("[glin-profanity]", *args)  # noqa: T201

    def _normalize_text(self, text: str) -> str:
        """
        Normalize text for profanity detection using all enabled normalization methods.

        Applies Unicode normalization, leetspeak detection, and obfuscation handling.

        Args:
            text: The input text to normalize

        Returns:
            The normalized text
        """
        normalized = text

        # Step 1: Apply Unicode normalization (handles homoglyphs, diacritics, etc.)
        if self.normalize_unicode_enabled:
            normalized = normalize_unicode(normalized)

        # Step 2: Apply leetspeak normalization
        if self.detect_leetspeak:
            normalized = normalize_leetspeak(
                normalized,
                level=self.leetspeak_level,
                collapse_repeated=True,
                remove_spaced_chars=True,
            )

        # Step 3: Apply legacy obfuscation handling (for backward compatibility)
        if self.allow_obfuscated_match and not self.detect_leetspeak:
            normalized = self._normalize_obfuscated(normalized)

        return normalized

    def _normalize_obfuscated(self, text: str) -> str:
        """
        Normalize obfuscated text by replacing common character substitutions.

        Deprecated: Use _normalize_text with detect_leetspeak option instead.
        """
        # Remove repeated characters (e.g., "hiiiii" -> "hii")
        normalized = re.sub(r"([a-zA-Z])\1{1,}", r"\1\1", text)

        # Character substitution map
        char_map = {
            "@": "a",
            "$": "s",
            "!": "i",
            "1": "i",
            "*": "",
        }

        for char, replacement in char_map.items():
            normalized = normalized.replace(char, replacement)

        return normalized

    def clear_cache(self) -> None:
        """Clear the result cache."""
        self._cache.clear()

    def get_cache_size(self) -> int:
        """Get the current cache size."""
        return len(self._cache)

    def get_config(self) -> FilterConfig:
        """
        Export the current filter configuration as a dictionary.

        Useful for saving configuration to files or sharing between environments.

        Returns:
            The current filter configuration

        Examples:
            >>> filter = Filter({
            ...     "languages": ["english", "spanish"],
            ...     "detect_leetspeak": True,
            ...     "leetspeak_level": "aggressive",
            ... })
            >>> config = filter.get_config()
            >>> # Save to file: json.dump(config, open('filter.config.json', 'w'))
            >>> # Later, restore: new_filter = Filter(json.load(open('filter.config.json')))
        """
        return {
            "case_sensitive": self.case_sensitive,
            "word_boundaries": self.word_boundaries,
            "replace_with": self.replace_with,
            "severity_levels": self.severity_levels,
            "ignore_words": list(self.ignore_words),
            "log_profanity": self.log_profanity,
            "allow_obfuscated_match": self.allow_obfuscated_match,
            "fuzzy_tolerance_level": self.fuzzy_tolerance_level,
            "enable_context_aware": self.enable_context_aware,
            "context_window": self.context_window,
            "confidence_threshold": self.confidence_threshold,
            "detect_leetspeak": self.detect_leetspeak,
            "leetspeak_level": self.leetspeak_level,
            "normalize_unicode": self.normalize_unicode_enabled,
            "cache_results": self.cache_results,
            "max_cache_size": self.max_cache_size,
        }

    def get_word_count(self) -> int:
        """
        Return the current word dictionary size.

        Useful for monitoring and debugging.

        Returns:
            Number of words in the dictionary
        """
        return len(self.words)

    def _add_to_cache(self, key: str, result: CheckProfanityResult) -> None:
        """Add a result to the cache, evicting oldest entries if necessary."""
        if not self.cache_results:
            return

        # Simple eviction: remove oldest entry when at capacity
        if len(self._cache) >= self.max_cache_size:
            oldest_key = next(iter(self._cache))
            del self._cache[oldest_key]

        self._cache[key] = result

    def _get_from_cache(self, key: str) -> CheckProfanityResult | None:
        """Get a cached result if available."""
        if not self.cache_results:
            return None
        return self._cache.get(key)

    def _get_regex(self, word: str) -> re.Pattern[str]:
        """Create regex pattern for word matching."""
        flags = 0 if self.case_sensitive else re.IGNORECASE
        escaped_word = re.escape(word)

        pattern = rf"\b{escaped_word}\b" if self.word_boundaries else escaped_word

        return re.compile(pattern, flags)

    def _is_fuzzy_tolerance_match(self, word: str, text: str) -> bool:
        """Check if word matches text within fuzzy tolerance."""
        simplified_text = re.sub(r"[^a-z]", "", text.lower())
        simplified_word = word.lower()

        # If word boundaries are enabled, don't do fuzzy matching
        # that could match across word boundaries
        if self.word_boundaries:
            # Only do fuzzy matching if the word appears as a separate token
            words_in_text = re.findall(r"\b\w+\b", text.lower())
            for text_word in words_in_text:
                if self._fuzzy_match_single_word(simplified_word, text_word):
                    return True
            return False

        # Original fuzzy matching for non-word-boundary mode
        match_count = 0
        index = 0

        for char in simplified_text:
            if index < len(simplified_word) and char == simplified_word[index]:
                match_count += 1
                index += 1

        score = match_count / len(simplified_word) if simplified_word else 0
        return score >= self.fuzzy_tolerance_level

    def _fuzzy_match_single_word(self, pattern_word: str, text_word: str) -> bool:
        """Check if a single word matches the pattern with fuzzy tolerance."""
        # For word boundary mode, require a more exact match
        # The pattern word should be roughly the same length as the text word
        if abs(len(pattern_word) - len(text_word)) > max(1, len(pattern_word) // 2):
            return False

        match_count = 0
        index = 0

        for char in text_word:
            if index < len(pattern_word) and char == pattern_word[index]:
                match_count += 1
                index += 1

        score = match_count / len(pattern_word) if pattern_word else 0
        return score >= self.fuzzy_tolerance_level

    def _evaluate_severity(self, word: str, text: str) -> SeverityLevel | None:
        """Evaluate the severity level of a match."""
        regex = self._get_regex(word)

        if regex.search(text):
            return SeverityLevel.EXACT
        if self._is_fuzzy_tolerance_match(word, text):
            return SeverityLevel.FUZZY

        return None

    def is_profane(self, value: str) -> bool:
        """
        Check if text contains profanity.

        Args:
            value: Text to check

        Returns:
            True if profanity is detected, False otherwise

        Examples:
            >>> filter = Filter({"detect_leetspeak": True})
            >>> filter.is_profane("hello")
            False
            >>> filter.is_profane("@ss")
            True
            >>> filter.is_profane("f u c k")
            True
        """
        # Apply all normalizations
        input_text = self._normalize_text(value)

        for word in self.words:
            if (
                word.lower() not in self.ignore_words
                and self._evaluate_severity(word, input_text) is not None
            ):
                return True

        return False

    def matches(self, word: str) -> bool:
        """
        Check if a single word matches profanity patterns.

        Args:
            word: Word to check

        Returns:
            True if word matches profanity, False otherwise
        """
        return self.is_profane(word)

    def check_profanity(self, text: str) -> CheckProfanityResult:
        """
        Comprehensive profanity check with detailed results.

        Args:
            text: Text to analyze

        Returns:
            Detailed results of profanity analysis

        Examples:
            >>> filter = Filter({"detect_leetspeak": True, "severity_levels": True})
            >>> result = filter.check_profanity("this is @ss")
            >>> result["contains_profanity"]
            True
        """
        # Check cache first
        cached_result = self._get_from_cache(text)
        if cached_result is not None:
            self._debug_log("Cache hit for:", text[:50])
            return cached_result

        # Apply all normalizations
        input_text = self._normalize_text(text)
        input_lower = input_text.lower()

        profane_words: list[str] = []
        severity_map: dict[str, SeverityLevel] = {}
        matches: list[Match] = []

        # Check each word in dictionary
        for dict_word in self.words:
            if dict_word.lower() in self.ignore_words:
                continue

            severity = self._evaluate_severity(dict_word, input_text)
            if severity is not None:
                regex = self._get_regex(dict_word)

                # Find all matches
                for match in regex.finditer(input_text):
                    matched_word = match.group(0)
                    match_index = match.start()

                    profane_words.append(matched_word)
                    severity_map[matched_word] = severity

                    # Create match object
                    match_obj: Match = {
                        "word": matched_word,
                        "index": match_index,
                        "severity": severity,
                    }

                    # TODO: Add context analysis when implemented
                    matches.append(match_obj)

        # Log detected profanity
        if profane_words:
            self._debug_log("Detected:", profane_words)

        # Process text replacement if configured
        processed_text = text
        if self.replace_with and profane_words:
            unique_words = list(set(profane_words))
            for word in unique_words:
                escaped = re.escape(word)
                if self.word_boundaries:
                    replacement_regex = re.compile(rf"\b{escaped}\b", re.IGNORECASE)
                else:
                    replacement_regex = re.compile(escaped, re.IGNORECASE)
                processed_text = replacement_regex.sub(
                    self.replace_with, processed_text
                )

        # Build result
        result: CheckProfanityResult = {
            "contains_profanity": len(profane_words) > 0,
            "profane_words": list(set(profane_words)),
        }

        if self.replace_with:
            result["processed_text"] = processed_text

        if self.severity_levels and severity_map:
            result["severity_map"] = severity_map

        if matches:
            result["matches"] = matches

        result["reason"] = (
            f"Found {len(matches)} potential profanity matches"
            if matches
            else "No profanity detected"
        )

        # Cache the result
        self._add_to_cache(text, result)

        return result

    def check_profanity_with_min_severity(
        self, text: str, min_severity: SeverityLevel = SeverityLevel.EXACT
    ) -> dict[str, object]:
        """
        Check profanity with minimum severity filtering.

        Args:
            text: Text to analyze
            min_severity: Minimum severity level to include

        Returns:
            Dictionary with filtered words and full result
        """
        result = self.check_profanity(text)

        filtered_words = []
        severity_map = result.get("severity_map")
        profane_words = result.get("profane_words")
        if severity_map and profane_words:
            filtered_words = [
                word
                for word in profane_words
                if severity_map.get(word, 0) >= min_severity
            ]

        return {
            "filtered_words": filtered_words,
            "result": result,
        }
