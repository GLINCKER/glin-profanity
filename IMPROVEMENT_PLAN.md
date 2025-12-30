# Glin-Profanity v3 - The Ultimate Profanity Library

> Goal: Make glin-profanity the single best profanity detection library for developers

## Current Status

| Item | Status |
|------|--------|
| Local Build | PASSING |
| CI/CD npm (OIDC) | CONFIGURED |
| CI/CD PyPI | Needs OIDC setup |
| Version | 2.3.8 |

---

## Implementation Checklist

### Phase 1: Infrastructure (CI/CD Fixes)

- [x] Fix npm publishing - Switch to OIDC trusted publisher
- [x] Add tag existence check in auto-release workflow
- [x] Skip releases for dependency/maintenance commits
- [ ] Set up PyPI trusted publisher (OIDC)
- [x] Add dependabot.yml with PR limits
- [ ] Add auto-merge workflow for deps

### Phase 2: Core Features (v3)

#### 2.1 Enhanced Leetspeak Detection
| Task | JavaScript | Python | Tested |
|------|------------|--------|--------|
| Create character substitution map | [x] | [x] | [x] |
| Handle common substitutions (4→a, 0→o, 1→i, etc.) | [x] | [x] | [x] |
| Handle symbol substitutions (@→a, $→s, !→i) | [x] | [x] | [x] |
| Handle repeated characters (fuuuck) | [x] | [x] | [x] |
| Handle spaced characters (f u c k) | [x] | [x] | [x] |
| Add `detectLeetspeak` option | [x] | [x] | [x] |

#### 2.2 Unicode Normalization
| Task | JavaScript | Python | Tested |
|------|------------|--------|--------|
| Normalize unicode characters (NFKD) | [x] | [x] | [x] |
| Handle homoglyphs (а→a cyrillic) | [x] | [x] | [x] |
| Handle full-width characters | [x] | [x] | [x] |
| Handle combining diacritical marks | [x] | [x] | [x] |
| Add `normalizeUnicode` option | [x] | [x] | [x] |

#### 2.3 Performance Optimizations
| Task | JavaScript | Python | Tested |
|------|------------|--------|--------|
| Add lazy dictionary loading | [ ] | [ ] | [ ] |
| Implement Aho-Corasick algorithm | [ ] | [ ] | [ ] |
| Add caching for repeated checks | [x] | [x] | [x] |
| Create benchmark suite | [ ] | [ ] | [ ] |
| Document performance vs competitors | [ ] | [ ] | [ ] |

### Phase 3: Developer Experience

#### 3.1 CLI Tool
| Task | JavaScript | Tested |
|------|------------|--------|
| `npx glin-profanity check "text"` | [ ] | [ ] |
| `npx glin-profanity --languages en,es` | [ ] | [ ] |
| `npx glin-profanity --file input.txt` | [ ] | [ ] |
| Add help and version commands | [ ] | [ ] |

#### 3.2 Framework Integrations
| Task | JavaScript | Python | Tested |
|------|------------|--------|--------|
| Express.js middleware | [ ] | N/A | [ ] |
| Fastify plugin | [ ] | N/A | [ ] |
| Next.js API route wrapper | [ ] | N/A | [ ] |
| Flask middleware | N/A | [ ] | [ ] |
| FastAPI middleware | N/A | [ ] | [ ] |
| Django middleware | N/A | [ ] | [ ] |

#### 3.3 Documentation
| Task | Status |
|------|--------|
| Add interactive playground | [ ] |
| Migration guide from bad-words | [ ] |
| Migration guide from better-profanity | [ ] |
| Performance benchmark results | [ ] |
| API reference docs | [ ] |

### Phase 4: Advanced Features (Future)

- [ ] ML-based detection (TensorFlow.js / scikit-learn)
- [ ] Context-aware filtering (sentence analysis)
- [ ] Custom model training support
- [ ] Severity scoring improvements

### Phase 5: AI Integration & glin-profanity-cli (Future)

> **Note**: These are optional future enhancements to make the library more attractive

#### 5.1 AI-Powered Detection
| Task | Status | Description |
|------|--------|-------------|
| OpenAI/Claude API integration | [ ] | Optional AI-powered context analysis |
| Local LLM support (Ollama) | [ ] | Privacy-first local AI detection |
| Toxicity scoring API | [ ] | Return confidence scores 0-1 |
| Intent classification | [ ] | Classify: insult, slur, threat, spam |
| Language auto-detection | [ ] | Auto-detect input language |

**API Design:**
```typescript
// Optional AI mode - requires API key
const result = await checkProfanity('text', {
  aiMode: true,
  aiProvider: 'openai' | 'anthropic' | 'ollama',
  aiModel: 'gpt-4o-mini',  // Cost-effective default
  aiApiKey: process.env.OPENAI_API_KEY,
});

// Returns enhanced result
result.aiAnalysis = {
  toxicityScore: 0.87,
  intent: 'insult',
  confidence: 0.92,
  explanation: 'Contains targeted insult with derogatory language',
};
```

#### 5.2 glin-profanity-cli (Standalone CLI Tool)
| Task | Status | Description |
|------|--------|-------------|
| Standalone npm package | [ ] | `npm install -g glin-profanity-cli` |
| Check single text | [ ] | `glin-profanity "check this text"` |
| Check file | [ ] | `glin-profanity --file input.txt` |
| Check stdin pipe | [ ] | `echo "text" \| glin-profanity` |
| Watch mode | [ ] | `glin-profanity --watch ./src` |
| Output formats | [ ] | `--format json\|table\|simple` |
| CI integration | [ ] | Exit code 1 if profanity found |
| Config file support | [ ] | `.glinprofanityrc.json` |
| Pre-commit hook setup | [ ] | `glin-profanity init-hooks` |

**CLI Usage Examples:**
```bash
# Basic usage
glin-profanity "check this text for profanity"

# Check file with specific languages
glin-profanity --file comments.txt --languages en,es

# JSON output for CI/CD
glin-profanity --file src/**/*.ts --format json --strict

# Watch mode for development
glin-profanity --watch ./content --on-detect "notify-send 'Profanity found'"

# Pre-commit hook integration
glin-profanity init-hooks  # Sets up husky/lint-staged

# Configuration file (.glinprofanityrc.json)
{
  "languages": ["english", "spanish"],
  "detectLeetspeak": true,
  "ignoreWords": ["scunthorpe", "arsenal"],
  "strict": true,
  "exclude": ["node_modules", "*.test.ts"]
}
```

#### 5.3 Why glin-profanity-cli as Separate Package?
- **Cleaner dependencies**: Main lib stays lightweight
- **Optional installation**: Not everyone needs CLI
- **Different versioning**: CLI can evolve independently
- **CI/CD focus**: Optimized for pipeline usage

---

### Phase 6: README & Documentation Updates

> **After all features are implemented, update these:**

| Task | Status |
|------|--------|
| Update README.md with new features | [ ] |
| Add leetspeak detection examples | [ ] |
| Add Unicode normalization examples | [ ] |
| Add CLI usage section | [ ] |
| Add framework integration examples | [ ] |
| Add migration guides | [ ] |
| Add performance benchmarks | [ ] |
| Add badges (npm, downloads, coverage) | [ ] |
| Create CONTRIBUTING.md | [ ] |
| Update CHANGELOG.md for v3.0.0 | [ ] |

---

## Character Substitution Map (Leetspeak)

```
Standard Leetspeak:
a → 4, @, ^, /\, /-\, aye
b → 8, |3, 13, ß
c → (, {, [, <
d → |), |>, [)
e → 3, €, &, ë
f → |=, ph
g → 6, 9, &
h → #, |-|, }{
i → 1, !, |, l
j → _|, _/
k → |<, |{
l → 1, |_, |
m → /\/\, |V|, [V]
n → /\/, |V, |\|
o → 0, (), []
p → |*, |o
q → 0_, (,)
r → |2, |?, ®
s → 5, $, §
t → 7, +, †
u → |_|, \_\, /_/
v → \/, \/
w → \/\/, vv, \N
x → ><, }{
y → '/, ¥
z → 2, 7_, %

Common shortcuts:
f4ck → fuck
sh1t → shit
b1tch → bitch
@ss → ass
pr0n → porn
```

---

## API Design (New Options)

### JavaScript
```typescript
import { checkProfanity } from 'glin-profanity';

const result = checkProfanity('f4ck this sh1t', {
  languages: ['english'],

  // NEW: Leetspeak detection
  detectLeetspeak: true,        // Default: false
  leetspeakLevel: 'moderate',   // 'basic' | 'moderate' | 'aggressive'

  // NEW: Unicode normalization
  normalizeUnicode: true,       // Default: true

  // NEW: Performance options
  cacheResults: true,           // Default: false
  lazyLoad: true,               // Default: true

  // Existing options
  fuzzyToleranceLevel: 0.8,
  allowObfuscatedMatch: true,
  ignoreWords: ['scunthorpe'],
});
```

### Python
```python
from glin_profanity import check_profanity

result = check_profanity('f4ck this sh1t',
    languages=['english'],

    # NEW: Leetspeak detection
    detect_leetspeak=True,
    leetspeak_level='moderate',

    # NEW: Unicode normalization
    normalize_unicode=True,

    # NEW: Performance options
    cache_results=True,
    lazy_load=True,

    # Existing options
    fuzzy_tolerance_level=0.8,
    allow_obfuscated_match=True,
    ignore_words=['scunthorpe'],
)
```

---

## File Structure for New Features

```
packages/js/src/
├── core/
│   └── index.ts           # Main API
├── filters/
│   └── Filter.ts          # Core filter
├── utils/
│   ├── leetspeak.ts       # NEW: Leetspeak normalization
│   ├── unicode.ts         # NEW: Unicode normalization
│   └── cache.ts           # NEW: Result caching
├── cli/
│   └── index.ts           # NEW: CLI entry point
└── middleware/
    ├── express.ts         # NEW: Express middleware
    ├── fastify.ts         # NEW: Fastify plugin
    └── nextjs.ts          # NEW: Next.js wrapper

packages/py/glin_profanity/
├── core.py                # Main API
├── filter.py              # Core filter
├── utils/
│   ├── leetspeak.py       # NEW: Leetspeak normalization
│   ├── unicode.py         # NEW: Unicode normalization
│   └── cache.py           # NEW: Result caching
└── middleware/
    ├── flask.py           # NEW: Flask middleware
    ├── fastapi.py         # NEW: FastAPI middleware
    └── django.py          # NEW: Django middleware
```

---

## Testing Checklist

### Leetspeak Detection Tests
```
Input: "f4ck"        → Expected: detected as "fuck"
Input: "sh!t"        → Expected: detected as "shit"
Input: "b1tch"       → Expected: detected as "bitch"
Input: "@ss"         → Expected: detected as "ass"
Input: "pr0n"        → Expected: detected as "porn"
Input: "f u c k"     → Expected: detected as "fuck"
Input: "fuuuuck"     → Expected: detected as "fuck"
Input: "fück"        → Expected: detected as "fuck" (unicode)
```

### Unicode Tests
```
Input: "fυck" (greek upsilon)  → Expected: detected
Input: "fＵck" (fullwidth U)   → Expected: detected
Input: "fück" (umlaut)         → Expected: detected
Input: "fùck" (grave)          → Expected: detected
```

### Performance Tests
```
- 1000 short strings: < 50ms
- 1000 medium strings: < 200ms
- 1000 long strings: < 500ms
- Memory usage: < 50MB loaded
```

---

## Release Checklist

### Pre-Release
- [ ] All checklist items above completed
- [ ] All tests passing (JS + Python)
- [ ] Build successful locally
- [ ] Documentation updated
- [ ] CHANGELOG updated
- [ ] Version bumped to 3.0.0

### Release
- [ ] Create PR from feat/v3-enhancements to release
- [ ] Code review completed
- [ ] CI passes
- [ ] Merge PR
- [ ] Verify npm publish (OIDC)
- [ ] Verify PyPI publish
- [ ] GitHub release created
- [ ] Announce on social media

---

*Last Updated: 2025-12-29*
