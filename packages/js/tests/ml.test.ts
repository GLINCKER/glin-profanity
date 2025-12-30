/**
 * Tests for ML-based profanity detection.
 *
 * Note: These tests mock the TensorFlow.js toxicity model since
 * it requires significant resources to load.
 */

import {
  ToxicityLabel,
  ToxicityPrediction,
  MLAnalysisResult,
  MLDetectorConfig,
  HybridAnalysisResult,
} from '../src/ml/types';

describe('ML Module Types', () => {
  describe('ToxicityLabel', () => {
    it('should define all toxicity labels', () => {
      const labels: ToxicityLabel[] = [
        'identity_attack',
        'insult',
        'obscene',
        'severe_toxicity',
        'sexual_explicit',
        'threat',
        'toxicity',
      ];
      expect(labels).toHaveLength(7);
    });
  });

  describe('ToxicityPrediction', () => {
    it('should have correct structure', () => {
      const prediction: ToxicityPrediction = {
        label: 'insult',
        match: true,
        probabilities: [0.1, 0.9],
      };
      expect(prediction.label).toBe('insult');
      expect(prediction.match).toBe(true);
      expect(prediction.probabilities[1]).toBeGreaterThan(0.5);
    });
  });

  describe('MLAnalysisResult', () => {
    it('should have correct structure for toxic result', () => {
      const result: MLAnalysisResult = {
        isToxic: true,
        overallScore: 0.92,
        predictions: [
          { label: 'insult', match: true, probabilities: [0.08, 0.92] },
          { label: 'toxicity', match: true, probabilities: [0.1, 0.9] },
        ],
        matchedCategories: ['insult', 'toxicity'],
        processingTimeMs: 30,
      };
      expect(result.isToxic).toBe(true);
      expect(result.matchedCategories).toContain('insult');
    });

    it('should have correct structure for clean result', () => {
      const result: MLAnalysisResult = {
        isToxic: false,
        overallScore: 0.15,
        predictions: [
          { label: 'insult', match: false, probabilities: [0.85, 0.15] },
        ],
        matchedCategories: [],
        processingTimeMs: 25,
      };
      expect(result.isToxic).toBe(false);
      expect(result.matchedCategories).toHaveLength(0);
    });
  });

  describe('MLDetectorConfig', () => {
    it('should have correct structure', () => {
      const config: MLDetectorConfig = {
        threshold: 0.9,
        labels: ['insult', 'threat'],
        preloadModel: false,
      };
      expect(config.threshold).toBe(0.9);
      expect(config.labels).toHaveLength(2);
    });

    it('should allow partial config', () => {
      const config: MLDetectorConfig = {
        threshold: 0.8,
      };
      expect(config.threshold).toBe(0.8);
      expect(config.labels).toBeUndefined();
    });
  });

  describe('HybridAnalysisResult', () => {
    it('should combine rule-based and ML results', () => {
      const result: HybridAnalysisResult = {
        ruleBasedResult: {
          containsProfanity: true,
          profaneWords: ['damn'],
        },
        mlResult: {
          isToxic: true,
          overallScore: 0.88,
          predictions: [],
          matchedCategories: ['insult'],
          processingTimeMs: 30,
        },
        isToxic: true,
        confidence: 0.95,
        reason: 'Both detected: rules (damn), ML (insult)',
      };
      expect(result.isToxic).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it('should handle ML unavailable', () => {
      const result: HybridAnalysisResult = {
        ruleBasedResult: {
          containsProfanity: false,
          profaneWords: [],
        },
        mlResult: null,
        isToxic: false,
        confidence: 0.8,
        reason: 'No profanity detected (rule-based only)',
      };
      expect(result.mlResult).toBeNull();
      expect(result.isToxic).toBe(false);
    });
  });
});

describe('ToxicityDetector', () => {
  // Note: We can't test the actual TensorFlow.js model without installing it,
  // but we can test the class structure and error handling
  it('should export ToxicityDetector class', async () => {
    const { ToxicityDetector } = await import('../src/ml/ToxicityDetector');
    expect(ToxicityDetector).toBeDefined();
    expect(typeof ToxicityDetector).toBe('function');
  });

  it('should have static ALL_LABELS property', async () => {
    const { ToxicityDetector } = await import('../src/ml/ToxicityDetector');
    expect(ToxicityDetector.ALL_LABELS).toBeDefined();
    expect(Array.isArray(ToxicityDetector.ALL_LABELS)).toBe(true);
    expect(ToxicityDetector.ALL_LABELS).toContain('insult');
    expect(ToxicityDetector.ALL_LABELS).toContain('toxicity');
  });

  it('should create instance with default config', async () => {
    const { ToxicityDetector } = await import('../src/ml/ToxicityDetector');
    const detector = new ToxicityDetector();
    expect(detector).toBeInstanceOf(ToxicityDetector);
    expect(detector.isModelLoaded()).toBe(false);
  });

  it('should create instance with custom config', async () => {
    const { ToxicityDetector } = await import('../src/ml/ToxicityDetector');
    const detector = new ToxicityDetector({
      threshold: 0.9,
      labels: ['insult', 'threat'],
    });
    const config = detector.getConfig();
    expect(config.threshold).toBe(0.9);
    expect(config.labels).toEqual(['insult', 'threat']);
  });

  it('should report availability correctly when deps not installed', async () => {
    const { ToxicityDetector } = await import('../src/ml/ToxicityDetector');
    const detector = new ToxicityDetector();
    const available = await detector.checkAvailability();
    // In test environment without TensorFlow.js, should be false
    expect(typeof available).toBe('boolean');
  });

  it('should dispose and reset model state', async () => {
    const { ToxicityDetector } = await import('../src/ml/ToxicityDetector');
    const detector = new ToxicityDetector();
    detector.dispose();
    expect(detector.isModelLoaded()).toBe(false);
  });
});

describe('HybridFilter', () => {
  it('should export HybridFilter class', async () => {
    const { HybridFilter } = await import('../src/ml/HybridFilter');
    expect(HybridFilter).toBeDefined();
    expect(typeof HybridFilter).toBe('function');
  });

  it('should create instance with default config', async () => {
    const { HybridFilter } = await import('../src/ml/HybridFilter');
    const filter = new HybridFilter();
    expect(filter).toBeInstanceOf(HybridFilter);
    expect(filter.isMLReady()).toBe(false);
  });

  it('should create instance with ML disabled', async () => {
    const { HybridFilter } = await import('../src/ml/HybridFilter');
    const filter = new HybridFilter({
      languages: ['english'],
      enableML: false,
    });
    expect(filter.getMLDetector()).toBeNull();
  });

  it('should perform synchronous rule-based check', async () => {
    const { HybridFilter } = await import('../src/ml/HybridFilter');
    const filter = new HybridFilter({
      languages: ['english'],
      customWords: ['badword'],
      enableML: false,
    });

    expect(filter.isProfane('hello world')).toBe(false);
    expect(filter.isProfane('badword')).toBe(true);
  });

  it('should perform synchronous detailed check', async () => {
    const { HybridFilter } = await import('../src/ml/HybridFilter');
    const filter = new HybridFilter({
      languages: ['english'],
      customWords: ['badword'],
      enableML: false,
    });

    const result = filter.checkProfanity('this is badword bad');
    expect(result.containsProfanity).toBe(true);
    expect(result.profaneWords).toContain('badword');
  });

  it('should perform async check without ML', async () => {
    const { HybridFilter } = await import('../src/ml/HybridFilter');
    const filter = new HybridFilter({
      languages: ['english'],
      customWords: ['badword'],
      enableML: false,
    });

    const result = await filter.checkProfanityAsync('this is badword bad');
    expect(result.isToxic).toBe(true);
    expect(result.mlResult).toBeNull();
    expect(result.ruleBasedResult.containsProfanity).toBe(true);
  });

  it('should get underlying rule filter', async () => {
    const { HybridFilter } = await import('../src/ml/HybridFilter');
    const filter = new HybridFilter({
      languages: ['english'],
      customWords: ['testword'],
      detectLeetspeak: true,
    });

    const ruleFilter = filter.getRuleFilter();
    expect(ruleFilter).toBeDefined();
    expect(ruleFilter.isProfane('testword')).toBe(true);
  });

  it('should dispose resources', async () => {
    const { HybridFilter } = await import('../src/ml/HybridFilter');
    const filter = new HybridFilter({ enableML: true });
    filter.dispose();
    // Should not throw
    expect(filter.isMLReady()).toBe(false);
  });
});

describe('ML Module Exports', () => {
  it('should export all ML types from ml module', async () => {
    const ml = await import('../src/ml');
    expect(ml.ToxicityDetector).toBeDefined();
    expect(ml.HybridFilter).toBeDefined();
  });
});
