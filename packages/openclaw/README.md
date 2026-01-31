# openclaw-profanity

> **Part of [glin-profanity](https://github.com/GLINCKER/glin-profanity)** - Content moderation plugin for **OpenClaw** (formerly **Moltbot** / **Clawdbot**)

[![npm version](https://img.shields.io/npm/v/openclaw-profanity.svg)](https://www.npmjs.com/package/openclaw-profanity)
[![glin-profanity](https://img.shields.io/badge/powered%20by-glin--profanity-blue)](https://www.npmjs.com/package/glin-profanity)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

The official **[glin-profanity](https://www.npmjs.com/package/glin-profanity)** plugin for OpenClaw AI agents. Provides 24-language profanity detection across WhatsApp, Telegram, Discord, Slack, iMessage, and all other supported platforms.

> **Note**: This package wraps [glin-profanity](https://www.npmjs.com/package/glin-profanity) for seamless OpenClaw integration. For standalone use, install `glin-profanity` directly.

## Features

- **24 Language Support** - Arabic, Chinese, Czech, Danish, Dutch, English, Esperanto, Finnish, French, German, Hindi, Hungarian, Italian, Japanese, Korean, Norwegian, Persian, Polish, Portuguese, Russian, Spanish, Swedish, Thai, Turkish
- **Multiple Integration Methods** - Skills, Plugin API, Hooks, and MCP
- **Leetspeak Detection** - Catches obfuscated profanity like "f0ck", "sh1t"
- **Unicode Normalization** - Detects homoglyph attacks like "fück"
- **Context-Aware** - Understands when words are used appropriately (gaming, quotes)
- **Platform Agnostic** - Works across all OpenClaw-supported messaging platforms

## Installation

```bash
# Via npm
npm install openclaw-profanity

# Via OpenClaw CLI
openclaw plugins install openclaw-profanity

# For hooks
openclaw hooks install openclaw-profanity
```

## Quick Start

### Option 1: Skills (Simplest)

Skills are automatically available after installation. Just ask your OpenClaw agent:

```
"Check this message for profanity: Hello world"
"Censor this text: What the fuck is this?"
"Is this appropriate to send?"
```

### Option 2: Plugin API (TypeScript)

```typescript
// In your OpenClaw plugin
import { registerProfanityTools } from 'openclaw-profanity';

export default function(api) {
  registerProfanityTools(api);
}
```

Or use individual tools:

```typescript
import { profanityTools } from 'openclaw-profanity';

export default function(api) {
  api.registerTool(profanityTools.checkProfanity);
  api.registerTool(profanityTools.censorText);
}
```

### Option 3: Hooks (Auto-Moderation)

```bash
# Enable the profanity guard hook
openclaw hooks enable profanity-guard
```

Configure via environment variables:

```bash
export PROFANITY_MODE=moderate     # strict | moderate | lenient
export PROFANITY_BLOCK=false       # Block profane messages
export PROFANITY_CENSOR=true       # Censor profane words
export PROFANITY_LANGUAGES=english,spanish,french
```

### Option 4: MCP (Model Context Protocol)

```json5
// openclaw.config.json5
{
  mcp: {
    servers: {
      "glin-profanity": {
        command: "npx",
        args: ["-y", "openclaw-profanity", "mcp-server"]
      }
    }
  }
}
```

## Available Tools

| Tool | Description |
|------|-------------|
| `check_profanity` | Check text for profanity in 24 languages |
| `censor_text` | Censor profanity with custom replacement |
| `batch_check_profanity` | Check multiple texts at once |
| `analyze_profanity_context` | Context-aware analysis |
| `get_supported_languages` | List all 24 supported languages |

## Skills

| Skill | Description |
|-------|-------------|
| `profanity_check` | Check messages for inappropriate content |
| `censor_message` | Automatically censor profanity |
| `content_guard` | Proactive content moderation |

## Hooks

| Hook | Description |
|------|-------------|
| `profanity-guard` | Auto-moderate all messages |

## Configuration

### Moderation Modes

- **Strict**: No tolerance, blocks all profanity
- **Moderate**: Context-aware, allows appropriate usage
- **Lenient**: Only flags severe profanity

### Multi-Language Example

```typescript
import { createProfanityGuard } from 'openclaw-profanity';

const guard = createProfanityGuard({
  mode: 'moderate',
  languages: ['english', 'spanish', 'french', 'german'],
  censorProfanity: true,
  censorReplacement: '[CENSORED]',
});
```

## Platform Support

Works with all OpenClaw-supported platforms:

- WhatsApp (via WhatsApp Web / Baileys)
- Telegram (Bot API / grammY)
- Discord (Bot API)
- Slack
- iMessage (imsg CLI)
- Microsoft Teams
- Matrix
- Google Chat
- Signal
- And more...

## API Reference

### Plugin Functions

```typescript
// Register all tools
registerProfanityTools(api: OpenClawAPI): void

// Individual tools
profanityTools.checkProfanity
profanityTools.censorText
profanityTools.batchCheck
profanityTools.analyzeContext
profanityTools.getSupportedLanguages
```

### Hook Functions

```typescript
// Create custom guard
createProfanityGuard(config: ProfanityGuardConfig): ProfanityGuard

// Quick one-time check
quickGuard(message: string, options?: GuardOptions): HookResult
```

### MCP Functions

```typescript
// Create MCP handler
createMCPHandler(): MCPHandler

// Execute tool directly
executeMCPTool(toolName: string, args: Record<string, unknown>): Promise<MCPToolResult>
```

## Compatibility

This plugin is compatible with:

- **OpenClaw** v1.x+ (current)
- **Moltbot** (legacy name, January 2026)
- **Clawdbot** (original name, December 2025)

<!-- SEO: moltbot profanity, clawdbot profanity, moltbot content moderation, clawdbot content moderation, openclaw content moderation, openclaw profanity filter, moltbot plugin, clawdbot plugin, openclaw plugin, ai agent content moderation, whatsapp profanity filter, telegram profanity filter, discord profanity filter, slack profanity filter -->

## Contributing

Contributions are welcome! Please see the [main repository](https://github.com/GLINCKER/glin-profanity) for guidelines.

## Related Projects

- [glin-profanity](https://github.com/GLINCKER/glin-profanity) - Core profanity detection library
- [OpenClaw](https://github.com/openclaw/openclaw) - Open-source personal AI assistant
- [Awesome OpenClaw Skills](https://github.com/voltagent/awesome-moltbot-skills) - Community skills collection

## License

MIT

---

Built with [glin-profanity](https://github.com/GLINCKER/glin-profanity) - The most comprehensive profanity detection library for JavaScript/TypeScript.

<!-- Keywords: openclaw, openclaw-plugin, openclaw-skill, openclaw-hook, moltbot, moltbot-skill, moltbot-plugin, clawdbot, clawdbot-skill, clawdbot-plugin, profanity-filter, content-moderation, ai-agent, ai-safety, whatsapp-moderation, telegram-moderation, discord-moderation, slack-moderation, chat-moderation, glin-profanity, mcp, model-context-protocol -->
