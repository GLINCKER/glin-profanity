# Deployment Guide

Production deployment guide for applications using glin-profanity.

## Table of Contents

- [Environment Setup](#environment-setup)
- [Node.js Deployment](#nodejs-deployment)
- [Serverless Deployment](#serverless-deployment)
- [Edge Deployment](#edge-deployment)
- [Container Deployment](#container-deployment)
- [Python Deployment](#python-deployment)
- [Performance Optimization](#performance-optimization)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

---

## Environment Setup

### Environment Variables

Create a `.env` file for configuration:

```bash
# Profanity Detection Config
GLIN_PROFANITY_LANGUAGES=english,spanish,french
GLIN_PROFANITY_LEETSPEAK=true
GLIN_PROFANITY_LEETSPEAK_LEVEL=moderate
GLIN_PROFANITY_UNICODE=true
GLIN_PROFANITY_CACHE=true
GLIN_PROFANITY_CACHE_SIZE=5000

# AI Integration (Optional)
OPENAI_API_KEY=your-key-here
OPENAI_MODEL=gpt-4o

# ML Features (Optional)
ENABLE_ML_DETECTION=false
ML_THRESHOLD=0.9
```

### Production Configuration

```typescript
import { Filter } from 'glin-profanity';

const filter = new Filter({
  languages: process.env.GLIN_PROFANITY_LANGUAGES?.split(',') || ['english'],
  detectLeetspeak: process.env.GLIN_PROFANITY_LEETSPEAK === 'true',
  leetspeakLevel: (process.env.GLIN_PROFANITY_LEETSPEAK_LEVEL as any) || 'moderate',
  normalizeUnicode: process.env.GLIN_PROFANITY_UNICODE !== 'false',
  cacheResults: process.env.GLIN_PROFANITY_CACHE !== 'false',
  cacheSize: parseInt(process.env.GLIN_PROFANITY_CACHE_SIZE || '5000'),
});

export default filter;
```

---

## Node.js Deployment

### Express.js Production Setup

```typescript
import express from 'express';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Filter } from 'glin-profanity';

const app = express();
const filter = new Filter({
  languages: ['english', 'spanish'],
  detectLeetspeak: true,
  cacheResults: true,
  cacheSize: 10000
});

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Profanity check endpoint
app.post('/api/moderate', express.json(), async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text required' });
    }

    const result = filter.checkProfanity(text);

    res.json({
      approved: !result.containsProfanity,
      profaneWords: result.profaneWords,
      safetyScore: calculateSafetyScore(result)
    });
  } catch (error) {
    console.error('Moderation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### PM2 Configuration

**ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'moderation-api',
    script: './dist/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      GLIN_PROFANITY_CACHE_SIZE: 10000
    }
  }]
};
```

**Start with PM2:**
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## Serverless Deployment

### AWS Lambda

**handler.ts:**
```typescript
import { APIGatewayProxyHandler } from 'aws-lambda';
import { Filter } from 'glin-profanity';

// Initialize outside handler for reuse across invocations
const filter = new Filter({
  languages: ['english'],
  detectLeetspeak: true,
  cacheResults: true
});

export const moderate: APIGatewayProxyHandler = async (event) => {
  try {
    const { text } = JSON.parse(event.body || '{}');

    if (!text) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Text required' })
      };
    }

    const result = filter.checkProfanity(text);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        approved: !result.containsProfanity,
        profaneWords: result.profaneWords
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal error' })
    };
  }
};
```

**serverless.yml:**
```yaml
service: profanity-moderation

provider:
  name: aws
  runtime: nodejs20.x
  region: us-east-1
  memorySize: 512
  timeout: 10
  environment:
    GLIN_PROFANITY_CACHE_SIZE: 5000

functions:
  moderate:
    handler: handler.moderate
    events:
      - http:
          path: moderate
          method: post
          cors: true

plugins:
  - serverless-bundle
  - serverless-offline

package:
  individually: true
```

**Deploy:**
```bash
npm install -g serverless
serverless deploy --stage production
```

### Google Cloud Functions

**index.ts:**
```typescript
import { HttpFunction } from '@google-cloud/functions-framework';
import { Filter } from 'glin-profanity';

const filter = new Filter({
  languages: ['english'],
  detectLeetspeak: true,
  cacheResults: true
});

export const moderate: HttpFunction = async (req, res) => {
  // CORS
  res.set('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).send('');
  }

  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text required' });
    }

    const result = filter.checkProfanity(text);

    res.json({
      approved: !result.containsProfanity,
      profaneWords: result.profaneWords
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal error' });
  }
};
```

**Deploy:**
```bash
gcloud functions deploy moderate \
  --runtime nodejs20 \
  --trigger-http \
  --allow-unauthenticated \
  --memory 512MB \
  --region us-central1
```

---

## Edge Deployment

### Vercel Edge Functions

**api/moderate.ts:**
```typescript
import { Filter } from 'glin-profanity';

export const config = {
  runtime: 'edge',
};

const filter = new Filter({
  languages: ['english'],
  detectLeetspeak: true,
  cacheResults: true
});

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { text } = await request.json();

    if (!text) {
      return new Response(
        JSON.stringify({ error: 'Text required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = filter.checkProfanity(text);

    return new Response(
      JSON.stringify({
        approved: !result.containsProfanity,
        profaneWords: result.profaneWords
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
```

**Deploy:**
```bash
vercel --prod
```

### Cloudflare Workers

**src/index.ts:**
```typescript
import { Filter } from 'glin-profanity';

const filter = new Filter({
  languages: ['english'],
  detectLeetspeak: true,
  cacheResults: true
});

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const { text } = await request.json() as { text: string };

      if (!text) {
        return Response.json({ error: 'Text required' }, { status: 400 });
      }

      const result = filter.checkProfanity(text);

      return Response.json({
        approved: !result.containsProfanity,
        profaneWords: result.profaneWords
      });
    } catch (error) {
      return Response.json({ error: 'Internal error' }, { status: 500 });
    }
  }
};
```

**wrangler.toml:**
```toml
name = "profanity-moderation"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[build]
command = "npm install && npm run build"

[[routes]]
pattern = "api.example.com/*"
zone_name = "example.com"
```

**Deploy:**
```bash
npx wrangler deploy
```

---

## Container Deployment

### Docker

**Dockerfile:**
```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

USER node

CMD ["node", "dist/server.js"]
```

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - GLIN_PROFANITY_CACHE_SIZE=10000
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

**Build and run:**
```bash
docker build -t profanity-api .
docker run -p 3000:3000 profanity-api
```

### Kubernetes

**deployment.yaml:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: profanity-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: profanity-api
  template:
    metadata:
      labels:
        app: profanity-api
    spec:
      containers:
      - name: api
        image: your-registry/profanity-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: GLIN_PROFANITY_CACHE_SIZE
          value: "10000"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: profanity-api
spec:
  selector:
    app: profanity-api
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

**Deploy:**
```bash
kubectl apply -f deployment.yaml
```

---

## Python Deployment

### Flask Production

```python
# app.py
from flask import Flask, request, jsonify
from glin_profanity import Filter
import os

app = Flask(__name__)

# Initialize filter
filter_instance = Filter({
    "languages": ["english"],
    "detect_leetspeak": True,
    "cache_results": True,
    "cache_size": 10000
})

@app.route('/api/moderate', methods=['POST'])
def moderate():
    try:
        data = request.get_json()
        text = data.get('text')

        if not text:
            return jsonify({"error": "Text required"}), 400

        result = filter_instance.check_profanity(text)

        return jsonify({
            "approved": not result["contains_profanity"],
            "profane_words": result["profane_words"]
        })

    except Exception as e:
        app.logger.error(f"Error: {str(e)}")
        return jsonify({"error": "Internal error"}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy"})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
```

**Run with Gunicorn:**
```bash
gunicorn --bind 0.0.0.0:5000 \
  --workers 4 \
  --timeout 30 \
  --access-logfile - \
  --error-logfile - \
  app:app
```

### Django Production

```python
# views.py
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from glin_profanity import Filter
import json

filter_instance = Filter({
    "languages": ["english"],
    "detect_leetspeak": True
})

@csrf_exempt
@require_POST
def moderate(request):
    try:
        data = json.loads(request.body)
        text = data.get('text')

        if not text:
            return JsonResponse({"error": "Text required"}, status=400)

        result = filter_instance.check_profanity(text)

        return JsonResponse({
            "approved": not result["contains_profanity"],
            "profane_words": result["profane_words"]
        })

    except Exception as e:
        return JsonResponse({"error": "Internal error"}, status=500)
```

---

## Performance Optimization

### Caching Strategy

```typescript
import { Filter } from 'glin-profanity';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);
const filter = new Filter({ cacheResults: true, cacheSize: 5000 });

async function moderateWithCache(text: string) {
  // Check Redis cache first
  const cacheKey = `profanity:${Buffer.from(text).toString('base64')}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  // Not in cache, check profanity
  const result = filter.checkProfanity(text);

  // Store in Redis (expire after 1 hour)
  await redis.setex(cacheKey, 3600, JSON.stringify(result));

  return result;
}
```

### Load Balancing

**nginx.conf:**
```nginx
upstream profanity_api {
    least_conn;
    server api1.example.com:3000;
    server api2.example.com:3000;
    server api3.example.com:3000;
}

server {
    listen 80;
    server_name api.example.com;

    location /api/moderate {
        proxy_pass http://profanity_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Monitoring

### Health Checks

```typescript
app.get('/health', (req, res) => {
  const healthcheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    cache: {
      enabled: filter.config.cacheResults,
      size: filter.getCacheSize?.() || 0
    }
  };

  res.send(healthcheck);
});
```

### Metrics with Prometheus

```typescript
import client from 'prom-client';

const register = new client.Registry();

const moderationCounter = new client.Counter({
  name: 'profanity_checks_total',
  help: 'Total number of profanity checks',
  labelNames: ['result'],
  registers: [register]
});

const moderationDuration = new client.Histogram({
  name: 'profanity_check_duration_seconds',
  help: 'Profanity check duration',
  registers: [register]
});

app.post('/api/moderate', async (req, res) => {
  const end = moderationDuration.startTimer();
  
  try {
    const result = filter.checkProfanity(req.body.text);
    
    moderationCounter.inc({ 
      result: result.containsProfanity ? 'flagged' : 'clean' 
    });
    
    end();
    
    res.json(result);
  } catch (error) {
    end();
    moderationCounter.inc({ result: 'error' });
    throw error;
  }
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

### Logging

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Log moderation events
app.post('/api/moderate', (req, res) => {
  const result = filter.checkProfanity(req.body.text);
  
  if (result.containsProfanity) {
    logger.warn('Profanity detected', {
      ip: req.ip,
      words: result.profaneWords,
      timestamp: new Date().toISOString()
    });
  }
  
  res.json(result);
});
```

---

## Troubleshooting

### Common Issues

**Issue: High memory usage**
```typescript
// Solution: Limit cache size
const filter = new Filter({
  cacheResults: true,
  cacheSize: 1000 // Reduce from default
});
```

**Issue: Slow response times**
```typescript
// Solution: Enable caching and reduce languages
const filter = new Filter({
  languages: ['english'], // Only check English
  cacheResults: true,
  cacheSize: 5000
});
```

**Issue: Cold start latency (serverless)**
```typescript
// Solution: Keep filter warm
export const filter = new Filter({ ... }); // Initialize outside handler

// Warm-up endpoint
export const warmup = async () => {
  filter.checkProfanity('warmup');
  return { statusCode: 200, body: 'OK' };
};
```

---

## Next Steps

- [Security Guide](./security.md) - Security best practices
- [Testing Guide](./testing.md) - Test your deployment
- [Monitoring Guide](./monitoring.md) - Set up monitoring

---

**Need help?** Open an issue on [GitHub](https://github.com/GLINCKER/glin-profanity/issues).
