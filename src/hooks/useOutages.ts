import { useQuery } from '@tanstack/react-query';
import type { OutagesPayload } from '@/lib/outages-types';

export function useOutages() {
  return useQuery<OutagesPayload>({
    queryKey: ['outages'],
    queryFn: async () => {
      const response = await fetch('/live/outages.json', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Failed to fetch outages');
      }
      return response.json();
    },
    refetchOnWindowFocus: true,
    staleTime: 30_000
  });
}
