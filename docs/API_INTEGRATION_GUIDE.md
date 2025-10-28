# API Integration Guide

## Overview

This application now supports **automatic data updates** from multiple sources, including:

- **Official Sources**: DisCo APIs, TCN, Exam Board portals
- **Social Media**: Twitter/X, Telegram channels
- **News Aggregation**: RSS feeds, web scraping
- **User Reports**: Community-sourced information

---

## Architecture

### Data Flow

```
External APIs → Backend Services → Frontend Services → React Hooks → UI Components
     ↓                ↓                    ↓                ↓              ↓
Twitter/X        Aggregation          Caching          State Mgmt    Real-time UI
Telegram         Normalization        Polling          Auto-refresh  Loading States
DisCo APIs       Filtering            WebSocket        Error Handling
Exam Portals     Rate Limiting
RSS Feeds
```

### Key Components

1. **Configuration Layer** (`config/api.config.ts`)
   - API endpoints
   - Authentication tokens
   - Polling intervals
   - Feature flags

2. **Service Layer** (`services/`)
   - `powerOutageService.ts` - Power outage data aggregation
   - `examService.ts` - Exam portal monitoring
   - `newsService.ts` - News aggregation
   - `socialMediaService.ts` - Social media integration

3. **React Hooks** (`hooks/`)
   - `usePowerOutages.ts` - Power outage data with real-time updates
   - `useExamStatus.ts` - Exam portal status monitoring
   - `useNews.ts` - News feed with auto-refresh

4. **UI Components** (`pages/`)
   - Real-time data display
   - Loading states
   - Error handling
   - Manual refresh capability

---

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the project root:

```bash
# Backend API
VITE_BACKEND_URL=https://your-backend-api.com/api
VITE_WS_URL=wss://your-backend-api.com

# Twitter/X API (Optional)
VITE_TWITTER_API_KEY=your_twitter_api_key
VITE_TWITTER_BEARER_TOKEN=your_twitter_bearer_token

# Telegram Bot API (Optional)
VITE_TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# DisCo API Keys (Optional - when available)
VITE_IKEJA_API_KEY=your_ikeja_api_key
VITE_AEDC_API_KEY=your_aedc_api_key
VITE_PHED_API_KEY=your_phed_api_key
# ... add more DisCo keys as needed

# Feature Flags
VITE_USE_MOCK_DATA=false  # Set to 'true' for development with mock data
```

### 2. Twitter/X API Setup

#### Get API Access
1. Visit [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a new project and app
3. Generate API keys and Bearer Token
4. Enable API v2 endpoints

#### Required Permissions
- Read tweets
- Read user data

#### API Endpoints Used
- `/tweets/search/recent` - Search for recent tweets
- `/users/:id/tweets` - Get user timeline

#### Example Integration
```typescript
// Monitor DisCo Twitter accounts
const accounts = [
  'IkejaElectric',
  'AEDCelectricity',
  'ekedp',
  // ... more accounts
];

// Fetch recent tweets about power outages
const tweets = await socialMediaService.fetchTweets(
  accounts,
  '(outage OR maintenance OR fault OR "no power")'
);
```

### 3. Telegram API Setup

#### Create a Bot
1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Use `/newbot` command
3. Follow instructions to get bot token
4. Add bot to target channels (if public)

#### Get Channel Updates
```typescript
// Monitor Telegram channels
const channels = [
  '@ikejaelectric',
  '@aedcofficial',
  // ... more channels
];

const messages = await socialMediaService.fetchTelegramMessages(channels);
```

#### Limitations
- Only works with public channels or channels where bot is admin
- Requires polling (no webhooks in browser environment)
- For private channels, consider backend implementation

### 4. Backend API Implementation

For production use, implement a backend service that:

#### Required Endpoints

**Power Outages**
```
GET  /api/power-outages           - List all outages
GET  /api/power-outages/:id       - Get specific outage
POST /api/power-outages           - Create user report
PATCH /api/power-outages/:id      - Update outage
GET  /api/power-outages/disco/:id - Outages by DisCo
GET  /api/power-outages/state/:id - Outages by state
```

**Exam Status**
```
GET  /api/exam-status                - List all exam boards
GET  /api/exam-status/:boardId       - Get board status
POST /api/exam-status/:boardId/check - Check portal status
```

**News**
```
GET  /api/news              - List news with filters
GET  /api/news/latest       - Latest headlines
GET  /api/news/category/:id - News by category
GET  /api/news/search       - Search news
POST /api/news/rss          - Fetch from RSS feeds
POST /api/news/scrape       - Scrape news websites
```

**Social Media**
```
GET  /api/social/twitter    - Twitter integration
GET  /api/social/telegram   - Telegram integration
```

**Utilities**
```
POST /api/portal-check      - Check if portal is online
POST /api/scrape-exam-status - Scrape exam portal status
```

#### Backend Technology Recommendations

**Node.js/Express**
```javascript
const express = require('express');
const app = express();

app.get('/api/power-outages', async (req, res) => {
  // Aggregate data from multiple sources
  const officialData = await fetchFromDisCoAPIs();
  const twitterData = await fetchFromTwitter();
  const userReports = await fetchUserReports();

  const aggregated = [...officialData, ...twitterData, ...userReports];
  res.json(aggregated);
});
```

**Python/FastAPI**
```python
from fastapi import FastAPI
from typing import List

app = FastAPI()

@app.get("/api/power-outages")
async def get_outages() -> List[PowerOutage]:
    # Aggregate from multiple sources
    official = await fetch_disco_apis()
    twitter = await fetch_twitter()
    return official + twitter
```

#### Caching Strategy
```javascript
const redis = require('redis');
const client = redis.createClient();

// Cache outage data for 2 minutes
app.get('/api/power-outages', async (req, res) => {
  const cacheKey = 'outages:all';

  // Check cache
  const cached = await client.get(cacheKey);
  if (cached) {
    return res.json(JSON.parse(cached));
  }

  // Fetch fresh data
  const data = await aggregateOutages();

  // Store in cache
  await client.setex(cacheKey, 120, JSON.stringify(data));

  res.json(data);
});
```

### 5. Web Scraping Setup

For monitoring exam portals and news websites:

**Using Puppeteer (Node.js)**
```javascript
const puppeteer = require('puppeteer');

async function checkJAMBPortal() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto('https://efacility.jamb.gov.ng/');

  // Check if results link is available
  const resultsAvailable = await page.$('#results-link');

  // Extract any announcements
  const announcements = await page.$$eval('.announcement',
    nodes => nodes.map(n => n.textContent)
  );

  await browser.close();

  return {
    online: true,
    resultsAvailable: !!resultsAvailable,
    announcements
  };
}
```

**Using BeautifulSoup (Python)**
```python
import requests
from bs4 import BeautifulSoup

def check_waec_portal():
    response = requests.get('https://www.waecdirect.org/')
    soup = BeautifulSoup(response.content, 'html.parser')

    # Extract relevant information
    announcements = soup.find_all(class_='announcement')

    return {
        'online': response.status_code == 200,
        'announcements': [a.text for a in announcements]
    }
```

### 6. RSS Feed Integration

**Backend Implementation**
```javascript
const Parser = require('rss-parser');
const parser = new Parser();

app.get('/api/news/rss', async (req, res) => {
  const feeds = [
    'https://punchng.com/topics/power/feed/',
    'https://www.premiumtimesng.com/news/headlines/feed',
    // ... more feeds
  ];

  const articles = [];

  for (const feedUrl of feeds) {
    try {
      const feed = await parser.parseURL(feedUrl);

      feed.items.forEach(item => {
        articles.push({
          id: item.guid,
          title: item.title,
          summary: item.contentSnippet,
          timestamp: new Date(item.pubDate),
          category: categorizeArticle(item.title + ' ' + item.content),
          source: feed.title
        });
      });
    } catch (error) {
      console.error(`Error parsing ${feedUrl}:`, error);
    }
  }

  res.json(articles);
});
```

### 7. Real-time Updates with WebSocket

**Backend (Socket.io)**
```javascript
const io = require('socket.io')(server);

// When new outage is detected
function broadcastNewOutage(outage) {
  io.emit('power-outages', outage);
}

// Monitor sources every 2 minutes
setInterval(async () => {
  const newOutages = await checkForNewOutages();
  newOutages.forEach(broadcastNewOutage);
}, 120000);
```

**Frontend Integration**
```typescript
// Add to powerOutageService.ts
import io from 'socket.io-client';

class PowerOutageService {
  private socket: any;

  connectWebSocket() {
    this.socket = io(BACKEND_API.websocket.url);

    this.socket.on('power-outages', (outage: PowerOutage) => {
      // Update cache
      this.cache.clear();
      // Notify listeners
      this.notifyListeners();
    });
  }
}
```

---

## Official Data Sources

### DisCo APIs

Most DisCos don't have public APIs yet. You'll need to:

1. **Contact DisCo directly** for API access
2. **Web scraping** as alternative (with proper rate limiting)
3. **Monitor social media** for announcements

**Example DisCos with online presence:**
- Ikeja Electric: Twitter @IkejaElectric
- AEDC: Twitter @AEDCelectricity
- EKEDC: Twitter @ekedp
- IBEDC: Website with outage notices

### TCN (Transmission Company of Nigeria)

- Website: https://www.tcn.org.ng/
- Twitter: @TCN_NG
- Press releases and grid status updates

### Exam Boards

**JAMB**
- Portal: https://efacility.jamb.gov.ng/
- Twitter: @JAMB_Official
- No public API - requires web scraping or manual monitoring

**WAEC**
- Portal: https://www.waecdirect.org/
- Twitter: @waecnigeria
- Result checking via scratch card system

**NECO**
- Portal: https://result.neco.gov.ng/
- Twitter: @NecoOfficial
- Token-based result checking

---

## Rate Limiting & Best Practices

### API Rate Limits

**Twitter API v2 (Free tier)**
- 500,000 tweets/month
- 1,500 requests/month
- 15-minute windows

**Recommendations:**
- Cache aggressively (2-5 minutes)
- Batch requests when possible
- Implement exponential backoff
- Use webhooks when available (backend only)

### Caching Strategy

```typescript
// Recommended cache durations
const CACHE_DURATIONS = {
  powerOutages: 120000,    // 2 minutes
  examStatus: 300000,      // 5 minutes
  news: 600000,            // 10 minutes
  socialMedia: 180000,     // 3 minutes
};
```

### Error Handling

```typescript
// Implement retry logic with exponential backoff
async function fetchWithRetry(url: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve =>
        setTimeout(resolve, Math.pow(2, i) * 1000)
      );
    }
  }
}
```

---

## Testing

### Mock Mode

Set `VITE_USE_MOCK_DATA=true` in `.env` for development:

```typescript
// Services automatically use enhanced mock data
const outages = await powerOutageService.fetchPowerOutages();
// Returns realistic mock data with time-based variations
```

### Testing with Real APIs

1. Start with Twitter API (easiest to get)
2. Test with a few accounts first
3. Monitor rate limits
4. Gradually add more sources

---

## Deployment Checklist

- [ ] Set up backend API endpoints
- [ ] Configure environment variables
- [ ] Set up caching layer (Redis)
- [ ] Implement rate limiting
- [ ] Set up monitoring/logging
- [ ] Configure CORS properly
- [ ] Set up SSL certificates
- [ ] Test all data sources
- [ ] Set up error alerting
- [ ] Document API for team

---

## Monitoring & Maintenance

### Metrics to Track

- API response times
- Cache hit rates
- Error rates by source
- Data freshness
- User-reported issues

### Logging

```typescript
// Add comprehensive logging
console.log('[PowerOutageService] Fetching from Twitter:', {
  accounts: accounts.length,
  timestamp: new Date().toISOString()
});

console.error('[PowerOutageService] Error:', {
  source: 'twitter',
  error: error.message,
  timestamp: new Date().toISOString()
});
```

---

## Troubleshooting

### Common Issues

**1. CORS Errors**
- Solution: Proxy requests through backend
- Never make API calls directly from browser for authenticated APIs

**2. Rate Limit Exceeded**
- Solution: Implement caching, reduce polling frequency
- Use WebSocket for real-time updates instead of polling

**3. Stale Data**
- Solution: Implement cache invalidation
- Add manual refresh buttons (already implemented)

**4. Twitter API Access Denied**
- Solution: Check API keys, verify app permissions
- Ensure Bearer Token is correctly set

**5. Portal Scraping Blocked**
- Solution: Use proper User-Agent, respect robots.txt
- Implement request throttling
- Consider using proxy services

---

## Future Enhancements

### Planned Features

1. **Push Notifications**
   - Web Push API for real-time alerts
   - Email notifications for major outages

2. **Machine Learning**
   - Predict outage duration
   - Detect patterns in outage occurrences
   - Auto-categorize news articles

3. **User Contributions**
   - Verified user reports
   - Community outage mapping
   - Real-time crowd-sourced updates

4. **Advanced Analytics**
   - Outage frequency by area
   - DisCo performance metrics
   - Historical data analysis

5. **Mobile App**
   - React Native implementation
   - Native push notifications
   - Offline support

---

## Support

For issues or questions:
- Check the code comments in service files
- Review the type definitions in `types.ts`
- Test with mock data first (`VITE_USE_MOCK_DATA=true`)

---

## License

This integration layer is part of the Naija Power & Portal Hub application.
