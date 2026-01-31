# glin-profanity + OpenAI Integration

Seamlessly integrate profanity detection and content moderation into OpenAI's function-calling workflows. This integration provides ready-to-use tool definitions compatible with GPT-4o, GPT-4, GPT-3.5-turbo, and other OpenAI models.

## Quick Start

### Installation

```bash
# Required
npm install glin-profanity

# Peer dependencies
npm install openai zod
```

### Basic Example

```typescript
import OpenAI from 'openai';
import { profanity Tools, executeProfanityTool } from 'glin-profanity/ai/openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const response = await client.chat.completions.create({
  model: process.env.OPENAI_MODEL || 'gpt-4o',
  messages: [{ role: 'user', content: 'Check if "damn it" contains profanity' }],
  tools: profanityTools,
});

// Handle tool calls
for (const toolCall of response.choices[0].message.tool_calls || []) {
  const result = await executeProfanityTool(toolCall.function.name, JSON.parse(toolCall.function.arguments));
  console.log(result);
}
```

## Available Tools

### Tool 1: check_profanity

Detects profanity in a single text string with advanced options.

**Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `text` | string | Yes | - | The text to check |
| `languages` | string[] | No | `["english"]` | Languages to check against |
| `detectLeetspeak` | boolean | No | `true` | Enable leetspeak detection |
| `normalizeUnicode` | boolean | No | `true` | Enable Unicode normalization |

**Returns:**
```typescript
{
  containsProfanity: boolean;
  profaneWords: string[];
  severityMap?: Record<string, number>;
  wordCount: number;
}
```

**Example:**
```typescript
const result = await executeProfanityTool('check_profanity', {
  text: 'Hello world',
  detectLeetspeak: true,
  languages: ['english', 'spanish']
});
// { containsProfanity: false, profaneWords: [], wordCount: 2 }
```

### Tool 2: censor_text

Censors profane words by replacing them with a specified character or string.

**Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `text` | string | Yes | - | The text to censor |
| `replacement` | string | No | `"*"` | Character/string to replace profanity |
| `languages` | string[] | No | `["english"]` | Languages to check against |

**Returns:**
```typescript
{
  originalText: string;
  censoredText: string;
  profaneWordsFound: string[];
  wasModified: boolean;
}
```

**Example:**
```typescript
const result = await executeProfanityTool('censor_text', {
  text: 'What the hell is going on',
  replacement: '***'
});
// { originalText: '...', censoredText: 'What the *** is going on', wasModified: true }
```

### Tool 3: batch_check_profanity

Efficiently checks multiple texts in a single call.

**Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `texts` | string[] | Yes | - | Array of texts to check |
| `languages` | string[] | No | `["english"]` | Languages to check against |
| `detectLeetspeak` | boolean | No | `true` | Enable leetspeak detection |

**Returns:**
```typescript
{
  totalTexts: number;
  flaggedCount: number;
  cleanCount: number;
  results: Array<{
    index: number;
    text: string;
    containsProfanity: boolean;
    profaneWords: string[];
  }>;
}
```

### Tool 4: analyze_context

Performs context-aware profanity analysis for more nuanced detection.

**Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `text` | string | Yes | - | The text to analyze |
| `languages` | string[] | No | `["english"]` | Languages to check against |
| `contextWindow` | number | No | `10` | Context window size |
| `confidenceThreshold` | number | No | `0.7` | Confidence threshold |

**Returns:**
```typescript
{
  containsProfanity: boolean;
  profaneWords: string[];
  contextScore?: number;
  matches?: unknown[];
  reason?: string;
}
```

### Tool 5: get_supported_languages

Returns the list of all supported languages for profanity detection.

**Parameters:** None

**Returns:**
```typescript
{
  languages: string[];
  count: number;
}
```

## Common Use Cases

### Use Case 1: Chat Message Moderation

```typescript
import OpenAI from 'openai';
import { profanityTools, executeProfanityTool } from 'glin-profanity/ai/openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function moderateChatMessage(userMessage: string) {
  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are a chat moderator. Check messages for profanity and provide a moderation decision.'
      },
      {
        role: 'user',
        content: `Moderate this message: "${userMessage}"`
      }
    ],
    tools: profanityTools,
    tool_choice: 'auto',
  });

  const message = response.choices[0].message;

  if (message.tool_calls) {
    for (const toolCall of message.tool_calls) {
      const result = await executeProfanityTool(
        toolCall.function.name,
        JSON.parse(toolCall.function.arguments)
      );

      if (result.containsProfanity) {
        return {
          allowed: false,
          reason: `Message contains profanity: ${result.profaneWords.join(', ')}`,
          censored: result.censoredText || null
        };
      }
    }
  }

  return {
    allowed: true,
    message: userMessage
  };
}
```

### Use Case 2: Content Batch Processing

```typescript
import OpenAI from 'openai';
import { executeProfanityTool } from 'glin-profanity/ai/openai';

async function moderateCommentBatch(comments: string[]) {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // Use batch_check_profanity for efficiency
  const result = await executeProfanityTool('batch_check_profanity', {
    texts: comments,
    detectLeetspeak: true,
    languages: ['english', 'spanish']
  });

  // Filter out problematic comments
  const flagged = result.results
    .filter(r => r.containsProfanity)
    .map(r => ({
      comment: r.text,
      profanity: r.profaneWords,
      index: r.index
    }));

  console.log(`Scanned ${result.totalTexts} comments`);
  console.log(`Flagged ${result.flaggedCount}, Clean ${result.cleanCount}`);

  return {
    total: result.totalTexts,
    flagged,
    cleanComments: result.results.filter(r => !r.containsProfanity)
  };
}
```

### Use Case 3: Real-time Streaming with Tool Calls

```typescript
import OpenAI from 'openai';
import { profanityTools, executeProfanityTool } from 'glin-profanity/ai/openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function moderateStreamingChat(userInput: string) {
  const stream = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    messages: [
      { role: 'system', content: 'You are a helpful, family-friendly assistant.' },
      { role: 'user', content: userInput }
    ],
    tools: profanityTools,
    stream: true,
  });

  let toolCalls: any[] = [];

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta;

    if (delta.tool_calls) {
      toolCalls.push(...delta.tool_calls);
    }
  }

  // Execute any profanity checks that were triggered
  for (const toolCall of toolCalls) {
    if (toolCall.function?.name?.includes('profanity')) {
      const result = await executeProfanityTool(
        toolCall.function.name,
        JSON.parse(toolCall.function.arguments || '{}')
      );
      console.log('Profanity check result:', result);
    }
  }
}
```

## Advanced Configuration

### Custom Languages

```typescript
import { executeProfanityTool } from 'glin-profanity/ai/openai';

const result = await executeProfanityTool('check_profanity', {
  text: 'Tu texto aquí',
  languages: ['spanish', 'english'],
  detectLeetspeak: true
});
```

### Leetspeak Detection

```typescript
// Detect obfuscated profanity like "h3ll", "d@mn", "sh1t"
const result = await executeProfanityTool('check_profanity', {
  text: '5h1t h@pp3n5',
  detectLeetspeak: true,
  normalizeUnicode: true
});
// Will detect the obfuscated profanity
```

### Context-Aware Filtering

```typescript
// More nuanced detection that considers surrounding words
const result = await executeProfanityTool('analyze_context', {
  text: 'The damn door is stuck again',
  contextWindow: 15,
  confidenceThreshold: 0.8,
  languages: ['english']
});
```

## Framework-Specific Patterns

### Pattern 1: Automated Function Calling with runTools()

For streamlined workflows, use OpenAI's `runTools()` method:

```typescript
import OpenAI from 'openai';
import { createRunnableTools } from 'glin-profanity/ai/openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const runner = client.beta.chat.completions.runTools({
  model: process.env.OPENAI_MODEL || 'gpt-4o',
  messages: [
    { role: 'user', content: 'Check if "What the hell" contains bad words' }
  ],
  tools: createRunnableTools(),
});

runner.on('message', (message) => console.log(message));

const finalContent = await runner.finalContent();
console.log('Final result:', finalContent);
```

### Pattern 2: Using Zod Schemas

For type-safe function definitions:

```typescript
import { zodFunction } from 'openai/helpers/zod';
import { profanityToolSchemas } from 'glin-profanity/ai/openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const tools = [
  zodFunction({
    name: 'check_profanity',
    parameters: profanityToolSchemas.checkProfanity()
  }),
  zodFunction({
    name: 'censor_text',
    parameters: profanityToolSchemas.censorText()
  })
];

const response = await client.chat.completions.create({
  model: process.env.OPENAI_MODEL || 'gpt-4o',
  messages: [{ role: 'user', content: 'Moderate this text' }],
  tools,
});
```

### Pattern 3: Custom Filter Configuration

```typescript
import { createRunnableTools } from 'glin-profanity/ai/openai';

// Create tools with custom filter settings
const customTools = createRunnableTools({
  languages: ['english', 'spanish', 'french'],
  detectLeetspeak: true,
});

const runner = client.beta.chat.completions.runTools({
  model: process.env.OPENAI_MODEL || 'gpt-4o',
  messages: [{ role: 'user', content: 'Check multilingual content' }],
  tools: customTools,
});
```

## Error Handling

Always handle potential errors when calling OpenAI tools:

```typescript
import OpenAI from 'openai';
import { executeProfanityTool } from 'glin-profanity/ai/openai';

async function safeModeratepMessage(message: string) {
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [{ role: 'user', content: message }],
      tools: profanityTools,
    });

    if (response.choices[0].message.tool_calls) {
      for (const toolCall of response.choices[0].message.tool_calls) {
        try {
          const result = await executeProfanityTool(
            toolCall.function.name,
            JSON.parse(toolCall.function.arguments)
          );
          return result;
        } catch (toolError) {
          console.error('Tool execution error:', toolError);
          // Fallback to basic check
          return { containsProfanity: false, error: 'Tool failed' };
        }
      }
    }
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Moderation service unavailable');
  }
}
```

## Performance Tips

- **Use batch operations**: For multiple texts, always use `batch_check_profanity` instead of individual calls
- **Cache results**: Cache profanity check results for frequently used phrases or templates
- **Choose the right model**: GPT-3.5-turbo is faster and cheaper for simple moderation tasks; reserve GPT-4o for complex context analysis
- **Limit context window**: For `analyze_context`, use smaller context windows (5-10) for better performance
- **Stream when possible**: Use streaming for real-time applications to reduce perceived latency

## TypeScript Support

The integration is fully typed with TypeScript:

```typescript
import type {
  OpenAITool,
  CheckProfanityParams,
  CensorTextParams,
  BatchCheckParams,
  AnalyzeContextParams
} from 'glin-profanity/ai/openai';

// Full type safety
const params: CheckProfanityParams = {
  text: 'Hello world',
  languages: ['english'],
  detectLeetspeak: true,
  normalizeUnicode: true
};
```

## Troubleshooting

### Common Issue 1: "Tool not found" error
**Problem**: OpenAI returns an error saying the tool doesn't exist  
**Solution**: Ensure you're passing the `profanityTools` array to the `tools` parameter. Check that the tool name in your message matches one of the five available tools.

### Common Issue 2: Tool arguments not parsed correctly
**Problem**: `JSON.parse()` fails on tool arguments  
**Solution**: Always wrap `JSON.parse()` in a try-catch block. Ensure your OpenAI model supports function calling (GPT-3.5-turbo-0613 or later, GPT-4, GPT-4o).

### Common Issue 3: Zod dependency error
**Problem**: "Cannot find module 'zod'" when using `profanityToolSchemas`  
**Solution**: Install Zod as a peer dependency: `npm install zod`. The schemas are lazy-loaded and only required if you use the `profanityToolSchemas` export.

### Common Issue 4: Rate limiting
**Problem**: OpenAI API returns 429 (rate limit exceeded)  
**Solution**: Implement exponential backoff and retry logic. Use batch operations to reduce API call volume. Consider caching frequent checks.

### Common Issue 5: Environment variables not loaded
**Problem**: API key or model name is undefined  
**Solution**: Ensure you have a `.env` file with `OPENAI_API_KEY` and optionally `OPENAI_MODEL`. Use a library like `dotenv` to load environment variables: `require('dotenv').config()` at the top of your entry file.

## API Reference

For full API documentation, see:
- [Core API Reference](../api-reference.md)
- [glin-profanity GitHub](https://github.com/glinr/glin-profanity)

### Exports

```typescript
// Tool definitions
export const profanityTools: OpenAITool[];

// Tool executor
export function executeProfanityTool(
  toolName: string,
  args: Record<string, unknown>
): Promise<unknown>;

// Runnable tools (for beta.chat.completions.runTools)
export function createRunnableTools(
  config?: Partial<FilterConfig>
): RunnableToolFunction[];

// Zod schemas (requires zod peer dependency)
export const profanityToolSchemas: {
  checkProfanity: () => ZodSchema;
  censorText: () => ZodSchema;
  batchCheck: () => ZodSchema;
  analyzeContext: () => ZodSchema;
};
```

---

**Minimum Versions:**
- `openai`: >= 4.0.0
- `zod` (optional): >= 3.0.0
- `node`: >= 16.0.0
