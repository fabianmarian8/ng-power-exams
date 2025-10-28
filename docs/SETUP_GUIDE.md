# Setup Guide - Nigerian Power & Exams Portal

Komplexný sprievodca nastavením portálu s integráciou reálnych dátových zdrojov.

## Obsah

1. [Rýchly štart](#rýchly-štart)
2. [Konfigurácia zdrojov dát](#konfigurácia-zdrojov-dát)
3. [Telegram Bot Setup](#telegram-bot-setup)
4. [Backend Service (voliteľné)](#backend-service-voliteľné)
5. [Produkčné nasadenie](#produkčné-nasadenie)

---

## Rýchly štart

### 1. Inštalácia

```bash
# Klonovať repozitár
git clone <repository-url>
cd ng-power-exams

# Nainštalovať závislosti
npm install
```

### 2. Základná konfigurácia

Vytvoriť `.env.local` súbor:

```env
# Vypnúť mock dáta pre použitie reálnych zdrojov
VITE_USE_MOCK_DATA=false

# Telegram bot token (voliteľné - pre Telegram integráciu)
VITE_TELEGRAM_BOT_TOKEN=

# Backend API URL (voliteľné - ak používate vlastný backend)
VITE_BACKEND_URL=http://localhost:3000/api
```

### 3. Spustenie vývojového servera

```bash
npm run dev
```

Aplikácia bude dostupná na `http://localhost:5173`

---

## Konfigurácia zdrojov dát

### Momentálne aktívne zdroje (bez dodatočnej konfigurácie)

Tieto zdroje fungujú ihneď po nastavení `VITE_USE_MOCK_DATA=false`:

#### ✅ Web Scrapers
- **Ikeja Electric Fault Log** - automatické scrapovanie
- **IBEDC Outage Information** - automatické scrapovanie

#### ✅ RSS Feed Parser
- **Punch Nigeria** - http://punchng.com/feed
- **Premium Times** - https://www.premiumtimesng.com/feed
- **Guardian Nigeria** - https://guardian.ng/feed
- **Vanguard** - https://www.vanguardngr.com/feed/
- **Channels TV** - https://www.channelstv.com/feed/

### CORS Proxy konfigurácia

Pre scraping sa automaticky používa CORS proxy. Môžete konfigurovať:

```typescript
import { corsProxy, ProxyService } from './utils/corsProxy';

// V hlavnom súbore aplikácie
corsProxy.configure({
  service: ProxyService.AllOrigins, // alebo ThingProxy
  timeout: 30000,
  retries: 2
});
```

**Dostupné proxy služby:**
- `ProxyService.AllOrigins` (default) - https://allorigins.win
- `ProxyService.ThingProxy` - https://thingproxy.freeboard.io
- `ProxyService.Custom` - vlastný backend proxy

---

## Telegram Bot Setup

Pre integráciu Telegram kanálov a botov:

### Krok 1: Vytvorenie Telegram bota

1. Otvorte Telegram a vyhľadajte **@BotFather**
2. Začnite konverzáciu a použite príkaz `/newbot`
3. Postupujte podľa inštrukcií:
   ```
   BotFather: Alright, a new bot. How are we going to call it?
   You: Nigerian Power Updates Bot

   BotFather: Good. Now let's choose a username for your bot.
   You: ng_power_updates_bot
   ```
4. BotFather vám poskytne **bot token**:
   ```
   Done! Your token is: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz
   ```

### Krok 2: Konfigurácia v aplikácii

Pridajte token do `.env.local`:

```env
VITE_TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
```

### Krok 3: Pridanie bota do kanálov (voliteľné)

Pre monitoring verejných kanálov potrebujete bota pridať ako administrátora:

**Monitorované kanály:**
- @PunchNewspaper (spravodajstvo)
- @tvcnews_nigeria (spravodajstvo)
- @nmliveupdates (business/energy news)

**Poznámka:** Pridanie bota vyžaduje súhlas vlastníka kanála.

### Krok 4: Testovanie

```typescript
import { telegramService } from './services/integrations/telegramService';

// Overenie, že bot funguje
const botInfo = await telegramService.getBotInfo();
console.log('Bot:', botInfo.username);

// Získanie aktualizácií
const updates = await telegramService.getUpdates();
console.log('Updates:', updates.length);
```

### Použitie bez vlastného bota

Ak nemáte Telegram bot token, aplikácia bude fungovať aj bez Telegram integrácie.
Ostatné zdroje (scrapers, RSS) budú stále aktívne.

---

## Backend Service (voliteľné)

Pre produkčné nasadenie sa odporúča implementovať vlastný backend service.

### Výhody backend služby:

- ✅ Žiadne CORS problémy
- ✅ Lepšie rate limiting
- ✅ Server-side caching
- ✅ WebSocket real-time updates
- ✅ Databáza pre historické dáta
- ✅ Bezpečnejšie API key management

### Jednoduchý Node.js Backend príklad

```javascript
// server.js
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

// Proxy endpoint pre scraping
app.post('/api/proxy', async (req, res) => {
  const { url } = req.body;

  try {
    const response = await fetch(url);
    const text = await response.text();
    res.json({ content: text });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Power outages endpoint
app.get('/api/power-outages', async (req, res) => {
  // Aggregate data from scrapers
  const outages = await aggregateOutages();
  res.json(outages);
});

// News endpoint
app.get('/api/news', async (req, res) => {
  // Parse RSS feeds
  const news = await parseRSSFeeds();
  res.json(news);
});

app.listen(3000, () => {
  console.log('Backend running on port 3000');
});
```

### Spustenie backend servera

```bash
# V samostatnom termináli
cd backend
npm install express cors node-fetch
node server.js
```

Aktualizujte `.env.local`:
```env
VITE_BACKEND_URL=http://localhost:3000/api
```

---

## Produkčné nasadenie

### 1. Build aplikácie

```bash
npm run build
```

Vytvorí sa `dist` priečinok s optimalizovanými súbormi.

### 2. Environment variables pre produkciu

**Vercel/Netlify:**

V nastaveniach projektu pridajte:
```
VITE_USE_MOCK_DATA=false
VITE_TELEGRAM_BOT_TOKEN=your_token_here
VITE_BACKEND_URL=https://your-backend.com/api
```

### 3. CORS Proxy pre produkciu

**Odporúčanie:** Implementujte vlastný backend proxy namiesto verejných služieb.

```typescript
// V produkcii
corsProxy.configure({
  service: ProxyService.Custom,
  customUrl: 'https://your-backend.com/api/proxy?url='
});
```

### 4. Rate Limiting

Nastavte vhodné polling intervaly v `config/api.config.ts`:

```typescript
export const API_CONFIG = {
  polling: {
    powerOutages: 120000,  // 2 minúty (nie kratšie!)
    examStatus: 300000,    // 5 minút
    news: 600000,          // 10 minút
  },
};
```

### 5. Monitoring

Odporúčané nástroje:
- **Sentry** - error tracking
- **Google Analytics** - user analytics
- **Uptime Robot** - uptime monitoring

---

## Riešenie problémov

### Problém: "CORS error" pri scrapingu

**Riešenie 1:** Uistite sa, že CORS proxy je nakonfigurovaný
```typescript
import { corsProxy } from './utils/corsProxy';
// Skontrolujte konfiguráciu
console.log(corsProxy.getConfig());
```

**Riešenie 2:** Skúste iný proxy service
```typescript
corsProxy.configure({ service: ProxyService.ThingProxy });
```

**Riešenie 3:** Implementujte backend proxy

---

### Problém: Žiadne dáta z scraperov

**Debug kroky:**

1. Skontrolujte, či je vypnutý mock režim:
   ```env
   VITE_USE_MOCK_DATA=false
   ```

2. Otvorte konzolu a hľadajte chyby:
   ```
   F12 → Console → hľadajte červené chyby
   ```

3. Testujte scraper dostupnosť:
   ```typescript
   import { ikejaElectricScraper } from './services/scrapers/ikejaElectricScraper';

   const available = await ikejaElectricScraper.checkAvailability();
   console.log('Ikeja available:', available);
   ```

4. Skúste manuálne navštíviť zdroj:
   - https://www.ikejaelectric.com/fault-log
   - https://www.ibedc.com/outage-information

---

### Problém: RSS feeds nefungujú

**Riešenie:**

```typescript
import { rssFeedParser } from './services/parsers/rssFeedParser';

// Test jednotlivých feedov
const feeds = rssFeedParser.getAvailableFeeds();
for (const feed of feeds) {
  const works = await rssFeedParser.testFeed(feed.url);
  console.log(`${feed.source}: ${works ? 'OK' : 'FAILED'}`);
}
```

---

### Problém: Telegram bot nereaguje

**Checklist:**

- [ ] Token je správne nastavený v `.env.local`
- [ ] Token začína na čísla a obsahuje dvojbodku (123456:ABC...)
- [ ] Bot je inicializovaný v kóde
- [ ] Nie sú žiadne sieťové chyby

**Test:**
```typescript
import { telegramService } from './services/integrations/telegramService';

try {
  telegramService.initialize(process.env.VITE_TELEGRAM_BOT_TOKEN);
  const info = await telegramService.getBotInfo();
  console.log('Bot OK:', info);
} catch (error) {
  console.error('Bot ERROR:', error);
}
```

---

## Pokročilé nastavenia

### Vlastné scrapers

Pridať nový scraper pre iný DisCo:

1. Vytvorte nový súbor v `services/scrapers/`:
   ```typescript
   // services/scrapers/ekoDiscoScraper.ts
   class EkoDiscoScraper {
     private readonly URL = 'https://www.ekedp.com/...';

     async scrapeOutages(): Promise<PowerOutage[]> {
       // Implementácia
     }
   }

   export const ekoDiscoScraper = new EkoDiscoScraper();
   ```

2. Integrujte do `powerOutageService.ts`:
   ```typescript
   import { ekoDiscoScraper } from './scrapers/ekoDiscoScraper';

   async fetchPowerOutages() {
     const [..., ekoOutages] = await Promise.allSettled([
       ...,
       this.fetchFromEko(),
     ]);
   }

   private async fetchFromEko() {
     return await ekoDiscoScraper.scrapeOutages();
   }
   ```

### Vlastné RSS feedy

Pridať nový RSS feed:

```typescript
// V services/parsers/rssFeedParser.ts
private readonly RSS_FEEDS: RSSFeed[] = [
  ...,
  {
    url: 'https://example.com/feed',
    source: 'Example News',
    category: 'ENERGY'
  }
];
```

---

## Výkonnostné optimalizácie

### 1. Caching stratégia

```typescript
// Odporúčané cache timeouts
const CACHE_TIMEOUTS = {
  powerOutages: 60000,   // 1 minúta
  news: 180000,          // 3 minúty
  examStatus: 300000,    // 5 minút
};
```

### 2. Lazy loading scrapers

```typescript
// Načítať scraper len keď je potrebný
const scraper = await import('./scrapers/ikejaElectricScraper');
const data = await scraper.ikejaElectricScraper.scrapeFaultLog();
```

### 3. Batch requests

```typescript
// Získať všetky dáta naraz
const [outages, news, examStatus] = await Promise.all([
  powerOutageService.fetchPowerOutages(),
  newsService.fetchNews({ category: 'ENERGY' }),
  examService.fetchExamStatuses()
]);
```

---

## Bezpečnosť

### API Keys management

**NIKDY** necommitujte API keys do Git:

```bash
# .gitignore
.env.local
.env.production.local
```

Použite environment variables:
```typescript
const token = process.env.VITE_TELEGRAM_BOT_TOKEN;
if (!token) {
  throw new Error('VITE_TELEGRAM_BOT_TOKEN not set');
}
```

### Rate limiting

Implementujte vlastný rate limiter:

```typescript
class RateLimiter {
  private lastCall = 0;
  private minInterval = 1000; // 1 sekunda

  async throttle() {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCall;

    if (timeSinceLastCall < this.minInterval) {
      await new Promise(resolve =>
        setTimeout(resolve, this.minInterval - timeSinceLastCall)
      );
    }

    this.lastCall = Date.now();
  }
}
```

---

## Ďalšie kroky

Po úspešnom nastavení:

1. ✅ Otestujte všetky data sources
2. ✅ Nastavte monitoring
3. ✅ Implementujte error reporting
4. ✅ Zvážte backend service pre produkciu
5. ✅ Pridajte analytics
6. ✅ Optimalizujte pre mobil

---

## Podpora

Pre technické problémy alebo otázky:

- 📖 Dokumentácia: `docs/DATA_SOURCES.md`
- 🐛 Issues: GitHub Issues
- 💬 Diskusia: GitHub Discussions

---

**Verzia:** 1.0.0
**Posledná aktualizácia:** 2025-01-XX
