# Backend Setup Guide

This guide provides step-by-step instructions for setting up a backend service to support real-time data integration.

---

## Overview

The backend service acts as:
- **Aggregation layer** - Combines data from multiple sources
- **Cache layer** - Reduces API calls and improves performance
- **Authentication gateway** - Secures API keys
- **Rate limiter** - Prevents exceeding API limits
- **WebSocket server** - Enables real-time updates

---

## Technology Stack Options

### Option 1: Node.js + Express + Socket.io

**Pros:**
- JavaScript/TypeScript (same as frontend)
- Large ecosystem
- Easy WebSocket integration
- Fast development

**Cons:**
- Single-threaded (use clustering for production)

### Option 2: Python + FastAPI

**Pros:**
- Excellent for web scraping (Beautiful Soup, Scrapy)
- Great ML libraries (for future NLP features)
- Type hints
- Async support

**Cons:**
- Different language from frontend

### Option 3: Serverless (AWS Lambda, Vercel, Netlify)

**Pros:**
- No server management
- Auto-scaling
- Pay per use

**Cons:**
- Cold starts
- Limited for WebSocket
- Vendor lock-in

---

## Quick Start: Node.js Backend

### 1. Initialize Project

```bash
mkdir ng-power-backend
cd ng-power-backend
npm init -y

# Install dependencies
npm install express cors dotenv ioredis socket.io
npm install node-cron axios cheerio rss-parser puppeteer

# Dev dependencies
npm install -D typescript @types/node @types/express nodemon ts-node
```

### 2. Project Structure

```
ng-power-backend/
├── src/
│   ├── config/
│   │   ├── database.ts
│   │   └── redis.ts
│   ├── services/
│   │   ├── powerOutageService.ts
│   │   ├── examService.ts
│   │   ├── newsService.ts
│   │   └── socialMediaService.ts
│   ├── scrapers/
│   │   ├── discoScraper.ts
│   │   └── examPortalScraper.ts
│   ├── routes/
│   │   ├── powerOutages.ts
│   │   ├── examStatus.ts
│   │   └── news.ts
│   ├── middleware/
│   │   ├── cache.ts
│   │   ├── rateLimit.ts
│   │   └── errorHandler.ts
│   ├── utils/
│   │   ├── nlp.ts
│   │   └── validators.ts
│   ├── websocket/
│   │   └── server.ts
│   └── index.ts
├── .env
├── package.json
└── tsconfig.json
```

### 3. Basic Server Setup

```typescript
// src/index.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';

import powerOutagesRouter from './routes/powerOutages';
import examStatusRouter from './routes/examStatus';
import newsRouter from './routes/news';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new SocketServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/power-outages', powerOutagesRouter);
app.use('/api/exam-status', examStatusRouter);
app.use('/api/news', newsRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// WebSocket
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Export io for use in services
export { io };

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔌 WebSocket server ready`);
});
```

### 4. Redis Cache Setup

```typescript
// src/config/redis.ts
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: 0,
});

redis.on('connect', () => {
  console.log('✅ Redis connected');
});

redis.on('error', (error) => {
  console.error('❌ Redis error:', error);
});

export default redis;
```

```typescript
// src/middleware/cache.ts
import { Request, Response, NextFunction } from 'express';
import redis from '../config/redis';

export const cache = (duration: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = `cache:${req.originalUrl}`;

    try {
      const cached = await redis.get(key);

      if (cached) {
        return res.json(JSON.parse(cached));
      }

      // Store original res.json
      const originalJson = res.json.bind(res);

      // Override res.json
      res.json = (data: any) => {
        redis.setex(key, duration, JSON.stringify(data));
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('Cache error:', error);
      next();
    }
  };
};

// Clear cache by pattern
export async function clearCache(pattern: string) {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
```

### 5. Power Outages Route

```typescript
// src/routes/powerOutages.ts
import { Router } from 'express';
import { cache } from '../middleware/cache';
import { fetchAllOutages, submitUserReport } from '../services/powerOutageService';

const router = Router();

// Get all outages with optional filters
router.get('/', cache(120), async (req, res) => {
  try {
    const { disco, state, type, sourceType } = req.query;

    const outages = await fetchAllOutages({
      disco: disco as string,
      state: state as string,
      type: type as string,
      sourceType: sourceType as string,
    });

    res.json(outages);
  } catch (error) {
    console.error('Error fetching outages:', error);
    res.status(500).json({ error: 'Failed to fetch outages' });
  }
});

// Get outages by DisCo
router.get('/disco/:discoId', cache(120), async (req, res) => {
  try {
    const { discoId } = req.params;

    const outages = await fetchAllOutages({ disco: discoId });

    res.json(outages);
  } catch (error) {
    console.error('Error fetching outages:', error);
    res.status(500).json({ error: 'Failed to fetch outages' });
  }
});

// Submit user report
router.post('/', async (req, res) => {
  try {
    const outage = await submitUserReport(req.body);

    res.status(201).json(outage);
  } catch (error) {
    console.error('Error submitting report:', error);
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

export default router;
```

### 6. Power Outage Service

```typescript
// src/services/powerOutageService.ts
import axios from 'axios';
import { io } from '../index';
import redis from '../config/redis';

interface OutageFilters {
  disco?: string;
  state?: string;
  type?: string;
  sourceType?: string;
}

export async function fetchAllOutages(filters: OutageFilters = {}) {
  // Fetch from multiple sources in parallel
  const [officialOutages, twitterOutages, telegramOutages, userReports] =
    await Promise.allSettled([
      fetchFromDisCoAPIs(),
      fetchFromTwitter(),
      fetchFromTelegram(),
      fetchUserReports(),
    ]);

  // Combine results
  let allOutages = [
    ...(officialOutages.status === 'fulfilled' ? officialOutages.value : []),
    ...(twitterOutages.status === 'fulfilled' ? twitterOutages.value : []),
    ...(telegramOutages.status === 'fulfilled' ? telegramOutages.value : []),
    ...(userReports.status === 'fulfilled' ? userReports.value : []),
  ];

  // Apply filters
  if (filters.disco) {
    allOutages = allOutages.filter(o => o.disCoId === filters.disco);
  }

  if (filters.type) {
    allOutages = allOutages.filter(o => o.type === filters.type);
  }

  if (filters.sourceType) {
    allOutages = allOutages.filter(o => o.sourceType === filters.sourceType);
  }

  return allOutages;
}

async function fetchFromDisCoAPIs() {
  // Implement DisCo API integration
  // For now, return empty array
  return [];
}

async function fetchFromTwitter() {
  const bearerToken = process.env.TWITTER_BEARER_TOKEN;

  if (!bearerToken) {
    return [];
  }

  try {
    const accounts = [
      'IkejaElectric',
      'AEDCelectricity',
      'ekedp',
      'Ibadandisco',
    ];

    const outages = [];

    for (const account of accounts) {
      const response = await axios.get(
        `https://api.twitter.com/2/tweets/search/recent`,
        {
          params: {
            query: `from:${account} (outage OR fault OR maintenance)`,
            max_results: 10,
            'tweet.fields': 'created_at',
          },
          headers: {
            Authorization: `Bearer ${bearerToken}`,
          },
        }
      );

      if (response.data.data) {
        response.data.data.forEach((tweet: any) => {
          outages.push(parseTweetToOutage(tweet, account));
        });
      }
    }

    return outages;
  } catch (error) {
    console.error('Error fetching from Twitter:', error);
    return [];
  }
}

async function fetchFromTelegram() {
  // Implement Telegram integration
  return [];
}

async function fetchUserReports() {
  // Fetch from database
  return [];
}

function parseTweetToOutage(tweet: any, account: string) {
  return {
    id: `twitter-${tweet.id}`,
    disCoId: mapAccountToDisCo(account),
    affectedArea: 'Area extraction needed',
    type: 'UNPLANNED',
    reason: tweet.text,
    startTime: new Date(tweet.created_at),
    source: `Twitter @${account}`,
    sourceType: 'OFFICIAL',
  };
}

function mapAccountToDisCo(account: string): string {
  const mapping: { [key: string]: string } = {
    'IkejaElectric': 'ikeja',
    'AEDCelectricity': 'aedc',
    'ekedp': 'eko',
    'Ibadandisco': 'ibedc',
  };

  return mapping[account] || 'unknown';
}

export async function submitUserReport(data: any) {
  // Save to database
  const outage = {
    id: `user-${Date.now()}`,
    ...data,
    sourceType: 'UNOFFICIAL',
    timestamp: new Date(),
  };

  // Broadcast via WebSocket
  io.emit('new-outage', outage);

  // Clear cache
  await redis.del('cache:/api/power-outages*');

  return outage;
}
```

### 7. Scheduled Jobs (Cron)

```typescript
// src/jobs/updateOutages.ts
import cron from 'node-cron';
import { fetchAllOutages } from '../services/powerOutageService';
import { io } from '../index';
import { clearCache } from '../middleware/cache';

// Run every 2 minutes
cron.schedule('*/2 * * * *', async () => {
  console.log('🔄 Updating power outages...');

  try {
    const outages = await fetchAllOutages();

    // Clear cache
    await clearCache('cache:/api/power-outages*');

    // Broadcast to WebSocket clients
    io.emit('power-outages-update', outages);

    console.log(`✅ Updated ${outages.length} outages`);
  } catch (error) {
    console.error('❌ Error updating outages:', error);
  }
});

// Run every 5 minutes for exam status
cron.schedule('*/5 * * * *', async () => {
  console.log('🔄 Checking exam portals...');

  try {
    // Check exam portals
    // Broadcast updates
  } catch (error) {
    console.error('❌ Error checking exam portals:', error);
  }
});
```

### 8. Environment Variables

```bash
# .env
NODE_ENV=production
PORT=3000

# Frontend URL
FRONTEND_URL=https://yourfrontend.com

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Twitter API
TWITTER_API_KEY=your_api_key
TWITTER_BEARER_TOKEN=your_bearer_token

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token

# Database (if using)
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# DisCo APIs (when available)
IKEJA_API_KEY=
AEDC_API_KEY=
```

### 9. Deployment

#### Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - REDIS_HOST=redis
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

volumes:
  redis-data:
```

#### Deploy to Heroku

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create ng-power-backend

# Add Redis
heroku addons:create heroku-redis:mini

# Set environment variables
heroku config:set TWITTER_BEARER_TOKEN=your_token
heroku config:set TELEGRAM_BOT_TOKEN=your_token

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

#### Deploy to Vercel

```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "src/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/index.ts"
    }
  ]
}
```

---

## Database Setup (Optional)

For storing user reports and historical data:

### PostgreSQL Schema

```sql
CREATE TABLE power_outages (
  id SERIAL PRIMARY KEY,
  disco_id VARCHAR(50) NOT NULL,
  affected_area TEXT NOT NULL,
  type VARCHAR(20) NOT NULL,
  reason TEXT,
  start_time TIMESTAMP NOT NULL,
  estimated_restore_time TIMESTAMP,
  restored_time TIMESTAMP,
  source TEXT NOT NULL,
  source_type VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE exam_status (
  id SERIAL PRIMARY KEY,
  board_id VARCHAR(20) NOT NULL,
  status VARCHAR(50) NOT NULL,
  portal_online BOOLEAN DEFAULT TRUE,
  last_checked TIMESTAMP DEFAULT NOW(),
  status_message TEXT
);

CREATE TABLE news_items (
  id SERIAL PRIMARY KEY,
  category VARCHAR(20) NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  timestamp TIMESTAMP NOT NULL,
  source TEXT,
  url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_outages_disco ON power_outages(disco_id);
CREATE INDEX idx_outages_type ON power_outages(type);
CREATE INDEX idx_outages_start_time ON power_outages(start_time);
CREATE INDEX idx_news_category ON news_items(category);
CREATE INDEX idx_news_timestamp ON news_items(timestamp);
```

---

## Monitoring & Logging

### Winston Logger

```typescript
// src/utils/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

export default logger;
```

### Sentry Integration

```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

// Error handler middleware
app.use(Sentry.Handlers.errorHandler());
```

---

## Performance Optimization

### Connection Pooling

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
});

app.use('/api/', limiter);
```

---

## Testing

```typescript
// tests/powerOutages.test.ts
import request from 'supertest';
import app from '../src/index';

describe('Power Outages API', () => {
  test('GET /api/power-outages', async () => {
    const response = await request(app)
      .get('/api/power-outages')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });

  test('POST /api/power-outages', async () => {
    const outage = {
      disCoId: 'ikeja',
      affectedArea: 'Test Area',
      reason: 'Testing',
    };

    const response = await request(app)
      .post('/api/power-outages')
      .send(outage)
      .expect(201);

    expect(response.body).toHaveProperty('id');
  });
});
```

---

## Security Best Practices

1. **Never expose API keys in frontend**
2. **Use environment variables**
3. **Implement rate limiting**
4. **Validate all inputs**
5. **Use HTTPS in production**
6. **Keep dependencies updated**
7. **Implement proper CORS**
8. **Use helmet.js for security headers**

```typescript
import helmet from 'helmet';

app.use(helmet());
```

---

## Conclusion

This backend setup provides a solid foundation for real-time data aggregation. Customize it based on your specific needs and available data sources.
