---
name: censor_message
description: Automatically censor profanity in messages by replacing with asterisks
version: 1.0.0
author: GLINR
tools: [censor_text]
---

# Censor Message Skill

When the user wants to send a message but have profanity automatically
censored, use the `censor_text` tool.

## When to Use

- User says "censor this message"
- User wants to share content but remove bad words
- Preparing content for family-friendly platforms
- Moderating user content before posting

## How to Use

1. Call the `censor_text` tool with the text
2. Return the censored version
3. Optionally show what was censored

## Parameters

- `text`: The text to censor
- `replacement`: Custom replacement (default: "***")
- `languages`: Array of languages to check

## Example

Input: "What the fuck is this shit?"
Output: "What the *** is this ***?"

## Custom Replacements

Users can specify custom replacement strings:
- "[CENSORED]" for formal documents
- "****" for standard
- "" (empty) to remove entirely
- "[REDACTED]" for official-looking documents

## Multi-language Support

Works with 24 languages. For non-English content, specify:
```
languages: ["spanish", "portuguese"]
```

## Platform Integration

This skill works across all OpenClaw-supported platforms:
- WhatsApp
- Telegram
- Discord
- Slack
- iMessage
- And more...

## Credits

Powered by [glin-profanity](https://github.com/GLINCKER/glin-profanity)

Compatible with OpenClaw, Moltbot (legacy), and Clawdbot (legacy).
