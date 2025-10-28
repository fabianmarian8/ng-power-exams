# Data Sources Integration Guide

This document describes all integrated data sources for the ng-power-exams portal, based on comprehensive research of free Nigerian data sources.

## Table of Contents

1. [Power Outage Sources](#power-outage-sources)
2. [Exam Board Sources](#exam-board-sources)
3. [News Sources](#news-sources)
4. [Telegram Integration](#telegram-integration)
5. [Implementation Guide](#implementation-guide)
6. [Best Practices](#best-practices)

---

## Power Outage Sources

### 1. Ikeja Electric Fault Log

**Status:** ✅ Implemented
**Reliability:** High (Official Source)
**Update Frequency:** Real-time
**Coverage:** Lagos (Nigeria's largest city)

- **URL:** https://www.ikejaelectric.com/fault-log
- **Method:** Web Scraping (HTML)
- **Data Format:** Static HTML list/table
- **Implementation:** `services/scrapers/ikejaElectricScraper.ts`

**Features:**
- Segmented by undertaking (regions: Abule Egba, Ikeja, Ikorodu, etc.)
- Shows current faults with feeder, areas affected, and fault description
- No JavaScript required for parsing
- High accuracy (official DisCo source)

**Example Data:**
```typescript
{
  undertaking: "Ikeja",
  feeder: "Ogba 11kV",
  areasAffected: "Ogba, Aguda, Acme",
  fault: "Transformer fault"
}
```

### 2. IBEDC Outage Information

**Status:** ✅ Implemented
**Reliability:** High (Official Source)
**Update Frequency:** Regular updates
**Coverage:** Oyo, Ogun, Osun, Kwara states (South-West Nigeria)

- **URL:** https://www.ibedc.com/outage-information
- **Method:** Web Scraping (HTML)
- **Data Format:** Filterable HTML list by state
- **Implementation:** `services/scrapers/ibedcScraper.ts`

**Features:**
- Ready-made list of outages by region
- Filterable by state (Oyo, Ogun, Osun, Kwara)
- Near real-time updates
- Covers large geographical area

**Supported States:**
```typescript
const STATES = ['Oyo', 'Ogun', 'Osun', 'Kwara'];
```

### 3. Other DisCos

**Status:** 🔄 Planned

Other DisCos have varying levels of data availability:

| DisCo | Status | Data Source | Notes |
|-------|--------|-------------|-------|
| Eko (EKEDC) | ⚠️ Limited | Social media only | Service Alert page shows "Coming Soon" |
| AEDC | ✅ Available | Telegram bot | @aedcelectricity bot for outage reports |
| PHED | ✅ Available | Telegram bot | @PHEDConnect_bot ("Ibinabo") |
| EEDC | ⚠️ Limited | Press releases | No dedicated outage ticker |
| KEDCO | ⚠️ Limited | Social media | - |
| Others | ⚠️ Limited | Social media | - |

### 4. TCN (Transmission Company of Nigeria)

**Status:** 📋 Manual scraping possible
**Reliability:** High (Official Source)
**Update Frequency:** As needed (grid events)

- **URL:** https://tcn.org.ng/
- **Method:** News section scraping
- **Data Type:** Grid-wide outages, major incidents

**Use Case:**
- Nationwide power status
- Grid collapse reports
- Major transmission line maintenance

---

## Exam Board Sources

### Overview

**Important:** No exam boards offer public APIs. All data must be obtained through:
1. Portal monitoring (availability checks)
2. Social media announcements
3. News aggregation

### 1. JAMB (Joint Admissions and Matriculation Board)

**Portal:** https://efacility.jamb.gov.ng/
**Website:** https://www.jamb.gov.ng/

**Data Available:**
- Portal availability status
- Result release announcements (via social media)
- Exam schedules and bulletins

**Monitoring Methods:**
- ✅ Portal HTTP ping (check if online)
- ✅ Twitter: @JAMBHQ (announcements)
- ✅ News monitoring (Premium Times, Punch, etc.)
- ❌ No API for result checking

**Implementation:**
```typescript
// Check portal availability
const response = await fetch('https://efacility.jamb.gov.ng/');
const isOnline = response.ok;
```

### 2. WAEC (West African Examinations Council)

**Portal:** https://www.waecdirect.org/
**Website:** https://www.waecnigeria.org/

**Data Available:**
- Portal availability
- Result release dates (announcements)
- Exam schedules

**Monitoring Methods:**
- ✅ Portal HTTP ping
- ✅ Twitter: @waecnigeria
- ✅ News monitoring
- ❌ No public API (verification API for institutions only, paid)

### 3. NECO (National Examinations Council)

**Portal:** https://results.neco.gov.ng/
**Website:** https://www.neco.gov.ng/

**Data Available:**
- Portal availability
- Result release announcements
- Exam timetables

**Monitoring Methods:**
- ✅ Portal HTTP ping
- ✅ Twitter: @OfficialNecoNG
- ✅ Facebook: @OfficialNecoNIG
- ✅ News monitoring
- ❌ No public API (NERVS for institutions only, paid)

---

## News Sources

### RSS Feeds

**Status:** ✅ Implemented
**Implementation:** `services/parsers/rssFeedParser.ts`

#### General News Feeds

1. **Punch Nigeria**
   - Feed: http://punchng.com/feed
   - Coverage: All categories
   - Update Frequency: Real-time

2. **Premium Times**
   - Feed: https://www.premiumtimesng.com/feed
   - Education Feed: https://www.premiumtimesng.com/category/education/feed
   - Coverage: General + Education specific
   - Update Frequency: Real-time

3. **Guardian Nigeria**
   - Feed: https://guardian.ng/feed
   - Energy Feed: https://guardian.ng/category/energy/feed
   - Coverage: General + Energy specific
   - Update Frequency: Real-time

4. **Vanguard**
   - Feed: https://www.vanguardngr.com/feed/
   - Coverage: All categories
   - Update Frequency: Real-time

5. **Channels TV**
   - Feed: https://www.channelstv.com/feed/
   - Coverage: All categories
   - Update Frequency: Real-time

#### Category Detection

The RSS parser automatically categorizes news into:
- `ENERGY`: Power, electricity, outages, DisCos, NERC, etc.
- `EDUCATION`: JAMB, WAEC, NECO, exams, results, admissions, etc.

**Keywords for Energy:**
```typescript
const energyKeywords = [
  'power', 'electricity', 'outage', 'disco', 'nerc', 'tcn', 'grid',
  'energy', 'generator', 'transformer', 'feeder', 'blackout'
];
```

**Keywords for Education:**
```typescript
const educationKeywords = [
  'jamb', 'waec', 'neco', 'exam', 'result', 'admission', 'student',
  'university', 'education', 'school', 'utme', 'post-utme'
];
```

### Web Scraping (Alternative)

If RSS feeds are unavailable, these sites can be scraped:

- https://punchng.com/topics/education (Education news)
- https://www.premiumtimesng.com/category/education (Education)
- https://guardian.ng/category/energy (Energy news)

**Note:** Web scraping should be used as a fallback. RSS feeds are preferred for:
- Easier parsing
- Lower bandwidth
- Better reliability
- Standardized format

---

## Telegram Integration

**Status:** ✅ Implemented
**Implementation:** `services/integrations/telegramService.ts`

### Setup Requirements

1. **Create Telegram Bot:**
   - Contact @BotFather on Telegram
   - Use `/newbot` command
   - Receive bot token (format: `123456:ABC-DEF...`)
   - Store in `VITE_TELEGRAM_BOT_TOKEN` environment variable

2. **Add Bot to Channels:**
   - Bot must be added to channels as admin to receive posts
   - Requires channel owner permission
   - Bot receives only NEW posts (no historical messages)

### Monitored Channels

#### News Channels

1. **@PunchNewspaper**
   - Punch Newspapers official channel
   - ~29k subscribers
   - General news including education and energy

2. **@tvcnews_nigeria**
   - TVC News Nigeria
   - General news, politics, economy
   - Covers power sector and education stories

3. **@nmliveupdates**
   - Nairametrics Live Updates
   - Business and financial news
   - Includes energy sector updates

4. **@theelectricityhub**
   - The Electricity Hub
   - Specialized power sector news
   - Industry developments

#### DisCo Bots

1. **@aedcelectricity**
   - AEDC Telegram chat bot
   - Interactive bot for customer service
   - Provides outage reporting and status updates

2. **@PHEDConnect_bot**
   - PHED bot (nicknamed "Ibinabo")
   - Assists with billing queries, complaints
   - Provides outage information on demand

### Usage

```typescript
import { telegramService } from './services/integrations/telegramService';

// Initialize with bot token
telegramService.initialize(process.env.VITE_TELEGRAM_BOT_TOKEN);

// Monitor news channels
const newsItems = await telegramService.monitorChannels();

// Monitor DisCo bots
const outages = await telegramService.monitorDisCoBots();

// Start real-time polling
const stopPolling = telegramService.startPolling((updates) => {
  console.log('New updates:', updates);
}, 5000); // Poll every 5 seconds

// Stop polling when done
stopPolling();
```

### Limitations

- ⚠️ Bots cannot read channel history (only new messages)
- ⚠️ Requires admin access to channels
- ⚠️ Interactive bots (@aedcelectricity, @PHEDConnect_bot) require chat_id setup
- ⚠️ Rate limits apply to Bot API

---

## Implementation Guide

### Quick Start

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   Create `.env.local`:
   ```env
   # Optional: Telegram bot token
   VITE_TELEGRAM_BOT_TOKEN=your_bot_token_here

   # Optional: Backend API URL
   VITE_BACKEND_URL=http://localhost:3000/api

   # Toggle mock data (default: true for development)
   VITE_USE_MOCK_DATA=false
   ```

3. **Use the Services:**

   ```typescript
   import { powerOutageService } from './services/powerOutageService';
   import { newsService } from './services/newsService';
   import { examService } from './services/examService';

   // Fetch power outages from all sources
   const outages = await powerOutageService.fetchPowerOutages();

   // Fetch news with filters
   const energyNews = await newsService.fetchNews({
     category: 'ENERGY',
     limit: 10
   });

   // Check exam portal status
   const jambStatus = await examService.checkExamBoard('jamb');
   ```

### Data Flow

```
┌─────────────────────┐
│   User Request      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Service Layer     │
│ - powerOutageService│
│ - newsService       │
│ - examService       │
└──────────┬──────────┘
           │
           ├─────────────────────┬─────────────────────┐
           │                     │                     │
           ▼                     ▼                     ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  Web Scrapers    │  │  RSS Parsers     │  │  Telegram Bot    │
│  - Ikeja         │  │  - Punch         │  │  - News channels │
│  - IBEDC         │  │  - Premium Times │  │  - DisCo bots    │
└──────────────────┘  └──────────────────┘  └──────────────────┘
           │                     │                     │
           └─────────────────────┴─────────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │  CORS Proxy     │
                        │  (if needed)    │
                        └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │  Cache Layer    │
                        └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │  React UI       │
                        └─────────────────┘
```

---

## Best Practices

### 1. Data Sources Priority

**Recommended order (as per research report):**

1. ✅ **IBEDC Outage Information** - Best for South-West coverage
2. ✅ **Ikeja Electric Fault Log** - Best for Lagos (largest city)
3. ✅ **RSS Feeds (News)** - Reliable, automated, free
4. ✅ **Telegram Bot** - Real-time, free API
5. ❌ **Avoid Twitter API** - No longer free ($100+/month)

### 2. Caching Strategy

```typescript
// Recommended cache timeouts
const CACHE_TIMEOUTS = {
  powerOutages: 60000,    // 1 minute (fast-changing)
  examStatus: 120000,     // 2 minutes (moderate)
  news: 180000,           // 3 minutes (slower-changing)
};
```

### 3. Error Handling

Always implement fallbacks:

```typescript
try {
  const data = await scraper.scrape();
  return data;
} catch (error) {
  console.error('Scraping failed:', error);
  // Fallback to cached data or mock data
  return getCachedData() || getMockData();
}
```

### 4. CORS Handling

Use the CORS proxy utility:

```typescript
import { corsProxy, ProxyService } from './utils/corsProxy';

// Configure proxy
corsProxy.configure({
  service: ProxyService.AllOrigins,
  timeout: 30000,
  retries: 2
});

// Smart fetch (tries direct first, falls back to proxy)
const response = await corsProxy.smartFetch(url);
```

### 5. Rate Limiting

Respect source servers:

```typescript
// Don't poll too frequently
const MIN_POLLING_INTERVAL = 60000; // 1 minute

// Use exponential backoff on errors
const retryDelay = Math.pow(2, attempt) * 1000;
```

### 6. Data Validation

Always validate scraped data:

```typescript
function isValidOutage(outage: PowerOutage): boolean {
  return !!(
    outage.disCoId &&
    outage.affectedArea &&
    outage.startTime &&
    outage.type
  );
}
```

---

## API Reference

### Power Outage Service

```typescript
// Fetch all outages
const outages = await powerOutageService.fetchPowerOutages();

// Filter outages
const filtered = powerOutageService.filterOutages(outages, {
  disCoId: 'ikeja',
  type: OutageType.Unplanned
});

// Subscribe to updates
const unsubscribe = powerOutageService.subscribe((outages) => {
  console.log('Updated outages:', outages);
});

// Cleanup
unsubscribe();
```

### News Service

```typescript
// Fetch news with filters
const news = await newsService.fetchNews({
  category: 'EDUCATION',
  limit: 20,
  since: new Date('2024-01-01')
});

// Fetch latest headlines
const headlines = await newsService.fetchLatestNews(10);

// Search news
const searchResults = await newsService.searchNews('JAMB', 'EDUCATION');
```

### Exam Service

```typescript
// Check exam board status
const status = await examService.checkExamBoard('jamb');

// Monitor portal
const stopMonitoring = await examService.monitorPortal('jamb', (status) => {
  if (status.status === ExamStatus.RELEASED) {
    alert('JAMB results released!');
  }
});
```

---

## Troubleshooting

### Issue: CORS Errors

**Solution:**
```typescript
import { corsProxy } from './utils/corsProxy';
corsProxy.configure({ service: ProxyService.AllOrigins });
```

### Issue: No Data from Scrapers

**Possible causes:**
1. Website HTML structure changed → Update selectors
2. CORS blocking → Use proxy
3. Website down → Check availability first

**Debug:**
```typescript
// Test scraper availability
const available = await ikejaElectricScraper.checkAvailability();
console.log('Ikeja scraper available:', available);
```

### Issue: Telegram Bot Not Receiving Messages

**Checklist:**
- [ ] Bot token is valid
- [ ] Bot is added to channel as admin
- [ ] Channel is public or bot has access
- [ ] Polling is started
- [ ] No network errors

### Issue: RSS Feeds Not Parsing

**Solution:**
```typescript
// Test individual feed
const testResult = await rssFeedParser.testFeed(
  'https://www.premiumtimesng.com/feed'
);
console.log('Feed accessible:', testResult);
```

---

## Future Enhancements

### Planned Features

1. **Backend Service** (Recommended)
   - Centralized data aggregation
   - Better rate limiting
   - Caching layer
   - WebSocket support for real-time updates

2. **Additional DisCo Scrapers**
   - Eko Disco (when Service Alert page is active)
   - Enugu Disco (press release scraping)
   - BEDC (public announcements)

3. **Enhanced Exam Monitoring**
   - Portal change detection (screenshot comparison)
   - Twitter monitoring without API (scraping)
   - Community reporting system

4. **Data Analytics**
   - Outage pattern analysis
   - Historical data tracking
   - Predictive outage alerts

---

## Support & Resources

### Official Documentation

- Telegram Bot API: https://core.telegram.org/bots/api
- RSS 2.0 Specification: https://validator.w3.org/feed/docs/rss2.html

### Nigerian Data Sources

- NERC (Regulatory): https://nerc.gov.ng/
- TCN (Transmission): https://tcn.org.ng/
- Nigeria Open Data: http://nigeria.opendataforafrica.org/

### Community Resources

- The Electricity Hub: https://theelectricityhub.com/
- Myschool.ng: https://myschool.ng/news
- Nairaland Forums: https://www.nairaland.com/

---

**Last Updated:** 2025-01-XX
**Maintainer:** ng-power-exams Team
**License:** MIT
