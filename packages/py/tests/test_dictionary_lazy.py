"""Tests for lazy loading behavior of the dictionary."""

from glin_profanity.data.dictionary import DictionaryLoader, dictionary


class TestDictionaryLazy:
    """Test cases for dictionary lazy loading."""

    def test_lazy_loading_initial_state(self) -> None:
        """Test that the dictionary starts with no loaded languages."""
        # Create a new instance to avoid side effects from other tests
        loader = DictionaryLoader()
        assert len(loader._dictionaries) == 0
        assert len(loader.available_languages) == len(loader.LANGUAGE_FILES)

    def test_load_single_language(self) -> None:
        """Test that requesting words for one language loads only that language."""
        loader = DictionaryLoader()

        words = loader.get_words("english")
        assert len(words) > 0
        assert "english" in loader._dictionaries
        assert len(loader._dictionaries) == 1

    def test_load_multiple_languages(self) -> None:
        """Test loading multiple languages sequentially."""
        loader = DictionaryLoader()

        loader.get_words("english")
        assert len(loader._dictionaries) == 1

        loader.get_words("french")
        assert len(loader._dictionaries) == 2
        assert "english" in loader._dictionaries
        assert "french" in loader._dictionaries

    def test_get_all_words_loads_everything(self) -> None:
        """Test that get_all_words forces loading of all languages."""
        loader = DictionaryLoader()

        all_words = loader.get_all_words()
        assert len(all_words) > 0
        assert len(loader._dictionaries) == len(loader.LANGUAGE_FILES)

    def test_global_instance_behavior(self) -> None:
        """
        Test the global instance behavior.

        Note: The global 'dictionary' instance might be modified by other tests
        or imports, so we can't strictly assert its state is empty at start
        if we are running in the same process as other tests.
        However, we can check that it has the correct class attributes.
        """
        assert hasattr(dictionary, "LANGUAGE_FILES")
        assert len(dictionary.available_languages) == 24
