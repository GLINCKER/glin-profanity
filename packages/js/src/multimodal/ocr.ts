/**
 * OCR (Optical Character Recognition) Integration for glin-profanity
 *
 * Extracts text from images and checks for profanity.
 * Uses Tesseract.js as an optional peer dependency.
 *
 * @example
 * ```typescript
 * import { createOCRChecker, checkImageForProfanity } from 'glin-profanity/ocr';
 *
 * // Quick check
 * const result = await checkImageForProfanity(imageBuffer);
 * console.log(result.containsProfanity);
 *
 * // With custom config
 * const checker = createOCRChecker({
 *   languages: ['english', 'spanish'],
 *   tesseractLangs: ['eng', 'spa'],
 *   detectLeetspeak: true,
 * });
 * const result = await checker.checkImage(imageBuffer);
 * ```
 *
 * @packageDocumentation
 * @module glin-profanity/ocr
 */

import { Filter } from '../filters/Filter';
import type { FilterConfig, Language, CheckProfanityResult } from '../types/types';

/**
 * Tesseract.js types (minimal interface to avoid hard dependency)
 */
interface TesseractWorker {
  recognize: (image: ImageLike) => Promise<{ data: { text: string; confidence: number } }>;
  terminate: () => Promise<void>;
}

interface TesseractModule {
  createWorker: (langs?: string | string[], oem?: number) => Promise<TesseractWorker>;
}

type ImageLike = string | Buffer | Uint8Array | Blob | File | HTMLImageElement | HTMLCanvasElement;

/**
 * OCR checker configuration
 */
export interface OCRCheckerConfig {
  /** Languages for profanity detection */
  languages?: Language[];
  /** Tesseract language codes (e.g., 'eng', 'spa', 'fra') */
  tesseractLangs?: string[];
  /** Enable leetspeak detection */
  detectLeetspeak?: boolean;
  /** Enable Unicode normalization */
  normalizeUnicode?: boolean;
  /** Minimum OCR confidence to process text (0-100) */
  minConfidence?: number;
  /** Custom filter configuration */
  filterConfig?: Partial<FilterConfig>;
}

/**
 * OCR check result
 */
export interface OCRCheckResult {
  /** Whether profanity was found in the extracted text */
  containsProfanity: boolean;
  /** Extracted text from the image */
  extractedText: string;
  /** OCR confidence score (0-100) */
  ocrConfidence: number;
  /** Profane words found */
  profaneWords: string[];
  /** Full profanity check result */
  profanityResult: CheckProfanityResult;
  /** Processing time in milliseconds */
  processingTimeMs: number;
}

/**
 * Lazy-loads Tesseract.js
 */
async function getTesseract(): Promise<TesseractModule> {
  try {
    // Dynamic import to avoid bundling
    const tesseract = await import('tesseract.js');
    return tesseract as unknown as TesseractModule;
  } catch {
    throw new Error(
      'Tesseract.js is required for OCR features. Install it with: npm install tesseract.js'
    );
  }
}

/**
 * Creates an OCR profanity checker
 *
 * @example
 * ```typescript
 * const checker = createOCRChecker({
 *   languages: ['english'],
 *   tesseractLangs: ['eng'],
 *   detectLeetspeak: true,
 * });
 *
 * // Check an image
 * const result = await checker.checkImage('./screenshot.png');
 *
 * // Check multiple images
 * const results = await checker.checkImages([image1, image2, image3]);
 *
 * // Clean up when done
 * await checker.terminate();
 * ```
 */
export function createOCRChecker(config: OCRCheckerConfig = {}) {
  const {
    languages = ['english'],
    tesseractLangs = ['eng'],
    detectLeetspeak = true,
    normalizeUnicode = true,
    minConfidence = 30,
    filterConfig = {},
  } = config;

  const filter = new Filter({
    languages,
    detectLeetspeak,
    normalizeUnicode,
    severityLevels: true,
    cacheResults: true,
    ...filterConfig,
  });

  let worker: TesseractWorker | null = null;
  let workerPromise: Promise<TesseractWorker> | null = null;

  /**
   * Initialize the Tesseract worker (lazy)
   */
  async function getWorker(): Promise<TesseractWorker> {
    if (worker) return worker;

    if (!workerPromise) {
      workerPromise = (async () => {
        const tesseract = await getTesseract();
        const langs = tesseractLangs.join('+');
        worker = await tesseract.createWorker(langs);
        return worker;
      })();
    }

    return workerPromise;
  }

  return {
    /**
     * Check a single image for profanity
     */
    async checkImage(image: ImageLike): Promise<OCRCheckResult> {
      const startTime = Date.now();

      const w = await getWorker();
      const { data } = await w.recognize(image);

      const processingTimeMs = Date.now() - startTime;

      // Skip if confidence is too low
      if (data.confidence < minConfidence) {
        return {
          containsProfanity: false,
          extractedText: data.text,
          ocrConfidence: data.confidence,
          profaneWords: [],
          profanityResult: {
            containsProfanity: false,
            profaneWords: [],
          },
          processingTimeMs,
        };
      }

      const profanityResult = filter.checkProfanity(data.text);

      return {
        containsProfanity: profanityResult.containsProfanity,
        extractedText: data.text,
        ocrConfidence: data.confidence,
        profaneWords: profanityResult.profaneWords,
        profanityResult,
        processingTimeMs,
      };
    },

    /**
     * Check multiple images for profanity
     */
    async checkImages(images: ImageLike[]): Promise<OCRCheckResult[]> {
      return Promise.all(images.map((img) => this.checkImage(img)));
    },

    /**
     * Extract text from image without profanity check
     */
    async extractText(image: ImageLike): Promise<{ text: string; confidence: number }> {
      const w = await getWorker();
      const { data } = await w.recognize(image);
      return { text: data.text, confidence: data.confidence };
    },

    /**
     * Check extracted text (if you already have text from another OCR)
     */
    checkText(text: string): CheckProfanityResult {
      return filter.checkProfanity(text);
    },

    /**
     * Terminate the Tesseract worker (clean up resources)
     */
    async terminate(): Promise<void> {
      if (worker) {
        await worker.terminate();
        worker = null;
        workerPromise = null;
      }
    },

    /**
     * Get the underlying filter instance
     */
    getFilter(): Filter {
      return filter;
    },
  };
}

/**
 * Quick function to check an image for profanity
 * Creates a temporary worker, checks the image, and terminates
 *
 * @example
 * ```typescript
 * import { checkImageForProfanity } from 'glin-profanity/ocr';
 *
 * const result = await checkImageForProfanity('./meme.png');
 * if (result.containsProfanity) {
 *   console.log('Found profanity:', result.profaneWords);
 * }
 * ```
 */
export async function checkImageForProfanity(
  image: ImageLike,
  config: OCRCheckerConfig = {}
): Promise<OCRCheckResult> {
  const checker = createOCRChecker(config);
  try {
    return await checker.checkImage(image);
  } finally {
    await checker.terminate();
  }
}

/**
 * Batch check multiple images for profanity
 * More efficient than calling checkImageForProfanity multiple times
 *
 * @example
 * ```typescript
 * import { batchCheckImages } from 'glin-profanity/ocr';
 *
 * const images = ['./img1.png', './img2.png', './img3.png'];
 * const results = await batchCheckImages(images);
 *
 * const flagged = results.filter(r => r.containsProfanity);
 * console.log(`${flagged.length} images contain profanity`);
 * ```
 */
export async function batchCheckImages(
  images: ImageLike[],
  config: OCRCheckerConfig = {}
): Promise<OCRCheckResult[]> {
  const checker = createOCRChecker(config);
  try {
    return await checker.checkImages(images);
  } finally {
    await checker.terminate();
  }
}

/**
 * Supported Tesseract language codes
 * Map from glin-profanity language to Tesseract code
 */
export const LANGUAGE_TO_TESSERACT: Record<Language, string> = {
  arabic: 'ara',
  chinese: 'chi_sim',
  czech: 'ces',
  danish: 'dan',
  dutch: 'nld',
  english: 'eng',
  esperanto: 'epo',
  finnish: 'fin',
  french: 'fra',
  german: 'deu',
  hindi: 'hin',
  hungarian: 'hun',
  italian: 'ita',
  japanese: 'jpn',
  korean: 'kor',
  norwegian: 'nor',
  persian: 'fas',
  polish: 'pol',
  portuguese: 'por',
  russian: 'rus',
  spanish: 'spa',
  swedish: 'swe',
  thai: 'tha',
  turkish: 'tur',
};

/**
 * Helper to convert glin-profanity languages to Tesseract codes
 */
export function languagesToTesseract(languages: Language[]): string[] {
  return languages.map((lang) => LANGUAGE_TO_TESSERACT[lang] || 'eng');
}

export type { CheckProfanityResult, FilterConfig, Language };
