<p align="center">
  <a href="https://www.glincker.com/tools/glin-profanity" target="_blank">
    <img src="./assets/glinr-logo.png" alt="Glin Profanity" width="40" /> 
  </a>
</p>

<h1 align="center">GLIN PROFANITY</h1>
  
<p align="center">
  <strong>A multilingual profanity detection and filtering engine for modern applications — by <a href="https://glincker.com">GLINCKER</a></strong>
</p>

<p align="center">
  <a href="https://www.glincker.com/tools/glin-profanity">
    <img src="https://img.shields.io/badge/🚀%20Try%20Live%20Demo-online-blue" alt="Try Live Demo" />
  </a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/glin-profanity">
    <img src="https://img.shields.io/npm/v/glin-profanity" alt="NPM Version" />
  </a>
  <a href="https://pypi.org/project/glin-profanity/">
    <img src="https://img.shields.io/pypi/v/glin-profanity" alt="PyPI Version" />
  </a>
  <a href="https://github.com/GLINCKER/glin-profanity/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-green" alt="MIT License" />
  </a>
  <a href="https://github.com/GLINCKER/glin-profanity/actions">
    <img src="https://img.shields.io/github/actions/workflow/status/GLINCKER/glin-profanity/ci.yml" alt="CI Status" />
  </a>
  <a href="https://www.npmjs.com/package/glin-profanity">
    <img src="https://img.shields.io/npm/dw/glin-profanity" alt="Weekly Downloads" />
  </a>
  <a href="https://pypi.org/project/glin-profanity/">
    <img src="https://img.shields.io/pypi/dm/glin-profanity" alt="Monthly Downloads" />
  </a>
  <a href="https://github.com/GLINCKER/glin-profanity/issues">
    <img src="https://img.shields.io/github/issues/GLINCKER/glin-profanity" alt="Open Issues" />
  </a>
  <a href="https://github.com/GLINCKER/glin-profanity/pulls">
    <img src="https://img.shields.io/github/issues-pr/GLINCKER/glin-profanity" alt="Open PRs" />
  </a>
  <a href="https://github.com/GLINCKER/glin-profanity/commits/main">
    <img src="https://img.shields.io/github/last-commit/GLINCKER/glin-profanity" alt="Last Commit" />
  </a>
  <a href="https://github.com/GLINCKER/glin-profanity/stargazers">
    <img src="https://img.shields.io/github/stars/GLINCKER/glin-profanity" alt="GitHub Stars" />
  </a>
  <a href="https://github.com/GLINCKER/glin-profanity/network/members">
    <img src="https://img.shields.io/github/forks/GLINCKER/glin-profanity" alt="GitHub Forks" />
  </a>
  <a href="https://github.com/GLINCKER/glin-profanity/graphs/contributors">
    <img src="https://img.shields.io/github/contributors/GLINCKER/glin-profanity" alt="Contributors" />
  </a>
  <a href="#-table-of-contents">
    <img src="https://img.shields.io/badge/-Table%20of%20Contents-blue" alt="Table Of Contents" />
  </a>
</p>

---

> A multilingual profanity detection and filtering engine for modern applications — by [GLINCKER](https://glincker.com)

[![Glin Profanity Preview](./assets/glin-profanity-preview.png)](https://www.glincker.com/tools/glin-profanity)

---

## ✨ Overview

**Glin-Profanity** is a high-performance, cross-platform library built to detect, filter, and sanitize profane or harmful language in user-generated content. Available for both **JavaScript/TypeScript** and **Python**, it provides unified APIs with support for 20+ languages, configurable severity levels, obfuscation detection, and seamless framework integration.

Whether you're moderating chat messages, community forums, or content input forms, Glin-Profanity empowers you to:

- 🛡️ Filter text with real-time or batch processing
- 🗣️ Detect offensive terms in **20+ human languages**
- 💬 Catch obfuscated profanity like `sh1t`, `f*ck`, `a$hole`
- 🎚️ Adjust severity thresholds (`Exact`, `Fuzzy`, `Merged`)
- 🔁 Replace bad words with symbols or emojis
- 🧩 Seamlessly integrate into **React apps** via `useProfanityChecker`
- 🛡️ Add custom word lists or ignore specific terms
- ⚡ Enjoy identical APIs across JavaScript and Python

## 📚 Table of Contents

- [🚀 Features](#-features)
- [📦 Installation](#-installation)
- [🌍 Supported Languages](#-supported-languages)
- [⚙️ Quick Start](#️-quick-start)
  - [JavaScript/TypeScript](#javascripttypescript)
  - [Python](#python)
  - [React Integration](#react-integration)
- [🧠 API Reference](#-api-reference)
  - [Core Methods](#core-methods)
  - [Configuration Options](#configuration-options)
  - [Return Types](#return-types)
- [🔧 Advanced Usage](#-advanced-usage)
- [📁 Monorepo Structure](#-monorepo-structure)
- [🛠 Use Cases](#-use-cases)
- [⚠️ Important Notes](#️-important-notes)
- [📄 License](#-license)

## 🚀 Features

- 🌍 **Multi-language Support**: 20+ languages including English, Spanish, French, German, Arabic, Chinese, and more
- 🎯 **Context-Aware Filtering**: Advanced context analysis to reduce false positives  
- ⚙️ **Highly Configurable**: Customize word lists, severity levels, and filtering behavior
- 🚀 **High Performance**: Optimized algorithms for speed and efficiency
- 🔧 **Easy Integration**: Simple APIs that work with any JavaScript/TypeScript or Python application
- 📝 **Unified API**: Identical functionality across both languages with consistent naming
- 🧪 **Well Tested**: Comprehensive test suite ensuring reliability and cross-language parity
- ⚛️ **React Hook**: Built-in `useProfanityChecker` hook for React applications
- 🔍 **Obfuscation Detection**: Advanced pattern matching for disguised profanity
- 🎚️ **Severity Levels**: Configurable severity detection and filtering

## 📦 Installation

### JavaScript/TypeScript

```bash
npm install glin-profanity
```

```bash
yarn add glin-profanity
```

### Python

```bash
pip install glin-profanity
```

```bash
poetry add glin-profanity
```

## 🌍 Supported Languages

Arabic, Chinese, Czech, Danish, English, Esperanto, Finnish, French, German, Hindi, Hungarian, Italian, Japanese, Korean, Norwegian, Persian, Polish, Portuguese, Russian, Spanish, Swedish, Thai, Turkish

## ⚙️ Quick Start

### JavaScript/TypeScript

```typescript
import { Filter, SeverityLevel } from 'glin-profanity';

// Basic usage
const filter = new Filter();

// Check if text contains profanity
if (filter.isProfane("This is a damn example")) {
    console.log("Profanity detected!");
}

// Get detailed results
const result = filter.checkProfanity("This is a damn example");
console.log(result.profaneWords);      // ['damn']
console.log(result.containsProfanity); // true
console.log(result.processedText);     // "This is a **** example" (if replaceWith is set)

// Advanced configuration
const advancedFilter = new Filter({
    languages: ['english', 'spanish'],
    caseSensitive: false,
    replaceWith: '***',
    severityLevels: true,
    allowObfuscatedMatch: true,
    customWords: ['badword', 'anotherbad'],
    ignoreWords: ['exception']
});
```

### Python

```python
from glin_profanity import Filter, SeverityLevel

# Basic usage
filter_instance = Filter()

# Check if text contains profanity  
if filter_instance.is_profane("This is a damn example"):
    print("Profanity detected!")

# Get detailed results
result = filter_instance.check_profanity("This is a damn example")
print(result["profane_words"])       # ['damn']
print(result["contains_profanity"])  # True
print(result["processed_text"])      # "This is a **** example" (if replace_with is set)

# Advanced configuration
advanced_filter = Filter({
    "languages": ["english", "spanish"],
    "case_sensitive": False,
    "replace_with": "***",
    "severity_levels": True,
    "allow_obfuscated_match": True,
    "custom_words": ["badword", "anotherbad"],
    "ignore_words": ["exception"]
})
```

### React Integration

```tsx
import React, { useState } from 'react';
import { useProfanityChecker, SeverityLevel } from 'glin-profanity';

const ChatModerator = () => {
  const [message, setMessage] = useState('');
  
  const { result, checkText } = useProfanityChecker({
    allLanguages: true,
    severityLevels: true,
    replaceWith: '***',
    minSeverity: SeverityLevel.Exact,
    customActions: (res) => {
      if (res.containsProfanity) {
        console.log('[Moderation] Flagged:', res.profaneWords);
      }
    },
  });

  const handleSubmit = () => {
    checkText(message);
    if (result && !result.containsProfanity) {
      // Send clean message
      sendMessage(message);
    } else {
      // Handle profanity detection
      alert('Please keep your message clean!');
    }
  };

  return (
    <div>
      <input 
        value={message} 
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message..."
      />
      <button onClick={handleSubmit}>Send</button>
      
      {result && result.containsProfanity && (
        <div style={{color: 'red'}}>
          ⚠️ Inappropriate content detected: {result.profaneWords.join(', ')}
        </div>
      )}
    </div>
  );
};
```

## 🧠 API Reference

### Core Methods

Both packages provide identical functionality with language-appropriate naming conventions:

| JavaScript | Python | Description |
|------------|--------|-------------|
| `isProfane(text)` | `is_profane(text)` | Check if text contains profanity |
| `checkProfanity(text)` | `check_profanity(text)` | Get detailed profanity analysis |
| `matches(word)` | `matches(word)` | Check if a single word matches profanity patterns |

### Configuration Options

#### JavaScript/TypeScript

```typescript
interface FilterConfig {
  languages?: Language[];              // Specific languages to check
  allLanguages?: boolean;              // Check all available languages
  caseSensitive?: boolean;             // Case-sensitive matching
  wordBoundaries?: boolean;            // Enforce word boundaries
  replaceWith?: string;                // Replacement text for profane words
  severityLevels?: boolean;            // Enable severity level detection
  customWords?: string[];              // Add custom profane words
  ignoreWords?: string[];              // Words to ignore
  allowObfuscatedMatch?: boolean;      // Detect obfuscated profanity
  fuzzyToleranceLevel?: number;        // Fuzzy matching tolerance (0-1)
  enableContextAware?: boolean;        // Context-aware filtering
  contextWindow?: number;              // Context analysis window size
  confidenceThreshold?: number;        // Context confidence threshold
  logProfanity?: boolean;              // Enable debug logging
}
```

#### Python

```python
from typing import TypedDict, List, Optional

class FilterConfig(TypedDict, total=False):
    languages: Optional[List[str]]              # Specific languages to check
    all_languages: Optional[bool]               # Check all available languages
    case_sensitive: Optional[bool]              # Case-sensitive matching
    word_boundaries: Optional[bool]             # Enforce word boundaries
    replace_with: Optional[str]                 # Replacement text for profane words
    severity_levels: Optional[bool]             # Enable severity level detection
    custom_words: Optional[List[str]]           # Add custom profane words
    ignore_words: Optional[List[str]]           # Words to ignore
    allow_obfuscated_match: Optional[bool]      # Detect obfuscated profanity
    fuzzy_tolerance_level: Optional[float]      # Fuzzy matching tolerance (0-1)
    enable_context_aware: Optional[bool]        # Context-aware filtering
    context_window: Optional[int]               # Context analysis window size
    confidence_threshold: Optional[float]       # Context confidence threshold
    log_profanity: Optional[bool]               # Enable debug logging
```

### Return Types

#### CheckProfanityResult

**JavaScript/TypeScript:**
```typescript
interface CheckProfanityResult {
  containsProfanity: boolean;                    // Whether profanity was detected
  profaneWords: string[];                        // List of detected profane words
  processedText?: string;                        // Text with replacements (if replaceWith is set)
  severityMap?: Record<string, SeverityLevel>;   // Word-to-severity mapping
  matches?: Match[];                             // Detailed match information
  contextScore?: number;                         // Context analysis score
  reason?: string;                               // Analysis explanation
}
```

**Python:**
```python
from typing import TypedDict, List, Optional, Dict

class CheckProfanityResult(TypedDict):
    contains_profanity: bool                           # Whether profanity was detected
    profane_words: List[str]                          # List of detected profane words
    processed_text: Optional[str]                     # Text with replacements
    severity_map: Optional[Dict[str, SeverityLevel]]  # Word-to-severity mapping
    matches: Optional[List[Match]]                    # Detailed match information
    context_score: Optional[float]                    # Context analysis score
    reason: Optional[str]                             # Analysis explanation
```

## 🔧 Advanced Usage

### Custom Word Lists and Severity Filtering

```typescript
// JavaScript
import { Filter, SeverityLevel } from 'glin-profanity';

const filter = new Filter({
    customWords: ['companyname', 'competitorname'],
    ignoreWords: ['assassin', 'classical'],  // False positives
    severityLevels: true,
    fuzzyToleranceLevel: 0.7
});

// Filter by minimum severity
const result = filter.checkProfanityWithMinSeverity(
    "This sh1t is damn bad", 
    SeverityLevel.EXACT
);
```

```python
# Python
from glin_profanity import Filter, SeverityLevel

filter_instance = Filter({
    "custom_words": ["companyname", "competitorname"],
    "ignore_words": ["assassin", "classical"],  # False positives
    "severity_levels": True,
    "fuzzy_tolerance_level": 0.7
})

# Filter by minimum severity
result = filter_instance.check_profanity_with_min_severity(
    "This sh1t is damn bad", 
    SeverityLevel.EXACT
)
```

### Obfuscation Detection

```typescript
// JavaScript
const filter = new Filter({
    allowObfuscatedMatch: true,
    wordBoundaries: false,  // Required for obfuscation detection
    fuzzyToleranceLevel: 0.8
});

// Detects: f*ck, sh1t, a$$hole, etc.
filter.isProfane("What the f*ck is this sh1t?"); // true
```

```python
# Python
filter_instance = Filter({
    "allow_obfuscated_match": True,
    "word_boundaries": False,  # Required for obfuscation detection
    "fuzzy_tolerance_level": 0.8
})

# Detects: f*ck, sh1t, a$$hole, etc.
filter_instance.is_profane("What the f*ck is this sh1t?")  # True
```

### Multi-language Detection

```typescript
// JavaScript
const multiLangFilter = new Filter({
    languages: ['english', 'spanish', 'french'],
    // or use: allLanguages: true
});

// Detects profanity in multiple languages
const text = "This is merde and puta content";
const result = multiLangFilter.checkProfanity(text);
```

```python
# Python
multi_lang_filter = Filter({
    "languages": ["english", "spanish", "french"],
    # or use: "all_languages": True
})

# Detects profanity in multiple languages
text = "This is merde and puta content"
result = multi_lang_filter.check_profanity(text)
```

## 📁 Monorepo Structure

```
glin-profanity/
├── packages/
│   ├── js/                    # JavaScript/TypeScript package
│   │   ├── src/               # TypeScript source code
│   │   │   ├── Filter.ts      # Main Filter class
│   │   │   ├── hooks/         # React hooks
│   │   │   ├── types/         # TypeScript definitions
│   │   │   └── utils/         # Utility functions
│   │   ├── lib/               # Built CJS + ESM outputs
│   │   ├── tests/             # Jest test suite
│   │   └── package.json       # npm package configuration
│   └── py/                    # Python package  
│       ├── glin_profanity/    # Python source code
│       │   ├── __init__.py    # Package exports
│       │   ├── filters/       # Filter implementation
│       │   ├── data/          # Dictionary loader
│       │   ├── types/         # Type definitions
│       │   └── nlp/           # NLP utilities
│       ├── tests/             # pytest test suite
│       └── pyproject.toml     # Python package configuration
├── shared/
│   └── dictionaries/          # JSON word lists (20+ languages)
│       ├── english.json
│       ├── spanish.json
│       ├── french.json
│       └── ...
├── tests/                     # Cross-language parity tests
├── scripts/                   # Build and release utilities
├── .github/workflows/         # CI/CD pipelines
└── assets/                    # Documentation assets
```

## 🛠 Use Cases

- 🔐 **Chat Moderation**: Real-time filtering in messaging applications
- 🧼 **Content Sanitization**: Clean user-generated content for blogs and forums
- 🕹️ **Gaming**: Moderate player communications in multiplayer games
- 🤖 **AI Content Filters**: Pre-process input before AI model training
- 📱 **Social Media**: Automated content moderation at scale
- 🎓 **Educational Platforms**: Maintain appropriate learning environments
- 💼 **Corporate Communications**: Filter internal chat and collaboration tools

## ⚠️ Important Notes

- ⚠️ **Best Effort Tool**: Glin-Profanity is a best-effort solution. Language evolves constantly, and no filter is 100% perfect.
- 👥 **Human Moderation**: Always supplement automated filtering with human moderation for high-risk or sensitive platforms.
- 🔄 **Regular Updates**: Keep the library updated to benefit from new language patterns and improved detection algorithms.
- ⚖️ **Context Matters**: Consider enabling context-aware filtering to reduce false positives in legitimate discussions.
- 🌍 **Cultural Sensitivity**: Different cultures have varying standards - configure accordingly for your audience.

## 📄 License

This software is available under a dual license:

### MIT License

This project is primarily licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details. You are free to use, modify, and distribute this software for both personal and commercial purposes.

### GLINCKER LLC Proprietary License

This software is also available under the GLINCKER LLC proprietary license for enterprise use cases requiring:
- Commercial support and guarantees
- Custom feature development
- Enhanced SLA commitments
- Dedicated technical consultation

For proprietary licensing inquiries, contact [GLINCKER](https://glincker.com).

---

## 🏢 About GLINCKER

**Glin-Profanity** is developed and maintained by [GLINCKER](https://www.glincker.com), a technology company focused on building developer tools and content moderation solutions.

- 🌐 **Website**: [glincker.com/tools/glin-profanity](https://www.glincker.com/tools/glin-profanity)
- 📖 **Documentation**: [GitHub Repository](https://github.com/GLINCKER/glin-profanity)
- 🐛 **Report Issues**: [GitHub Issues](https://github.com/GLINCKER/glin-profanity/issues)  
- 💬 **Community**: [GitHub Discussions](https://github.com/GLINCKER/glin-profanity/discussions)
- 📧 **Contact**: [hello@glincker.com](mailto:hello@glincker.com)

## 🤝 Contributing

We welcome contributions from the community! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details on:

- 🐛 Reporting bugs and issues
- 💡 Suggesting new features
- 🔧 Submitting code changes
- 📖 Improving documentation
- 🌍 Adding new language support

## 🙏 Acknowledgments

- 🌟 Community contributors who helped expand language support
- 🔧 Open source libraries that inspired the architecture
- 🗣️ Users who provide valuable feedback and report issues
- 🌍 Linguistic experts who helped improve detection accuracy

---

<div align="center">

**⭐ Star this repository if it helped you! ⭐**

[![GitHub stars](https://img.shields.io/github/stars/GLINCKER/glin-profanity?style=social)](https://github.com/GLINCKER/glin-profanity/stargazers)

*Building safer digital spaces, one word at a time.*

</div>