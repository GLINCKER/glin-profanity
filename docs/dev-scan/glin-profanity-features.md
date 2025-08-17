# Glin-Profanity API Surface Analysis

> **Complete function signatures, classes, hooks, and configuration interfaces extracted from source code**

## Overview

This document provides a comprehensive analysis of every API surface, function, class, hook, and configuration interface in the Glin-Profanity codebase. All information is extracted directly from source code files with their actual implementations.

---

## JavaScript Core API

### Core Functions (`packages/js/src/core/index.ts`)

#### `checkProfanity`
```typescript
function checkProfanity(text: string, config?: ProfanityCheckerConfig): ProfanityCheckResult
```
**Purpose**: Framework-agnostic profanity detection for any JavaScript environment  
**Parameters**: 
- `text: string` - Input text to check for profanity
- `config?: ProfanityCheckerConfig` - Optional configuration object
**Returns**: `ProfanityCheckResult` - Enhanced detection results with auto-replace and filtering
**Source**: [`packages/js/src/core/index.ts`](/packages/js/src/core/index.ts)

#### `checkProfanityAsync`
```typescript
async function checkProfanityAsync(text: string, config?: ProfanityCheckerConfig): Promise<ProfanityCheckResult>
```
**Purpose**: Asynchronous version of profanity detection (resolves immediately for API consistency)
**Parameters**: 
- `text: string` - Input text to check for profanity
- `config?: ProfanityCheckerConfig` - Optional configuration object
**Returns**: `Promise<ProfanityCheckResult>` - Promise resolving to detection results
**Source**: [`packages/js/src/core/index.ts`](/packages/js/src/core/index.ts)

#### `isWordProfane`
```typescript
function isWordProfane(word: string, config?: ProfanityCheckerConfig): boolean
```
**Purpose**: Simple boolean check for single word profanity detection
**Parameters**: 
- `word: string` - Single word to check
- `config?: ProfanityCheckerConfig` - Optional configuration object
**Returns**: `boolean` - True if word contains profanity
**Source**: [`packages/js/src/core/index.ts`](/packages/js/src/core/index.ts)

#### `createFilterConfig` (Private Helper)
```typescript
function createFilterConfig(config?: ProfanityCheckerConfig): FilterConfig
```
**Purpose**: Internal helper to convert high-level config to filter-specific config
**Parameters**: 
- `config?: ProfanityCheckerConfig` - Optional high-level configuration
**Returns**: `FilterConfig` - Internal filter configuration with global whitelist integration
**Source**: [`packages/js/src/core/index.ts`](/packages/js/src/core/index.ts)

### Filter Class (`packages/js/src/filters/Filter.ts`)

#### `Filter` Class Constructor
```typescript
constructor(config?: FilterConfig)
```
**Purpose**: Initialize profanity filter with comprehensive configuration options
**Parameters**: 
- `config?: FilterConfig` - Complete filter configuration including context-aware options
**Source**: [`packages/js/src/filters/Filter.ts`](/packages/js/src/filters/Filter.ts)

#### `Filter.isProfane`
```typescript
isProfane(value: string): boolean
```
**Purpose**: Check if text contains profanity using configured filter rules
**Parameters**: 
- `value: string` - Text to analyze
**Returns**: `boolean` - True if profanity detected
**Source**: [`packages/js/src/filters/Filter.ts`](/packages/js/src/filters/Filter.ts)

#### `Filter.matches`
```typescript
matches(word: string): boolean
```
**Purpose**: Alias for isProfane for API compatibility
**Parameters**: 
- `word: string` - Text to analyze
**Returns**: `boolean` - True if profanity detected
**Source**: [`packages/js/src/filters/Filter.ts`](/packages/js/src/filters/Filter.ts)

#### `Filter.checkProfanity`
```typescript
checkProfanity(text: string): CheckProfanityResult
```
**Purpose**: Comprehensive profanity analysis with context-aware filtering support
**Parameters**: 
- `text: string` - Text to analyze
**Returns**: `CheckProfanityResult` - Detailed analysis including matches, severity, and context scores
**Source**: [`packages/js/src/filters/Filter.ts`](/packages/js/src/filters/Filter.ts)

#### `Filter.checkProfanityWithMinSeverity`
```typescript
checkProfanityWithMinSeverity(
  text: string, 
  minSeverity: SeverityLevel = SeverityLevel.EXACT
): { filteredWords: string[]; result: CheckProfanityResult }
```
**Purpose**: Check profanity with minimum severity threshold filtering
**Parameters**: 
- `text: string` - Text to analyze
- `minSeverity: SeverityLevel` - Minimum severity level to include (default: EXACT)
**Returns**: Object with filtered words and complete result
**Source**: [`packages/js/src/filters/Filter.ts`](/packages/js/src/filters/Filter.ts)

#### Filter Private Methods
- `debugLog(...args: any[])` - Debug logging when enabled
- `normalizeObfuscated(text: string): string` - Handle obfuscated text normalization
- `getRegex(word: string): RegExp` - Generate regex patterns with boundary/case handling
- `isFuzzyToleranceMatch(word: string, text: string): boolean` - Fuzzy matching algorithm
- `evaluateSeverity(word: string, text: string): SeverityLevel | undefined` - Determine match severity

### Context Analyzer (`packages/js/src/nlp/contextAnalyzer.ts`)

#### `ContextAnalyzer` Class Constructor
```typescript
constructor(config: ContextConfig)
```
**Purpose**: Initialize context-aware profanity analysis engine
**Parameters**: 
- `config: ContextConfig` - Context analysis configuration
**Source**: [`packages/js/src/nlp/contextAnalyzer.ts`](/packages/js/src/nlp/contextAnalyzer.ts)

#### `ContextAnalyzer.analyzeContext`
```typescript
analyzeContext(
  text: string, 
  matchWord: string, 
  matchIndex: number
): ContextAnalysisResult
```
**Purpose**: Analyze context around profanity match to reduce false positives
**Parameters**: 
- `text: string` - Full text being analyzed
- `matchWord: string` - Detected profane word
- `matchIndex: number` - Character index of match
**Returns**: `ContextAnalysisResult` - Context score, reason, and whitelist status
**Source**: [`packages/js/src/nlp/contextAnalyzer.ts`](/packages/js/src/nlp/contextAnalyzer.ts)

#### `ContextAnalyzer.updateDomainWhitelist`
```typescript
updateDomainWhitelist(newWhitelist: string[]): void
```
**Purpose**: Replace current domain whitelist with new list
**Parameters**: 
- `newWhitelist: string[]` - New whitelist words
**Source**: [`packages/js/src/nlp/contextAnalyzer.ts`](/packages/js/src/nlp/contextAnalyzer.ts)

#### `ContextAnalyzer.addToDomainWhitelist`
```typescript
addToDomainWhitelist(words: string[]): void
```
**Purpose**: Add words to existing domain whitelist
**Parameters**: 
- `words: string[]` - Words to add to whitelist
**Source**: [`packages/js/src/nlp/contextAnalyzer.ts`](/packages/js/src/nlp/contextAnalyzer.ts)

#### Context Analyzer Private Methods
- `tokenize(text: string): string[]` - Split text into analyzable tokens
- `findWordIndex(words: string[], charIndex: number): number` - Map character position to word index
- `checkPhraseContext(contextText: string, matchWord: string): ContextAnalysisResult | null` - Check for known phrase patterns
- `isDomainWhitelisted(contextWords: string[], matchWord: string): boolean` - Domain-specific whitelist checking
- `calculateSentimentScore(contextWords: string[], matchPosition: number): number` - Sentiment analysis algorithm
- `generateReason(score: number, contextWords: string[]): string` - Generate human-readable analysis reason

### Dictionary Data (`packages/js/src/data/dictionary.ts`)

#### `dictionary` (Default Export)
```typescript
export default {
  arabic: string[],
  chinese: string[],
  czech: string[],
  danish: string[],
  english: string[],
  esperanto: string[],
  finnish: string[],
  french: string[],
  german: string[],
  hindi: string[],
  hungarian: string[],
  italian: string[],
  japanese: string[],
  korean: string[],
  norwegian: string[],
  persian: string[],
  polish: string[],
  portuguese: string[],
  russian: string[],
  spanish: string[],
  turkish: string[],
  swedish: string[],
  thai: string[]
}
```
**Purpose**: Centralized profanity word lists for all supported languages
**Source**: [`packages/js/src/data/dictionary.ts`](/packages/js/src/data/dictionary.ts)

---

## React Integration

### React Hook (`packages/js/src/hooks/useProfanityChecker.ts`)

#### `useProfanityChecker`
```typescript
const useProfanityChecker = (config?: ProfanityCheckerConfig) => {
  result: CheckProfanityResult | null;
  checkText: (text: string) => ProfanityCheckResult;
  checkTextAsync: (text: string) => Promise<ProfanityCheckResult>;
  reset: () => void;
  isDirty: boolean;
  isWordProfane: (word: string) => boolean;
}
```
**Purpose**: React hook for stateful profanity checking with caching and utilities
**Parameters**: 
- `config?: ProfanityCheckerConfig` - Optional configuration object
**Returns**: Object with methods and state for React components
**State Management**: 
- `result` - Last check result (cached)
- `isDirty` - Boolean indicating if profanity was found in last check
**Methods**:
- `checkText` - Synchronous check with state update
- `checkTextAsync` - Asynchronous check with state update  
- `reset` - Clear cached result
- `isWordProfane` - Single word check (no state update)
**Source**: [`packages/js/src/hooks/useProfanityChecker.ts`](/packages/js/src/hooks/useProfanityChecker.ts)

---

## Configuration & Types

### Core Types (`packages/js/src/core/types.ts`)

#### `ProfanityCheckerConfig`
```typescript
interface ProfanityCheckerConfig {
  languages?: Language[];
  allLanguages?: boolean;
  caseSensitive?: boolean;
  wordBoundaries?: boolean;
  customWords?: string[];
  replaceWith?: string;
  severityLevels?: boolean;
  allowObfuscatedMatch?: boolean;
  fuzzyToleranceLevel?: number;
  minSeverity?: SeverityLevel;
  autoReplace?: boolean;
  customActions?: (result: CheckProfanityResult) => void;
}
```
**Purpose**: High-level configuration interface for the main API functions
**Source**: [`packages/js/src/core/types.ts`](/packages/js/src/core/types.ts)

#### `ProfanityCheckResult`
```typescript
interface ProfanityCheckResult extends CheckProfanityResult {
  filteredWords: string[];
  autoReplaced: string;
}
```
**Purpose**: Enhanced result interface with auto-filtering and replacement features
**Source**: [`packages/js/src/core/types.ts`](/packages/js/src/core/types.ts)

### Unified Types (`packages/js/src/types/types.ts`)

#### `SeverityLevel` Enum
```typescript
enum SeverityLevel {
  EXACT = 1,
  FUZZY = 2,
}
```
**Purpose**: Severity levels for profanity matches - unified with Python
**Source**: [`packages/js/src/types/types.ts`](/packages/js/src/types/types.ts)

#### `Language` Type
```typescript
type Language =
  | 'arabic' | 'chinese' | 'czech' | 'danish' | 'english' | 'esperanto' 
  | 'finnish' | 'french' | 'german' | 'hindi' | 'hungarian' | 'italian' 
  | 'japanese' | 'korean' | 'norwegian' | 'persian' | 'polish' 
  | 'portuguese' | 'russian' | 'spanish' | 'swedish' | 'thai' | 'turkish'
```
**Purpose**: Supported languages - unified list with Python
**Source**: [`packages/js/src/types/types.ts`](/packages/js/src/types/types.ts)

#### `Match` Interface
```typescript
interface Match {
  word: string;
  index: number;
  severity: SeverityLevel;
  contextScore?: number;
  reason?: string;
  isWhitelisted?: boolean;
}
```
**Purpose**: Represents a profanity match in text - unified with Python
**Source**: [`packages/js/src/types/types.ts`](/packages/js/src/types/types.ts)

#### `CheckProfanityResult` Interface
```typescript
interface CheckProfanityResult {
  containsProfanity: boolean;
  profaneWords: string[];
  processedText?: string;
  severityMap?: Record<string, SeverityLevel>;
  matches?: Match[];
  contextScore?: number;
  reason?: string;
}
```
**Purpose**: Result of profanity check operation - unified field names
**Source**: [`packages/js/src/types/types.ts`](/packages/js/src/types/types.ts)

#### `ContextAwareConfig` Interface
```typescript
interface ContextAwareConfig {
  enableContextAware?: boolean;
  contextWindow?: number;
  confidenceThreshold?: number;
  domainWhitelists?: Record<string, string[]>;
}
```
**Purpose**: Configuration for context-aware filtering - unified with Python
**Source**: [`packages/js/src/types/types.ts`](/packages/js/src/types/types.ts)

#### `FilterConfig` Interface
```typescript
interface FilterConfig extends ContextAwareConfig {
  languages?: Language[];
  allLanguages?: boolean;
  caseSensitive?: boolean;
  wordBoundaries?: boolean;
  customWords?: string[];
  replaceWith?: string;
  severityLevels?: boolean;
  ignoreWords?: string[];
  logProfanity?: boolean;
  allowObfuscatedMatch?: boolean;
  fuzzyToleranceLevel?: number;
}
```
**Purpose**: Main filter configuration options - unified with Python
**Source**: [`packages/js/src/types/types.ts`](/packages/js/src/types/types.ts)

#### `FilteredProfanityResult` Interface
```typescript
interface FilteredProfanityResult {
  result: CheckProfanityResult;
  filteredWords: string[];
}
```
**Purpose**: Result with minimum severity filtering
**Source**: [`packages/js/src/types/types.ts`](/packages/js/src/types/types.ts)

### Context Analysis Types (`packages/js/src/nlp/contextAnalyzer.ts`)

#### `ContextAnalysisResult` Interface
```typescript
interface ContextAnalysisResult {
  contextScore: number; // 0-1, where 0 = negative context, 1 = positive context
  reason: string;
  isWhitelisted: boolean;
}
```
**Purpose**: Result of context analysis for profanity matches
**Source**: [`packages/js/src/nlp/contextAnalyzer.ts`](/packages/js/src/nlp/contextAnalyzer.ts)

#### `ContextConfig` Interface
```typescript
interface ContextConfig {
  contextWindow: number;
  language: Language;
  domainWhitelists?: string[];
}
```
**Purpose**: Configuration for context analyzer initialization
**Source**: [`packages/js/src/nlp/contextAnalyzer.ts`](/packages/js/src/nlp/contextAnalyzer.ts)

---

## Python Core API

### Main Package (`packages/py/glin_profanity/__init__.py`)

#### Package Metadata
```python
__version__ = "2.3.2" 
__author__ = "glinr"
__email__ = "contact@glincker.com"
```
**Purpose**: Package version and author information
**Source**: [`packages/py/glin_profanity/__init__.py`](/packages/py/glin_profanity/__init__.py)

#### Public API Exports
```python
from .filters.filter import Filter
from .types.types import (
    CheckProfanityResult,
    FilterConfig,
    FilteredProfanityResult,
    Language,
    Match,
    SeverityLevel,
)
```
**Purpose**: Main package exports - all public API classes and types
**Source**: [`packages/py/glin_profanity/__init__.py`](/packages/py/glin_profanity/__init__.py)

### Filter Class (`packages/py/glin_profanity/filters/filter.py`)

#### `Filter` Class Constructor
```python
def __init__(self, config: FilterConfig | None = None) -> None:
```
**Purpose**: Initialize the profanity filter with comprehensive configuration
**Parameters**: 
- `config: FilterConfig | None` - Filter configuration options (optional)
**Features**:
- Multi-language dictionary loading
- Context-aware filtering setup
- Custom word and ignore list handling
- Obfuscation and fuzzy matching configuration
**Source**: [`packages/py/glin_profanity/filters/filter.py`](/packages/py/glin_profanity/filters/filter.py)

#### `Filter.is_profane`
```python
def is_profane(self, value: str) -> bool:
```
**Purpose**: Check if text contains profanity
**Parameters**: 
- `value: str` - Text to check
**Returns**: `bool` - True if profanity is detected, False otherwise
**Source**: [`packages/py/glin_profanity/filters/filter.py`](/packages/py/glin_profanity/filters/filter.py)

#### `Filter.matches`
```python
def matches(self, word: str) -> bool:
```
**Purpose**: Check if a single word matches profanity patterns
**Parameters**: 
- `word: str` - Word to check
**Returns**: `bool` - True if word matches profanity, False otherwise
**Source**: [`packages/py/glin_profanity/filters/filter.py`](/packages/py/glin_profanity/filters/filter.py)

#### `Filter.check_profanity`
```python
def check_profanity(self, text: str) -> CheckProfanityResult:
```
**Purpose**: Comprehensive profanity check with detailed results
**Parameters**: 
- `text: str` - Text to analyze
**Returns**: `CheckProfanityResult` - Detailed results of profanity analysis
**Features**:
- Severity level detection
- Text replacement processing
- Match location tracking
- Context analysis (TODO: implementation pending)
**Source**: [`packages/py/glin_profanity/filters/filter.py`](/packages/py/glin_profanity/filters/filter.py)

#### `Filter.check_profanity_with_min_severity`
```python
def check_profanity_with_min_severity(
    self, text: str, min_severity: SeverityLevel = SeverityLevel.EXACT
) -> dict[str, object]:
```
**Purpose**: Check profanity with minimum severity filtering
**Parameters**: 
- `text: str` - Text to analyze
- `min_severity: SeverityLevel` - Minimum severity level to include (default: EXACT)
**Returns**: `dict[str, object]` - Dictionary with filtered words and full result
**Source**: [`packages/py/glin_profanity/filters/filter.py`](/packages/py/glin_profanity/filters/filter.py)

#### Filter Private Methods
- `_load_words(config: FilterConfig) -> None` - Load profanity dictionaries based on config
- `_debug_log(*args: object) -> None` - Debug logging when enabled
- `_normalize_obfuscated(text: str) -> str` - Handle obfuscated text normalization
- `_get_regex(word: str) -> re.Pattern[str]` - Generate regex patterns with proper flags
- `_is_fuzzy_tolerance_match(word: str, text: str) -> bool` - Fuzzy matching algorithm
- `_fuzzy_match_single_word(pattern_word: str, text_word: str) -> bool` - Single word fuzzy matching
- `_evaluate_severity(word: str, text: str) -> SeverityLevel | None` - Determine match severity

### Dictionary Loader (`packages/py/glin_profanity/data/dictionary.py`)

#### `DictionaryLoader` Class Constructor
```python
def __init__(self) -> None:
```
**Purpose**: Initialize dictionary loader with shared JSON files
**Features**:
- Automatic path resolution to shared dictionaries
- Multiple language support
- Error handling for missing files
**Source**: [`packages/py/glin_profanity/data/dictionary.py`](/packages/py/glin_profanity/data/dictionary.py)

#### `DictionaryLoader.get_words`
```python
def get_words(self, language: Language) -> list[str]:
```
**Purpose**: Get words for a specific language
**Parameters**: 
- `language: Language` - Language code
**Returns**: `list[str]` - List of profanity words for the language
**Source**: [`packages/py/glin_profanity/data/dictionary.py`](/packages/py/glin_profanity/data/dictionary.py)

#### `DictionaryLoader.get_all_words`
```python
def get_all_words(self) -> list[str]:
```
**Purpose**: Get all words from all languages
**Returns**: `list[str]` - Deduplicated list of all profanity words
**Source**: [`packages/py/glin_profanity/data/dictionary.py`](/packages/py/glin_profanity/data/dictionary.py)

#### `DictionaryLoader.available_languages`
```python
@property
def available_languages(self) -> list[str]:
```
**Purpose**: Get list of available languages
**Returns**: `list[str]` - List of available language codes
**Source**: [`packages/py/glin_profanity/data/dictionary.py`](/packages/py/glin_profanity/data/dictionary.py)

#### DictionaryLoader Private Methods
- `_raise_format_error(filename: str) -> None` - Raise format error for invalid files
- `_load_dictionaries() -> None` - Load all dictionary files from shared directory

#### Global Dictionary Instance
```python
dictionary = DictionaryLoader()
```
**Purpose**: Global singleton instance for accessing profanity dictionaries
**Source**: [`packages/py/glin_profanity/data/dictionary.py`](/packages/py/glin_profanity/data/dictionary.py)

### Python Types (`packages/py/glin_profanity/types/types.py`)

#### `Language` Type
```python
Language = Literal[
    "arabic", "chinese", "czech", "danish", "english", "esperanto", 
    "finnish", "french", "german", "hindi", "hungarian", "italian", 
    "japanese", "korean", "norwegian", "persian", "polish", 
    "portuguese", "russian", "spanish", "swedish", "thai", "turkish"
]
```
**Purpose**: Supported languages - unified list with JavaScript
**Source**: [`packages/py/glin_profanity/types/types.py`](/packages/py/glin_profanity/types/types.py)

#### `SeverityLevel` Enum
```python
class SeverityLevel(IntEnum):
    EXACT = 1
    FUZZY = 2
```
**Purpose**: Severity levels for profanity matches - unified with JavaScript
**Source**: [`packages/py/glin_profanity/types/types.py`](/packages/py/glin_profanity/types/types.py)

#### `Match` TypedDict
```python
class Match(TypedDict, total=False):
    word: str
    index: int
    severity: SeverityLevel
    context_score: float | None
    reason: str | None
    is_whitelisted: bool | None
```
**Purpose**: Represents a profanity match in text - unified with JavaScript (snake_case)
**Source**: [`packages/py/glin_profanity/types/types.py`](/packages/py/glin_profanity/types/types.py)

#### `CheckProfanityResult` TypedDict
```python
class CheckProfanityResult(TypedDict, total=False):
    contains_profanity: bool
    profane_words: list[str]
    processed_text: str | None
    severity_map: dict[str, SeverityLevel] | None
    matches: list[Match] | None
    context_score: float | None
    reason: str | None
```
**Purpose**: Result of profanity check operation - unified field names (snake_case)
**Source**: [`packages/py/glin_profanity/types/types.py`](/packages/py/glin_profanity/types/types.py)

#### `ContextAwareConfig` TypedDict
```python
class ContextAwareConfig(TypedDict, total=False):
    enable_context_aware: bool
    context_window: int
    confidence_threshold: float
    domain_whitelists: dict[str, list[str]] | None
```
**Purpose**: Configuration for context-aware filtering - unified with JavaScript (snake_case)
**Source**: [`packages/py/glin_profanity/types/types.py`](/packages/py/glin_profanity/types/types.py)

#### `FilterConfig` TypedDict
```python
class FilterConfig(ContextAwareConfig, total=False):
    languages: list[Language] | None
    all_languages: bool
    case_sensitive: bool
    word_boundaries: bool
    custom_words: list[str] | None
    replace_with: str | None
    severity_levels: bool
    ignore_words: list[str] | None
    log_profanity: bool
    allow_obfuscated_match: bool
    fuzzy_tolerance_level: float
```
**Purpose**: Main filter configuration options - unified with JavaScript (snake_case)
**Source**: [`packages/py/glin_profanity/types/types.py`](/packages/py/glin_profanity/types/types.py)

#### `FilteredProfanityResult` TypedDict
```python
class FilteredProfanityResult(TypedDict):
    result: CheckProfanityResult
    filtered_words: list[str]
```
**Purpose**: Result with minimum severity filtering
**Source**: [`packages/py/glin_profanity/types/types.py`](/packages/py/glin_profanity/types/types.py)

---

## Package Entry Points and Exports

### JavaScript Package (`packages/js/src/index.ts`)

**Core API Exports**:
- `checkProfanity` - Main synchronous profanity check function
- `checkProfanityAsync` - Asynchronous profanity check function
- `isWordProfane` - Simple boolean profanity check

**Type Exports**:
- `ProfanityCheckerConfig` - High-level configuration interface
- `ProfanityCheckResult` - Enhanced result with auto-features

**React Integration**:
- `useProfanityChecker` - React hook for stateful profanity checking

**Advanced/Low-level**:
- `Filter` - Direct access to filter class

**Legacy Compatibility**:
- All unified types from `/types/types.ts` for backward compatibility

**Source**: [`packages/js/src/index.ts`](/packages/js/src/index.ts)

### Python Package (`packages/py/glin_profanity/__init__.py`)

**Main Class**:
- `Filter` - Primary profanity filter class

**Type System**:
- `CheckProfanityResult` - Result type for profanity checks
- `FilterConfig` - Configuration type for filters
- `FilteredProfanityResult` - Result type with severity filtering
- `Language` - Supported language type
- `Match` - Profanity match representation
- `SeverityLevel` - Match severity enumeration

**Source**: [`packages/py/glin_profanity/__init__.py`](/packages/py/glin_profanity/__init__.py)

---

## Cross-Language Compatibility

The Glin-Profanity repository maintains unified APIs between JavaScript/TypeScript and Python implementations:

### **Shared Features**
- **Dictionary Files**: Both implementations use identical JSON dictionary files from `shared/dictionaries/`
- **Algorithm Parity**: Identical profanity detection algorithms and fuzzy matching
- **Configuration Options**: Same configuration parameters with equivalent behavior
- **Result Structures**: Consistent result formats (with appropriate naming conventions)

### **Naming Conventions**
- **JavaScript/TypeScript**: `camelCase` (e.g., `containsProfanity`, `contextScore`)
- **Python**: `snake_case` (e.g., `contains_profanity`, `context_score`)

### **Type System Alignment**
- **Languages**: Identical list of 23 supported languages
- **Severity Levels**: Same `EXACT` and `FUZZY` severity enumeration
- **Match Objects**: Equivalent fields for profanity match representation
- **Configuration**: Parallel configuration options with same defaults

This comprehensive analysis covers every public API surface, internal function, class method, hook, and configuration interface in the Glin-Profanity codebase, providing complete documentation coverage for both JavaScript/TypeScript and Python implementations.

---

*Generated: 2025-08-11*  
*Source: Complete codebase analysis of Glin-Profanity repository*