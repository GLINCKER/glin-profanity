/**
 * Multi-Modal Profanity Detection for glin-profanity
 *
 * This module provides utilities for detecting profanity in images (via OCR)
 * and audio (via transcription). Both use a BYO (Bring Your Own) approach
 * to keep the core library lightweight.
 *
 * @example
 * ```typescript
 * // OCR - requires tesseract.js peer dependency
 * import { createOCRChecker } from 'glin-profanity/ocr';
 *
 * // Audio - bring your own transcriber
 * import { createAudioPipeline } from 'glin-profanity/audio';
 *
 * // Or import all from multimodal
 * import { ocr, audio } from 'glin-profanity/multimodal';
 * ```
 *
 * @packageDocumentation
 * @module glin-profanity/multimodal
 */

// OCR exports
export {
  createOCRChecker,
  checkImageForProfanity,
  batchCheckImages,
  languagesToTesseract,
  LANGUAGE_TO_TESSERACT,
  type OCRCheckerConfig,
  type OCRCheckResult,
} from './ocr';

// Audio exports
export {
  createAudioPipeline,
  createWhisperTranscriber,
  createGoogleSTTTranscriber,
  createRealtimeChecker,
  type AudioPipelineConfig,
  type AudioCheckResult,
  type AudioSegmentResult,
  type TranscriberFunction,
  type AudioInput,
} from './audio';

// Re-export common types
export type { CheckProfanityResult, FilterConfig, Language } from '../types/types';
