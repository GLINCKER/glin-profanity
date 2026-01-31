import { Language } from '../types/types';

export interface DomainContext {
  positiveIndicators: Set<string>;
  acceptableWords: Set<string>;
}

export interface ContextDefinition {
  positiveIndicators: Set<string>;
  negativeIndicators: Set<string>;
  positivePhrases: Map<string, number>;
  negativePhrases: Map<string, number>;
  domains: Record<string, DomainContext>;
  personalPronouns: Set<string>;
  objectReferences: Set<string>;
}

export const contextData: Partial<Record<Language, ContextDefinition>> = {
  english: {
    positiveIndicators: new Set([
      'amazing', 'awesome', 'excellent', 'fantastic', 'great', 'love', 'wonderful',
      'brilliant', 'perfect', 'incredible', 'outstanding', 'superb', 'magnificent',
      'marvelous', 'spectacular', 'phenomenal', 'terrific', 'fabulous', 'divine',
      'best', 'good', 'nice', 'cool', 'sweet', 'rad', 'sick', 'dope', 'fire',
      'lit', 'epic', 'legendary', 'godlike', 'insane', 'crazy', 'wild', 'beast',
      'movie', 'film', 'show', 'song', 'music', 'game', 'book', 'restaurant',
      'food', 'dish', 'meal', 'place', 'spot', 'location', 'experience'
    ]),
    negativeIndicators: new Set([
      'hate', 'terrible', 'awful', 'horrible', 'disgusting', 'pathetic', 'stupid',
      'idiot', 'moron', 'loser', 'worthless', 'useless', 'garbage', 'trash',
      'suck', 'sucks', 'worst', 'bad', 'ugly', 'gross', 'nasty', 'annoying',
      'irritating', 'frustrating', 'disappointing', 'lame', 'weak', 'fail',
      'you', 'your', 'yourself', 'u', 'ur', 'ure', 'youre'
    ]),
    positivePhrases: new Map([
      ['the bomb', 0.9], // "this movie is the bomb"
      ['da bomb', 0.9], // slang for "the best"
      ['bomb.com', 0.9], // website reference
      ['bomb diggity', 0.9], // slang for excellent
      ['photo bomb', 0.8], // photography term
      ['bath bomb', 0.8], // cosmetic product
      ['bomb squad', 0.7], // could be neutral/positive in gaming
    ]),
    negativePhrases: new Map([
      ['you are', 0.1], // "you are [profanity]"
      ['ur a', 0.1], // "ur a [profanity]"
      ['such a', 0.2], // "such a [profanity]"
      ['fucking', 0.1], // intensifier, usually negative
      ['damn', 0.2], // mild profanity, context dependent
    ]),
    domains: {
      gaming: {
        positiveIndicators: new Set([
          'player', 'gamer', 'team', 'squad', 'clan', 'guild', 'match', 'game',
          'round', 'level', 'boss', 'raid', 'quest', 'achievement', 'skill',
          'build', 'loadout', 'strategy', 'tactic', 'play', 'move', 'combo'
        ]),
        acceptableWords: new Set([
          'kill', 'killer', 'killed', 'killing',
          'shoot', 'shot', 'shooting',
          'die', 'dying', 'died', 'dead', 'death',
          'badass', 'sick', 'insane', 'crazy', 'mad', 'beast', 'savage',
          'suck', 'sucks',
          'wtf', 'omg', 'hell', 'damn', 'crap'
        ])
      }
    },
    personalPronouns: new Set(['you', 'your', 'u', 'ur']),
    objectReferences: new Set(['movie', 'song', 'game', 'book', 'show', 'this', 'that', 'it'])
  }
};
