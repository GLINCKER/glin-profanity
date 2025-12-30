"""Dictionary loader for profanity word lists."""

import json
from pathlib import Path

from glin_profanity.types.types import Language


class DictionaryLoader:
    """Loads profanity dictionaries from shared JSON files."""

    def __init__(self) -> None:
        """Initialize dictionary loader."""
        # Get path to shared dictionaries (relative to this file)
        current_dir = Path(__file__).parent
        self._dict_path = (
            current_dir.parent.parent.parent.parent / "shared" / "dictionaries"
        )
        self._dictionaries: dict[str, list[str]] = {}
        self._load_dictionaries()

    def _raise_format_error(self, filename: str) -> None:
        """Raise a ValueError for unexpected file format."""
        msg = f"Unexpected format in {filename}"
        raise ValueError(msg)

    def _load_dictionaries(self) -> None:
        """Load all dictionary files from shared directory."""
        language_files = {
            "arabic": "arabic.json",
            "chinese": "chinese.json",
            "czech": "czech.json",
            "danish": "danish.json",
            "dutch": "dutch.json",
            "english": "english.json",
            "esperanto": "esperanto.json",
            "finnish": "finnish.json",
            "french": "french.json",
            "german": "german.json",
            "hindi": "hindi.json",
            "hungarian": "hungarian.json",
            "italian": "italian.json",
            "japanese": "japanese.json",
            "korean": "korean.json",
            "norwegian": "Norwegian.json",
            "persian": "persian.json",
            "polish": "polish.json",
            "portuguese": "portuguese.json",
            "russian": "russian.json",
            "spanish": "spanish.json",
            "swedish": "swedish.json",
            "thai": "thai.json",
            "turkish": "turkish.json",
        }

        for language, filename in language_files.items():
            file_path = self._dict_path / filename
            try:
                with file_path.open(encoding="utf-8") as f:
                    data = json.load(f)
                    # Handle both {"words": [...]} and [...] formats
                    if isinstance(data, dict) and "words" in data:
                        self._dictionaries[language] = data["words"]
                    elif isinstance(data, list):
                        self._dictionaries[language] = data
                    else:
                        self._raise_format_error(filename)
            except (FileNotFoundError, json.JSONDecodeError, ValueError) as e:
                print(f"Warning: Could not load {filename}: {e}")  # noqa: T201
                self._dictionaries[language] = []

    def get_words(self, language: Language) -> list[str]:
        """Get words for a specific language."""
        return self._dictionaries.get(language, [])

    def get_all_words(self) -> list[str]:
        """Get all words from all languages."""
        all_words = []
        for words in self._dictionaries.values():
            all_words.extend(words)
        return list(set(all_words))  # Remove duplicates

    @property
    def available_languages(self) -> list[str]:
        """Get list of available languages."""
        return list(self._dictionaries.keys())


# Global instance
dictionary = DictionaryLoader()
