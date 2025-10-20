import { DateTime } from 'luxon';
import type { OutageItem } from '../../../src/lib/outages-types';

const TZ = 'Africa/Lagos';
const MAX_AGE_DAYS = 30;

export function filterRecentOutages(items: OutageItem[]): OutageItem[] {
  const now = DateTime.now().setZone(TZ);
  const cutoffDate = now.minus({ days: MAX_AGE_DAYS });

  return items.filter((item) => {
    const publishedAt = DateTime.fromISO(item.publishedAt, { zone: TZ });

    if (!publishedAt.isValid) {
      console.warn(`[Filter] Invalid publishedAt for item: ${item.title}`);
      return false;
    }

    if (publishedAt >= cutoffDate) {
      return true;
    }

    if (item.status === 'PLANNED' && item.plannedWindow?.start) {
      const plannedStart = DateTime.fromISO(item.plannedWindow.start, { zone: TZ });

      if (plannedStart.isValid && plannedStart >= now) {
        console.log(`[Filter] Keeping future planned outage: ${item.title.slice(0, 60)}`);
        return true;
      }
    }

    console.log(`[Filter] Removing old item (${publishedAt.toISODate()}): ${item.title.slice(0, 60)}`);
    return false;
  });
}

export function sortOutagesByRelevance(items: OutageItem[]): OutageItem[] {
  return [...items].sort((a, b) => {
    if (a.status === 'PLANNED' && b.status !== 'PLANNED') return -1;
    if (a.status !== 'PLANNED' && b.status === 'PLANNED') return 1;

    if (a.status === 'PLANNED' && b.status === 'PLANNED') {
      const aStart = a.start ?? a.plannedWindow?.start ?? a.publishedAt;
      const bStart = b.start ?? b.plannedWindow?.start ?? b.publishedAt;
      return new Date(aStart).valueOf() - new Date(bStart).valueOf();
    }

    return new Date(b.publishedAt).valueOf() - new Date(a.publishedAt).valueOf();
  });
}
