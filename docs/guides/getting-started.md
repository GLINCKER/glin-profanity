---
title: "Getting Started with glin-profanity"
description: "Quick start guide for glin-profanity: install, configure, and implement profanity detection in under 10 minutes"
keywords:
  - getting started
  - quick start
  - installation
  - first steps
  - profanity filter setup
  - basic usage
  - JavaScript profanity filter
  - TypeScript profanity filter
  - Python profanity filter
category: guides
type: tutorial
difficulty: beginner
time_to_complete: "10-15 minutes"
audience:
  - beginners
  - developers
  - new-users
prerequisites:
  - Node.js 18+ or Python 3.8+
  - Basic JavaScript/TypeScript or Python knowledge
frameworks:
  - vanilla-js
  - react
  - next-js
  - express
  - python
related_docs:
  - installation.md
  - configuration.md
  - quick-reference.md
  - examples.md
seo_optimized: true
ai_friendly: true
updated: "2026-01-31"
---

# Getting Started with glin-profanity

Get up and running with profanity detection in under 10 minutes.

## What You'll Learn

- ✅ Install glin-profanity
- ✅ Basic profanity checking
- ✅ Text censoring
- ✅ Configuration options
- ✅ Framework integration

---

## Quick Install

### JavaScript/TypeScript

```bash
npm install glin-profanity
# or
yarn add glin-profanity
# or
pnpm add glin-profanity
```

### Python

```bash
pip install glin-profanity
# or
pip3 install glin-profanity
```

---

## Basic Usage (5 minutes)

### JavaScript/TypeScript

```typescript
import { Filter } from 'glin-profanity';

// Create filter instance
const filter = new Filter({
  languages: ['english'],
  detectLeetspeak: true
});

// Check for profanity
const result = filter.checkProfanity('What the hell is this?');

console.log(result.containsProfanity);  // true
console.log(result.profaneWords);       // ['hell']

// Censor text
const censored = filter.censorText('What the hell is this?');
console.log(censored.processedText);    // 'What the **** is this?'

// Boolean check
if (filter.isProfane('damn it')) {
  console.log('Contains profanity!');
}
```

### Python

```python
from glin_profanity import Filter

# Create filter instance
filter = Filter({
    'languages': ['english'],
    'detect_leetspeak': True
})

# Check for profanity
result = filter.check_profanity('What the hell is this?')

print(result['contains_profanity'])  # True
print(result['profane_words'])       # ['hell']

# Censor text
censored = filter.censor_text('What the hell is this?')
print(censored['processed_text'])    # 'What the **** is this?'

# Boolean check
if filter.is_profane('damn it'):
    print('Contains profanity!')
```

---

## Framework Examples

### React

```typescript
import { useProfanityChecker } from 'glin-profanity';

function CommentForm() {
  const { result, checkText, isChecking } = useProfanityChecker({
    detectLeetspeak: true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const comment = e.target.elements.comment.value;
    
    checkText(comment);
    
    if (result?.containsProfanity) {
      alert('Please remove inappropriate language');
      return;
    }
    
    // Submit comment
    submitComment(comment);
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea name="comment" />
      {result?.containsProfanity && (
        <div className="error">
          Contains profanity: {result.profaneWords.join(', ')}
        </div>
      )}
      <button type="submit" disabled={isChecking}>
        Submit
      </button>
    </form>
  );
}
```

### Next.js API Route

```typescript
// app/api/moderate/route.ts
import { Filter } from 'glin-profanity';
import { NextResponse } from 'next/server';

const filter = new Filter({ detectLeetspeak: true });

export async function POST(request: Request) {
  const { text } = await request.json();
  
  const result = filter.checkProfanity(text);
  
  if (result.containsProfanity) {
    return NextResponse.json(
      { error: 'Contains inappropriate language' },
      { status: 400 }
    );
  }
  
  return NextResponse.json({ success: true });
}
```

### Express.js

```typescript
import express from 'express';
import { Filter } from 'glin-profanity';

const app = express();
const filter = new Filter({ detectLeetspeak: true });

app.use(express.json());

app.post('/api/comments', (req, res) => {
  const { text } = req.body;
  
  const result = filter.checkProfanity(text);
  
  if (result.containsProfanity) {
    return res.status(400).json({
      error: 'Comment contains inappropriate language',
      profaneWords: result.profaneWords
    });
  }
  
  // Save comment
  res.json({ success: true });
});

app.listen(3000);
```

---

## Common Configurations

### Strict (Family-Friendly)

```typescript
const filter = new Filter({
  detectLeetspeak: true,
  leetspeakLevel: 'aggressive',
  normalizeUnicode: true,
  partialMatching: true,
  severityThreshold: 0.3  // Flag even mild profanity
});
```

### Moderate (Recommended)

```typescript
const filter = new Filter({
  languages: ['english'],
  detectLeetspeak: true,
  leetspeakLevel: 'moderate',
  normalizeUnicode: true,
  cacheResults: true,
  cacheSize: 5000
});
```

### Lenient (Adult Community)

```typescript
const filter = new Filter({
  detectLeetspeak: true,
  leetspeakLevel: 'basic',
  excludeWords: ['damn', 'hell', 'ass'],
  severityThreshold: 0.8  // Only severe profanity
});
```

### Multi-Language

```typescript
const filter = new Filter({
  languages: ['english', 'spanish', 'french'],
  detectLeetspeak: true,
  normalizeUnicode: true
});
```

---

## Next Steps

### Learn More

- **[Configuration Guide](./configuration.md)** - All configuration options
- **[Quick Reference](./quick-reference.md)** - Cheat sheet
- **[Examples](../reference/examples.md)** - 50+ code examples
- **[API Reference](../reference/api-reference.md)** - Complete API docs

### Advanced Features

- **[Leetspeak Detection](../advanced-features.md)** - Detect f4ck, sh1t, @ss
- **[Unicode Normalization](../advanced-features.md)** - Detect homoglyphs
- **[ML Toxicity](../advanced/ml-guide.md)** - TensorFlow.js detection
- **[Semantic Analysis](../integrations/semantic.md)** - Embedding-based

### Production Deployment

- **[Testing](../production/testing.md)** - Unit, integration, E2E
- **[Security](../production/security.md)** - Best practices
- **[Deployment](../production/deployment.md)** - All platforms

---

## Troubleshooting

### Installation Issues

**Problem:** `npm install` fails

**Solution:**
```bash
# Clear cache
npm cache clean --force

# Try with different registry
npm install glin-profanity --registry=https://registry.npmjs.org/
```

### TypeScript Errors

**Problem:** Type errors in TypeScript

**Solution:**
```bash
# Install types
npm install --save-dev @types/node

# Check tsconfig.json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "esModuleInterop": true
  }
}
```

### False Positives

**Problem:** "Scunthorpe" is flagged

**Solution:**
```typescript
// This is already handled! glin-profanity has built-in Scunthorpe problem protection
const filter = new Filter();
filter.isProfane('Scunthorpe');  // false

// For custom exclusions:
const filter = new Filter({
  excludeWords: ['assassin', 'basement']
});
```

---

## Get Help

- **[FAQ](../reference/faq.md)** - Common questions
- **[Troubleshooting](../advanced/troubleshooting.md)** - Common issues
- **[GitHub Issues](https://github.com/GLINCKER/glin-profanity/issues)** - Report bugs
- **[Examples](../reference/examples.md)** - More code examples

---

**Congratulations!** You're now ready to detect profanity in your application. 🎉

For more advanced usage, check out the [Configuration Guide](./configuration.md) or browse the [Examples Library](../reference/examples.md).
