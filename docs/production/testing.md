# Testing Guide

Comprehensive guide for testing applications that use glin-profanity.

## Table of Contents

- [Unit Testing](#unit-testing)
- [Integration Testing](#integration-testing)
- [Mocking Strategies](#mocking-strategies)
- [Testing AI Integrations](#testing-ai-integrations)
- [Performance Testing](#performance-testing)
- [Edge Cases](#edge-cases)
- [Test Coverage](#test-coverage)
- [CI/CD Integration](#cicd-integration)

---

## Unit Testing

### Testing Basic Profanity Detection

**Jest/Vitest Example:**

```typescript
import { describe, it, expect } from 'vitest';
import { Filter, checkProfanity } from 'glin-profanity';

describe('Profanity Detection', () => {
  it('should detect profanity in text', () => {
    const result = checkProfanity('This is fucking bad');
    
    expect(result.containsProfanity).toBe(true);
    expect(result.profaneWords).toContain('fucking');
  });

  it('should not flag clean text', () => {
    const result = checkProfanity('This is a nice message');
    
    expect(result.containsProfanity).toBe(false);
    expect(result.profaneWords).toHaveLength(0);
  });

  it('should detect leetspeak obfuscation', () => {
    const filter = new Filter({ detectLeetspeak: true });
    const result = filter.checkProfanity('f4ck this');
    
    expect(result.containsProfanity).toBe(true);
    expect(result.profaneWords).toContain('fuck');
  });

  it('should handle empty strings', () => {
    const result = checkProfanity('');
    
    expect(result.containsProfanity).toBe(false);
    expect(result.profaneWords).toHaveLength(0);
  });
});
```

### Testing Filter Configuration

```typescript
describe('Filter Configuration', () => {
  it('should respect language settings', () => {
    const filter = new Filter({ languages: ['english'] });
    const result = filter.checkProfanity('merde'); // French profanity
    
    // Should not detect because only English is enabled
    expect(result.containsProfanity).toBe(false);
  });

  it('should respect custom exclusions', () => {
    const filter = new Filter({ excludeWords: ['damn', 'hell'] });
    
    expect(filter.isProfane('damn it')).toBe(false);
    expect(filter.isProfane('fuck it')).toBe(true);
  });

  it('should cache results when enabled', () => {
    const filter = new Filter({ cacheResults: true });
    
    const start1 = performance.now();
    filter.checkProfanity('test message');
    const time1 = performance.now() - start1;
    
    const start2 = performance.now();
    filter.checkProfanity('test message');
    const time2 = performance.now() - start2;
    
    // Second call should be significantly faster
    expect(time2).toBeLessThan(time1 / 10);
  });
});
```

### Testing Censorship

```typescript
describe('Text Censorship', () => {
  const filter = new Filter();

  it('should censor profane words', () => {
    const result = filter.censorText('shit happens');
    
    expect(result.processedText).toBe('**** happens');
    expect(result.modified).toBe(true);
  });

  it('should preserve length by default', () => {
    const result = filter.censorText('fuck');
    
    expect(result.processedText).toHaveLength(4);
    expect(result.processedText).toBe('****');
  });

  it('should support custom replacement', () => {
    const result = filter.censorText('damn it', '###');
    
    expect(result.processedText).toContain('###');
  });
});
```

---

## Integration Testing

### Testing with React Components

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { useProfanityChecker } from 'glin-profanity';

function ChatInput() {
  const { result, checkText } = useProfanityChecker();
  
  return (
    <div>
      <input 
        data-testid="chat-input"
        onChange={(e) => checkText(e.target.value)} 
      />
      {result?.containsProfanity && (
        <span data-testid="warning">Please use appropriate language</span>
      )}
    </div>
  );
}

describe('ChatInput Component', () => {
  it('should show warning for profane input', () => {
    render(<ChatInput />);
    
    const input = screen.getByTestId('chat-input');
    fireEvent.change(input, { target: { value: 'shit' } });
    
    expect(screen.getByTestId('warning')).toBeInTheDocument();
  });

  it('should not show warning for clean input', () => {
    render(<ChatInput />);
    
    const input = screen.getByTestId('chat-input');
    fireEvent.change(input, { target: { value: 'hello' } });
    
    expect(screen.queryByTestId('warning')).not.toBeInTheDocument();
  });
});
```

### Testing API Routes (Next.js)

```typescript
import { POST } from '@/app/api/moderate/route';

describe('/api/moderate', () => {
  it('should approve clean content', async () => {
    const request = new Request('http://localhost:3000/api/moderate', {
      method: 'POST',
      body: JSON.stringify({ text: 'Hello world' })
    });
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.approved).toBe(true);
  });

  it('should reject profane content', async () => {
    const request = new Request('http://localhost:3000/api/moderate', {
      method: 'POST',
      body: JSON.stringify({ text: 'fuck this' })
    });
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.approved).toBe(false);
    expect(data.profaneWords).toContain('fuck');
  });
});
```

---

## Mocking Strategies

### Mocking for Fast Tests

```typescript
import { vi } from 'vitest';

// Mock the entire module
vi.mock('glin-profanity', () => ({
  checkProfanity: vi.fn((text) => ({
    containsProfanity: text.includes('mock-profanity'),
    profaneWords: text.includes('mock-profanity') ? ['mock'] : [],
    wordCount: text.split(' ').length
  })),
  Filter: vi.fn().mockImplementation(() => ({
    checkProfanity: vi.fn((text) => ({
      containsProfanity: false,
      profaneWords: [],
      wordCount: text.split(' ').length
    }))
  }))
}));

describe('With Mocked Profanity', () => {
  it('should use mocked behavior', () => {
    const result = checkProfanity('mock-profanity test');
    
    expect(result.containsProfanity).toBe(true);
    expect(result.profaneWords).toContain('mock');
  });
});
```

### Partial Mocking

```typescript
import { Filter } from 'glin-profanity';

// Mock only specific methods
const mockFilter = {
  checkProfanity: vi.fn(),
  isProfane: vi.fn(),
  censorText: vi.fn()
};

describe('Service with Filter', () => {
  it('should call filter correctly', () => {
    mockFilter.checkProfanity.mockReturnValue({
      containsProfanity: false,
      profaneWords: [],
      wordCount: 2
    });
    
    // Your service code that uses the filter
    const service = new ModerationService(mockFilter);
    service.moderateContent('test message');
    
    expect(mockFilter.checkProfanity).toHaveBeenCalledWith('test message');
  });
});
```

---

## Testing AI Integrations

### Testing OpenAI Integration

```typescript
import { profanityTools, executeProfanityTool } from 'glin-profanity/ai/openai';

describe('OpenAI Integration', () => {
  it('should have all required tools', () => {
    expect(profanityTools).toHaveLength(5);
    
    const toolNames = profanityTools.map(t => t.function.name);
    expect(toolNames).toContain('check_profanity');
    expect(toolNames).toContain('censor_text');
  });

  it('should execute check_profanity tool', async () => {
    const result = await executeProfanityTool('check_profanity', {
      text: 'test message',
      detectLeetspeak: true
    });
    
    expect(result).toHaveProperty('containsProfanity');
    expect(result).toHaveProperty('profaneWords');
  });

  it('should handle invalid tool names', async () => {
    await expect(
      executeProfanityTool('invalid_tool', {})
    ).rejects.toThrow();
  });
});
```

### Testing LangChain Integration

```typescript
import { profanityCheckTool, allProfanityTools } from 'glin-profanity/ai/langchain';

describe('LangChain Integration', () => {
  it('should invoke profanityCheckTool', async () => {
    const result = await profanityCheckTool.invoke({
      text: 'Hello world'
    });
    
    expect(result.containsProfanity).toBe(false);
  });

  it('should have all tools in collection', () => {
    expect(allProfanityTools).toHaveLength(5);
  });

  it('should work with tool parameters', async () => {
    const result = await profanityCheckTool.invoke({
      text: 'f4ck',
      detectLeetspeak: true
    });
    
    expect(result.containsProfanity).toBe(true);
  });
});
```

### Testing Semantic Analysis

```typescript
import { 
  createSemanticAnalyzer,
  createFetchEmbeddingProvider 
} from 'glin-profanity/ai/semantic';

describe('Semantic Analysis', () => {
  // Mock embedding provider for tests
  const mockProvider = {
    getEmbedding: vi.fn(async (text) => {
      // Return mock embedding vector
      return new Array(1536).fill(0).map(() => Math.random());
    })
  };

  it('should analyze text semantically', async () => {
    const analyzer = createSemanticAnalyzer({
      embeddingProvider: mockProvider,
      threshold: 0.5
    });

    const result = await analyzer.analyze('test message');
    
    expect(result).toHaveProperty('shouldFlag');
    expect(result).toHaveProperty('combinedScore');
    expect(mockProvider.getEmbedding).toHaveBeenCalled();
  });

  it('should batch analyze efficiently', async () => {
    const analyzer = createSemanticAnalyzer({
      embeddingProvider: mockProvider
    });

    const texts = ['text1', 'text2', 'text3'];
    const results = await analyzer.analyzeBatch(texts);
    
    expect(results).toHaveLength(3);
    expect(mockProvider.getEmbedding).toHaveBeenCalledTimes(3);
  });
});
```

---

## Performance Testing

### Benchmarking

```typescript
import { describe, it, expect } from 'vitest';
import { Filter } from 'glin-profanity';

describe('Performance Benchmarks', () => {
  const filter = new Filter({ cacheResults: true });
  const testText = 'This is a test message without profanity';

  it('should process 1000 messages in under 100ms', () => {
    const start = performance.now();
    
    for (let i = 0; i < 1000; i++) {
      filter.checkProfanity(testText);
    }
    
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100);
  });

  it('should benefit from caching', () => {
    // First run (uncached)
    const start1 = performance.now();
    for (let i = 0; i < 100; i++) {
      filter.checkProfanity('unique message ' + i);
    }
    const time1 = performance.now() - start1;

    // Second run (cached)
    const start2 = performance.now();
    for (let i = 0; i < 100; i++) {
      filter.checkProfanity('unique message ' + i);
    }
    const time2 = performance.now() - start2;

    // Cached should be at least 10x faster
    expect(time2 * 10).toBeLessThan(time1);
  });
});
```

### Memory Leak Testing

```typescript
describe('Memory Management', () => {
  it('should not leak memory with large cache', () => {
    const filter = new Filter({ 
      cacheResults: true,
      cacheSize: 1000 
    });

    const initialMemory = process.memoryUsage().heapUsed;

    // Process 10,000 unique messages
    for (let i = 0; i < 10000; i++) {
      filter.checkProfanity(`message ${i}`);
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const growth = (finalMemory - initialMemory) / 1024 / 1024; // MB

    // Should not grow more than 10MB
    expect(growth).toBeLessThan(10);
  });
});
```

---

## Edge Cases

### Testing Edge Cases

```typescript
describe('Edge Cases', () => {
  const filter = new Filter();

  it('should handle very long text', () => {
    const longText = 'word '.repeat(10000);
    const result = filter.checkProfanity(longText);
    
    expect(result).toHaveProperty('containsProfanity');
  });

  it('should handle special characters', () => {
    const result = filter.checkProfanity('!@#$%^&*()');
    
    expect(result.containsProfanity).toBe(false);
  });

  it('should handle Unicode properly', () => {
    const result = filter.checkProfanity('Hello 世界 🌍');
    
    expect(result.containsProfanity).toBe(false);
  });

  it('should handle mixed case', () => {
    const result = filter.checkProfanity('ShIt HaPpEnS');
    
    expect(result.containsProfanity).toBe(true);
  });

  it('should handle numbers and profanity', () => {
    const filter = new Filter({ detectLeetspeak: true });
    const result = filter.checkProfanity('f4ck1ng 5h1t');
    
    expect(result.containsProfanity).toBe(true);
    expect(result.profaneWords.length).toBeGreaterThan(0);
  });
});
```

---

## Test Coverage

### Measuring Coverage

**package.json:**
```json
{
  "scripts": {
    "test": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  },
  "devDependencies": {
    "@vitest/coverage-v8": "^1.0.0",
    "vitest": "^1.0.0"
  }
}
```

**vitest.config.ts:**
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.spec.ts'
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80
      }
    }
  }
});
```

### Coverage Goals

- **Lines**: 80%+
- **Functions**: 80%+
- **Branches**: 75%+
- **Statements**: 80%+

---

## CI/CD Integration

### GitHub Actions

**.github/workflows/test.yml:**
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Generate coverage
        run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
          fail_ci_if_error: true
```

### GitLab CI

**.gitlab-ci.yml:**
```yaml
test:
  image: node:20
  stage: test
  script:
    - npm ci
    - npm run test:coverage
  coverage: '/Lines\s*:\s*(\d+\.\d+)%/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
```

---

## Best Practices

### 1. Test Isolation

Each test should be independent:

```typescript
describe('Isolated Tests', () => {
  let filter: Filter;

  beforeEach(() => {
    // Fresh instance for each test
    filter = new Filter();
  });

  afterEach(() => {
    // Cleanup if needed
    filter = null;
  });

  it('test 1', () => {
    // Use filter
  });

  it('test 2', () => {
    // Use filter (fresh instance)
  });
});
```

### 2. Descriptive Test Names

```typescript
// ❌ Bad
it('works', () => { ... });

// ✅ Good
it('should detect profanity in mixed case text', () => { ... });
```

### 3. Arrange-Act-Assert Pattern

```typescript
it('should censor profane words', () => {
  // Arrange
  const filter = new Filter();
  const text = 'shit happens';

  // Act
  const result = filter.censorText(text);

  // Assert
  expect(result.processedText).toBe('**** happens');
});
```

### 4. Test Data Builders

```typescript
function createTestFilter(overrides = {}) {
  return new Filter({
    languages: ['english'],
    detectLeetspeak: false,
    ...overrides
  });
}

it('should use test data builder', () => {
  const filter = createTestFilter({ detectLeetspeak: true });
  // Test with predictable configuration
});
```

---

## Snapshot Testing

```typescript
import { describe, it, expect } from 'vitest';

describe('Snapshots', () => {
  it('should match profanity result snapshot', () => {
    const result = checkProfanity('test message');
    
    expect(result).toMatchSnapshot();
  });

  it('should match tool definitions snapshot', () => {
    const tools = profanityTools;
    
    // Ensures tools don't change unexpectedly
    expect(tools.map(t => t.function.name)).toMatchSnapshot();
  });
});
```

---

## Test Utilities

### Custom Matchers

```typescript
expect.extend({
  toContainProfanity(received) {
    const result = checkProfanity(received);
    return {
      pass: result.containsProfanity,
      message: () => 
        `expected "${received}" ${this.isNot ? 'not ' : ''}to contain profanity`
    };
  }
});

// Usage
it('should work with custom matcher', () => {
  expect('fuck this').toContainProfanity();
  expect('hello world').not.toContainProfanity();
});
```

---

## Next Steps

- [Deployment Guide](./deployment.md) - Deploy to production
- [Security Guide](./security.md) - Security best practices
- [Performance Guide](./performance.md) - Optimization tips

---

**Questions?** Open an issue on [GitHub](https://github.com/GLINCKER/glin-profanity/issues).
