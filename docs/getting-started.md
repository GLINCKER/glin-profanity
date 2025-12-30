# Getting Started

Quick start guide for glin-profanity in JavaScript/TypeScript and Python.

## Installation

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
poetry add glin-profanity
```

---

## Basic Usage

### JavaScript/TypeScript

```javascript
const { checkProfanity } = require('glin-profanity');

const result = checkProfanity("This is a damn example", {
  languages: ['english'],
  replaceWith: '***'
});

console.log(result.containsProfanity); // true
console.log(result.profaneWords);      // ['damn']
console.log(result.processedText);     // "This is a *** example"
```

**TypeScript with full typing:**

```typescript
import { checkProfanity, ProfanityCheckerConfig } from 'glin-profanity';

const config: ProfanityCheckerConfig = {
  languages: ['english', 'spanish'],
  severityLevels: true,
  autoReplace: true,
  replaceWith: '***'
};

const result = checkProfanity("inappropriate text", config);
```

### Python

```python
from glin_profanity import Filter

filter_instance = Filter()

# Simple check
if filter_instance.is_profane("This is a damn example"):
    print("Profanity detected!")

# Detailed results
result = filter_instance.check_profanity("This is a damn example")
print(result["profane_words"])       # ['damn']
print(result["contains_profanity"])  # True
```

---

## Filter Class (Advanced)

For more control, use the `Filter` class directly:

### JavaScript

```typescript
import { Filter } from 'glin-profanity';

const filter = new Filter({
  languages: ['english', 'spanish'],
  detectLeetspeak: true,
  leetspeakLevel: 'moderate',
  normalizeUnicode: true,
  cacheResults: true
});

// Check text
filter.isProfane('f4ck');           // true
filter.checkProfanity('sh1t text'); // detailed result
```

### Python

```python
from glin_profanity import Filter

filter_instance = Filter({
    "languages": ["english", "spanish"],
    "case_sensitive": False,
    "replace_with": "***",
    "allow_obfuscated_match": True
})

result = filter_instance.check_profanity("bad content here")
```

---

## Next Steps

- [API Reference](./api-reference.md) - Full API documentation
- [Framework Examples](./framework-examples.md) - React, Vue, Angular, Express
- [Advanced Features](./advanced-features.md) - Leetspeak, Unicode, ML detection
- [ML Guide](./ML-GUIDE.md) - TensorFlow.js toxicity detection
