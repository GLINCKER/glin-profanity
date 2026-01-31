---
name: profanity_check
description: Check messages for profanity and inappropriate content in 24 languages
version: 1.0.0
author: GLINR
tools: [check_profanity]
---

# Profanity Check Skill

When the user asks you to check a message for profanity, or when you need to
verify content before sending, use the `check_profanity` tool.

## When to Use

- User asks "is this message appropriate?"
- User says "check this for profanity"
- Before sending messages to external platforms
- When moderating user-generated content

## How to Use

1. Call the `check_profanity` tool with the text to check
2. If `containsProfanity` is true, warn the user
3. Suggest alternatives if profanity is found

## Example Response

If profanity is detected:
"I found some inappropriate language in your message. The words [words] were flagged. Would you like me to suggest alternatives?"

If clean:
"Your message looks good! No inappropriate content detected."

## Multi-language Support

This skill supports 24 languages. Specify languages parameter if checking
non-English content:
- `languages: ["english", "spanish"]` for multi-language
- Default is English only

## Supported Languages

arabic, chinese, czech, danish, dutch, english, esperanto, finnish, french,
german, hindi, hungarian, italian, japanese, korean, norwegian, persian,
polish, portuguese, russian, spanish, swedish, thai, turkish

## Notes

- Detects leetspeak (e.g., "f0ck" → "fuck")
- Detects unicode obfuscation (e.g., "fück" → "fuck")
- Context-aware: "kick ass" in gaming is OK, offensive use is flagged

## Credits

Powered by [glin-profanity](https://github.com/GLINCKER/glin-profanity)

Compatible with OpenClaw, Moltbot (legacy), and Clawdbot (legacy).
