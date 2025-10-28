/**
 * News Service
 *
 * Aggregates news from multiple sources:
 * 1. RSS feeds from Nigerian news websites
 * 2. Web scraping of news sites
 * 3. Social media (Twitter, Telegram)
 * 4. Official press releases from DisCos and exam boards
 */

import { NewsItem } from '../types';
import { API_CONFIG, BACKEND_API, USE_MOCK_DATA, getAPIHeaders } from '../config/api.config';
import { NEWS_DATA } from '../constants';

export type NewsCategory = 'ENERGY' | 'EDUCATION' | 'ALL';

export interface NewsFilter {
  category?: NewsCategory;
  limit?: number;
  since?: Date;
}

class NewsService {
  private cache: Map<string, { data: NewsItem[]; timestamp: number }> = new Map();
  private cacheTimeout = 180000; // 3 minutes cache
  private listeners: Set<(news: NewsItem[]) => void> = new Set();
  private pollingInterval: NodeJS.Timeout | null = null;

  /**
   * Fetch news from all sources
   */
  async fetchNews(filter: NewsFilter = {}): Promise<NewsItem[]> {
    const cacheKey = JSON.stringify(filter);
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    if (USE_MOCK_DATA) {
      return this.getEnhancedMockData(filter);
    }

    try {
      const params = new URLSearchParams();
      if (filter.category && filter.category !== 'ALL') {
        params.append('category', filter.category);
      }
      if (filter.limit) {
        params.append('limit', filter.limit.toString());
      }
      if (filter.since) {
        params.append('since', filter.since.toISOString());
      }

      const response = await fetch(
        `${BACKEND_API.baseUrl}${BACKEND_API.endpoints.news.list}?${params}`,
        {
          headers: getAPIHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }

      const data = await response.json();
      const news = this.normalizeNewsData(data);

      // Update cache
      this.cache.set(cacheKey, { data: news, timestamp: Date.now() });

      return news;
    } catch (error) {
      console.error('Error fetching news:', error);
      return this.getEnhancedMockData(filter);
    }
  }

  /**
   * Fetch latest news (top headlines)
   */
  async fetchLatestNews(limit: number = 10): Promise<NewsItem[]> {
    try {
      const response = await fetch(
        `${BACKEND_API.baseUrl}${BACKEND_API.endpoints.news.latest}?limit=${limit}`,
        {
          headers: getAPIHeaders(),
        }
      );

      if (response.ok) {
        const data = await response.json();
        return this.normalizeNewsData(data);
      }

      return this.getEnhancedMockData({ limit });
    } catch (error) {
      console.error('Error fetching latest news:', error);
      return this.getEnhancedMockData({ limit });
    }
  }

  /**
   * Fetch news from RSS feeds
   * This should be done on backend to parse RSS properly
   */
  async fetchFromRSS(): Promise<NewsItem[]> {
    try {
      const response = await fetch(`${BACKEND_API.baseUrl}/news/rss`, {
        headers: getAPIHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        return this.normalizeNewsData(data);
      }

      return [];
    } catch (error) {
      console.error('Error fetching RSS feeds:', error);
      return [];
    }
  }

  /**
   * Fetch news from Twitter
   * Monitor news accounts and relevant hashtags
   */
  async fetchFromTwitter(category?: NewsCategory): Promise<NewsItem[]> {
    if (!API_CONFIG.social.twitter.enabled) {
      return [];
    }

    try {
      const hashtags = this.getRelevantHashtags(category);
      const query = hashtags.join(' OR ');

      const response = await fetch(
        `${API_CONFIG.social.twitter.baseUrl}/tweets/search/recent?query=${encodeURIComponent(query)}&max_results=20`,
        {
          headers: {
            'Authorization': `Bearer ${API_CONFIG.social.twitter.bearerToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return this.parseTwitterNews(data, category);
      }

      return [];
    } catch (error) {
      console.error('Error fetching news from Twitter:', error);
      return [];
    }
  }

  /**
   * Scrape news websites
   * This must be done on backend
   */
  async scrapeNewsWebsites(): Promise<NewsItem[]> {
    try {
      const response = await fetch(`${BACKEND_API.baseUrl}/news/scrape`, {
        method: 'POST',
        headers: getAPIHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        return this.normalizeNewsData(data);
      }

      return [];
    } catch (error) {
      console.error('Error scraping news websites:', error);
      return [];
    }
  }

  /**
   * Search news by keyword
   */
  async searchNews(keyword: string, category?: NewsCategory): Promise<NewsItem[]> {
    try {
      const params = new URLSearchParams({ q: keyword });
      if (category && category !== 'ALL') {
        params.append('category', category);
      }

      const response = await fetch(
        `${BACKEND_API.baseUrl}/news/search?${params}`,
        {
          headers: getAPIHeaders(),
        }
      );

      if (response.ok) {
        const data = await response.json();
        return this.normalizeNewsData(data);
      }

      return [];
    } catch (error) {
      console.error('Error searching news:', error);
      return [];
    }
  }

  /**
   * Subscribe to real-time news updates
   */
  subscribe(callback: (news: NewsItem[]) => void): () => void {
    this.listeners.add(callback);

    if (!this.pollingInterval) {
      this.startPolling();
    }

    return () => {
      this.listeners.delete(callback);
      if (this.listeners.size === 0 && this.pollingInterval) {
        clearInterval(this.pollingInterval);
        this.pollingInterval = null;
      }
    };
  }

  /**
   * Start polling for updates
   */
  private startPolling(): void {
    this.pollingInterval = setInterval(async () => {
      const news = await this.fetchNews();
      this.listeners.forEach(callback => callback(news));
    }, API_CONFIG.polling.news);
  }

  /**
   * Get relevant hashtags for category
   */
  private getRelevantHashtags(category?: NewsCategory): string[] {
    if (!category || category === 'ALL') {
      return [
        '#NigeriaPower',
        '#PowerOutage',
        '#NERC',
        '#JAMB',
        '#WAEC',
        '#NECO',
        '#NigeriaEducation',
      ];
    }

    if (category === 'ENERGY') {
      return [
        '#NigeriaPower',
        '#PowerOutage',
        '#NERC',
        '#DisCo',
        '#TCN',
        '#Electricity',
      ];
    }

    if (category === 'EDUCATION') {
      return [
        '#JAMB',
        '#WAEC',
        '#NECO',
        '#NigeriaEducation',
        '#Exam',
        '#Results',
      ];
    }

    return [];
  }

  /**
   * Parse Twitter news
   */
  private parseTwitterNews(data: any, category?: NewsCategory): NewsItem[] {
    const news: NewsItem[] = [];

    if (data.data) {
      data.data.forEach((tweet: any, index: number) => {
        const detectedCategory = this.detectCategory(tweet.text);

        // Filter by category if specified
        if (category && category !== 'ALL' && detectedCategory !== category) {
          return;
        }

        news.push({
          id: parseInt(tweet.id.slice(-8), 16), // Convert to number
          category: detectedCategory,
          title: this.extractTitle(tweet.text),
          summary: tweet.text,
          timestamp: new Date(tweet.created_at),
        });
      });
    }

    return news;
  }

  /**
   * Detect category from text
   */
  private detectCategory(text: string): 'ENERGY' | 'EDUCATION' {
    const lowerText = text.toLowerCase();

    const energyKeywords = ['power', 'electricity', 'outage', 'disco', 'nerc', 'tcn', 'grid'];
    const educationKeywords = ['jamb', 'waec', 'neco', 'exam', 'result', 'admission', 'student'];

    const energyScore = energyKeywords.reduce(
      (score, keyword) => score + (lowerText.includes(keyword) ? 1 : 0),
      0
    );

    const educationScore = educationKeywords.reduce(
      (score, keyword) => score + (lowerText.includes(keyword) ? 1 : 0),
      0
    );

    return energyScore > educationScore ? 'ENERGY' : 'EDUCATION';
  }

  /**
   * Extract title from text (first sentence or first 80 chars)
   */
  private extractTitle(text: string): string {
    const firstSentence = text.split(/[.!?]/)[0];
    return firstSentence.length > 80
      ? firstSentence.substring(0, 77) + '...'
      : firstSentence;
  }

  /**
   * Normalize news data
   */
  private normalizeNewsData(data: any[]): NewsItem[] {
    return data.map(item => ({
      ...item,
      timestamp: new Date(item.timestamp),
    }));
  }

  /**
   * Get enhanced mock data with realistic updates
   */
  private getEnhancedMockData(filter: NewsFilter = {}): NewsItem[] {
    const now = Date.now();

    // Start with existing mock data
    let news = [...NEWS_DATA];

    // Add some dynamic news items
    const dynamicNews: NewsItem[] = [
      {
        id: now + 1,
        category: 'ENERGY',
        title: 'Real-time Update: Power Restoration in Progress',
        summary: 'Distribution companies report steady progress in restoring power to affected areas across multiple states.',
        timestamp: new Date(now - 1000 * 60 * 15), // 15 minutes ago
      },
      {
        id: now + 2,
        category: 'EDUCATION',
        title: 'JAMB Portal Experiencing High Traffic',
        summary: 'Candidates are advised to check their results during off-peak hours as the portal experiences high traffic volume.',
        timestamp: new Date(now - 1000 * 60 * 45), // 45 minutes ago
      },
      {
        id: now + 3,
        category: 'ENERGY',
        title: 'NERC Reviews Electricity Tariff Framework',
        summary: 'The regulatory commission has announced a comprehensive review of the current electricity tariff structure.',
        timestamp: new Date(now - 1000 * 60 * 60 * 3), // 3 hours ago
      },
      {
        id: now + 4,
        category: 'EDUCATION',
        title: 'WAEC Extends Registration Deadline',
        summary: 'The West African Examinations Council has announced a two-week extension for the ongoing registration period.',
        timestamp: new Date(now - 1000 * 60 * 60 * 6), // 6 hours ago
      },
      {
        id: now + 5,
        category: 'ENERGY',
        title: 'New Solar Energy Initiative Launched',
        summary: 'Federal government in partnership with private sector launches initiative to boost renewable energy adoption.',
        timestamp: new Date(now - 1000 * 60 * 60 * 12), // 12 hours ago
      },
    ];

    news = [...dynamicNews, ...news];

    // Apply filters
    if (filter.category && filter.category !== 'ALL') {
      news = news.filter(item => item.category === filter.category);
    }

    if (filter.since) {
      news = news.filter(item => item.timestamp >= filter.since!);
    }

    // Sort by timestamp (newest first)
    news.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply limit
    if (filter.limit) {
      news = news.slice(0, filter.limit);
    }

    return news;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const newsService = new NewsService();
