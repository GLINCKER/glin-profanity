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