// src/types/types.ts
export enum SeverityLevel {
  Exact = 1,
  Fuzzy = 2,
  Merged = 3,
}

export interface CheckProfanityResult {
  containsProfanity: boolean;
  profaneWords: string[];
  processedText?: string;
  severityMap?: { [word: string]: SeverityLevel };
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
