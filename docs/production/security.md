# Security Guide

Security best practices for using glin-profanity in production applications.

## Table of Contents

- [Input Validation](#input-validation)
- [Rate Limiting](#rate-limiting)
- [API Key Protection](#api-key-protection)
- [Content Filtering](#content-filtering)
- [Logging & Monitoring](#logging--monitoring)
- [GDPR & Privacy](#gdpr--privacy)
- [Secure Deployment](#secure-deployment)
- [Vulnerability Management](#vulnerability-management)

---

## Input Validation

### Sanitize User Input

**Always validate and sanitize input before processing:**

```typescript
import { z } from 'zod';
import { Filter } from 'glin-profanity';

const ModerationSchema = z.object({
  text: z.string()
    .min(1, 'Text cannot be empty')
    .max(10000, 'Text too long (max 10,000 characters)')
    .trim(),
  userId: z.string().uuid().optional(),
  context: z.enum(['chat', 'comment', 'post']).optional()
});

async function moderateText(input: unknown) {
  try {
    // Validate input
    const validated = ModerationSchema.parse(input);
    
    // Process validated input
    const filter = new Filter();
    return filter.checkProfanity(validated.text);
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid input', error.errors);
    }
    throw error;
  }
}
```

### Prevent Injection Attacks

```typescript
// ❌ BAD: Don't use user input directly
const filter = new Filter({
  customDictionary: JSON.parse(userInput) // DANGEROUS!
});

// ✅ GOOD: Validate and sanitize
const validateCustomWords = (words: unknown): string[] => {
  if (!Array.isArray(words)) {
    throw new Error('Custom words must be an array');
  }
  
  return words
    .filter(word => typeof word === 'string')
    .map(word => word.trim().toLowerCase())
    .filter(word => word.length > 0 && word.length <= 50)
    .slice(0, 100); // Limit to 100 custom words
};

const filter = new Filter({
  customDictionary: new Map(
    validateCustomWords(userInput).map(word => [word, 1.0])
  )
});
```

### Size Limits

```typescript
const MAX_TEXT_LENGTH = 10000;
const MAX_BATCH_SIZE = 100;

function validateTextSize(text: string): void {
  if (text.length > MAX_TEXT_LENGTH) {
    throw new Error(`Text exceeds maximum length of ${MAX_TEXT_LENGTH}`);
  }
}

function validateBatchSize(texts: string[]): void {
  if (texts.length > MAX_BATCH_SIZE) {
    throw new Error(`Batch size exceeds maximum of ${MAX_BATCH_SIZE}`);
  }
}
```

---

## Rate Limiting

### Per-IP Rate Limiting

**Express with express-rate-limit:**

```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

const limiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rate_limit:'
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Optionally exclude certain IPs
  skip: (req) => {
    const trustedIPs = process.env.TRUSTED_IPS?.split(',') || [];
    return trustedIPs.includes(req.ip);
  }
});

app.use('/api/moderate', limiter);
```

### Per-User Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const userLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute per user
  keyGenerator: (req) => {
    // Use user ID from JWT or session
    return req.user?.id || req.ip;
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: req.rateLimit.resetTime
    });
  }
});
```

### Sliding Window Rate Limiting

```typescript
import { RateLimiterRedis } from 'rate-limiter-flexible';
import Redis from 'ioredis';

const redis = new Redis();

const rateLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'moderation',
  points: 100, // Number of requests
  duration: 60, // Per 60 seconds
  blockDuration: 60 * 15, // Block for 15 mins if exceeded
});

async function checkRateLimit(userId: string) {
  try {
    await rateLimiter.consume(userId);
    return true;
  } catch (error) {
    if (error instanceof Error && 'msBeforeNext' in error) {
      const secs = Math.round((error as any).msBeforeNext / 1000) || 1;
      throw new RateLimitError(`Rate limit exceeded. Retry in ${secs} seconds`);
    }
    throw error;
  }
}
```

---

## API Key Protection

### Secure API Key Storage

```typescript
// ❌ BAD: Never hardcode API keys
const apiKey = 'sk-proj-abc123...';

// ✅ GOOD: Use environment variables
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error('OPENAI_API_KEY not configured');
}
```

### API Key Rotation

```typescript
interface APIKeyConfig {
  current: string;
  previous?: string;
  rotationDate: Date;
}

class SecureAPIKeyManager {
  private config: APIKeyConfig;

  constructor() {
    this.config = {
      current: process.env.API_KEY_CURRENT!,
      previous: process.env.API_KEY_PREVIOUS,
      rotationDate: new Date(process.env.KEY_ROTATION_DATE!)
    };
  }

  getKey(): string {
    // Auto-rotate if needed
    if (this.shouldRotate()) {
      this.rotate();
    }
    return this.config.current;
  }

  private shouldRotate(): boolean {
    const daysSinceRotation = 
      (Date.now() - this.config.rotationDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceRotation > 90; // Rotate every 90 days
  }

  private rotate(): void {
    // Implement key rotation logic
    console.warn('API key rotation needed');
  }
}
```

### Secure Headers

```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Hide sensitive headers
app.use((req, res, next) => {
  res.removeHeader('X-Powered-By');
  next();
});
```

---

## Content Filtering

### Multi-Layer Filtering

```typescript
import { Filter } from 'glin-profanity';
import { createSemanticAnalyzer } from 'glin-profanity/ai/semantic';

class SecureContentFilter {
  private profanityFilter: Filter;
  private semanticAnalyzer;

  constructor() {
    this.profanityFilter = new Filter({
      languages: ['english'],
      detectLeetspeak: true,
      normalizeUnicode: true,
      cacheResults: true
    });

    // Optional: Add semantic analysis
    this.semanticAnalyzer = createSemanticAnalyzer({
      embeddingProvider: yourProvider,
      threshold: 0.7
    });
  }

  async moderate(text: string, userId: string) {
    // Layer 1: Length check (fast fail)
    if (text.length > 10000) {
      return { approved: false, reason: 'Text too long' };
    }

    // Layer 2: Profanity detection (fast)
    const profanityCheck = this.profanityFilter.checkProfanity(text);
    if (profanityCheck.containsProfanity) {
      await this.logViolation(userId, 'profanity', profanityCheck.profaneWords);
      return {
        approved: false,
        reason: 'Contains profanity',
        words: profanityCheck.profaneWords
      };
    }

    // Layer 3: Semantic toxicity (slower, only if needed)
    if (process.env.ENABLE_SEMANTIC_CHECK === 'true') {
      const semanticCheck = await this.semanticAnalyzer.analyze(text);
      if (semanticCheck.shouldFlag) {
        await this.logViolation(userId, 'toxic', []);
        return {
          approved: false,
          reason: 'Toxic content detected',
          score: semanticCheck.combinedScore
        };
      }
    }

    return { approved: true };
  }

  private async logViolation(
    userId: string,
    type: string,
    words: string[]
  ): Promise<void> {
    // Log to your security monitoring system
    console.warn('Content violation', {
      userId,
      type,
      words,
      timestamp: new Date().toISOString()
    });
  }
}
```

### Content Sanitization

```typescript
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window as unknown as Window);

function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
    ALLOWED_ATTR: ['href']
  });
}

function sanitizeText(text: string): string {
  return text
    .trim()
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
    .replace(/\s+/g, ' '); // Normalize whitespace
}
```

---

## Logging & Monitoring

### Secure Logging

```typescript
import winston from 'winston';
import { Filter } from 'glin-profanity';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'moderation' },
  transports: [
    new winston.transports.File({
      filename: 'error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: 'combined.log',
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

// ❌ BAD: Don't log sensitive data
logger.info('Checking text', { text: userMessage }); // Might contain PII

// ✅ GOOD: Log metadata only
logger.info('Moderation check', {
  userId: hashUserId(userId),
  textLength: userMessage.length,
  containsProfanity: result.containsProfanity,
  timestamp: Date.now()
});
```

### Audit Logging

```typescript
interface AuditLog {
  timestamp: Date;
  userId: string;
  action: string;
  result: 'approved' | 'rejected';
  reason?: string;
  ipAddress: string;
  userAgent: string;
}

class AuditLogger {
  private logs: AuditLog[] = [];

  async log(entry: Omit<AuditLog, 'timestamp'>) {
    const auditEntry: AuditLog = {
      timestamp: new Date(),
      ...entry
    };

    // Store in database for compliance
    await this.storeInDatabase(auditEntry);

    // Keep in memory for quick access (limited size)
    this.logs.push(auditEntry);
    if (this.logs.length > 1000) {
      this.logs.shift();
    }
  }

  async getViolations(userId: string, days: number = 30) {
    // Retrieve from database
    return this.queryDatabase({
      userId,
      result: 'rejected',
      since: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    });
  }

  private async storeInDatabase(entry: AuditLog) {
    // Implementation depends on your database
  }

  private async queryDatabase(filters: any) {
    // Implementation depends on your database
  }
}
```

---

## GDPR & Privacy

### Data Minimization

```typescript
// ❌ BAD: Storing full text
await db.store({
  userId,
  text: userMessage, // Contains PII
  result: moderationResult
});

// ✅ GOOD: Store only necessary data
await db.store({
  userId: hashUserId(userId), // Anonymized
  textHash: hashText(userMessage), // For deduplication
  textLength: userMessage.length,
  containsProfanity: moderationResult.containsProfanity,
  timestamp: Date.now()
});
```

### Data Retention

```typescript
class GDPRCompliantStorage {
  async store(data: ModerationResult) {
    await db.moderations.insert({
      ...data,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
    });
  }

  // Automatic cleanup job
  async cleanup() {
    await db.moderations.deleteMany({
      expiresAt: { $lt: new Date() }
    });
  }

  // User data deletion (right to be forgotten)
  async deleteUserData(userId: string) {
    await db.moderations.deleteMany({ userId });
    await db.violations.deleteMany({ userId });
    await db.auditLogs.deleteMany({ userId });
  }
}

// Run cleanup daily
setInterval(() => {
  storage.cleanup().catch(console.error);
}, 24 * 60 * 60 * 1000);
```

### Anonymization

```typescript
import crypto from 'crypto';

function hashUserId(userId: string): string {
  return crypto
    .createHash('sha256')
    .update(userId + process.env.HASH_SALT)
    .digest('hex')
    .slice(0, 16);
}

function hashText(text: string): string {
  return crypto
    .createHash('sha256')
    .update(text)
    .digest('hex');
}
```

---

## Secure Deployment

### Environment Variables

```bash
# .env.production (never commit this file!)
NODE_ENV=production

# API Keys (rotate regularly)
OPENAI_API_KEY=sk-proj-...
EMBEDDING_API_KEY=...

# Security
API_SECRET=... # Use a strong random key
HASH_SALT=... # Use crypto.randomBytes(32).toString('hex')

# Rate Limiting
REDIS_URL=redis://...
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# Monitoring
SENTRY_DSN=https://...
LOG_LEVEL=info

# Feature Flags
ENABLE_SEMANTIC_CHECK=true
ENABLE_ML_DETECTION=false
```

### Secrets Management

**AWS Secrets Manager:**
`typescript
import { SecretsManager } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManager({ region: 'us-east-1' });

async function getSecret(secretName: string): Promise<string> {
  const response = await client.getSecretValue({ SecretId: secretName });
  return response.SecretString!;
}

// Usage
const apiKey = await getSecret('profanity-api/openai-key');
```

**HashiCorp Vault:**
```typescript
import vault from 'node-vault';

const client = vault({
  endpoint: process.env.VAULT_ADDR,
  token: process.env.VAULT_TOKEN
});

async function getSecret(path: string): Promise<any> {
  const result = await client.read(path);
  return result.data;
}
```

### HTTPS/TLS

```typescript
import https from 'https';
import fs from 'fs';

const options = {
  key: fs.readFileSync('path/to/private-key.pem'),
  cert: fs.readFileSync('path/to/certificate.pem'),
  ca: fs.readFileSync('path/to/ca-certificate.pem')
};

https.createServer(options, app).listen(443);
```

---

## Vulnerability Management

### Dependency Scanning

```bash
# Run npm audit
npm audit

# Fix automatically
npm audit fix

# For detailed report
npm audit --json > audit-report.json
```

**package.json scripts:**
```json
{
  "scripts": {
    "security:audit": "npm audit",
    "security:check": "npm audit --audit-level=moderate",
    "security:fix": "npm audit fix"
  }
}
```

### Automated Security Scanning

**GitHub Actions (.github/workflows/security.yml):**
```yaml
name: Security Scan

on:
  schedule:
    - cron: '0 0 * * 1' # Weekly on Monday
  push:
    branches: [main]

jobs:
  security:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Run npm audit
        run: npm audit --audit-level=moderate
      
      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      
      - name: Upload results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: snyk.sarif
```

### Security Headers Checklist

```typescript
app.use((req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
});
```

---

## Security Checklist

### Pre-Deployment

- [ ] All secrets in environment variables/secrets manager
- [ ] Input validation on all endpoints
- [ ] Rate limiting configured
- [ ] HTTPS/TLS enabled
- [ ] Security headers set
- [ ] Dependencies audited
- [ ] Logging configured (without PII)
- [ ] Error handling (no stack traces in production)

### Post-Deployment

- [ ] Monitor error rates
- [ ] Review audit logs regularly
- [ ] Update dependencies monthly
- [ ] Rotate API keys quarterly
- [ ] Conduct security penetration testing
- [ ] Review and update rate limits
- [ ] Check for data breaches
- [ ] Test incident response plan

---

## Incident Response

### Security Incident Playbook

1. **Detect**: Monitor logs and alerts
2. **Contain**: Isolate affected systems
3. **Investigate**: Analyze attack vector
4. **Remediate**: Apply fixes
5. **Recover**: Restore normal operations
6. **Review**: Post-mortem analysis

**Example incident response code:**
```typescript
class SecurityIncidentHandler {
  async handleIncident(type: string, details: any) {
    // 1. Log incident
    await this.logIncident(type, details);
    
    // 2. Alert team
    await this.alertSecurityTeam(type, details);
    
    // 3. Auto-remediate if possible
    if (type === 'rate_limit_breach') {
      await this.blockIP(details.ip);
    }
    
    // 4. Create incident ticket
    await this.createTicket(type, details);
  }
}
```

---

## Next Steps

- [Testing Guide](./testing.md) - Test security measures
- [Deployment Guide](./deployment.md) - Secure deployment
- [Monitoring Guide](./monitoring.md) - Security monitoring

---

**Security concerns?** Report vulnerabilities to security@glincker.com (do not open public issues).
