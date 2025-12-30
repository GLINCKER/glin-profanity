import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/ml/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  external: [
    'react',
    '@tensorflow/tfjs',
    '@tensorflow-models/toxicity',
  ],
  treeshake: true,
  splitting: false,
});
