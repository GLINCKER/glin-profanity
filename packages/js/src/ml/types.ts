/**
 * Type definitions for ML-based profanity detection.
 */

/**
 * Toxicity categories detected by the TensorFlow.js model.
 * These map to the civil comments dataset labels.
 */
export type ToxicityLabel =
  | 'identity_attack'
  | 'insult'
  | 'obscene'
  | 'severe_toxicity'
  | 'sexual_explicit'
  | 'threat'
  | 'toxicity';

/**
 * Result from a single toxicity prediction.
 */
export interface ToxicityPrediction {
  /** The toxicity category */
  label: ToxicityLabel;
  /** Whether the text matches this category (null if below threshold) */
  match: boolean | null;
  /** Probability scores [non-toxic, toxic] */
  probabilities: [number, number];
}

/**
 * Result from ML-based toxicity analysis.
 */
export interface MLAnalysisResult {
  /** Whether any toxicity was detected */
  isToxic: boolean;
  /** Overall toxicity score (0-1) */
  overallScore: number;
  /** Predictions for each category */
  predictions: ToxicityPrediction[];
  /** Categories that matched */
  matchedCategories: ToxicityLabel[];
  /** Processing time in milliseconds */
  processingTimeMs: number;
}

/**
 * Configuration for the ML toxicity detector.
 */
export interface MLDetectorConfig {
  /**
   * Minimum confidence threshold for predictions.
   * Values below this threshold will return null for match.
   * @default 0.85
   */
  threshold?: number;

  /**
   * Specific toxicity categories to check.
   * If not specified, all categories are checked.
   */
  labels?: ToxicityLabel[];

  /**
   * Whether to load the model immediately on instantiation.
   * If false, model will be loaded on first use.
   * @default false
   */
  preloadModel?: boolean;
}

/**
 * Combined result from both rule-based and ML detection.
 */
export interface HybridAnalysisResult {
  /** Rule-based detection result */
  ruleBasedResult: {
    containsProfanity: boolean;
    profaneWords: string[];
  };
  /** ML-based detection result (null if ML not enabled) */
  mlResult: MLAnalysisResult | null;
  /** Combined decision */
  isToxic: boolean;
  /** Confidence score for the decision */
  confidence: number;
  /** Reason for the decision */
  reason: string;
}
