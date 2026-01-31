# glin-profanity + Semantic Analysis Integration

Advanced content moderation that combines keyword-based profanity detection with semantic analysis using text embeddings. This integration enables more nuanced content moderation that can detect toxic, hateful, or harmful content even when it doesn't contain explicit profanity.

## Quick Start

### Installation

```bash
# Required
npm install glin-profanity

# Peer dependencies (choose your embedding provider)
npm install openai  # For OpenAI embeddings
# OR
npm install @anthropic-ai/sdk  # For Anthropic
# OR install other providers (Cohere, local Ollama, etc.)
```

### Basic Example

```typescript
import { createSemanticAnalyzer, createFetchEmbeddingProvider } from 'glin-profanity/ai/semantic';

// Create embedding provider (model-agnostic)
const embeddingProvider = createFetch EmbeddingProvider({
  apiKey: process.env.OPENAI_API_KEY,
  model: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
});

// Create semantic analyzer
const analyzer = createSemanticAnalyzer({
  embeddingProvider,
  keywordWeight: 0.6,      // 60% weight to keyword matching
  semanticWeight: 0.4,     // 40% weight to semantic similarity
  threshold: 0.5,          // Flag content with score >= 0.5
});

// Analyze content
const result = await analyzer.analyze('This is harmful and toxic content');
console.log(result.shouldFlag);        // true
console.log(result.combinedScore);     // 0.7
console.log(result.keywordScore);      // 0.5
console.log(result.semanticScore);     // 0.9
```

## Core Concepts

### How It Works

The semantic analyzer uses a **hybrid approach**:

1. **Keyword Detection** (Traditional): Checks for known profane words using glin-profanity's filter
2. **Semantic Analysis** (AI-Powered): Compares text embeddings against known toxic patterns
3. **Weighted Combination**: Combines both scores based on configurable weights

### Scoring System

- **Keyword Score** (0-1): Based on profane word density and severity
- **Semantic Score** (0-1): Cosine similarity to toxic reference patterns
- **Combined Score** (0-1): Weighted average of both scores
- **Threshold**: Content is flagged if `combinedScore >= threshold`

### Why Semantic Analysis?

Traditional keyword filtering can miss:
- **Toxic content without profanity**: "You should disappear forever"
- **Context-dependent abuse**: "You're as useful as a broken pencil"
- **Coded language**: "You should uninstall life"
- **Sarcasm and subtle harm**: "Oh you're so smart, just like a rock"

Semantic analysis catches these by understanding **meaning**, not just words.

## API Reference

### createSemanticAnalyzer(config)

Creates a semantic analyzer instance.

**Config:**
```typescript
{
  embeddingProvider: EmbeddingProvider;          // Required: Function to generate embeddings
  filterConfig?: Partial<FilterConfig>;          // Optional: Keyword filter configuration
  keywordWeight?: number;                        // Default: 0.6 (60% weight)
  semanticWeight?: number;                       // Default: 0.4 (40% weight)
  threshold?: number;                            // Default: 0.5
  toxicReferenceEmbeddings?: number[][];         // Optional: Pre-computed toxic embeddings
}
```

**Returns:** Analyzer instance with these methods:

#### analyzer.analyze(text: string)

Analyzes a single text string.

**Returns:**
```typescript
{
  combinedScore: number;              // 0-1, higher = more problematic
  keywordScore: number;               // 0-1, score from keyword detection
  semanticScore: number;              // 0-1, max similarity to toxic patterns
  shouldFlag: boolean;                // true if combinedScore >= threshold
  profanityResult: CheckProfanityResult;  // Detailed keyword check result
  breakdown: {
    profaneWordCount: number;
    averageSeverity: number;
    maxSemanticSimilarity: number;
    contextScore?: number;
  };
}
```

#### analyzer.analyzeBatch(texts: string[])

Analyzes multiple texts in parallel.

**Returns:** `Promise<SemanticAnalysisResult[]>`

#### analyzer.addToxicPatterns(patterns: string[])

Adds custom toxic reference patterns for comparison.

**Example:**
```typescript
await analyzer.addToxicPatterns([
  'Your custom toxic pattern',
  'Another harmful phrase',
]);
```

#### analyzer.clearCache()

Clears cached toxic embeddings. Useful if you want to regenerate embeddings or free memory.

#### analyzer.getConfig()

Returns current configuration:
```typescript
{
  keywordWeight: number;
  semanticWeight: number;
  threshold: number;
  filterConfig: FilterConfig;
}
```

### createFetchEmbeddingProvider(config)

Creates an embedding provider using fetch API. Works with any OpenAI-compatible API.

**Config:**
```typescript
{
  apiKey?: string;                              // API key (optional for local models)
  model: string;                                // REQUIRED: Model name
  baseUrl?: string;                             // Default: 'https://api.openai.com/v1'
  endpoint?: string;                            // Default: '/embeddings'
  headers?: Record<string, string>;             // Custom headers
  parseResponse?: (response: unknown) => number[];  // Custom response parser
}
```

**Returns:** `EmbeddingProvider` function

## Embedding Providers

### OpenAI

```typescript
import { createFetchEmbeddingProvider } from 'glin-profanity/ai/semantic';

const provider = createFetchEmbeddingProvider({
  apiKey: process.env.OPENAI_API_KEY,
  model: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
});
```

**Recommended models:**
- `text-embedding-3-small` - Fast, cost-effective (1536 dimensions)
- `text-embedding-3-large` - Higher accuracy (3072 dimensions)
- `text-embedding-ada-002` - Legacy, still supported

### Azure OpenAI

```typescript
const provider = createFetchEmbeddingProvider({
  apiKey: process.env.AZURE_OPENAI_KEY,
  model: process.env.AZURE_EMBEDDING_DEPLOYMENT,
  baseUrl: `https://${process.env.AZURE_RESOURCE}.openai.azure.com/openai/deployments/${process.env.AZURE_EMBEDDING_DEPLOYMENT}`,
  headers: { 'api-version': '2024-02-01' },
});
```

### Local Ollama

```typescript
const provider = createFetchEmbeddingProvider({
  model: 'nomic-embed-text',
  baseUrl: 'http://localhost:11434',
  endpoint: '/api/embeddings',
  parseResponse: (data) => (data as { embedding: number[] }).embedding,
});
```

**Popular Ollama embedding models:**
- `nomic-embed-text` - 768 dimensions, English
- `mxbai-embed-large` - 1024 dimensions
- `all-minilm` - 384 dimensions, fast

### Cohere

```typescript
const provider = createFetchEmbeddingProvider({
  apiKey: process.env.COHERE_API_KEY,
  model: 'embed-english-v3.0',
  baseUrl: 'https://api.cohere.ai/v1',
  endpoint: '/embed',
  parseResponse: (data) => (data as { embeddings: number[][] }).embeddings[0],
});
```

### Custom Provider

You can also create a custom embedding provider:

```typescript
import type { EmbeddingProvider } from 'glin-profanity/ai/semantic';

const customProvider: EmbeddingProvider = async (text: string) => {
  // Your custom logic to generate embeddings
  const response = await yourEmbeddingService.embed(text);
  return response.vector; // Must return number[]
};

const analyzer = createSemanticAnalyzer({
  embeddingProvider: customProvider,
});
```

## Common Use Cases

### Use Case 1: Chat Moderation with Pre-Process Hook

```typescript
import { createSemanticAnalyzer, createFetchEmbeddingProvider, semanticHooks } from 'glin-profanity/ai/semantic';

const embeddingProvider = createFetchEmbeddingProvider({
  apiKey: process.env.OPENAI_API_KEY,
  model: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
});

const analyzer = createSemanticAnalyzer({
  embeddingProvider,
  threshold: 0.6,
});

async function moderateUserMessage(message: string) {
  const { shouldBlock, reason, sanitized, analysis } = await semanticHooks.preProcessMessage(
    message,
    analyzer,
    { autoSanitize: true, threshold: 0.6 }
  );

  if (shouldBlock) {
    return {
      allowed: false,
      reason,
      score: analysis.combinedScore,
    };
  }

  return {
    allowed: true,
    message: sanitized,
    score: analysis.combinedScore,
  };
}

// Usage
const result = await moderateUserMessage('You should delete yourself');
console.log(result);
// { allowed: false, reason: 'Content flagged...', score: 0.75 }
```

### Use Case 2: AI Response Validation

```typescript
import { semanticHooks } from 'glin-profanity/ai/semantic';

async function validateAIResponse(aiResponse: string) {
  const { isSafe, analysis, warnings } = await semanticHooks.postProcessAIResponse(
    aiResponse,
    analyzer
  );

  if (!isSafe) {
    console.warn('AI generated unsafe content:', warnings);
    // Regenerate or return a safe fallback
    return { response: 'I apologize, but I cannot provide that response.', flagged: true };
  }

  return { response: aiResponse, flagged: false };
}

// Usage
const aiOutput = await llm.generate('Your prompt');
const validated = await validateAIResponse(aiOutput);
```

### Use Case 3: Conversation Monitoring

```typescript
import { semanticHooks } from 'glin-profanity/ai/semantic';

const monitor = semanticHooks.createConversationMonitor(analyzer);

// Track a conversation
await monitor.addMessage('user', 'Hello, how are you?');
await monitor.addMessage('assistant', 'I\'m doing well, thanks!');
await monitor.addMessage('user', 'You\'re worthless and nobody likes you');
await monitor.addMessage('assistant', 'I\'m sorry you feel that way.');

// Get conversation health report
const report = await monitor.getReport();
console.log(report);
/*
{
  totalMessages: 4,
  flaggedMessages: 1,
  averageScore: 0.2,
  isHealthy: true,        // < 10% flagged
  flaggedIndices: [2]     // Third message (index 2) was flagged
}
*/

// Clear history and start fresh
monitor.clear();
```

### Use Case 4: Batch Content Moderation

```typescript
const comments = [
  'This product is great!',
  'I hate this, it\'s complete garbage and you should be ashamed',
  'Worth the money',
  'This company deserves to burn in hell',
  'Highly recommend!',
];

const results = await analyzer.analyzeBatch(comments);

// Filter out toxic comments
const safe = comments.filter((_, i) => !results[i].shouldFlag);
const flagged = comments.filter((_, i) => results[i].shouldFlag);

console.log('Safe comments:', safe.length);
console.log('Flagged comments:', flagged.length);

// Detailed flagged analysis
flagged.forEach((comment, i) => {
  const result = results[comments.indexOf(comment)];
  console.log(`"${comment}"`);
  console.log(`  Combined Score: ${result.combinedScore.toFixed(2)}`);
  console.log(`  Keyword: ${result.keywordScore.toFixed(2)}, Semantic: ${result.semanticScore.toFixed(2)}`);
});
```

### Use Case 5: Multi-Language Support

```typescript
const analyzer = createSemanticAnalyzer({
  embeddingProvider,
  filterConfig: {
    languages: ['english', 'spanish', 'french'],
    detectLeetspeak: true,
  },
  threshold: 0.55,
});

const texts = [
  'This is toxic garbage',                    // English
  'Eres un idiota y mereces sufrir',          // Spanish
  'Tu es stupide et tout le monde te déteste', // French
];

const results = await analyzer.analyzeBatch(texts);
results.forEach((result, i) => {
  console.log(`Text ${i + 1}: ${result.shouldFlag ? 'FLAGGED' : 'SAFE'}`);
});
```

### Use Case 6: Custom Toxic Patterns for Domain-Specific Moderation

```typescript
// E-commerce product review moderation
const analyzer = createSemanticAnalyzer({
  embeddingProvider,
  threshold: 0.5,
});

// Add domain-specific toxic patterns
await analyzer.addToxicPatterns([
  'This seller is a scammer and steals money',
  'Complete fraud, they should be in jail',
  'Don\'t buy from this thief',
  'I hope this company goes bankrupt',
]);

// Now analyze reviews
const review = 'Terrible seller, probably a scammer. Save your money!';
const result = await analyzer.analyze(review);
console.log(result.shouldFlag);  // More likely to flag domain-specific toxicity
```

## Advanced Configuration

### Fine-Tuning Weights

Adjust weights based on your use case:

```typescript
// Conservative: Prioritize keyword detection (fewer false positives)
const conservativeAnalyzer = createSemanticAnalyzer({
  embeddingProvider,
  keywordWeight: 0.8,
  semanticWeight: 0.2,
  threshold: 0.6,
});

// Aggressive: Prioritize semantic detection (catches subtle toxicity)
const aggressiveAnalyzer = createSemanticAnalyzer({
  embeddingProvider,
  keywordWeight: 0.3,
  semanticWeight: 0.7,
  threshold: 0.4,
});

// Balanced: Equal weight
const balancedAnalyzer = createSemanticAnalyzer({
  embeddingProvider,
  keywordWeight: 0.5,
  semanticWeight: 0.5,
  threshold: 0.5,
});
```

### Pre-Computed Toxic Embeddings

For performance optimization, pre-compute toxic embeddings:

```typescript
// Compute once, save to database
const toxicPatterns = [
  'I hate you',
  'You should die',
  // ... more patterns
];

const toxicEmbeddings = await Promise.all(
  toxicPatterns.map(pattern => embeddingProvider(pattern))
);

// Save to database or file
await saveToDatabase(toxicEmbeddings);

// Later, load and use
const loadedEmbeddings = await loadFromDatabase();

const analyzer = createSemanticAnalyzer({
  embeddingProvider,
  toxicReferenceEmbeddings: loadedEmbeddings,
});
```

### Context-Aware Filter Configuration

```typescript
const analyzer = createSemanticAnalyzer({
  embeddingProvider,
  filterConfig: {
    enableContextAware: true,
    contextWindow: 5,          // Look at 5 words before/after
    confidenceThreshold: 0.7,  // 70% confidence required
    detectLeetspeak: true,
    normalizeUnicode: true,
  },
});
```

## Integration Patterns

### Pattern 1: Next.js API Route with Semantic Moderation

```typescript
// app/api/moderate/route.ts
import { createSemanticAnalyzer, createFetchEmbeddingProvider } from 'glin-profanity/ai/semantic';

const analyzer = createSemanticAnalyzer({
  embeddingProvider: createFetchEmbeddingProvider({
    apiKey: process.env.OPENAI_API_KEY!,
    model: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
  }),
  threshold: 0.5,
});

export async function POST(req: Request) {
  const { text } = await req.json();

  try {
    const result = await analyzer.analyze(text);

    return Response.json({
      allowed: !result.shouldFlag,
      score: result.combinedScore,
      breakdown: result.breakdown,
      profaneWords: result.profanityResult.profaneWords,
    });
  } catch (error) {
    return Response.json({ error: 'Moderation failed' }, { status: 500 });
  }
}
```

### Pattern 2: Real-Time Chat with WebSocket

```typescript
import { Server } from 'socket.io';
import { semanticHooks } from 'glin-profanity/ai/semantic';

const io = new Server(server);

io.on('connection', (socket) => {
  const monitor = semanticHooks.createConversationMonitor(analyzer);

  socket.on('message', async (message) => {
    const analysis = await monitor.addMessage('user', message);

    if (analysis.shouldFlag) {
      socket.emit('moderation_warning', {
        reason: 'Your message contains inappropriate content',
        score: analysis.combinedScore,
      });
      return;
    }

    // Broadcast message
    io.emit('message', { user: socket.id, text: message });

    // Check conversation health
    const report = await monitor.getReport();
    if (!report.isHealthy) {
      socket.emit('conversation_warning', 'Please keep the conversation respectful');
    }
  });
});
```

### Pattern 3: Background Job for Content Moderation

```typescript
import { Queue, Worker } from 'bullmq';

const moderationQueue = new Queue('content-moderation');

// Producer
async function submitForModeration(contentId: string, text: string) {
  await moderationQueue.add('moderate', { contentId, text });
}

// Consumer
const worker = new Worker('content-moderation', async (job) => {
  const { contentId, text } = job.data;

  const result = await analyzer.analyze(text);

  if (result.shouldFlag) {
    await database.content.update(contentId, {
      status: 'flagged',
      moderationScore: result.combinedScore,
      profaneWords: result.profanityResult.profaneWords,
    });

    // Notify moderators
    await notifyModerators(contentId, result);
  } else {
    await database.content.update(contentId, { status: 'approved' });
  }
});
```

### Pattern 4: Cloudflare Workers Edge Moderation

```typescript
// worker.ts
import { createSemanticAnalyzer, createFetchEmbeddingProvider } from 'glin-profanity/ai/semantic';

const analyzer = createSemanticAnalyzer({
  embeddingProvider: createFetchEmbeddingProvider({
    apiKey: env.OPENAI_API_KEY,
    model: 'text-embedding-3-small',
  }),
});

export default {
  async fetch(request: Request, env: Env) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const { text } = await request.json();
    const result = await analyzer.analyze(text);

    return Response.json({
      allowed: !result.shouldFlag,
      score: result.combinedScore,
    });
  },
};
```

## Performance Tips

- **Cache toxic embeddings**: Pre-compute and store toxic pattern embeddings to avoid repeated API calls
- **Batch processing**: Use `analyzeBatch()` for multiple texts - embeddings are fetched in parallel
- **Local models**: Use Ollama for embeddings if you have high volume - no API costs, lower latency
- **Smaller embedding models**: `text-embedding-3-small` or `nomic-embed-text` are fast and accurate enough for most use cases
- **Adjust weights dynamically**: Use higher keyword weight (0.7-0.8) for real-time chat, higher semantic weight (0.6-0.7) for content review
- **Clear cache periodically**: Call `analyzer.clearCache()` if you're running long-lived processes
- **Use hooks for common patterns**: The `semanticHooks` reduce boilerplate and handle edge cases

## TypeScript Support

Fully typed with comprehensive interfaces:

```typescript
import type {
  SemanticAnalyzer Config,
  SemanticAnalysisResult,
  EmbeddingProvider,
  FetchEmbeddingProviderConfig,
} from 'glin-profanity/ai/semantic';

// Type-safe analyzer creation
const config: SemanticAnalyzerConfig = {
  embeddingProvider: myProvider,
  keywordWeight: 0.6,
  semanticWeight: 0.4,
  threshold: 0.5,
};

const analyzer = createSemanticAnalyzer(config);

// Fully typed results
const result: SemanticAnalysisResult = await analyzer.analyze('text');
```

## Troubleshooting

### Common Issue 1: Embedding API errors
**Problem**: "Embedding API error: 401 Unauthorized" or "429 Too Many Requests"  
**Solution**: 
- Check that your API key is correct and has permission for embeddings
- For rate limits, implement retry logic with exponential backoff
- Consider switching to a local model (Ollama) for high-volume use cases
- Cache embeddings for repeated patterns

### Common Issue 2: Different embedding dimensions
**Problem**: "Vectors must have same length" error  
**Solution**: Ensure all embeddings use the same model and dimensions. If you change models, call `analyzer.clearCache ()` to regenerate toxic embeddings.

### Common Issue 3: False positives
**Problem**: Clean content is being flagged  
**Solution**: 
- Increase `threshold` (try 0.6-0.7)
- Increase `keywordWeight` and decrease `semanticWeight`
- Review and refine your toxic patterns
- Check if your embedding model is appropriate for your language/domain

### Common Issue 4: Missing toxic content
**Problem**: Obviously toxic content not being flagged  
**Solution**: 
- Decrease `threshold` (try 0.3-0.4)
- Increase `semanticWeight`
- Add domain-specific toxic patterns with `addToxicPatterns()`
- Enable leetspeak and Unicode normalization in `filterConfig`

### Common Issue 5: Performance issues
**Problem**: Analysis is slow  
**Solution**: 
- Use a faster embedding model (`text-embedding-3-small`, `nomic-embed-text`)
- Pre-compute toxic embeddings and pass via `toxicReferenceEmbeddings`
- Use local Ollama instead of API calls
- Batch analyze when possible
- Implement caching for repeated texts

### Common Issue 6: Memory leaks in long-running processes
**Problem**: Memory usage grows over time  
**Solution**: Call `analyzer.clearCache()` periodically (e.g., every 1000 analyses or on a timer).

## API Reference

For full API documentation, see:
- [Core API Reference](../api-reference.md)
- [Advanced Features](../advanced-features.md)

### Exports

```typescript
// Main factory
export function createSemanticAnalyzer(
  config: SemanticAnalyzerConfig
): SemanticAnalyzer;

// Embedding provider utilities
export function createFetchEmbeddingProvider(
  config: FetchEmbeddingProviderConfig
): EmbeddingProvider;

// Hooks for common patterns
export const semanticHooks: {
  preProcessMessage: (message, analyzer, options?) => Promise<PreProcessResult>;
  postProcessAIResponse: (response, analyzer) => Promise<PostProcessResult>;
  createConversationMonitor: (analyzer) => ConversationMonitor;
};

// Types
export type EmbeddingProvider = (text: string) => Promise<number[]>;
export interface SemanticAnalyzerConfig { /* ... */ }
export interface SemanticAnalysisResult { /* ... */ }
export interface FetchEmbeddingProviderConfig { /* ... */ }
```

---

**Minimum Versions:**
- `node`: >= 18.0.0 (for fetch API)
- `glin-profanity`: >= 2.0.0
- Embedding providers vary by service

**Recommended Setup:**
- **Production**: OpenAI `text-embedding-3-small` or Azure OpenAI
- ****Development**: Local Ollama with `nomic-embed-text`
- **High-volume**: Self-hosted embedding service or Ollama
