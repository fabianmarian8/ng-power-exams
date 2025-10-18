# ⚡ Quick Reference - NG-Power-Exams Expansion

## 🎯 Najčastejšie úlohy

### Vytvorenie novej utility funkcie
```typescript
// src/lib/utils/my-util.ts
import { logger } from '@/lib/expansion/utils/logger';

export function myUtilFunction(data: unknown): Result {
  logger.info('Processing data', { data });
  // Implementation
  return result;
}
```

### Vytvorenie nového service
```typescript
// src/lib/services/my-service.ts
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { errorHandler } from '@/lib/expansion/utils/error-handler';

export class MyService {
  private http = inject(HttpClient);

  getData() {
    return this.http.get('/api/data').pipe(
      catchError(errorHandler.handle)
    );
  }
}
```

## 📋 Príkazový riadok

```bash
yarn dev     # Development server
yarn build   # Production build
yarn test    # Run tests
yarn lint    # Lint code
```

## 🔍 Logger použitie

```typescript
import { logger } from '@/lib/expansion/utils/logger';

logger.info('Info message', { metadata });
logger.warn('Warning message', { metadata });
logger.error('Error message', { error, metadata });
logger.debug('Debug message', { metadata });
```

## 📁 Najdôležitejšie súbory

```
src/lib/expansion/
├── templates/       # Šablóny
├── utils/           # Utilities
└── config/          # Konfigurácia
```

## 🎯 Best practices

1. ✅ Používaj logger namiesto console.log
2. ✅ Všetky funkcie majú typy
3. ✅ Error handling cez centralizovaný handler
4. ✅ Používaj šablóny pre konzistentnosť
5. ✅ Dokumentuj nové funkcie

---

**Pre viac:** `docs/expansion/IMPLEMENTATION_GUIDE.md`
