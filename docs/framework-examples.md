# Framework Examples

Integration examples for popular frameworks and environments.

## React

### Using the Hook

```tsx
import React, { useState } from 'react';
import { useProfanityChecker, SeverityLevel } from 'glin-profanity';

const ChatModerator = () => {
  const [message, setMessage] = useState('');

  const { result, checkText } = useProfanityChecker({
    languages: ['english', 'spanish'],
    severityLevels: true,
    autoReplace: true,
    replaceWith: '***',
    minSeverity: SeverityLevel.EXACT
  });

  const handleSubmit = () => {
    checkText(message);
    if (result && !result.containsProfanity) {
      sendMessage(message);
    } else {
      alert('Please keep your message clean!');
    }
  };

  return (
    <div>
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message..."
      />
      <button onClick={handleSubmit}>Send</button>

      {result?.containsProfanity && (
        <p className="error">
          Inappropriate content: {result.profaneWords.join(', ')}
        </p>
      )}
    </div>
  );
};
```

### Without Hook (Function Component)

```tsx
import { checkProfanity } from 'glin-profanity';

function CommentForm() {
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const result = checkProfanity(text, { languages: ['english'] });

    if (result.containsProfanity) {
      setError(`Remove: ${result.profaneWords.join(', ')}`);
      return;
    }

    submitComment(text);
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea value={text} onChange={e => setText(e.target.value)} />
      {error && <span className="error">{error}</span>}
      <button type="submit">Post</button>
    </form>
  );
}
```

---

## Vue 3

### Composition API

```vue
<template>
  <div>
    <input v-model="text" @input="checkContent" />
    <p v-if="hasProfanity" class="warning">
      Cleaned: {{ cleanedText }}
    </p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { checkProfanity } from 'glin-profanity';

const text = ref('');
const hasProfanity = ref(false);
const cleanedText = ref('');

const checkContent = () => {
  const result = checkProfanity(text.value, {
    languages: ['english'],
    autoReplace: true,
    replaceWith: '***'
  });

  hasProfanity.value = result.containsProfanity;
  cleanedText.value = result.autoReplaced;
};
</script>
```

### Options API

```vue
<script>
import { checkProfanity } from 'glin-profanity';

export default {
  data() {
    return {
      text: '',
      result: null
    };
  },
  methods: {
    validate() {
      this.result = checkProfanity(this.text, {
        languages: ['english', 'spanish']
      });
    }
  }
};
</script>
```

---

## Angular

### Component

```typescript
import { Component } from '@angular/core';
import { checkProfanity, ProfanityCheckResult } from 'glin-profanity';

@Component({
  selector: 'app-comment',
  template: `
    <textarea
      [(ngModel)]="comment"
      (ngModelChange)="validateComment()">
    </textarea>
    <div *ngIf="profanityResult?.containsProfanity" class="error">
      Please remove inappropriate language
    </div>
  `
})
export class CommentComponent {
  comment = '';
  profanityResult: ProfanityCheckResult | null = null;

  validateComment() {
    this.profanityResult = checkProfanity(this.comment, {
      languages: ['english', 'spanish'],
      severityLevels: true
    });
  }
}
```

### Service

```typescript
import { Injectable } from '@angular/core';
import { Filter } from 'glin-profanity';

@Injectable({ providedIn: 'root' })
export class ProfanityService {
  private filter = new Filter({
    languages: ['english'],
    detectLeetspeak: true,
    cacheResults: true
  });

  check(text: string) {
    return this.filter.checkProfanity(text);
  }

  isClean(text: string): boolean {
    return !this.filter.isProfane(text);
  }
}
```

---

## Express.js Middleware

```javascript
const express = require('express');
const { checkProfanity } = require('glin-profanity');

const profanityMiddleware = (req, res, next) => {
  const text = req.body.message || req.body.content || '';

  const result = checkProfanity(text, {
    languages: ['english'],
    autoReplace: true,
    replaceWith: '[censored]'
  });

  if (result.containsProfanity) {
    // Option 1: Replace and continue
    req.body.message = result.autoReplaced;
    req.profanityDetected = true;

    // Option 2: Reject request
    // return res.status(400).json({ error: 'Inappropriate content' });
  }

  next();
};

const app = express();
app.use(express.json());

app.post('/comment', profanityMiddleware, (req, res) => {
  res.json({
    message: req.body.message,
    wasCensored: req.profanityDetected || false
  });
});
```

---

## Next.js

### API Route

```typescript
// pages/api/moderate.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { checkProfanity } from 'glin-profanity';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body;
  const result = checkProfanity(text, {
    languages: ['english'],
    detectLeetspeak: true
  });

  res.json({
    clean: !result.containsProfanity,
    flaggedWords: result.profaneWords
  });
}
```

### Server Action (App Router)

```typescript
// app/actions.ts
'use server';

import { checkProfanity } from 'glin-profanity';

export async function moderateContent(text: string) {
  const result = checkProfanity(text, {
    languages: ['english'],
    autoReplace: true,
    replaceWith: '***'
  });

  return {
    isClean: !result.containsProfanity,
    cleanedText: result.autoReplaced,
    flaggedWords: result.profaneWords
  };
}
```

---

## See Also

- [Getting Started](./getting-started.md)
- [API Reference](./api-reference.md)
- [Advanced Features](./advanced-features.md)
