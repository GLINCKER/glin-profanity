# Glin-Profanity Repository File Map

> **Comprehensive file structure and purpose analysis for the Glin-Profanity multilingual profanity detection library**

## Repository Overview

Glin-Profanity is a cross-platform (JavaScript/TypeScript and Python) library for detecting and filtering profane language across 20+ languages. The repository uses a monorepo structure with Lerna for JavaScript package management and shared dictionary resources.

---

## Root Level Structure

```
glin-profanity/
├── package.json - Root workspace configuration for monorepo management with Lerna
├── package-lock.json - Root dependency lock file for consistent package installations
├── lerna.json - Lerna monorepo configuration for independent package versioning
├── tsconfig.json - Root TypeScript configuration for the entire workspace
├── webpack.config.js - Webpack bundler configuration for demo React application
├── README.md - Main project documentation with comprehensive API examples and usage
├── LICENSE - ISC license file for open source distribution
├── CODE_OF_CONDUCT.md - Community guidelines and behavioral expectations
├── SECURITY.md - Security policy and vulnerability reporting procedures
├── PULL_REQUEST_TEMPLATE.md - Template for standardized pull request submissions
├── RELEASE.md - Release process documentation and versioning guidelines
├── AUTOMATION.md - CI/CD automation workflows and deployment procedures
├── CI_CD_SETUP.md - Continuous integration and deployment setup instructions
├── CLAUDE.md - AI assistant integration documentation and guidelines
├── changelog.config.cjs - Changelog generation configuration for release notes
├── commitlint.config.cjs - Commit message linting rules for conventional commits
├── glinr-commit.json - Custom commit configuration for GLINR project standards
│
├── assets/
│   ├── glin-profanity-preview.png - Product preview image for README and marketing
│   └── glinr-logo.png - Official GLINR company logo for branding
│
├── docs/
│   ├── GLINR-COMMIT.md - GLINR-specific commit message format and conventions
│   └── dev-scan/
│       └── glin-profanity-paths.md - This file - comprehensive repository file map
│
├── scripts/
│   ├── glinr-commit.js - Custom commit message generator with project-specific rules
│   └── sync-versions.js - Version synchronization script between JavaScript and Python packages
│
├── src/ [Demo Application]
│   ├── index.tsx - Entry point for React demo application
│   └── App.tsx - Main React component demonstrating profanity checker functionality
│
├── public/
│   └── index.html - HTML template for demo React application
│
├── shared/
│   └── dictionaries/ [Cross-Language Profanity Dictionaries]
│       ├── english.json - English profanity word list with comprehensive coverage
│       ├── spanish.json - Spanish profanity detection dictionary
│       ├── french.json - French language profanity word collection
│       ├── german.json - German profanity detection database
│       ├── italian.json - Italian language offensive word dictionary
│       ├── portuguese.json - Portuguese profanity word repository
│       ├── russian.json - Russian language profanity detection list
│       ├── arabic.json - Arabic script profanity word database
│       ├── chinese.json - Chinese language offensive term dictionary
│       ├── japanese.json - Japanese profanity detection word list
│       ├── korean.json - Korean language offensive word repository
│       ├── hindi.json - Hindi language profanity detection dictionary
│       ├── persian.json - Persian/Farsi profanity word collection
│       ├── thai.json - Thai language offensive term database
│       ├── turkish.json - Turkish profanity detection word list
│       ├── polish.json - Polish language profanity dictionary
│       ├── czech.json - Czech language offensive word collection
│       ├── hungarian.json - Hungarian profanity detection database
│       ├── finnish.json - Finnish language profanity word list
│       ├── swedish.json - Swedish offensive term dictionary
│       ├── danish.json - Danish profanity detection database
│       ├── Norwegian.json - Norwegian language profanity word collection
│       ├── esperanto.json - Esperanto constructed language profanity list
│       └── globalWhitelist.json - Global whitelist for false positive prevention
│
├── tests/ [Cross-Language Parity Tests]
│   ├── cross-language-parity.test.js - JavaScript test suite ensuring API consistency between JS and Python
│   └── cross_language_parity_test.py - Python test suite validating identical behavior across languages
│
└── node_modules/ [Root Dependencies]
    └── ... - Workspace-level Node.js dependencies
```

---

## JavaScript/TypeScript Package Structure

```
packages/js/
├── package.json - JavaScript package configuration with dual CJS/ESM exports
├── tsconfig.json - Main TypeScript configuration for JavaScript package
├── tsconfig.commonjs.json - TypeScript configuration for CommonJS build output
├── tsconfig.esm.json - TypeScript configuration for ESM build output
├── jest.config.js - Jest testing framework configuration for unit tests
├── README.md - JavaScript-specific documentation and usage examples
│
├── src/ [Source Code]
│   ├── index.ts - Main package entry point exporting all public APIs
│   │
│   ├── core/ [Framework-Agnostic Core API]
│   │   ├── index.ts - Core profanity detection functions for any JavaScript environment
│   │   └── types.ts - TypeScript type definitions for core API functions
│   │
│   ├── data/
│   │   └── dictionary.ts - Dictionary loader and word database management
│   │
│   ├── filters/
│   │   └── Filter.ts - Low-level Filter class for advanced profanity detection
│   │
│   ├── hooks/ [React Integration]
│   │   └── useProfanityChecker.ts - React hook for stateful profanity checking with real-time validation
│   │
│   ├── nlp/ [Natural Language Processing]
│   │   └── contextAnalyzer.ts - Context-aware analysis for reducing false positives
│   │
│   └── types/
│       └── types.ts - Legacy TypeScript type definitions for backward compatibility
│
├── lib/ [Compiled Output]
│   ├── cjs/ [CommonJS Build]
│   │   ├── index.js - Compiled CommonJS entry point
│   │   ├── index.d.ts - TypeScript declarations for CommonJS
│   │   ├── data/
│   │   │   ├── dictionary.js - Compiled dictionary management
│   │   │   ├── dictionary.d.ts - Dictionary TypeScript declarations
│   │   │   └── [language].json - Copied language dictionaries
│   │   ├── filters/
│   │   │   ├── Filter.js - Compiled Filter class
│   │   │   └── Filter.d.ts - Filter TypeScript declarations
│   │   ├── hooks/
│   │   │   ├── useProfanityChecker.js - Compiled React hook
│   │   │   └── useProfanityChecker.d.ts - Hook TypeScript declarations
│   │   ├── nlp/
│   │   │   ├── contextAnalyzer.js - Compiled context analyzer
│   │   │   └── contextAnalyzer.d.ts - Context analyzer TypeScript declarations
│   │   └── types/
│   │       ├── types.js - Compiled legacy types
│   │       └── types.d.ts - Legacy type declarations
│   │
│   └── esm/ [ES Modules Build]
│       └── [Same structure as cjs/ but with ES module format]
│
├── tests/ [JavaScript Test Suite]
│   ├── core.test.ts - Core API functionality and edge case testing
│   ├── context-aware.test.ts - Context-aware filtering algorithm validation
│   └── useProfanityChecker.test.tsx - React hook testing with React Testing Library
│
├── coverage/ [Test Coverage Reports]
│   ├── index.html - HTML coverage report for browser viewing
│   ├── lcov-report/ - Detailed line-by-line coverage analysis
│   └── lcov.info - Coverage data in LCOV format for CI integration
│
└── node_modules/ [JavaScript Dependencies]
    └── ... - Package-specific Node.js dependencies
```

---

## Python Package Structure

```
packages/py/
├── pyproject.toml - Python package configuration with Hatch build system
├── README.md - Python-specific documentation and usage examples
│
├── glin_profanity/ [Python Source Package]
│   ├── __init__.py - Package initialization with public API exports and version info
│   │
│   ├── data/
│   │   ├── __init__.py - Data module initialization
│   │   └── dictionary.py - Dictionary loading and word database management for Python
│   │
│   ├── filters/
│   │   ├── __init__.py - Filters module initialization
│   │   └── filter.py - Main Filter class with comprehensive profanity detection logic
│   │
│   ├── nlp/
│   │   └── __init__.py - NLP module initialization for future context analysis
│   │
│   └── types/
│       ├── __init__.py - Types module initialization
│       └── types.py - Python type definitions using TypedDict for type safety
│
└── tests/ [Python Test Suite]
    ├── __init__.py - Test package initialization
    └── test_filter.py - Comprehensive Filter class testing with pytest framework
```

---

## Key Configuration Files

### Build & Development Configuration
- **`webpack.config.js`** - Demo application bundling with TypeScript and React support
- **`tsconfig.json`** - TypeScript compiler settings for the entire workspace
- **`tsconfig.commonjs.json`** - CommonJS-specific TypeScript compilation settings
- **`tsconfig.esm.json`** - ES Modules TypeScript compilation configuration
- **`jest.config.js`** - JavaScript testing framework configuration with coverage reporting
- **`pyproject.toml`** - Python packaging, dependencies, and tool configuration

### Version Management & Release
- **`lerna.json`** - Monorepo package management with independent versioning
- **`package.json` (root)** - Workspace dependencies and cross-package scripts
- **`sync-versions.js`** - Automated version synchronization between JavaScript and Python
- **`changelog.config.cjs`** - Automated changelog generation for releases

### Code Quality & Standards
- **`commitlint.config.cjs`** - Conventional commit message enforcement
- **`glinr-commit.json`** - GLINR-specific commit standards and templates
- **Tool configurations in `pyproject.toml`**: Black, isort, mypy, ruff, pytest

---

## Core Functionality Files

### JavaScript/TypeScript Core
- **`src/core/index.ts`** - Framework-agnostic profanity detection API (`checkProfanity`, `checkProfanityAsync`)
- **`src/filters/Filter.ts`** - Advanced Filter class with obfuscation detection and context awareness
- **`src/hooks/useProfanityChecker.ts`** - React hook with state management for real-time validation
- **`src/nlp/contextAnalyzer.ts`** - Context-aware analysis to reduce false positives
- **`src/data/dictionary.ts`** - Multi-language dictionary loader with lazy loading

### Python Core
- **`glin_profanity/filters/filter.py`** - Main Filter implementation with identical API to JavaScript
- **`glin_profanity/data/dictionary.py`** - Python dictionary management and word loading
- **`glin_profanity/types/types.py`** - Type-safe definitions using TypedDict

### Shared Resources
- **`shared/dictionaries/[language].json`** - 23 language-specific profanity dictionaries
- **`shared/dictionaries/globalWhitelist.json`** - False positive prevention whitelist

---

## Testing & Quality Assurance

### Cross-Language Testing
- **`tests/cross-language-parity.test.js`** - Validates identical behavior between JavaScript and Python APIs
- **`tests/cross_language_parity_test.py`** - Python counterpart ensuring API consistency

### JavaScript Testing
- **`packages/js/tests/core.test.ts`** - Core functionality testing with edge cases
- **`packages/js/tests/context-aware.test.ts`** - Context analysis algorithm validation
- **`packages/js/tests/useProfanityChecker.test.tsx`** - React hook integration testing

### Python Testing
- **`packages/py/tests/test_filter.py`** - Comprehensive Filter class testing with pytest

### Coverage & Reporting
- **`packages/js/coverage/`** - JavaScript code coverage reports in HTML and LCOV formats
- Generated coverage reports ensure high test coverage across both packages

---

## Documentation & Metadata

### Project Documentation
- **`README.md`** - Comprehensive project overview with 20+ language examples
- **`docs/GLINR-COMMIT.md`** - Commit message standards and conventions
- **`SECURITY.md`** - Security policy and vulnerability reporting procedures
- **`CODE_OF_CONDUCT.md`** - Community guidelines for contributors

### Package-Specific Documentation
- **`packages/js/README.md`** - JavaScript/TypeScript usage examples and React integration
- **`packages/py/README.md`** - Python-specific installation and usage instructions

### Legal & Licensing
- **`LICENSE`** - ISC open source license for the project
- Dual licensing options (MIT + GLINCKER LLC proprietary) mentioned in documentation

---

## Development & Automation

### Scripts & Utilities
- **`scripts/glinr-commit.js`** - Custom commit message generator with project standards
- **`scripts/sync-versions.js`** - Automated version synchronization across packages
- Root `package.json` scripts for building, testing, and releasing both packages

### CI/CD & Automation
- **`AUTOMATION.md`** - Automation workflow documentation
- **`CI_CD_SETUP.md`** - Continuous integration setup instructions
- **`RELEASE.md`** - Release process and versioning guidelines

---

## Demo Application

### React Demo
- **`src/index.tsx`** - Demo application entry point
- **`src/App.tsx`** - Interactive React component showcasing all profanity checker features
- **`public/index.html`** - HTML template for demo application
- Demonstrates real-time profanity detection, multi-language support, and configuration options

---

## Summary

The Glin-Profanity repository is a well-structured monorepo that provides:

1. **Cross-platform compatibility** - Identical APIs in JavaScript/TypeScript and Python
2. **Comprehensive testing** - Cross-language parity tests ensure consistent behavior
3. **Multi-language support** - 23 language dictionaries with shared resources
4. **Modern tooling** - TypeScript, React hooks, Python type hints, automated builds
5. **Production-ready** - Comprehensive documentation, security policies, and release automation
6. **Developer-friendly** - Demo application, extensive examples, and clear API documentation

The codebase demonstrates enterprise-level software engineering practices with automated testing, version synchronization, and comprehensive documentation for both JavaScript/TypeScript and Python ecosystems.

---

*Generated: 2025-08-11*
*Purpose: Comprehensive repository analysis for documentation and onboarding*