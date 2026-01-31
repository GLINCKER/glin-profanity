# MCP Server Guide

Complete guide for using glin-profanity with Model Context Protocol (MCP) for AI assistants.

## Table of Contents

- [What is MCP?](#what-is-mcp)
- [Installation](#installation)
- [Configuration](#configuration)
- [Available Tools](#available-tools)
- [Available Resources](#available-resources)
- [Available Prompts](#available-prompts)
- [Usage Examples](#usage-examples)
- [Integration with AI Assistants](#integration-with-ai-assistants)
- [Advanced Usage](#advanced-usage)
- [Troubleshooting](#troubleshooting)

---

## What is MCP?

**Model Context Protocol (MCP)** is a standardized protocol that enables AI assistants to interact with external tools and data sources. The glin-profanity MCP server provides:

- **19 Tools** - Direct profanity detection capabilities
- **20 Resources** - Complete documentation access
- **5 Prompts** - Guided workflows for content moderation

### Benefits

✅ **Direct Integration** - AI assistants call profanity tools directly  
✅ **Real-time Detection** - Instant profanity checking  
✅ **Complete Documentation** - AI can read docs to understand usage  
✅ **Guided Workflows** - Pre-built prompts for common tasks  
✅ **No API Keys Needed** - Runs locally on your machine  

---

## Installation

### For Claude Desktop

```bash
# Install globally
npm install -g glin-profanity-mcp

# Or auto-install with npx
npx glin-profanity-mcp --install-claude
```

**Manual Configuration:**

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "glin-profanity": {
      "command": "npx",
      "args": [
        "-y",
        "glin-profanity-mcp"
      ]
    }
  }
}
```

### For Cursor

Edit Cursor MCP settings (`~/.cursor/mcp_settings.json`):

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

### For Windsurf

Edit `~/.windsurf/mcp_config.json`:

```json
{
  "glin-profanity": {
    "command": "npx",
    "args": ["-y", "glin-profanity-mcp"]
  }
}
```

### For Custom MCP Clients

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({
  command: 'npx',
  args: ['-y', 'glin-profanity-mcp']
});

const client = new Client({
  name: 'my-mcp-client',
  version: '1.0.0'
}, {
  capabilities: {
    tools: {},
    resources: {},
    prompts: {}
  }
});

await client.connect(transport);
```

---

## Configuration

### Environment Variables

```bash
# Optional: Configure default behavior
GLIN_PROFANITY_LANGUAGES=english,spanish,french
GLIN_PROFANITY_LEETSPEAK=true
GLIN_PROFANITY_CACHE_SIZE=5000
```

### Server Options

The MCP server automatically initializes with optimal defaults:

```typescript
{
  languages: ['english'],
  detectLeetspeak: true,
  normalizeUnicode: true,
  cacheResults: true,
  cacheSize: 5000
}
```

---

## Available Tools

### 1. check_profanity

Check text for profanity with detailed results.

**Parameters:**
```typescript
{
  text: string;                                    // Required
  languages?: string[];                            // Optional
  detectLeetspeak?: boolean;                       // Optional
  leetspeakLevel?: 'basic' | 'moderate' | 'aggressive';
  normalizeUnicode?: boolean;                      // Optional
}
```

**Returns:**
```typescript
{
  containsProfanity: boolean;
  profaneWords: string[];
  wordCount: number;
  severityMap?: Record<string, number>;
}
```

**Example:**
```
Use check_profanity to scan: "This is f4cking bad"
→ {containsProfanity: true, profaneWords: ['fucking']}
```

### 2. censor_text

Replace profane words with censorship characters.

**Parameters:**
```typescript
{
  text: string;                  // Required
  replaceWith?: string;          // Default: '*'
  preserveLength?: boolean;      // Default: true
  detectLeetspeak?: boolean;
}
```

**Returns:**
```typescript
{
  originalText: string;
  processedText: string;
  containsProfanity: boolean;
  censoredWords: string[];
}
```

**Example:**
```
Use censor_text on: "What the fuck"
→ {processedText: "What the ****"}
```

### 3. batch_check_profanity

Check multiple texts in one call.

**Parameters:**
```typescript
{
  texts: string[];                          // Required: array of texts
  detectLeetspeak?: boolean;
  includeWordCounts?: boolean;
}
```

**Returns:**
```typescript
{
  results: Array<{
    text: string;
    containsProfanity: boolean;
    profaneWords: string[];
  }>;
  summary: {
    total: number;
    flagged: number;
    clean: number;
  };
}
```

**Example:**
```
Use batch_check_profanity on: ["Hello", "Fuck this", "Nice day"]
→ {flagged: 1, clean: 2}
```

### 4. analyze_context

Context-aware profanity analysis.

**Parameters:**
```typescript
{
  text: string;
  context?: 'medical' | 'gaming' | 'technical' | 'general';
  ignoreWords?: string[];
}
```

**Returns:**
```typescript
{
  containsProfanity: boolean;
  profaneWords: string[];
  contextAllowed: string[];
  safetyScore: number;
}
```

### 5. get_supported_languages

List all supported languages.

**Parameters:** None

**Returns:**
```typescript
{
  languages: string[];  // 24 languages
  totalLanguages: number;
}
```

### 6. validate_content

Multi-layer validation with scoring.

**Parameters:**
```typescript
{
  text: string;
  strictness?: 'lenient' | 'moderate' | 'strict';
}
```

**Returns:**
```typescript
{
  approved: boolean;
  score: number;        // 0-100
  issues: string[];
  recommendations: string[];
}
```

### 7. compare_strictness

Test text against different strictness levels.

**Parameters:**
```typescript
{
  text: string;
  levels?: string[];    // Default: all levels
}
```

**Returns:**
```typescript
{
  results: {
    lenient: { flagged: boolean };
    moderate: { flagged: boolean };
    strict: { flagged: boolean };
  };
}
```

### 8. suggest_alternatives

Get replacement suggestions for profane words.

**Parameters:**
```typescript
{
  text: string;
  maxSuggestions?: number;
}
```

**Returns:**
```typescript
{
  suggestions: Array<{
    original: string;
    alternatives: string[];
  }>;
}
```

### 9. explain_match

Explain why text was flagged.

**Parameters:**
```typescript
{
  text: string;
}
```

**Returns:**
```typescript
{
  matches: Array<{
    word: string;
    reason: string;
    severity: number;
    position: number;
  }>;
}
```

### 10-19. Additional Advanced Tools

- `analyze_corpus` - Analyze large text corpus
- `get_user_profile` - Get moderation history
- `update_user_profile` - Update user moderation data
- `check_streaming_message` - Real-time stream moderation
- `batch_moderate_stream` - Batch stream processing
- `analyze_conversation_health` - Conversation toxicity analysis
- `get_stream_stats` - Streaming statistics
- `get_moderation_trends` - Trend analysis
- `generate_report` - Generate moderation report
- `export_violations` - Export violation data

---

## Available Resources

The MCP server exposes **20 documentation resources**:

### Documentation Resources (15)

| URI | Description |
|-----|-------------|
| `glin-profanity://docs/index` | Documentation index |
| `glin-profanity://docs/installation` | Installation guide |
| `glin-profanity://docs/getting-started` | Quick start |
| `glin-profanity://docs/configuration` | Configuration reference |
| `glin-profanity://docs/api-reference` | API documentation |
| `glin-profanity://docs/faq` | FAQ |
| `glin-profanity://docs/examples` | Examples library |
| `glin-profanity://docs/testing` | Testing guide |
| `glin-profanity://docs/deployment` | Deployment guide |
| `glin-profanity://docs/security` | Security guide |
| `glin-profanity://docs/integrations/overview` | AI integrations overview |
| `glin-profanity://docs/integrations/openai` | OpenAI integration |
| `glin-profanity://docs/integrations/langchain` | LangChain integration |
| `glin-profanity://docs/integrations/vercel` | Vercel AI SDK |
| `glin-profanity://docs/integrations/semantic` | Semantic analysis |

### Reference Resources (5)

| URI | Description |
|-----|-------------|
| `glin-profanity://languages` | Supported languages |
| `glin-profanity://config-examples` | Configuration examples |
| `glin-profanity://severity-levels` | Severity level guide |
| `glin-profanity://domain-whitelists` | Domain-specific whitelists |
| `glin-profanity://detection-guide` | Detection techniques |

**Usage in AI Assistants:**

```
READ glin-profanity://docs/getting-started
READ glin-profanity://languages
READ glin-profanity://config-examples
```

---

## Available Prompts

The MCP server provides 5 pre-built prompts for guided workflows:

### 1. content_moderation

Step-by-step content moderation workflow.

**Parameters:**
- `content` (string) - Content to moderate
- `platform` (optional) - Platform type (social_media, gaming, education, professional, general)

**Workflow:**
1. Use `check_profanity` to scan
2. Use `explain_match` for flagged words
3. Use `validate_content` for final scoring
4. Recommend action: APPROVE, FLAG_FOR_REVIEW, EDIT_REQUIRED, or REJECT

### 2. content_cleanup

Clean up content containing profanity.

**Parameters:**
- `content` (string) - Content to clean
- `preserveMeaning` (boolean) - Whether to preserve original meaning

**Workflow:**
1. Use `check_profanity` to identify issues
2. Use `suggest_alternatives` for replacements
3. Provide cleaned version

### 3. audit_report

Generate comprehensive audit report.

**Parameters:**
- `description` (string) - Description of content being audited

**Workflow:**
1. Use `batch_check` on content
2. Use `analyze_corpus` for statistics
3. Generate summary with compliance rate, common violations, recommendations

### 4. filter_tuning

Tune filter settings for your use case.

**Parameters:**
- `useCase` (string) - Your use case (e.g., "gaming chat")
- `sampleContent` (optional string) - Sample content to test

**Workflow:**
1. Use `compare_strictness` to test levels
2. Identify false positives
3. Recommend optimal configuration

### 5. user_review

Review user's moderation history and risk profile.

**Parameters:**
- `userId` (string) - User ID to review

**Workflow:**
1. Use `get_user_profile` with includeHistory=true
2. Analyze violation patterns
3. Recommend action: no_action, warning, timeout, or ban

---

## Usage Examples

### Example 1: Basic Moderation with Claude

**User:** "Can you check if this message is appropriate: 'f4ck this game'"

**Claude's Actions:**
1. Reads `glin-profanity://docs/getting-started` to understand usage
2. Calls `check_profanity` tool with:
   ```json
   {
     "text": "f4ck this game",
     "detectLeetspeak": true
   }
   ```
3. Receives result:
   ```json
   {
     "containsProfanity": true,
     "profaneWords": ["fuck"]
   }
   ```
4. Responds: "This message contains profanity ('fuck' - obfuscated as 'f4ck'). It's not appropriate."

### Example 2: Content Cleanup

**User:** "Clean up this comment for publication"

**Claude's Actions:**
1. Uses `content_cleanup` prompt
2. Calls `check_profanity` to identify issues
3. Calls `suggest_alternatives` for replacements
4. Provides cleaned version with suggestions

### Example 3: Batch Moderation

**User:** "Moderate these 5 messages: [list of messages]"

**Claude's Actions:**
1. Calls `batch_check_profanity` with all messages
2. Reviews summary statistics
3. Provides detailed report with flagged messages

### Example 4: Configuration Help

**User:** "How should I configure the filter for a medical forum?"

**Claude's Actions:**
1. Reads `glin-profanity://config-examples`
2. Reads `glin-profanity://domain-whitelists`
3. Recommends configuration with medical whitelist
4. Provides code example

---

## Integration with AI Assistants

### Claude Desktop

Once configured, Claude can automatically:
- ✅ Check messages for profanity
- ✅ Censor inappropriate content
- ✅ Explain why content was flagged
- ✅ Suggest appropriate alternatives
- ✅ Generate moderation reports
- ✅ Read complete documentation

**Example Conversation:**

**You:** "Set up profanity filtering for my chat app"

**Claude:** 
1. Let me read the documentation first:
   - `READ glin-profanity://docs/installation`
   - `READ glin-profanity://docs/getting-started`

2. I'll help you set up profanity filtering. Here's how:
   ```javascript
   import { Filter } from 'glin-profanity';
   
   const filter = new Filter({
     detectLeetspeak: true,
     languages: ['english']
   });
   
   function moderateMessage(text) {
     const result = filter.checkProfanity(text);
     return !result.containsProfanity;
   }
   ```

3. Would you like me to test it on some sample messages?

### Cursor

Integrates seamlessly with coding workflows:

**You:** "Add profanity filtering to this API endpoint"

**Cursor:**
1. Reads relevant documentation
2. Inserts appropriate code
3. Adds error handling
4. Tests with `check_profanity` tool

### Custom Integration

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

const client = new Client({...});
await client.connect(transport);

// List available tools
const tools = await client.listTools();
console.log(tools);

// Call a tool
const result = await client.callTool('check_profanity', {
  text: 'test message',
  detectLeetspeak: true
});

// Read a resource
const docs = await client.readResource('glin-profanity://docs/getting-started');
console.log(docs.contents[0].text);
```

---

## Advanced Usage

### Streaming Monitoring

```typescript
// AI Assistant can monitor streaming content
const conversation = [
  { userId: 'user1', text: 'Hello' },
  { userId: 'user1', text: 'This is shit' },
  { userId: 'user2', text: 'Calm down' }
];

for (const message of conversation) {
  await client.callTool('check_streaming_message', {
    userId: message.userId,
    text: message.text
  });
}

const stats = await client.callTool('get_stream_stats', {});
```

### User Profile Tracking

```typescript
// Track user violations
await client.callTool('update_user_profile', {
  userId: 'user123',
  violation: {
    content: 'fuck this',
    timestamp: Date.now()
  }
});

// Get  profile
const profile = await client.callTool('get_user_profile', {
  userId: 'user123',
  includeHistory: true
});

// Risk score: 0-100
console.log(profile.riskScore);
```

### Custom Workflows

Combine multiple tools for complex workflows:

```typescript
// 1. Check content
const check = await client.callTool('check_profanity', {
  text: userMessage
});

if (check.containsProfanity) {
  // 2. Explain why
  const explanation = await client.callTool('explain_match', {
    text: userMessage
  });

  // 3. Get alternatives
  const suggestions = await client.callTool('suggest_alternatives', {
    text: userMessage
  });

  // 4. Generate report
  const report = await client.callTool('generate_report', {
    content: userMessage,
    severity: 'high'
  });
}
```

---

## Troubleshooting

### MCP Server Not Found

**Problem:** AI assistant can't find glin-profanity server

**Solution:**
```bash
# Verify installation
npx glin-profanity-mcp --version

# Check config file location
# Claude: ~/Library/Application Support/Claude/claude_desktop_config.json
# Cursor: ~/.cursor/mcp_settings.json

# Restart AI assistant after configuration
```

### Tools Not Working

**Problem:** Tools return errors

**Solution:**
1. Check Claude Desktop logs:
   ```bash
   tail -f ~/Library/Logs/Claude/mcp-server-glin-profanity.log
   ```

2. Verify tool parameters:
   ```typescript
   // Correct
   { text: "message", detectLeetspeak: true }

   // Incorrect
   { message: "message" }  // Wrong parameter name
   ```

### Resources Not Loading

**Problem:** Documentation resources return empty

**Solution:**
- Ensure latest version: `npm install -g glin-profanity-mcp@latest`
- Restart AI assistant
- Check resource URI format: `glin-profanity://docs/...`

### Performance Issues

**Problem:** Slow tool responses

**Solution:**
```bash
# Increase cache size
export GLIN_PROFANITY_CACHE_SIZE=10000

# Reduce languages if needed
export GLIN_PROFANITY_LANGUAGES=english

# Restart MCP server
```

---

## Best Practices

### For AI Assistants

1. **Read Docs First** - Use resources to understand capabilities
2. **Use Appropriate Tools** - Choose the right tool for the task
3. **Combine Tools** - Create workflows with multiple tools
4. **Check Examples** - Reference `docs/examples` resource
5. **Handle Errors** - Gracefully handle tool failures

### For Developers

1. **Keep Updated** - Regularly update MCP server
2. **Monitor Logs** - Check logs for issues
3. **Optimize Config** - Tune environment variables
4. **Test Locally** - Test tools before production
5. **Provide Context** - Give AI assistants clear instructions

---

## Next Steps

- [Installation Guide](./installation.md) - Detailed installation
- [API Reference](./api-reference.md) - Complete API docs
- [Examples](./examples.md) - Code examples
- [AI Integrations](./integrations/) - Framework integrations

---

**Questions?** Open an issue on [GitHub](https://github.com/GLINCKER/glin-profanity/issues).
