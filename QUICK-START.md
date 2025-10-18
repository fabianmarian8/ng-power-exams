# 🚀 Rýchly štart - Oprava starých dát

## Problém, ktorý sme vyriešili:
❌ Staré dáta z 11. októbra
❌ Duplicitné JSON štruktúry
❌ Žiadne automatické obnovovanie

## ✅ Riešenie:

### 1. Opravené JSON súbory
- `public/live/news.json` - opravený formát
- `public/live/outages.json` - opravený formát
- Aktuálne dáta k dnešnému dňu

### 2. Automatické aktualizácie
- GitHub Actions workflow (každých 5 minút)
- Bash skript pre manuálne spustenie
- Real-time obnovenie v prehliadači (1-2 min)

### 3. Nový komponent
- `LiveNewsBoard.tsx` - interaktívne zobrazenie
- Vizuálne indikátory načítavania
- Automatické "pred Xm" časové značky

## 🎯 Ako to spustiť:

### Krok 1: Aktualizovať váš projekt
```bash
cd /Users/marianfabian/Desktop/ng-power-exams

# Skopírovať opravené súbory
cp /tmp/ng-power-exams-fresh/public/live/*.json ./public/live/
cp /tmp/ng-power-exams-fresh/src/hooks/useNews.ts ./src/hooks/
cp /tmp/ng-power-exams-fresh/src/hooks/useOutages.ts ./src/hooks/
cp /tmp/ng-power-exams-fresh/src/components/LiveNewsBoard.tsx ./src/components/
cp /tmp/ng-power-exams-fresh/.github/workflows/auto-update.yml ./.github/workflows/
cp /tmp/ng-power-exams-fresh/scripts/auto-update.sh ./scripts/
```

### Krok 2: Pridať komponent na hlavnú stránku
```tsx
// V src/pages/Index.tsx alebo Outages.tsx
import { LiveNewsBoard } from "@/components/LiveNewsBoard";

// Pridať kamkoľvek chcete zobraziť správy:
<LiveNewsBoard />
```

### Krok 3: Push do GitHub
```bash
git add .
git commit -m "✨ Add auto-updating live data system"
git push
```

### Krok 4: Aktivovať GitHub Actions
1. Ísť na GitHub → Settings → Actions
2. Povoliť "Read and write permissions"
3. Actions sa spustí automaticky

## 📊 Čo sa zmenilo:

### useNews.ts
```diff
+ refetchInterval: 60_000  // Obnoviť každú minútu
+ console.warn messages pre lepší debugging
```

### useOutages.ts
```diff
+ refetchInterval: 120_000  // Obnoviť každé 2 minúty
+ Lepšie chybové hlásenia
```

### LiveNewsBoard.tsx (NOVÝ)
- Responzívny dizajn
- Oddelené oficiálne vs médiá
- Real-time časové značky
- Loading indikátory

## 🔧 Nastavenie intervalov:

```typescript
// Pre rýchlejšie aktualizácie (30s):
refetchInterval: 30_000

// Pre pomalšie aktualizácie (5min):
refetchInterval: 300_000
```

## 🎨 Customizácia:

### Zmena farieb v LiveNewsBoard:
```tsx
// Oficiálne zdroje - zelená
className="border-l-nigeria-green"

// Médiá - neutrálna
className="border-l-muted"
```

### Pridať filtre:
```tsx
const powerNews = items.filter(item => item.domain === "POWER");
const examNews = items.filter(item => item.domain === "EXAMS");
```

## ✅ Kontrola funkčnosti:

1. **Spustiť dev server:**
```bash
npm run dev
```

2. **Otvoriť DevTools (F12) → Console**
- Nemali by byť žiadne chyby
- Vidíte logy o fetchovaní dát

3. **Network tab:**
- Hľadajte requesty na `news.json` a `outages.json`
- Mali by sa obnovovať každú 1-2 minúty

4. **GitHub Actions:**
- GitHub → Actions tab
- Vidíte workflow "Auto Update Live Data"
- Zelená fajka = úspech

## 📝 Poznámky:

- Prvé spustenie Actions môže trvať 5-10 minút
- Dáta v cache prehliadača vyčistiť: Ctrl + Shift + R
- Pre testovanie: `npm run ingest`

## 🆘 Pomoc:

Ak niečo nefunguje:
1. Pozri `docs/AUTO-UPDATE.md`
2. Skontroluj GitHub Actions logy
3. Overiť `public/live/*.json` súbory
