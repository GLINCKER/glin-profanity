---
name: content_guard
description: Proactive content moderation guard for all incoming messages
version: 1.0.0
author: GLINR
tools: [check_profanity, censor_text, analyze_profanity_context]
---

# Content Guard Skill

This skill provides proactive content moderation across all messaging
platforms (WhatsApp, Telegram, Discord, Slack, iMessage, etc.).

## Automatic Moderation Mode

When enabled, automatically:
1. Check all incoming messages for profanity
2. Flag or censor based on configuration
3. Log incidents for review

## Configuration

The guard can be configured for different strictness levels:

### Strict Mode
- Block all profanity immediately
- No context consideration
- Best for: Children's platforms, professional environments

### Moderate Mode (Default)
- Check with context awareness
- Allow profanity in gaming/casual contexts
- Best for: General community platforms

### Lenient Mode
- Only flag severe profanity
- Allow most casual language
- Best for: Adult communities

## Usage in Conversations

When a message comes in:
1. Run `check_profanity` on the content
2. If flagged, use `analyze_profanity_context` for context
3. If still flagged after context, censor or warn

## Integration

This skill integrates with:
- WhatsApp groups (via OpenClaw/Moltbot bridge)
- Telegram channels
- Discord servers
- Slack workspaces
- iMessage threads
- Matrix rooms
- Microsoft Teams

## Supported Languages

All 24 languages are supported for moderation:
arabic, chinese, czech, danish, dutch, english, esperanto, finnish, french,
german, hindi, hungarian, italian, japanese, korean, norwegian, persian,
polish, portuguese, russian, spanish, swedish, thai, turkish

## Credits

Powered by [glin-profanity](https://github.com/GLINCKER/glin-profanity)

Compatible with OpenClaw, Moltbot (legacy), and Clawdbot (legacy).
