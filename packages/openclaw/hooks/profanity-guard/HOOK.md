---
name: profanity-guard
description: Automatic content moderation with 24-language profanity detection
version: 1.0.0
author: GLINR
---

# Profanity Guard Hook

Automatically moderate all messages passing through OpenClaw across all
connected platforms (WhatsApp, Telegram, Discord, Slack, iMessage, etc.).

## Installation

```bash
# Via OpenClaw CLI
openclaw hooks install openclaw-profanity

# Or manually
npm install openclaw-profanity
cp -r node_modules/openclaw-profanity/hooks/profanity-guard ~/.openclaw/hooks/
```

## Configuration

Set environment variables or edit the hook file:

| Variable | Values | Default | Description |
|----------|--------|---------|-------------|
| `PROFANITY_MODE` | strict, moderate, lenient | moderate | Strictness level |
| `PROFANITY_BLOCK` | true, false | false | Block profane messages |
| `PROFANITY_CENSOR` | true, false | true | Censor profane words |
| `PROFANITY_LANGUAGES` | comma-separated | english | Languages to check |

## Modes

### Strict
- Blocks or censors ALL profanity
- No context consideration
- Best for: Children's apps, professional environments

### Moderate (Default)
- Context-aware detection
- Allows profanity in appropriate contexts (gaming, quotes)
- Best for: General communities

### Lenient
- Only flags severe profanity
- Allows most casual language
- Best for: Adult communities

## Example

```bash
# Strict mode that blocks profanity
export PROFANITY_MODE=strict
export PROFANITY_BLOCK=true

# Multi-language support
export PROFANITY_LANGUAGES=english,spanish,french

# Restart OpenClaw
openclaw restart
```

## Supported Languages

24 languages: arabic, chinese, czech, danish, dutch, english, esperanto,
finnish, french, german, hindi, hungarian, italian, japanese, korean,
norwegian, persian, polish, portuguese, russian, spanish, swedish, thai, turkish

## Credits

Powered by [glin-profanity](https://github.com/GLINCKER/glin-profanity)

Compatible with OpenClaw, Moltbot (legacy), and Clawdbot (legacy).
