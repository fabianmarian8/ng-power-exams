# 🔄 Automatické aktualizácie dát

## Prehľad
Tento projekt používa automatické aktualizácie pre zobrazovanie najnovších správ a výpadkov elektriny.

## Funkcie

### ✅ Real-time aktualizácie
- **Správy**: Obnovenie každú 1 minútu
- **Výpadky**: Obnovenie každé 2 minúty
- **Automatický fallback**: Pri zlyhaniach používa záložné dáta

### 🔄 Metódy aktualizácie

#### 1. Automatické (GitHub Actions)
```yaml
# Spúšťa sa automaticky každých 5 minút
# Súbor: .github/workflows/auto-update.yml
```

**Výhody:**
- Plne automatické
- Žiadna manuálna práca
- Dáta vždy aktuálne

**Nastavenie:**
1. GitHub Actions je už nakonfigurovaný
2. Automaticky začne fungovať po pushu
3. Kontrola logov: GitHub → Actions tab

#### 2. Manuálne (Lokálne)
```bash
# Spustiť ingest skript
npm run ingest

# Alebo použiť automatizačný skript
./scripts/auto-update.sh
```

#### 3. Cron Job (Server)
```bash
# Pridať do crontab
*/5 * * * * /cesta/ku/projektu/scripts/auto-update.sh
```

## Konfigurácia intervalov

### V hooks:
```typescript
// src/hooks/useNews.ts
refetchInterval: 60_000  // 1 minúta (môžete zmeniť)

// src/hooks/useOutages.ts
refetchInterval: 120_000  // 2 minúty (môžete zmeniť)
```

### V GitHub Actions:
```yaml
# .github/workflows/auto-update.yml
cron: '*/5 * * * *'  # každých 5 minút
```

## Komponenty

### LiveNewsBoard
Nový komponent pre zobrazovanie správ v reálnom čase

## Riešenie problémov

### Dáta sa neaktualizujú
1. Skontrolujte GitHub Actions logy
2. Overte, že ingest skript funguje: `npm run ingest`
3. Skontrolujte konzolu prehliadača (F12)

### Staré dáta v prehliadači
1. Vyčistiť cache (Ctrl + Shift + R)
2. Skontrolovať súbory `/public/live/*.json`
