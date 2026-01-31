/**
 * AI Integrations for glin-profanity
 *
 * This module re-exports all AI framework integrations.
 * For tree-shaking benefits, import from specific subpaths:
 *
 * @example
 * ```typescript
 * // Recommended: Import from specific subpath for smaller bundles
 * import { profanityTools } from 'glin-profanity/ai/openai';
 * import { profanityCheckTool } from 'glin-profanity/ai/langchain';
 * import { profanityTools } from 'glin-profanity/ai/vercel';
 * import { createSemanticAnalyzer } from 'glin-profanity/ai/semantic';
 *
 * // Alternative: Import all from this index (larger bundle)
 * import * as integrations from 'glin-profanity/ai';
 * ```
 *
 * @packageDocumentation
 * @module glin-profanity/ai
 */

// OpenAI Integration
export {
  profanityTools as openaiTools,
  profanityToolSchemas as openaiToolSchemas,
  executeProfanityTool as executeOpenAITool,
  createRunnableTools as createOpenAIRunnableTools,
  type OpenAITool,
  type CheckProfanityParams,
  type CensorTextParams,
  type BatchCheckParams,
  type AnalyzeContextParams,
} from './openai';

// LangChain Integration
export {
  profanityCheckTool as langchainProfanityCheckTool,
  censorTextTool as langchainCensorTextTool,
  batchCheckTool as langchainBatchCheckTool,
  contextAnalysisTool as langchainContextAnalysisTool,
  supportedLanguagesTool as langchainSupportedLanguagesTool,
  allProfanityTools as langchainAllTools,
  createProfanityCheckTool as createLangChainProfanityCheckTool,
  createCensorTextTool as createLangChainCensorTextTool,
  createBatchCheckTool as createLangChainBatchCheckTool,
  createContextAnalysisTool as createLangChainContextAnalysisTool,
  createSupportedLanguagesTool as createLangChainSupportedLanguagesTool,
  createAllProfanityTools as createLangChainAllTools,
  type LangChainTool,
  type CheckProfanityInput as LangChainCheckProfanityInput,
  type CensorTextInput as LangChainCensorTextInput,
  type BatchCheckInput as LangChainBatchCheckInput,
  type AnalyzeContextInput as LangChainAnalyzeContextInput,
} from './langchain';

// Vercel AI SDK Integration
export {
  profanityTools as vercelAITools,
  profanityMiddleware as vercelAIMiddleware,
  createCheckProfanityTool as createVercelCheckProfanityTool,
  createCensorTextTool as createVercelCensorTextTool,
  createBatchCheckTool as createVercelBatchCheckTool,
  createContextAnalysisTool as createVercelContextAnalysisTool,
  createSupportedLanguagesTool as createVercelSupportedLanguagesTool,
  createAllProfanityTools as createVercelAllTools,
  type VercelAITool,
  type CheckProfanityInput as VercelCheckProfanityInput,
  type CensorTextInput as VercelCensorTextInput,
  type BatchCheckInput as VercelBatchCheckInput,
  type AnalyzeContextInput as VercelAnalyzeContextInput,
  type CheckProfanityOutput,
  type CensorTextOutput,
  type BatchCheckOutput,
  type AnalyzeContextOutput,
  type SupportedLanguagesOutput,
} from './vercel-ai';

// Semantic Analysis Integration
export {
  createSemanticAnalyzer,
  semanticHooks,
  createOpenAIEmbeddingProvider,
  type EmbeddingProvider,
  type SemanticAnalyzerConfig,
  type SemanticAnalysisResult,
} from './semantic';
