/**
 * Audio Pipeline Utilities for glin-profanity
 *
 * Provides utilities for checking profanity in audio content.
 * This module does NOT include speech-to-text - users bring their own
 * transcription from Whisper, Google STT, Azure Speech, etc.
 *
 * @example
 * ```typescript
 * import { createAudioPipeline } from 'glin-profanity/audio';
 * import OpenAI from 'openai';
 *
 * const openai = new OpenAI();
 * const pipeline = createAudioPipeline({
 *   transcriber: async (audioBuffer) => {
 *     const response = await openai.audio.transcriptions.create({
 *       file: audioBuffer,
 *       model: 'whisper-1',
 *     });
 *     return response.text;
 *   },
 * });
 *
 * const result = await pipeline.checkAudio(audioFile);
 * console.log(result.containsProfanity);
 * ```
 *
 * @packageDocumentation
 * @module glin-profanity/audio
 */

import { Filter } from '../filters/Filter';
import type { FilterConfig, Language, CheckProfanityResult } from '../types/types';

/**
 * Transcription function type
 * Users provide their own transcription implementation
 */
export type TranscriberFunction = (audio: AudioInput) => Promise<string>;

/**
 * Audio input types
 */
export type AudioInput = Buffer | Uint8Array | Blob | File | string;

/**
 * Audio pipeline configuration
 */
export interface AudioPipelineConfig {
  /** Custom transcription function (REQUIRED) */
  transcriber: TranscriberFunction;
  /** Languages for profanity detection */
  languages?: Language[];
  /** Enable leetspeak detection */
  detectLeetspeak?: boolean;
  /** Enable Unicode normalization */
  normalizeUnicode?: boolean;
  /** Custom filter configuration */
  filterConfig?: Partial<FilterConfig>;
}

/**
 * Audio check result
 */
export interface AudioCheckResult {
  /** Whether profanity was found */
  containsProfanity: boolean;
  /** Transcribed text from audio */
  transcribedText: string;
  /** Profane words found */
  profaneWords: string[];
  /** Full profanity check result */
  profanityResult: CheckProfanityResult;
  /** Processing time in milliseconds */
  processingTimeMs: number;
  /** Transcription time in milliseconds */
  transcriptionTimeMs: number;
  /** Profanity check time in milliseconds */
  checkTimeMs: number;
}

/**
 * Segment result for timestamped audio
 */
export interface AudioSegmentResult {
  /** Segment index */
  index: number;
  /** Start time in seconds */
  startTime: number;
  /** End time in seconds */
  endTime: number;
  /** Transcribed text for this segment */
  text: string;
  /** Whether this segment contains profanity */
  containsProfanity: boolean;
  /** Profane words in this segment */
  profaneWords: string[];
}

/**
 * Creates an audio profanity checking pipeline
 *
 * @example
 * ```typescript
 * // With OpenAI Whisper
 * const pipeline = createAudioPipeline({
 *   transcriber: async (audio) => {
 *     const formData = new FormData();
 *     formData.append('file', audio);
 *     formData.append('model', 'whisper-1');
 *
 *     const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
 *       method: 'POST',
 *       headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
 *       body: formData,
 *     });
 *     const data = await response.json();
 *     return data.text;
 *   },
 * });
 *
 * // With Google Cloud Speech-to-Text
 * const pipeline = createAudioPipeline({
 *   transcriber: async (audio) => {
 *     // Your Google STT implementation
 *     return transcribedText;
 *   },
 * });
 * ```
 */
export function createAudioPipeline(config: AudioPipelineConfig) {
  const {
    transcriber,
    languages = ['english'],
    detectLeetspeak = true,
    normalizeUnicode = true,
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

  return {
    /**
     * Check audio for profanity
     */
    async checkAudio(audio: AudioInput): Promise<AudioCheckResult> {
      const startTime = Date.now();

      // Transcribe
      const transcribeStart = Date.now();
      const transcribedText = await transcriber(audio);
      const transcriptionTimeMs = Date.now() - transcribeStart;

      // Check for profanity
      const checkStart = Date.now();
      const profanityResult = filter.checkProfanity(transcribedText);
      const checkTimeMs = Date.now() - checkStart;

      return {
        containsProfanity: profanityResult.containsProfanity,
        transcribedText,
        profaneWords: profanityResult.profaneWords,
        profanityResult,
        processingTimeMs: Date.now() - startTime,
        transcriptionTimeMs,
        checkTimeMs,
      };
    },

    /**
     * Check multiple audio files
     */
    async checkMultiple(audios: AudioInput[]): Promise<AudioCheckResult[]> {
      return Promise.all(audios.map((audio) => this.checkAudio(audio)));
    },

    /**
     * Check pre-transcribed text (if you already have transcription)
     */
    checkTranscript(text: string): CheckProfanityResult {
      return filter.checkProfanity(text);
    },

    /**
     * Check timestamped segments (for Whisper with timestamps)
     *
     * @example
     * ```typescript
     * const segments = [
     *   { startTime: 0, endTime: 5, text: 'Hello everyone' },
     *   { startTime: 5, endTime: 10, text: 'This is a test' },
     * ];
     * const results = pipeline.checkSegments(segments);
     * const flaggedSegments = results.filter(s => s.containsProfanity);
     * ```
     */
    checkSegments(
      segments: Array<{ startTime: number; endTime: number; text: string }>
    ): AudioSegmentResult[] {
      return segments.map((segment, index) => {
        const result = filter.checkProfanity(segment.text);
        return {
          index,
          startTime: segment.startTime,
          endTime: segment.endTime,
          text: segment.text,
          containsProfanity: result.containsProfanity,
          profaneWords: result.profaneWords,
        };
      });
    },

    /**
     * Censor transcribed text
     */
    censorTranscript(text: string, replacement = '***'): string {
      const censorFilter = new Filter({
        languages,
        detectLeetspeak,
        normalizeUnicode,
        replaceWith: replacement,
      });
      const result = censorFilter.checkProfanity(text);
      return result.processedText || text;
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
 * Creates a transcriber function for OpenAI Whisper API
 *
 * @example
 * ```typescript
 * const transcriber = createWhisperTranscriber({
 *   apiKey: process.env.OPENAI_API_KEY,
 *   model: 'whisper-1',
 * });
 *
 * const pipeline = createAudioPipeline({ transcriber });
 * ```
 */
export function createWhisperTranscriber(config: {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  language?: string;
}): TranscriberFunction {
  const {
    apiKey,
    model = 'whisper-1',
    baseUrl = 'https://api.openai.com/v1',
    language,
  } = config;

  return async (audio: AudioInput): Promise<string> => {
    const formData = new FormData();

    // Handle different input types
    if (audio instanceof Blob || audio instanceof File) {
      formData.append('file', audio);
    } else if (typeof audio === 'string') {
      // Assume it's a file path - this only works in Node.js
      throw new Error('File paths not supported in browser. Pass a Blob or File instead.');
    } else {
      // Buffer or Uint8Array - convert to Uint8Array copy for Blob compatibility
      const uint8 = audio instanceof Uint8Array ? audio : new Uint8Array(audio as unknown as ArrayBuffer);
      // Create a copy to ensure we have a proper ArrayBuffer (not SharedArrayBuffer)
      const copy = new Uint8Array(uint8);
      const blob = new Blob([copy], { type: 'audio/wav' });
      formData.append('file', blob, 'audio.wav');
    }

    formData.append('model', model);
    if (language) {
      formData.append('language', language);
    }

    const response = await fetch(`${baseUrl}/audio/transcriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Whisper API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.text;
  };
}

/**
 * Creates a transcriber function for Google Cloud Speech-to-Text
 *
 * @example
 * ```typescript
 * const transcriber = createGoogleSTTTranscriber({
 *   apiKey: process.env.GOOGLE_API_KEY,
 *   languageCode: 'en-US',
 * });
 *
 * const pipeline = createAudioPipeline({ transcriber });
 * ```
 */
export function createGoogleSTTTranscriber(config: {
  apiKey: string;
  languageCode?: string;
  enableAutomaticPunctuation?: boolean;
  profanityFilter?: boolean;
}): TranscriberFunction {
  const {
    apiKey,
    languageCode = 'en-US',
    enableAutomaticPunctuation = true,
    profanityFilter = false, // We do our own filtering
  } = config;

  return async (audio: AudioInput): Promise<string> => {
    // Convert to base64
    let audioContent: string;

    if (audio instanceof Blob) {
      const buffer = await audio.arrayBuffer();
      audioContent = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    } else if (audio instanceof ArrayBuffer || audio instanceof Uint8Array) {
      const bytes = audio instanceof ArrayBuffer ? new Uint8Array(audio) : audio;
      audioContent = btoa(String.fromCharCode(...bytes));
    } else if (typeof audio === 'string') {
      throw new Error('File paths not supported. Pass audio data directly.');
    } else {
      // Node.js Buffer
      audioContent = (audio as Buffer).toString('base64');
    }

    const response = await fetch(
      `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: {
            encoding: 'LINEAR16',
            sampleRateHertz: 16000,
            languageCode,
            enableAutomaticPunctuation,
            profanityFilter,
          },
          audio: { content: audioContent },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Google STT API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const results = data.results || [];
    return results
      .map((r: { alternatives?: Array<{ transcript?: string }> }) =>
        r.alternatives?.[0]?.transcript || ''
      )
      .join(' ');
  };
}

/**
 * Real-time audio stream checker
 * For live audio moderation (e.g., voice chat, podcasts)
 *
 * @example
 * ```typescript
 * const streamChecker = createRealtimeChecker({
 *   transcriber: myTranscriber,
 *   onProfanityDetected: (result) => {
 *     console.log('Profanity detected:', result.profaneWords);
 *     // Trigger beep, mute, or warning
 *   },
 * });
 *
 * // Feed audio chunks as they arrive
 * audioStream.on('data', (chunk) => {
 *   streamChecker.processChunk(chunk);
 * });
 *
 * // Get summary when done
 * const summary = streamChecker.getSummary();
 * ```
 */
export function createRealtimeChecker(config: {
  transcriber: TranscriberFunction;
  onProfanityDetected?: (result: AudioCheckResult) => void;
  bufferDurationMs?: number;
  languages?: Language[];
  detectLeetspeak?: boolean;
}) {
  const {
    transcriber,
    onProfanityDetected,
    languages = ['english'],
    detectLeetspeak = true,
  } = config;

  const pipeline = createAudioPipeline({
    transcriber,
    languages,
    detectLeetspeak,
  });

  const results: AudioCheckResult[] = [];
  let totalProfaneWords: string[] = [];

  return {
    /**
     * Process an audio chunk
     */
    async processChunk(chunk: AudioInput): Promise<AudioCheckResult> {
      const result = await pipeline.checkAudio(chunk);
      results.push(result);

      if (result.containsProfanity) {
        totalProfaneWords = [...totalProfaneWords, ...result.profaneWords];
        onProfanityDetected?.(result);
      }

      return result;
    },

    /**
     * Get summary of all processed chunks
     */
    getSummary() {
      const flaggedCount = results.filter((r) => r.containsProfanity).length;
      const uniqueProfaneWords = [...new Set(totalProfaneWords)];

      return {
        totalChunks: results.length,
        flaggedChunks: flaggedCount,
        cleanChunks: results.length - flaggedCount,
        flagRate: results.length > 0 ? flaggedCount / results.length : 0,
        allProfaneWords: uniqueProfaneWords,
        fullTranscript: results.map((r) => r.transcribedText).join(' '),
      };
    },

    /**
     * Reset the checker state
     */
    reset() {
      results.length = 0;
      totalProfaneWords = [];
    },
  };
}

export type { CheckProfanityResult, FilterConfig, Language };
