# Glin-Profanity Python Package

A lightweight and efficient Python package designed to detect and filter profane language in text inputs across multiple languages.

## Features

- 🌍 **Multi-language Support**: Supports 25+ languages including English, Spanish, French, German, Arabic, Chinese, and many more
- 🎯 **Context-Aware Filtering**: Advanced context analysis to reduce false positives
- ⚙️ **Highly Configurable**: Customize word lists, severity levels, and filtering behavior
- 🚀 **High Performance**: Optimized for speed and efficiency
- 🔧 **Easy Integration**: Simple API that works with any Python application
- 📝 **TypeScript Compatible**: Mirrors the API of the TypeScript version

## Installation

```bash
pip install glin-profanity
```

## Quick Start

```python
from glin_profanity import Filter

# Basic usage
filter_instance = Filter()

# Check if text contains profanity
if filter_instance.is_profane("This is a damn example"):
    print("Profanity detected!")

# Get detailed results
result = filter_instance.check_profanity("This is a damn example")
print(result["profane_words"])  # ['damn']
print(result["contains_profanity"])  # True
```

## Configuration Options

```python
from glin_profanity import Filter, SeverityLevel

# Advanced configuration
config = {
    "languages": ["english", "spanish"],  # Specific languages
    "case_sensitive": False,              # Case sensitivity
    "word_boundaries": True,              # Enforce word boundaries
    "replace_with": "***",                # Replacement text
    "severity_levels": True,              # Enable severity detection
    "custom_words": ["badword"],          # Add custom words
    "ignore_words": ["exception"],        # Ignore specific words
    "allow_obfuscated_match": True,       # Detect obfuscated text
    "fuzzy_tolerance_level": 0.8,         # Fuzzy matching threshold
}

filter_instance = Filter(config)
```

## API Reference

### Filter Class

#### `__init__(config: Optional[FilterConfig] = None)`
Initialize the filter with optional configuration.

#### `is_profane(text: str) -> bool`
Check if text contains profanity. Returns `True` if profanity is detected.

#### `check_profanity(text: str) -> CheckProfanityResult`
Perform comprehensive profanity analysis with detailed results.

#### `matches(word: str) -> bool`
Check if a single word matches profanity patterns. Alias for `is_profane()`.

#### `check_profanity_with_min_severity(text: str, min_severity: SeverityLevel) -> Dict`
Check profanity with minimum severity filtering.

### Types

#### `CheckProfanityResult`
```python
{
    "contains_profanity": bool,
    "profane_words": List[str],
    "processed_text": Optional[str],      # If replace_with is set
    "severity_map": Optional[Dict],       # If severity_levels is True
    "matches": Optional[List[Match]],     # Detailed match information
    "context_score": Optional[float],     # Context analysis score
    "reason": Optional[str]               # Analysis reason
}
```

#### `SeverityLevel`
- `SeverityLevel.EXACT`: Exact word match
- `SeverityLevel.FUZZY`: Fuzzy/approximate match

## Supported Languages

Arabic, Chinese, Czech, Danish, English, Esperanto, Finnish, French, German, Hindi, Hungarian, Italian, Japanese, Korean, Norwegian, Persian, Polish, Portuguese, Russian, Spanish, Swedish, Thai, Turkish

## Development

### Setup

```bash
# Clone the repository
git clone https://github.com/GLINCKER/glin-profanity
cd glin-profanity/packages/py

# Install with development dependencies
pip install -e ".[dev]"
```

### Testing

```bash
# Run tests
pytest

# Run tests with coverage
pytest --cov=glin_profanity
```

### Code Quality

```bash
# Format code
black glin_profanity tests

# Sort imports
isort glin_profanity tests

# Type checking
mypy glin_profanity

# Linting
ruff check glin_profanity tests
```

## License

This project is licensed under the MIT License - see the [LICENSE](../../LICENSE) file for details.

## Contributing

Contributions are welcome! Please read our [Contributing Guide](../../CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## Support

- 📖 [Documentation](https://github.com/GLINCKER/glin-profanity)
- 🐛 [Issue Tracker](https://github.com/GLINCKER/glin-profanity/issues)
- 💬 [Discussions](https://github.com/GLINCKER/glin-profanity/discussions)

## Changelog

See [CHANGELOG.md](../../CHANGELOG.md) for a list of changes and updates.