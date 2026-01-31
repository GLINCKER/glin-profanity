import { Filter } from '../src/filters/Filter';

describe('Domain Specific Whitelisting', () => {
  let filter: Filter;

  beforeEach(() => {
    filter = new Filter({
      enableContextAware: true,
      contextWindow: 3,
      confidenceThreshold: 0.7,
      languages: ['english'],
      logProfanity: false,
    });
  });

  it('verifies baseline: profane word without context is flagged', () => {
    const result = filter.checkProfanity('You are a bitch');
    expect(result.containsProfanity).toBe(true);
  });

  it('correctly flags profanity even if gaming context is present (Fixed Behavior)', () => {
    // "bitch" is profane.
    // "player" is in GAMING_POSITIVE.
    // "bitch" is NOT in GAMING_ACCEPTABLE_WORDS.
    // So it should remain profane.
    // Before the fix, "player" would cause isDomainWhitelisted to return true.
    // After the fix, isDomainWhitelisted returns false.
    // Sentiment analysis: "you" (negative) vs "player" (positive).
    const text = 'You bitch player';
    const result = filter.checkProfanity(text);

    expect(result.containsProfanity).toBe(true);
    if (result.matches && result.matches.length > 0) {
        // It should NOT be whitelisted
        expect(result.matches[0].isWhitelisted).toBe(false);
    }
  });

  it('whitelists acceptable gaming words in gaming context', () => {
      const text = 'This game sucks'; // "sucks" is in GAMING_ACCEPTABLE_WORDS
      const result = filter.checkProfanity(text);
      expect(result.containsProfanity).toBe(false);
      // Wait, if "sucks" is whitelisted, containsProfanity might be false OR true but isWhitelisted=true?
      // checkProfanity implementation:
      // if (contextResult.isWhitelisted) { continue; }
      // So if whitelisted, it is NOT added to matches/profaneWords.
      // So containsProfanity should be false.

      const text2 = 'You are a badass player'; // "badass" is in GAMING_ACCEPTABLE_WORDS
      const result2 = filter.checkProfanity(text2);
      expect(result2.containsProfanity).toBe(false);
  });
});
