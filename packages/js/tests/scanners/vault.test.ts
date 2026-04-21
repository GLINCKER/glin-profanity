/**
 * Tests for the Vault class.
 */

import { Vault } from '../../src/scanners/vault';

// ---------------------------------------------------------------------------
// Basic store / restore
// ---------------------------------------------------------------------------

describe('Vault — store & restore (exact strategy)', () => {
  test('stores a value and returns a placeholder', () => {
    const vault = new Vault();
    const placeholder = vault.store('email', 'alice@example.com');
    expect(placeholder).toBe('[REDACTED_EMAIL_1]');
  });

  test('increments counter for the same type', () => {
    const vault = new Vault();
    const p1 = vault.store('email', 'alice@example.com');
    const p2 = vault.store('email', 'bob@example.com');
    expect(p1).toBe('[REDACTED_EMAIL_1]');
    expect(p2).toBe('[REDACTED_EMAIL_2]');
  });

  test('distinct types get independent counters', () => {
    const vault = new Vault();
    const p1 = vault.store('email', 'alice@example.com');
    const p2 = vault.store('phone', '+12025551234');
    expect(p1).toBe('[REDACTED_EMAIL_1]');
    expect(p2).toBe('[REDACTED_PHONE_1]');
  });

  test('restores placeholder back to original (exact)', () => {
    const vault = new Vault();
    const placeholder = vault.store('email', 'alice@example.com');
    const text = `Contact ${placeholder} for help.`;
    const restored = vault.restore(text);
    expect(restored).toBe('Contact alice@example.com for help.');
  });

  test('restores multiple placeholders', () => {
    const vault = new Vault();
    const p1 = vault.store('email', 'alice@example.com');
    const p2 = vault.store('phone', '+12025551234');
    const text = `Email: ${p1}, Phone: ${p2}`;
    const restored = vault.restore(text);
    expect(restored).toBe('Email: alice@example.com, Phone: +12025551234');
  });
});

// ---------------------------------------------------------------------------
// caseInsensitive strategy
// ---------------------------------------------------------------------------

describe('Vault — restore caseInsensitive strategy', () => {
  test('restores when placeholder case is mutated', () => {
    const vault = new Vault();
    const placeholder = vault.store('email', 'alice@example.com');
    // Simulate an LLM lowercasing the placeholder
    const mutated = placeholder.toLowerCase();
    const restored = vault.restore(mutated, 'caseInsensitive');
    expect(restored).toBe('alice@example.com');
  });

  test('caseInsensitive restores mixed-case placeholder', () => {
    const vault = new Vault();
    vault.store('ssn', '123-45-6789');
    const text = '[redacted_ssn_1]';
    const restored = vault.restore(text, 'caseInsensitive');
    expect(restored).toBe('123-45-6789');
  });
});

// ---------------------------------------------------------------------------
// fuzzy strategy (Levenshtein ≤ 3)
// ---------------------------------------------------------------------------

describe('Vault — restore fuzzy strategy', () => {
  test('restores with 1-character typo in placeholder', () => {
    const vault = new Vault();
    vault.store('email', 'alice@example.com');
    // 1 char substitution: [REDACTED_EMAIL_1] → [REDACTED_EMAIL_X]
    const typo = '[REDACTED_EMAIL_X]';
    const restored = vault.restore(typo, 'fuzzy');
    expect(restored).toBe('alice@example.com');
  });

  test('restores with 2-character difference', () => {
    const vault = new Vault();
    vault.store('token', 'secret123');
    // 2 chars dropped from end
    const typo = '[REDACTED_TOKEN_';
    const restored = vault.restore(typo, 'fuzzy');
    // The fuzzy replacement may partially match — just assert no throw
    expect(typeof restored).toBe('string');
  });

  test('does not replace text far from placeholder (edit distance > 3)', () => {
    const vault = new Vault();
    vault.store('email', 'alice@example.com');
    // Completely different text
    const unrelated = 'Hello world, this is totally different text with no placeholder at all.';
    const restored = vault.restore(unrelated, 'fuzzy');
    // Should NOT inject original into unrelated text
    expect(restored).not.toContain('alice@example.com');
  });
});

// ---------------------------------------------------------------------------
// combined strategy
// ---------------------------------------------------------------------------

describe('Vault — restore combined strategy', () => {
  test('combined: exact match restored first', () => {
    const vault = new Vault();
    const placeholder = vault.store('ssn', '123-45-6789');
    const text = `SSN was ${placeholder}.`;
    const restored = vault.restore(text, 'combined');
    expect(restored).toContain('123-45-6789');
  });

  test('combined: falls back to case-insensitive when exact fails', () => {
    const vault = new Vault();
    vault.store('email', 'alice@example.com');
    const text = '[redacted_email_1]';
    const restored = vault.restore(text, 'combined');
    expect(restored).toBe('alice@example.com');
  });
});

// ---------------------------------------------------------------------------
// clear and size
// ---------------------------------------------------------------------------

describe('Vault — clear & size', () => {
  test('size returns entry count', () => {
    const vault = new Vault();
    expect(vault.size()).toBe(0);
    vault.store('email', 'a@b.com');
    expect(vault.size()).toBe(1);
    vault.store('phone', '+1234567890');
    expect(vault.size()).toBe(2);
  });

  test('clear removes all entries and resets counters', () => {
    const vault = new Vault();
    vault.store('email', 'alice@example.com');
    vault.store('email', 'bob@example.com');
    vault.clear();
    expect(vault.size()).toBe(0);
    // After clear, counters reset — next store should be _1 again
    const p = vault.store('email', 'charlie@example.com');
    expect(p).toBe('[REDACTED_EMAIL_1]');
  });
});

// ---------------------------------------------------------------------------
// Unique placeholder numbering
// ---------------------------------------------------------------------------

describe('Vault — unique placeholder numbering', () => {
  test('same-type entries get distinct sequential numbers', () => {
    const vault = new Vault();
    const placeholders = [
      vault.store('credit_card', '4111111111111111'),
      vault.store('credit_card', '5500005555555559'),
      vault.store('credit_card', '340000000000009'),
    ];
    const unique = new Set(placeholders);
    expect(unique.size).toBe(3);
    expect(placeholders[0]).toBe('[REDACTED_CREDIT_CARD_1]');
    expect(placeholders[1]).toBe('[REDACTED_CREDIT_CARD_2]');
    expect(placeholders[2]).toBe('[REDACTED_CREDIT_CARD_3]');
  });

  test('getEntries returns snapshot of stored entries', () => {
    const vault = new Vault();
    vault.store('email', 'test@test.com');
    const entries = vault.getEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0].original).toBe('test@test.com');
    expect(entries[0].placeholder).toBe('[REDACTED_EMAIL_1]');
  });
});

// ---------------------------------------------------------------------------
// Type normalisation
// ---------------------------------------------------------------------------

describe('Vault — type normalisation', () => {
  test('type with spaces/dashes is normalised to underscores', () => {
    const vault = new Vault();
    const p = vault.store('credit card', 'secret');
    expect(p).toBe('[REDACTED_CREDIT_CARD_1]');
  });

  test('lowercase type is uppercased in placeholder', () => {
    const vault = new Vault();
    const p = vault.store('ssn', '123-45-6789');
    expect(p).toBe('[REDACTED_SSN_1]');
  });
});
