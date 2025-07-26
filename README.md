# Glin-Profanity

[![npm version](https://badge.fury.io/js/glin-profanity.svg)](https://www.npmjs.com/package/glin-profanity)
[![PyPI version](https://badge.fury.io/py/glin-profanity.svg)](https://pypi.org/project/glin-profanity/)
[![CI](https://github.com/GLINCKER/glin-profanity/workflows/CI/badge.svg)](https://github.com/GLINCKER/glin-profanity/actions)
[![codecov](https://codecov.io/gh/GLINCKER/glin-profanity/branch/main/graph/badge.svg)](https://codecov.io/gh/GLINCKER/glin-profanity)

A lightweight and efficient profanity detection and filtering library available for both **JavaScript/TypeScript** and **Python**. Detects and filters profane language in text inputs across **25+ languages** with context-aware filtering and customizable configurations.

## 🌟 Features

- 🌍 **Multi-language Support**: 25+ languages including English, Spanish, French, German, Arabic, Chinese, and more
- 🎯 **Context-Aware Filtering**: Advanced context analysis to reduce false positives  
- ⚙️ **Highly Configurable**: Customize word lists, severity levels, and filtering behavior
- 🚀 **High Performance**: Optimized for speed and efficiency
- 🔧 **Easy Integration**: Simple API that works with any JavaScript or Python application
- 📝 **Unified API**: Identical functionality across both languages
- 🧪 **Well Tested**: Comprehensive test suite ensuring reliability

## 📁 Monorepo Structure

```
glin-profanity/
├── packages/
│   ├── js/                    # JavaScript/TypeScript package
│   │   ├── src/               # TypeScript source code
│   │   ├── lib/               # Built CJS + ESM outputs
│   │   ├── tests/             # Jest test suite
│   │   └── package.json       # npm package configuration
│   └── py/                    # Python package  
│       ├── glin_profanity/    # Python source code
│       ├── tests/             # pytest test suite
│       └── pyproject.toml     # Python package configuration
├── shared/
│   └── dictionaries/          # JSON word lists (25+ languages)
├── tests/                     # Cross-language parity tests
├── scripts/                   # Build and release utilities
└── .github/workflows/         # CI/CD pipelines
```

## 🚀 Quick Start

### JavaScript/TypeScript

```bash
npm install glin-profanity
```

```typescript
import { Filter } from 'glin-profanity';

// Basic usage
const filter = new Filter();

// Check if text contains profanity
if (filter.isProfane("This is a damn example")) {
    console.log("Profanity detected!");
}

// Get detailed results
const result = filter.checkProfanity("This is a damn example");
console.log(result.profaneWords); // ['damn']
console.log(result.containsProfanity); // true
```

### Python

```bash
pip install glin-profanity
```

```python
from glin_profanity import Filter

# Basic usage
filter_instance = Filter()

# Check if text contains profanity  
if filter_instance.is_profane("This is a damn example"):
    print("Profanity detected!")

# Get detailed results
result = filter_instance.check_profanity("This is a damn example")
print(result["profane_words"])      # ['damn']
print(result["contains_profanity"]) # True
```

## ⚙️ Configuration

Both packages support identical configuration options:

### JavaScript

```typescript
import { Filter } from 'glin-profanity';

const filter = new Filter({
    languages: ['english', 'spanish'],    // Specific languages
    caseSensitive: false,                 // Case sensitivity
    wordBoundaries: true,                 // Enforce word boundaries
    replaceWith: '***',                   // Replacement text
    severityLevels: true,                 // Enable severity detection
    customWords: ['badword'],             // Add custom words
    ignoreWords: ['exception'],           // Ignore specific words
    allowObfuscatedMatch: true,           // Detect obfuscated text
    fuzzyToleranceLevel: 0.8,            // Fuzzy matching threshold
    enableContextAware: true,             // Context-aware filtering
    contextWindow: 3,                     // Context analysis window
    confidenceThreshold: 0.7              // Context confidence threshold
});
```

### Python

```python
from glin_profanity import Filter

filter_instance = Filter({
    "languages": ["english", "spanish"],    # Specific languages
    "case_sensitive": False,                # Case sensitivity  
    "word_boundaries": True,                # Enforce word boundaries
    "replace_with": "***",                  # Replacement text
    "severity_levels": True,                # Enable severity detection
    "custom_words": ["badword"],            # Add custom words
    "ignore_words": ["exception"],          # Ignore specific words
    "allow_obfuscated_match": True,         # Detect obfuscated text
    "fuzzy_tolerance_level": 0.8,           # Fuzzy matching threshold
    "enable_context_aware": True,           # Context-aware filtering
    "context_window": 3,                    # Context analysis window
    "confidence_threshold": 0.7             # Context confidence threshold
})
```

## 📖 API Reference

### Core Methods

Both packages provide identical functionality with language-appropriate naming:

| JavaScript | Python | Description |
|------------|--------|-------------|
| `isProfane(text)` | `is_profane(text)` | Check if text contains profanity |
| `checkProfanity(text)` | `check_profanity(text)` | Get detailed profanity analysis |
| `checkProfanityWithMinSeverity(text, level)` | `check_profanity_with_min_severity(text, level)` | Filter by minimum severity |

### Return Types

#### CheckProfanityResult

```typescript
// JavaScript
interface CheckProfanityResult {
  containsProfanity: boolean;
  profaneWords: string[];
  processedText?: string;        // If replaceWith is set
  severityMap?: Record<string, SeverityLevel>;
  matches?: Match[];             // Detailed match information
  contextScore?: number;         // Context analysis score
  reason?: string;               // Analysis reason
}
```

```python
# Python  
class CheckProfanityResult(TypedDict):
    contains_profanity: bool
    profane_words: List[str]
    processed_text: Optional[str]        # If replace_with is set
    severity_map: Optional[Dict[str, SeverityLevel]]
    matches: Optional[List[Match]]       # Detailed match information
    context_score: Optional[float]       # Context analysis score
    reason: Optional[str]                # Analysis reason
```

## 🌍 Supported Languages

Arabic, Chinese, Czech, Danish, English, Esperanto, Finnish, French, German, Hindi, Hungarian, Italian, Japanese, Korean, Norwegian, Persian, Polish, Portuguese, Russian, Spanish, Swedish, Thai, Turkish

## 🔨 Development

### Prerequisites

- **Node.js** 18+ (for JavaScript package)
- **Python** 3.10+ (for Python package) 
- **npm** (for package management)
- **hatch** (for Python packaging)

### Project Structure & Imports

The monorepo uses **shared dictionaries** and **TypeScript path mapping**:

```typescript
// JavaScript/TypeScript - uses @shared/* alias
import English from '@shared/dictionaries/english.json';
import Spanish from '@shared/dictionaries/spanish.json';
```

```python
# Python - loads from shared dictionaries
from glin_profanity.data.dictionary import dictionary
words = dictionary.get_words("english")
```

### Building

```bash
# Install dependencies
npm install

# Build JavaScript package (with @shared/* path mapping)
cd packages/js
npm run build              # Builds both CJS and ESM
npm run build:cjs         # CommonJS only  
npm run build:esm         # ES Modules only

# Build Python package  
cd packages/py
hatch build               # Creates wheel and sdist
hatch run pytest         # Run tests first
```

### Testing

```bash
# Test JavaScript package
cd packages/js
npm test

# Test Python package
cd packages/py  
hatch run pytest

# Run cross-language parity tests
npm test -- tests/cross-language-parity.test.js
cd tests && python -m pytest cross_language_parity_test.py
```

### Code Quality

```bash
# JavaScript
cd packages/js
npm run lint

# Python
cd packages/py
hatch run ruff check .
hatch run black --check .
hatch run mypy glin_profanity
```

## 📦 Release Process

This monorepo uses automated CI/CD with semantic versioning:

### Automatic Release (Recommended)

1. **Create PR** with your changes
2. **Merge to `release` branch** - triggers automatic release
3. **CI/CD automatically**:
   - Syncs versions using `scripts/sync-versions.js`
   - Runs comprehensive tests for both packages
   - Builds and publishes to npm (JavaScript) and PyPI (Python)  
   - Attaches build artifacts (tarball, wheel) to GitHub release
   - Creates GitHub release with synchronized changelog
   - Keeps versions synchronized across languages

### Manual Release

```bash
# Manually trigger release for specific package
gh workflow run release.yml -f package=js    # JavaScript only
gh workflow run release.yml -f package=py    # Python only  
gh workflow run release.yml -f package=both  # Both packages
```

### Version Synchronization

```bash
# Sync Python version to match JavaScript
node scripts/sync-versions.js
```

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Make** your changes in both packages when applicable  
4. **Add** tests to ensure cross-language parity
5. **Commit** your changes (`git commit -m 'Add amazing feature'`)
6. **Push** to the branch (`git push origin feature/amazing-feature`)
7. **Open** a Pull Request

### Contribution Guidelines

- ✅ Maintain API parity between JavaScript and Python
- ✅ Add tests for new features in both languages
- ✅ Update documentation for changes
- ✅ Follow existing code style conventions
- ✅ Ensure all CI checks pass

## 📄 License

This project is licensed under the **ISC License** - see the [LICENSE](LICENSE) file for details.

## 🏢 About

**Glin-Profanity** is developed and maintained by [GLINCKER](https://www.glincker.com). 

- 🌐 **Website**: [glincker.com/tools/glin-profanity](https://www.glincker.com/tools/glin-profanity)
- 📖 **Documentation**: [GitHub Repository](https://github.com/GLINCKER/glin-profanity)
- 🐛 **Issues**: [GitHub Issues](https://github.com/GLINCKER/glin-profanity/issues)  
- 💬 **Discussions**: [GitHub Discussions](https://github.com/GLINCKER/glin-profanity/discussions)

## 🙏 Acknowledgments

- Community contributors who helped expand language support
- Open source libraries that inspired the architecture
- Users who provide feedback and report issues

---

<div align="center">

**⭐ Star this repository if it helped you! ⭐**

</div>