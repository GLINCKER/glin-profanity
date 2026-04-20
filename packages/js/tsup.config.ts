import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/react.ts',
    'src/ml/index.ts',
    'src/ml/transformers.ts',
    // AI Integrations
    'src/integrations/index.ts',
    'src/integrations/openai.ts',
    'src/integrations/langchain.ts',
    'src/integrations/vercel-ai.ts',
    'src/integrations/semantic.ts',
    // Multi-modal (OCR, Audio)
    'src/multimodal/index.ts',
    'src/multimodal/ocr.ts',
    'src/multimodal/audio.ts',
    // Framework Integrations
    'src/frameworks/index.ts',
    'src/frameworks/nextjs.ts',
    // Scanners (AI guardrail — Phase A)
    'src/scanners/index.ts',
  ],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  external: [
    'react',
    '@tensorflow/tfjs',
    '@tensorflow-models/toxicity',
    // AI SDK peer dependencies (optional)
    'zod',
    'openai',
    '@langchain/core',
    'ai',
    // Transformers.js (optional)
    '@xenova/transformers',
    // OCR (optional)
    'tesseract.js',
  ],
  treeshake: true,
  splitting: false,
});
