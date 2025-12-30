# ML-Based Toxicity Detection Guide

This guide covers the optional Machine Learning integration in glin-profanity v3.0+.

## Overview

The ML module provides TensorFlow.js-powered toxicity detection for context-aware content filtering beyond simple keyword matching.

**Key Benefits:**
- Detects subtle toxicity, insults, and threats that keywords miss
- Context-aware analysis (understands meaning, not just words)
- Configurable confidence thresholds
- Works alongside rule-based filtering for comprehensive coverage

## Installation

The ML module requires optional peer dependencies:

```bash
npm install @tensorflow/tfjs @tensorflow-models/toxicity
```

## Usage

### Standalone ToxicityDetector

For ML-only toxicity analysis:

```typescript
import { ToxicityDetector } from 'glin-profanity/ml';

const detector = new ToxicityDetector({
  threshold: 0.9  // Confidence threshold (0-1)
});

// Load the model (downloads ~5MB on first use)
await detector.loadModel();

// Analyze text
const result = await detector.analyze('you are terrible');

console.log(result.isToxic);        // true/false
console.log(result.predictions);    // Array of category predictions
console.log(result.matchedCategories); // ['insult', 'toxicity']
```

### HybridFilter (Rules + ML)

Combines rule-based profanity detection with ML analysis:

```typescript
import { HybridFilter } from 'glin-profanity/ml';

const filter = new HybridFilter({
  // Rule-based options
  languages: ['english'],
  detectLeetspeak: true,
  normalizeUnicode: true,

  // ML options
  enableML: true,
  mlThreshold: 0.85,
  combinationMode: 'or',  // 'or' | 'and' | 'ml-override' | 'rules-first'
});

// Initialize (loads ML model)
await filter.initialize();

// Async hybrid check (rules + ML)
const result = await filter.checkProfanityAsync('text to analyze');

console.log(result.containsProfanity); // Rule-based result
console.log(result.isToxic);           // ML result
console.log(result.mlResult);          // Full ML analysis

// Sync rule-based check (fast, no ML)
filter.isProfane('badword'); // true
```

## Combination Modes

The `combinationMode` option controls how rule-based and ML results combine:

| Mode | Description |
|------|-------------|
| `'or'` | Flag if EITHER rules OR ML detect issues (default) |
| `'and'` | Flag only if BOTH rules AND ML agree |
| `'ml-override'` | ML result takes precedence over rules |
| `'rules-first'` | Use ML only if rules find nothing |

## ML Categories

The toxicity model detects these categories:

| Category | Description |
|----------|-------------|
| `toxicity` | General toxic content |
| `severe_toxicity` | Highly toxic content |
| `insult` | Personal insults and attacks |
| `threat` | Threatening language |
| `identity_attack` | Identity-based hate speech |
| `obscene` | Obscene/vulgar content |
| `sexual_explicit` | Sexually explicit content |

## Performance Considerations

### First Load
- Model downloads ~5MB from TensorFlow Hub
- Takes 2-5 seconds depending on connection
- Browser caches model files for subsequent loads

### Analysis Speed
- ML analysis: ~500ms-2s per text
- Rule-based: ~0.04ms per text
- Use rule-based for real-time (typing) validation
- Use ML for submit/post validation

### Offline Usage

The model requires an internet connection for first download. For offline apps:

**Option 1: Browser Cache**
```javascript
// Model cached after first load
// Works offline on subsequent page loads
```

**Option 2: Service Worker**
```javascript
// Cache model files with service worker
self.addEventListener('fetch', event => {
  if (event.request.url.includes('tensorflow')) {
    event.respondWith(caches.match(event.request));
  }
});
```

**Option 3: IndexedDB (TensorFlow.js native)**
```typescript
// Save model after load
await model.save('indexeddb://toxicity-model');

// Load from IndexedDB later
const model = await tf.loadGraphModel('indexeddb://toxicity-model');
```

## Best Practices

### 1. Use Appropriate Thresholds

```typescript
// Stricter (fewer false positives, may miss subtle toxicity)
mlThreshold: 0.95

// Balanced (recommended)
mlThreshold: 0.85

// Lenient (catches more, more false positives)
mlThreshold: 0.7
```

### 2. Combine with Rules

```typescript
// Best coverage: use both
const filter = new HybridFilter({
  languages: ['english'],
  detectLeetspeak: true,
  enableML: true,
  combinationMode: 'or',
});
```

### 3. Handle Loading States

```typescript
const [isReady, setIsReady] = useState(false);

useEffect(() => {
  filter.initialize().then(() => setIsReady(true));
}, []);

// Show loading state while model loads
if (!isReady) return <LoadingSpinner />;
```

### 4. Graceful Fallback

```typescript
try {
  await filter.initialize();
} catch (err) {
  console.warn('ML unavailable, using rules only');
  // Filter still works with rule-based detection
}
```

## API Reference

### ToxicityDetector

```typescript
interface MLDetectorConfig {
  threshold?: number;      // Default: 0.9
  labels?: ToxicityLabel[]; // Which categories to detect
}

class ToxicityDetector {
  constructor(config?: MLDetectorConfig);
  loadModel(): Promise<void>;
  analyze(text: string): Promise<MLAnalysisResult>;
  isModelLoaded(): boolean;
}
```

### HybridFilter

```typescript
interface HybridFilterConfig extends FilterConfig {
  enableML?: boolean;
  mlThreshold?: number;
  combinationMode?: 'or' | 'and' | 'ml-override' | 'rules-first';
}

class HybridFilter extends Filter {
  constructor(config?: HybridFilterConfig);
  initialize(): Promise<void>;
  checkProfanityAsync(text: string): Promise<HybridAnalysisResult>;
}
```

### Result Types

```typescript
interface MLAnalysisResult {
  isToxic: boolean;
  predictions: ToxicityPrediction[];
  matchedCategories: ToxicityLabel[];
  processingTime: number;
}

interface HybridAnalysisResult extends CheckProfanityResult {
  isToxic: boolean;
  mlResult?: MLAnalysisResult;
  confidence: number;
}
```

## Troubleshooting

### CORS Errors on Localhost

TensorFlow Hub may block requests from localhost. Solutions:
1. Deploy to a real domain for testing
2. Use a proxy server
3. Pre-download and host model files locally

### "No backend found" Error

Ensure TensorFlow.js is imported before the toxicity model:

```typescript
// Correct order
import '@tensorflow/tfjs';
import * as toxicity from '@tensorflow-models/toxicity';
```

### Model Too Large

The toxicity model is ~5MB. Alternatives:
- Use rule-based only for size-sensitive apps
- Load model on-demand (not at app start)
- Consider server-side ML for web apps
