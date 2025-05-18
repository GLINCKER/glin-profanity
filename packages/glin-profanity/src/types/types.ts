// src/types/types.ts
export enum SeverityLevel {
  Exact = 1,
  Fuzzy = 2,
  Merged = 3,
}
export type SeverityLabel = keyof typeof SeverityLevel; // "Exact" | "Fuzzy" | "Merged"

export interface FilteredProfanityResult {
  result: CheckProfanityResult;
  filteredWords: string[];
}

export interface CheckProfanityResult {
  containsProfanity: boolean;
  profaneWords: string[];
  processedText?: string;
  severityMap?: Record<string, SeverityLevel>;
  matchContexts?: { word: string; context: string }[];
}
export type Language =
  | 'arabic'
  | 'chinese'
  | 'czech'
  | 'danish'
  | 'english'
  | 'esperanto'
  | 'finnish'
  | 'french'
  | 'german'
  | 'hindi'
  | 'hungarian'
  | 'italian'
  | 'japanese'
  | 'korean'
  | 'norwegian'
  | 'persian'
  | 'polish'
  | 'portuguese'
  | 'russian'
  | 'turkish'
  | 'swedish'
  | 'thai';
