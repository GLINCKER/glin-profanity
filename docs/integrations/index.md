# AI Framework Integrations

glin-profanity provides battle-tested integrations with popular AI frameworks and SDKs. Choose the integration that matches your tech stack.

## Available Integrations

### [OpenAI](./openai.md)
**Best for**: Direct OpenAI API usage, function calling, and custom LLM workflows

- ✅ Full support for GPT-4o, GPT-4, GPT-3.5-turbo
- ✅ Ready-to-use tool definitions for function calling
- ✅ Automated execution with `runTools()`
- ✅ Zod schema support for type-safe tools
- ✅ Streaming support

**Quick Start:**
```typescript
import OpenAI from 'openai';
import { profanityTools } from 'glin-profanity/ai/openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const response = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Check this text for profanity' }],
  tools: profanityTools,
});
```

[View Full Documentation →](./openai.md)

---

### [LangChain](./langchain.md)
**Best for**: Building agents, chains, and RAG applications with LangChain.js

- ✅ Pre-built LangChain `Tool` instances
- ✅ Compatible with `createReactAgent()` and custom chains
- ✅ Tool binding with `llm.bindTools()`
- ✅ Works with LangGraph workflows
- ✅ Memory and conversation support

**Quick Start:**
```typescript
import { ChatOpenAI } from '@langchain/openai';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { allProfanityTools } from 'glin-profanity/ai/langchain';

const agent = createReactAgent({
  llm: new ChatOpenAI({ modelName: 'gpt-4o' }),
  tools: allProfanityTools,
});

const result = await agent.invoke({
  messages: [{ role: 'user', content: 'Moderate this message' }]
});
```

[View Full Documentation →](./langchain.md)

---

### [Vercel AI SDK](./vercel-ai.md)
**Best for**: Next.js, Remix, SvelteKit, and full-stack JavaScript applications

- ✅ Compatible with `generateText()`, `streamText()`, `generateObject()`
- ✅ Works with `useChat()` and `useObject()` React hooks
- ✅ Middleware helpers for quick integration
- ✅ Edge runtime support
- ✅ Server Actions and API Routes

**Quick Start:**
```typescript
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { profanityTools } from 'glin-profanity/ai/vercel';

const result = await generateText({
  model: openai('gpt-4o'),
  prompt: 'Check this text for profanity',
  tools: profanityTools,
});
```

[View Full Documentation →](./vercel-ai.md)

---

### [Semantic Analysis](./semantic.md)
**Best for**: Advanced content moderation beyond keyword matching

- ✅ Combines keyword detection with AI-powered semantic analysis
- ✅ Detects toxic content without explicit profanity
- ✅ Works with any embedding provider (OpenAI, Cohere, Ollama, etc.)
- ✅ Conversation monitoring and health tracking
- ✅ Domain-specific custom toxic patterns

**Quick Start:**
```typescript
import { createSemanticAnalyzer, createFetchEmbeddingProvider } from 'glin-profanity/ai/semantic';

const analyzer = createSemanticAnalyzer({
  embeddingProvider: createFetchEmbeddingProvider({
    apiKey: process.env.OPENAI_API_KEY,
    model: 'text-embedding-3-small',
  }),
  threshold: 0.5,
});

const result = await analyzer.analyze('This is toxic content');
console.log(result.shouldFlag);  // true
console.log(result.combinedScore);  // 0.72
```

[View Full Documentation →](./semantic.md)

---

### [OpenClaw](./openclaw.md) 🤖
**Best for**: Multi-platform AI agents (WhatsApp, Telegram, Discord, Slack, iMessage)

- ✅ 4 integration methods: Skills, Hooks, Plugin, MCP
- ✅ Automatic message moderation with hooks
- ✅ Markdown-based skills for easy setup
- ✅ Pro-active content filtering across all platforms
- ✅ User violation tracking and enforcement

**Quick Start:**
```typescript
import { createProfanityGuard } from '@glin/openclaw-profanity/hooks';

const guard = createProfanityGuard({
  blockProfanity: true,
  platforms: ['whatsapp', 'telegram', 'discord'],
  detectLeetspeak: true,
  warningMessage: '⚠️ Your message contains inappropriate language.'
});

// Auto-moderates all incoming messages
```

[View Full Documentation →](./openclaw.md)

---

## Integration Comparison

| Feature | OpenAI | LangChain | Vercel AI SDK | Semantic Analysis | OpenClaw |
|---------|--------|-----------|---------------|-------------------|----------|
| **Function Calling** | ✅ Native | ✅ Tools API | ✅ Tools API | ⚠️ Manual | ✅ All methods |
| **Streaming** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No | ✅ Yes |
| **TypeScript** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Edge Runtime** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Batch Processing** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Context Awareness** | ✅ Tool-level | ✅ Tool-level | ✅ Tool-level | ✅ Advanced | ✅ Platform-specific |
| **Semantic Detection** | ❌ No | ❌ No | ❌ No | ✅ Yes | ⚠️ Via MCP |
| **Custom Patterns** | ⚠️ Limited | ⚠️ Limited | ⚠️ Limited | ✅ Full | ✅ Full |
| **Auto-Moderation** | ❌ No | ❌ No | ❌ No | ❌ No | ✅ Hooks |
| **Multi-Platform** | ❌ No | ❌ No | ❌ No | ❌ No | ✅ Yes |
| **Learning Curve** | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |

**Legend:**
- ✅ Full support
- ⚠️ Partial support or requires additional setup
- ❌ Not supported
- ⭐ Easy → ⭐⭐⭐⭐ Advanced

---

## Choosing the Right Integration

### Use **OpenAI** if you:
- Are building directly with the OpenAI SDK
- Need fine-grained control over function calling
- Want to use OpenAI's automated `runTools()` feature
- Are not using a framework

### Use **LangChain** if you:
- Are building agent-based applications
- Need complex chains and workflows
- Want to leverage LangChain's ecosystem (memory, callbacks, etc.)
- Are using LangGraph for state machines

### Use **Vercel AI SDK** if you:
- Are building Next.js, Remix, or SvelteKit applications
- Need streaming responses with `useChat()` hook
- Want edge runtime support for low latency
- Prefer a batteries-included framework

### Use **Semantic Analysis** if you:
- Need to detect toxic content beyond explicit profanity
- Want to catch subtle harassment, coded language, or context-dependent abuse
- Need customizable toxicity detection for specific domains
- Are building advanced moderation systems

---

## Installation

All integrations require the core library:

```bash
npm install glin-profanity
```

Then install peer dependencies for your chosen integration:

```bash
# OpenAI
npm install openai zod

# LangChain
npm install @langchain/core @langchain/openai zod

# Vercel AI SDK
npm install ai @ai-sdk/openai zod

# Semantic Analysis (choose your embedding provider)
npm install openai  # or @anthropic-ai/sdk, cohere-ai, etc.
```

---

## Common Patterns

### Pattern 1: Multi-Layer Moderation

Combine multiple approaches for robust moderation:

```typescript
import { profanityTools } from 'glin-profanity/ai/openai';
import { createSemanticAnalyzer, createFetchEmbeddingProvider } from 'glin-profanity/ai/semantic';

// Layer 1: Fast keyword check
import { Filter } from 'glin-profanity';
const filter = new Filter({ languages: ['english'] });
const quickCheck = filter.checkProfanity(message);

if (quickCheck.containsProfanity) {
  return { blocked: true, reason: 'Explicit profanity detected' };
}

// Layer 2: Semantic analysis for subtle toxicity
const analyzer = createSemanticAnalyzer({
  embeddingProvider: createFetchEmbeddingProvider({
    apiKey: process.env.OPENAI_API_KEY,
    model: 'text-embedding-3-small',
  }),
});

const semanticResult = await analyzer.analyze(message);
if (semanticResult.shouldFlag) {
  return { blocked: true, reason: 'Toxic content detected' };
}

// Layer 3: AI-assisted context understanding (optional)
const aiCheck = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [
    { role: 'system', content: 'You are a content moderator. Analyze if this message is appropriate.' },
    { role: 'user', content: message }
  ],
  tools: profanityTools,
});

return { blocked: false, message };
```

### Pattern 2: Hybrid AI + Rule-Based Moderation

```typescript
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { profanityTools } from 'glin-profanity/ai/vercel';

async function moderateWithAI(text: string) {
  const result = await generateText({
    model: openai('gpt-4o'),
    prompt: `Analyze this text for appropriateness: "${text}"`,
    tools: profanityTools,
    system: 'Use profanity detection tools to check for inappropriate content. Provide reasoning.',
  });

  // Extract tool results
  const profanityCheck = result.toolResults.find(tr => tr.toolName === 'checkProfanity');
  
  return {
    allowed: !profanityCheck?.result?.containsProfanity,
    aiReasoning: result.text,
    toolResults: result.toolResults,
  };
}
```

### Pattern 3: Progressive Moderation

```typescript
// Fast path: keyword check only
const quickResult = filter.checkProfanity(text);
if (quickResult.containsProfanity && quickResult.profaneWords.length > 2) {
  // High confidence - block immediately
  return { blocked: true, confidence: 'high' };
}

// Medium confidence - run semantic analysis
if (quickResult.containsProfanity) {
  const semanticResult = await analyzer.analyze(text);
  return {
    blocked: semanticResult.shouldFlag,
    confidence: 'medium',
    score: semanticResult.combinedScore,
  };
}

// Low risk - allow but log
return { blocked: false, confidence: 'low' };
```

---

## Framework Compatibility Matrix

| Your Stack | Recommended Integration | Alternative |
|------------|------------------------|-------------|
| Next.js + App Router | Vercel AI SDK | LangChain or OpenAI |
| Next.js + Pages Router | Vercel AI SDK or OpenAI | Semantic Analysis |
| Express.js | OpenAI or Semantic Analysis | LangChain |
| Remix | Vercel AI SDK | OpenAI |
| SvelteKit | Vercel AI SDK | OpenAI |
| Astro | OpenAI or Semantic Analysis | - |
| Cloudflare Workers | OpenAI or Vercel AI (edge) | Semantic Analysis |
| AWS Lambda | OpenAI or LangChain | Semantic Analysis |
| Python Backend | _See Python docs_ | REST API wrapper |
| Mobile (React Native) | REST API wrapper | - |

---

## Performance Comparison

Based on typical use cases (single message moderation):

| Integration | Avg Latency | Token Usage | Best For |
|-------------|-------------|-------------|----------|
| **OpenAI Tools** | ~300-500ms | 50-150 tokens | Real-time chat |
| **LangChain Tools** | ~400-600ms | 60-180 tokens | Agent workflows |
| **Vercel AI SDK** | ~300-500ms | 50-150 tokens | Web applications |
| **Semantic Analysis** | ~200-400ms* | 0 tokens (embeddings only) | High-volume moderation |

*Latency depends on embedding provider. Local Ollama: ~100-200ms, OpenAI embeddings: ~150-300ms

---

## Migration Guide

### From Basic Filter to AI Integration

**Before:**
```typescript
import { Filter } from 'glin-profanity';

const filter = new Filter();
const result = filter.checkProfanity(text);
```

**After (OpenAI):**
```typescript
import { executeProfanityTool } from 'glin-profanity/ai/openai';

const result = await executeProfanityTool('check_profanity', {
  text,
  detectLeetspeak: true
});
```

### From One Integration to Another

All integrations share the same underlying profanity detection engine, so results are consistent. Only the invocation pattern changes:

**OpenAI → LangChain:**
```typescript
// From
const result = await executeProfanityTool('check_profanity', { text });

// To
import { profanityCheckTool } from 'glin-profanity/ai/langchain';
const result = await profanityCheckTool.invoke({ text });
```

**LangChain → Vercel AI SDK:**
```typescript
// From
const result = await profanityCheckTool.invoke({ text });

// To
import { generateText } from 'ai';
import { profanityTools } from 'glin-profanity/ai/vercel';

const result = await generateText({
  model: openai('gpt-4o'),
  prompt: `Check: "${text}"`,
  tools: profanityTools,
});
```

---

## Best Practices

1. **Layer your defenses**: Use quick keyword checks first, then semantic analysis for edge cases
2. **Cache results**: Implement caching for frequently moderated phrases
3. **Monitor performance**: Track latency and adjust your approach based on real-world metrics
4. **Tune thresholds**: Start conservative (0.6-0.7) and adjust based on false positive/negative rates
5. **Provide feedback**: Allow users to report incorrect moderation decisions to improve your system
6. **Log everything**: Keep audit logs of moderation decisions for compliance and improvement
7. **Handle errors gracefully**: Always have a fallback when AI services are unavailable
8. **Test with real data**: Use actual user content (anonymized) to validate your moderation pipeline

---

## Support and Resources

- **Documentation**: [Full API Reference](../api-reference.md)
- **Examples**: See each integration page for comprehensive examples
- **GitHub**: [glinr/glin-profanity](https://github.com/glinr/glin-profanity)
- **Issues**: Report bugs or request features on GitHub

---

## Next Steps

1. Choose your integration based on your tech stack
2. Read the detailed integration guide
3. Install required dependencies
4. Start with the "Quick Start" example
5. Explore "Common Use Cases" for your specific needs
6. Fine-tune configuration for your application

**Ready to get started?** Pick an integration above and dive into the full documentation!
