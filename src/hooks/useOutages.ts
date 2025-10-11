import { DateTime } from 'luxon';
import { useQuery } from '@tanstack/react-query';
import { OUTAGES_FALLBACK } from '@/data/outages-fallback';
import type { OutagesPayload, OutageItem } from '@/lib/outages-types';

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

const ZONE = 'Africa/Lagos';

export type PlannedRange = 'today' | 'next7' | 'all';

export function selectPlanned(items: OutageItem[], range: PlannedRange): OutageItem[] {
  const withStart = items.filter((item) => {
    if (item.status !== 'PLANNED') return false;
    return Boolean(item.start ?? item.plannedWindow?.start);
  });

  let filtered = withStart;
  const now = DateTime.now().setZone(ZONE);

  if (range === 'today') {
    const startOfDay = now.startOf('day');
    const endOfDay = now.endOf('day');
    filtered = withStart.filter((item) => {
      const startIso = item.start ?? item.plannedWindow?.start;
      if (!startIso) return false;
      const start = DateTime.fromISO(startIso, { zone: ZONE });
      if (!start.isValid) return false;
      const endIso = item.end ?? item.plannedWindow?.end;
      const end = endIso ? DateTime.fromISO(endIso, { zone: ZONE }) : null;
      const effectiveEnd = end?.isValid ? end : start;
      return start <= endOfDay && effectiveEnd >= startOfDay;
    });
  } else if (range === 'next7') {
    const startOfDay = now.startOf('day');
    const rangeEnd = now.plus({ days: 7 }).endOf('day');
    filtered = withStart.filter((item) => {
      const startIso = item.start ?? item.plannedWindow?.start;
      if (!startIso) return false;
      const start = DateTime.fromISO(startIso, { zone: ZONE });
      if (!start.isValid) return false;
      return start >= startOfDay && start <= rangeEnd;
    });
  }

  const sorted = [...filtered].sort((a, b) => {
    const startA = DateTime.fromISO(a.start ?? a.plannedWindow?.start ?? '', { zone: ZONE });
    const startB = DateTime.fromISO(b.start ?? b.plannedWindow?.start ?? '', { zone: ZONE });
    return startA.toMillis() - startB.toMillis();
  });

  return sorted;
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
