# Examples Library

Comprehensive collection of real-world code examples for glin-profanity.

## Table of Contents

- [Basic Usage](#basic-usage)
- [Configuration Examples](#configuration-examples)
- [React Examples](#react-examples)
- [Next.js Examples](#nextjs-examples)
- [API Endpoints](#api-endpoints)
- [AI Integration Examples](#ai-integration-examples)
- [Batch Processing](#batch-processing)
- [Real-World Use Cases](#real-world-use-cases)

---

## Basic Usage

### Simple Profanity Check

```typescript
import { checkProfanity } from 'glin-profanity';

const result = checkProfanity('This is a test message');console.log(result);
// {
//   containsProfanity: false,
//   profaneWords: [],
//   wordCount: 5
// }
```

### Using Filter Class

```typescript
import { Filter } from 'glin-profanity';

const filter = new Filter({
  languages: ['english'],
  detectLeetspeak: true
});

const profane = filter.checkProfanity('f4ck this sh1t');
console.log(profane.containsProfanity); // true
console.log(profane.profaneWords); // ['fuck', 'shit']
```

### Boolean Check

```typescript
import { Filter } from 'glin-profanity';

const filter = new Filter();

if (filter.isProfane('damn it')) {
  console.log('Contains profanity!');
}
```

### Text Censorship

```typescript
const filter = new Filter();

const result = filter.censorText('What the fuck is this shit?');
console.log(result.processedText);
// "What the **** is this ****?"
```

---

## Configuration Examples

### Strict Mode (Family-Friendly)

```typescript
const strict = new Filter({
  detectLeetspeak: true,
  leetspeakLevel: 'aggressive',
  normalizeUnicode: true,
  partialMatching: true,
  cacheResults: true
});
```

### Moderate Mode (Recommended)

```typescript
const moderate = new Filter({
  languages: ['english'],
  detectLeetspeak: true,
  leetspeakLevel: 'moderate',
  normalizeUnicode: true,
  cacheResults: true
});
```

### Lenient Mode (Obvious Only)

```typescript
const lenient = new Filter({
  languages: ['english'],
  detectLeetspeak: false,
  partialMatching: false,
  cacheResults: true
});
```

### Medical/Healthcare Context

```typescript
const medical = new Filter({
  languages: ['english'],
  excludeWords: [
    'breast', 'anal', 'rectal', 
    'penis', 'vaginal', 'sex'
  ]
});
```

### Gaming Platform

```typescript
const gaming = new Filter({
  languages: ['english'],
  detectLeetspeak: true,
  excludeWords: [
    'kill', 'shot', 'headshot',
    'noob', 'pwn', 'owned'
  ]
});
```

### Multi-Language Support

```typescript
const international = new Filter({
  languages: ['english', 'spanish', 'french', 'german'],
  detectLeetspeak: true,
  normalizeUnicode: true
});
```

---

## React Examples

### Basic Hook Usage

```typescript
'use client';
import { useProfanityChecker } from 'glin-profanity';
import { useState } from 'react';

export function ChatInput() {
  const [input, setInput] = useState('');
  const { result, checkText } = useProfanityChecker({
    detectLeetspeak: true
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);
    checkText(value);
  };

  return (
    <div>
      <input
        value={input}
        onChange={handleChange}
        placeholder="Type your message..."
      />
      {result?.containsProfanity && (
        <p className="error">Please use appropriate language</p>
      )}
    </div>
  );
}
```

### Comment Moderation Component

```typescript
import { Filter } from 'glin-profanity';
import { useState } from 'react';

const filter = new Filter({detectLeetspeak: true });

export function CommentForm() {
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = filter.checkProfanity(comment);

    if (result.containsProfanity) {
      setError(`Inappropriate language detected: ${result.profaneWords.join(', ')}`);
      return;
    }

    // Submit comment
    await submitComment(comment);
    setComment('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Write a comment..."
      />
      {error && <p className="error">{error}</p>}
      <button type="submit">Post Comment</button>
    </form>
  );
}
```

### Real-Time Validation

```typescript
import { Filter } from 'glin-profanity';
import { useState, useEffect } from 'react';
import { debounce } from 'lodash';

const filter = new Filter({ detectLeetspeak: true });

export function LiveModerator() {
  const [text, setText] = useState('');
  const [status, setStatus] = useState<'safe' | 'warning' | null>(null);

  const checkContent = debounce((value: string) => {
    if (!value) {
      setStatus(null);
      return;
    }

    const result = filter.checkProfanity(value);
    setStatus(result.containsProfanity ? 'warning' : 'safe');
  }, 300);

  useEffect(() => {
    checkContent(text);
  }, [text]);

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className={status === 'warning' ? 'error' : ''}
      />
      {status === 'safe' && <span className="check">✓ Safe</span>}
      {status === 'warning' && <span className="cross">✗ Inappropriate</span>}
    </div>
  );
}
```

---

## Next.js Examples

### API Route (App Router)

```typescript
// app/api/moderate/route.ts
import { Filter } from 'glin-profanity';
import { NextRequest, NextResponse } from 'next/server';

const filter = new Filter({
  languages: ['english'],
  detectLeetspeak: true,
  cacheResults: true
});

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text required' },
        { status: 400 }
      );
    }

    const result = filter.checkProfanity(text);

    return NextResponse.json({
      approved: !result.containsProfanity,
      profaneWords: result.profaneWords,
      wordCount: result.wordCount
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Server Action

```typescript
// app/actions/moderate.ts
'use server';

import { Filter } from 'glin-profanity';

const filter = new Filter({ detectLeetspeak: true });

export async function moderateText(text: string) {
  const result = filter.checkProfanity(text);

  if (result.containsProfanity) {
    return {
      success: false,
      message: 'Inappropriate language detected',
      words: result.profaneWords
    };
  }

  return { success: true, message: 'Content approved' };
}
```

### Middleware

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Filter } from 'glin-profanity';

const filter = new Filter({ detectLeetspeak: true });

export function middleware(request: NextRequest) {
  // Check URL parameters for profanity
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (query) {
    const result = filter.checkProfanity(query);
    
    if (result.containsProfanity) {
      return NextResponse.json(
        { error: 'Inappropriate search query' },
        { status: 400 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/search/:path*'
};
```

### Edge Function

```typescript
// app/api/moderate-edge/route.ts
import { Filter } from 'glin-profanity';

export const runtime = 'edge';

const filter = new Filter({
  languages: ['english'],
  detectLeetspeak: true
});

export async function POST(request: Request) {
  const { text } = await request.json();

  const result = filter.checkProfanity(text);

  return Response.json({
    approved: !result.containsProfanity,
    profaneWords: result.profaneWords
  });
}
```

---

## API Endpoints

### Express.js Endpoint

```typescript
import express from 'express';
import { Filter } from 'glin-profanity';

const app = express();
const filter = new Filter({ detectLeetspeak: true });

app.use(express.json());

app.post('/api/moderate', (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text required' });
  }

  const result = filter.checkProfanity(text);

  res.json({
    approved: !result.containsProfanity,
    profaneWords: result.profaneWords
  });
});

app.listen(3000);
```

### Fastify Endpoint

```typescript
import Fastify from 'fastify';
import { Filter } from 'glin-profanity';

const fastify = Fastify();
const filter = new Filter({ detectLeetspeak: true });

fastify.post('/api/moderate', async (request, reply) => {
  const { text } = request.body as { text: string };

  if (!text) {
    return reply.code(400).send({ error: 'Text required' });
  }

  const result = filter.checkProfanity(text);

  return {
    approved: !result.containsProfanity,
    profaneWords: result.profaneWords
  };
});

fastify.listen({ port: 3000 });
```

### Hono Endpoint

```typescript
import { Hono } from 'hono';
import { Filter } from 'glin-profanity';

const app = new Hono();
const filter = new Filter({ detectLeetspeak: true });

app.post('/api/moderate', async (c) => {
  const { text } = await c.req.json();

  if (!text) {
    return c.json({ error: 'Text required' }, 400);
  }

  const result = filter.checkProfanity(text);

  return c.json({
    approved: !result.containsProfanity,
    profaneWords: result.profaneWords
  });
});

export default app;
```

---

## AI Integration Examples

### OpenAI Function Calling

```typescript
import OpenAI from 'openai';
import { profanityTools, executeProfanityTool } from 'glin-profanity/ai/openai';

const client = new OpenAI();

async function moderateWithAI(userMessage: string) {
  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are a content moderator. Check messages for profanity.'
      },
      {
        role: 'user',
        content: `Check this message: "${userMessage}"`
      }
    ],
    tools: profanityTools
  });

  const toolCalls = response.choices[0].message.tool_calls || [];

  for (const toolCall of toolCalls) {
    const result = await executeProfanityTool(
      toolCall.function.name,
      JSON.parse(toolCall.function.arguments)
    );
    console.log('Moderation result:', result);
  }
}
```

### LangChain Agent

```typescript
import { ChatOpenAI } from '@langchain/openai';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { allProfanityTools } from 'glin-profanity/ai/langchain';

const model = new ChatOpenAI({ modelName: 'gpt-4o' });

const agent = createReactAgent({
  llm: model,
  tools: allProfanityTools
});

const result = await agent.invoke({
  messages: [{
    role: 'user',
    content: 'Check if "damn it" contains profanity'
  }]
});

console.log(result);
```

### Vercel AI SDK

```typescript
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { profanityTools } from 'glin-profanity/ai/vercel';

const result = await generateText({
  model: openai('gpt-4o'),
  prompt: 'Check if "hello world" contains profanity',
  tools: profanityTools
});

console.log(result.text);
console.log(result.toolResults);
```

---

## Batch Processing

### Check Multiple Messages

```typescript
import { Filter } from 'glin-profanity';

const filter = new Filter({ detectLeetspeak: true });

const messages = [
  'Hello world',
  'This is fucking bad',
  'Nice to meet you',
  'What the hell'
];

const results = messages.map(msg => filter.checkProfanity(msg));

const flagged = results.filter(r => r.containsProfanity);
console.log(`Flagged ${flagged.length} out of ${messages.length} messages`);
```

### Parallel Processing

```typescript
import { Filter } from 'glin-profanity';
import pLimit from 'p-limit';

const filter = new Filter({ detectLeetspeak: true });
const limit = pLimit(10); // Process 10 at a time

async function processBatch(messages: string[]) {
  const promises = messages.map(msg =>
    limit(async () => {
      return {
        text: msg,
        result: filter.checkProfanity(msg)
      };
    })
  );

  const results = await Promise.all(promises);
  return results;
}

const messages = [...]; // 1000 messages
const results = await processBatch(messages);
```

### Stream Processing

```typescript
import { Filter } from 'glin-profanity';
import { Readable } from 'stream';

const filter = new Filter({ detectLeetspeak: true });

async function* moderateStream(messages: AsyncIterable<string>) {
  for await (const message of messages) {
    const result = filter.checkProfanity(message);
    yield {
      message,
      approved: !result.containsProfanity,
      profaneWords: result.profaneWords
    };
  }
}

// Usage
const messageStream = Readable.from(messages);
for await (const result of moderateStream(messageStream)) {
  console.log(result);
}
```

---

## Real-World Use Cases

### Chat Application

```typescript
import { Filter } from 'glin-profanity';
import { io } from 'socket.io-client';

const filter = new Filter({
  detectLeetspeak: true,
  cacheResults: true
});

const socket = io('http://localhost:3000');

function sendMessage(text: string) {
  // Check before sending
  const result = filter.checkProfanity(text);

  if (result.containsProfanity) {
    alert(`Please remove: ${result.profaneWords.join(', ')}`);
    return;
  }

  socket.emit('chat:message', { text });
}

socket.on('chat:message', (data) => {
  // Double-check on receive
  const result = filter.checkProfanity(data.text);

  if (!result.containsProfanity) {
    displayMessage(data);
  }
});
```

### Comment System

```typescript
import { Filter } from 'glin-profanity';

const filter = new Filter({
  languages: ['english'],
  detectLeetspeak: true,
  excludeWords: ['damn', 'hell'] // Allow mild language
});

async function submitComment(userId: string, text: string) {
  const result = filter.checkProfanity(text);

  if (result.containsProfanity) {
    // Log violation
    await logViolation(userId, result.profaneWords);

    throw new Error('Comment contains inappropriate language');
  }

  // Save comment
  await db.comments.create({
    userId,
    text,
    approved: true,
    timestamp: new Date()
  });
}
```

### Search Query Filtering

```typescript
import { Filter } from 'glin-profanity';

const filter = new Filter({ detectLeetspeak: true });

function sanitizeSearch Query(query: string): string {
  const result = filter.checkProfanity(query);

  if (result.containsProfanity) {
    // Censor profane words in search query
    const censored = filter.censorText(query);
    return censored.processedText;
  }

  return query;
}

const userQuery = 'how to fix this fucking bug';
const safeQuery = sanitizeSearchQuery(userQuery);
// "how to fix this **** bug"
```

### User-Generated Content Review

```typescript
import { Filter } from 'glin-profanity';

const filter = new Filter({ detectLeetspeak: true });

interface Post {
  title: string;
  body: string;
  tags: string[];
}

function reviewPost(post: Post) {
  const parts = [
    post.title,
    post.body,
    ...post.tags
  ];

  const violations: string[] = [];

  for (const part of parts) {
    const result = filter.checkProfanity(part);

    if (result.containsProfanity) {
      violations.push(...result.profaneWords);
    }
  }

  return {
    approved: violations.length === 0,
    violations: [...new Set(violations)]
  };
}
```

---

## Advanced Examples

### Custom Dictionary

```typescript
import { Filter } from 'glin-profanity';

const customWords = new Map([
  ['badword1', 1.0],
  ['badword2', 0.8],
  ['spam', 0.5]
]);

const filter = new Filter({
  languages: ['english'],
  customDictionary: customWords
});

const result = filter.checkProfanity('This is badword1');
console.log(result.containsProfanity); // true
```

### Severity-Based Moderation

```typescript
import { Filter } from 'glin-profanity';

const filter = new Filter({
  detectLeetspeak: true,
  severityLevels: true
});

function moderateWithSeverity(text: string) {
  const result = filter.checkProfanity(text);

  if (!result.containsProfanity) {
    return { action: 'approve' };
  }

  const maxSeverity = Math.max(...Object.values(result.severityMap || {}));

  if (maxSeverity >= 1.0) {
    return { action: 'block', reason: 'severe profanity' };
  } else if (maxSeverity >= 0.5) {
    return { action: 'review', reason: 'moderate profanity' };
  } else {
    return { action: 'warn', reason: 'mild profanity' };
  }
}
```

---

## Python Examples

### Basic Usage

```python
from glin_profanity import Filter

filter = Filter({"detect_leetspeak": True})

result = filter.check_profanity("This is a test")
print(result)
# {
#   "contains_profanity": False,
#   "profane_words": [],
#   "word_count": 4
# }
```

### Flask API

```python
from flask import Flask, request, jsonify
from glin_profanity import Filter

app = Flask(__name__)
filter = Filter({"detect_leetspeak": True})

@app.route('/api/moderate', methods=['POST'])
def moderate():
    data = request.get_json()
    text = data.get('text')

    if not text:
        return jsonify({"error": "Text required"}), 400

    result = filter.check_profanity(text)

    return jsonify({
        "approved": not result["contains_profanity"],
        "profane_words": result["profane_words"]
    })

if __name__ == '__main__':
    app.run(debug=False)
```

---

**More examples coming soon!**

For additional examples, see:
- [Framework Examples](./framework-examples.md)
- [AI Integrations](./integrations/)
- [GitHub Examples Directory](https://github.com/GLINCKER/glin-profanity/tree/main/examples)
