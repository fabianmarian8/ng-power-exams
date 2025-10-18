#!/bin/bash

# Script pre automatické obnovovanie dát
# Spúšťa sa každých 5 minút cez cron

cd "$(dirname "$0")/.."

echo "🔄 Začínam aktualizáciu dát - $(date)"

# Spustiť ingest script
npm run ingest

if [ $? -eq 0 ]; then
  echo "✅ Dáta úspešne aktualizované - $(date)"
  
  # Commit zmeny do git (voliteľné)
  if [ "$AUTO_COMMIT" = "true" ]; then
    git add public/live/*.json
    git commit -m "Auto-update: Live data refresh $(date +%Y-%m-%d_%H:%M)"
    git push
  fi
else
  echo "❌ Chyba pri aktualizácii dát - $(date)"
  exit 1
fi

echo "✅ Hotovo - $(date)"
