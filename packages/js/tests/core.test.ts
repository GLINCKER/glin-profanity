import { Filter } from '../src/filters/Filter';

// Simple test to verify core functions work
describe('Core Functions Basic Test', () => {
  test('module exports exist', () => {
    // Just verify the core functions can be imported
    expect(() => {
      const core = require('../src/core');
      expect(typeof core.checkProfanity).toBe('function');
      expect(typeof core.checkProfanityAsync).toBe('function');
      expect(typeof core.isWordProfane).toBe('function');
    }).not.toThrow();
  });

  test('types exist', () => {
    expect(() => {
      const types = require('../src/core/types');
      expect(types).toBeDefined();
    }).not.toThrow();
  });
});

describe('Filter Configuration Export', () => {
  test('getConfig returns current configuration', () => {
    const filter = new Filter({
      languages: ['english'],
      detectLeetspeak: true,
      leetspeakLevel: 'aggressive',
      normalizeUnicode: true,
      cacheResults: true,
      maxCacheSize: 500,
    });

    const config = filter.getConfig();

    expect(config.detectLeetspeak).toBe(true);
    expect(config.leetspeakLevel).toBe('aggressive');
    expect(config.normalizeUnicode).toBe(true);
    expect(config.cacheResults).toBe(true);
    expect(config.maxCacheSize).toBe(500);
  });

  test('config can be used to create new filter', () => {
    const original = new Filter({
      languages: ['english'],
      detectLeetspeak: true,
      customWords: ['badword'],
    });

    const config = original.getConfig();
    const restored = new Filter(config);

    expect(restored.getConfig().detectLeetspeak).toBe(true);
    // Note: customWords won't roundtrip as they're merged into the dictionary
  });

  test('getWordCount returns dictionary size', () => {
    const filter = new Filter({ languages: ['english'] });
    const count = filter.getWordCount();

    expect(count).toBeGreaterThan(0);
    expect(typeof count).toBe('number');
  });
});