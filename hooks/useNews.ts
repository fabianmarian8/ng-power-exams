/**
 * Custom React Hook for News
 *
 * Provides real-time news aggregation from multiple sources
 */

import { useState, useEffect, useCallback } from 'react';
import { NewsItem } from '../types';
import { newsService, NewsFilter, NewsCategory } from '../services/newsService';

export interface UseNewsResult {
  news: NewsItem[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  search: (keyword: string) => Promise<NewsItem[]>;
}

export function useNews(filter?: NewsFilter): UseNewsResult {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchNews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await newsService.fetchNews(filter);
      setNews(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      console.error('Error fetching news:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const refresh = useCallback(async () => {
    newsService.clearCache();
    await fetchNews();
  }, [fetchNews]);

  const search = useCallback(async (keyword: string): Promise<NewsItem[]> => {
    try {
      return await newsService.searchNews(keyword, filter?.category);
    } catch (err) {
      console.error('Error searching news:', err);
      return [];
    }
  }, [filter?.category]);

  // Initial fetch
  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = newsService.subscribe((updatedNews) => {
      // Apply filters if needed
      let filtered = updatedNews;

      if (filter?.category && filter.category !== 'ALL') {
        filtered = filtered.filter(item => item.category === filter.category);
      }

      if (filter?.since) {
        filtered = filtered.filter(item => item.timestamp >= filter.since!);
      }

      if (filter?.limit) {
        filtered = filtered.slice(0, filter.limit);
      }

      setNews(filtered);
    });

    return unsubscribe;
  }, [filter]);

  return {
    news,
    loading,
    error,
    refresh,
    search,
  };
}

/**
 * Hook for fetching latest news (top headlines)
 */
export function useLatestNews(limit: number = 10) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLatest = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await newsService.fetchLatestNews(limit);
      setNews(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch latest news'));
      console.error('Error fetching latest news:', err);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchLatest();

    // Auto-refresh every 10 minutes
    const interval = setInterval(fetchLatest, 600000);

    return () => clearInterval(interval);
  }, [fetchLatest]);

  return {
    news,
    loading,
    error,
    refresh: fetchLatest,
  };
}

/**
 * Hook for news by category
 */
export function useNewsByCategory(category: NewsCategory) {
  return useNews({ category });
}

/**
 * Hook for searching news
 */
export function useNewsSearch() {
  const [results, setResults] = useState<NewsItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const search = useCallback(async (keyword: string, category?: NewsCategory) => {
    if (!keyword.trim()) {
      setResults([]);
      return;
    }

    try {
      setSearching(true);
      setError(null);

      const data = await newsService.searchNews(keyword, category);
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Search failed'));
      console.error('Error searching news:', err);
    } finally {
      setSearching(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    results,
    searching,
    error,
    search,
    clear,
  };
}
