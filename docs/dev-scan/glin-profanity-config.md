# Glin-Profanity Configuration Reference

> **Complete documentation of all configuration options with defaults, types, and implementation details**

## Overview

This document provides comprehensive documentation for all configuration options available in Glin-Profanity, covering both JavaScript/TypeScript and Python implementations. All information is extracted from source code analysis.

---

## Configuration Interfaces

### JavaScript/TypeScript

**High-Level API**: `ProfanityCheckerConfig` (`packages/js/src/core/types.ts`)  
**Low-Level API**: `FilterConfig` (`packages/js/src/types/types.ts`)  
**Context-Aware**: `ContextAwareConfig` (`packages/js/src/types/types.ts`)

### Python  

**Main Configuration**: `FilterConfig` (`packages/py/glin_profanity/types/types.py`)  
**Context-Aware**: `ContextAwareConfig` (`packages/py/glin_profanity/types/types.py`)

---

## Complete Configuration Options

| Option | JS/TS Type | Python Type | Default Value | Range/Values | Applied In | Description | Anchor ID |
|--------|------------|-------------|---------------|--------------|------------|-------------|-----------|
| **Language Selection** ||||||||
| `languages` | `Language[]?` | `list[Language] \| None` | `['english']` | 23 supported languages | Filter constructor | Specific languages to check | `#config-languages` |
| `allLanguages` | `boolean?` | `bool` | `false` | `true \| false` | Filter constructor | Check all 23 languages | `#config-all-languages` |
| **Matching Behavior** ||||||||
| `caseSensitive` | `boolean?` | `bool` | `false` | `true \| false` | `getRegex()` | Case-sensitive matching | `#config-case-sensitive` |
| `wordBoundaries` | `boolean?` | `bool` | `!allowObfuscatedMatch` | `true \| false` | `getRegex()` | Enforce word boundaries | `#config-word-boundaries` |
| `allowObfuscatedMatch` | `boolean?` | `bool` | `false` | `true \| false` | `normalizeObfuscated()` | Detect disguised profanity | `#config-allow-obfuscated-match` |
| `fuzzyToleranceLevel` | `number?` | `float` | `0.8` | `0.5-1.0` | `isFuzzyToleranceMatch()` | Fuzzy matching threshold | `#config-fuzzy-tolerance-level` |
| **Text Processing** ||||||||
| `customWords` | `string[]?` | `list[str] \| None` | `[]` | Any string array | Filter constructor | Additional profane words | `#config-custom-words` |
| `ignoreWords` | `string[]?` | `list[str] \| None` | `globalWhitelist.json` | Any string array | Filter constructor | Words to ignore/whitelist | `#config-ignore-words` |
| `replaceWith` | `string?` | `str \| None` | `undefined` | Any string | `checkProfanity()` | Replacement text | `#config-replace-with` |
| **Advanced Features** ||||||||
| `severityLevels` | `boolean?` | `bool` | `false` | `true \| false` | `evaluateSeverity()` | Enable severity classification | `#config-severity-levels` |
| `minSeverity` | `SeverityLevel?` | N/A | `undefined` | `EXACT \| FUZZY` | `checkProfanity()` | Minimum severity threshold | `#config-min-severity` |
| `autoReplace` | `boolean?` | N/A | `false` | `true \| false` | `checkProfanity()` | Auto-replace profanity | `#config-auto-replace` |
| **Context-Aware Filtering** ||||||||
| `enableContextAware` | `boolean?` | `bool` | `false` | `true \| false` | Filter constructor | Enable context analysis | `#config-enable-context-aware` |
| `contextWindow` | `number?` | `int` | `3` | `1-10` | ContextAnalyzer | Context analysis window | `#config-context-window` |
| `confidenceThreshold` | `number?` | `float` | `0.7` | `0.0-1.0` | `checkProfanity()` | Context confidence threshold | `#config-confidence-threshold` |
| `domainWhitelists` | `Record<string, string[]>?` | `dict[str, list[str]] \| None` | `{}` | Domain mappings | ContextAnalyzer | Domain-specific whitelists | `#config-domain-whitelists` |
| **Debug & Logging** ||||||||
| `logProfanity` | `boolean?` | `bool` | `false` | `true \| false` | `debugLog()` | Enable debug logging | `#config-log-profanity` |
| **Callbacks (JS/TS Only)** ||||||||
| `customActions` | `(result) => void` | N/A | `undefined` | Function | `checkProfanity()` | Custom callback function | `#config-custom-actions` |

---

## Detailed Option Documentation

### Language Selection

#### `languages` {#config-languages}
**JavaScript**: `languages?: Language[]`  
**Python**: `languages: list[Language] | None`  
**Default**: `['english']`  
**Applied**: Filter constructor - Dictionary loading  
**Description**: Array of specific language codes to check. Overridden by `allLanguages`.

**Supported Languages**:
```
arabic, chinese, czech, danish, english, esperanto, finnish, french, 
german, hindi, hungarian, italian, japanese, korean, norwegian, 
persian, polish, portuguese, russian, spanish, swedish, thai, turkish
```

**Example**:
```javascript
// JavaScript
{ languages: ['english', 'spanish', 'french'] }
```
```python
# Python  
{"languages": ["english", "spanish", "french"]}
```

#### `allLanguages` {#config-all-languages}
**JavaScript**: `allLanguages?: boolean`  
**Python**: `all_languages: bool`  
**Default**: `false`  
**Applied**: Filter constructor - Dictionary loading  
**Description**: Check all 23 supported languages. Takes precedence over `languages`.

**Implementation**: Loads all dictionary files from `shared/dictionaries/`

### Matching Behavior

#### `caseSensitive` {#config-case-sensitive}
**JavaScript**: `caseSensitive?: boolean`  
**Python**: `case_sensitive: bool`  
**Default**: `false`  
**Applied**: `getRegex()` - Regex flag generation  
**Description**: Enable case-sensitive profanity matching.

**Implementation**: Controls regex flags (`g` vs `gi`)

#### `wordBoundaries` {#config-word-boundaries}
**JavaScript**: `wordBoundaries?: boolean`  
**Python**: `word_boundaries: bool`  
**Default**: `!allowObfuscatedMatch` (true unless obfuscation enabled)  
**Applied**: `getRegex()` - Regex pattern generation  
**Description**: Enforce word boundaries in matching.

**Implementation**: Adds `\\b` to regex patterns when enabled
**Note**: Automatically disabled when `allowObfuscatedMatch` is true

#### `allowObfuscatedMatch` {#config-allow-obfuscated-match}  
**JavaScript**: `allowObfuscatedMatch?: boolean`  
**Python**: `allow_obfuscated_match: bool`  
**Default**: `false`  
**Applied**: `normalizeObfuscated()` - Character substitution  
**Description**: Detect obfuscated profanity (e.g., `sh1t`, `f*ck`).

**Character Mappings**:
```
'@' → 'a', '$' → 's', '!' → 'i', '1' → 'i', '*' → ''
```

#### `fuzzyToleranceLevel` {#config-fuzzy-tolerance-level}
**JavaScript**: `fuzzyToleranceLevel?: number`  
**Python**: `fuzzy_tolerance_level: float`  
**Default**: `0.8`  
**Range**: `0.5-1.0`  
**Applied**: `isFuzzyToleranceMatch()` - Fuzzy matching algorithm  
**Description**: Character similarity threshold for fuzzy matching.

**Algorithm**: `score = matchCount / simplifiedWord.length`

### Text Processing

#### `customWords` {#config-custom-words}
**JavaScript**: `customWords?: string[]`  
**Python**: `custom_words: list[str] | None`  
**Default**: `[]`  
**Applied**: Filter constructor - Word set initialization  
**Description**: Additional words to treat as profanity.

**Implementation**: Added to dictionary words during filter initialization

#### `ignoreWords` {#config-ignore-words}
**JavaScript**: `ignoreWords?: string[]` (FilterConfig only)  
**Python**: `ignore_words: list[str] | None`  
**Default**: Global whitelist from `shared/dictionaries/globalWhitelist.json`  
**Applied**: Filter constructor and `isProfane()` - Word filtering  
**Description**: Words to exclude from profanity detection.

**Note**: JavaScript high-level API automatically includes global whitelist

#### `replaceWith` {#config-replace-with}
**JavaScript**: `replaceWith?: string`  
**Python**: `replace_with: str | None`  
**Default**: `undefined`/`None`  
**Applied**: `checkProfanity()` - Text replacement  
**Description**: String to replace detected profanity.

**Implementation**: Uses regex replacement with word boundary consideration

### Advanced Features

#### `severityLevels` {#config-severity-levels}
**JavaScript**: `severityLevels?: boolean`  
**Python**: `severity_levels: bool`  
**Default**: `false`  
**Applied**: `evaluateSeverity()` and result processing  
**Description**: Enable severity classification (EXACT vs FUZZY).

**Values**:
- `SeverityLevel.EXACT = 1` - Direct/exact matches
- `SeverityLevel.FUZZY = 2` - Fuzzy/approximate matches

#### `minSeverity` {#config-min-severity}
**JavaScript**: `minSeverity?: SeverityLevel` (ProfanityCheckerConfig only)  
**Python**: Not available  
**Default**: `undefined`  
**Applied**: `checkProfanity()` - Result filtering  
**Description**: Filter results by minimum severity level.

#### `autoReplace` {#config-auto-replace}
**JavaScript**: `autoReplace?: boolean` (ProfanityCheckerConfig only)  
**Python**: Not available  
**Default**: `false`  
**Applied**: `checkProfanity()` - Result processing  
**Description**: Automatically return replaced text in result.

### Context-Aware Filtering

#### `enableContextAware` {#config-enable-context-aware}
**JavaScript**: `enableContextAware?: boolean`  
**Python**: `enable_context_aware: bool`  
**Default**: `false`  
**Applied**: Filter constructor - ContextAnalyzer initialization  
**Description**: Enable advanced context-aware profanity filtering.

**Features**: Sentiment analysis, phrase detection, domain whitelisting

#### `contextWindow` {#config-context-window}
**JavaScript**: `contextWindow?: number`  
**Python**: `context_window: int`  
**Default**: `3`  
**Range**: `1-10` (recommended)  
**Applied**: ContextAnalyzer - Context extraction  
**Description**: Number of words before/after match to analyze.

#### `confidenceThreshold` {#config-confidence-threshold}
**JavaScript**: `confidenceThreshold?: number`  
**Python**: `confidence_threshold: float`  
**Default**: `0.7`  
**Range**: `0.0-1.0`  
**Applied**: `checkProfanity()` - Context filtering  
**Description**: Confidence threshold for context-based filtering.

**Implementation**: Matches with context score above threshold are filtered out

#### `domainWhitelists` {#config-domain-whitelists}
**JavaScript**: `domainWhitelists?: Record<string, string[]>`  
**Python**: `domain_whitelists: dict[str, list[str]] | None`  
**Default**: `{}`  
**Applied**: ContextAnalyzer - Domain-specific whitelisting  
**Description**: Language-specific domain whitelist mappings.

**Example**:
```javascript
{
  domainWhitelists: {
    english: ['boss', 'enemy', 'character', 'game']
  }
}
```

### Debug & Logging

#### `logProfanity` {#config-log-profanity}
**JavaScript**: `logProfanity?: boolean`  
**Python**: `log_profanity: bool`  
**Default**: `false`  
**Applied**: `debugLog()` - Console logging  
**Description**: Enable debug console logging.

**Output Format**: `[glin-profanity] <message>`

### Callbacks (JavaScript/TypeScript Only)

#### `customActions` {#config-custom-actions}
**JavaScript**: `customActions?: (result: CheckProfanityResult) => void`  
**Python**: Not available  
**Default**: `undefined`  
**Applied**: `checkProfanity()` - Post-processing callback  
**Description**: Custom callback function executed after profanity check.

---

## Configuration Validation and Warnings

### Automatic Adjustments

1. **Word Boundaries vs Obfuscated Matching**:
   ```javascript
   // When allowObfuscatedMatch=true, wordBoundaries automatically becomes false
   if (config.allowObfuscatedMatch && config.wordBoundaries) {
     console.warn('[Glin-Profanity] Obfuscated match enabled → wordBoundaries will be ignored internally.');
   }
   ```

2. **Default Language Fallback**:
   ```javascript
   const languages = config?.languages || ['english'];
   ```

### Cross-Language Compatibility

**Naming Conventions**:
- JavaScript: `camelCase` (e.g., `caseSensitive`, `allowObfuscatedMatch`)
- Python: `snake_case` (e.g., `case_sensitive`, `allow_obfuscated_match`)

**Functionality Parity**: 95% - Most features have identical behavior

**JavaScript-Only Features**:
- `minSeverity` filtering in ProfanityCheckerConfig
- `autoReplace` functionality
- `customActions` callbacks

---

## Configuration Examples

### Basic Usage
```javascript
// JavaScript - Simple profanity detection
const config = {
  languages: ['english'],
  caseSensitive: false,
  wordBoundaries: true
};
```

```python
# Python - Simple profanity detection
config = {
    "languages": ["english"],
    "case_sensitive": False,
    "word_boundaries": True
}
```

### Advanced Context-Aware
```javascript
// JavaScript - Advanced context filtering
const config = {
  allLanguages: true,
  enableContextAware: true,
  contextWindow: 5,
  confidenceThreshold: 0.8,
  domainWhitelists: {
    english: ['boss', 'enemy', 'game']
  },
  severityLevels: true,
  logProfanity: true
};
```

### Obfuscated Text Detection
```javascript
// JavaScript - Obfuscated profanity detection
const config = {
  allowObfuscatedMatch: true,
  fuzzyToleranceLevel: 0.7,
  severityLevels: true
  // Note: wordBoundaries automatically disabled
};
```

---

## Implementation Details

### Default Value Resolution Order

1. **Global Whitelist Integration** (JavaScript):
   ```javascript
   ignoreWords: (globalWhitelistData as any).whitelist
   ```

2. **Conditional Defaults**:
   ```javascript
   wordBoundaries: config?.wordBoundaries ?? !this.allowObfuscatedMatch
   ```

3. **Fallback Chain**:
   ```javascript
   this.fuzzyToleranceLevel = config?.fuzzyToleranceLevel ?? 0.8;
   ```

### Configuration Transformation

**JavaScript High-Level to Low-Level**:
```javascript
function createFilterConfig(config?: ProfanityCheckerConfig): FilterConfig {
  const effective: FilterConfig = {
    ...(config ?? {}),
    ignoreWords: (globalWhitelistData as any).whitelist,
    fuzzyToleranceLevel: config?.fuzzyToleranceLevel ?? 0.8,
  };
  return effective;
}
```

---

*Generated: 2025-08-11*  
*Source: Complete source code analysis of configuration interfaces and implementations*