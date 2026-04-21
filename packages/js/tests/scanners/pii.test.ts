/**
 * Tests for PiiScanner and scanPii convenience function.
 */

import { PiiScanner, scanPii } from '../../src/scanners/pii';
import { Vault } from '../../src/scanners/vault';
import { luhnCheck, ibanCheck } from '../../src/scanners/patterns/pii-patterns';

// ---------------------------------------------------------------------------
// Validators (unit tests)
// ---------------------------------------------------------------------------

describe('luhnCheck', () => {
  test('validates 4111 1111 1111 1111 (Luhn valid Visa test number)', () => {
    expect(luhnCheck('4111 1111 1111 1111')).toBe(true);
  });

  test('rejects 4111 1111 1111 1112 (Luhn invalid)', () => {
    expect(luhnCheck('4111 1111 1111 1112')).toBe(false);
  });

  test('validates with hyphens', () => {
    expect(luhnCheck('4111-1111-1111-1111')).toBe(true);
  });

  test('validates Amex test number 378282246310005', () => {
    expect(luhnCheck('378282246310005')).toBe(true);
  });

  test('rejects empty string', () => {
    expect(luhnCheck('')).toBe(false);
  });

  test('rejects non-numeric string', () => {
    expect(luhnCheck('abcd-efgh-ijkl-mnop')).toBe(false);
  });
});

describe('ibanCheck', () => {
  test('validates GB29 NWBK 6016 1331 9268 19 (valid UK IBAN)', () => {
    expect(ibanCheck('GB29NWBK60161331926819')).toBe(true);
  });

  test('validates DE89 3704 0044 0532 0130 00 (valid German IBAN)', () => {
    expect(ibanCheck('DE89370400440532013000')).toBe(true);
  });

  test('rejects modified IBAN with wrong checksum', () => {
    expect(ibanCheck('GB29NWBK60161331926820')).toBe(false);
  });

  test('rejects obviously invalid IBAN', () => {
    expect(ibanCheck('XX00000000000000')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Detection — should BLOCK
// ---------------------------------------------------------------------------

describe('PiiScanner — detection (should BLOCK)', () => {
  const scanner = new PiiScanner();

  test('detects email address', () => {
    const result = scanner.scan('Contact me at john.doe@example.com for details');
    expect(result.decision).toBe('BLOCK');
    expect(result.valid).toBe(false);
    expect(result.matches?.some(m => m.pattern === 'PII-EMAIL-001')).toBe(true);
  });

  test('detects E.164 phone number', () => {
    const result = scanner.scan('Call me at +12025551234');
    expect(result.decision).toBe('BLOCK');
    expect(result.matches?.some(m => m.category === 'phone')).toBe(true);
  });

  test('detects US SSN', () => {
    const result = scanner.scan('SSN: 123-45-6789');
    expect(result.decision).toBe('BLOCK');
    expect(result.matches?.some(m => m.category === 'ssn')).toBe(true);
  });

  test('detects Luhn-valid credit card 4111 1111 1111 1111', () => {
    const result = scanner.scan('Card: 4111 1111 1111 1111');
    expect(result.decision).toBe('BLOCK');
    expect(result.matches?.some(m => m.category === 'credit_card')).toBe(true);
  });

  test('does NOT flag Luhn-invalid card 4111 1111 1111 1112', () => {
    const result = scanner.scan('Card: 4111 1111 1111 1112');
    // The number doesn't pass Luhn — validator should reject it
    expect(result.matches?.filter(m => m.category === 'credit_card')).toHaveLength(0);
  });

  test('detects valid IBAN GB29NWBK60161331926819', () => {
    const result = scanner.scan('IBAN: GB29NWBK60161331926819');
    expect(result.decision).toBe('BLOCK');
    expect(result.matches?.some(m => m.category === 'iban')).toBe(true);
  });

  test('does NOT flag invalid IBAN (wrong checksum)', () => {
    const result = scanner.scan('IBAN: GB29NWBK60161331926820');
    expect(result.matches?.filter(m => m.category === 'iban')).toHaveLength(0);
  });

  test('detects IPv4 address', () => {
    const result = scanner.scan('Server IP: 192.168.1.100');
    expect(result.decision).toBe('BLOCK');
    expect(result.matches?.some(m => m.pattern === 'PII-IPV4-001')).toBe(true);
  });

  test('detects IPv6 address', () => {
    const result = scanner.scan('IPv6: 2001:0db8:85a3:0000:0000:8a2e:0370:7334');
    expect(result.decision).toBe('BLOCK');
    expect(result.matches?.some(m => m.pattern === 'PII-IPV6-001')).toBe(true);
  });

  test('detects MAC address (colon-separated)', () => {
    const result = scanner.scan('Device: 00:1A:2B:3C:4D:5E');
    expect(result.decision).toBe('BLOCK');
    expect(result.matches?.some(m => m.pattern === 'PII-MAC-001')).toBe(true);
  });

  test('detects MAC address (hyphen-separated)', () => {
    const result = scanner.scan('Device: 00-1A-2B-3C-4D-5E');
    expect(result.decision).toBe('BLOCK');
    expect(result.matches?.some(m => m.pattern === 'PII-MAC-002')).toBe(true);
  });

  test('detects US SSN with spaces', () => {
    const result = scanner.scan('Social Security: 123 45 6789');
    expect(result.decision).toBe('BLOCK');
  });

  test('detects DOB in ISO format', () => {
    const result = scanner.scan('born: 1985-03-15');
    expect(result.decision).toBe('BLOCK');
    expect(result.matches?.some(m => m.category === 'dob')).toBe(true);
  });

  test('detects UK postcode', () => {
    const result = scanner.scan('Address: London SW1A 1AA');
    expect(result.decision).toBe('BLOCK');
    expect(result.matches?.some(m => m.category === 'postcode')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Safe inputs — should ALLOW
// ---------------------------------------------------------------------------

describe('PiiScanner — safe inputs (should ALLOW)', () => {
  const scanner = new PiiScanner();

  test('plain sentence without PII ALLOWs', () => {
    const result = scanner.scan('The weather today is great!');
    expect(result.decision).toBe('ALLOW');
    expect(result.valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Redaction + Vault roundtrip
// ---------------------------------------------------------------------------

describe('PiiScanner — redaction + Vault roundtrip', () => {
  test('redacts email and restores exactly', () => {
    const vault = new Vault();
    const input = 'Contact: john.doe@example.com';
    const result = scanPii(input, { redact: true, vault });

    expect(result.valid).toBe(false);
    expect(result.sanitized).not.toContain('john.doe@example.com');
    expect(vault.size()).toBeGreaterThanOrEqual(1);

    const restored = vault.restore(result.sanitized);
    expect(restored).toContain('john.doe@example.com');
  });

  test('redacts multiple PII types and restores all', () => {
    const vault = new Vault();
    const input = 'Email: alice@test.com, IP: 10.0.0.1';
    const result = scanPii(input, { redact: true, vault });

    expect(result.sanitized).not.toContain('alice@test.com');
    expect(result.sanitized).not.toContain('10.0.0.1');

    const restored = vault.restore(result.sanitized);
    expect(restored).toContain('alice@test.com');
    expect(restored).toContain('10.0.0.1');
  });

  test('scanPii convenience function returns ScanResult', () => {
    const result = scanPii('hello world');
    expect(result.scanner).toBe('pii');
    expect(result.decision).toBe('ALLOW');
  });
});

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

describe('PiiScanner — options', () => {
  test('customPatterns adds extra detection', () => {
    const custom = [{
      id: 'PII-CUSTOM-001',
      type: 'other' as const,
      pattern: /EMPLOYEE-[0-9]{6}/,
    }];
    const scanner = new PiiScanner({ customPatterns: custom });
    const result = scanner.scan('id: EMPLOYEE-123456');
    expect(result.decision).toBe('BLOCK');
    expect(result.matches?.some(m => m.pattern === 'PII-CUSTOM-001')).toBe(true);
  });

  test('scanner name is "pii"', () => {
    const scanner = new PiiScanner();
    expect(scanner.name).toBe('pii');
    const result = scanner.scan('hello');
    expect(result.scanner).toBe('pii');
  });

  test('blockOnAny=false with single match gives score ≤ 1', () => {
    const scanner = new PiiScanner({ blockOnAny: false });
    const result = scanner.scan('Email: test@example.com');
    expect(result.score).toBeLessThanOrEqual(1.0);
    expect(result.score).toBeGreaterThan(0);
  });
});
