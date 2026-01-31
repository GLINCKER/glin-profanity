/**
 * Next.js Middleware and Utilities for glin-profanity
 *
 * Provides middleware, API route helpers, and React components
 * for integrating profanity detection in Next.js applications.
 *
 * @example
 * ```typescript
 * // middleware.ts
 * import { createProfanityMiddleware } from 'glin-profanity/nextjs';
 *
 * export const middleware = createProfanityMiddleware({
 *   paths: ['/api/chat', '/api/comments'],
 *   blockProfanity: true,
 * });
 *
 * // API Route
 * import { withProfanityCheck } from 'glin-profanity/nextjs';
 *
 * export const POST = withProfanityCheck(async (req, profanityResult) => {
 *   if (profanityResult.blocked) {
 *     return Response.json({ error: profanityResult.reason }, { status: 400 });
 *   }
 *   // Continue processing...
 * });
 * ```
 *
 * @packageDocumentation
 * @module glin-profanity/nextjs
 */

import { Filter } from '../filters/Filter';
import type { FilterConfig, Language, CheckProfanityResult } from '../types/types';

/**
 * Middleware configuration
 */
export interface ProfanityMiddlewareConfig {
  /** Paths to check (glob patterns supported) */
  paths?: string[];
  /** Paths to exclude */
  excludePaths?: string[];
  /** Block requests with profanity (return 400) */
  blockProfanity?: boolean;
  /** Add profanity result to request headers */
  addHeaders?: boolean;
  /** Custom response for blocked requests */
  blockedResponse?: {
    status?: number;
    message?: string;
  };
  /** Fields in request body to check */
  checkFields?: string[];
  /** Filter configuration */
  filterConfig?: Partial<FilterConfig>;
}

/**
 * Profanity check result for middleware
 */
export interface MiddlewareProfanityResult {
  /** Whether the request was blocked */
  blocked: boolean;
  /** Reason for blocking (if blocked) */
  reason?: string;
  /** Profane words found */
  profaneWords: string[];
  /** Fields that contained profanity */
  flaggedFields: string[];
  /** Full check result */
  checkResult?: CheckProfanityResult;
}

/**
 * Creates a Filter instance
 */
function createFilter(config?: Partial<FilterConfig>): Filter {
  return new Filter({
    languages: (config?.languages || ['english']) as Language[],
    detectLeetspeak: config?.detectLeetspeak ?? true,
    normalizeUnicode: config?.normalizeUnicode ?? true,
    severityLevels: true,
    cacheResults: true,
    ...config,
  });
}

/**
 * Check if path matches pattern (simple glob)
 */
function matchPath(path: string, pattern: string): boolean {
  const regexPattern = pattern
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp(`^${regexPattern}$`).test(path);
}

/**
 * Extract text from nested object by field path
 */
function getNestedValue(obj: unknown, path: string): string | undefined {
  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return typeof current === 'string' ? current : undefined;
}

/**
 * Creates Next.js middleware for profanity detection
 *
 * @example
 * ```typescript
 * // middleware.ts
 * import { createProfanityMiddleware } from 'glin-profanity/nextjs';
 *
 * export const middleware = createProfanityMiddleware({
 *   paths: ['/api/chat', '/api/comments/*'],
 *   blockProfanity: true,
 *   checkFields: ['message', 'content', 'text'],
 * });
 *
 * export const config = {
 *   matcher: ['/api/:path*'],
 * };
 * ```
 */
export function createProfanityMiddleware(config: ProfanityMiddlewareConfig = {}) {
  const {
    paths = ['/api/*'],
    excludePaths = [],
    blockProfanity = true,
    addHeaders = true,
    blockedResponse = { status: 400, message: 'Request contains inappropriate content' },
    checkFields = ['message', 'content', 'text', 'body', 'comment'],
    filterConfig,
  } = config;

  const filter = createFilter(filterConfig);

  return async function middleware(request: Request) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Check if path should be processed
    const shouldProcess = paths.some((p) => matchPath(pathname, p));
    const shouldExclude = excludePaths.some((p) => matchPath(pathname, p));

    if (!shouldProcess || shouldExclude) {
      return undefined; // Continue to next middleware
    }

    // Only check POST, PUT, PATCH requests with body
    const method = request.method.toUpperCase();
    if (!['POST', 'PUT', 'PATCH'].includes(method)) {
      return undefined;
    }

    try {
      // Clone request to read body
      const clonedRequest = request.clone();
      const body = await clonedRequest.json();

      const flaggedFields: string[] = [];
      const allProfaneWords: string[] = [];

      // Check each field
      for (const field of checkFields) {
        const value = getNestedValue(body, field);
        if (value) {
          const result = filter.checkProfanity(value);
          if (result.containsProfanity) {
            flaggedFields.push(field);
            allProfaneWords.push(...result.profaneWords);
          }
        }
      }

      const containsProfanity = flaggedFields.length > 0;

      // Block if configured
      if (containsProfanity && blockProfanity) {
        return new Response(
          JSON.stringify({
            error: blockedResponse.message,
            flaggedFields,
            profaneWords: [...new Set(allProfaneWords)],
          }),
          {
            status: blockedResponse.status || 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Add headers if configured
      if (addHeaders) {
        const headers = new Headers();
        headers.set('X-Profanity-Detected', containsProfanity.toString());
        if (containsProfanity) {
          headers.set('X-Profanity-Fields', flaggedFields.join(','));
          headers.set('X-Profanity-Words', [...new Set(allProfaneWords)].join(','));
        }
        // Return response with headers (Next.js middleware pattern)
        return new Response(null, { headers });
      }

      return undefined;
    } catch {
      // If body parsing fails, continue
      return undefined;
    }
  };
}

/**
 * Higher-order function to wrap API route handlers with profanity checking
 *
 * @example
 * ```typescript
 * // app/api/chat/route.ts
 * import { withProfanityCheck } from 'glin-profanity/nextjs';
 *
 * export const POST = withProfanityCheck(
 *   async (req, profanityResult) => {
 *     if (profanityResult.blocked) {
 *       return Response.json({ error: profanityResult.reason }, { status: 400 });
 *     }
 *
 *     const { message } = await req.json();
 *     // Process message...
 *     return Response.json({ success: true });
 *   },
 *   {
 *     checkFields: ['message'],
 *     blockProfanity: false, // Handle manually
 *   }
 * );
 * ```
 */
export function withProfanityCheck<T>(
  handler: (request: Request, profanityResult: MiddlewareProfanityResult) => Promise<T>,
  config: {
    checkFields?: string[];
    blockProfanity?: boolean;
    filterConfig?: Partial<FilterConfig>;
  } = {}
) {
  const {
    checkFields = ['message', 'content', 'text', 'body'],
    blockProfanity = true,
    filterConfig,
  } = config;

  const filter = createFilter(filterConfig);

  return async (request: Request): Promise<T | Response> => {
    try {
      const clonedRequest = request.clone();
      const body = await clonedRequest.json();

      const flaggedFields: string[] = [];
      const allProfaneWords: string[] = [];
      let lastCheckResult: CheckProfanityResult | undefined;

      for (const field of checkFields) {
        const value = getNestedValue(body, field);
        if (value) {
          const result = filter.checkProfanity(value);
          lastCheckResult = result;
          if (result.containsProfanity) {
            flaggedFields.push(field);
            allProfaneWords.push(...result.profaneWords);
          }
        }
      }

      const containsProfanity = flaggedFields.length > 0;

      const profanityResult: MiddlewareProfanityResult = {
        blocked: containsProfanity && blockProfanity,
        reason: containsProfanity
          ? `Profanity detected in fields: ${flaggedFields.join(', ')}`
          : undefined,
        profaneWords: [...new Set(allProfaneWords)],
        flaggedFields,
        checkResult: lastCheckResult,
      };

      if (profanityResult.blocked) {
        return new Response(
          JSON.stringify({
            error: 'Request contains inappropriate content',
            flaggedFields: profanityResult.flaggedFields,
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      return handler(request, profanityResult);
    } catch {
      // If parsing fails, call handler with empty result
      return handler(request, {
        blocked: false,
        profaneWords: [],
        flaggedFields: [],
      });
    }
  };
}

/**
 * Server action wrapper for profanity checking
 *
 * @example
 * ```typescript
 * // actions.ts
 * 'use server';
 * import { createServerAction } from 'glin-profanity/nextjs';
 *
 * export const submitComment = createServerAction(
 *   async (data: { comment: string }) => {
 *     // Save to database
 *     await db.comments.create({ data });
 *     return { success: true };
 *   },
 *   {
 *     checkFields: ['comment'],
 *     onProfanity: (result) => {
 *       return { error: 'Please remove inappropriate language' };
 *     },
 *   }
 * );
 * ```
 */
export function createServerAction<TInput extends Record<string, unknown>, TOutput>(
  action: (data: TInput) => Promise<TOutput>,
  config: {
    checkFields?: string[];
    filterConfig?: Partial<FilterConfig>;
    onProfanity?: (result: MiddlewareProfanityResult) => TOutput;
  } = {}
) {
  const {
    checkFields = ['message', 'content', 'text', 'comment'],
    filterConfig,
    onProfanity,
  } = config;

  const filter = createFilter(filterConfig);

  return async (data: TInput): Promise<TOutput> => {
    const flaggedFields: string[] = [];
    const allProfaneWords: string[] = [];

    for (const field of checkFields) {
      const value = getNestedValue(data, field);
      if (value) {
        const result = filter.checkProfanity(value);
        if (result.containsProfanity) {
          flaggedFields.push(field);
          allProfaneWords.push(...result.profaneWords);
        }
      }
    }

    if (flaggedFields.length > 0) {
      const profanityResult: MiddlewareProfanityResult = {
        blocked: true,
        reason: `Profanity detected in: ${flaggedFields.join(', ')}`,
        profaneWords: [...new Set(allProfaneWords)],
        flaggedFields,
      };

      if (onProfanity) {
        return onProfanity(profanityResult);
      }

      throw new Error(profanityResult.reason);
    }

    return action(data);
  };
}

/**
 * Utility functions for use in API routes
 */
export const profanityUtils = {
  /**
   * Quick check for profanity in a single string
   */
  check(text: string, config?: Partial<FilterConfig>): CheckProfanityResult {
    const filter = createFilter(config);
    return filter.checkProfanity(text);
  },

  /**
   * Check and optionally censor text
   */
  censor(text: string, replacement = '***', config?: Partial<FilterConfig>): string {
    const filter = createFilter({ ...config, replaceWith: replacement });
    const result = filter.checkProfanity(text);
    return result.processedText || text;
  },

  /**
   * Check multiple fields in an object
   */
  checkObject(
    obj: Record<string, unknown>,
    fields: string[],
    config?: Partial<FilterConfig>
  ): { containsProfanity: boolean; flaggedFields: string[]; profaneWords: string[] } {
    const filter = createFilter(config);
    const flaggedFields: string[] = [];
    const profaneWords: string[] = [];

    for (const field of fields) {
      const value = getNestedValue(obj, field);
      if (value) {
        const result = filter.checkProfanity(value);
        if (result.containsProfanity) {
          flaggedFields.push(field);
          profaneWords.push(...result.profaneWords);
        }
      }
    }

    return {
      containsProfanity: flaggedFields.length > 0,
      flaggedFields,
      profaneWords: [...new Set(profaneWords)],
    };
  },
};

export type { CheckProfanityResult, FilterConfig, Language };
