#!/usr/bin/env node
/**
 * Glin-Profanity MCP HTTP Server
 *
 * HTTP/SSE transport for cloud deployment of the MCP server.
 * Use this for remote access, web integrations, and multi-client scenarios.
 *
 * Usage:
 *   npx glin-profanity-mcp-http
 *   PORT=8080 npx glin-profanity-mcp-http
 *
 * @see https://github.com/GLINCKER/glin-profanity
 */

import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { registerAllTools, registerAllResources, registerAllPrompts } from "./server.js";

// Read version from package.json
const require = createRequire(import.meta.url);
const packageJson = require("../package.json");

const PORT = parseInt(process.env.PORT || "3000", 10);
const HOST = process.env.HOST || "0.0.0.0";

// Session management
const sessions: Map<string, {
  transport: StreamableHTTPServerTransport;
  server: McpServer;
  createdAt: Date;
  lastActivity: Date;
}> = new Map();

// Cleanup inactive sessions (older than 30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of sessions) {
    if (now - session.lastActivity.getTime() > SESSION_TIMEOUT) {
      session.transport.close();
      sessions.delete(sessionId);
      process.stderr.write(`Session ${sessionId} expired\n`);
    }
  }
}, 60 * 1000);

// Create HTTP server
const server = createServer(async (req, res) => {
  // CORS headers for browser clients
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, mcp-session-id");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check endpoint
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      status: "healthy",
      sessions: sessions.size,
      uptime: process.uptime(),
    }));
    return;
  }

  // Info endpoint
  if (req.url === "/" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      name: "glin-profanity-mcp",
      version: packageJson.version,
      transport: "streamable-http",
      endpoints: {
        mcp: "/mcp",
        health: "/health",
      },
      documentation: "https://github.com/GLINCKER/glin-profanity/tree/release/packages/mcp",
    }));
    return;
  }

  // MCP endpoint
  if (req.url === "/mcp") {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    // Handle GET (SSE for notifications)
    if (req.method === "GET") {
      if (sessionId && sessions.has(sessionId)) {
        const session = sessions.get(sessionId)!;
        session.lastActivity = new Date();
        await session.transport.handleRequest(req, res);
      } else {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          jsonrpc: "2.0",
          error: { code: -32000, message: "Invalid or missing session" },
          id: null,
        }));
      }
      return;
    }

    // Handle DELETE (close session)
    if (req.method === "DELETE") {
      if (sessionId && sessions.has(sessionId)) {
        const session = sessions.get(sessionId)!;
        await session.transport.handleRequest(req, res);
        sessions.delete(sessionId);
      } else {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          jsonrpc: "2.0",
          error: { code: -32000, message: "Invalid session" },
          id: null,
        }));
      }
      return;
    }

    // Handle POST (main MCP requests)
    if (req.method === "POST") {
      let body = "";
      for await (const chunk of req) {
        body += chunk;
      }

      let parsedBody: unknown;
      try {
        parsedBody = JSON.parse(body);
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          jsonrpc: "2.0",
          error: { code: -32700, message: "Parse error" },
          id: null,
        }));
        return;
      }

      // Existing session
      if (sessionId && sessions.has(sessionId)) {
        const session = sessions.get(sessionId)!;
        session.lastActivity = new Date();
        await session.transport.handleRequest(req, res, parsedBody);
        return;
      }

      // New session initialization
      if (!sessionId && isInitializeRequest(parsedBody)) {
        const mcpServer = new McpServer({
          name: "glin-profanity",
          version: packageJson.version,
        });

        // Register all tools, resources, and prompts
        registerAllTools(mcpServer);
        registerAllResources(mcpServer);
        registerAllPrompts(mcpServer);

        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (id) => {
            sessions.set(id, {
              transport,
              server: mcpServer,
              createdAt: new Date(),
              lastActivity: new Date(),
            });
            process.stderr.write(`Session initialized: ${id}\n`);
          },
        });

        transport.onclose = () => {
          if (transport.sessionId && sessions.has(transport.sessionId)) {
            sessions.delete(transport.sessionId);
            process.stderr.write(`Session closed: ${transport.sessionId}\n`);
          }
        };

        await mcpServer.connect(transport);
        await transport.handleRequest(req, res, parsedBody);
        return;
      }

      // Invalid request
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Invalid session or missing initialize request" },
        id: null,
      }));
      return;
    }

    // Method not allowed
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Method not allowed" },
      id: null,
    }));
    return;
  }

  // 404 for unknown endpoints
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(PORT, HOST, () => {
  const versionPadded = `v${packageJson.version}`.padStart(7);
  process.stderr.write(`
╔═══════════════════════════════════════════════════════════════╗
║          Glin-Profanity MCP HTTP Server ${versionPadded}             ║
╠═══════════════════════════════════════════════════════════════╣
║  Server running at: http://${HOST}:${PORT}                         ║
║  MCP endpoint:      http://${HOST}:${PORT}/mcp                     ║
║  Health check:      http://${HOST}:${PORT}/health                  ║
╠═══════════════════════════════════════════════════════════════╣
║  Connect with StreamableHTTPClientTransport:                  ║
║  const transport = new StreamableHTTPClientTransport(         ║
║    new URL('http://${HOST}:${PORT}/mcp')                           ║
║  );                                                           ║
╚═══════════════════════════════════════════════════════════════╝
`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  process.stderr.write("\nShutting down...\n");
  for (const session of sessions.values()) {
    session.transport.close();
  }
  server.close();
  process.exit(0);
});
