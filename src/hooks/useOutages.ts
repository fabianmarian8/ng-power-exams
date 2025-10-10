import { useQuery } from '@tanstack/react-query';
import { OUTAGES_FALLBACK } from '@/data/outages-fallback';
import type { OutagesPayload } from '@/lib/outages-types';

function cloneFallback(): OutagesPayload {
  return JSON.parse(JSON.stringify(OUTAGES_FALLBACK)) as OutagesPayload;
}

export function useOutages() {
  return useQuery<OutagesPayload>({
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
}
