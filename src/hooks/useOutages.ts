import { useQuery } from '@tanstack/react-query';
import { OUTAGES_FALLBACK } from '@/data/outages-fallback';
import type { OutagesPayload, OutageItem } from '@/lib/outages-types';
import { nowLagos, toLagos } from '@/shared/luxon';

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
  const getStartIso = (item: OutageItem) => item.start ?? item.plannedWindow?.start;
  const getEndIso = (item: OutageItem) => item.end ?? item.plannedWindow?.end;

  const withStart = items.filter((item) => item.status === 'PLANNED' && Boolean(getStartIso(item)));
  const withoutStart = items.filter((item) => item.status === 'PLANNED' && !getStartIso(item));

  const now = nowLagos();
  const startOfToday = now.startOf('day');
  const endOfToday = now.endOf('day');
  const endOfWeek = now.plus({ days: 7 }).endOf('day');

  let list = withStart;

  if (range === 'today') {
    list = withStart.filter((item) => {
      const startIso = getStartIso(item);
      if (!startIso) return false;
      const start = toLagos(startIso);
      if (!start || !start.isValid) return false;
      const endIso = getEndIso(item);
      const end = endIso ? toLagos(endIso) : null;
      const effectiveEnd = end && end.isValid ? end : start;
      return start <= endOfToday && effectiveEnd >= startOfToday;
    });
  } else if (range === 'next7') {
    list = withStart.filter((item) => {
      const startIso = getStartIso(item);
      if (!startIso) return false;
      const start = toLagos(startIso);
      if (!start || !start.isValid) return false;
      return start >= startOfToday && start <= endOfWeek;
    });
  }

  list.sort((a, b) => {
    const startA = toLagos(getStartIso(a) ?? '');
    const startB = toLagos(getStartIso(b) ?? '');
    const millisA = startA && startA.isValid ? startA.toMillis() : Number.POSITIVE_INFINITY;
    const millisB = startB && startB.isValid ? startB.toMillis() : Number.POSITIVE_INFINITY;
    return millisA - millisB;
  });

  return range === 'all' ? [...list, ...withoutStart] : list;
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
