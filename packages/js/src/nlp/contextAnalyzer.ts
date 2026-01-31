// src/nlp/contextAnalyzer.ts
import { Language } from '../types/types';

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

// Positive sentiment indicators
const POSITIVE_INDICATORS = new Set([
  'amazing', 'awesome', 'excellent', 'fantastic', 'great', 'love', 'wonderful',
  'brilliant', 'perfect', 'incredible', 'outstanding', 'superb', 'magnificent',
  'marvelous', 'spectacular', 'phenomenal', 'terrific', 'fabulous', 'divine',
  'best', 'good', 'nice', 'cool', 'sweet', 'rad', 'sick', 'dope', 'fire',
  'lit', 'epic', 'legendary', 'godlike', 'insane', 'crazy', 'wild', 'beast',
  'movie', 'film', 'show', 'song', 'music', 'game', 'book', 'restaurant',
  'food', 'dish', 'meal', 'place', 'spot', 'location', 'experience'
]);

// Negative sentiment indicators
const NEGATIVE_INDICATORS = new Set([
  'hate', 'terrible', 'awful', 'horrible', 'disgusting', 'pathetic', 'stupid',
  'idiot', 'moron', 'loser', 'worthless', 'useless', 'garbage', 'trash',
  'suck', 'sucks', 'worst', 'bad', 'ugly', 'gross', 'nasty', 'annoying',
  'irritating', 'frustrating', 'disappointing', 'lame', 'weak', 'fail',
  'you', 'your', 'yourself', 'u', 'ur', 'ure', 'youre'
]);


// Domain-specific positive contexts
const GAMING_POSITIVE = new Set([
  'player', 'gamer', 'team', 'squad', 'clan', 'guild', 'match', 'game',
  'round', 'level', 'boss', 'raid', 'quest', 'achievement', 'skill',
  'build', 'loadout', 'strategy', 'tactic', 'play', 'move', 'combo'
]);

// Words that are acceptable in gaming contexts but might be flagged otherwise
const GAMING_ACCEPTABLE_WORDS = new Set([
  'kill', 'killer', 'killed', 'killing',
  'shoot', 'shot', 'shooting',
  'die', 'dying', 'died', 'dead', 'death',
  'badass', 'sick', 'insane', 'crazy', 'mad', 'beast', 'savage',
  'suck', 'sucks',
  'wtf', 'omg', 'hell', 'damn', 'crap'
]);

// Common positive phrases that might contain flagged words
const POSITIVE_PHRASES = new Map([
  ['the bomb', 0.9], // "this movie is the bomb"
  ['da bomb', 0.9], // slang for "the best"
  ['bomb.com', 0.9], // website reference
  ['bomb diggity', 0.9], // slang for excellent
  ['photo bomb', 0.8], // photography term
  ['bath bomb', 0.8], // cosmetic product
  ['bomb squad', 0.7], // could be neutral/positive in gaming
]);

// Negative phrases that should remain flagged
const NEGATIVE_PHRASES = new Map([
  ['you are', 0.1], // "you are [profanity]"
  ['ur a', 0.1], // "ur a [profanity]"
  ['such a', 0.2], // "such a [profanity]"
  ['fucking', 0.1], // intensifier, usually negative
  ['damn', 0.2], // mild profanity, context dependent
]);

export class ContextAnalyzer {
  private contextWindow: number;
  private language: Language;
  private domainWhitelists: Set<string>;

  constructor(config: ContextConfig) {
    this.contextWindow = config.contextWindow;
    this.language = config.language;
    this.domainWhitelists = new Set(config.domainWhitelists || []);
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

  private checkPhraseContext(contextText: string, matchWord: string): ContextAnalysisResult | null {
    // Check positive phrases
    for (const [phrase, score] of POSITIVE_PHRASES.entries()) {
      if (phrase.includes(matchWord) && contextText.includes(phrase)) {
        return {
          contextScore: score,
          reason: `Positive phrase detected: "${phrase}"`,
          isWhitelisted: true
        };
      }
    }

    // Check negative phrases (prefixes like "you are" that introduce profanity)
    for (const [phrase, score] of NEGATIVE_PHRASES.entries()) {
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

      // Check internal gaming whitelist (restrictive)
      if (GAMING_POSITIVE.has(word)) {
        if (GAMING_ACCEPTABLE_WORDS.has(normalizedMatchWord)) {
          return true;
        }
      }
    }
    return false;
  }

  private generateReason(score: number, contextWords: string[]): string {
    const foundPositive = Array.from(new Set(contextWords.filter(word => POSITIVE_INDICATORS.has(word))));
    const foundNegative = Array.from(new Set(contextWords.filter(word => NEGATIVE_INDICATORS.has(word))));

    if (score >= 0.7) {
      const details = foundPositive.length > 0 ? ` (found: ${foundPositive.join(', ')})` : '';
      return `Positive context detected${details} - likely not profanity`;
    } else if (score <= 0.3) {
      const details = foundNegative.length > 0 ? ` (found: ${foundNegative.join(', ')})` : '';
      return `Negative context detected${details} - likely profanity`;
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

      if (POSITIVE_INDICATORS.has(word)) {
        positiveCount += weight;
      } else if (NEGATIVE_INDICATORS.has(word)) {
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

    // If there are personal pronouns (you, your), lean towards negative
    const hasPersonalPronouns = contextWords.some(word => 
      ['you', 'your', 'u', 'ur'].includes(word)
    );
    if (hasPersonalPronouns && rawScore < 0.7) {
      adjustedScore *= 0.7; // Reduce score when personal pronouns are present
    }

    // If there are object/thing references, lean towards positive
    const hasObjectReferences = contextWords.some(word =>
      ['movie', 'song', 'game', 'book', 'show', 'this', 'that', 'it'].includes(word)
    );
    if (hasObjectReferences && rawScore > 0.3) {
      adjustedScore = Math.min(1, adjustedScore * 1.3); // Boost score for object references
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
