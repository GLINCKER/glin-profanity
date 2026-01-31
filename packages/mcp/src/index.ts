#!/usr/bin/env node
/**
 * Glin-Profanity MCP Server (STDIO Transport)
 *
 * Model Context Protocol server that enables AI assistants (Claude, Cursor, etc.)
 * to use glin-profanity as a tool for content moderation and profanity detection.
 *
 * Features:
 * - 19 Powerful Tools for content moderation
 * - 5 Workflow Prompts for guided AI interactions
 * - 5 Reference Resources for configuration
 * - Conversation Memory for user tracking
 * - Real-time Streaming for chat moderation
 * - 24 Language Support
 *
 * Usage (STDIO - for Claude Desktop, Cursor, etc.):
 *   npx glin-profanity-mcp
 *
 * For HTTP transport (cloud deployment):
 *   npx glin-profanity-mcp-http
 *
 * @see https://github.com/GLINCKER/glin-profanity
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  registerAllTools,
  registerAllResources,
  registerAllPrompts,
} from './server.js';

// Create the MCP server
const server = new McpServer({
  name: 'glin-profanity',
  version: '1.2.0',
});

// Register all tools, resources, and prompts
registerAllTools(server);
registerAllResources(server);
registerAllPrompts(server);

// Start the server with STDIO transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  // Don't use console.log for STDIO servers - write to stderr
  process.stderr.write(`Server error: ${error}\n`);
  process.exit(1);
});
