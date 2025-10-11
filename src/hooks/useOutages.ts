import { useQuery } from '@tanstack/react-query';
import { OUTAGES_FALLBACK } from '@/data/outages-fallback';
import type { OutagesPayload, OutageItem } from '@/lib/outages-types';
import { fromLagosISO, lagosNow } from '@shared/luxon';

function cloneFallback(): OutagesPayload {
  return JSON.parse(JSON.stringify(OUTAGES_FALLBACK)) as OutagesPayload;
}

interface UseOutagesResult {
  data?: OutagesPayload;
  isLoading: boolean;
  error: unknown;
  isRefetching: boolean;
  all: OutageItem[];
  planned: OutageItem[];
  active: OutageItem[];
  restored: OutageItem[];
  lastIngest?: string;
  lastSourceUpdate?: string;
}

export type PlannedRange = 'today' | 'next7' | 'all';

export function selectPlanned(items: OutageItem[], range: PlannedRange): OutageItem[] {
  const planned = items.filter((item) => item.status === 'PLANNED');
  const now = lagosNow();
  const startOfDay = now.startOf('day');
  const endOfDay = now.endOf('day');
  const rangeEnd = now.plus({ days: 7 }).endOf('day');

  const filtered = planned.filter((item) => {
    const start = fromLagosISO(item.start ?? item.plannedWindow?.start);
    const end = fromLagosISO(item.end ?? item.plannedWindow?.end);

    if (range === 'all') {
      return true;
    }

    if (!start) {
      return false;
    }

    if (range === 'today') {
      const effectiveEnd = end ?? start;
      return start <= endOfDay && effectiveEnd >= startOfDay;
    }

    if (range === 'next7') {
      return start >= startOfDay && start <= rangeEnd;
    }

    return true;
  });

  return filtered
    .map((item) => ({
      item,
      start: fromLagosISO(item.start ?? item.plannedWindow?.start),
      published: fromLagosISO(item.publishedAt)
    }))
    .sort((a, b) => {
      if (a.start && b.start) {
        return a.start.toMillis() - b.start.toMillis();
      }
      if (a.start) return -1;
      if (b.start) return 1;
      const aPublished = a.published?.toMillis() ?? 0;
      const bPublished = b.published?.toMillis() ?? 0;
      return bPublished - aPublished;
    })
    .map(({ item }) => item);
}

export function useOutages(): UseOutagesResult {
  const query = useQuery<OutagesPayload>({
    queryKey: ['outages'],
    queryFn: async () => {
      const queryString = `v=${Date.now()}`;
      let lastError: Error | undefined;

      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const response = await fetch(`/live/outages.json?${queryString}`, { cache: 'no-store' });
          if (!response.ok) {
            if (response.status === 404) {
              console.warn('Live outages file missing — returning fallback payload');
              return cloneFallback();
            }
            throw new Error(`Failed to fetch outages (status ${response.status})`);
          }
          return response.json();
        } catch (error) {
          lastError = error instanceof Error ? error : new Error('Unknown fetch error');
          if (attempt === 1) {
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      }
      console.warn('Failed to fetch live outages, using fallback payload', lastError);
      return cloneFallback();
    },
    refetchOnWindowFocus: true,
    staleTime: 60_000,
    refetchInterval: 300_000
  });

  const payload = query.data ?? cloneFallback();
  const all = payload.items ?? [];
  const planned = payload.planned ?? all.filter((item) => item.status === 'PLANNED');
  const active = all.filter((item) => item.status === 'UNPLANNED');
  const restored = all.filter((item) => item.status === 'RESTORED');

  return {
    ...query,
    all,
    planned,
    active,
    restored,
    lastIngest: payload.generatedAt,
    lastSourceUpdate: payload.latestSourceAt,
    data: payload
  };
}
