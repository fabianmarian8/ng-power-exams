import { useQuery } from '@tanstack/react-query';
import { NEWS_FALLBACK } from '@/data/news-fallback';
import type { NewsPayload, NewsItem } from '@/shared/types';

function cloneFallback(): NewsPayload {
  return JSON.parse(JSON.stringify(NEWS_FALLBACK)) as NewsPayload;
}

interface UseNewsResult {
  data: NewsPayload;
  items: NewsItem[];
  official: NewsItem[];
  media: NewsItem[];
  isLoading: boolean;
  error: unknown;
  isRefetching: boolean;
}

export function useNews(): UseNewsResult {
  const query = useQuery<NewsPayload>({
    queryKey: ['news'],
    queryFn: async () => {
      const queryString = `v=${Date.now()}`;
      let lastError: Error | undefined;
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const response = await fetch(`/live/news.json?${queryString}`, {
            cache: 'no-store'
          });
          if (!response.ok) {
            if (response.status === 404) {
              console.warn('News file not found, using fallback');
              return cloneFallback();
            }
            throw new Error(`Failed to fetch news (status ${response.status})`);
          }
          return (await response.json()) as NewsPayload;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error('Unknown news fetch error');
          if (attempt === 1) {
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      }
      console.warn('Falling back to bundled news payload', lastError);
      return cloneFallback();
    },
    refetchOnWindowFocus: true,
    refetchInterval: 60_000, // Obnoviť každú minútu
    staleTime: 30_000
  });

  const payload = query.data ?? cloneFallback();
  const items = payload.items?.filter((item) => item._score !== -1) ?? [];
  const official = items.filter((item) => item.tier === 'OFFICIAL');
  const media = items.filter((item) => item.tier === 'MEDIA');

  return {
    ...query,
    data: payload,
    items,
    official,
    media
  };
}
