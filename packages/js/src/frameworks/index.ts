/**
 * Framework Integrations for glin-profanity
 *
 * This module provides framework-specific integrations
 * for popular web frameworks like Next.js, Remix, etc.
 *
 * @example
 * ```typescript
 * // Next.js
 * import { createProfanityMiddleware } from 'glin-profanity/nextjs';
 *
 * // Or import all frameworks
 * import { nextjs } from 'glin-profanity/frameworks';
 * ```
 *
 * @packageDocumentation
 * @module glin-profanity/frameworks
 */

// Next.js exports
export {
  createProfanityMiddleware,
  withProfanityCheck,
  createServerAction,
  profanityUtils,
  type ProfanityMiddlewareConfig,
  type MiddlewareProfanityResult,
} from './nextjs';

// Re-export common types
export type { CheckProfanityResult, FilterConfig, Language } from '../types/types';
