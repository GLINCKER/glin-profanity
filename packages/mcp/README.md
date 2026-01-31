# glin-profanity-mcp

> **Part of [glin-profanity](https://github.com/GLINCKER/glin-profanity)** - MCP server for AI assistants

[![npm version](https://img.shields.io/npm/v/glin-profanity-mcp.svg)](https://www.npmjs.com/package/glin-profanity-mcp)
[![glin-profanity](https://img.shields.io/badge/powered%20by-glin--profanity-blue)](https://www.npmjs.com/package/glin-profanity)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

MCP (Model Context Protocol) server for **glin-profanity** - enables AI assistants like Claude Desktop, Cursor, Windsurf, and other MCP-compatible tools to use profanity detection and content moderation as native tools.

## What is MCP?

The [Model Context Protocol (MCP)](https://modelcontextprotocol.io) is an open standard developed by Anthropic that allows AI assistants to securely access external tools and data sources. This package turns glin-profanity into an MCP server that AI assistants can use for content moderation.

## Features

- **19 Powerful Tools** for comprehensive content moderation
- **4 Workflow Prompts** for guided AI interactions
- **5 Reference Resources** for configuration and best practices
- **24 Language Support** - Arabic, Chinese, English, French, German, Spanish, and more
- **Context-Aware Analysis** - Domain-specific whitelists reduce false positives
- **Obfuscation Detection** - Catches leetspeak (`f4ck`) and Unicode tricks
- **Batch Processing** - Check multiple texts efficiently
- **Content Scoring** - Get safety scores for moderation decisions

## Installation

### For Claude Desktop

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "glin-profanity": {
      "command": "npx",
      "args": ["-y", "glin-profanity-mcp"]
    }
  }
}
```

### For Cursor

Add to your Cursor MCP settings (`.cursor/mcp.json` in your project or global config):

```json
{
  "mcpServers": {
    "glin-profanity": {
      "command": "npx",
      "args": ["-y", "glin-profanity-mcp"]
    }
  }
}
```

### For Windsurf / Other MCP Clients

```json
{
  "mcpServers": {
    "glin-profanity": {
      "command": "npx",
      "args": ["-y", "glin-profanity-mcp"]
    }
  }
}
```

### Local Installation

```bash
npm install -g glin-profanity-mcp

# Then use in config:
{
  "mcpServers": {
    "glin-profanity": {
      "command": "glin-profanity-mcp"
    }
  }
}
```

---

## Available Tools (12)

### Core Detection Tools

#### 1. `check_profanity`
Check text for profanity with detailed results.

```
"Check this user comment for profanity: 'Your product is sh1t'"
```

**Parameters:**
- `text` (required): Text to check
- `languages`: Array of languages (default: all)
- `detectLeetspeak`: Detect `f4ck`, `sh1t` patterns
- `normalizeUnicode`: Detect Unicode tricks
- `customWords`: Additional words to flag
- `ignoreWords`: Words to whitelist

---

#### 2. `censor_text`
Censor profanity by replacing with asterisks or custom characters.

```
"Censor this message: 'What the hell is going on?'"
```

**Parameters:**
- `text` (required): Text to censor
- `replaceWith`: Replacement character (default: `*`)
- `preserveFirstLetter`: Keep first letter (`f***` instead of `****`)

---

#### 3. `analyze_context`
Context-aware analysis with domain-specific whitelists.

```
"Analyze this medical text: 'The patient has a breast tumor'"
```

**Parameters:**
- `text` (required): Text to analyze
- `domain`: `medical`, `gaming`, `technical`, `educational`, `general`
- `contextWindow`: Words to consider around matches (1-10)
- `confidenceThreshold`: Minimum confidence to flag (0-1)

---

#### 4. `batch_check`
Check multiple texts in one operation (up to 100).

```
"Batch check these comments: ['Great!', 'This sucks', 'Awesome']"
```

**Parameters:**
- `texts` (required): Array of texts (max 100)
- `returnOnlyFlagged`: Only return texts with profanity

---

#### 5. `validate_content`
Comprehensive content validation with safety scoring (0-100).

```
"Validate this blog post with high strictness"
```

**Parameters:**
- `text` (required): Content to validate
- `strictness`: `low`, `medium`, `high`
- `context`: Description of content type

**Returns:** Safety score, action recommendation (`approve`, `review`, `edit`, `reject`)

---

#### 6. `detect_obfuscation`
Detect text obfuscation techniques.

```
"Check if this uses obfuscation: 'Y0u @re an 1d10t'"
```

**Detects:** Leetspeak, Unicode homoglyphs, zero-width characters, spaced characters

---

#### 7. `get_supported_languages`
Get list of all 24 supported languages.

---

### Advanced Analysis Tools

#### 8. `explain_match`
Explain why a word was flagged with detailed reasoning.

```
"Explain why 'f4ck' was detected as profanity"
```

**Returns:**
- Detection method (direct, leetspeak, Unicode)
- Detailed reasoning
- Suggestions for handling

---

#### 9. `suggest_alternatives`
Suggest clean alternatives for profane content.

```
"Suggest alternatives for: 'This is shit' with professional tone"
```

**Parameters:**
- `text` (required): Text with profanity
- `tone`: `formal`, `casual`, `humorous`, `professional`

---

#### 10. `analyze_corpus`
Analyze a collection of texts for profanity statistics (up to 500 texts).

```
"Analyze these 100 user comments for a moderation report"
```

**Returns:**
- Profanity rate statistics
- Top profane words frequency
- Severity distribution
- Recommendations

---

#### 11. `compare_strictness`
Compare detection results across different strictness levels.

```
"Compare strictness levels for: 'You are such a n00b'"
```

**Returns:** Detection results at minimal, low, medium, high, and paranoid levels with recommendation.

---

#### 12. `create_regex_pattern`
Generate regex patterns for custom profanity detection.

```
"Create a regex pattern to catch variants of 'fuck'"
```

**Parameters:**
- `word` (required): Base word
- `includeVariants`: `basic`, `moderate`, `aggressive`

**Returns:** Ready-to-use regex patterns for JavaScript and Python.

---

## Available Prompts (4)

MCP Prompts provide guided workflows for common tasks.

### 1. `content_moderation`
Step-by-step content moderation workflow.

```
Use the content_moderation prompt with:
- content: "User comment to moderate"
- platform: "gaming" (or social_media, education, professional, general)
```

### 2. `content_cleanup`
Clean up content containing profanity for safe publishing.

```
Use the content_cleanup prompt with:
- content: "Text to clean up"
- preserveMeaning: true
```

### 3. `audit_report`
Generate a comprehensive moderation audit report.

```
Use the audit_report prompt with:
- description: "Weekly user comments audit"
```

### 4. `filter_tuning`
Tune profanity filter settings for your specific use case.

```
Use the filter_tuning prompt with:
- useCase: "Gaming chat moderation"
- sampleContent: "Example messages from your platform"
```

---

## Available Resources (5)

Resources provide reference data accessible to AI assistants.

| Resource | URI | Description |
|----------|-----|-------------|
| Languages | `glin-profanity://languages` | All 24 supported languages with regional groupings |
| Config Examples | `glin-profanity://config-examples` | Ready-to-use configuration templates |
| Severity Levels | `glin-profanity://severity-levels` | Explanation of severity scoring |
| Domain Whitelists | `glin-profanity://domain-whitelists` | Domain-specific whitelist references |
| Detection Guide | `glin-profanity://detection-guide` | Guide to detection techniques and recommended configs |

---

## Example Prompts for AI Assistants

### Basic Usage
```
"Check this user comment for profanity"
"Censor the bad words in this message"
"What languages does glin-profanity support?"
```

### Advanced Analysis
```
"Explain why this text was flagged and suggest alternatives"
"Compare strictness levels for this gaming chat message"
"Create a regex pattern to catch variants of [word]"
```

### Batch Operations
```
"Analyze these 50 comments and give me a moderation report"
"Batch check all these messages and return only the flagged ones"
```

### Context-Aware
```
"Analyze this medical article with medical domain context"
"Check this gaming chat with relaxed gaming platform rules"
```

### Workflow Automation
```
"Use the content_moderation workflow on this user submission"
"Help me tune my filter settings for an educational platform"
```

---

## Use Cases

| Use Case | Recommended Tools |
|----------|-------------------|
| Chat moderation | `check_profanity`, `censor_text`, `batch_check` |
| Content publishing | `validate_content`, `suggest_alternatives` |
| Medical/Educational | `analyze_context` with domain parameter |
| Moderation dashboards | `analyze_corpus`, `batch_check` |
| Filter tuning | `compare_strictness`, `filter_tuning` prompt |
| Custom rules | `create_regex_pattern` |
| Understanding flags | `explain_match` |

---

## Development

### Running Locally

```bash
# Install dependencies
npm install

# Build
npm run build

# Run the server
npm start

# Test with MCP Inspector
npm run inspect
```

### Testing with MCP Inspector

```bash
npx @anthropic-ai/mcp-inspector node dist/index.js
```

---

## Supported Languages

| Region | Languages |
|--------|-----------|
| European | English, French, German, Spanish, Italian, Dutch, Portuguese, Polish, Czech, Danish, Finnish, Hungarian, Norwegian, Swedish, Esperanto |
| Asian | Chinese, Japanese, Korean, Thai, Hindi |
| Middle Eastern | Arabic, Persian, Turkish |
| Other | Russian |

---

## License

MIT - See [LICENSE](../../LICENSE) for details.

## Links

- [Main glin-profanity repo](https://github.com/GLINCKER/glin-profanity)
- [MCP Documentation](https://modelcontextprotocol.io)
- [Report Issues](https://github.com/GLINCKER/glin-profanity/issues)
