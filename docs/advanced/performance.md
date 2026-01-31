# Performance Guide

Optimize glin-profanity for maximum throughput and minimal latency.

## Table of Contents

- [Performance Overview](#performance-overview)
- [Benchmarking](#benchmarking)
- [Optimization Strategies](#optimization-strategies)
- [Caching](#caching)
- [Batch Processing](#batch-processing)
- [Memory Management](#memory-management)
- [Serverless Optimization](#serverless-optimization)
- [Monitoring](#monitoring)

---

## Performance Overview

### Baseline Performance

Tested on **Node.js 20, M1 MacBook Pro, single-threaded**:

| Operation | Performance | Use Case |
|-----------|-------------|----------|
| Simple check | **21M ops/sec** | Basic profanity detection |
| With leetspeak (moderate) | **8.5M ops/sec** | Real-world scenarios |
| With Unicode normalization | **15M ops/sec** | International content |
| Multi-language (3 langs) | **18M ops/sec** | Multilingual platforms |
| With caching (hit) | **200M+ ops/sec** | Repeated content |
| ML toxicity check | **50-200ms** | Advanced detection |

### Latency Targets

| Environment | Target | Typical |
|-------------|--------|---------|
| **Synchronous API** | < 0.1ms | 0.05ms |
| **With caching** | < 0.001ms | 0.0005ms |
| **Batch (100 items)** | < 10ms | 5ms |
| **ML detection** | < 200ms | 100ms |
| **Serverless cold start** | < 100ms | 50ms |

---

## Benchmarking

### Built-in Benchmarks

```bash
cd packages/js
npm run benchmark
```

**Output:**
```
Simple profanity check: 21,000,000 ops/sec
Leetspeak detection: 8,500,000 ops/sec
Unicode normalization: 15,000,000 ops/sec
Multi-language (3): 18,000,000 ops/sec
Batch processing (100): 2,100,000 ops/sec total
Cache hit: 200,000,000+ ops/sec
```

### Custom Benchmarks

```typescript
import { Filter } from 'glin-profanity';
import Benchmark from 'benchmark';

const filter = new Filter({ detectLeetspeak: true });
const suite = new Benchmark.Suite();

suite
  .add('checkProfanity', () => {
    filter.checkProfanity('test message with shit');
  })
  .add('isProfane', () => {
    filter.isProfane('test message with shit');
  })
  .add('censorText', () => {
    filter.censorText('test message with shit');
  })
  .on('cycle', (event) => {
    console.log(String(event.target));
  })
  .on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
  })
  .run({ async: true });
```

### Real-World Benchmarks

```typescript
import { performance } from 'perf_hooks';

async function benchmarkRealWorld() {
  const filter = new Filter({
    detectLeetspeak: true,
    cacheResults: true
  });

  // Simulate 1000 user messages
  const messages = generateMessages(1000);

  const start = performance.now();
  
  for (const msg of messages) {
    filter.checkProfanity(msg);
  }

  const end = performance.now();
  const duration = end - start;
  const opsPerSec = (1000 / duration) * 1000;

  console.log(`Processed 1000 messages in ${duration.toFixed(2)}ms`);
  console.log(`Throughput: ${opsPerSec.toFixed(0)} ops/sec`);
}
```

---

## Optimization Strategies

### 1. Enable Caching ⚡

**Impact:** 800x faster on repeated content

```typescript
const filter = new Filter({
  cacheResults: true,
  cacheSize: 5000  // Adjust based on memory
});

// First check (uncached): ~0.05ms
filter.checkProfanity('test message');

// Second check (cached): ~0.0001ms
filter.checkProfanity('test message');
```

**When to use:**
- ✅ Chat applications (users repeat messages)
- ✅ Comment moderation (copy-paste spam)
- ✅ High-traffic APIs
- ❌ Unique content every time

### 2. Minimize Language Set

**Impact:** 40-50% faster with 1 language vs 24

```typescript
// Slower (all languages)
const filter = new Filter({
  languages: ['english', 'spanish', 'french', ..., 'turkish']
});

// Faster (only needed languages)
const filter = new Filter({
  languages: ['english']  // 21M ops/sec
});
```

### 3. Optimize Leetspeak Level

**Impact:** 3x faster with basic vs aggressive

```typescript
// Fastest
const filter = new Filter({
  detectLeetspeak: true,
  leetspeakLevel: 'basic'  // ~15M ops/sec
});

// Balanced
filter.leetspeakLevel = 'moderate';  // ~8.5M ops/sec

// Most thorough (slowest)
filter.leetspeakLevel = 'aggressive';  // ~5M ops/sec
```

**Recommendation:** Start with `moderate`, only use `aggressive` if needed.

### 4. Boolean Checks for Speed

**Impact:** Slightly faster with `isProfane()`

```typescript
// Faster (boolean only)
if (filter.isProfane(text)) {
  // Handle profanity
}

// Slower (full analysis)
const result = filter.checkProfanity(text);
if (result.containsProfanity) {
  // Handle profanity
}
```

**Difference:** ~5-10% faster

### 5. Disable Features You Don't Need

```typescript
const filter = new Filter({
  detectLeetspeak: false,      // +40% faster
  normalizeUnicode: false,     // +30% faster
  partialMatching: false,      // +20% faster
  severityLevels: false,       // +10% faster
  cacheResults: false          // No cache overhead
});

// Fastest possible (basic detection only): ~30M ops/sec
```

---

## Caching

### LRU Cache Configuration

```typescript
const filter = new Filter({
  cacheResults: true,
  cacheSize: 10000  // Store up to 10,000 results
});

// Monitor cache
console.log(filter.getCacheSize());  // Current size
console.log(filter.getCacheHitRate());  // Hit rate percentage

// Clear cache if needed
filter.clearCache();
```

### Cache Hit Rate Optimization

```typescript
// Calculate optimal cache size
function calculateOptimalCacheSize(messages: string[]) {
  const uniqueMessages = new Set(messages);
  const repetitionRate = uniqueMessages.size / messages.length;
  
  // Aim for 90% hit rate
  const optimalSize = Math.ceil(uniqueMessages.size * 1.2);
  
  return {
    uniqueMessages: uniqueMessages.size,
    repetitionRate: (1 - repetitionRate) * 100,
    recommendedCacheSize: optimalSize
  };
}
```

### External Caching (Redis)

For distributed systems:

```typescript
import Redis from 'ioredis';
import { Filter } from 'glin-profanity';

const redis = new Redis();
const filter = new Filter({ cacheResults: false });

async function checkWithRedisCache(text: string) {
  // Check Redis first
  const cached = await redis.get(`prof:${text}`);
  if (cached) {
    return JSON.parse(cached);
  }

  // Not in cache, check profanity
  const result = filter.checkProfanity(text);

  // Store in Redis (TTL: 1 hour)
  await redis.setex(`prof:${text}`, 3600, JSON.stringify(result));

  return result;
}
```

---

## Batch Processing

### Parallel Batch Processing

```typescript
import pLimit from 'p-limit';

const filter = new Filter({ cacheResults: true });
const limit = pLimit(10);  // 10 concurrent

async function processBatch(texts: string[]) {
  const start = Date.now();

  const results = await Promise.all(
    texts.map(text =>
      limit(() => filter.checkProfanity(text))
    )
  );

  const duration = Date.now() - start;
  console.log(`Processed ${texts.length} in ${duration}ms`);
  console.log(`Throughput: ${(texts.length / duration * 1000).toFixed(0)} ops/sec`);

  return results;
}
```

### Stream Processing

```typescript
import { Transform } from 'stream';

class ProfanityFilterStream extends Transform {
  private filter: Filter;

  constructor() {
    super({ objectMode: true });
    this.filter = new Filter({ cacheResults: true });
  }

  _transform(chunk: string, encoding: string, callback: Function) {
    const result = this.filter.checkProfanity(chunk);
    
    if (!result.containsProfanity) {
      this.push(chunk);
    }

    callback();
  }
}

// Usage
const filterStream = new ProfanityFilterStream();
inputStream
  .pipe(filterStream)
  .pipe(outputStream);
```

### Chunking Large Datasets

```typescript
async function processLargeDataset(texts: string[], chunkSize = 1000) {
  const filter = new Filter({ cacheResults: true });
  const results = [];

  for (let i = 0; i < texts.length; i += chunkSize) {
    const chunk = texts.slice(i, i + chunkSize);
    
    const chunkResults = chunk.map(text => 
      filter.checkProfanity(text)
    );

    results.push(...chunkResults);

    // Optional: log progress
    console.log(`Processed ${Math.min(i + chunkSize, texts.length)}/${texts.length}`);
  }

  return results;
}
```

---

## Memory Management

### Memory Usage

| Configuration | Memory Usage |
|--------------|--------------|
| 1 language | ~50 KB |
| 3 languages | ~150 KB |
| 24 languages | ~180 KB |
| + Cache (5000 items) | +~500 KB |
| + ML model | +~450 KB |

### Memory Optimization

```typescript
// Minimize memory footprint
const filter = new Filter({
  languages: ['english'],      // Only needed languages
  cacheResults: true,
  cacheSize: 1000,             // Smaller cache
  severityLevels: false        // Disable if not needed
});

// Serverless: Clear cache periodically
setInterval(() => {
  if (filter.getCacheSize() > 5000) {
    filter.clearCache();
  }
}, 60000);  // Every 60 seconds
```

### Memory Leak Prevention

```typescript
// ❌ BAD: Creating new filters repeatedly
app.post('/check', (req, res) => {
  const filter = new Filter();  // Memory leak!
  const result = filter.checkProfanity(req.body.text);
  res.json(result);
});

// ✅ GOOD: Reuse filter instance
const filter = new Filter({ cacheResults: true });

app.post('/check', (req, res) => {
  const result = filter.checkProfanity(req.body.text);
  res.json(result);
});
```

---

## Serverless Optimization

### Cold Start Optimization

```typescript
// Lazy load ML model
let toxicityModel: any = null;

export async function handler(event: any) {
  const filter = new Filter({ cacheResults: true });

  // Basic check (fast, no cold start penalty)
  const result = filter.checkProfanity(event.text);

  // Only load ML if needed
  if (result.containsProfanity && event.useML) {
    if (!toxicityModel) {
      const { loadToxicityModel } = await import('glin-profanity/ml');
      toxicityModel = await loadToxicityModel();
    }

    const mlResult = await toxicityModel.check(event.text);
    return { ...result, ml: mlResult };
  }

  return result;
}
```

### AWS Lambda Optimization

```typescript
// Initialize outside handler
const filter = new Filter({
  languages: ['english'],
  detectLeetspeak: true,
  cacheResults: true,
  cacheSize: 10000
});

export const handler = async (event: any) => {
  // Reuse filter across invocations
  const result = filter.checkProfanity(event.text);

  return {
    statusCode: 200,
    body: JSON.stringify(result)
  };
};
```

### Vercel Edge Functions

```typescript
export const config = { runtime: 'edge' };

// Edge-optimized filter
const filter = new Filter({
  languages: ['english'],
  detectLeetspeak: true,
  cacheResults: true,
  cacheSize: 5000  // Smaller for edge
});

export default async function handler(request: Request) {
  const { text } = await request.json();
  const result = filter.checkProfanity(text);

  return Response.json(result, {
    headers: {
      'Cache-Control': 'public, s-maxage=60'
    }
  });
}
```

---

## Monitoring

### Performance Metrics

```typescript
import { Filter } from 'glin-profanity';

class MonitoredFilter extends Filter {
  private stats = {
    checks: 0,
    cacheHits: 0,
    totalTime: 0,
    avgTime: 0
  };

  checkProfanity(text: string) {
    const start = performance.now();
    const result = super.checkProfanity(text);
    const duration = performance.now() - start;

    this.stats.checks++;
    this.stats.totalTime += duration;
    this.stats.avgTime = this.stats.totalTime / this.stats.checks;

    return result;
  }

  getStats() {
    return {
      ...this.stats,
      cacheSize: this.getCacheSize(),
      cacheHitRate: (this.stats.cacheHits / this.stats.checks) * 100
    };
  }
}
```

### Prometheus Metrics

```typescript
import { Counter, Histogram } from 'prom-client';

const checkCounter = new Counter({
  name: 'profanity_checks_total',
  help: 'Total profanity checks',
  labelNames: ['result']
});

const checkDuration = new Histogram({
  name: 'profanity_check_duration_ms',
  help: 'Profanity check duration',
  buckets: [0.01, 0.1, 1, 10, 100]
});

function checkWithMetrics(text: string) {
  const end = checkDuration.startTimer();
  const result = filter.checkProfanity(text);
  end();

  checkCounter.inc({
    result: result.containsProfanity ? 'flagged' : 'clean'
  });

  return result;
}
```

### APM Integration

```typescript
import * as Sentry from '@sentry/node';

function checkWithAPM(text: string) {
  const transaction = Sentry.startTransaction({
    op: 'profanity.check',
    name: 'Check Profanity'
  });

  try {
    const result = filter.checkProfanity(text);

    transaction.setData('containsProfanity', result.containsProfanity);
    transaction.setData('wordCount', result.wordCount);

    return result;
  } finally {
    transaction.finish();
  }
}
```

---

## Performance Comparison

### vs Competitors

| Library | Simple Check | With Leetspeak | Multi-Language |
|---------|-------------|----------------|----------------|
| **glin-profanity** | **21M ops/sec** | **8.5M ops/sec** | **18M ops/sec** |
| bad-words | 890K ops/sec | N/A | N/A |
| leo-profanity | 1.2M ops/sec | N/A | 400K ops/sec |
| obscenity | 650K ops/sec | Partial | N/A |

### Language Performance

| Languages | Performance | Overhead |
|-----------|-------------|----------|
| 1 language | 21M ops/sec | Baseline |
| 3 languages | 18M ops/sec | 14% |
| 5 languages | 17M ops/sec | 19% |
| 24 languages | 15M ops/sec | 29% |

---

## Best Practices

### ✅ Do

- Enable caching for repeated content
- Use minimum required languages
- Reuse filter instances
- Use batch processing for bulk operations
- Monitor cache hit rates
- Profile in production environment
- Use `isProfane()` when you only need boolean result

### ❌ Don't

- Create new filter instances per request
- Enable all languages if only using one
- Use `aggressive` leetspeak level unless necessary
- Disable caching in high-traffic scenarios
- Forget to clear cache in long-running processes
- Use ML detection for every check (expensive)

---

## Next Steps

- [Deployment Guide](./deployment.md) - Production deployment
- [Configuration](./configuration.md) - Optimization settings
- [Examples](./examples.md) - Performance examples

---

**Questions?** See [FAQ](./faq.md) or [GitHub Issues](https://github.com/GLINCKER/glin-profanity/issues).
