# Glin-Profanity Roadmap

This document outlines the future direction and planned features for glin-profanity.

## Vision

Glin-profanity aims to be the most comprehensive, developer-friendly, and AI-native content moderation library available. We're building for a future where AI assistants and applications need reliable, fast, and intelligent profanity detection.

---

## Market Opportunity

Content moderation is a **$14B market in 2026**, growing to **$42B by 2035** (13% CAGR).
- Cloud/SaaS deployment: 70% of market by 2035
- Key competitors: OpenAI Moderation (free), Azure Content Safety, Sightengine, Hive

### Our Differentiators

| Feature | OpenAI | Azure | Sightengine | glin-profanity |
|---------|--------|-------|-------------|----------------|
| Languages | 1 | Few | Few | **24** |
| Self-hosted | ❌ | ❌ | ❌ | **✅** |
| Open Source | ❌ | ❌ | ❌ | **✅** |
| Leetspeak | ❌ | ❌ | ✅ | **✅** |
| AI Framework SDKs | N/A | N/A | ❌ | **✅** |
| Price | Free | $0.38/1K | Paid | **Free** |

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  HYBRID DETECTION ARCHITECTURE                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Input Text                                                     │
│      ↓                                                          │
│  ┌─────────────────────────────────────────────┐                │
│  │  Layer 1: Dictionary (Core - Always Fast)   │  ~1ms         │
│  │  • 24 language word lists                   │                │
│  │  • Leetspeak normalization                  │                │
│  │  • Unicode homoglyph detection              │                │
│  │  • Context-aware filtering                  │                │
│  └─────────────────────────────────────────────┘                │
│      ↓ (optional, for edge cases)                               │
│  ┌─────────────────────────────────────────────┐                │
│  │  Layer 2: ML Model (Optional - Accurate)    │  ~50-100ms    │
│  │  • transformers.js + ONNX                   │                │
│  │  • Pre-trained: pardonmyai, toxic-bert      │                │
│  │  • Context understanding                    │                │
│  └─────────────────────────────────────────────┘                │
│      ↓                                                          │
│  Combined Result (confidence score + detected words)            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Current State (v3.2.0 + MCP v1.2.0 + AI Integrations)

- 24 language support
- Leetspeak detection (basic, moderate, aggressive)
- Unicode homoglyph normalization
- Context-aware filtering
- React hooks support
- Optional ML/TensorFlow integration
- **MCP Server v1.2.0** with:
  - 19 tools for content moderation
  - 5 workflow prompts
  - 5 reference resources
  - Conversation memory (user tracking)
  - Real-time streaming support
  - HTTP transport for cloud deployment
- **AI Framework Integrations** (NEW):
  - OpenAI function calling tools (`glin-profanity/ai/openai`)
  - LangChain tools (`glin-profanity/ai/langchain`)
  - Vercel AI SDK tools + middleware (`glin-profanity/ai/vercel`)
  - Semantic analysis with embeddings (`glin-profanity/ai/semantic`)

---

## Q1 2026: AI-Native Features

### MCP Server Enhancements
- [x] **Streaming support** - Real-time profanity detection for chat streams ✅
- [x] **Conversation memory** - Track user behavior patterns across messages ✅
- [x] **Smart prompts** - Pre-built prompts for common moderation workflows ✅
- [x] **HTTP transport** - Deploy as a remote MCP server for cloud scenarios ✅

### AI Integration APIs
- [x] **OpenAI function calling** - Direct integration with GPT models ✅
- [x] **LangChain tool** - Native LangChain integration ✅
- [x] **Vercel AI SDK** - Middleware for AI applications ✅
- [x] **Semantic analysis hooks** - Combine with embeddings for semantic moderation ✅

---

## Q2 2026: Advanced Detection & ML

### Multi-Modal Support
> **Strategy**: BYO (Bring Your Own) approach - keep core lightweight, optional integrations

- [ ] **Image text extraction (OCR)** - `glin-profanity/ocr` subpath with Tesseract.js
  - Approach: Optional peer dependency, users install if needed
  - Bundle impact: 0 in core, ~5MB if OCR module imported
- [ ] **Audio transcription integration** - `glin-profanity/audio` subpath
  - Approach: Accept transcribed text from Whisper/Google STT/etc.
  - NOT bundling Whisper - just provide pipeline utilities
- [ ] **Meme detection** - DEFERRED (complex, low ROI for now)

### ML-Enhanced Detection (Hybrid Approach)
> **Strategy**: Dictionary-first (fast), ML-second (accurate when needed)
> Based on research: [Detoxify](https://github.com/unitaryai/detoxify), [transformers.js](https://huggingface.co/docs/transformers.js)

- [ ] **transformers.js integration** - Optional ONNX model support
  - Use existing models: [pardonmyai](https://huggingface.co/tarekziade/pardonmyai) (97.5% accuracy)
  - Fallback to dictionary when ML unavailable
- [ ] **Confidence scoring** - ML provides probability, dictionary provides certainty
- [ ] **Custom model training guide** - Documentation for fine-tuning
- [ ] **Hugging Face Space** - Interactive demo for market visibility

### Language Improvements
> **Note**: Dictionary approach works well for 24 languages. ML models (XLM-RoBERTa) could improve
> low-resource languages by +23% but require significant model size (~500MB).

- [ ] **Improve word lists** - Community contributions for existing 24 languages
- [ ] **Add high-demand languages** - Vietnamese, Indonesian, Tagalog (based on npm usage)
- [ ] **Regional variants** - British vs. American English profanity
- [ ] **Slang database** - Gen-Z, internet culture, gaming terms

### Enhanced NLP
- [ ] **Sentiment + profanity combo** - Is it angry profanity or friendly banter?
- [ ] **Intent classification** - Threat detection vs. casual swearing
- [ ] **Toxicity gradients** - Severity levels with ML confidence

---

## Q3 2026: Enterprise Features

### Moderation Workflows
- [ ] **Queue management** - Moderation queue API
- [ ] **Appeal handling** - False positive reporting and learning
- [ ] **Audit logging** - Detailed logs for compliance
- [ ] **Rule builder** - Visual rule creation interface

### Performance & Scale
- [ ] **Edge deployment** - Cloudflare Workers, Vercel Edge
- [ ] **WebAssembly** - WASM build for browser-native speed
- [ ] **Redis caching** - Distributed caching for high throughput
- [ ] **Batch API** - 10,000+ texts per second processing

### Compliance
- [ ] **GDPR tools** - Data handling compliance helpers
- [ ] **Content policies** - Pre-built policy templates (COPPA, CIPA, etc.)
- [ ] **Reporting dashboards** - Analytics and metrics
- [ ] **Export formats** - Compliance report generation

---

## Q4 2026: Ecosystem Expansion

### Framework Integrations
- [ ] **Next.js middleware** - Server/edge middleware component
- [ ] **Remix loader** - Native Remix integration
- [ ] **SvelteKit hooks** - Svelte integration
- [ ] **Vue composables** - Vue 3 composition API
- [ ] **Astro integration** - Astro middleware

### Platform SDKs
- [ ] **Discord.js plugin** - Bot integration
- [ ] **Slack app** - Workspace moderation
- [ ] **Twitch extension** - Chat moderation
- [ ] **Telegram bot** - Channel moderation
- [ ] **Matrix bridge** - Decentralized chat moderation

### Mobile
- [ ] **React Native module** - Native mobile support
- [ ] **Flutter plugin** - Cross-platform mobile
- [ ] **Swift package** - iOS native
- [ ] **Kotlin library** - Android native

---

## 2027 and Beyond

### AI Model Training
- [ ] **Custom model training** - Train on your organization's data
- [ ] **Federated learning** - Learn from usage without data collection
- [ ] **Transfer learning** - Fine-tune for specific domains

### Advanced AI Features
- [ ] **Agentic moderation** - AI agents that handle entire moderation workflows
- [ ] **Explainable AI** - Detailed reasoning for each decision
- [ ] **Adversarial robustness** - Resistance to prompt injection in moderation

### Community
- [ ] **Word list contributions** - Community-driven dictionary updates
- [ ] **Plugin marketplace** - Third-party extensions
- [ ] **Bounty program** - Rewards for evasion technique reports

---

## Monetization Strategy

### Open Core Model

| Tier | Price | Features |
|------|-------|----------|
| **Free (npm)** | $0 | Dictionary detection, 24 languages, AI integrations |
| **Pro API** | $9/mo | Hosted API, OCR, Audio, Higher rate limits |
| **Enterprise** | Custom | Self-hosted, SLA, Support, Custom training |

### Revenue Streams

1. **Hosted API** - Deploy on Vercel/Railway, charge per request
2. **Hugging Face Inference Endpoint** - Model hosting with HF billing
3. **Enterprise Licenses** - Self-hosted with support contracts
4. **Consulting** - Custom moderation solutions for large platforms

### Hugging Face Presence (Build Credibility)

- [ ] Publish model on HF Hub (free, builds awareness)
- [ ] Create Gradio Space (interactive demo)
- [ ] Offer Inference Endpoint (production API)

---

## Contributing

We welcome contributions! Priority areas:

1. **Language experts** - Help expand/improve language dictionaries
2. **ML engineers** - Improve detection models
3. **Platform experts** - Build integrations for your favorite platforms
4. **Security researchers** - Find and report evasion techniques

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

## Feature Requests

Have an idea? Open an issue with the `enhancement` label:
https://github.com/GLINCKER/glin-profanity/issues/new

---

## Version History

| Version | Date | Highlights |
|---------|------|------------|
| 3.2.1 | Jan 2026 | AI Integrations (OpenAI, LangChain, Vercel AI SDK, Semantic) |
| MCP 1.2.0 | Jan 2026 | Streaming, conversation memory, HTTP transport, 19 tools |
| 3.2.0 | Jan 2026 | MCP Server, dictionary fixes |
| 3.1.0 | Dec 2025 | Context-aware filtering, leetspeak detection |
| 3.0.0 | Nov 2025 | TypeScript rewrite, unified JS/Python API |
| 2.x | 2024 | Initial Python package |
| 1.x | 2023 | Original JavaScript package |

---

*Last updated: January 2026*
