# Nigerian Power & Exams Portal

Real-time monitoring portál pre výpadky elektriny a stav skúšok v Nigérii s integráciou viacerých bezplatných dátových zdrojov.

## ✨ Funkcie

### 🔌 Power Outages (Výpadky elektriny)
- **Real-time monitoring** výpadkov od DisCos (Distribution Companies)
- **Web scraping** oficiálnych zdrojov:
  - Ikeja Electric Fault Log (Lagos)
  - IBEDC Outage Information (Oyo, Ogun, Osun, Kwara)
- **Telegram bots** integrácia (AEDC, PHED)
- **Automatická agregácia** z viacerých zdrojov
- **Filtrovanie** podľa DisCo, štátu, typu výpadku

### 📚 Exam Results (Skúškové výsledky)
- **Portal monitoring** pre JAMB, WAEC, NECO
- **Status tracking** dostupnosti portálov
- **Social media monitoring** pre oznámenia
- **News aggregation** o skúškach a výsledkoch

### 📰 News Aggregation (Spravodajstvo)
- **RSS feeds** z 5+ nigérijských spravodajských zdrojov
- **Automatická kategorizácia** (Energy/Education)
- **Telegram channels** monitoring
- **Real-time updates**

## 🚀 Quick Start

```bash
# Inštalácia
npm install

# Konfigurácia (voliteľné)
cp .env.example .env.local
# Upravte .env.local podľa potreby

# Spustenie
npm run dev
```

Aplikácia bude dostupná na `http://localhost:5173`

## 📖 Dokumentácia

- **[Setup Guide](docs/SETUP_GUIDE.md)** - Kompletný sprievodca nastavením (SK)
- **[Data Sources](docs/DATA_SOURCES.md)** - Dokumentácia všetkých dátových zdrojov (EN)

## 🔧 Technológie

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Web Scraping** - Real-time data extraction
- **RSS Parsing** - News aggregation
- **Telegram Bot API** - Real-time updates

## 📊 Dátové zdroje

### Power Outages
✅ **Ikeja Electric** - Fault log scraping
✅ **IBEDC** - Outage information scraping
✅ **Telegram Bots** - AEDC & PHED
⏳ **Ďalšie DisCos** - V pláne

### News
✅ **Punch Nigeria** - RSS feed
✅ **Premium Times** - RSS feed
✅ **Guardian Nigeria** - RSS feed
✅ **Vanguard** - RSS feed
✅ **Channels TV** - RSS feed

### Telegram
✅ **@PunchNewspaper** - News channel
✅ **@tvcnews_nigeria** - News channel
✅ **@nmliveupdates** - Business/Energy news
✅ **@aedcelectricity** - AEDC bot
✅ **@PHEDConnect_bot** - PHED bot

## ⚙️ Konfigurácia

Vytvorte `.env.local` súbor:

```env
# Vypnúť mock data pre reálne zdroje
VITE_USE_MOCK_DATA=false

# Telegram bot token (voliteľné)
VITE_TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# Backend API (voliteľné)
VITE_BACKEND_URL=http://localhost:3000/api
```

## 🏗️ Architektúra

```
├── services/
│   ├── scrapers/           # Web scrapers pre DisCos
│   │   ├── ikejaElectricScraper.ts
│   │   └── ibedcScraper.ts
│   ├── parsers/            # RSS a data parsers
│   │   └── rssFeedParser.ts
│   ├── integrations/       # Telegram bot integration
│   │   └── telegramService.ts
│   ├── powerOutageService.ts
│   ├── newsService.ts
│   └── examService.ts
├── utils/
│   └── corsProxy.ts        # CORS handling utility
├── config/
│   └── api.config.ts       # API endpoints a konfigurácia
└── docs/
    ├── SETUP_GUIDE.md      # Setup sprievodca
    └── DATA_SOURCES.md     # Data sources dokumentácia
```

## 🛠️ Development

```bash
# Development server
npm run dev

# Build pre produkciu
npm run build

# Preview production build
npm run preview
```

## 📝 Príklady použitia

### Získanie power outages

```typescript
import { powerOutageService } from './services/powerOutageService';

// Získať všetky výpadky
const outages = await powerOutageService.fetchPowerOutages();

// Filtrovať podľa DisCo
const ikejaOutages = powerOutageService.filterOutages(outages, {
  disCoId: 'ikeja'
});

// Subscribe na real-time updates
const unsubscribe = powerOutageService.subscribe((outages) => {
  console.log('Updated outages:', outages);
});
```

### Získanie news

```typescript
import { newsService } from './services/newsService';

// Získať energy news
const energyNews = await newsService.fetchNews({
  category: 'ENERGY',
  limit: 10
});

// Získať education news
const eduNews = await newsService.fetchNews({
  category: 'EDUCATION'
});
```

### Telegram monitoring

```typescript
import { telegramService } from './services/integrations/telegramService';

// Inicializácia
telegramService.initialize(process.env.VITE_TELEGRAM_BOT_TOKEN);

// Monitoring kanálov
const newsItems = await telegramService.monitorChannels();

// Monitoring DisCo botov
const outages = await telegramService.monitorDisCoBots();
```

## 🔍 Features v detaile

### Multi-source Data Aggregation
- Paralelné získavanie dát z viacerých zdrojov
- Automatické odstránenie duplikátov
- Preferencia oficiálnych zdrojov
- Fallback mechanizmy

### Smart Caching
- Konfigurateľné cache timeouty
- Automatická invalidácia cache
- Optimalizované pre rôzne typy dát

### Error Handling
- Graceful degradation
- Retry logic s exponential backoff
- Fallback na cached/mock data
- Detailné error logging

### CORS Handling
- Viacero CORS proxy služieb
- Automatický fallback medzi proxy službami
- Smart fetch (direct first, proxy fallback)

## 🌐 Produkčné nasadenie

Pre produkciu odporúčame:

1. **Backend Service** - Implementovať proxy backend
2. **Environment Variables** - Nastaviť cez hosting platform
3. **Rate Limiting** - Rešpektovať source server limits
4. **Monitoring** - Pridať error tracking (Sentry)
5. **Analytics** - Integrovať Google Analytics

Detaily v [Setup Guide](docs/SETUP_GUIDE.md).

## 🤝 Prispievanie

Contributions sú vítané! Prosím:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 Licencia

MIT License

## 🙏 Poďakovanie

- **Nigerian DisCos** - Za verejné fault log stránky
- **Nigerian News Outlets** - Za RSS feeds
- **Telegram** - Za Bot API
- **Research Report** - Za komplexný prieskum dátových zdrojov

---

**Built with ❤️ for Nigeria**

Poháňané reálnymi dátami z viacerých bezplatných zdrojov.
