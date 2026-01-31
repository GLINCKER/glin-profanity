import { Language } from '../types/types';
import { contextData, ContextDefinition } from '../data/context-data';

export interface ContextAnalysisResult {
  contextScore: number; // 0-1, where 0 = negative context, 1 = positive context
  reason: string;
  isWhitelisted: boolean;
}

export interface ContextConfig {
  contextWindow: number;
  language: Language;
  domainWhitelists?: string[];
}

export class ContextAnalyzer {
  private contextWindow: number;
  private language: Language;
  private domainWhitelists: Set<string>;
  private data: ContextDefinition | undefined;

  constructor(config: ContextConfig) {
    this.contextWindow = config.contextWindow;
    this.language = config.language;
    this.domainWhitelists = new Set(config.domainWhitelists || []);
    // Load context data for the configured language
    this.data = contextData[this.language];
  }

  /**
   * Analyzes the context around a profanity match to determine if it should be flagged
   */
  analyzeContext(
    text: string,
    matchWord: string,
    matchIndex: number
  ): ContextAnalysisResult {
    const words = this.tokenize(text);
    const matchWordIndex = this.findWordIndex(words, matchIndex);
    
    if (matchWordIndex === -1) {
      return {
        contextScore: 0.5,
        reason: 'Could not locate match in tokenized text',
        isWhitelisted: false
      };
    }

    // Extract context window
    const startIndex = Math.max(0, matchWordIndex - this.contextWindow);
    const endIndex = Math.min(words.length, matchWordIndex + this.contextWindow + 1);
    const contextWords = words.slice(startIndex, endIndex);
    const contextText = contextWords.join(' ').toLowerCase();

    // Check for exact phrase matches first
    const phraseResult = this.checkPhraseContext(contextText, matchWord);
    if (phraseResult) {
      return phraseResult;
    }

    // Check domain-specific whitelists
    if (this.isDomainWhitelisted(contextWords, matchWord)) {
      return {
        contextScore: 0.8,
        reason: 'Domain-specific whitelist match',
        isWhitelisted: true
      };
    }

    // Perform sentiment analysis
    const sentimentScore = this.calculateSentimentScore(contextWords, matchWordIndex - startIndex);
    
    return {
      contextScore: sentimentScore,
      reason: this.generateReason(sentimentScore, contextWords),
      isWhitelisted: false
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private checkPhraseContext(contextText: string, matchWord: string): ContextAnalysisResult | null {
    if (!this.data) return null;

    // Check positive phrases
    for (const [phrase, score] of this.data.positivePhrases.entries()) {
      if (contextText.includes(phrase)) {
        return {
          contextScore: score,
          reason: `Positive phrase detected: "${phrase}"`,
          isWhitelisted: true
        };
      }
    }

    // Check negative phrases
    for (const [phrase, score] of this.data.negativePhrases.entries()) {
      if (contextText.includes(phrase)) {
        return {
          contextScore: score,
          reason: `Negative phrase detected: "${phrase}"`,
          isWhitelisted: false
        };
      }
    }

    return null;
  }

  private isDomainWhitelisted(contextWords: string[], matchWord: string): boolean {
    const normalizedMatchWord = matchWord.toLowerCase();

    // Check if any domain whitelist words are present
    for (const word of contextWords) {
      // Check user-defined domain whitelists (permissive)
      if (this.domainWhitelists.has(word)) {
        return true;
      }

      // Check internal domain definitions (restrictive)
      if (this.data && this.data.domains) {
        for (const domain of Object.values(this.data.domains)) {
           if (domain.positiveIndicators.has(word)) {
             if (domain.acceptableWords.has(normalizedMatchWord)) {
               return true;
             }
           }
        }
      }
    }
    return false;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private generateReason(score: number, contextWords: string[]): string {
    // TODO: Use contextWords for more detailed reasoning in the future
    if (score >= 0.7) {
      return 'Positive context detected - likely not profanity';
    } else if (score <= 0.3) {
      return 'Negative context detected - likely profanity';
    } else {
      return 'Neutral context - uncertain classification';
    }
  }

  private tokenize(text: string): string[] {
    // Simple tokenization - split on whitespace and punctuation
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  private findWordIndex(words: string[], charIndex: number): number {
    // This is a simplified approach - in production, you'd want more robust mapping
    // For now, we'll estimate based on the character position
    let currentPos = 0;
    for (let i = 0; i < words.length; i++) {
      if (currentPos >= charIndex) {
        return Math.max(0, i - 1);
      }
      currentPos += words[i].length + 1; // +1 for space
    }
    return words.length - 1;
  }


  private calculateSentimentScore(contextWords: string[], matchPosition: number): number {
    let positiveCount = 0;
    let negativeCount = 0;
    const totalWords = contextWords.length;

    // Weight words closer to the match more heavily
    for (let i = 0; i < contextWords.length; i++) {
      const word = contextWords[i];
      const distance = Math.abs(i - matchPosition);
      const weight = Math.max(0.1, 1 - (distance * 0.2)); // Closer words have higher weight

      if (this.data?.positiveIndicators.has(word)) {
        positiveCount += weight;
      } else if (this.data?.negativeIndicators.has(word)) {
        negativeCount += weight;
      }
    }

    // Calculate base score
    const totalSentiment = positiveCount + negativeCount;
    if (totalSentiment === 0) {
      return 0.5; // Neutral if no sentiment indicators
    }

    const rawScore = positiveCount / totalSentiment;
    
    // Apply context-specific adjustments
    let adjustedScore = rawScore;
    
    // Adjust confidence based on context window size
    const confidenceMultiplier = Math.min(1.0, totalWords / 5); // More words = higher confidence
    adjustedScore = 0.5 + (adjustedScore - 0.5) * confidenceMultiplier;

    if (this.data) {
        // If there are personal pronouns (you, your), lean towards negative
        const hasPersonalPronouns = contextWords.some(word =>
          this.data!.personalPronouns.has(word)
        );
        if (hasPersonalPronouns && rawScore < 0.7) {
          adjustedScore *= 0.7; // Reduce score when personal pronouns are present
        }

        // If there are object/thing references, lean towards positive
        const hasObjectReferences = contextWords.some(word =>
          this.data!.objectReferences.has(word)
        );
        if (hasObjectReferences && rawScore > 0.3) {
          adjustedScore = Math.min(1, adjustedScore * 1.3); // Boost score for object references
        }
    }

    return Math.max(0, Math.min(1, adjustedScore));
  }


  /**
   * Updates the domain whitelist for this analyzer instance
   */
  updateDomainWhitelist(newWhitelist: string[]): void {
    this.domainWhitelists = new Set(newWhitelist);
  }

  /**
   * Adds words to the domain whitelist
   */
  addToDomainWhitelist(words: string[]): void {
    words.forEach(word => this.domainWhitelists.add(word.toLowerCase()));
  }
}
