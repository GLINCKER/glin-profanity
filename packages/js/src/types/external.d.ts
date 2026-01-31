/**
 * Type declarations for optional peer dependencies
 * These modules are loaded dynamically and may not be installed
 */

declare module '@xenova/transformers' {
  export function pipeline(
    task: string,
    model: string,
    options?: Record<string, unknown>
  ): Promise<(input: string | string[]) => Promise<Array<{ label: string; score: number }>>>;

  export class AutoTokenizer {
    static from_pretrained(model: string): Promise<unknown>;
  }

  export class AutoModel {
    static from_pretrained(model: string): Promise<unknown>;
  }
}

declare module 'tesseract.js' {
  export interface Worker {
    loadLanguage(lang: string): Promise<void>;
    initialize(lang: string): Promise<void>;
    recognize(
      image: string | Buffer | Blob | File | URL,
      options?: { rectangle?: { top: number; left: number; width: number; height: number } }
    ): Promise<{ data: { text: string; confidence: number; words: Array<{ text: string; confidence: number }> } }>;
    terminate(): Promise<void>;
  }

  export function createWorker(
    options?: Record<string, unknown>
  ): Promise<Worker>;

  export function createScheduler(): {
    addWorker(worker: Worker): void;
    addJob(
      method: string,
      ...args: unknown[]
    ): Promise<{ data: { text: string; confidence: number } }>;
    terminate(): Promise<void>;
  };
}
