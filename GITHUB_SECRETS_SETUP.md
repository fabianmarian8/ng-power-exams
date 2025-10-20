# 🔧 GitHub Secrets Setup

Pre správne fungovanie automatického ingestu a redeploy je potrebné nakonfigurovať nasledujúce GitHub Secrets.

## 📍 Ako pridať secret v GitHub

1. Choď do repozitára: **https://github.com/fabianmarian8/ng-power-exams**
2. Klikni na **Settings** → **Secrets and variables** → **Actions**
3. Klikni **New repository secret**
4. Zadaj názov a hodnotu secretu

---

## 🔑 Potrebné Secrets

### 1. **REDEPLOY_HOOK_URL** (Povinné pre automatický redeploy)

**Čo to je:**  
Deploy webhook URL z Vercel alebo Lovable, ktorý spustí redeploy aplikácie po aktualizácii dát.

**Ako získať:**

#### Pre Vercel:
1. Choď do Vercel Dashboard → tvoj projekt
2. **Settings** → **Git** 
3. Nájdi **Deploy Hooks** sekciu
4. Vytvor nový hook (napr. "GitHub Actions Redeploy")
5. Skopíruj vygenerovanú URL (začína `https://api.vercel.com/v1/integrations/deploy/...`)

#### Pre Lovable:
1. Choď do Lovable projektu
2. Settings → Deploy Hooks
3. Vytvor nový webhook
4. Skopíruj URL

**Príklad hodnoty:**
```
https://api.vercel.com/v1/integrations/deploy/prj_xxxxx/yyyyy
```

---

## ✅ Overenie správnej konfigurácie

Po nastavení secretu:

1. Choď do **Actions** tabu v GitHub repozitári
2. Spusti workflow manuálne: **Ingest outages & redeploy** → **Run workflow**
3. Skontroluj logy - mala by sa objaviť správa: `"Triggering redeploy..."`

---

## 🚫 Nepotrebné Secrets

Tieto secrets sú **NIE SÚ POTREBNÉ** pre tento projekt:

- ❌ `ANTHROPIC_API_KEY` - projekt nepoužíva Claude API
- ❌ `TELEGRAM_API_ID` / `TELEGRAM_API_HASH` / `TELEGRAM_SESSION` - nie je Telegram integrácia  
- ❌ `TWITTER_BEARER_TOKEN` - projekt len scrapuje web, nepoužíva Twitter API

---

## 🔄 Ako funguje workflow

1. **Každých 15 minút** (alebo manuálne spustenie):
   - Stiahne nové power outage dáta
   - Stiahne novinky
   - Uloží JSON súbory do `public/live/`
   
2. **Ak sú zmeny:**
   - Commitne a pushne zmeny
   - Zavolá `REDEPLOY_HOOK_URL` → spustí redeploy na Vercel/Lovable

3. **Výsledok:**
   - Web má vždy aktuálne dáta 🎉
