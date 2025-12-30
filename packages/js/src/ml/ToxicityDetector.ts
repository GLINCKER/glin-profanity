/**
 * ML-based toxicity detection using TensorFlow.js.
 *
 * This module provides optional ML-based profanity/toxicity detection
 * using the TensorFlow.js toxicity model trained on the civil comments dataset.
 *
 * IMPORTANT: This requires optional peer dependencies:
 * - @tensorflow/tfjs
 * - @tensorflow-models/toxicity
 *
 * Install with: npm install @tensorflow/tfjs @tensorflow-models/toxicity
 *
 * @example
 * ```typescript
 * import { ToxicityDetector } from 'glin-profanity/ml';
 *
 * const detector = new ToxicityDetector({ threshold: 0.9 });
 * await detector.loadModel();
 *
 * const result = await detector.analyze('some text to check');
 * console.log(result.isToxic);
 * ```
 */

import type {
  MLDetectorConfig,
  MLAnalysisResult,
  ToxicityLabel,
  ToxicityPrediction,
} from './types';

// Type definitions for TensorFlow.js toxicity model (since it's an optional dep)
interface ToxicityModelPrediction {
  label: string;
  results: Array<{
    match: boolean | null;
    probabilities: Float32Array | number[];
  }>;
}

interface ToxicityModel {
  classify(sentences: string[]): Promise<ToxicityModelPrediction[]>;
}

type ToxicityLoadFn = (
  threshold?: number,
  labels?: string[],
) => Promise<ToxicityModel>;

/**
 * ML-based toxicity detector using TensorFlow.js.
 *
 * This class provides neural network-based toxicity detection that can
 * identify various types of harmful content including insults, threats,
 * identity attacks, and obscenity.
 *
 * The model is loaded lazily and cached for subsequent calls.
 */
export class ToxicityDetector {
  private model: ToxicityModel | null = null;
  private loadingPromise: Promise<ToxicityModel> | null = null;
  private config: Required<MLDetectorConfig>;
  private isAvailable: boolean | null = null;

  /**
   * All available toxicity labels.
   */
  static readonly ALL_LABELS: ToxicityLabel[] = [
    'identity_attack',
    'insult',
    'obscene',
    'severe_toxicity',
    'sexual_explicit',
    'threat',
    'toxicity',
  ];

  /**
   * Creates a new ToxicityDetector instance.
   *
   * @param config - Configuration options
   *
   * @example
   * ```typescript
   * // Basic usage with default threshold (0.85)
   * const detector = new ToxicityDetector();
   *
   * // Custom threshold for higher precision
   * const strictDetector = new ToxicityDetector({ threshold: 0.95 });
   *
   * // Check only specific categories
   * const customDetector = new ToxicityDetector({
   *   threshold: 0.8,
   *   labels: ['insult', 'threat', 'obscene'],
   * });
   * ```
   */
  constructor(config: MLDetectorConfig = {}) {
    this.config = {
      threshold: config.threshold ?? 0.85,
      labels: config.labels ?? ToxicityDetector.ALL_LABELS,
      preloadModel: config.preloadModel ?? false,
    };

    if (this.config.preloadModel) {
      this.loadModel().catch(() => {
        // Silently fail preload - will error on first use
      });
    }
  }

  /**
   * Dynamic import wrapper to avoid TypeScript static analysis issues.
   * Uses Function constructor to bypass module resolution at compile time.
   * @internal
   */
  private dynamicImport(moduleName: string): Promise<unknown> {
    // Use indirect eval to avoid TypeScript analyzing the import
    return new Function('m', 'return import(m)')(moduleName) as Promise<unknown>;
  }

  /**
   * Checks if TensorFlow.js and the toxicity model are available.
   * This performs a lazy check on first call and caches the result.
   *
   * @returns True if ML dependencies are available
   */
  async checkAvailability(): Promise<boolean> {
    if (this.isAvailable !== null) {
      return this.isAvailable;
    }

    try {
      // Try to dynamically import TensorFlow.js using indirect import
      await this.dynamicImport('@tensorflow/tfjs');
      await this.dynamicImport('@tensorflow-models/toxicity');
      this.isAvailable = true;
    } catch {
      this.isAvailable = false;
    }

    return this.isAvailable;
  }

  /**
   * Loads the toxicity model.
   * This is called automatically on first analyze() call if not called explicitly.
   *
   * @returns The loaded model
   * @throws Error if TensorFlow.js dependencies are not installed
   *
   * @example
   * ```typescript
   * const detector = new ToxicityDetector();
   *
   * // Explicitly preload model (optional)
   * await detector.loadModel();
   *
   * // Or let it load automatically on first use
   * const result = await detector.analyze('text');
   * ```
   */
  async loadModel(): Promise<ToxicityModel> {
    // Return cached model if available
    if (this.model) {
      return this.model;
    }

    // Return existing loading promise if already loading
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    // Start loading
    this.loadingPromise = this.doLoadModel();

    try {
      this.model = await this.loadingPromise;
      return this.model;
    } finally {
      this.loadingPromise = null;
    }
  }

  private async doLoadModel(): Promise<ToxicityModel> {
    try {
      // Dynamic imports for optional dependencies using indirect import
      const toxicityModule = (await this.dynamicImport(
        '@tensorflow-models/toxicity',
      )) as { load: ToxicityLoadFn };
      const loadFn = toxicityModule.load;

      // Load model with configured threshold and labels
      const model = await loadFn(
        this.config.threshold,
        this.config.labels as string[],
      );

      return model;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error';

      if (message.includes('Cannot find module') || message.includes('MODULE_NOT_FOUND')) {
        throw new Error(
          'TensorFlow.js dependencies not installed. ' +
            'Install with: npm install @tensorflow/tfjs @tensorflow-models/toxicity',
        );
      }

      throw new Error(`Failed to load toxicity model: ${message}`);
    }
  }

  /**
   * Analyzes text for toxicity using the ML model.
   *
   * @param text - Text to analyze
   * @returns Analysis result with predictions and scores
   *
   * @example
   * ```typescript
   * const detector = new ToxicityDetector();
   * const result = await detector.analyze('you are stupid');
   *
   * console.log(result.isToxic);           // true
   * console.log(result.overallScore);      // 0.92
   * console.log(result.matchedCategories); // ['insult', 'toxicity']
   * ```
   */
  async analyze(text: string): Promise<MLAnalysisResult> {
    const startTime = performance.now();

    // Ensure model is loaded
    const model = await this.loadModel();

    // Classify text
    const predictions = await model.classify([text]);

    // Process predictions
    const processedPredictions: ToxicityPrediction[] = predictions.map(
      (pred) => ({
        label: pred.label as ToxicityLabel,
        match: pred.results[0].match,
        probabilities: [
          pred.results[0].probabilities[0],
          pred.results[0].probabilities[1],
        ] as [number, number],
      }),
    );

    // Find matched categories
    const matchedCategories = processedPredictions
      .filter((p) => p.match === true)
      .map((p) => p.label);

    // Calculate overall toxicity score (max of all toxic probabilities)
    const overallScore = Math.max(
      ...processedPredictions.map((p) => p.probabilities[1]),
    );

    const processingTimeMs = performance.now() - startTime;

    return {
      isToxic: matchedCategories.length > 0,
      overallScore,
      predictions: processedPredictions,
      matchedCategories,
      processingTimeMs,
    };
  }

  /**
   * Analyzes multiple texts in a batch for better performance.
   *
   * @param texts - Array of texts to analyze
   * @returns Array of analysis results
   *
   * @example
   * ```typescript
   * const detector = new ToxicityDetector();
   * const results = await detector.analyzeBatch([
   *   'hello friend',
   *   'you are terrible',
   *   'great work!',
   * ]);
   *
   * results.forEach((result, i) => {
   *   console.log(`Text ${i}: ${result.isToxic ? 'toxic' : 'clean'}`);
   * });
   * ```
   */
  async analyzeBatch(texts: string[]): Promise<MLAnalysisResult[]> {
    if (texts.length === 0) {
      return [];
    }

    const startTime = performance.now();

    // Ensure model is loaded
    const model = await this.loadModel();

    // Classify all texts at once
    const predictions = await model.classify(texts);

    const totalTimeMs = performance.now() - startTime;
    const perTextTimeMs = totalTimeMs / texts.length;

    // Process results for each text
    return texts.map((_, textIndex) => {
      const processedPredictions: ToxicityPrediction[] = predictions.map(
        (pred) => ({
          label: pred.label as ToxicityLabel,
          match: pred.results[textIndex].match,
          probabilities: [
            pred.results[textIndex].probabilities[0],
            pred.results[textIndex].probabilities[1],
          ] as [number, number],
        }),
      );

      const matchedCategories = processedPredictions
        .filter((p) => p.match === true)
        .map((p) => p.label);

      const overallScore = Math.max(
        ...processedPredictions.map((p) => p.probabilities[1]),
      );

      return {
        isToxic: matchedCategories.length > 0,
        overallScore,
        predictions: processedPredictions,
        matchedCategories,
        processingTimeMs: perTextTimeMs,
      };
    });
  }

  /**
   * Simple boolean check for toxicity.
   *
   * @param text - Text to check
   * @returns True if text is detected as toxic
   *
   * @example
   * ```typescript
   * const detector = new ToxicityDetector();
   *
   * if (await detector.isToxic('some user input')) {
   *   console.log('Content flagged as toxic');
   * }
   * ```
   */
  async isToxic(text: string): Promise<boolean> {
    const result = await this.analyze(text);
    return result.isToxic;
  }

  /**
   * Gets the toxicity score for text (0-1).
   *
   * @param text - Text to score
   * @returns Toxicity score from 0 (clean) to 1 (highly toxic)
   */
  async getScore(text: string): Promise<number> {
    const result = await this.analyze(text);
    return result.overallScore;
  }

  /**
   * Disposes of the model to free memory.
   * The model will be reloaded on next analyze() call.
   */
  dispose(): void {
    this.model = null;
    this.loadingPromise = null;
  }

  /**
   * Gets the current configuration.
   */
  getConfig(): Required<MLDetectorConfig> {
    return { ...this.config };
  }

  /**
   * Checks if the model is currently loaded.
   */
  isModelLoaded(): boolean {
    return this.model !== null;
  }
}

export default ToxicityDetector;
