/**
 * Scanner sub-package for glin-profanity.
 *
 * Re-exports the Scanner interface and all built-in scanner implementations.
 *
 * @module scanners
 */

export type {
  ScanDecision,
  ScanResult,
  ScanMatch,
  Scanner,
  ScanContext,
} from './base';

export { allowResult, blockResult } from './base';

export type { PromptInjectionOptions } from './prompt-injection';

export {
  PromptInjectionScanner,
  defaultPromptInjectionScanner,
  checkPromptInjection,
} from './prompt-injection';

export type { InjectionPattern, InjectionCategory, PatternSeverity } from './patterns/injection-patterns';
export { INJECTION_PATTERNS } from './patterns/injection-patterns';

// Secrets scanner
export type { SecretsOptions } from './secrets';
export { SecretsScanner, scanSecrets } from './secrets';
export type { SecretPattern, SecretSeverity } from './patterns/secret-patterns';
export { SECRET_PATTERNS } from './patterns/secret-patterns';

// PII scanner
export type { PiiOptions } from './pii';
export { PiiScanner, scanPii } from './pii';
export type { PiiPattern, PiiType } from './patterns/pii-patterns';
export { PII_PATTERNS, luhnCheck, ibanCheck } from './patterns/pii-patterns';

// Vault
export type { RestoreStrategy } from './vault';
export { Vault } from './vault';
