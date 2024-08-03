export interface CheckProfanityResult {
    containsProfanity: boolean;
    profaneWords: string[];
    processedText?: string;
    severityMap?: {
        [word: string]: number;
    };
}
export type Language = 'arabic' | 'chinese' | 'czech' | 'danish' | 'english' | 'esperanto' | 'finnish' | 'french' | 'german' | 'hindi' | 'hungarian' | 'italian' | 'japanese' | 'korean' | 'norwegian' | 'persian' | 'polish' | 'portuguese' | 'russian' | 'turkish' | 'swedish' | 'thai';
//# sourceMappingURL=types.d.ts.map