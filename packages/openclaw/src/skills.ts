/**
 * OpenClaw Skills - Markdown-based skill definitions
 *
 * Skills are simple Markdown files with YAML frontmatter that
 * OpenClaw uses to understand when and how to use tools.
 *
 * This module provides utilities to generate and manage skills
 * programmatically, as well as the skill content itself.
 *
 * @example
 * ```typescript
 * import { generateSkillFiles } from 'openclaw-profanity/skills';
 *
 * // Generate skill files to a directory
 * await generateSkillFiles('./my-skills');
 * ```
 *
 * @remarks
 * Compatible with OpenClaw, Moltbot (legacy), and Clawdbot (legacy).
 *
 * @packageDocumentation
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Skill definition structure
 */
export interface SkillDefinition {
  /** Skill identifier (snake_case) */
  name: string;
  /** Human-readable description */
  description: string;
  /** Skill version */
  version?: string;
  /** Skill author */
  author?: string;
  /** Required tools */
  tools?: string[];
  /** Skill instructions (Markdown) */
  instructions: string;
}

/**
 * Profanity check skill
 *
 * @remarks
 * Checks messages for inappropriate content before sending.
 * Works across WhatsApp, Telegram, Discord, Slack, iMessage.
 */
export const profanityCheckSkill: SkillDefinition = {
  name: 'profanity_check',
  description: 'Check messages for profanity and inappropriate content in 24 languages',
  version: '1.0.0',
  author: 'GLINR',
  tools: ['check_profanity'],
  instructions: `# Profanity Check Skill

When the user asks you to check a message for profanity, or when you need to
verify content before sending, use the \`check_profanity\` tool.

## When to Use

- User asks "is this message appropriate?"
- User says "check this for profanity"
- Before sending messages to external platforms
- When moderating user-generated content

## How to Use

1. Call the \`check_profanity\` tool with the text to check
2. If \`containsProfanity\` is true, warn the user
3. Suggest alternatives if profanity is found

## Example Response

If profanity is detected:
"I found some inappropriate language in your message. The words [words] were flagged. Would you like me to suggest alternatives?"

If clean:
"Your message looks good! No inappropriate content detected."

## Multi-language Support

This skill supports 24 languages. Specify languages parameter if checking
non-English content:
- \`languages: ["english", "spanish"]\` for multi-language
- Default is English only

## Notes

- Detects leetspeak (e.g., "f0ck" → "fuck")
- Detects unicode obfuscation (e.g., "fück" → "fuck")
- Context-aware: "kick ass" in gaming is OK, offensive use is flagged
`,
};

/**
 * Censor message skill
 *
 * @remarks
 * Automatically censors inappropriate content in messages.
 */
export const censorMessageSkill: SkillDefinition = {
  name: 'censor_message',
  description: 'Automatically censor profanity in messages by replacing with asterisks',
  version: '1.0.0',
  author: 'GLINR',
  tools: ['censor_text'],
  instructions: `# Censor Message Skill

When the user wants to send a message but have profanity automatically
censored, use the \`censor_text\` tool.

## When to Use

- User says "censor this message"
- User wants to share content but remove bad words
- Preparing content for family-friendly platforms
- Moderating user content before posting

## How to Use

1. Call the \`censor_text\` tool with the text
2. Return the censored version
3. Optionally show what was censored

## Parameters

- \`text\`: The text to censor
- \`replacement\`: Custom replacement (default: "***")
- \`languages\`: Array of languages to check

## Example

Input: "What the fuck is this shit?"
Output: "What the *** is this ***?"

## Custom Replacements

Users can specify custom replacement strings:
- "[CENSORED]" for formal documents
- "****" for standard
- "" (empty) to remove entirely
`,
};

/**
 * Content guard skill
 *
 * @remarks
 * Proactive content moderation for chat platforms.
 */
export const contentGuardSkill: SkillDefinition = {
  name: 'content_guard',
  description: 'Proactive content moderation guard for all incoming messages',
  version: '1.0.0',
  author: 'GLINR',
  tools: ['check_profanity', 'censor_text', 'analyze_profanity_context'],
  instructions: `# Content Guard Skill

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
1. Run \`check_profanity\` on the content
2. If flagged, use \`analyze_profanity_context\` for context
3. If still flagged after context, censor or warn

## Integration

This skill integrates with:
- WhatsApp groups (via OpenClaw/Moltbot bridge)
- Telegram channels
- Discord servers
- Slack workspaces
- iMessage threads
`,
};

/**
 * Batch moderation skill
 *
 * @remarks
 * Bulk content moderation for large datasets.
 */
export const batchModerationSkill: SkillDefinition = {
  name: 'batch_moderation',
  description: 'Bulk check multiple messages or documents for profanity',
  version: '1.0.0',
  author: 'GLINR',
  tools: ['batch_check_profanity'],
  instructions: `# Batch Moderation Skill

Check multiple texts for profanity in a single operation.
Efficient for bulk processing of messages, comments, or documents.

## When to Use

- Moderating backlog of messages
- Checking multiple comments at once
- Scanning document sections
- Processing exported chat history

## How to Use

1. Collect all texts to check into an array
2. Call \`batch_check_profanity\` with the texts array
3. Review results: flaggedCount, cleanCount, details

## Example

Input:
\`\`\`json
{
  "texts": [
    "Hello everyone!",
    "This is some bad shit",
    "Have a nice day"
  ]
}
\`\`\`

Output shows which texts (by index) contain profanity.

## Performance

- Processes up to 1000 texts per call
- Results include text preview (first 50 chars)
- Memory efficient for large batches
`,
};

/**
 * All available skills
 */
export const allSkills: SkillDefinition[] = [
  profanityCheckSkill,
  censorMessageSkill,
  contentGuardSkill,
  batchModerationSkill,
];

/**
 * Convert skill definition to Markdown file content
 */
export function skillToMarkdown(skill: SkillDefinition): string {
  const frontmatter = [
    '---',
    `name: ${skill.name}`,
    `description: ${skill.description}`,
  ];

  if (skill.version) frontmatter.push(`version: ${skill.version}`);
  if (skill.author) frontmatter.push(`author: ${skill.author}`);
  if (skill.tools?.length) frontmatter.push(`tools: [${skill.tools.join(', ')}]`);

  frontmatter.push('---');
  frontmatter.push('');

  return frontmatter.join('\n') + skill.instructions;
}

/**
 * Generate skill files to a directory
 *
 * @example
 * ```typescript
 * await generateSkillFiles('./skills');
 * // Creates:
 * // ./skills/profanity_check/SKILL.md
 * // ./skills/censor_message/SKILL.md
 * // ./skills/content_guard/SKILL.md
 * // ./skills/batch_moderation/SKILL.md
 * ```
 */
export async function generateSkillFiles(directory: string): Promise<string[]> {
  const createdFiles: string[] = [];

  for (const skill of allSkills) {
    const skillDir = path.join(directory, skill.name);
    const skillFile = path.join(skillDir, 'SKILL.md');

    // Create directory
    await fs.promises.mkdir(skillDir, { recursive: true });

    // Write skill file
    const content = skillToMarkdown(skill);
    await fs.promises.writeFile(skillFile, content, 'utf-8');

    createdFiles.push(skillFile);
  }

  return createdFiles;
}

/**
 * Get skill by name
 */
export function getSkill(name: string): SkillDefinition | undefined {
  return allSkills.find(s => s.name === name);
}

/**
 * List all skill names
 */
export function listSkillNames(): string[] {
  return allSkills.map(s => s.name);
}
