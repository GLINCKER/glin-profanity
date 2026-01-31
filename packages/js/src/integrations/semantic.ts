/**
 * Semantic Analysis Hooks for glin-profanity
 *
 * Provides hooks and utilities for combining profanity detection with
 * semantic analysis using embeddings. Useful for advanced content moderation
 * that goes beyond keyword matching.
 *
 * @example
 * ```typescript
 * import { createSemanticAnalyzer } from 'glin-profanity/ai/semantic';
 *
 * const analyzer = createSemanticAnalyzer({
 *   embeddingProvider: async (text) => {
 *     // Your embedding provider (OpenAI, Cohere, etc.)
 *     const response = await openai.embeddings.create({
 *       model: 'text-embedding-3-small',
 *       input: text,
 *     });
 *     return response.data[0].embedding;
 *   },
 * });
 *
 * const result = await analyzer.analyze('This is a test message');
 * console.log(result.combinedScore); // 0.0 - 1.0
 * ```
 *
 * @packageDocumentation
 * @module glin-profanity/ai/semantic
 */

import { Filter } from '../filters/Filter';
import type { FilterConfig, Language, CheckProfanityResult } from '../types/types';

/**
 * Embedding provider function type
 */
export type EmbeddingProvider = (text: string) => Promise<number[]>;

/**
 * Semantic analyzer configuration
 */
export interface SemanticAnalyzerConfig {
  /** Function to generate embeddings for text */
  embeddingProvider: EmbeddingProvider;
  /** Base filter configuration */
  filterConfig?: Partial<FilterConfig>;
  /** Weight for keyword-based detection (0-1). Default: 0.6 */
  keywordWeight?: number;
  /** Weight for semantic similarity (0-1). Default: 0.4 */
  semanticWeight?: number;
  /** Threshold for flagging content (0-1). Default: 0.5 */
  threshold?: number;
  /** Reference toxic content embeddings for comparison */
  toxicReferenceEmbeddings?: number[][];
}

/**
 * Semantic analysis result
 */
export interface SemanticAnalysisResult {
  /** Combined moderation score (0-1, higher = more problematic) */
  combinedScore: number;
  /** Keyword-based profanity score (0-1) */
  keywordScore: number;
  /** Semantic similarity score to toxic content (0-1) */
  semanticScore: number;
  /** Whether content should be flagged based on threshold */
  shouldFlag: boolean;
  /** Detailed profanity check result */
  profanityResult: CheckProfanityResult;
  /** Breakdown of scoring components */
  breakdown: {
    profaneWordCount: number;
    averageSeverity: number;
    maxSemanticSimilarity: number;
    contextScore?: number;
  };
}

/**
 * Pre-defined toxic content patterns for semantic comparison
 */
const DEFAULT_TOXIC_PATTERNS = [
  'I hate you and want to hurt you',
  'You are worthless and should die',
  'Kill yourself you piece of garbage',
  'I will find you and destroy you',
  'You deserve to suffer',
  'Nobody likes you, go away',
  'This is disgusting and offensive',
  'Shut up you idiot',
];

/**
 * Calculates cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  if (magnitude === 0) return 0;

  return dotProduct / magnitude;
}

/**
 * Creates a Filter instance with the given configuration
 */
function createFilter(config?: Partial<FilterConfig>): Filter {
  return new Filter({
    languages: (config?.languages || ['english']) as Language[],
    detectLeetspeak: config?.detectLeetspeak ?? true,
    normalizeUnicode: config?.normalizeUnicode ?? true,
    enableContextAware: config?.enableContextAware ?? true,
    contextWindow: config?.contextWindow ?? 3,
    confidenceThreshold: config?.confidenceThreshold ?? 0.7,
    severityLevels: true,
    cacheResults: true,
  });
}

/**
 * Creates a semantic analyzer that combines keyword-based profanity detection
 * with embedding-based semantic analysis.
 *
 * @example
 * ```typescript
 * import OpenAI from 'openai';
 * import { createSemanticAnalyzer } from 'glin-profanity/ai/semantic';
 *
 * const openai = new OpenAI();
 *
 * const analyzer = createSemanticAnalyzer({
 *   embeddingProvider: async (text) => {
 *     const response = await openai.embeddings.create({
 *       model: 'text-embedding-3-small',
 *       input: text,
 *     });
 *     return response.data[0].embedding;
 *   },
 *   keywordWeight: 0.6,
 *   semanticWeight: 0.4,
 *   threshold: 0.5,
 * });
 *
 * const result = await analyzer.analyze('Hello world');
 * console.log(result.shouldFlag); // false
 * ```
 */
export function createSemanticAnalyzer(config: SemanticAnalyzerConfig) {
  const {
    embeddingProvider,
    filterConfig,
    keywordWeight = 0.6,
    semanticWeight = 0.4,
    threshold = 0.5,
  } = config;

  // Normalize weights
  const totalWeight = keywordWeight + semanticWeight;
  const normalizedKeywordWeight = keywordWeight / totalWeight;
  const normalizedSemanticWeight = semanticWeight / totalWeight;

  const filter = createFilter(filterConfig);

  // Cache for reference embeddings
  let toxicEmbeddingsCache: number[][] | null = config.toxicReferenceEmbeddings || null;

  return {
    /**
     * Analyze text for both keyword profanity and semantic toxicity
     */
    async analyze(text: string): Promise<SemanticAnalysisResult> {
      // Step 1: Keyword-based profanity check
      const profanityResult = filter.checkProfanity(text);

      // Calculate keyword score
      let keywordScore = 0;
      if (profanityResult.containsProfanity) {
        const profaneWordCount = profanityResult.profaneWords.length;
        const wordCount = text.split(/\s+/).length;
        const density = Math.min(profaneWordCount / wordCount, 1);

        // Calculate average severity
        let totalSeverity = 0;
        if (profanityResult.severityMap) {
          const severities = Object.values(profanityResult.severityMap);
          totalSeverity = severities.reduce((sum, s) => sum + s, 0) / severities.length;
        } else {
          totalSeverity = 1; // Default severity for exact matches
        }

        // Combine density and severity (each contributes 50%)
        keywordScore = (density * 0.5) + (totalSeverity / 2 * 0.5);
      }

      // Step 2: Semantic analysis
      let semanticScore = 0;
      let maxSemanticSimilarity = 0;

      try {
        // Get embedding for input text
        const inputEmbedding = await embeddingProvider(text);

        // Initialize toxic embeddings if not cached
        if (!toxicEmbeddingsCache) {
          toxicEmbeddingsCache = await Promise.all(
            DEFAULT_TOXIC_PATTERNS.map(pattern => embeddingProvider(pattern))
          );
        }

        // Calculate similarity to each toxic pattern
        const similarities = toxicEmbeddingsCache.map(toxicEmbed =>
          cosineSimilarity(inputEmbedding, toxicEmbed)
        );

        maxSemanticSimilarity = Math.max(...similarities);

        // Normalize to 0-1 scale (cosine similarity ranges from -1 to 1)
        // We only care about positive similarity
        semanticScore = Math.max(0, maxSemanticSimilarity);
      } catch (error) {
        // If embedding fails, rely solely on keyword detection
        console.warn('Semantic analysis failed, using keyword detection only:', error);
        semanticScore = 0;
      }

      // Step 3: Combine scores
      const combinedScore =
        (keywordScore * normalizedKeywordWeight) +
        (semanticScore * normalizedSemanticWeight);

      // Calculate average severity for breakdown
      let averageSeverity = 0;
      if (profanityResult.severityMap) {
        const severities = Object.values(profanityResult.severityMap);
        if (severities.length > 0) {
          averageSeverity = severities.reduce((sum, s) => sum + s, 0) / severities.length;
        }
      }

      return {
        combinedScore,
        keywordScore,
        semanticScore,
        shouldFlag: combinedScore >= threshold,
        profanityResult,
        breakdown: {
          profaneWordCount: profanityResult.profaneWords.length,
          averageSeverity,
          maxSemanticSimilarity,
          contextScore: profanityResult.contextScore,
        },
      };
    },

    /**
     * Batch analyze multiple texts
     */
    async analyzeBatch(texts: string[]): Promise<SemanticAnalysisResult[]> {
      return Promise.all(texts.map(text => this.analyze(text)));
    },

    /**
     * Add custom toxic reference patterns
     */
    async addToxicPatterns(patterns: string[]): Promise<void> {
      const newEmbeddings = await Promise.all(
        patterns.map(pattern => embeddingProvider(pattern))
      );

      if (toxicEmbeddingsCache) {
        toxicEmbeddingsCache = [...toxicEmbeddingsCache, ...newEmbeddings];
      } else {
        toxicEmbeddingsCache = newEmbeddings;
      }
    },

    /**
     * Clear cached toxic embeddings
     */
    clearCache(): void {
      toxicEmbeddingsCache = null;
    },

    /**
     * Get current configuration
     */
    getConfig() {
      return {
        keywordWeight: normalizedKeywordWeight,
        semanticWeight: normalizedSemanticWeight,
        threshold,
        filterConfig: filter.getConfig(),
      };
    },
  };
}

/**
 * Hooks for integrating semantic analysis into application flows
 */
export const semanticHooks = {
  /**
   * Pre-process hook for chat messages
   *
   * @example
   * ```typescript
   * const { shouldBlock, reason, sanitized } = await semanticHooks.preProcessMessage(
   *   message,
   *   analyzer,
   *   { autoSanitize: true }
   * );
   * ```
   */
  async preProcessMessage(
    message: string,
    analyzer: ReturnType<typeof createSemanticAnalyzer>,
    options: { autoSanitize?: boolean; threshold?: number } = {}
  ) {
    const { autoSanitize = false, threshold = 0.5 } = options;
    const result = await analyzer.analyze(message);

    return {
      shouldBlock: result.combinedScore >= threshold,
      reason: result.shouldFlag
        ? `Content flagged: keyword score ${(result.keywordScore * 100).toFixed(1)}%, semantic score ${(result.semanticScore * 100).toFixed(1)}%`
        : undefined,
      sanitized: autoSanitize ? result.profanityResult.processedText || message : message,
      analysis: result,
    };
  },

  /**
   * Post-process hook for AI-generated content
   *
   * @example
   * ```typescript
   * const { isSafe, analysis } = await semanticHooks.postProcessAIResponse(
   *   aiResponse,
   *   analyzer
   * );
   * ```
   */
  async postProcessAIResponse(
    response: string,
    analyzer: ReturnType<typeof createSemanticAnalyzer>
  ) {
    const result = await analyzer.analyze(response);

    return {
      isSafe: !result.shouldFlag,
      analysis: result,
      warnings: result.profanityResult.profaneWords.length > 0
        ? [`AI response contains potentially inappropriate content: ${result.profanityResult.profaneWords.join(', ')}`]
        : [],
    };
  },

  /**
   * Conversation monitoring hook
   *
   * @example
   * ```typescript
   * const monitor = semanticHooks.createConversationMonitor(analyzer);
   * monitor.addMessage('user', 'Hello');
   * monitor.addMessage('assistant', 'Hi there!');
   * const report = await monitor.getReport();
   * ```
   */
  createConversationMonitor(analyzer: ReturnType<typeof createSemanticAnalyzer>) {
    const messages: Array<{ role: string; content: string; timestamp: Date }> = [];
    const analyses: SemanticAnalysisResult[] = [];

    return {
      async addMessage(role: string, content: string) {
        messages.push({ role, content, timestamp: new Date() });
        const analysis = await analyzer.analyze(content);
        analyses.push(analysis);
        return analysis;
      },

      getMessages() {
        return [...messages];
      },

      async getReport() {
        const flaggedCount = analyses.filter(a => a.shouldFlag).length;
        const avgCombinedScore = analyses.length > 0
          ? analyses.reduce((sum, a) => sum + a.combinedScore, 0) / analyses.length
          : 0;

        return {
          totalMessages: messages.length,
          flaggedMessages: flaggedCount,
          averageScore: avgCombinedScore,
          isHealthy: flaggedCount === 0 || flaggedCount / messages.length < 0.1,
          flaggedIndices: analyses
            .map((a, i) => a.shouldFlag ? i : -1)
            .filter(i => i >= 0),
        };
      },

      clear() {
        messages.length = 0;
        analyses.length = 0;
      },
    };
  },
};

/**
 * Configuration for creating a fetch-based embedding provider
 */
export interface FetchEmbeddingProviderConfig {
  /** API key for authentication (optional for local models) */
  apiKey?: string;
  /** Model name or deployment name - REQUIRED, no defaults to stay model-agnostic */
  model: string;
  /** Base URL for the API (default: https://api.openai.com/v1) */
  baseUrl?: string;
  /** Endpoint path (default: /embeddings) */
  endpoint?: string;
  /** Custom headers to include in requests */
  headers?: Record<string, string>;
  /** Custom response parser - extracts embedding array from API response */
  parseResponse?: (response: unknown) => number[];
}

/**
 * Utility function to create an embedding provider using fetch
 * Works with any OpenAI-compatible API (OpenAI, Azure, Ollama, vLLM, etc.)
 *
 * @example
 * ```typescript
 * // OpenAI
 * const openaiProvider = createFetchEmbeddingProvider({
 *   apiKey: process.env.OPENAI_API_KEY,
 *   model: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
 * });
 *
 * // Azure OpenAI
 * const azureProvider = createFetchEmbeddingProvider({
 *   apiKey: process.env.AZURE_OPENAI_KEY,
 *   model: process.env.AZURE_EMBEDDING_DEPLOYMENT,
 *   baseUrl: `https://${process.env.AZURE_RESOURCE}.openai.azure.com/openai/deployments/${process.env.AZURE_EMBEDDING_DEPLOYMENT}`,
 *   headers: { 'api-version': '2024-02-01' },
 * });
 *
 * // Local Ollama
 * const ollamaProvider = createFetchEmbeddingProvider({
 *   model: 'nomic-embed-text',
 *   baseUrl: 'http://localhost:11434',
 *   endpoint: '/api/embeddings',
 *   parseResponse: (data) => (data as { embedding: number[] }).embedding,
 * });
 *
 * // Cohere
 * const cohereProvider = createFetchEmbeddingProvider({
 *   apiKey: process.env.COHERE_API_KEY,
 *   model: 'embed-english-v3.0',
 *   baseUrl: 'https://api.cohere.ai/v1',
 *   endpoint: '/embed',
 *   parseResponse: (data) => (data as { embeddings: number[][] }).embeddings[0],
 * });
 *
 * const analyzer = createSemanticAnalyzer({ embeddingProvider: openaiProvider });
 * ```
 */
export function createFetchEmbeddingProvider(config: FetchEmbeddingProviderConfig): EmbeddingProvider {
  const {
    apiKey,
    model,
    baseUrl = 'https://api.openai.com/v1',
    endpoint = '/embeddings',
    headers = {},
    parseResponse,
  } = config;

  // Default response parser for OpenAI-compatible format
  const defaultParseResponse = (data: unknown): number[] => {
    const d = data as { data?: Array<{ embedding?: number[] }> };
    if (d.data?.[0]?.embedding) {
      return d.data[0].embedding;
    }
    // Fallback for other common formats
    const anyData = data as { embedding?: number[]; embeddings?: number[][] };
    if (anyData.embedding) return anyData.embedding;
    if (anyData.embeddings?.[0]) return anyData.embeddings[0];
    throw new Error('Could not extract embedding from response. Provide a custom parseResponse function.');
  };

  return async (text: string): Promise<number[]> => {
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (apiKey) {
      requestHeaders['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify({
        model,
        input: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`Embedding API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return parseResponse ? parseResponse(data) : defaultParseResponse(data);
  };
}

/**
 * @deprecated Use createFetchEmbeddingProvider instead for better flexibility
 */
export function createOpenAIEmbeddingProvider(config: {
  apiKey: string;
  model: string;
  baseUrl?: string;
}): EmbeddingProvider {
  return createFetchEmbeddingProvider(config);
}

export type { CheckProfanityResult, FilterConfig, Language };
