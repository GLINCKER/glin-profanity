import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/plugin.ts',
    'src/skills.ts',
    'src/hooks.ts',
    'src/mcp.ts',
  ],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  external: [
    'glin-profanity',
    '@sinclair/typebox',
  ],
  treeshake: true,
  splitting: false,
});
