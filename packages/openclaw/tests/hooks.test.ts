/**
 * Tests for OpenClaw Hooks
 */

import { createProfanityGuard, quickGuard } from '../src/hooks';

describe('OpenClaw Hooks', () => {
  describe('createProfanityGuard', () => {
    it('should create a guard with default config', () => {
      const guard = createProfanityGuard();

      expect(guard.getConfig().mode).toBe('moderate');
      expect(guard.getConfig().censorProfanity).toBe(true);
      expect(guard.getConfig().blockProfanity).toBe(false);
    });

    it('should allow clean messages through', async () => {
      const guard = createProfanityGuard();

      const result = await guard.processMessage({
        message: 'Hello world!',
      });

      expect(result.proceed).toBe(true);
      expect(result.message).toBe('Hello world!');
    });

    it('should censor profanity when configured', async () => {
      const guard = createProfanityGuard({
        censorProfanity: true,
        blockProfanity: false,
      });

      const result = await guard.processMessage({
        message: 'What the fuck?',
      });

      expect(result.proceed).toBe(true);
      expect(result.message).toContain('***');
      expect(result.incident).toBeDefined();
      expect(result.incident?.action).toBe('censor');
    });

    it('should block profanity when configured', async () => {
      const guard = createProfanityGuard({
        blockProfanity: true,
      });

      const result = await guard.processMessage({
        message: 'This is shit',
      });

      expect(result.proceed).toBe(false);
      expect(result.reason).toContain('Profanity detected');
      expect(result.incident?.action).toBe('block');
    });

    it('should log incidents', async () => {
      const guard = createProfanityGuard({
        logIncidents: true,
      });

      await guard.processMessage({ message: 'Fuck this' });
      await guard.processMessage({ message: 'And this shit' });

      expect(guard.getIncidentCount()).toBe(2);

      const log = guard.getIncidentLog();
      expect(log).toHaveLength(2);
    });

    it('should skip specified channels', async () => {
      const guard = createProfanityGuard({
        skipChannels: ['admin-channel'],
        blockProfanity: true,
      });

      const result = await guard.processMessage({
        message: 'Fucking admin stuff',
        channel: 'admin-channel',
      });

      expect(result.proceed).toBe(true);
    });

    it('should call custom callback', async () => {
      let callbackCalled = false;
      let detectedWords: string[] = [];

      const guard = createProfanityGuard({
        onProfanityDetected: (incident) => {
          callbackCalled = true;
          detectedWords = incident.profaneWords;
        },
      });

      // Use a word that's definitely in the dictionary
      const result = await guard.processMessage({ message: 'This is fucking bullshit' });

      // Verify profanity was detected
      expect(result.incident?.profaneWords.length).toBeGreaterThan(0);
      expect(callbackCalled).toBe(true);
      expect(detectedWords.length).toBeGreaterThan(0);
    });

    it('should support multiple languages', async () => {
      const guard = createProfanityGuard({
        languages: ['english', 'spanish'],
        blockProfanity: true,
      });

      const result = await guard.processMessage({
        message: 'Esto es mierda',
      });

      expect(result.proceed).toBe(false);
    });
  });

  describe('quickGuard', () => {
    it('should pass clean text', () => {
      const result = quickGuard('Hello world');
      expect(result.proceed).toBe(true);
    });

    it('should warn about profanity by default', () => {
      const result = quickGuard('This is shit');
      expect(result.proceed).toBe(true);
      expect(result.reason).toContain('profanity detected');
    });

    it('should block when configured', () => {
      const result = quickGuard('Fuck this', { block: true });
      expect(result.proceed).toBe(false);
    });

    it('should censor when configured', () => {
      const result = quickGuard('What the fuck?', { censor: true });
      expect(result.proceed).toBe(true);
      expect(result.message).toContain('***');
    });
  });
});
