# Implementation Examples

This document provides practical examples for implementing various data source integrations.

---

## Table of Contents

1. [Twitter/X Integration Examples](#twitterx-integration-examples)
2. [Telegram Integration Examples](#telegram-integration-examples)
3. [DisCo API Integration Examples](#disco-api-integration-examples)
4. [News Aggregation Examples](#news-aggregation-examples)
5. [Backend Implementation Examples](#backend-implementation-examples)
6. [Frontend Usage Examples](#frontend-usage-examples)

---

## Twitter/X Integration Examples

### Basic Setup

```typescript
// config/api.config.ts
export const API_CONFIG = {
  social: {
    twitter: {
      baseUrl: 'https://api.twitter.com/2',
      bearerToken: process.env.VITE_TWITTER_BEARER_TOKEN,
      enabled: true,
      accounts: [
        'IkejaElectric',
        'AEDCelectricity',
        'ekedp',
        'Ibadandisco',
      ],
    },
  },
};
```

### Monitor DisCo Twitter Accounts

```typescript
import { socialMediaService } from '../services/socialMediaService';

// Monitor all configured DisCo accounts
async function monitorDisCoTwitter() {
  const accounts = API_CONFIG.social.twitter.accounts;

  // Search for outage-related tweets
  const posts = await socialMediaService.fetchTweets(
    accounts,
    '(outage OR fault OR maintenance OR "no power" OR restoration)'
  );

  // Filter for recent posts (last 6 hours)
  const recentPosts = posts.filter(
    post => Date.now() - post.timestamp.getTime() < 6 * 60 * 60 * 1000
  );

  // Convert to PowerOutage format
  const outages = recentPosts.map(post => convertTweetToOutage(post));

  return outages;
}

function convertTweetToOutage(post: SocialMediaPost): PowerOutage {
  return {
    id: `twitter-${post.id}`,
    disCoId: mapTwitterAccountToDisCo(post.author),
    affectedArea: extractLocation(post.text),
    type: detectOutageType(post.text),
    reason: post.text,
    startTime: post.timestamp,
    source: `Twitter @${post.author}`,
    sourceType: SourceType.Official,
  };
}

// NLP-based location extraction
function extractLocation(text: string): string {
  // Look for common location patterns
  const patterns = [
    /in ([A-Z][a-z]+(?: [A-Z][a-z]+)*)/,      // "in Ikeja GRA"
    /at ([A-Z][a-z]+(?: [A-Z][a-z]+)*)/,      // "at Maryland"
    /([A-Z][a-z]+) Feeder/,                    // "Opebi Feeder"
    /([A-Z][a-z]+) area/,                      // "Lekki area"
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }

  return 'Location not specified';
}

function detectOutageType(text: string): OutageType {
  const lower = text.toLowerCase();

  if (lower.includes('maintenance') || lower.includes('scheduled')) {
    return OutageType.Planned;
  }

  if (lower.includes('restored') || lower.includes('back on')) {
    return OutageType.Restored;
  }

  return OutageType.Unplanned;
}
```

### Real-time Twitter Monitoring

```typescript
// Set up continuous monitoring
function startTwitterMonitoring() {
  const accounts = API_CONFIG.social.twitter.accounts;

  // Check every 2 minutes
  const unsubscribe = socialMediaService.monitorTwitterAccounts(
    accounts,
    (newPosts) => {
      console.log(`Found ${newPosts.length} new tweets`);

      // Process new posts
      newPosts.forEach(post => {
        if (isOutageRelated(post.text)) {
          const outage = convertTweetToOutage(post);
          // Add to database or notify users
          notifyNewOutage(outage);
        }
      });
    },
    120000 // 2 minutes
  );

  // Cleanup function
  return unsubscribe;
}

function isOutageRelated(text: string): boolean {
  const keywords = [
    'outage',
    'fault',
    'no power',
    'power cut',
    'blackout',
    'maintenance',
    'restoration',
  ];

  const lower = text.toLowerCase();
  return keywords.some(keyword => lower.includes(keyword));
}
```

---

## Telegram Integration Examples

### Bot Setup

```bash
# 1. Message @BotFather on Telegram
# 2. Send: /newbot
# 3. Follow instructions
# 4. Copy the bot token to .env

VITE_TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
```

### Monitor Telegram Channels

```typescript
import { socialMediaService } from '../services/socialMediaService';

async function monitorTelegramChannels() {
  const channels = [
    '@ikejaelectric',
    '@aedcofficial',
    '@ekedicng',
  ];

  // Fetch recent messages
  const messages = await socialMediaService.fetchTelegramMessages(channels);

  // Filter for outage-related content
  const outageMessages = messages.filter(msg =>
    isOutageRelated(msg.text)
  );

  return outageMessages;
}

// Set up continuous monitoring
function startTelegramMonitoring() {
  const channels = API_CONFIG.social.telegram.channels;

  const unsubscribe = socialMediaService.monitorTelegramChannels(
    channels,
    (newMessages) => {
      console.log(`Received ${newMessages.length} new messages`);

      newMessages.forEach(msg => {
        if (isOutageRelated(msg.text)) {
          // Process outage information
          processOutageMessage(msg);
        }
      });
    },
    120000 // 2 minutes
  );

  return unsubscribe;
}
```

### Telegram Bot Commands

```typescript
// Backend implementation for Telegram bot
import TelegramBot from 'node-telegram-bot-api';

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, {
  polling: true
});

// Command: /status - Check power status by area
bot.onText(/\/status (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const area = match![1];

  const outages = await findOutagesByArea(area);

  if (outages.length > 0) {
    const response = formatOutagesMessage(outages);
    bot.sendMessage(chatId, response);
  } else {
    bot.sendMessage(chatId, `No reported outages in ${area}`);
  }
});

// Command: /report - Report a power outage
bot.onText(/\/report/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, 'Please provide details:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Select DisCo', callback_data: 'select_disco' }],
        [{ text: 'Enter Location', callback_data: 'enter_location' }],
      ],
    },
  });
});
```

---

## DisCo API Integration Examples

### Hypothetical DisCo API Implementation

```typescript
// Example: Ikeja Electric API integration
async function fetchIkejaOutages(): Promise<PowerOutage[]> {
  const config = API_CONFIG.official.discos.ikeja;

  if (!config.enabled) {
    return [];
  }

  try {
    const response = await fetch(`${config.baseUrl}/outages/active`, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    // Normalize DisCo-specific format
    return data.outages.map((item: any) => ({
      id: item.outage_id,
      disCoId: 'ikeja',
      affectedArea: item.feeder_name,
      type: item.planned ? OutageType.Planned : OutageType.Unplanned,
      reason: item.description,
      startTime: new Date(item.start_time),
      estimatedRestoreTime: item.eta ? new Date(item.eta) : undefined,
      source: 'Ikeja Electric Official API',
      sourceType: SourceType.Official,
    }));
  } catch (error) {
    console.error('Error fetching from Ikeja Electric:', error);
    return [];
  }
}
```

### Web Scraping Alternative (When No API Available)

```typescript
// Backend implementation with Puppeteer
import puppeteer from 'puppeteer';

async function scrapeDisCoWebsite(disCoId: string): Promise<PowerOutage[]> {
  const urls: { [key: string]: string } = {
    ikeja: 'https://www.ikejaelectric.com/outages',
    aedc: 'https://www.aedcelectricity.com/faults',
    // ... more DisCos
  };

  const url = urls[disCoId];
  if (!url) return [];

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Extract outage information
    const outages = await page.evaluate(() => {
      const items = document.querySelectorAll('.outage-item');

      return Array.from(items).map(item => ({
        area: item.querySelector('.area')?.textContent || '',
        reason: item.querySelector('.reason')?.textContent || '',
        startTime: item.querySelector('.time')?.textContent || '',
        feeder: item.querySelector('.feeder')?.textContent || '',
      }));
    });

    await browser.close();

    // Convert to PowerOutage format
    return outages.map((item, index) => ({
      id: `${disCoId}-scraped-${Date.now()}-${index}`,
      disCoId,
      affectedArea: item.area || item.feeder,
      type: OutageType.Unplanned,
      reason: item.reason,
      startTime: parseDisCoTime(item.startTime),
      source: `${disCoId.toUpperCase()} Website`,
      sourceType: SourceType.Official,
    }));
  } catch (error) {
    console.error(`Error scraping ${disCoId}:`, error);
    await browser.close();
    return [];
  }
}

function parseDisCoTime(timeStr: string): Date {
  // Parse various time formats
  // "2 hours ago", "Today at 3:00 PM", "23-Oct-2025"
  // Implementation depends on DisCo's format
  return new Date(); // Placeholder
}
```

---

## News Aggregation Examples

### RSS Feed Integration

```typescript
// Backend implementation
import Parser from 'rss-parser';

const parser = new Parser();

async function aggregateNewsFromRSS(): Promise<NewsItem[]> {
  const feeds = [
    'https://punchng.com/topics/power/feed/',
    'https://www.premiumtimesng.com/news/headlines/feed',
    'https://guardian.ng/category/news/feed/',
  ];

  const allArticles: NewsItem[] = [];

  for (const feedUrl of feeds) {
    try {
      const feed = await parser.parseURL(feedUrl);

      for (const item of feed.items) {
        // Categorize article
        const category = categorizeArticle(
          item.title + ' ' + item.contentSnippet
        );

        // Skip if not relevant
        if (category !== 'ENERGY' && category !== 'EDUCATION') {
          continue;
        }

        allArticles.push({
          id: hashString(item.guid || item.link),
          category,
          title: item.title || '',
          summary: item.contentSnippet || '',
          timestamp: new Date(item.pubDate || Date.now()),
          source: feed.title,
          url: item.link,
        });
      }
    } catch (error) {
      console.error(`Error parsing feed ${feedUrl}:`, error);
    }
  }

  // Sort by date (newest first)
  return allArticles.sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );
}

function categorizeArticle(text: string): 'ENERGY' | 'EDUCATION' | 'OTHER' {
  const lower = text.toLowerCase();

  const energyKeywords = [
    'power', 'electricity', 'disco', 'nerc', 'tcn', 'grid', 'outage',
    'generator', 'tariff', 'ikeja electric', 'aedc', 'phed'
  ];

  const educationKeywords = [
    'jamb', 'waec', 'neco', 'exam', 'result', 'admission', 'utme',
    'student', 'university', 'school', 'education'
  ];

  const energyScore = energyKeywords.reduce(
    (score, keyword) => score + (lower.includes(keyword) ? 1 : 0),
    0
  );

  const educationScore = educationKeywords.reduce(
    (score, keyword) => score + (lower.includes(keyword) ? 1 : 0),
    0
  );

  if (energyScore > educationScore && energyScore > 0) return 'ENERGY';
  if (educationScore > energyScore && educationScore > 0) return 'EDUCATION';
  return 'OTHER';
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}
```

### Web Scraping for News

```typescript
import axios from 'axios';
import * as cheerio from 'cheerio';

async function scrapeNewsWebsite(url: string): Promise<NewsItem[]> {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    const articles: NewsItem[] = [];

    // Adapt selectors for specific website
    $('.article-item').each((index, element) => {
      const title = $(element).find('.article-title').text().trim();
      const summary = $(element).find('.article-excerpt').text().trim();
      const link = $(element).find('a').attr('href');
      const dateStr = $(element).find('.article-date').text().trim();

      articles.push({
        id: hashString(link || title),
        category: categorizeArticle(title + ' ' + summary),
        title,
        summary,
        timestamp: parseDate(dateStr),
        source: 'News Website',
        url: link,
      });
    });

    return articles.filter(
      a => a.category === 'ENERGY' || a.category === 'EDUCATION'
    );
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    return [];
  }
}
```

---

## Backend Implementation Examples

### Express.js Backend

```javascript
const express = require('express');
const cors = require('cors');
const Redis = require('ioredis');

const app = express();
const redis = new Redis();

app.use(cors());
app.use(express.json());

// Middleware: Cache
const cache = (duration) => async (req, res, next) => {
  const key = `cache:${req.originalUrl}`;

  const cached = await redis.get(key);
  if (cached) {
    return res.json(JSON.parse(cached));
  }

  // Store original res.json
  const originalJson = res.json.bind(res);

  // Override res.json
  res.json = (data) => {
    redis.setex(key, duration, JSON.stringify(data));
    return originalJson(data);
  };

  next();
};

// Power Outages Endpoint
app.get('/api/power-outages', cache(120), async (req, res) => {
  try {
    // Aggregate from multiple sources
    const [official, twitter, telegram, userReports] = await Promise.all([
      fetchFromDisCoAPIs(),
      fetchFromTwitter(),
      fetchFromTelegram(),
      fetchUserReports(),
    ]);

    const all = [...official, ...twitter, ...telegram, ...userReports];

    // Apply filters
    const { disco, state, type } = req.query;

    let filtered = all;

    if (disco) {
      filtered = filtered.filter(o => o.disCoId === disco);
    }

    if (state) {
      filtered = filtered.filter(o =>
        getDisCoStates(o.disCoId).includes(state)
      );
    }

    if (type) {
      filtered = filtered.filter(o => o.type === type);
    }

    res.json(filtered);
  } catch (error) {
    console.error('Error fetching outages:', error);
    res.status(500).json({ error: 'Failed to fetch outages' });
  }
});

// Exam Status Endpoint
app.get('/api/exam-status', cache(300), async (req, res) => {
  try {
    const boards = ['jamb', 'waec', 'neco'];

    const statuses = await Promise.all(
      boards.map(board => checkExamBoard(board))
    );

    res.json(statuses);
  } catch (error) {
    console.error('Error checking exam status:', error);
    res.status(500).json({ error: 'Failed to check exam status' });
  }
});

// News Endpoint
app.get('/api/news', cache(600), async (req, res) => {
  try {
    const { category, limit = 20 } = req.query;

    const [rss, scraped, social] = await Promise.all([
      aggregateNewsFromRSS(),
      scrapeNewsWebsites(),
      fetchNewsFromSocial(),
    ]);

    let all = [...rss, ...scraped, ...social];

    if (category && category !== 'ALL') {
      all = all.filter(item => item.category === category);
    }

    // Sort by date
    all.sort((a, b) => b.timestamp - a.timestamp);

    // Limit results
    const limited = all.slice(0, parseInt(limit));

    res.json(limited);
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### FastAPI Backend (Python)

```python
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import httpx
import asyncio
from datetime import datetime

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cache decorator
from functools import lru_cache

@app.get("/api/power-outages")
async def get_power_outages(
    disco: Optional[str] = None,
    state: Optional[str] = None,
    type: Optional[str] = None
):
    # Aggregate from multiple sources
    official, twitter, telegram = await asyncio.gather(
        fetch_from_disco_apis(),
        fetch_from_twitter(),
        fetch_from_telegram()
    )

    all_outages = official + twitter + telegram

    # Apply filters
    if disco:
        all_outages = [o for o in all_outages if o['disCoId'] == disco]

    if state:
        all_outages = [o for o in all_outages
                      if state in get_disco_states(o['disCoId'])]

    if type:
        all_outages = [o for o in all_outages if o['type'] == type]

    return all_outages

@app.get("/api/exam-status")
async def get_exam_status():
    boards = ['jamb', 'waec', 'neco']

    statuses = await asyncio.gather(
        *[check_exam_board(board) for board in boards]
    )

    return statuses

@app.get("/api/news")
async def get_news(
    category: Optional[str] = None,
    limit: int = Query(20, ge=1, le=100)
):
    rss, scraped, social = await asyncio.gather(
        aggregate_rss_feeds(),
        scrape_news_websites(),
        fetch_social_media_news()
    )

    all_news = rss + scraped + social

    if category and category != 'ALL':
        all_news = [n for n in all_news if n['category'] == category]

    # Sort by timestamp
    all_news.sort(key=lambda x: x['timestamp'], reverse=True)

    return all_news[:limit]
```

---

## Frontend Usage Examples

### Using Hooks in Components

```typescript
// PowerOutages component
import { usePowerOutages } from '../hooks/usePowerOutages';

function PowerOutagesPage() {
  const { outages, loading, error, refresh } = usePowerOutages({
    disCoId: 'ikeja',
    type: OutageType.Unplanned,
  });

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      <button onClick={refresh}>Refresh</button>
      {outages.map(outage => (
        <OutageCard key={outage.id} outage={outage} />
      ))}
    </div>
  );
}
```

```typescript
// ExamResults component
import { useExamStatus } from '../hooks/useExamStatus';

function ExamResultsPage() {
  const { guides, loading, error, checkBoard } = useExamStatus();

  const handleCheckBoard = async (boardId: string) => {
    const status = await checkBoard(boardId);
    alert(`${boardId.toUpperCase()}: ${status.status}`);
  };

  return (
    <div>
      {guides.map(guide => (
        <div key={guide.id}>
          <h3>{guide.name}</h3>
          <p>Status: {guide.status}</p>
          <button onClick={() => handleCheckBoard(guide.id)}>
            Check Now
          </button>
        </div>
      ))}
    </div>
  );
}
```

```typescript
// News component
import { useNews, useNewsSearch } from '../hooks/useNews';

function NewsPage() {
  const { news, loading, refresh } = useNews({ category: 'ENERGY' });
  const { results, search, searching } = useNewsSearch();

  const handleSearch = (keyword: string) => {
    search(keyword, 'ENERGY');
  };

  return (
    <div>
      <SearchBar onSearch={handleSearch} />

      {searching ? (
        <LoadingSpinner />
      ) : results.length > 0 ? (
        results.map(item => <NewsCard key={item.id} item={item} />)
      ) : (
        news.map(item => <NewsCard key={item.id} item={item} />)
      )}
    </div>
  );
}
```

---

## Complete Example: Full Integration Flow

```typescript
// 1. Configure APIs
// .env
VITE_BACKEND_URL=https://api.yourapp.com
VITE_TWITTER_BEARER_TOKEN=your_token

// 2. Start backend service
// backend/index.js
const app = express();
app.get('/api/power-outages', async (req, res) => {
  const data = await aggregateOutagesFromAllSources();
  res.json(data);
});

// 3. Use in React component
// pages/Dashboard.tsx
function Dashboard() {
  const { outages } = usePowerOutages();
  const { guides } = useExamStatus();
  const { news } = useLatestNews(5);

  return (
    <div>
      <h2>Power Outages: {outages.length}</h2>
      <h2>Exam Portals Online: {guides.filter(g => g.status !== 'OFFLINE').length}</h2>
      <h2>Latest News: {news.length}</h2>
    </div>
  );
}

// 4. Real-time updates automatically happen!
// No additional code needed - hooks handle subscriptions
```

---

## Conclusion

These examples demonstrate real-world integration scenarios. Adapt them to your specific needs and data sources.

For questions, refer to the main API Integration Guide.
