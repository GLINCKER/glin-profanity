/**
 * Secrets scanner — detects leaked credentials, API keys, and tokens.
 *
 * @module scanners/secrets
 */

import type { Scanner, ScanResult, ScanContext, ScanMatch } from './base';
import { allowResult, blockResult } from './base';
import { SECRET_PATTERNS, type SecretPattern } from './patterns/secret-patterns';
import type { Vault } from './vault';

// ---------------------------------------------------------------------------
// Shannon entropy
// ---------------------------------------------------------------------------

/**
 * Compute Shannon entropy (base-2) of a string.
 * Returns a value in [0, log2(alphabet_size)].
 */
function shannonEntropy(s: string): number {
  if (s.length === 0) return 0;
  const freq: Map<string, number> = new Map();
  for (const ch of s) {
    freq.set(ch, (freq.get(ch) ?? 0) + 1);
  }
  let entropy = 0;
  for (const count of freq.values()) {
    const p = count / s.length;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

// ---------------------------------------------------------------------------
// Options & public types
// ---------------------------------------------------------------------------

/** Configuration for SecretsScanner. */
export interface SecretsOptions {
  /**
   * When true, replace detected secrets with vault placeholders in
   * `ScanResult.sanitized`. Requires `vault` to also be provided.
   */
  redact?: boolean;
  /**
   * Vault instance used to store originals when `redact` is true.
   * If `redact` is true and no vault is provided, a local ephemeral vault
   * is created per scan (no external restore possible).
   */
  vault?: Vault;
  /** Extra patterns merged with the built-in set. */
  customPatterns?: SecretPattern[];
  /**
   * Minimum Shannon entropy required for patterns with `entropyCheck: true`.
   * Default: 4.0
   */
  minEntropy?: number;
  /**
   * When true (default), any detected secret causes a BLOCK decision.
   * When false, the scanner will score proportionally (useful for HITL workflows).
   */
  blockOnAny?: boolean;
  /** Score threshold for BLOCK decision (default: 0.8). */
  blockAt?: number;
  /** Score threshold for HITL decision (default: 0.5). */
  hitlAt?: number;
}

// ---------------------------------------------------------------------------
// SecretsScanner
// ---------------------------------------------------------------------------

/**
 * Scanner that detects secrets, API keys, and credentials in text.
 *
 * Implements the unified `Scanner` interface.
 */
export class SecretsScanner implements Scanner {
  /** @inheritdoc */
  readonly name = 'secrets';

  private readonly patterns: SecretPattern[];
  private readonly options: Required<Omit<SecretsOptions, 'vault' | 'customPatterns'>> & {
    vault?: Vault;
  };

  constructor(options: SecretsOptions = {}) {
    this.patterns = [...SECRET_PATTERNS, ...(options.customPatterns ?? [])];
    this.options = {
      redact: options.redact ?? false,
      vault: options.vault,
      minEntropy: options.minEntropy ?? 4.0,
      blockOnAny: options.blockOnAny ?? true,
      blockAt: options.blockAt ?? 0.8,
      hitlAt: options.hitlAt ?? 0.5,
    };
  }

  /** @inheritdoc */
  scan(input: string, _ctx?: ScanContext): ScanResult {
    const matches: ScanMatch[] = [];
    const reasons: string[] = [];
    let sanitized = input;

    for (const entry of this.patterns) {
      const flags = entry.pattern.flags.includes('g')
        ? entry.pattern.flags
        : entry.pattern.flags + 'g';
      const re = new RegExp(entry.pattern.source, flags);
      let m: RegExpExecArray | null;

      while ((m = re.exec(input)) !== null) {
        // For patterns with capture groups, prefer group 1 for entropy check
        const token = m[1] ?? m[0];

        if (entry.entropyCheck) {
          const entropy = shannonEntropy(token);
          if (entropy < this.options.minEntropy) {
            if (m[0].length === 0) break;
            continue;
          }
        }

        matches.push({
          pattern: entry.id,
          startIndex: m.index,
          endIndex: m.index + m[0].length,
          category: entry.severity,
        });

        if (!reasons.includes(entry.name)) {
          reasons.push(entry.name);
        }

        if (m[0].length === 0) break;
      }
    }

    if (matches.length === 0) {
      return allowResult(this.name, input);
    }

    // Redact if requested
    if (this.options.redact) {
      sanitized = this.redactInput(input, matches);
    }

    const score = this.options.blockOnAny ? 1.0 : Math.min(1, matches.length / 5);

    const result = blockResult(
      this.name,
      sanitized,
      score,
      reasons,
      matches,
      this.options.blockAt,
      this.options.hitlAt,
    );

    // blockResult sets sanitized to `input` — override with our redacted version
    return { ...result, sanitized };
  }

  private redactInput(input: string, matches: ScanMatch[]): string {
    // Sort descending by startIndex so we can splice from the end
    const sorted = [...matches].sort((a, b) => b.startIndex - a.startIndex);

    let result = input;
    for (const m of sorted) {
      const original = input.slice(m.startIndex, m.endIndex);
      // Derive the type label from the pattern id (e.g. "SEC-AWS-001" → "AWS_SECRET")
      const typeLabel = m.category.toUpperCase() + '_SECRET';
      const vault = this.options.vault;
      const placeholder = vault
        ? vault.store(typeLabel, original)
        : `[REDACTED_${typeLabel}]`;
      result = result.slice(0, m.startIndex) + placeholder + result.slice(m.endIndex);
    }
    return result;
  }
}

// ---------------------------------------------------------------------------
// Convenience function
// ---------------------------------------------------------------------------

/**
 * Scan a single string for secrets using configurable options.
 *
 * @param input   - The text to scan.
 * @param options - Optional scanner configuration.
 * @returns A `ScanResult` with decision, score, and match details.
 */
export function scanSecrets(input: string, options?: SecretsOptions): ScanResult {
  return new SecretsScanner(options).scan(input);
}
