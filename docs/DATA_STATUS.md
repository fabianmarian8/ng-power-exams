# Stav dátových zdrojov

Tento dokument popisuje aktuálny stav všetkých dátových zdrojov v aplikácii, vrátane toho, ktoré fungují automaticky a ktoré vyžadujú konfiguráciu.

## ✅ Funkčné zdroje (bez potreby konfigurácie)

Tieto zdroje fungujú **okamžite po spustení aplikácie** pomocou web scrapingu a RSS parsingu na strane klienta.

### 1. Ikeja Electric Fault Log
- **Typ:** Web scraping (client-side)
- **Zdroj:** https://ikejaelectric.com/fault-log
- **Dáta:** Power outages v Lagos oblasti
- **Frekvencia:** Real-time pri každom requeste
- **Implementácia:** `services/scrapers/ikejaElectricScraper.ts`
- **Status:** ✅ Plne funkčné

### 2. IBEDC Outage Information
- **Typ:** Web scraping (client-side)
- **Zdroj:** IBEDC official website
- **Dáta:** Power outages v Oyo, Ogun, Osun, Kwara states
- **Frekvencia:** Real-time pri každom requeste
- **Implementácia:** `services/scrapers/ibedcScraper.ts`
- **Status:** ✅ Plne funkčné

### 3. Nigerian News RSS Feeds
- **Typ:** RSS parsing (client-side)
- **Zdroje:** 7 hlavných nigérijských spravodajských portálov
  1. **Punch Nigeria** - https://punchng.com
  2. **Premium Times** - https://www.premiumtimesng.com
  3. **Guardian Nigeria** - https://guardian.ng
  4. **Vanguard** - https://www.vanguardngr.com
  5. **Channels TV** - https://www.channelstv.com
  6. **Daily Trust** - https://dailytrust.com
  7. **This Day** - https://www.thisdaylive.com
- **Dáta:** News articles (Energy & Education categories)
- **Frekvencia:** Real-time pri každom requeste
- **Implementácia:** `services/parsers/rssFeedParser.ts`
- **Status:** ✅ Plne funkčné

**Poznámka:** Všetky tieto zdroje používajú CORS proxy utility (`utils/corsProxy.ts`) pre obídenie CORS problémov pri client-side scrapingu.

---

## ⚙️ Vyžadujú konfiguráciu (optional)

Tieto zdroje poskytujú dodatočné dáta, ale vyžadujú API tokeny. Aplikácia funguje aj bez nich.

### 4. Telegram Bot API
- **Typ:** API integrácia
- **Účel:** Monitoring Telegram kanálov a botov
- **Dátové zdroje:**
  - **News channels:** @PunchNewspaper, @tvcnews_nigeria, @nmliveupdates
  - **DisCo bots:** @aedcelectricity, @PHEDConnect_bot
- **Vyžaduje:** `VITE_TELEGRAM_BOT_TOKEN`
- **Ako získať:**
  1. Otvorte Telegram a vyhľadajte [@BotFather](https://t.me/BotFather)
  2. Vytvorte nového bota pomocou `/newbot`
  3. Skopírujte token
  4. Pridajte do `.env.local`: `VITE_TELEGRAM_BOT_TOKEN=your_token_here`
- **Implementácia:** `services/integrations/telegramService.ts`
- **Status:** ⚙️ Vyžaduje konfiguráciu

### 5. Twitter/X API
- **Typ:** API integrácia
- **Účel:** Monitoring Twitter účtov DisCos a exam boards
- **Dátové zdroje:**
  - **DisCos:** @IkejaElectric, @AEDC_official, @BEDC_official, atď.
  - **Exam boards:** @JAMBHQ, @WAECNigeria, @NecoNigeria
- **Vyžaduje:** `VITE_TWITTER_BEARER_TOKEN`
- **Ako získať:**
  1. Zaregistrujte sa na [Twitter Developer Platform](https://developer.twitter.com/)
  2. Vytvorte nový projekt a aplikáciu
  3. Vygenerujte Bearer Token v "Keys and tokens"
  4. Pridajte do `.env.local`: `VITE_TWITTER_BEARER_TOKEN=your_token_here`
- **Implementácia:** `services/socialMediaService.ts`
- **Status:** ⚙️ Vyžaduje konfiguráciu

---

## ❌ Nefunkčné (backend nie je implementovaný)

Tieto endpointy sú definované v kóde, ale backend API neexistuje ako súčasť tohto projektu.

### 6. Backend API
- **Typ:** Backend REST API
- **Očakávaná URL:** `http://localhost:3000/api`
- **Endpointy:**
  - `/power-outages` - Power outages aggregation
  - `/exam-status` - Exam portal status
  - `/news` - News aggregation
  - `/social` - Social media posts
- **Status:** ❌ Nie je implementovaný
- **Alternatíva:** Všetky dáta sú získavané priamo z client-side scrapingu a RSS feedov

**Poznámka:** Pre produkčnú aplikáciu sa odporúča implementovať backend API pomocá Supabase Edge Functions alebo iného serverless riešenia pre lepšiu performance a obídenie CORS problémov.

---

## 🔍 Ako testovať dátové zdroje

### Development Mode - Debug Component

V development móde je dostupný `DataSourcesDebug` komponent, ktorý zobrazuje real-time status všetkých zdrojov:

1. Spustite aplikáciu v dev móde: `npm run dev`
2. Nájdete tlačidlo "📊 Data Sources" v pravom dolnom rohu
3. Kliknite pre zobrazenie statusu všetkých zdrojov
4. Komponent zobrazuje:
   - ✅ Online - Zdroj funguje a vracia dáta
   - ❌ Offline - Zdroj nefunguje (CORS, server error)
   - ⚙️ Not configured - Vyžaduje API token

### Browser Console Testing

Môžete tiež testovať zdroje priamo v browser console:

```javascript
// Test Ikeja Electric scraper
const { ikejaElectricScraper } = await import('./services/scrapers/ikejaElectricScraper');
const outages = await ikejaElectricScraper.scrapeFaultLog();
console.log('Ikeja outages:', outages);

// Test IBEDC scraper
const { ibedcScraper } = await import('./services/scrapers/ibedcScraper');
const ibedcOutages = await ibedcScraper.scrapeOutages();
console.log('IBEDC outages:', ibedcOutages);

// Test RSS feeds
const { rssFeedParser } = await import('./services/parsers/rssFeedParser');
const news = await rssFeedParser.fetchByCategory('ALL');
console.log('RSS news:', news);
```

---

## 📊 Súhrn

| Zdroj | Typ | Status | Konfigurácia |
|-------|-----|--------|--------------|
| Ikeja Electric | Scraping | ✅ Funguje | Žiadna |
| IBEDC | Scraping | ✅ Funguje | Žiadna |
| RSS Feeds (7x) | RSS | ✅ Funguje | Žiadna |
| Telegram | API | ⚙️ Optional | `VITE_TELEGRAM_BOT_TOKEN` |
| Twitter/X | API | ⚙️ Optional | `VITE_TWITTER_BEARER_TOKEN` |
| Backend API | Backend | ❌ Not implemented | N/A |

**Celkovo:** 3 funkčné zdroje, 2 vyžadujú konfiguráciu, 1 nie je implementovaný.

---

## 🚀 Ďalšie kroky

### Pre základné použitie (už funguje):
- ✅ Žiadna konfigurácia potrebná
- ✅ Ikeja + IBEDC scrapers + RSS feeds poskytujú reálne dáta

### Pre rozšírenú funkcionalitu:
1. Získajte Telegram Bot Token pre monitoring news channels
2. Získajte Twitter Bearer Token pre social media monitoring
3. (Optional) Implementujte backend API pre lepšiu performance

### Pre produkciu:
1. Zvážte implementáciu backend API (Supabase Edge Functions)
2. Pridajte rate limiting pre scraping
3. Implementujte caching layer
4. Pridajte error tracking (Sentry)
5. Nastavte monitoring alerts

---

**Posledná aktualizácia:** 2025-01-28
