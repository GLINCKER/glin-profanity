/**
 * Tests for MCP Integration
 */

import {
  mcpTools,
  executeMCPTool,
  createMCPHandler,
} from '../src/mcp';

describe('MCP Integration', () => {
  describe('mcpTools', () => {
    it('should have all expected tools', () => {
      const toolNames = mcpTools.map(t => t.name);

      expect(toolNames).toContain('check_profanity');
      expect(toolNames).toContain('censor_text');
      expect(toolNames).toContain('batch_check_profanity');
      expect(toolNames).toContain('analyze_profanity_context');
      expect(toolNames).toContain('get_supported_languages');
    });

    it('should have valid input schemas', () => {
      for (const tool of mcpTools) {
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe('object');
        expect(tool.inputSchema.properties).toBeDefined();
      }
    });
  });

  describe('executeMCPTool', () => {
    it('should execute check_profanity', async () => {
      const result = await executeMCPTool('check_profanity', {
        text: 'This is fucking great',
      });

      expect(result.content).toHaveLength(1);
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.containsProfanity).toBe(true);
    });

    it('should execute censor_text', async () => {
      const result = await executeMCPTool('censor_text', {
        text: 'Holy shit!',
        replacement: '****',
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.censoredText).toContain('****');
    });

    it('should execute batch_check_profanity', async () => {
      const result = await executeMCPTool('batch_check_profanity', {
        texts: ['Hello', 'Fuck you', 'World'],
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.totalChecked).toBe(3);
      expect(parsed.flaggedCount).toBe(1);
    });

    it('should execute get_supported_languages', async () => {
      const result = await executeMCPTool('get_supported_languages', {});

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.count).toBe(24);
    });

    it('should handle unknown tools', async () => {
      const result = await executeMCPTool('unknown_tool', {});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Unknown tool');
    });
  });

  describe('createMCPHandler', () => {
    it('should list all tools', () => {
      const handler = createMCPHandler();
      const tools = handler.listTools();

      expect(tools.length).toBe(5);
    });

    it('should get specific tool', () => {
      const handler = createMCPHandler();
      const tool = handler.getTool('check_profanity');

      expect(tool).toBeDefined();
      expect(tool?.name).toBe('check_profanity');
    });

    it('should execute tool', async () => {
      const handler = createMCPHandler();
      const result = await handler.executeTool('check_profanity', {
        text: 'Clean text',
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.containsProfanity).toBe(false);
    });

    it('should return server info', () => {
      const handler = createMCPHandler();
      const info = handler.getServerInfo();

      expect(info.name).toBe('glin-profanity-mcp');
      expect(info.capabilities.tools).toHaveLength(5);
    });
  });
});
