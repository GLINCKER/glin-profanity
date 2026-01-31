/**
 * Tests for OpenClaw Plugin
 */

import {
  checkProfanityTool,
  censorTextTool,
  batchCheckTool,
  analyzeContextTool,
  getSupportedLanguagesTool,
  registerProfanityTools,
} from '../src/plugin';

describe('OpenClaw Plugin Tools', () => {
  describe('checkProfanityTool', () => {
    it('should detect profanity in text', async () => {
      const result = await checkProfanityTool.execute('test-id', {
        text: 'This is a fucking test',
      });

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.containsProfanity).toBe(true);
      expect(parsed.profaneWords).toContain('fucking');
    });

    it('should return clean for appropriate text', async () => {
      const result = await checkProfanityTool.execute('test-id', {
        text: 'Hello world, have a nice day!',
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.containsProfanity).toBe(false);
      expect(parsed.profaneWords).toHaveLength(0);
    });

    it('should support multiple languages', async () => {
      const result = await checkProfanityTool.execute('test-id', {
        text: 'This is merde',
        languages: ['english', 'french'],
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.containsProfanity).toBe(true);
    });
  });

  describe('censorTextTool', () => {
    it('should censor profanity', async () => {
      const result = await censorTextTool.execute('test-id', {
        text: 'What the fuck is this?',
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.censoredText).toContain('***');
      expect(parsed.wordsCensored).toBeGreaterThan(0);
    });

    it('should use custom replacement', async () => {
      const result = await censorTextTool.execute('test-id', {
        text: 'What the fuck?',
        replacement: '[CENSORED]',
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.censoredText).toContain('[CENSORED]');
    });
  });

  describe('batchCheckTool', () => {
    it('should check multiple texts', async () => {
      const result = await batchCheckTool.execute('test-id', {
        texts: [
          'Hello world',
          'This is shit',
          'Have a nice day',
        ],
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.totalChecked).toBe(3);
      expect(parsed.flaggedCount).toBe(1);
      expect(parsed.cleanCount).toBe(2);
    });
  });

  describe('analyzeContextTool', () => {
    it('should analyze profanity with context', async () => {
      const result = await analyzeContextTool.execute('test-id', {
        text: 'That was a kick ass game!',
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.analysis).toBeDefined();
    });
  });

  describe('getSupportedLanguagesTool', () => {
    it('should return all supported languages', async () => {
      const result = await getSupportedLanguagesTool.execute('test-id', {});

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.count).toBe(24);
      expect(parsed.languages).toContain('english');
      expect(parsed.languages).toContain('spanish');
      expect(parsed.languages).toContain('french');
    });
  });

  describe('registerProfanityTools', () => {
    it('should register all tools with API', () => {
      const registeredTools: string[] = [];
      const mockApi = {
        registerTool: (tool: { name: string }) => {
          registeredTools.push(tool.name);
        },
      };

      registerProfanityTools(mockApi);

      expect(registeredTools).toContain('check_profanity');
      expect(registeredTools).toContain('censor_text');
      expect(registeredTools).toContain('batch_check_profanity');
      expect(registeredTools).toContain('analyze_profanity_context');
      expect(registeredTools).toContain('get_supported_languages');
    });
  });
});
