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
  const planned = items.filter((item) => item.status === 'PLANNED');
  const withStart = planned.filter((item) => item.plannedWindow?.start);
  const withoutStart = planned.filter((item) => !item.plannedWindow?.start);

  let filtered = withStart;
  const now = DateTime.now().setZone(ZONE);

  if (range === 'today') {
    const startOfDay = now.startOf('day');
    const endOfDay = now.endOf('day');
    filtered = withStart.filter((item) => {
      const start = DateTime.fromISO(item.plannedWindow!.start!, { zone: ZONE });
      if (!start.isValid) return false;
      const end = item.plannedWindow?.end
        ? DateTime.fromISO(item.plannedWindow.end, { zone: ZONE })
        : null;
      const effectiveEnd = end?.isValid ? end : start;
      return start <= endOfDay && effectiveEnd >= startOfDay;
    });
  } else if (range === 'next7') {
    const startOfDay = now.startOf('day');
    const rangeEnd = now.plus({ days: 7 }).endOf('day');
    filtered = withStart.filter((item) => {
      const start = DateTime.fromISO(item.plannedWindow!.start!, { zone: ZONE });
      if (!start.isValid) return false;
      return start >= startOfDay && start <= rangeEnd;
    });
  }

  const sorted = [...filtered].sort((a, b) => {
    const startA = DateTime.fromISO(a.plannedWindow!.start!, { zone: ZONE });
    const startB = DateTime.fromISO(b.plannedWindow!.start!, { zone: ZONE });
    return startA.toMillis() - startB.toMillis();
  });

  return range === 'all' ? [...sorted, ...withoutStart] : sorted;
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
    staleTime: 30_000
  });

  const payload = query.data ?? cloneFallback();
  const all = payload.items ?? [];
  const planned = all.filter((item) => item.status === 'PLANNED');
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
