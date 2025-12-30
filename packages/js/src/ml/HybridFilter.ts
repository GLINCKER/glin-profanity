/**
 * Hybrid filter combining rule-based and ML-based detection.
 *
 * This class provides the best of both worlds:
 * - Fast rule-based detection for common profanity
 * - ML-based detection for contextual toxicity
 *
 * @example
 * ```typescript
 * import { HybridFilter } from 'glin-profanity/ml';
 *
 * const filter = new HybridFilter({
 *   // Rule-based config
 *   languages: ['english'],
 *   detectLeetspeak: true,
 *   // ML config
 *   enableML: true,
 *   mlThreshold: 0.85,
 * });
 *
 * await filter.initialize();
 *
 * const result = await filter.checkProfanityAsync('some text');
 * console.log(result.isToxic);
 * ```
 */

import { Filter, FilterConfig } from '../filters/Filter';
import { CheckProfanityResult } from '../types/types';
import { ToxicityDetector } from './ToxicityDetector';
import type {
  MLDetectorConfig,
  MLAnalysisResult,
  HybridAnalysisResult,
  ToxicityLabel,
} from './types';

/**
 * Hybrid filter configuration.
 */
export interface HybridFilterConfig extends FilterConfig {
  /**
   * Enable ML-based detection.
   * Requires @tensorflow/tfjs and @tensorflow-models/toxicity.
   * @default false
   */
  enableML?: boolean;

  /**
   * ML confidence threshold.
   * @default 0.85
   */
  mlThreshold?: number;

  /**
   * Specific ML toxicity categories to check.
   */
  mlLabels?: ToxicityLabel[];

  /**
   * Preload ML model on initialization.
   * @default false
   */
  preloadML?: boolean;

  /**
   * How to combine rule-based and ML results.
   * - 'or': Flag if either method detects toxicity (more sensitive)
   * - 'and': Flag only if both methods detect toxicity (more precise)
   * - 'ml-override': Use ML result if available, fallback to rules
   * - 'rules-first': Use rules for speed, ML for borderline cases
   * @default 'or'
   */
  combinationMode?: 'or' | 'and' | 'ml-override' | 'rules-first';

  /**
   * Score threshold for "borderline" cases in rules-first mode.
   * If rule-based detection is uncertain (near this threshold),
   * ML will be used for confirmation.
   * @default 0.5
   */
  borderlineThreshold?: number;
}

/**
 * Hybrid profanity filter combining rule-based and ML detection.
 */
export class HybridFilter {
  private ruleFilter: Filter;
  private mlDetector: ToxicityDetector | null = null;
  private config: Required<
    Pick<
      HybridFilterConfig,
      | 'enableML'
      | 'mlThreshold'
      | 'combinationMode'
      | 'borderlineThreshold'
      | 'preloadML'
    >
  > & { mlLabels?: ToxicityLabel[] };
  private mlInitialized = false;

  /**
   * Creates a new HybridFilter instance.
   *
   * @param config - Configuration options
   */
  constructor(config: HybridFilterConfig = {}) {
    // Extract ML-specific config
    const {
      enableML = false,
      mlThreshold = 0.85,
      mlLabels,
      preloadML = false,
      combinationMode = 'or',
      borderlineThreshold = 0.5,
      ...filterConfig
    } = config;

    this.config = {
      enableML,
      mlThreshold,
      mlLabels,
      preloadML,
      combinationMode,
      borderlineThreshold,
    };

    // Create rule-based filter
    this.ruleFilter = new Filter(filterConfig);

    // Create ML detector if enabled
    if (enableML) {
      this.mlDetector = new ToxicityDetector({
        threshold: mlThreshold,
        labels: mlLabels,
        preloadModel: preloadML,
      });
    }
  }

  /**
   * Initializes the hybrid filter, loading the ML model if enabled.
   * Call this before using async methods for best performance.
   *
   * @example
   * ```typescript
   * const filter = new HybridFilter({ enableML: true });
   * await filter.initialize();
   * // Now ready for fast async checks
   * ```
   */
  async initialize(): Promise<void> {
    if (this.mlDetector && !this.mlInitialized) {
      await this.mlDetector.loadModel();
      this.mlInitialized = true;
    }
  }

  /**
   * Checks if ML is available and initialized.
   */
  isMLReady(): boolean {
    return this.mlDetector?.isModelLoaded() ?? false;
  }

  /**
   * Synchronous profanity check using only rule-based detection.
   * Use this for fast, synchronous checks when ML isn't needed.
   *
   * @param text - Text to check
   * @returns True if profanity detected
   */
  isProfane(text: string): boolean {
    return this.ruleFilter.isProfane(text);
  }

  /**
   * Synchronous detailed check using only rule-based detection.
   *
   * @param text - Text to check
   * @returns Detailed profanity check result
   */
  checkProfanity(text: string): CheckProfanityResult {
    return this.ruleFilter.checkProfanity(text);
  }

  /**
   * Async profanity check using both rule-based and ML detection.
   *
   * @param text - Text to check
   * @returns Combined analysis result
   *
   * @example
   * ```typescript
   * const filter = new HybridFilter({
   *   enableML: true,
   *   combinationMode: 'or',
   * });
   * await filter.initialize();
   *
   * const result = await filter.checkProfanityAsync('some text');
   * if (result.isToxic) {
   *   console.log('Reason:', result.reason);
   *   console.log('Confidence:', result.confidence);
   * }
   * ```
   */
  async checkProfanityAsync(text: string): Promise<HybridAnalysisResult> {
    // Get rule-based result
    const ruleResult = this.ruleFilter.checkProfanity(text);

    // Get ML result if enabled
    let mlResult: MLAnalysisResult | null = null;
    if (this.mlDetector) {
      try {
        mlResult = await this.mlDetector.analyze(text);
      } catch (error) {
        // ML failed - continue with rule-based only
        console.warn('[glin-profanity] ML analysis failed:', error);
      }
    }

    // Combine results based on mode
    const { isToxic, confidence, reason } = this.combineResults(
      ruleResult,
      mlResult,
    );

    return {
      ruleBasedResult: {
        containsProfanity: ruleResult.containsProfanity,
        profaneWords: ruleResult.profaneWords,
      },
      mlResult,
      isToxic,
      confidence,
      reason,
    };
  }

  /**
   * Simple async boolean check for toxicity.
   *
   * @param text - Text to check
   * @returns True if toxic
   */
  async isToxicAsync(text: string): Promise<boolean> {
    const result = await this.checkProfanityAsync(text);
    return result.isToxic;
  }

  /**
   * Analyzes text with ML only (if available).
   *
   * @param text - Text to analyze
   * @returns ML analysis result or null if ML not available
   */
  async analyzeWithML(text: string): Promise<MLAnalysisResult | null> {
    if (!this.mlDetector) {
      return null;
    }
    return this.mlDetector.analyze(text);
  }

  /**
   * Batch analysis for multiple texts.
   *
   * @param texts - Array of texts to analyze
   * @returns Array of hybrid analysis results
   */
  async checkProfanityBatchAsync(
    texts: string[],
  ): Promise<HybridAnalysisResult[]> {
    // Get rule-based results
    const ruleResults = texts.map((text) => this.ruleFilter.checkProfanity(text));

    // Get ML results if enabled
    let mlResults: MLAnalysisResult[] | null = null;
    if (this.mlDetector) {
      try {
        mlResults = await this.mlDetector.analyzeBatch(texts);
      } catch (error) {
        console.warn('[glin-profanity] ML batch analysis failed:', error);
      }
    }

    // Combine results
    return texts.map((_, i) => {
      const ruleResult = ruleResults[i];
      const mlResult = mlResults?.[i] ?? null;
      const { isToxic, confidence, reason } = this.combineResults(
        ruleResult,
        mlResult,
      );

      return {
        ruleBasedResult: {
          containsProfanity: ruleResult.containsProfanity,
          profaneWords: ruleResult.profaneWords,
        },
        mlResult,
        isToxic,
        confidence,
        reason,
      };
    });
  }

  private combineResults(
    ruleResult: CheckProfanityResult,
    mlResult: MLAnalysisResult | null,
  ): { isToxic: boolean; confidence: number; reason: string } {
    const ruleDetected = ruleResult.containsProfanity;
    const mlDetected = mlResult?.isToxic ?? false;
    const mlScore = mlResult?.overallScore ?? 0;

    switch (this.config.combinationMode) {
      case 'and':
        // Both must agree
        if (mlResult === null) {
          return {
            isToxic: ruleDetected,
            confidence: ruleDetected ? 0.7 : 0.9,
            reason: ruleDetected
              ? `Rule-based detection (ML unavailable): ${ruleResult.profaneWords.join(', ')}`
              : 'No profanity detected (rule-based only)',
          };
        }
        return {
          isToxic: ruleDetected && mlDetected,
          confidence: Math.min(ruleDetected ? 0.9 : 0.5, mlScore),
          reason:
            ruleDetected && mlDetected
              ? `Both rule-based and ML detected toxicity: ${ruleResult.profaneWords.join(', ')} (ML: ${mlResult.matchedCategories.join(', ')})`
              : `Detection disagreement - Rule: ${ruleDetected}, ML: ${mlDetected}`,
        };

      case 'ml-override':
        // ML takes precedence if available
        if (mlResult === null) {
          return {
            isToxic: ruleDetected,
            confidence: ruleDetected ? 0.7 : 0.8,
            reason: ruleDetected
              ? `Rule-based detection: ${ruleResult.profaneWords.join(', ')}`
              : 'No profanity detected (rule-based)',
          };
        }
        return {
          isToxic: mlDetected,
          confidence: mlScore,
          reason: mlDetected
            ? `ML detected toxicity: ${mlResult.matchedCategories.join(', ')}`
            : 'ML analysis: no toxicity detected',
        };

      case 'rules-first':
        // Use rules first, ML for confirmation on borderline
        if (ruleDetected) {
          return {
            isToxic: true,
            confidence: mlResult ? Math.max(0.8, mlScore) : 0.8,
            reason: `Rule-based detection: ${ruleResult.profaneWords.join(', ')}${mlDetected ? ` (confirmed by ML: ${mlResult?.matchedCategories.join(', ')})` : ''}`,
          };
        }
        // Not detected by rules - check ML for edge cases
        if (mlResult && mlScore >= this.config.borderlineThreshold) {
          return {
            isToxic: mlDetected,
            confidence: mlScore,
            reason: mlDetected
              ? `ML detected (rules missed): ${mlResult.matchedCategories.join(', ')}`
              : 'Clean text (verified by ML)',
          };
        }
        return {
          isToxic: false,
          confidence: 0.85,
          reason: 'No profanity detected (rule-based)',
        };

      case 'or':
      default:
        // Either method can flag
        const isToxic = ruleDetected || mlDetected;
        let reason: string;
        let confidence: number;

        if (ruleDetected && mlDetected) {
          reason = `Both detected: rules (${ruleResult.profaneWords.join(', ')}), ML (${mlResult?.matchedCategories.join(', ')})`;
          confidence = Math.max(0.95, mlScore);
        } else if (ruleDetected) {
          reason = `Rule-based detection: ${ruleResult.profaneWords.join(', ')}`;
          confidence = 0.85;
        } else if (mlDetected) {
          reason = `ML detected: ${mlResult?.matchedCategories.join(', ')}`;
          confidence = mlScore;
        } else {
          reason = 'No toxicity detected';
          confidence = mlResult ? 1 - mlScore : 0.8;
        }

        return { isToxic, confidence, reason };
    }
  }

  /**
   * Gets the underlying rule-based filter.
   */
  getRuleFilter(): Filter {
    return this.ruleFilter;
  }

  /**
   * Gets the underlying ML detector (if enabled).
   */
  getMLDetector(): ToxicityDetector | null {
    return this.mlDetector;
  }

  /**
   * Disposes of resources (ML model).
   */
  dispose(): void {
    this.mlDetector?.dispose();
  }
}

export default HybridFilter;
