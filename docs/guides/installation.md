# Installation Guide

Complete installation instructions for glin-profanity across different platforms and package managers.

## Table of Contents

- [JavaScript/TypeScript](#javascripttypescript)
- [Python](#python)
- [React](#react)
- [Next.js](#nextjs)
- [CDN (Browser)](#cdn-browser)
- [MCP Server](#mcp-server)
- [System Requirements](#system-requirements)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)

---

## JavaScript/TypeScript

### NPM

```bash
npm install glin-profanity
```

### Yarn

```bash
yarn add glin-profanity
```

### PNPM

```bash
pnpm add glin-profanity
```

### Bun

```bash
bun add glin-profanity
```

### Import Styles

**ES Modules (Recommended)**
```typescript
import { Filter, checkProfanity } from 'glin-profanity';
```

**CommonJS**
```javascript
const { Filter, checkProfanity } = require('glin-profanity');
```

**TypeScript**
```typescript
import type { FilterConfig, CheckProfanityResult } from 'glin-profanity';
import { Filter } from 'glin-profanity';

const config: FilterConfig = {
  languages: ['english'],
  detectLeetspeak: true
};
```

---

## Python

### PyPI

```bash
pip install glin-profanity
```

### Poetry

```bash
poetry add glin-profanity
```

### Conda

```bash
conda install -c conda-forge glin-profanity
```

### Virtual Environment (Recommended)

```bash
# Create virtual environment
python -m venv venv

# Activate (macOS/Linux)
source venv/bin/activate

# Activate (Windows)
venv\Scripts\activate

# Install
pip install glin-profanity
```

### Import

```python
from glin_profanity import Filter, check_profanity

# Create filter
filter = Filter({"languages": ["english"], "detect_leetspeak": True})

# Use
result = filter.check_profanity("test text")
```

---

## React

### Create React App

```bash
npx create-react-app my-app
cd my-app
npm install glin-profanity
```

**Usage:**
```tsx
import { useProfanityChecker } from 'glin-profanity';

function MyComponent() {
  const { result, checkText, reset } = useProfanityChecker({
    detectLeetspeak: true,
    languages: ['english']
  });

  return (
    <input onChange={(e) => checkText(e.target.value)} />
  );
}
```

### Vite

```bash
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install glin-profanity
```

---

## Next.js

### App Router (Next.js 13+)

```bash
npx create-next-app@latest my-app
cd my-app
npm install glin-profanity
```

**Server Component:**
```typescript
// app/page.tsx
import { Filter } from 'glin-profanity';

export default async function Page() {
  const filter = new Filter();
  // Use on server
}
```

**Client Component:**
```typescript
'use client';

import { useProfanityChecker } from 'glin-profanity';

export default function ClientComponent() {
  const { result, checkText } = useProfanityChecker();
  // Use in client
}
```

**API Route:**
```typescript
// app/api/moderate/route.ts
import { checkProfanity } from 'glin-profanity';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const {text } = await request.json();
  const result = checkProfanity(text);
  return NextResponse.json(result);
}
```

### Pages Router (Next.js 12 and earlier)

```typescript
// pages/api/moderate.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { checkProfanity } from 'glin-profanity';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const result = checkProfanity(req.body.text);
  res.status(200).json(result);
}
```

---

## CDN (Browser)

### jsDelivr

```html
<!-- Latest version -->
<script src="https://cdn.jsdelivr.net/npm/glin-profanity@latest/dist/index.umd.js"></script>

<script>
  const { Filter } = GlinProfanity;
  const filter = new Filter();
  console.log(filter.isProfane('test'));
</script>
```

### unpkg

```html
<script src="https://unpkg.com/glin-profanity@latest/dist/index.umd.js"></script>
```

### Specific Version (Recommended for Production)

```html
<script src="https://cdn.jsdelivr.net/npm/glin-profanity@3.0.0/dist/index.umd.js"></script>
```

### ES Module (Modern Browsers)

```html
<script type="module">
  import { Filter } from 'https://esm.sh/glin-profanity@latest';
  
  const filter = new Filter();
  console.log(filter.isProfane('test'));
</script>
```

---

## MCP Server

### Claude Desktop

**Installation:**
```bash
npx -y glin-profanity-mcp --install-claude
```

**Manual Configuration:**

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "glin-profanity": {
      "command": "npx",
      "args": ["-y", "glin-profanity-mcp"]
    }
  }
}
```

### Cursor

Edit `.cursor/mcp.json` in your project root:

```json
{
  "mcpServers": {
    "glin-profanity": {
      "command": "npx",
      "args": ["-y", "glin-profanity-mcp"]
    }
  }
}
```

### Windsurf

Edit `.windsurf/settings.json`:

```json
{
  "mcp": {
    "servers": {
      "glin-profanity": {
        "command": "npx",
        "args": ["-y", "glin-profanity-mcp"]
      }
    }
  }
}
```

---

## System Requirements

### JavaScript/TypeScript

- **Node.js**: >= 16.0.0 (recommended: >= 18.0.0)
- **npm**: >= 7.0.0
- **TypeScript**: >= 4.5.0 (optional, for TypeScript projects)

**Browser Support:**
- Chrome/Edge: >= 90
- Firefox: >= 88
- Safari: >= 14
- Opera: >= 76

### Python

- **Python**: >= 3.8 (recommended: >= 3.10)
- **pip**: >= 21.0

**Operating Systems:**
- Linux (Ubuntu 20.04+, Debian 11+, CentOS 8+)
- macOS (>= 11.0 Big Sur)
- Windows (>= 10)

### Optional Dependencies

**For ML Features (JavaScript):**
```bash
npm install @tensorflow/tfjs @tensorflow/tfjs-node
```

**For ML Features (Python):**
```bash
pip install tensorflow numpy
```

---

## Verification

### JavaScript

```javascript
const { Filter, version } = require('glin-profanity');

console.log('Glin Profanity version:', version);

const filter = new Filter();
const result = filter.checkProfanity('test');
console.log('Installation successful:', result !== null);
```

### Python

```python
import glin_profanity

print("Glin Profanity version:", glin_profanity.__version__)

filter = glin_profanity.Filter()
result = filter.check_profanity("test")
print("Installation successful:", result is not None)
```

### CLI Test

```bash
# JavaScript
npx glin-profanity check "hello world"

# Python
python -m glin_profanity check "hello world"
```

---

## Troubleshooting

### Issue: `Cannot find module 'glin-profanity'`

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Issue: `ModuleNotFoundError: No module named 'glin_profanity'` (Python)

**Solution:**
```bash
# Upgrade pip
python -m pip install --upgrade pip

# Reinstall
pip install --force-reinstall glin-profanity
```

### Issue: TypeScript type errors

**Solution:**
```bash
# Ensure @types are installed
npm install --save-dev @types/node

# Update tsconfig.json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "esModuleInterop": true
  }
}
```

### Issue: Build errors in webpack/vite

**Solution:**

For Webpack:
```javascript
// webpack.config.js
module.exports = {
  resolve: {
    fallback: {
      "fs": false,
      "path": false
    }
  }
};
```

For Vite:
```javascript
// vite.config.js
export default {
  optimizeDeps: {
    include: ['glin-profanity']
  }
};
```

### Issue: MCP server not appearing in Claude

**Solution:**
1. Restart Claude Desktop completely
2. Check config file location is correct
3. Verify JSON syntax is valid
4. Check logs: `~/Library/Logs/Claude/mcp.log` (macOS)

### Issue: Performance issues

**Solution:**
```javascript
// Enable result caching
const filter = new Filter({
  cacheResults: true,
  cacheSize: 1000  // LRU cache size
});
```

---

## Next Steps

After installation, check out:

- [Getting Started](./getting-started.md) - Basic usage guide
- [API Reference](./api-reference.md) - Complete API documentation
- [Configuration](./configuration.md) - All configuration options
- [AI Integrations](./integrations/index.md) - OpenAI, LangChain, Vercel AI SDK

---

**Need help?** Open an issue on [GitHub](https://github.com/GLINCKER/glin-profanity/issues) or check our [FAQ](./faq.md).
