/**
 * Vault — stores redacted originals and restores them after pipeline processing.
 *
 * Design ported from ProtectAI/llm-guard (MIT) — rewritten in TypeScript.
 * Supports four restore strategies: exact, caseInsensitive, fuzzy, combined.
 *
 * @module scanners/vault
 */

/** A single entry stored in the vault. */
interface VaultEntry {
  /** Placeholder token used in sanitized text, e.g. "[REDACTED_EMAIL_1]". */
  placeholder: string;
  /** The original sensitive value. */
  original: string;
  /** Type string, e.g. "EMAIL", used in placeholder construction. */
  type: string;
}

/** Strategy for matching placeholders back to originals when restoring. */
export type RestoreStrategy = 'exact' | 'caseInsensitive' | 'fuzzy' | 'combined';

/**
 * Levenshtein edit distance between two strings.
 * Used by the `fuzzy` restore strategy (tolerance ≤ 3).
 */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (__, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

/**
 * Vault stores placeholder→original mappings produced during redaction and
 * replaces placeholders with originals when text leaves the pipeline.
 *
 * Inspired by ProtectAI/llm-guard vault.py (MIT).
 */
export class Vault {
  private entries: VaultEntry[] = [];
  /** Counters per type so each new entry gets a unique sequential number. */
  private counters: Map<string, number> = new Map();

  /**
   * Store an original value and return a unique placeholder string.
   *
   * @param type   - PII/secret type label (will be upper-cased), e.g. "email".
   * @param original - The raw sensitive value to redact.
   * @returns The placeholder token, e.g. "[REDACTED_EMAIL_1]".
   */
  store(type: string, original: string): string {
    const normalizedType = type.toUpperCase().replace(/[^A-Z0-9]/g, '_');
    const count = (this.counters.get(normalizedType) ?? 0) + 1;
    this.counters.set(normalizedType, count);
    const placeholder = `[REDACTED_${normalizedType}_${count}]`;
    this.entries.push({ placeholder, original, type: normalizedType });
    return placeholder;
  }

  /**
   * Replace all placeholders in `text` with their original values.
   *
   * @param text     - The sanitized text containing placeholder tokens.
   * @param strategy - How to match placeholders (default: `'exact'`).
   * @returns The restored text with originals substituted back.
   */
  restore(text: string, strategy: RestoreStrategy = 'exact'): string {
    let result = text;

    for (const entry of this.entries) {
      switch (strategy) {
        case 'exact':
          result = result.split(entry.placeholder).join(entry.original);
          break;

        case 'caseInsensitive': {
          const re = new RegExp(escapeRegex(entry.placeholder), 'gi');
          result = result.replace(re, entry.original);
          break;
        }

        case 'fuzzy': {
          result = fuzzyReplace(result, entry.placeholder, entry.original, 3);
          break;
        }

        case 'combined': {
          // Try exact first, then case-insensitive, then fuzzy
          if (result.includes(entry.placeholder)) {
            result = result.split(entry.placeholder).join(entry.original);
          } else {
            const reCI = new RegExp(escapeRegex(entry.placeholder), 'gi');
            if (reCI.test(result)) {
              result = result.replace(reCI, entry.original);
            } else {
              result = fuzzyReplace(result, entry.placeholder, entry.original, 3);
            }
          }
          break;
        }
      }
    }

    return result;
  }

  /** Remove all stored entries and reset counters. */
  clear(): void {
    this.entries = [];
    this.counters = new Map();
  }

  /** Number of entries currently stored. */
  size(): number {
    return this.entries.length;
  }

  /**
   * Retrieve a snapshot of all current entries (read-only copy).
   * Useful for serialisation or inspection.
   */
  getEntries(): ReadonlyArray<Readonly<VaultEntry>> {
    return this.entries.map(e => ({ ...e }));
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Escape a string for use inside a RegExp. */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Perform a fuzzy replacement in `text`, substituting `needle` with
 * `replacement` whenever a window of the same length as `needle` has
 * Levenshtein distance ≤ `tolerance`.
 *
 * Complexity: O(|text| * |needle|^2) — acceptable for typical prompt sizes.
 */
function fuzzyReplace(text: string, needle: string, replacement: string, tolerance: number): string {
  if (needle.length === 0) return text;

  const n = needle.length;
  let result = '';
  let i = 0;

  while (i < text.length) {
    // Try to extract a window of length n (or shorter at end)
    const window = text.slice(i, i + n);
    if (window.length < Math.floor(n / 2)) {
      // Too short for meaningful fuzzy match
      result += text.slice(i);
      break;
    }

    // Fast-path: if the window's first character differs from needle's first
    // character by more than `tolerance` character codes, the Levenshtein
    // distance can only be >= 1 (from the first char alone). For tolerance ≤ 3
    // we can skip the full DP entirely when the first chars are clearly
    // different (i.e. not equal), saving O(n^2) work per position.
    if (window[0] !== needle[0]) {
      result += text[i];
      i++;
      continue;
    }

    const dist = levenshtein(window, needle);
    if (dist <= tolerance) {
      result += replacement;
      i += window.length;
    } else {
      result += text[i];
      i++;
    }
  }

  return result;
}
