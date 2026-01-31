---
title: "MCP Setup Guide - glin-profanity for Claude, Cursor & Windsurf"
description: "Step-by-step guide to setup glin-profanity MCP server with Claude Desktop, Cursor, and Windsurf AI assistants for profanity detection"
keywords:
  - MCP server
  - Model Context Protocol
  - Claude Desktop setup
  - Cursor MCP
  - Windsurf MCP
  - AI assistant integration
  - profanity detection MCP
  - Claude tools
  - MCP configuration
  - AI content moderation
category: mcp
type: setup-guide
difficulty: beginner
time_to_complete: "10-15 minutes"
audience:
  - ai-users
  - claude-users
  - cursor-users
  - windsurf-users
  - developers
platforms:
  - macOS
  - Windows
  - Linux
ai_assistants:
  - Claude Desktop
  - Cursor
  - Windsurf
mcp_tools: 19
mcp_resources: 23
prerequisites:
  - Node.js 18+
  - Claude Desktop / Cursor / Windsurf installed
related_docs:
  - tools.md
  - resources.md
  - overview.md
seo_optimized: true
ai_friendly: true
updated: "2026-01-31"
---

# MCP Setup Guide


Complete guide for setting up the glin-profanity MCP (Model Context Protocol) server with Claude, Cursor, and Windsurf.

## Table of Contents

- [What is MCP?](#what-is-mcp)
- [Installation](#installation)
- [Claude Desktop Setup](#claude-desktop-setup)
- [Cursor Setup](#cursor-setup)
- [Windsurf Setup](#windsurf-setup)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)

---

## What is MCP?

The **Model Context Protocol (MCP)** allows AI assistants like Claude, Cursor, and Windsurf to access external tools and resources. The glin-profanity MCP server provides:

- **19 profanity detection tools** for AI assistants to use
- **23 documentation resources** for context and learning
- **5 guided prompts** for common workflows

---

## Installation

### Prerequisites

- Node.js 18+ installed
- Claude Desktop, Cursor, or Windsurf installed

### Quick Install

The MCP server is bundled with `glin-profanity`:

```bash
npm install -g glin-profanity
```

Or run directly with npx (no installation needed):

```bash
npx -y glin-profanity-mcp
```

---

## Claude Desktop Setup

### 1. Locate Configuration File

**macOS:**
```bash
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Windows:**
```bash
%APPDATA%\Claude\claude_desktop_config.json
```

**Linux:**
```bash
~/.config/Claude/claude_desktop_config.json
```

### 2. Add MCP Server

Edit `claude_desktop_config.json`:

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

### 3. Restart Claude Desktop

Close and reopen Claude Desktop completely.

### 4. Verify

In Claude, you should see:
- 🔧 Tools panel showing 19 profanity detection tools
- 📚 Resources showing 23 documentation resources

**Test it:**
```
Check this text for profanity: "what the hell"
```

Claude will use the `check_profanity` tool and respond with results!

---

## Cursor Setup

### 1. Open Settings

1. Open Cursor
2. Go to **Settings** → **MCP Servers**
3. Click **Add MCP Server**

### 2. Configure Server

**Name:** `glin-profanity`

**Command:**
```bash
npx -y glin-profanity-mcp
```

**Or with local installation:**
```bash
node_modules/.bin/glin-profanity-mcp
```

### 3. Save and Restart

1. Save configuration
2. Restart Cursor
3. Look for MCP indicator in bottom status bar

### 4. Verify

In Cursor chat, ask:
```
Can you check if "damn it" contains profanity?
```

Cursor will invoke the MCP tool and show results!

---

## Windsurf Setup

### 1. Configuration File

Create or edit `.windsurf/mcp.json` in your project:

```json
{
  "servers": {
    "glin-profanity": {
      "command": "npx",
      "args": ["-y", "glin-profanity-mcp"]
    }
  }
}
```

### 2. Alternative: Global Config

**macOS/Linux:**
```bash
~/.windsurf/mcp.json
```

**Windows:**
```bash
%USERPROFILE%\.windsurf\mcp.json
```

### 3. Restart Windsurf

Completely close and reopen Windsurf.

### 4. Verify

In Windsurf chat:
```
Use the profanity checker to analyze: "this is shit"
```

Windsurf will use the MCP server!

---

## Verification

### Test Commands

Try these in your AI assistant:

**1. Basic Check:**
```
Check this text for profanity: "fuck this"
```

**2. Multi-Language:**
```
Check if "merde" is profanity in French
```

**3. Batch Check:**
```
Check these messages for profanity:
1. "hello world"
2. "damn it"
3. "this is great"
```

**4. Get Supported Languages:**
```
What languages does the profanity filter support?
```

**5. Access Documentation:**
```
Show me the quick reference guide for glin-profanity
```

### Expected Response

Your AI assistant should:
- ✅ Invoke the appropriate MCP tool
- ✅ Return profanity detection results
- ✅ Access documentation resources
- ✅ Provide detailed explanations

---

## Troubleshooting

### Server Not Appearing

**Problem:** MCP server doesn't show up

**Solution:**

1. **Check configuration file location:**
   ```bash
   # macOS Claude
   cat ~/Library/Application\ Support/Claude/claude_desktop_config.json
   
   # Verify npx works
   npx -y glin-profanity-mcp --version
   ```

2. **Verify JSON syntax:**
   ```bash
   # Use a JSON validator
   cat claude_desktop_config.json | jq
   ```

3. **Check logs:**
   - **Claude:** Check Developer Tools (Cmd+Option+I on macOS)
   - **Cursor:** View → Output → MCP Logs
   - **Windsurf:** Similar to Cursor

### Tools Not Working

**Problem:** Server loads but tools don't work

**Solution:**

```bash
# Test MCP server directly
npx -y glin-profanity-mcp

# Should output server info and available tools
```

### Slow Performance

**Problem:** MCP calls are slow

**Solution:**

Use local installation instead of npx:

```bash
# Install globally
npm install -g glin-profanity-mcp

# Update config to use direct path
{
  "mcpServers": {
    "glin-profanity": {
      "command": "/usr/local/bin/glin-profanity-mcp"
    }
  }
}
```

### Permission Errors

**Problem:** Permission denied when starting server

**Solution:**

```bash
# Make sure Node.js is accessible
which node

# Fix npm permissions
sudo chown -R $USER /usr/local/lib/node_modules
```

---

## Advanced Configuration

### Custom Defaults

You can pass configuration via environment variables:

```json
{
  "mcpServers": {
    "glin-profanity": {
      "command": "npx",
      "args": ["-y", "glin-profanity-mcp"],
      "env": {
        "GLIN_PROFANITY_LANGUAGES": "english,spanish",
        "GLIN_PROFANITY_LEETSPEAK": "true",
        "GLIN_PROFANITY_CACHE_SIZE": "10000"
      }
    }
  }
}
```

### Multiple Configurations

Run different MCP servers with different configs:

```json
{
  "mcpServers": {
    "glin-profanity-strict": {
      "command": "npx",
      "args": ["-y", "glin-profanity-mcp"],
      "env": {
        "GLIN_PROFANITY_LEETSPEAK_LEVEL": "aggressive"
      }
    },
    "glin-profanity-lenient": {
      "command": "npx",
      "args": ["-y", "glin-profanity-mcp"],
      "env": {
        "GLIN_PROFANITY_LEETSPEAK_LEVEL": "basic"
      }
    }
  }
}
```

---

## Next Steps

- [MCP Tools Reference](./tools.md) - All 19 available tools
- [MCP Resources Guide](./resources.md) - All 23 documentation resources
- [MCP Examples](./examples.md) - Real-world usage examples
- [Full MCP Overview](./overview.md) - Complete MCP documentation

---

**Your MCP server is now ready!** Try asking your AI assistant to check for profanity. 🚀
