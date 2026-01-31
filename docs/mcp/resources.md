# MCP Resources Guide

All 23 documentation resources available via the glin-profanity MCP server.

## What are MCP Resources?

Resources provide AI assistants with **access to documentation** directly within their context. Instead of browsing docs, your AI can read and reference them instantly.

---

## Available Resources (23 Total)

### 📚 Core Documentation (7 resources)

| URI | Resource | Content |
|-----|----------|---------|
| `glin-profanity://docs/index` | Main documentation index | Complete overview |
| `glin-profanity://docs/getting-started` | Quick start guide | Installation & first steps |
| `glin-profanity://docs/installation` | Installation guide | All platforms |
| `glin-profanity://docs/configuration` | Configuration options | All settings explained |
| `glin-profanity://docs/api-reference` | API reference | Complete API docs |
| `glin-profanity://docs/faq` | FAQ | Common questions |
| `glin-profanity://docs/examples` | Code examples | 50+ examples |

### 🤖 AI Integrations (6 resources)

| URI | Resource | Content |
|-----|----------|---------|
| `glin-profanity://docs/integrations/overview` | Integration overview | All frameworks |
| `glin-profanity://docs/integrations/openai` | OpenAI integration | Function calling |
| `glin-profanity://docs/integrations/langchain` | LangChain integration | Agents & chains |
| `glin-profanity://docs/integrations/vercel` | Vercel AI SDK | Next.js, streaming |
| `glin-profanity://docs/integrations/semantic` | Semantic analysis | ML toxicity detection |
| `glin-profanity://docs/integrations/openclaw` | OpenClaw integration | Multi-platform agents |

### 🏭 Production Guides (4 resources)

| URI | Resource | Content |
|-----|----------|---------|
| `glin-profanity://docs/testing` | Testing guide | Unit, integration, E2E |
| `glin-profanity://docs/deployment` | Deployment guide | All platforms |
| `glin-profanity://docs/security` | Security guide | Best practices |
| `glin-profanity://docs/mcp-guide` | MCP guide | This guide! |

### 📖 Reference (5 resources)

| URI | Resource | Content |
|-----|----------|---------|
| `glin-profanity://languages` | Supported languages | All 24 languages |
| `glin-profanity://config-examples` | Config examples | Common configurations |
| `glin-profanity://severity-levels` | Severity levels | 0.0-1.0 scale |
| `glin-profanity://domain-whitelists` | Domain whitelists | Medical, gaming, etc. |
| `glin-profanity://detection-guide` | Detection methods | How detection works |

### ✨ Features (1 resource)

| URI | Resource | Content |
|-----|----------|---------|
| `glin-profanity://docs/features` | Features overview | All capabilities |

---

## How to Use Resources

### In Claude Desktop

Ask Claude to access documentation:

```
"Can you read the quick start guide?"
→ Claude accesses glin-profanity://docs/getting-started

"Show me configuration examples"
→ Claude accesses glin-profanity://config-examples

"What languages are supported?"
→ Claude accesses glin-profanity://languages
```

### In Cursor

```
"Read the API reference and help me implement profanity checking"
→ Cursor accesses glin-profanity://docs/api-reference

"Check the deployment guide for serverless setup"
→ Cursor accesses glin-profanity://docs/deployment
```

### In Windsurf

```
"Review the testing guide and write tests for my profanity filter"
→ Windsurf accesses glin-profanity://docs/testing
```

---

## Resource Details

### 1. Getting Started (`docs/getting-started`)

**Contains:**
- Installation instructions
- Quick start examples
- Basic usage
- First steps

**Use when:**
- New to glin-profanity
- Need quick setup
- Want basic examples

---

### 2. Configuration (`docs/configuration`)

**Contains:**
- All config options
- Default values
- Best practices
- Environment variables

**Use when:**
- Customizing behavior
- Enabling features
- Optimizing performance

---

### 3. API Reference (`docs/api-reference`)

**Contains:**
- Complete API documentation
- All methods & properties
- TypeScript types
- Parameter descriptions

**Use when:**
- Need detailed API info
- Implementing features
- Type checking

---

### 4. Examples (`docs/examples`)

**Contains:**
- 50+ working code examples
- Real-world scenarios
- Framework integrations
- Complete with imports

**Use when:**
- Need code examples
- Learning patterns
- Quick copy-paste

---

### 5. Supported Languages (`languages`)

**Contains:**
```json
{
  "languages": [
    "arabic", "chinese", "czech", "danish", "dutch",
    "english", "esperanto", "finnish", "french", "german",
    "hindi", "hungarian", "italian", "japanese", "korean",
    "norwegian", "persian", "polish", "portuguese", "russian",
    "spanish", "swedish", "thai", "turkish"
  ],
  "count": 24
}
```

---

### 6. Config Examples (`config-examples`)

**Contains:**

```typescript
// Strict (family-friendly)
{
  detectLeetspeak: true,
  leetspeakLevel: 'aggressive',
  normalizeUnicode: true,
  severityThreshold: 0.3
}

// Moderate (recommended)
{
  detectLeetspeak: true,
  leetspeakLevel: 'moderate',
  languages: ['english'],
  cacheResults: true
}

// Lenient (adult community)
{
  detectLeetspeak: true,
  leetspeakLevel: 'basic',
  excludeWords: ['damn', 'hell'],
  severityThreshold: 0.8
}
```

---

### 7. Severity Levels (`severity-levels`)

**Contains:**

| Score | Level | Description | Examples |
|-------|-------|-------------|----------|
| 0.9-1.0 | Extremely Offensive | Severe slurs | racial slurs, hate speech |
| 0.7-0.9 | Highly Offensive | Strong profanity | f***, c*** |
| 0.5-0.7 | Moderately Offensive | Common profanity | shit, bitch |
| 0.3-0.5 | Mildly Offensive | Mild words | damn, hell, ass |
| 0.0-0.3 | Questionable | Context-dependent | crap, sucks |

---

### 8. Domain Whitelists (`domain-whitelists`)

**Contains:**

```typescript
// Medical domain
['breast', 'anal', 'rectal', 'vaginal', 'penis', 'testicle']

// Gaming domain
['kill', 'killed', 'shot', 'headshot', 'pwn', 'noob']

// Technical domain
['abort', 'kill', 'execute', 'terminate', 'dump']

// Literary/Educational
['hell', 'damn'] // Allowed in classics
```

---

## Accessing Multiple Resources

AI assistants can access multiple resources in one request:

```
"Compare the OpenAI and LangChain integrations"
→ Accesses both:
  - glin-profanity://docs/integrations/openai
  - glin-profanity://docs/integrations/langchain

"Help me deploy with security best practices"
→ Accesses both:
  - glin-profanity://docs/deployment
  - glin-profanity://docs/security
```

---

## Resource Benefits

### For AI Assistants

✅ **Instant context** - No need to search docs  
✅ **Always up-to-date** - Resources reflect current version  
✅ **Complete information** - Full docs available  
✅ **Structured data** - Easy to parse and understand

### For You

✅ **Better responses** - AI has full docs context  
✅ **Accurate code** - Examples from official docs  
✅ **Faster development** - No manual doc lookup  
✅ **Consistent guidance** - Same info across tools

---

## Resource Performance

All resources are:
- ⚡ **Instant access** - < 1ms retrieval
- 💾 **Cached** - No repeated downloads
- 📦 **Compact** - Optimized for AI consumption
- 🔄 **Always fresh** - Auto-updated

---

## Next Steps

- [MCP Setup](./setup.md) - Install MCP server
- [MCP Tools](./tools.md) - All 19 tools
- [MCP Examples](./examples.md) - Usage examples
- [MCP Overview](./overview.md) - Complete guide

---

**Your AI assistant now has instant access to complete glin-profanity documentation!** 📚✨
