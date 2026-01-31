# glin-profanity + LangChain Integration

Seamlessly integrate profanity detection and content moderation into LangChain agents, chains, and tools. This integration provides ready-to-use tools compatible with both LangChain.js and LangChain Python (via equivalent API).

## Quick Start

### Installation

```bash
# Required
npm install glin-profanity

# Peer dependencies
npm install @langchain/core zod
npm install langchain  # Optional, for additional features
```

### Basic Example

```typescript
import { ChatOpenAI } from '@langchain/openai';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { profanityCheckTool, allProfanityTools } from 'glin-profanity/ai/langchain';

const model = new ChatOpenAI({
  modelName: process.env.OPENAI_MODEL || 'gpt-4o',
  temperature: 0,
});

const agent = createReactAgent({
  llm: model,
  tools: allProfanityTools,
});

const result = await agent.invoke({
  messages: [{ role: 'user', content: 'Check if "damn it" contains profanity' }]
});

console.log(result);
```

## Available Tools

All tools follow the LangChain `Tool` interface with typed inputs and outputs.

### Tool 1: profanityCheckTool

Detects profanity in a single text string with advanced options.

**Input Schema:**
```typescript
{
  text: string;
  languages?: string[];           // Default: ["english"]
  detectLeetspeak?: boolean;      // Default: true
  normalizeUnicode?: boolean;     // Default: true
}
```

**Output:**
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
import { profanityCheckTool } from 'glin-profanity/ai/langchain';

const result = await profanityCheckTool.invoke({
  text: 'Hello world',
  detectLeetspeak: true
});
// { containsProfanity: false, profaneWords: [], wordCount: 2 }
```

### Tool 2: censorTextTool

Censors profane words by replacing them with a specified character or string.

**Input Schema:**
```typescript
{
  text: string;
  replacement?: string;    // Default: "*"
  languages?: string[];    // Default: ["english"]
}
```

**Output:**
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
import { censorTextTool } from 'glin-profanity/ai/langchain';

const result = await censorTextTool.invoke({
  text: 'What the hell is this',
  replacement: '***'
});
// { censoredText: 'What the *** is this', wasModified: true }
```

### Tool 3: batchCheckTool

Efficiently checks multiple texts in a single call.

**Input Schema:**
```typescript
{
  texts: string[];
  languages?: string[];         // Default: ["english"]
  detectLeetspeak?: boolean;    // Default: true
}
```

**Output:**
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

### Tool 4: contextAnalysisTool

Performs context-aware profanity analysis for more nuanced detection.

**Input Schema:**
```typescript
{
  text: string;
  languages?: string[];
  contextWindow?: number;           // Default: 10
  confidenceThreshold?: number;     // Default: 0.7
}
```

**Output:**
```typescript
{
  containsProfanity: boolean;
  profaneWords: string[];
  contextScore?: number;
  matches?: unknown[];
  reason?: string;
}
```

### Tool 5: supportedLanguagesTool

Returns the list of all supported languages for profanity detection.

**Input:** None (empty object)

**Output:**
```typescript
{
  languages: string[];
  count: number;
}
```

## Common Use Cases

### Use Case 1: Chat Message Moderation with Agents

```typescript
import { ChatOpenAI } from '@langchain/openai';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { allProfanityTools } from 'glin-profanity/ai/langchain';

const model = new ChatOpenAI({
  modelName: process.env.OPENAI_MODEL || 'gpt-4o',
  temperature: 0,
});

async function moderateChatWithAgent(userMessage: string) {
  const agent = createReactAgent({
    llm: model,
    tools: allProfanityTools,
  });

  const result = await agent.invoke({
    messages: [
      {
        role: 'system',
        content: 'You are a chat moderator. Use the profanity detection tools to check messages and provide moderation decisions.'
      },
      {
        role: 'user',
        content: `Please moderate this message: "${userMessage}"`
      }
    ]
  });

  return result;
}

// Usage
const modResult = await moderateChatWithAgent('What the hell is going on?');
console.log(modResult);
```

### Use Case 2: Custom Chain with Tool Binding

```typescript
import { ChatOpenAI } from '@langchain/openai';
import { profanityCheckTool, censorTextTool } from 'glin-profanity/ai/langchain';
import { ChatPromptTemplate } from '@langchain/core/prompts';

const model = new ChatOpenAI({
  modelName: process.env.OPENAI_MODEL || 'gpt-4o',
});

// Bind tools to the model
const modelWithTools = model.bindTools([profanityCheckTool, censorTextTool]);

const prompt = ChatPromptTemplate.fromMessages([
  ['system', 'You are a content moderator. Check the user input for profanity and censor if needed.'],
  ['user', '{input}'],
]);

const chain = prompt.pipe(modelWithTools);

async function moderateContent(text: string) {
  const result = await chain.invoke({ input: text });
  
  // Process tool calls
  if (result.tool_calls && result.tool_calls.length > 0) {
    for (const toolCall of result.tool_calls) {
      if (toolCall.name === 'profanityCheckTool') {
        const checkResult = await profanityCheckTool.invoke(toolCall.args);
        console.log('Check result:', checkResult);
      } else if (toolCall.name === 'censorTextTool') {
        const censorResult = await censorTextTool.invoke(toolCall.args);
        console.log('Censored:', censorResult.censoredText);
      }
    }
  }
  
  return result;
}
```

### Use Case 3: Batch Content Processing

```typescript
import { batchCheckTool } from 'glin-profanity/ai/langchain';

async function moderateCommentBatch(comments: string[]) {
  const result = await batchCheckTool.invoke({
    texts: comments,
    detectLeetspeak: true,
    languages: ['english', 'spanish']
  });

  console.log(`Total: ${result.totalTexts}`);
  console.log(`Flagged: ${result.flaggedCount}`);
  console.log(`Clean: ${result.cleanCount}`);

  // Get flagged comments
  const flaggedComments = result.results
    .filter(r => r.containsProfanity)
    .map(r => ({
      index: r.index,
      comment: r.text,
      profanity: r.profaneWords
    }));

  return {
    summary: result,
    flagged: flaggedComments
  };
}

// Usage
const comments = [
  'This is great!',
  'What the hell is this crap?',
  'I love this product',
  'This is shit'
];
const modResult = await moderateCommentBatch(comments);
```

### Use Case 4: Structured Output with Tools

```typescript
import { ChatOpenAI } from '@langchain/openai';
import { profanityCheckTool } from 'glin-profanity/ai/langchain';
import { z } from 'zod';

const model = new ChatOpenAI({
  modelName: process.env.OPENAI_MODEL || 'gpt-4o',
});

const ModerationDecision = z.object({
  allowed: z.boolean(),
  reason: z.string(),
  profanityDetected: z.boolean(),
  suggestedEdit: z.string().optional(),
});

async function getModerationDecision(text: string) {
  // First, check for profanity
  const profanityResult = await profanityCheckTool.invoke({
    text,
    detectLeetspeak: true
  });

  // Use LLM with structured output
  const structuredModel = model.withStructuredOutput(ModerationDecision);

  const decision = await structuredModel.invoke([
    {
      role: 'system',
      content: 'You make moderation decisions based on profanity detection results.'
    },
    {
      role: 'user',
      content: `Text: "${text}"\nProfanity found: ${profanityResult.containsProfanity}\nWords: ${profanityResult.profaneWords.join(', ')}`
    }
  ]);

  return decision;
}
```

## Advanced Configuration

### Custom Languages

```typescript
import { createProfanityCheckTool } from 'glin-profanity/ai/langchain';

// Create a tool with specific language configuration
const multilingualTool = createProfanityCheckTool();

const result = await multilingualTool.invoke({
  text: 'Texto con posible profanidad',
  languages: ['spanish', 'english', 'french']
});
```

### Creating Tools with Custom Configuration

```typescript
import { createAllProfanityTools } from 'glin-profanity/ai/langchain';

// Create all tools with custom filter settings
const customTools = createAllProfanityTools({
  languages: ['english', 'spanish'],
  detectLeetspeak: true,
});

// Use with your agent
const agent = createReactAgent({
  llm: model,
  tools: customTools,
});
```

### Leetspeak Detection

```typescript
import { profanityCheckTool } from 'glin-profanity/ai/langchain';

// Detect obfuscated profanity
const result = await profanityCheckTool.invoke({
  text: 'H3ll0 you p13c3 of 5h1t',
  detectLeetspeak: true,
  normalizeUnicode: true
});
// Will detect obfuscated words
```

### Context-Aware Filtering

```typescript
import { contextAnalysisTool } from 'glin-profanity/ai/langchain';

const result = await contextAnalysisTool.invoke({
  text: 'This damn door is stuck again',
  contextWindow: 15,
  confidenceThreshold: 0.8
});
```

## Framework-Specific Patterns

### Pattern 1: Using with LangGraph

```typescript
import { StateGraph, END } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import { profanityCheckTool } from 'glin-profanity/ai/langchain';

const model = new ChatOpenAI({ modelName: process.env.OPENAI_MODEL || 'gpt-4o' });

// Define state
interface State {
  messages: any[];
  moderation: {
    allowed: boolean;
    reason?: string;
  };
}

// Define nodes
async function checkProfanity(state: State) {
  const lastMessage = state.messages[state.messages.length - 1];
  
  const result = await profanityCheckTool.invoke({
    text: lastMessage.content,
    detectLeetspeak: true
  });

  return {
    ...state,
    moderation: {
      allowed: !result.containsProfanity,
      reason: result.containsProfanity 
        ? `Contains profanity: ${result.profaneWords.join(', ')}`
        : 'Clean'
    }
  };
}

async function generateResponse(state: State) {
  if (!state.moderation.allowed) {
    return {
      ...state,
      messages: [...state.messages, {
        role: 'assistant',
        content: 'I cannot process messages containing profanity.'
      }]
    };
  }

  const response = await model.invoke(state.messages);
  return {
    ...state,
    messages: [...state.messages, response]
  };
}

// Build graph
const workflow = new StateGraph<State>({
  channels: {
    messages: { value: (prev, next) => next },
    moderation: { value: (prev, next) => next }
  }
})
  .addNode('checkProfanity', checkProfanity)
  .addNode('generateResponse', generateResponse)
  .addEdge('__start__', 'checkProfanity')
  .addEdge('checkProfanity', 'generateResponse')
  .addEdge('generateResponse', END);

const app = workflow.compile();
```

### Pattern 2: Tool Composition

```typescript
import { tool } from '@langchain/core/tools';
import { profanityCheckTool, censorTextTool } from 'glin-profanity/ai/langchain';
import { z } from 'zod';

// Create a composite tool that checks and censors in one call
const checkAndCensorTool = tool(
  async ({ text, languages }) => {
    // First check
    const checkResult = await profanityCheckTool.invoke({
      text,
      languages,
      detectLeetspeak: true
    });

    // If profanity found, censor it
    if (checkResult.containsProfanity) {
      const censorResult = await censorTextTool.invoke({
        text,
        languages,
        replacement: '***'
      });

      return {
        ...checkResult,
        censoredText: censorResult.censoredText
      };
    }

    return {
      ...checkResult,
      censoredText: text
    };
  },
  {
    name: 'checkAndCensor',
    description: 'Check text for profanity and automatically censor if found',
    schema: z.object({
      text: z.string(),
      languages: z.array(z.string()).optional()
    })
  }
);
```

### Pattern 3: Memory-Aware Moderation

```typescript
import { ChatOpenAI } from '@langchain/openai';
import { BufferMemory } from 'langchain/memory';
import { ConversationChain } from 'langchain/chains';
import { profanityCheckTool } from 'glin-profanity/ai/langchain';

const model = new ChatOpenAI({ modelName: process.env.OPENAI_MODEL || 'gpt-4o' });
const memory = new BufferMemory();

const chain = new ConversationChain({ llm: model, memory });

async function moderatedConversation(userInput: string) {
  // Check profanity before processing
  const checkResult = await profanityCheckTool.invoke({
    text: userInput,
    detectLeetspeak: true
  });

  if (checkResult.containsProfanity) {
    return {
      response: 'Please avoid using profanity in our conversation.',
      profanityDetected: true,
      words: checkResult.profaneWords
    };
  }

  // Continue with normal conversation
  const response = await chain.call({ input: userInput });

  // Also check AI response (optional)
  const aiCheckResult = await profanityCheckTool.invoke({
    text: response.response
  });

  return {
    response: response.response,
    profanityDetected: aiCheckResult.containsProfanity
  };
}
```

## Error Handling

Always handle potential errors when using LangChain tools:

```typescript
import { profanityCheckTool } from 'glin-profanity/ai/langchain';

async function safeCheck(text: string) {
  try {
    const result = await profanityCheckTool.invoke({
      text,
      detectLeetspeak: true
    });
    return result;
  } catch (error) {
    console.error('Profanity check error:', error);
    // Return a safe fallback
    return {
      containsProfanity: false,
      profaneWords: [],
      wordCount: 0,
      error: true
    };
  }
}
```

## Performance Tips

- **Use batch operations**: For multiple texts, use `batchCheckTool` instead of invoking `profanityCheckTool` multiple times
- **Cache tool results**: LangChain tools can be wrapped with caching middleware
- **Limit tool availability**: Only bind necessary tools to your agent to reduce decision overhead
- **Use smaller context windows**: For `contextAnalysisTool`, smaller windows (5-10) are faster
- **Parallel execution**: When checking multiple independent texts, use `Promise.all()`

## TypeScript Support

Full TypeScript support with typed inputs and outputs:

```typescript
import type {
  LangChainTool,
  CheckProfanityInput,
  CensorTextInput,
  BatchCheckInput,
  AnalyzeContextInput
} from 'glin-profanity/ai/langchain';

// Type-safe tool invocation
const input: CheckProfanityInput = {
  text: 'Hello world',
  languages: ['english'],
  detectLeetspeak: true,
  normalizeUnicode: true
};

const result = await profanityCheckTool.invoke(input);
// result is fully typed
```

## Troubleshooting

### Common Issue 1: "Tool schema validation failed"
**Problem**: Tool invocation fails with schema validation error  
**Solution**: Ensure all required fields are provided. Check that your input matches the tool's input schema. Enable `detectLeetspeak` and other boolean fields explicitly if you see type errors.

### Common Issue 2: Zod dependency notfound
**Problem**: "Cannot find module 'zod'" error  
**Solution**: Install Zod as a peer dependency: `npm install zod`. LangChain tools require Zod for schema validation.

### Common Issue 3: Tool not executing in agent
**Problem**: Agent doesn't call profanity tools even when expected  
**Solution**: Check your system prompt - be explicit about when to use tools. Ensure tools are properly bound. Use `tool_choice: "auto"` or force specific tool usage. Verify the model supports function calling (GPT-3.5-turbo-0613+, GPT-4, GPT-4o).

### Common Issue 4: Type errors with tool results
**Problem**: TypeScript complains about tool result types  
**Solution**: Import types from `glin-profanity/ai/langchain`. Use type assertions if necessary: `result as CheckProfanityOutput`.

### Common Issue 5: Performance issues with large batches
**Problem**: Batch checking is slow or times out  
**Solution**: Limit batch size to 50-100 texts max per call. Use parallel processing with `Promise.all()` for very large datasets. Consider implementing pagination.

## API Reference

For full API documentation, see:
- [Core API Reference](../api-reference.md)
- [LangChain Documentation](https://js.langchain.com/docs/)

### Exports

```typescript
// Pre-built tool instances
export const profanityCheckTool: LangChainTool<CheckProfanityInput>;
export const censorTextTool: LangChainTool<CensorTextInput>;
export const batchCheckTool: LangChainTool<BatchCheckInput>;
export const contextAnalysisTool: LangChainTool<AnalyzeContextInput>;
export const supportedLanguagesTool: LangChainTool<{}>;

// All tools bundled
export const allProfanityTools: LangChainTool[];

// Factory functions
export function createProfanityCheckTool(): LangChainTool<CheckProfanityInput>;
export function createCensorTextTool(): LangChainTool<CensorTextInput>;
export function createBatchCheckTool(): LangChainTool<BatchCheckInput>;
export function createContextAnalysisTool(): LangChainTool<AnalyzeContextInput>;
export function createSupportedLanguagesTool(): LangChainTool<{}>;

// Create all tools with custom config
export function createAllProfanityTools(
  config?: Partial<FilterConfig>
): LangChainTool[];
```

---

**Minimum Versions:**
- `@langchain/core`: >= 0.1.0
- `zod`: >= 3.0.0
- `node`: >= 16.0.0
- `langchain` (optional): >= 0.1.0
