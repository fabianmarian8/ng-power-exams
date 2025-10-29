# Supabase Backend Architecture

## Overview
This project now uses **Lovable Cloud** (powered by Supabase) for backend functionality, eliminating mock data and providing real-time scraping and updates.

## Architecture Components

### 1. Database Tables

#### `power_outages`
Stores real-time power outage information from Ikeja Electric and IBEDC.

```sql
- id: UUID (primary key)
- disco_id: TEXT (e.g., 'IKEDC', 'IBEDC')
- affected_area: TEXT
- type: TEXT ('UNPLANNED', 'PLANNED', 'RESTORED', 'GRID_STATUS')
- reason: TEXT
- start_time: TIMESTAMPTZ
- estimated_restore_time: TIMESTAMPTZ
- restored_time: TIMESTAMPTZ
- source: TEXT (source URL)
- source_type: TEXT ('OFFICIAL', 'UNOFFICIAL')
- metadata: JSONB
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

#### `news_items`
Aggregates news from RSS feeds (Punch, Premium Times, Guardian, Vanguard, Channels TV).

```sql
- id: BIGSERIAL (primary key)
- category: TEXT ('ENERGY', 'EDUCATION')
- title: TEXT
- summary: TEXT
- url: TEXT
- source: TEXT
- timestamp: TIMESTAMPTZ
- metadata: JSONB
- created_at: TIMESTAMPTZ
```

#### `exam_guides`
Stores exam board status and guides (JAMB, WAEC, NECO).

```sql
- id: TEXT (primary key: 'jamb', 'waec', 'neco')
- name: TEXT
- acronym: TEXT
- description: TEXT
- status: TEXT ('RESULTS RELEASED', 'AWAITING RELEASE', etc.)
- last_checked: TIMESTAMPTZ
- portal_url: TEXT
- quick_links: JSONB
- steps: JSONB
- common_issues: JSONB
- sms_guide: JSONB
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### 2. Edge Functions (Serverless)

#### Scraping Workers
- **`scrape-power-outages`**: Scrapes Ikeja Electric and IBEDC websites every 5 minutes
  - Bypasses CORS using server-side fetching
  - Parses HTML and stores structured data
  - Auto-deletes data older than 7 days

- **`scrape-news`**: Scrapes RSS feeds every 10 minutes
  - Fetches from 5 Nigerian news sources
  - Parses XML and extracts articles
  - Auto-deletes data older than 30 days

#### API Endpoints (Public)
- **`api-power-outages`**: GET /api-power-outages?disco_id=IKEDC&limit=100
- **`api-news`**: GET /api-news?category=ENERGY&limit=50&search=power
- **`api-exam-status`**: GET /api-exam-status?board_id=jamb

All endpoints support CORS and return JSON.

### 3. Real-time Updates

Frontend hooks use Supabase Realtime to subscribe to database changes:

```typescript
const channel = supabase
  .channel('power-outages-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'power_outages'
  }, (payload) => {
    console.log('Real-time update:', payload);
    refetchData();
  })
  .subscribe();
```

### 4. Row Level Security (RLS)

All tables have public READ access (no authentication required):

```sql
CREATE POLICY "Allow public read power_outages" 
  ON public.power_outages 
  FOR SELECT USING (true);
```

Write access is restricted to service role (edge functions only).

## How It Works

### Data Flow
1. **Automated Scraping** → Edge Functions run on schedule (manual trigger for now)
2. **Database Storage** → Scraped data stored in Supabase tables
3. **Real-time Sync** → Frontend automatically updates via Supabase Realtime
4. **API Access** → Frontend fetches via edge function API endpoints

### Frontend Integration

```typescript
// Old (mock data)
const data = await powerOutageService.fetchPowerOutages();

// New (real data from Supabase)
const { data } = await supabase.from('power_outages').select('*');
```

## Triggering Scraping

### Manual Trigger
Call the scraping edge functions manually:

```bash
# Scrape power outages
curl https://nciegooqcezznmapendd.supabase.co/functions/v1/scrape-power-outages

# Scrape news
curl https://nciegooqcezznmapendd.supabase.co/functions/v1/scrape-news
```

### Automatic Scheduling (Future)

**Option A: Supabase Cron Jobs** (requires pg_cron extension)
```sql
SELECT cron.schedule(
  'scrape-power-outages-every-5min',
  '*/5 * * * *',
  $$ SELECT net.http_post(
      url := 'https://nciegooqcezznmapendd.supabase.co/functions/v1/scrape-power-outages',
      headers := '{"Content-Type": "application/json"}'::jsonb
  ) $$
);
```

**Option B: GitHub Actions** (external scheduler)
```yaml
name: Scrape Data
on:
  schedule:
    - cron: '*/5 * * * *'
jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger scraping
        run: curl https://your-project.supabase.co/functions/v1/scrape-power-outages
```

## Benefits

✅ **No mock data** - All data is real and scraped  
✅ **No CORS issues** - Server-side scraping bypasses browser restrictions  
✅ **Real-time updates** - Supabase Realtime pushes changes to frontend instantly  
✅ **Automatic caching** - Database stores data, reducing scraping frequency  
✅ **Scalable** - Serverless edge functions auto-scale with demand  
✅ **Debug panel** - `DataSourcesDebug` component shows data source status  

## Development

### Testing Edge Functions Locally
```bash
# Install Supabase CLI
npm install -g supabase

# Start local Supabase
supabase start

# Test function
curl http://localhost:54321/functions/v1/scrape-power-outages
```

### Viewing Logs
Check edge function logs in Lovable Cloud backend panel for debugging.

## Next Steps

1. **Enable automatic scheduling** using pg_cron or GitHub Actions
2. **Add more data sources** (other DisCos, more news feeds)
3. **Implement user reporting** (crowdsourced outage data)
4. **Add notifications** (email/SMS alerts for outages in user's area)
