/**
 * Transformers.js ML Integration for glin-profanity
 *
 * Provides ML-based profanity detection using Hugging Face models
 * via transformers.js. This is an optional enhancement that adds
 * context-aware detection on top of the dictionary-based approach.
 *
 * @example
 * ```typescript
 * import { createMLChecker, createHybridChecker } from 'glin-profanity/ml/transformers';
 *
 * // ML-only checker
 * const mlChecker = await createMLChecker({
 *   model: 'tarekziade/pardonmyai',
 * });
 * const result = await mlChecker.check('Some text to check');
 *
 * // Hybrid: Dictionary + ML (recommended)
 * const hybridChecker = await createHybridChecker({
 *   model: 'tarekziade/pardonmyai',
 *   mlThreshold: 0.7, // Only use ML if dictionary is uncertain
 * });
 * const result = await hybridChecker.check('Some text to check');
 * ```
 *
 * @packageDocumentation
 * @module glin-profanity/ml/transformers
 */

import { Filter } from '../filters/Filter';
import type { FilterConfig, Language, CheckProfanityResult } from '../types/types';

/**
 * Transformers.js types (minimal interface to avoid hard dependency)
 */
interface Pipeline {
  (text: string | string[]): Promise<Array<{ label: string; score: number }>>;
}

interface TransformersModule {
  pipeline: (task: string, model: string, options?: Record<string, unknown>) => Promise<Pipeline>;
}

/**
 * ML checker configuration
 */
export interface MLCheckerConfig {
  /** Hugging Face model ID */
  model?: string;
  /** Confidence threshold (0-1) for flagging as profane */
  threshold?: number;
  /** Label that indicates profanity (model-specific) */
  profaneLabel?: string;
  /** Use quantized model for smaller size */
  quantized?: boolean;
  /** Device to run on ('cpu', 'webgpu', etc.) */
  device?: string;
}

/**
 * Hybrid checker configuration
 */
export interface HybridCheckerConfig extends MLCheckerConfig {
  /** Filter configuration for dictionary-based checking */
  filterConfig?: Partial<FilterConfig>;
  /** ML confidence threshold below which to use ML */
  mlThreshold?: number;
  /** Weight for dictionary score (0-1) */
  dictionaryWeight?: number;
  /** Weight for ML score (0-1) */
  mlWeight?: number;
}

/**
 * ML check result
 */
export interface MLCheckResult {
  /** Whether profanity was detected */
  containsProfanity: boolean;
  /** Confidence score (0-1) */
  confidence: number;
  /** Raw model output */
  rawOutput: Array<{ label: string; score: number }>;
  /** Processing time in milliseconds */
  processingTimeMs: number;
}

/**
 * Hybrid check result
 */
export interface HybridCheckResult {
  /** Whether profanity was detected */
  containsProfanity: boolean;
  /** Combined confidence score (0-1) */
  confidence: number;
  /** Dictionary check result */
  dictionaryResult: CheckProfanityResult;
  /** ML check result (if used) */
  mlResult?: MLCheckResult;
  /** Whether ML was used */
  usedML: boolean;
  /** Profane words found (from dictionary) */
  profaneWords: string[];
  /** Processing time in milliseconds */
  processingTimeMs: number;
}

/**
 * Popular profanity detection models on Hugging Face
 */
export const RECOMMENDED_MODELS = {
  /** High accuracy English model (97.5%) - 67M params */
  pardonmyai: 'tarekziade/pardonmyai',
  /** Smaller version for constrained environments */
  pardonmyaiTiny: 'tarekziade/pardonmyai-tiny',
  /** Multilingual toxicity detection (7 languages) */
  toxicBert: 'unitary/toxic-bert',
  /** Offensive speech detector (DeBERTa-based) */
  offensiveSpeech: 'KoalaAI/OffensiveSpeechDetector',
} as const;

/**
 * Model label mappings (what label means "profane/toxic")
 */
const MODEL_PROFANE_LABELS: Record<string, string> = {
  'tarekziade/pardonmyai': 'profane',
  'tarekziade/pardonmyai-tiny': 'profane',
  'unitary/toxic-bert': 'toxic',
  'KoalaAI/OffensiveSpeechDetector': 'LABEL_1', // Offensive
  default: 'LABEL_1',
};

/**
 * Lazy-loads transformers.js
 */
async function getTransformers(): Promise<TransformersModule> {
  try {
    const transformers = await import('@xenova/transformers');
    return transformers as unknown as TransformersModule;
  } catch {
    throw new Error(
      'Transformers.js is required for ML features. Install it with: npm install @xenova/transformers'
    );
  }
}

/**
 * Creates an ML-based profanity checker using transformers.js
 *
 * @example
 * ```typescript
 * const checker = await createMLChecker({
 *   model: 'tarekziade/pardonmyai',
 *   threshold: 0.7,
 * });
 *
 * const result = await checker.check('Hello world');
 * console.log(result.containsProfanity); // false
 * console.log(result.confidence); // 0.02
 *
 * // Batch check
 * const results = await checker.checkBatch(['text1', 'text2', 'text3']);
 *
 * // Clean up
 * checker.dispose();
 * ```
 */
export async function createMLChecker(config: MLCheckerConfig = {}) {
  const {
    model = RECOMMENDED_MODELS.pardonmyai,
    threshold = 0.5,
    profaneLabel = MODEL_PROFANE_LABELS[model] || MODEL_PROFANE_LABELS.default,
    quantized = true,
    device = 'cpu',
  } = config;

  const transformers = await getTransformers();

  // Load the classification pipeline
  const classifier = await transformers.pipeline('text-classification', model, {
    quantized,
    device,
  });

  return {
    /**
     * Check a single text for profanity
     */
    async check(text: string): Promise<MLCheckResult> {
      const startTime = Date.now();

      const output = await classifier(text);
      const processingTimeMs = Date.now() - startTime;

      // Find the profane label score
      const profaneScore = output.find((o) => o.label === profaneLabel)?.score || 0;
      const containsProfanity = profaneScore >= threshold;

      return {
        containsProfanity,
        confidence: profaneScore,
        rawOutput: output,
        processingTimeMs,
      };
    },

    /**
     * Check multiple texts
     */
    async checkBatch(texts: string[]): Promise<MLCheckResult[]> {
      return Promise.all(texts.map((text) => this.check(text)));
    },

    /**
     * Get the profanity score for text (0-1)
     */
    async getScore(text: string): Promise<number> {
      const result = await this.check(text);
      return result.confidence;
    },

    /**
     * Get current configuration
     */
    getConfig() {
      return { model, threshold, profaneLabel, quantized, device };
    },

    /**
     * Dispose of the model (free memory)
     */
    dispose() {
      // Transformers.js handles cleanup automatically
      // But we can help garbage collection
    },
  };
}

/**
 * Creates a hybrid checker that combines dictionary + ML
 *
 * Strategy:
 * 1. Dictionary check first (fast, ~1ms)
 * 2. If dictionary finds profanity → flag immediately
 * 3. If dictionary is clean but text is suspicious → use ML
 * 4. Combine scores with configurable weights
 *
 * @example
 * ```typescript
 * const checker = await createHybridChecker({
 *   model: 'tarekziade/pardonmyai',
 *   filterConfig: { languages: ['english'], detectLeetspeak: true },
 *   mlThreshold: 0.6,
 *   dictionaryWeight: 0.6,
 *   mlWeight: 0.4,
 * });
 *
 * const result = await checker.check('Hello world');
 * console.log(result.containsProfanity);
 * console.log(result.usedML); // true if ML was invoked
 *
 * // Clean up
 * await checker.dispose();
 * ```
 */
export async function createHybridChecker(config: HybridCheckerConfig = {}) {
  const {
    model = RECOMMENDED_MODELS.pardonmyai,
    threshold = 0.5,
    profaneLabel,
    quantized = true,
    device = 'cpu',
    filterConfig = {},
    mlThreshold = 0.3,
    dictionaryWeight = 0.6,
    mlWeight = 0.4,
  } = config;

  // Create dictionary filter
  const filter = new Filter({
    languages: (filterConfig.languages || ['english']) as Language[],
    detectLeetspeak: filterConfig.detectLeetspeak ?? true,
    normalizeUnicode: filterConfig.normalizeUnicode ?? true,
    severityLevels: true,
    cacheResults: true,
    ...filterConfig,
  });

  // Lazy-load ML checker
  let mlChecker: Awaited<ReturnType<typeof createMLChecker>> | null = null;

  async function getMLChecker() {
    if (!mlChecker) {
      mlChecker = await createMLChecker({
        model,
        threshold,
        profaneLabel,
        quantized,
        device,
      });
    }
    return mlChecker;
  }

  return {
    /**
     * Check text using hybrid approach
     */
    async check(text: string): Promise<HybridCheckResult> {
      const startTime = Date.now();

      // Step 1: Dictionary check (always fast)
      const dictionaryResult = filter.checkProfanity(text);

      // If dictionary finds profanity, flag immediately
      if (dictionaryResult.containsProfanity) {
        return {
          containsProfanity: true,
          confidence: 1.0,
          dictionaryResult,
          usedML: false,
          profaneWords: dictionaryResult.profaneWords,
          processingTimeMs: Date.now() - startTime,
        };
      }

      // Step 2: Use ML for uncertain cases
      const ml = await getMLChecker();
      const mlResult = await ml.check(text);

      // Combine scores
      const dictionaryScore = dictionaryResult.containsProfanity ? 1.0 : 0.0;
      const combinedScore =
        dictionaryScore * dictionaryWeight + mlResult.confidence * mlWeight;

      const containsProfanity = combinedScore >= mlThreshold;

      return {
        containsProfanity,
        confidence: combinedScore,
        dictionaryResult,
        mlResult,
        usedML: true,
        profaneWords: dictionaryResult.profaneWords,
        processingTimeMs: Date.now() - startTime,
      };
    },

    /**
     * Check multiple texts
     */
    async checkBatch(texts: string[]): Promise<HybridCheckResult[]> {
      return Promise.all(texts.map((text) => this.check(text)));
    },

    /**
     * Dictionary-only check (fast, no ML)
     */
    checkFast(text: string): CheckProfanityResult {
      return filter.checkProfanity(text);
    },

    /**
     * ML-only check (slower, more accurate)
     */
    async checkML(text: string): Promise<MLCheckResult> {
      const ml = await getMLChecker();
      return ml.check(text);
    },

    /**
     * Get the underlying filter
     */
    getFilter(): Filter {
      return filter;
    },

    /**
     * Dispose of resources
     */
    async dispose(): Promise<void> {
      if (mlChecker) {
        mlChecker.dispose();
        mlChecker = null;
      }
    },
  };
}

/**
 * Check if transformers.js is available
 */
export async function isTransformersAvailable(): Promise<boolean> {
  try {
    await getTransformers();
    return true;
  } catch {
    return false;
  }
}

/**
 * Pre-download a model for faster first inference
 *
 * @example
 * ```typescript
 * // Pre-load during app initialization
 * await preloadModel('tarekziade/pardonmyai');
 *
 * // Later, checker will start faster
 * const checker = await createMLChecker({ model: 'tarekziade/pardonmyai' });
 * ```
 */
export async function preloadModel(
  model: string = RECOMMENDED_MODELS.pardonmyai,
  options: { quantized?: boolean } = {}
): Promise<void> {
  const { quantized = true } = options;
  const transformers = await getTransformers();

  // Just creating the pipeline will download and cache the model
  await transformers.pipeline('text-classification', model, {
    quantized,
  });
}

export type { CheckProfanityResult, FilterConfig, Language };
