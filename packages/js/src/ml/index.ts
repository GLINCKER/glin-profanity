/**
 * ML-based profanity and toxicity detection module.
 *
 * This module provides optional ML-based detection using TensorFlow.js.
 * It requires optional peer dependencies that must be installed separately:
 *
 * ```bash
 * npm install @tensorflow/tfjs @tensorflow-models/toxicity
 * ```
 *
 * @example
 * ```typescript
 * // Standalone ML detector
 * import { ToxicityDetector } from 'glin-profanity/ml';
 *
 * const detector = new ToxicityDetector({ threshold: 0.9 });
 * await detector.loadModel();
 * const result = await detector.analyze('some text');
 *
 * // Hybrid filter (combines rules + ML)
 * import { HybridFilter } from 'glin-profanity/ml';
 *
 * const filter = new HybridFilter({
 *   languages: ['english'],
 *   detectLeetspeak: true,
 *   enableML: true,
 *   mlThreshold: 0.85,
 * });
 * await filter.initialize();
 * const result = await filter.checkProfanityAsync('some text');
 * ```
 *
 * @module glin-profanity/ml
 */

export { ToxicityDetector } from './ToxicityDetector';
export { HybridFilter } from './HybridFilter';
export type { HybridFilterConfig } from './HybridFilter';
export type {
  ToxicityLabel,
  ToxicityPrediction,
  MLAnalysisResult,
  MLDetectorConfig,
  HybridAnalysisResult,
} from './types';
