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
