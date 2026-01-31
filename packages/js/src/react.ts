/**
 * React integration for glin-profanity
 *
 * @packageDocumentation
 * @module glin-profanity/react
 *
 * @example
 * ```tsx
 * import { useProfanityChecker } from 'glin-profanity/react';
 *
 * function MyComponent() {
 *   const { checkText, isProfane, censor } = useProfanityChecker({
 *     languages: ['english'],
 *     detectLeetspeak: true,
 *   });
 *
 *   return <input onChange={(e) => console.log(isProfane(e.target.value))} />;
 * }
 * ```
 */

export { useProfanityChecker } from './hooks/useProfanityChecker';
