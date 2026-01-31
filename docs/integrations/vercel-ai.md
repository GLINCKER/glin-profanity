# glin-profanity + Vercel AI SDK Integration

Seamlessly integrate profanity detection and content moderation into Vercel AI SDK applications. This integration provides ready-to-use tools compatible with Next.js, Remix, SvelteKit, and other frameworks supported by the Vercel AI SDK.

## Quick Start

### Installation

```bash
# Required
npm install glin-profanity

# Peer dependencies
npm install ai @ai-sdk/openai zod
```

### Basic Example

```typescript
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { profanityTools } from 'glin-profanity/ai/vercel';

const { text, toolCalls, toolResults } = await generateText({
  model: openai(process.env.OPENAI_MODEL || 'gpt-4o'),
  prompt: 'Check if "damn it" contains profanity',
  tools: profanityTools,
});

console.log('Response:', text);
console.log('Tool results:', toolResults);
```

## Available Tools

All tools are provided as a tools object compatible with Vercel AI SDK's `tools` parameter.

### Tool 1: checkProfanity

Detects profanity in a single text string with advanced options.

**Parameters:**
```typescript
{
  text: string;
  languages?: string[];           // Default: ["english"]
  detectLeetspeak?: boolean;      // Default: true
  normalizeUnicode?: boolean;     // Default: true
}
```

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
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { profanityTools } from 'glin-profanity/ai/vercel';

const result = await generateText({
  model: openai(process.env.OPENAI_MODEL || 'gpt-4o'),
  prompt: 'Check this text for profanity: "Hello world"',
  tools: profanityTools,
  maxToolRoundtrips: 1,
});
```

### Tool 2: censorText

Censors profane words by replacing them with a specified character or string.

**Parameters:**
```typescript
{
  text: string;
  replacement?: string;    // Default: "*"
  languages?: string[];    // Default: ["english"]
}
```

**Returns:**
```typescript
{
  originalText: string;
  censoredText: string;
  profaneWordsFound: string[];
  wasModified: boolean;
}
```

### Tool 3: batchCheckProfanity

Efficiently checks multiple texts in a single call.

**Parameters:**
```typescript
{
  texts: string[];
  languages?: string[];         // Default: ["english"]
  detectLeetspeak?: boolean;    // Default: true
}
```

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

### Tool 4: analyzeContext

Performs context-aware profanity analysis for more nuanced detection.

**Parameters:**
```typescript
{
  text: string;
  languages?: string[];
  contextWindow?: number;           // Default: 10
  confidenceThreshold?: number;     // Default: 0.7
}
```

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

### Tool 5: getSupportedLanguages

Returns the list of all supported languages for profanity detection.

**Parameters:** None (empty object)

**Returns:**
```typescript
{
  languages: string[];
  count: number;
}
```

## Common Use Cases

### Use Case 1: Chat Message Moderation in Next.js

```typescript
// app/api/chat/route.ts
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { profanityTools, profanityMiddleware } from 'glin-profanity/ai/vercel';

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Get the last user message
  const lastMessage = messages[messages.length - 1];

  // Quick pre-check using middleware
  const check = profanityMiddleware.checkMessage(lastMessage.content);
  if (check.blocked) {
    return Response.json({ 
      error: check.reason,
      type: 'profanity_detected'
    }, { status: 400 });
  }

  // Stream response with profanity tools available
  const result = await streamText({
    model: openai(process.env.OPENAI_MODEL || 'gpt-4o'),
    messages,
    tools: profanityTools,
    system: 'You are a helpful, family-friendly assistant. Use profanity detection tools when moderating user content.',
  });

  return result.toAIStreamResponse();
}
```

### Use Case 2: Client-Side Chat with `useChat` Hook

```typescript
// app/chat/page.tsx
'use client';

import { useChat } from 'ai/react';

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, error } = useChat({
    api: '/api/chat',
    onError: (error) => {
      if (error.message.includes('profanity')) {
        alert('Please avoid using profanity in your messages.');
      }
    },
  });

  return (
    <div>
      <div>
        {messages.map(m => (
          <div key={m.id}>
            <strong>{m.role}:</strong> {m.content}
          </div>
        ))}
      </div>
      
      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Type your message..."
        />
        <button type="submit">Send</button>
      </form>
      
      {error && <div style={{ color: 'red' }}>{error.message}</div>}
    </div>
  );
}
```

### Use Case 3: Content Generation with Automatic Moderation

```typescript
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { profanityTools } from 'glin-profanity/ai/vercel';

async function generateModeratedContent(prompt: string) {
  const result = await generateText({
    model: openai(process.env.OPENAI_MODEL || 'gpt-4o'),
    prompt,
    tools: profanityTools,
    system: 'Generate content suitable for all audiences. Check and censor any profanity before responding.',
    maxToolRoundtrips: 2,
  });

  // Check if any profanity tools were called
  const profanityChecks = result.toolCalls.filter(tc => 
    tc.toolName === 'checkProfanity' || tc.toolName === 'censorText'
  );

  return {
    content: result.text,
    moderated: profanityChecks.length > 0,
    toolCalls: profanityChecks
  };
}

// Usage
const content = await generateModeratedContent(
  'Write a product review for a smartphone'
);
```

### Use Case 4: Batch Comment Moderation

```typescript
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { profanityTools } from 'glin-profanity/ai/vercel';
import { z } from 'zod';

async function moderateComments(comments: string[]) {
  const result = await generateObject({
    model: openai(process.env.OPENAI_MODEL || 'gpt-4o'),
    schema: z.object({
      results: z.array(z.object({
        comment: z.string(),
        allowed: z.boolean(),
        reason: z.string(),
        suggestedEdit: z.string().optional(),
      })),
      summary: z.object({
        total: z.number(),
        approved: z.number(),
        rejected: z.number(),
      }),
    }),
    prompt: `Moderate these comments: ${JSON.stringify(comments, null, 2)}`,
    tools: profanityTools,
    system: 'You are a content moderator. Use the batch profanity check tool to analyze all comments efficiently.',
  });

  return result.object;
}

// Usage
const moderation = await moderateComments([
  'This product is amazing!',
  'What the hell is this crap?',
  'Great value for money',
]);
```

## Advanced Configuration

### Custom Profanity Middleware

```typescript
// middleware.ts
import { profanityMiddleware } from 'glin-profanity/ai/vercel';

export async function middleware(request: Request) {
  if (request.method === 'POST' && request.url.includes('/api/chat')) {
    const body = await request.json();
    const message = body.messages?.[body.messages.length - 1]?.content;

    if (message) {
      const check = profanityMiddleware.checkMessage(message, {
        languages: ['english', 'spanish'],
        detectLeetspeak: true
      });

      if (check.blocked) {
        return new Response(JSON.stringify({
          error: check.reason,
          profaneWords: check.profaneWords,
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  }

  return next();
}

export const config = {
  matcher: '/api/chat/:path*',
};
```

### Creating Custom Tools

```typescript
import { createCheckProfanityTool, createCensorTextTool } from 'glin-profanity/ai/vercel';

// Create individual tools
const customCheckTool = createCheckProfanityTool();
const customCensorTool = createCensorTextTool();

// Use in your AI calls
const result = await generateText({
  model: openai(process.env.OPENAI_MODEL || 'gpt-4o'),
  prompt: 'Your prompt',
  tools: {
    checkProfanity: customCheckTool,
    censorText: customCensorTool,
  },
});
```

### Multi-Language Support

```typescript
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { profanityTools } from 'glin-profanity/ai/vercel';

const result = await generateText({
  model: openai(process.env.OPENAI_MODEL || 'gpt-4o'),
  prompt: 'Check this Spanish text: "No me jodas, esto es una mierda"',
  tools: profanityTools,
  system: 'Check for profanity in Spanish and English. Use languages: ["spanish", "english"] parameter.',
});
```

### Leetspeak and Unicode Normalization

```typescript
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { profanityTools } from 'glin-profanity/ai/vercel';

const result = await generateText({
  model: openai(process.env.OPENAI_MODEL || 'gpt-4o'),
  prompt: 'Check this obfuscated text: "5h1t h@pp3n5 d@mn 1t"',
  tools: profanityTools,
  system: 'Enable leetspeak detection and Unicode normalization to catch obfuscated profanity.',
});
```

## Framework-Specific Patterns

### Pattern 1: Next.js Route Handler with Streaming

```typescript
// app/api/moderate-stream/route.ts
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { profanityTools } from 'glin-profanity/ai/vercel';

export async function POST(req: Request) {
  const { prompt } = await req.json();

  const result = await streamText({
    model: openai(process.env.OPENAI_MODEL || 'gpt-4o'),
    prompt,
    tools: profanityTools,
    onFinish: ({ text, toolCalls, toolResults }) => {
      // Log moderation results
      console.log('Generated text:', text);
      console.log('Tool calls:', toolCalls);
      console.log('Tool results:', toolResults);
    },
  });

  return result.toAIStreamResponse();
}
```

### Pattern 2: Server Action with Tool Results

```typescript
// app/actions/moderate.ts
'use server';

import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { profanityTools } from 'glin-profanity/ai/vercel';

export async function moderateText(text: string) {
  const result = await generateText({
    model: openai(process.env.OPENAI_MODEL || 'gpt-4o'),
    prompt: `Analyze this text for profanity: "${text}"`,
    tools: profanityTools,
    maxToolRoundtrips: 1,
  });

  // Extract profanity check results
  const profanityResults = result.toolResults.filter(
    tr => tr.toolName === 'checkProfanity'
  );

  const hasProfanity = profanityResults.some(
    pr => pr.result?.containsProfanity
  );

  return {
    text: result.text,
    hasProfanity,
    profanityResults,
  };
}
```

### Pattern 3: Edge Runtime Moderation

```typescript
// app/api/edge-moderate/route.ts
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { profanityTools } from 'glin-profanity/ai/vercel';

export const runtime = 'edge';

export async function POST(req: Request) {
  const { message } = await req.json();

  try {
    const result = await generateText({
      model: openai(process.env.OPENAI_MODEL || 'gpt-4o'),
      prompt: `Check this message: "${message}"`,
      tools: profanityTools,
      maxToolRoundtrips: 1,
    });

    const checkResult = result.toolResults.find(
      tr => tr.toolName === 'checkProfanity'
    );

    return Response.json({
      allowed: !checkResult?.result?.containsProfanity,
      profaneWords: checkResult?.result?.profaneWords || [],
      aiResponse: result.text,
    });
  } catch (error) {
    return Response.json({ error: 'Moderation failed' }, { status: 500 });
  }
}
```

### Pattern 4: Remix Loader with Moderation

```typescript
// app/routes/moderate.tsx
import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { profanityTools } from 'glin-profanity/ai/vercel';

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const text = url.searchParams.get('text');

  if (!text) {
    return json({ error: 'No text provided' }, { status: 400 });
  }

  const result = await generateText({
    model: openai(process.env.OPENAI_MODEL || 'gpt-4o'),
    prompt: `Check for profanity: "${text}"`,
    tools: profanityTools,
  });

  return json({
    moderated: true,
    result: result.text,
    toolResults: result.toolResults,
  });
}
```

### Pattern 5: Using with `useObject` Hook

```typescript
// app/components/ModerationForm.tsx
'use client';

import { experimental_useObject as useObject } from 'ai/react';
import { z } from 'zod';

const moderationSchema = z.object({
  allowed: z.boolean(),
  reason: z.string(),
  profaneWords: z.array(z.string()),
  suggestion: z.string().optional(),
});

export function ModerationForm() {
  const { object, submit, isLoading } = useObject({
    api: '/api/moderate-object',
    schema: moderationSchema,
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const text = formData.get('text') as string;
    submit({ text });
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <textarea name="text" placeholder="Enter text to moderate" />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Checking...' : 'Check for Profanity'}
        </button>
      </form>

      {object && (
        <div>
          <h3>Result:</h3>
          <p>Allowed: {object.allowed ? 'Yes' : 'No'}</p>
          <p>Reason: {object.reason}</p>
          {object.profaneWords?.length > 0 && (
            <p>Profane words: {object.profaneWords.join(', ')}</p>
          )}
          {object.suggestion && <p>Suggestion: {object.suggestion}</p>}
        </div>
      )}
    </div>
  );
}
```

## Middleware Helper Functions

The integration provides middleware helpers for quick integration:

```typescript
import { profanityMiddleware } from 'glin-profanity/ai/vercel';

// Quick message check
const check = profanityMiddleware.checkMessage('Hello world', {
  languages: ['english'],
  detectLeetspeak: true
});

if (check.blocked) {
  console.log('Blocked:', check.reason);
  console.log('Profane words:', check.profaneWords);
}

// Batch check
const batchCheck = profanityMiddleware.checkBatch([
  'Message 1',
  'Message 2',
  'Message 3'
]);

console.log(`Flagged ${batchCheck.flaggedCount} of ${batchCheck.total}`);
```

## Error Handling

```typescript
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { profanityTools } from 'glin-profanity/ai/vercel';

async function safeModerate(text: string) {
  try {
    const result = await generateText({
      model: openai(process.env.OPENAI_MODEL || 'gpt-4o'),
      prompt: `Check: "${text}"`,
      tools: profanityTools,
      maxToolRoundtrips: 1,
    });

    return {
      success: true,
      result: result.text,
      toolResults: result.toolResults,
    };
  } catch (error) {
    console.error('Moderation error:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      // Fallback to basic check
      contained: text.toLowerCase().includes('profanity'),
    };
  }
}
```

## Performance Tips

- **Use middleware for pre-checks**: Filter obvious profanity before calling AI
- **Batch when possible**: Use `batchCheckProfanity` for multiple texts
- **Limit tool roundtrips**: Set `maxToolRoundtrips` to 1 or 2 for faster responses
- **Stream for better UX**: Use `streamText()` instead of `generateText()` for real-time applications
- **Edge runtime**: Deploy to edge for lower latency moderation
- **Cache results**: Cache moderation decisions for common phrases

## TypeScript Support

Full TypeScript support with typed tools and results:

```typescript
import type {
  VercelAITool,
  CheckProfanityInput,
  CheckProfanityOutput,
  CensorTextOutput,
} from 'glin-profanity/ai/vercel';

// Fully typed tool results
const result = await generateText({
  model: openai(process.env.OPENAI_MODEL || 'gpt-4o'),
  prompt: 'Check text',
  tools: profanityTools,
});

// TypeScript knows the structure
const checkResult = result.toolResults.find(
  tr => tr.toolName === 'checkProfanity'
) as { result: CheckProfanityOutput } | undefined;
```

## Troubleshooting

### Common Issue 1: Tools not being called
**Problem**: AI doesn't invoke profanity tools  
**Solution**: Be explicit in your system prompt about using the tools. Set `tool_choice` or `maxToolRoundtrips`. Ensure your model supports function calling (GPT-3.5-turbo-0613+, GPT-4, GPT-4o).

### Common Issue 2: Type errors with tool results
**Problem**: TypeScript errors when accessing `toolResults`  
**Solution**: Tool results are typed as `unknown` by default. Cast to the appropriate type or use type guards. Import types from `glin-profanity/ai/vercel`.

### Common Issue 3: Middleware not blocking profanity
**Problem**: `profanityMiddleware.checkMessage()` doesn't catch profanity  
**Solution**: Ensure you're checking the `blocked` property. Enable `detectLeetspeak` for obfuscated text. Check that you're using the correct languages array.

### Common Issue 4: Streaming issues
**Problem**: Tool calls don't appear in streamed responses  
**Solution**: Tool calls are only available after the stream completes. Use `onFinish` callback to access tool results. For real-time moderation, use middleware pre-checks.

### Common Issue 5: Edge runtime compatibility
**Problem**: Errors when deploying to Vercel Edge runtime  
**Solution**: Ensure all dependencies are edge-compatible. Avoid using Node.js-specific modules. Test with `export const runtime = 'edge'` in your route.

### Common Issue 6: Rate limiting
**Problem**: Too many API calls to profanity detection  
**Solution**: Implement caching for common phrases. Use middleware for quick pre-checks. Batch multiple texts together. Consider client-side debouncing for real-time checks.

## API Reference

For full API documentation, see:
- [Core API Reference](../api-reference.md)
- [Vercel AI SDK Documentation](https://sdk.vercel.ai/docs)

### Exports

```typescript
// Ready-to-use tools object
export const profanityTools: {
  checkProfanity: VercelAITool<CheckProfanityInput, CheckProfanityOutput>;
  censorText: VercelAITool<CensorTextInput, CensorTextOutput>;
  batchCheckProfanity: VercelAITool<BatchCheckInput, BatchCheckOutput>;
  analyzeContext: VercelAITool<AnalyzeContextInput, AnalyzeContextOutput>;
  getSupportedLanguages: VercelAITool<{}, SupportedLanguagesOutput>;
};

// Middleware helpers
export const profanityMiddleware: {
  checkMessage: (message: string, options?) => ModerationResult;
  checkBatch: (messages: string[], options?) => BatchModerationResult;
};

// Factory functions
export function createCheckProfanityTool(): VercelAITool;
export function createCensorTextTool(): VercelAITool;
export function createBatchCheckTool(): VercelAITool;
export function createContextAnalysisTool(): VercelAITool;
export function createSupportedLanguagesTool(): VercelAITool;
```

---

**Minimum Versions:**
- `ai`: >= 3.0.0
- `@ai-sdk/openai`: >= 0.0.30
- `zod`: >= 3.0.0
- `node`: >= 18.0.0 (16.0.0 for non-edge)
- `next` (if using Next.js): >= 14.0.0
