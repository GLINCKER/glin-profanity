/**
 * PII (Personally Identifiable Information) detection patterns.
 *
 * Pattern attribution:
 *   - ProtectAI/llm-guard (MIT) — https://github.com/protectai/llm-guard
 *   - Yelp/detect-secrets (Apache-2.0) — https://github.com/Yelp/detect-secrets
 *
 * Patterns have been reimplemented in TypeScript — no source was copied verbatim.
 *
 * @module scanners/patterns/pii-patterns
 */

/** Category of PII the pattern detects. */
export type PiiType =
  | 'email'
  | 'phone'
  | 'ssn'
  | 'credit_card'
  | 'iban'
  | 'ip'
  | 'mac'
  | 'postcode'
  | 'passport'
  | 'dob'
  | 'other';

/** A single PII detection rule. */
export interface PiiPattern {
  /** Unique identifier, e.g. "PII-EMAIL-001". */
  id: string;
  /** Category of PII. */
  type: PiiType;
  /** Compiled regular expression for detection. */
  pattern: RegExp;
  /**
   * Optional post-match validator.
   * If provided, a match only counts as PII when this returns true.
   */
  validator?: (match: string) => boolean;
}

// ---------------------------------------------------------------------------
// Validators
// ---------------------------------------------------------------------------

/**
 * Luhn algorithm validator for credit card numbers.
 * Strips spaces and dashes before checking.
 */
export function luhnCheck(value: string): boolean {
  const digits = value.replace(/[\s\-]/g, '');
  if (!/^\d+$/.test(digits)) return false;

  let sum = 0;
  let shouldDouble = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits[i], 10);
    if (shouldDouble) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

/**
 * Basic IBAN mod-97 structural validator.
 * Does NOT check country-specific length rules; validates the mod-97 checksum.
 */
export function ibanCheck(value: string): boolean {
  const cleaned = value.replace(/[\s\-]/g, '').toUpperCase();
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/.test(cleaned)) return false;

  // Move first 4 chars to end, convert letters to numbers
  const rearranged = cleaned.slice(4) + cleaned.slice(0, 4);
  const numeric = rearranged.split('').map(c => {
    const code = c.charCodeAt(0);
    return code >= 65 && code <= 90 ? String(code - 55) : c;
  }).join('');

  // BigInt mod 97 (IBAN can be >15 digits)
  let remainder = BigInt(0);
  for (const ch of numeric) {
    remainder = (remainder * BigInt(10) + BigInt(parseInt(ch, 10))) % BigInt(97);
  }
  return remainder === BigInt(1);
}

// ---------------------------------------------------------------------------
// Email
// ---------------------------------------------------------------------------

const EMAIL_PATTERNS: PiiPattern[] = [
  {
    id: 'PII-EMAIL-001',
    type: 'email',
    // RFC-5321 compliant enough for practical use
    pattern: /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/,
  },
];

// ---------------------------------------------------------------------------
// Phone Numbers
// ---------------------------------------------------------------------------

const PHONE_PATTERNS: PiiPattern[] = [
  {
    id: 'PII-PHONE-001',
    type: 'phone',
    // E.164 format
    pattern: /\+[1-9][0-9]{6,14}\b/,
  },
  {
    id: 'PII-PHONE-002',
    type: 'phone',
    // US/CA NANP: (XXX) XXX-XXXX or XXX-XXX-XXXX or XXX.XXX.XXXX
    pattern: /(?:\+1[\s\-.]?)?\(?[2-9][0-9]{2}\)?[\s\-.]?[2-9][0-9]{2}[\s\-.]?[0-9]{4}\b/,
  },
  {
    id: 'PII-PHONE-003',
    type: 'phone',
    // UK phone: 07xxx xxxxxx or +44 7xxx xxxxxx
    pattern: /(?:\+44|0)[0-9]{2,4}[\s\-]?[0-9]{3,4}[\s\-]?[0-9]{4}\b/,
  },
];

// ---------------------------------------------------------------------------
// SSN / Tax IDs
// ---------------------------------------------------------------------------

const SSN_PATTERNS: PiiPattern[] = [
  {
    id: 'PII-SSN-001',
    type: 'ssn',
    // US Social Security Number (not 000, not 666, not 900-999)
    pattern: /\b(?!000|666|9[0-9][0-9])[0-9]{3}[-\s](?!00)[0-9]{2}[-\s](?!0000)[0-9]{4}\b/,
  },
  {
    id: 'PII-ITIN-001',
    type: 'ssn',
    // US Individual Taxpayer Identification Number (9XX-7X-XXXX or 9XX-8X-XXXX)
    pattern: /\b9[0-9]{2}[-\s](?:7[0-9]|8[0-8])[-\s][0-9]{4}\b/,
  },
];

// ---------------------------------------------------------------------------
// Credit Cards
// ---------------------------------------------------------------------------

const CREDIT_CARD_PATTERNS: PiiPattern[] = [
  {
    id: 'PII-CC-001',
    type: 'credit_card',
    // Visa / Mastercard / Amex / Discover — 13-19 digits with optional separators
    pattern: /\b(?:4[0-9]{3}|5[1-5][0-9]{2}|3[47][0-9]{2}|6(?:011|5[0-9]{2}))[0-9 \-]{8,15}[0-9]\b/,
    validator: (match: string) => luhnCheck(match),
  },
  {
    id: 'PII-CC-002',
    type: 'credit_card',
    // Generic 16-digit card with separators
    pattern: /\b[0-9]{4}[\ \-]?[0-9]{4}[\ \-]?[0-9]{4}[\ \-]?[0-9]{4}\b/,
    validator: (match: string) => luhnCheck(match),
  },
  {
    id: 'PII-CC-003',
    type: 'credit_card',
    // Amex: 15-digit, starts with 34 or 37
    pattern: /\b3[47][0-9]{2}[\s\-]?[0-9]{6}[\s\-]?[0-9]{5}\b/,
    validator: (match: string) => luhnCheck(match),
  },
];

// ---------------------------------------------------------------------------
// IBAN
// ---------------------------------------------------------------------------

const IBAN_PATTERNS: PiiPattern[] = [
  {
    id: 'PII-IBAN-001',
    type: 'iban',
    // Standard IBAN format: 2-letter country, 2 check digits, up to 30 alphanumeric
    pattern: /\b[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}(?:[A-Z0-9]{0,16})\b/,
    validator: (match: string) => ibanCheck(match),
  },
  {
    id: 'PII-IBAN-002',
    type: 'iban',
    // IBAN with spaces (printed format: groups of 4)
    pattern: /\b[A-Z]{2}[0-9]{2}(?:\s[A-Z0-9]{4}){2,7}\b/,
    validator: (match: string) => ibanCheck(match),
  },
];

// ---------------------------------------------------------------------------
// IP Addresses
// ---------------------------------------------------------------------------

const IP_PATTERNS: PiiPattern[] = [
  {
    id: 'PII-IPV4-001',
    type: 'ip',
    // IPv4 (non-private ranges included — scanner user decides what to block)
    pattern: /\b(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/,
  },
  {
    id: 'PII-IPV6-001',
    type: 'ip',
    // Full IPv6
    pattern: /\b(?:[A-Fa-f0-9]{1,4}:){7}[A-Fa-f0-9]{1,4}\b/,
  },
  {
    id: 'PII-IPV6-002',
    type: 'ip',
    // Compressed IPv6 (e.g. 2001:db8::1)
    pattern: /\b(?:[A-Fa-f0-9]{1,4}:){1,7}:\b|\b:[A-Fa-f0-9]{1,4}(?::[A-Fa-f0-9]{1,4}){1,7}\b/,
  },
];

// ---------------------------------------------------------------------------
// MAC Address
// ---------------------------------------------------------------------------

const MAC_PATTERNS: PiiPattern[] = [
  {
    id: 'PII-MAC-001',
    type: 'mac',
    // Colon-separated MAC
    pattern: /\b(?:[0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}\b/,
  },
  {
    id: 'PII-MAC-002',
    type: 'mac',
    // Hyphen-separated MAC
    pattern: /\b(?:[0-9A-Fa-f]{2}-){5}[0-9A-Fa-f]{2}\b/,
  },
];

// ---------------------------------------------------------------------------
// Postcodes
// ---------------------------------------------------------------------------

const POSTCODE_PATTERNS: PiiPattern[] = [
  {
    id: 'PII-ZIP-001',
    type: 'postcode',
    // US ZIP code (5 digit or ZIP+4)
    pattern: /\b[0-9]{5}(?:-[0-9]{4})?\b/,
  },
  {
    id: 'PII-UKPOST-001',
    type: 'postcode',
    // UK postcode
    pattern: /\b[A-Z]{1,2}[0-9][0-9A-Z]?\s?[0-9][A-Z]{2}\b/i,
  },
  {
    id: 'PII-CAPOST-001',
    type: 'postcode',
    // Canadian postal code: A1A 1A1
    pattern: /\b[A-CEGHJKLMNPRSTVXYa-cegjklmnprstvxy][0-9][A-Za-z]\s?[0-9][A-Za-z][0-9]\b/,
  },
];

// ---------------------------------------------------------------------------
// Canadian SIN
// ---------------------------------------------------------------------------

const SIN_PATTERNS: PiiPattern[] = [
  {
    id: 'PII-SIN-001',
    type: 'other',
    // Canadian Social Insurance Number: NNN NNN NNN (first digit 1-9, not 0)
    pattern: /\b[1-9][0-9]{2}[\s\-][0-9]{3}[\s\-][0-9]{3}\b/,
  },
];

// ---------------------------------------------------------------------------
// Passport Numbers
// ---------------------------------------------------------------------------

const PASSPORT_PATTERNS: PiiPattern[] = [
  {
    id: 'PII-PASSPORT-US-001',
    type: 'passport',
    // US Passport: 9 digits (newer) or letter + 8 digits
    pattern: /\b(?:[A-Z][0-9]{8}|[0-9]{9})\b/,
  },
  {
    id: 'PII-PASSPORT-UK-001',
    type: 'passport',
    // UK Passport: 9 digits
    pattern: /\b[0-9]{9}\b/,
  },
  {
    id: 'PII-PASSPORT-GENERIC-001',
    type: 'passport',
    // Generic MRZ-style: 2 letters + 6 alphanumeric
    pattern: /\b[A-Z]{2}[A-Z0-9]{6,7}\b/,
  },
];

// ---------------------------------------------------------------------------
// Date of Birth
// ---------------------------------------------------------------------------

const DOB_PATTERNS: PiiPattern[] = [
  {
    id: 'PII-DOB-001',
    type: 'dob',
    // ISO format: YYYY-MM-DD
    pattern: /\b(?:19|20)[0-9]{2}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12][0-9]|3[01])\b/,
  },
  {
    id: 'PII-DOB-002',
    type: 'dob',
    // US format: MM/DD/YYYY
    pattern: /\b(?:0[1-9]|1[0-2])\/(?:0[1-9]|[12][0-9]|3[01])\/(?:19|20)[0-9]{2}\b/,
  },
  {
    id: 'PII-DOB-003',
    type: 'dob',
    // EU format: DD.MM.YYYY
    pattern: /\b(?:0[1-9]|[12][0-9]|3[01])\.(?:0[1-9]|1[0-2])\.(?:19|20)[0-9]{2}\b/,
  },
  {
    id: 'PII-DOB-004',
    type: 'dob',
    // Written "born on", "date of birth", "dob" keyword patterns
    pattern: /(?:born(?:\s+on)?|date\s+of\s+birth|dob)\s*[:\-]?\s*(?:0?[1-9]|[12][0-9]|3[01])[\s\/\-](?:0?[1-9]|1[0-2])[\s\/\-](?:19|20)[0-9]{2}/i,
  },
];

// ---------------------------------------------------------------------------
// Aggregate export
// ---------------------------------------------------------------------------

/**
 * All built-in PII detection patterns.
 * Total: ≥25 patterns covering email, phone, SSN, credit card, IBAN, IP, MAC,
 * postcodes, passports, and dates of birth.
 */
export const PII_PATTERNS: PiiPattern[] = [
  ...EMAIL_PATTERNS,
  ...PHONE_PATTERNS,
  ...SSN_PATTERNS,
  ...CREDIT_CARD_PATTERNS,
  ...IBAN_PATTERNS,
  ...IP_PATTERNS,
  ...MAC_PATTERNS,
  ...POSTCODE_PATTERNS,
  ...SIN_PATTERNS,
  ...PASSPORT_PATTERNS,
  ...DOB_PATTERNS,
];
