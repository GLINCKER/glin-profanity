"""Main Filter class for profanity detection and filtering."""

from __future__ import annotations

import re
from typing import Callable, Literal

from glin_profanity.data.dictionary import dictionary
from glin_profanity.filters.dictionary_aho_corasick import (
    DictionaryAhoCorasick,
    DictionaryMatch,
    DictionarySearchOptions,
)
from glin_profanity.nlp.context_analyzer import ContextAnalyzer, ContextConfig
from glin_profanity.types.types import (
    CheckProfanityResult,
    FilterConfig,
    Language,
    Match,
    SeverityLevel,
)
from glin_profanity.utils.evasion import normalize_evasion
from glin_profanity.utils.variant_mapping import (
    ProfaneSpan,
    dedupe_profane_spans_by_overlap,
    is_nested_profane_span,
    map_variant_span_to_original,
)
from glin_profanity.utils.leetspeak import (
    normalize_leetspeak,
    normalize_leetspeak_variants,
)
from glin_profanity.utils.unicode import normalize_unicode
from glin_profanity.utils.word_script import (
    WordScript,
    classify_word_script,
    match_has_word_boundary,
)

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
        languages = config.get("languages", ["english"])
        self.primary_language: Language = languages[0] if languages else "english"
        self.context_analyzer: ContextAnalyzer | None = None
        if self.enable_context_aware:
            domain_whitelists = config.get("domain_whitelists") or {}
            self.context_analyzer = ContextAnalyzer(
                ContextConfig(
                    context_window=self.context_window,
                    language=self.primary_language,
                    domain_whitelists=domain_whitelists.get(self.primary_language, []),
                )
            )

        # Leetspeak and Unicode normalization configuration
        self.detect_leetspeak = config.get("detect_leetspeak", False)
        self.leetspeak_level: LeetspeakLevel = config.get("leetspeak_level", "moderate")
        self.normalize_unicode_enabled = config.get("normalize_unicode", True)
        self.enable_evasion_normalization = config.get("enable_evasion_normalization", True)

        # Caching configuration
        self.cache_results = config.get("cache_results", False)
        self.max_cache_size = config.get("max_cache_size", 1000)
        self._cache: dict[str, CheckProfanityResult] = {}
        self._regex_cache: dict[str, re.Pattern[str]] = {}
        self.dictionary_matcher: DictionaryAhoCorasick | None = None

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

        # Store as set for faster lookup; track script per entry for boundary rules
        self.words: set[str] = {word.lower() for word in words}
        self.word_scripts: dict[str, WordScript] = {}
        ac_words: list[str] = []
        seen_ac_keys: set[str] = set()
        for word in words:
            key = word.lower()
            self.word_scripts[key] = classify_word_script(word)
            if key not in seen_ac_keys:
                seen_ac_keys.add(key)
                ac_words.append(word if self.case_sensitive else key)

        if self._should_use_aho_corasick(config):
            self.dictionary_matcher = DictionaryAhoCorasick(ac_words)

    def _should_use_aho_corasick(self, config: FilterConfig) -> bool:
        if config.get("disable_aho_corasick"):
            return False
        return self.word_boundaries or self.enable_context_aware

    def _get_dictionary_search_options(self) -> DictionarySearchOptions:
        return DictionarySearchOptions(
            word_boundaries=self.word_boundaries,
            case_sensitive=self.case_sensitive,
            ignore_words=self.ignore_words,
            word_scripts=self.word_scripts,
        )

    def _debug_log(self, *args: object) -> None:
        """Log debug information if logging is enabled."""
        if self.log_profanity:
            print("[glin-profanity]", *args)  # noqa: T201

    def _get_normalized_variants(self, text: str) -> tuple[str, str]:
        """Compute normal and aggressive normalized text in one pass."""
        base = normalize_evasion(text) if self.enable_evasion_normalization else text

        if self.normalize_unicode_enabled:
            base = normalize_unicode(base)

        if self.detect_leetspeak:
            return normalize_leetspeak_variants(
                base,
                level=self.leetspeak_level,
                collapse_repeated=True,
                remove_spaced_chars=True,
            )

        if self.allow_obfuscated_match and not self.detect_leetspeak:
            obfuscated = self._normalize_obfuscated(base)
            return obfuscated, obfuscated

        return base, base

    def _normalize_text(self, text: str) -> str:
        """
        Normalize text for profanity detection using all enabled normalization methods.

        Applies Unicode normalization, leetspeak detection, and obfuscation handling.

        Args:
            text: The input text to normalize

        Returns:
            The normalized text
        """
        normal, _ = self._get_normalized_variants(text)
        return normal

    def _get_text_variants(self, text: str, lowercase: bool) -> dict[str, str]:
        normal, aggressive = self._get_normalized_variants(text)
        if lowercase:
            return {
                "original": text.lower(),
                "normalized": normal.lower(),
                "aggressive": aggressive.lower(),
            }
        return {
            "original": text,
            "normalized": normal,
            "aggressive": aggressive,
        }

    def _for_each_text_variant(
        self,
        variants: dict[str, str],
        callback: Callable[[str, bool], bool],
    ) -> bool:
        if callback(variants["original"], True):
            return True
        if variants["normalized"] != variants["original"] and callback(
            variants["normalized"], False
        ):
            return True
        if (
            variants["aggressive"] != variants["normalized"]
            and variants["aggressive"] != variants["original"]
            and callback(variants["aggressive"], False)
        ):
            return True
        return False

    def _resolve_ac_match_in_original(
        self,
        original_text: str,
        variant_text: str,
        match: DictionaryMatch,
        is_original_variant: bool,
    ) -> tuple[str, int, int]:
        span = map_variant_span_to_original(
            original_text,
            variant_text,
            match.start,
            match.end,
        )
        return span.matched_text, span.start, span.end

    def _resolve_regex_match_in_original(
        self,
        original_text: str,
        variant_text: str,
        match_start: int,
        match_end: int,
        matched_word: str,
        is_original_variant: bool,
    ) -> tuple[str, int, int]:
        span = map_variant_span_to_original(
            original_text,
            variant_text,
            match_start,
            match_end,
        )
        return span.matched_text, span.start, span.end

    def _evaluate_severity_on_variants(
        self, word: str, variants: dict[str, str]
    ) -> SeverityLevel | None:
        severity = self._evaluate_severity(word, variants["original"])
        if severity is not None:
            return severity

        if variants["normalized"] != variants["original"]:
            severity = self._evaluate_severity(word, variants["normalized"])
            if severity is not None:
                return severity

        if (
            variants["aggressive"] != variants["normalized"]
            and variants["aggressive"] != variants["original"]
        ):
            return self._evaluate_severity(word, variants["aggressive"])

        return None

    def _profane_words_from_spans(
        self,
        spans: list[ProfaneSpan],
        severity_map: dict[str, SeverityLevel] | None = None,
    ) -> tuple[set[str], dict[str, SeverityLevel]]:
        deduped = dedupe_profane_spans_by_overlap(spans)
        source_severity = severity_map or {}
        words = {word for word, _start, _end in deduped if word}
        resolved_severity = {
            word: source_severity.get(word, SeverityLevel.EXACT) for word in words
        }
        return words, resolved_severity

    def _collect_matches_from_variant(
        self,
        dict_word: str,
        variant_text: str,
        original_text: str,
        severity: SeverityLevel,
        profane_spans: list[ProfaneSpan],
        severity_map: dict[str, SeverityLevel],
        matches: list[Match],
        is_original_variant: bool,
    ) -> None:
        regex = self._get_regex(dict_word)
        script = self._get_word_script(dict_word)

        for match in regex.finditer(variant_text):
            start = match.start()
            end = match.end()
            if not match_has_word_boundary(
                variant_text, start, end, script, self.word_boundaries
            ):
                continue

            matched_word, resolved_start, resolved_end = (
                self._resolve_regex_match_in_original(
                    original_text,
                    variant_text,
                    start,
                    end,
                    match.group(0) if is_original_variant else dict_word,
                    is_original_variant,
                )
            )
            if not matched_word:
                continue

            profane_spans.append((matched_word, resolved_start, resolved_end))
            if matched_word not in severity_map:
                severity_map[matched_word] = severity

            matches.append(
                {
                    "word": matched_word,
                    "index": resolved_start,
                    "severity": severity,
                }
            )

    def _collect_profane_spans_from_variant_ac(
        self,
        text: str,
        variant_text: str,
    ) -> list[ProfaneSpan]:
        matcher = self.dictionary_matcher
        if matcher is None:
            return []

        options = self._get_dictionary_search_options()
        spans: list[ProfaneSpan] = []

        for match in matcher.find_matches(variant_text, options):
            matched_word, start, end = self._resolve_ac_match_in_original(
                text,
                variant_text,
                match,
                False,
            )
            if matched_word:
                spans.append((matched_word, start, end))

        return spans

    def _collect_profane_spans_ac(
        self,
        text: str,
        variants: dict[str, str],
        contains_profanity: bool = False,
    ) -> list[ProfaneSpan]:
        spans = self._collect_profane_spans_from_variant_ac(
            text, variants["normalized"]
        )
        if spans or not contains_profanity:
            return dedupe_profane_spans_by_overlap(spans)

        if variants["original"] != variants["normalized"]:
            spans = self._collect_profane_spans_from_variant_ac(
                text, variants["original"]
            )
            if spans:
                return dedupe_profane_spans_by_overlap(spans)

        if (
            variants["aggressive"] != variants["normalized"]
            and variants["aggressive"] != variants["original"]
        ):
            spans = self._collect_profane_spans_from_variant_ac(
                text, variants["aggressive"]
            )

        return dedupe_profane_spans_by_overlap(spans)

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
        self._regex_cache.clear()

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
            "enable_evasion_normalization": self.enable_evasion_normalization,
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

    def _get_word_script(self, word: str) -> WordScript:
        return self.word_scripts.get(word, classify_word_script(word))

    def _get_regex(self, word: str) -> re.Pattern[str]:
        """Create regex pattern for word matching."""
        script = self._get_word_script(word)
        cache_key = f"{script}:{word}"
        if cache_key in self._regex_cache:
            return self._regex_cache[cache_key]

        flags = 0 if self.case_sensitive else re.IGNORECASE
        escaped_word = re.escape(word)
        use_latin_boundary = self.word_boundaries and script == "latin"
        boundary = r"\b" if use_latin_boundary else ""
        pattern = f"{boundary}{escaped_word}{boundary}"

        regex = re.compile(pattern, flags)
        self._regex_cache[cache_key] = regex
        return regex

    def _get_replacement_regex(self, word: str) -> re.Pattern[str]:
        escaped = re.escape(word)
        if not self.word_boundaries:
            return re.compile(escaped, re.IGNORECASE)
        if classify_word_script(word) == "cjk":
            return re.compile(escaped, re.IGNORECASE)
        return re.compile(rf"\b{escaped}\b", re.IGNORECASE)

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
        script = self._get_word_script(word)
        regex = self._get_regex(word)

        if script == "cjk" and self.word_boundaries:
            for match in regex.finditer(text):
                start = match.start()
                end = match.end()
                if match_has_word_boundary(text, start, end, script, True):
                    return SeverityLevel.EXACT
            return None

        if regex.search(text):
            return SeverityLevel.EXACT
        if not self.word_boundaries and self._is_fuzzy_tolerance_match(word, text):
            return SeverityLevel.FUZZY

        return None

    def _is_profane_with_aho_corasick(self, value: str) -> bool:
        variants = self._get_text_variants(value, False)
        options = self._get_dictionary_search_options()
        matcher = self.dictionary_matcher
        assert matcher is not None

        def check_variant(variant_text: str, _is_original: bool) -> bool:
            return matcher.has_any_match(variant_text, options)

        return self._for_each_text_variant(variants, check_variant)

    def _is_profane_legacy(self, value: str) -> bool:
        variants = self._get_text_variants(value, False)

        for word in self.words:
            if word.lower() in self.ignore_words:
                continue
            if self._evaluate_severity_on_variants(word, variants) is not None:
                return True

        return False

    def _check_profanity_with_aho_corasick(self, text: str) -> CheckProfanityResult:
        variants = self._get_text_variants(text, True)
        severity_map: dict[str, SeverityLevel] = {}
        contains_profanity = self._is_profane_with_aho_corasick(text)
        profane_spans = self._collect_profane_spans_ac(
            text, variants, contains_profanity=contains_profanity
        )
        profane_words, severity_map = self._profane_words_from_spans(
            profane_spans, severity_map
        )
        return self._build_profanity_result(
            text,
            profane_words,
            severity_map,
            contains_profanity=contains_profanity,
        )

    def _collect_legacy_spans_from_variant(
        self,
        text: str,
        variants: dict[str, str],
        variant_key: str,
        is_original_variant: bool,
        profane_spans: list[ProfaneSpan],
        severity_map: dict[str, SeverityLevel],
        matches: list[Match],
    ) -> None:
        variant_text = variants[variant_key]
        for dict_word in self.words:
            if dict_word.lower() in self.ignore_words:
                continue

            severity = self._evaluate_severity(dict_word, variant_text)
            if severity is None:
                continue

            if not self.word_boundaries and severity == SeverityLevel.FUZZY:
                if dict_word not in severity_map:
                    profane_spans.append((dict_word, 0, len(dict_word)))
                    severity_map[dict_word] = severity
                    matches.append(
                        {
                            "word": dict_word,
                            "index": 0,
                            "severity": severity,
                        }
                    )
                continue

            self._collect_matches_from_variant(
                    dict_word,
                    variant_text,
                    text,
                    severity,
                    profane_spans,
                    severity_map,
                    matches,
                    is_original_variant,
                )

    def _check_profanity_legacy_non_context(self, text: str) -> CheckProfanityResult:
        variants = self._get_text_variants(text, True)
        profane_spans: list[ProfaneSpan] = []
        severity_map: dict[str, SeverityLevel] = {}
        matches: list[Match] = []
        contains_profanity = False

        for dict_word in self.words:
            if dict_word.lower() in self.ignore_words:
                continue

            if self._evaluate_severity_on_variants(dict_word, variants) is not None:
                contains_profanity = True

        self._collect_legacy_spans_from_variant(
            text,
            variants,
            "normalized",
            False,
            profane_spans,
            severity_map,
            matches,
        )
        if not profane_spans and contains_profanity:
            if variants["original"] != variants["normalized"]:
                self._collect_legacy_spans_from_variant(
                    text,
                    variants,
                    "original",
                    True,
                    profane_spans,
                    severity_map,
                    matches,
                )
            if (
                not profane_spans
                and variants["aggressive"] != variants["normalized"]
                and variants["aggressive"] != variants["original"]
            ):
                self._collect_legacy_spans_from_variant(
                    text,
                    variants,
                    "aggressive",
                    False,
                    profane_spans,
                    severity_map,
                    matches,
                )

        profane_words, severity_map = self._profane_words_from_spans(
            profane_spans, severity_map
        )
        result = self._build_profanity_result(
            text,
            profane_words,
            severity_map,
            contains_profanity=contains_profanity,
        )
        if matches:
            deduped_words = set(result["profane_words"])
            result["matches"] = [
                match for match in matches if match["word"] in deduped_words
            ]
        return result

    def _dedupe_nested_profane_words(self, words: list[str]) -> list[str]:
        return [
            word
            for word in words
            if not any(
                other != word and is_nested_profane_span(word, other)
                for other in words
            )
        ]

    def _build_profanity_result(
        self,
        text: str,
        profane_words: set[str],
        severity_map: dict[str, SeverityLevel],
        contains_profanity: bool | None = None,
    ) -> CheckProfanityResult:
        profane_word_list = sorted(
            self._dedupe_nested_profane_words(list(profane_words)),
            key=lambda word: (-len(word), word),
        )
        processed_text = text

        if self.replace_with and profane_word_list:
            for word in profane_word_list:
                replacement_regex = self._get_replacement_regex(word)
                processed_text = replacement_regex.sub(self.replace_with, processed_text)

        flagged = (
            contains_profanity
            if contains_profanity is not None
            else len(profane_word_list) > 0
        )
        result: CheckProfanityResult = {
            "contains_profanity": flagged,
            "profane_words": profane_word_list,
            "reason": (
                f"Found {len(profane_word_list)} potential profanity matches"
                if flagged
                else "No profanity detected"
            ),
        }

        if self.replace_with:
            result["processed_text"] = processed_text

        if self.severity_levels and severity_map:
            result["severity_map"] = severity_map

        return result

    def _passes_context_filter(
        self, text: str, matched_word: str, match_index: int
    ) -> bool:
        if not self.context_analyzer:
            return True
        context_result = self.context_analyzer.analyze_context(
            text, matched_word, match_index
        )
        return not (
            context_result.is_whitelisted
            or context_result.context_score > self.confidence_threshold
        )

    def _record_context_aware_match(
        self,
        text: str,
        matched_word: str,
        match_index: int,
        severity: SeverityLevel,
        profane_words: list[str],
        severity_map: dict[str, SeverityLevel],
        matches: list[Match],
        seen: set[str],
    ) -> None:
        dedupe_key = f"{matched_word}:{match_index}"
        if dedupe_key in seen:
            return

        match_obj: Match = {
            "word": matched_word,
            "index": match_index,
            "severity": severity,
        }

        if self.context_analyzer:
            context_result = self.context_analyzer.analyze_context(
                text, matched_word, match_index
            )
            match_obj["context_score"] = context_result.context_score
            match_obj["reason"] = context_result.reason
            match_obj["is_whitelisted"] = context_result.is_whitelisted
            if (
                context_result.is_whitelisted
                or context_result.context_score > self.confidence_threshold
            ):
                return

        seen.add(dedupe_key)
        profane_words.append(matched_word)
        if matched_word not in severity_map:
            severity_map[matched_word] = severity
        matches.append(match_obj)

    def _collect_context_aware_candidates_from_ac(
        self,
        text: str,
        variants: dict[str, str],
        profane_words: list[str],
        severity_map: dict[str, SeverityLevel],
        matches: list[Match],
        seen: set[str],
        variant_key: str = "normalized",
    ) -> None:
        options = self._get_dictionary_search_options()
        matcher = self.dictionary_matcher
        assert matcher is not None
        variant_text = variants[variant_key]

        for match in matcher.find_matches(variant_text, options):
            matched_word, start, _ = self._resolve_ac_match_in_original(
                text,
                variant_text,
                match,
                False,
            )
            self._record_context_aware_match(
                text,
                matched_word,
                start,
                SeverityLevel.EXACT,
                profane_words,
                severity_map,
                matches,
                seen,
            )

    def _collect_context_aware_candidates_from_ac_with_fallback(
        self,
        text: str,
        variants: dict[str, str],
        profane_words: list[str],
        severity_map: dict[str, SeverityLevel],
        matches: list[Match],
        seen: set[str],
    ) -> None:
        self._collect_context_aware_candidates_from_ac(
            text, variants, profane_words, severity_map, matches, seen
        )
        if profane_words:
            return

        if variants["original"] != variants["normalized"]:
            self._collect_context_aware_candidates_from_ac(
                text,
                variants,
                profane_words,
                severity_map,
                matches,
                seen,
                variant_key="original",
            )
        if profane_words:
            return

        if (
            variants["aggressive"] != variants["normalized"]
            and variants["aggressive"] != variants["original"]
        ):
            self._collect_context_aware_candidates_from_ac(
                text,
                variants,
                profane_words,
                severity_map,
                matches,
                seen,
                variant_key="aggressive",
            )

    def _collect_context_aware_candidates_from_legacy_fuzzy(
        self,
        text: str,
        variants: dict[str, str],
        profane_words: list[str],
        severity_map: dict[str, SeverityLevel],
        matches: list[Match],
        seen: set[str],
    ) -> None:
        for dict_word in self.words:
            if dict_word.lower() in self.ignore_words:
                continue

            if self._evaluate_severity(dict_word, variants["normalized"]) != SeverityLevel.FUZZY:
                continue
            self._record_context_aware_match(
                text,
                dict_word,
                0,
                SeverityLevel.FUZZY,
                profane_words,
                severity_map,
                matches,
                seen,
            )

    def _collect_context_aware_candidates_from_legacy(
        self,
        text: str,
        variants: dict[str, str],
        profane_words: list[str],
        severity_map: dict[str, SeverityLevel],
        matches: list[Match],
        seen: set[str],
        variant_key: str = "normalized",
    ) -> None:
        variant_text = variants[variant_key]
        is_original = variant_key == "original"

        for dict_word in self.words:
            if dict_word.lower() in self.ignore_words:
                continue

            severity = self._evaluate_severity(dict_word, variant_text)
            if severity is None:
                continue

            if not self.word_boundaries and severity == SeverityLevel.FUZZY:
                self._record_context_aware_match(
                    text,
                    dict_word,
                    0,
                    severity,
                    profane_words,
                    severity_map,
                    matches,
                    seen,
                )
                continue

            regex = self._get_regex(dict_word)
            script = self._get_word_script(dict_word)
            for match in regex.finditer(variant_text):
                start = match.start()
                end = match.end()
                if not match_has_word_boundary(
                    variant_text, start, end, script, self.word_boundaries
                ):
                    continue
                matched_word, resolved_start, _ = self._resolve_regex_match_in_original(
                    text,
                    variant_text,
                    start,
                    end,
                    match.group(0) if is_original else dict_word,
                    is_original,
                )
                self._record_context_aware_match(
                    text,
                    matched_word,
                    resolved_start,
                    severity,
                    profane_words,
                    severity_map,
                    matches,
                    seen,
                )

    def _collect_context_aware_candidates_from_legacy_with_fallback(
        self,
        text: str,
        variants: dict[str, str],
        profane_words: list[str],
        severity_map: dict[str, SeverityLevel],
        matches: list[Match],
        seen: set[str],
    ) -> None:
        self._collect_context_aware_candidates_from_legacy(
            text, variants, profane_words, severity_map, matches, seen
        )
        if profane_words:
            return

        if variants["original"] != variants["normalized"]:
            self._collect_context_aware_candidates_from_legacy(
                text,
                variants,
                profane_words,
                severity_map,
                matches,
                seen,
                variant_key="original",
            )
        if profane_words:
            return

        if (
            variants["aggressive"] != variants["normalized"]
            and variants["aggressive"] != variants["original"]
        ):
            self._collect_context_aware_candidates_from_legacy(
                text,
                variants,
                profane_words,
                severity_map,
                matches,
                seen,
                variant_key="aggressive",
            )

    def _build_context_aware_result(
        self,
        text: str,
        profane_words: list[str],
        severity_map: dict[str, SeverityLevel],
        matches: list[Match],
        contains_profanity: bool | None = None,
    ) -> CheckProfanityResult:
        profane_word_list = sorted(
            self._dedupe_nested_profane_words(list(dict.fromkeys(profane_words))),
            key=lambda word: (-len(word), word),
        )
        processed_text = text
        if self.replace_with and profane_word_list:
            for word in profane_word_list:
                processed_text = self._get_replacement_regex(word).sub(
                    self.replace_with, processed_text
                )

        context_score: float | None = None
        if matches:
            context_score = sum(
                match.get("context_score") or 0.5 for match in matches
            ) / len(matches)

        flagged = (
            contains_profanity
            if contains_profanity is not None
            else len(profane_word_list) > 0
        )
        result: CheckProfanityResult = {
            "contains_profanity": flagged,
            "profane_words": profane_word_list,
            "reason": (
                f"Found {len(profane_word_list)} potential profanity matches"
                if flagged
                else "No profanity detected"
            ),
        }

        if self.replace_with and profane_word_list:
            result["processed_text"] = processed_text
        if self.severity_levels and severity_map:
            result["severity_map"] = severity_map
        if matches:
            result["matches"] = sorted(
                matches, key=lambda match: (match["index"], match["word"])
            )
        if context_score is not None:
            result["context_score"] = context_score

        return result

    def _check_profanity_with_context_aware(self, text: str) -> CheckProfanityResult:
        variants = self._get_text_variants(text, True)
        contains_profanity = self._is_profane_with_context_aware(text)
        profane_words: list[str] = []
        severity_map: dict[str, SeverityLevel] = {}
        matches: list[Match] = []
        seen: set[str] = set()

        if self.dictionary_matcher:
            self._collect_context_aware_candidates_from_ac_with_fallback(
                text, variants, profane_words, severity_map, matches, seen
            )
            if not self.word_boundaries:
                self._collect_context_aware_candidates_from_legacy_fuzzy(
                    text, variants, profane_words, severity_map, matches, seen
                )
        else:
            self._collect_context_aware_candidates_from_legacy_with_fallback(
                text, variants, profane_words, severity_map, matches, seen
            )

        if profane_words:
            self._debug_log("Detected:", profane_words)

        return self._build_context_aware_result(
            text,
            profane_words,
            severity_map,
            matches,
            contains_profanity=contains_profanity,
        )

    def _has_context_aware_ac_match(self, text: str, variants: dict[str, str]) -> bool:
        options = self._get_dictionary_search_options()
        matcher = self.dictionary_matcher
        assert matcher is not None

        def has_flagged_match(variant_text: str, is_original: bool) -> bool:
            for match in matcher.find_matches(variant_text, options):
                matched_word, start, _ = self._resolve_ac_match_in_original(
                    text, variant_text, match, is_original
                )
                if self._passes_context_filter(text, matched_word, start):
                    return True
            return False

        return self._for_each_text_variant(variants, has_flagged_match)

    def _has_context_aware_legacy_match_for_word(
        self, text: str, variants: dict[str, str], dict_word: str
    ) -> bool:
        def check_variant(variant_text: str, is_original: bool) -> bool:
            severity = self._evaluate_severity(dict_word, variant_text)
            if severity is None:
                return False

            if not self.word_boundaries and severity == SeverityLevel.FUZZY:
                return self._passes_context_filter(text, dict_word, 0)

            regex = self._get_regex(dict_word)
            script = self._get_word_script(dict_word)
            for match in regex.finditer(variant_text):
                start = match.start()
                end = match.end()
                if not match_has_word_boundary(
                    variant_text, start, end, script, self.word_boundaries
                ):
                    continue
                matched_word, resolved_start, _ = self._resolve_regex_match_in_original(
                    text,
                    variant_text,
                    start,
                    end,
                    match.group(0) if is_original else dict_word,
                    is_original,
                )
                if self._passes_context_filter(text, matched_word, resolved_start):
                    return True
            return False

        if check_variant(variants["original"], True):
            return True
        if variants["normalized"] != variants["original"] and check_variant(
            variants["normalized"], False
        ):
            return True
        if (
            variants["aggressive"] != variants["normalized"]
            and variants["aggressive"] != variants["original"]
            and check_variant(variants["aggressive"], False)
        ):
            return True
        return False

    def _has_context_aware_legacy_fuzzy_match(
        self, text: str, variants: dict[str, str]
    ) -> bool:
        for dict_word in self.words:
            if dict_word.lower() in self.ignore_words:
                continue
            if self._has_context_aware_legacy_fuzzy_match_for_word(
                text, variants, dict_word
            ):
                return True
        return False

    def _has_context_aware_legacy_fuzzy_match_for_word(
        self, text: str, variants: dict[str, str], dict_word: str
    ) -> bool:
        def check_variant(variant_text: str) -> bool:
            if self._evaluate_severity(dict_word, variant_text) != SeverityLevel.FUZZY:
                return False
            return self._passes_context_filter(text, dict_word, 0)

        if check_variant(variants["original"]):
            return True
        if variants["normalized"] != variants["original"] and check_variant(
            variants["normalized"]
        ):
            return True
        if (
            variants["aggressive"] != variants["normalized"]
            and variants["aggressive"] != variants["original"]
            and check_variant(variants["aggressive"])
        ):
            return True
        return False

    def _has_context_aware_legacy_match(self, text: str, variants: dict[str, str]) -> bool:
        for dict_word in self.words:
            if dict_word.lower() in self.ignore_words:
                continue
            if self._has_context_aware_legacy_match_for_word(text, variants, dict_word):
                return True
        return False

    def _is_profane_with_context_aware(self, value: str) -> bool:
        variants = self._get_text_variants(value, False)
        if self.dictionary_matcher:
            if self._has_context_aware_ac_match(value, variants):
                return True
            if not self.word_boundaries and self._has_context_aware_legacy_fuzzy_match(
                value, variants
            ):
                return True
            return False
        return self._has_context_aware_legacy_match(value, variants)

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
        if self.enable_context_aware:
            return self._is_profane_with_context_aware(value)
        if self.dictionary_matcher:
            return self._is_profane_with_aho_corasick(value)
        return self._is_profane_legacy(value)

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

        if not self.enable_context_aware:
            result = (
                self._check_profanity_with_aho_corasick(text)
                if self.dictionary_matcher
                else self._check_profanity_legacy_non_context(text)
            )
            if result["contains_profanity"]:
                self._debug_log("Detected:", result.get("profane_words", []))
            self._add_to_cache(text, result)
            return result

        result = self._check_profanity_with_context_aware(text)
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
