/**
 * Social Media Service
 *
 * Unified service for social media integrations:
 * 1. Twitter/X API integration
 * 2. Telegram API integration
 * 3. Data parsing and normalization
 * 4. Real-time monitoring
 */

import { API_CONFIG } from '../config/api.config';

export interface SocialMediaPost {
  id: string;
  platform: 'twitter' | 'telegram';
  author: string;
  text: string;
  timestamp: Date;
  url?: string;
  verified: boolean;
}

export interface TwitterConfig {
  bearerToken: string;
  accounts: string[];
}

export interface TelegramConfig {
  botToken: string;
  channels: string[];
}

class SocialMediaService {
  private twitterCache: Map<string, { data: any[]; timestamp: number }> = new Map();
  private telegramCache: Map<string, { data: any[]; timestamp: number }> = new Map();
  private cacheTimeout = 60000; // 1 minute

  /**
   * Fetch tweets from specified accounts
   */
  async fetchTweets(accounts: string[], query?: string): Promise<SocialMediaPost[]> {
    if (!API_CONFIG.social.twitter.enabled) {
      console.warn('Twitter API is not enabled');
      return [];
    }

    const cacheKey = `${accounts.join(',')}-${query || 'all'}`;
    const cached = this.twitterCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return this.parseTwitterPosts(cached.data);
    }

    try {
      const posts: SocialMediaPost[] = [];

      for (const account of accounts) {
        const tweets = await this.fetchAccountTweets(account, query);
        posts.push(...tweets);
      }

      return posts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      console.error('Error fetching tweets:', error);
      return [];
    }
  }

  /**
   * Fetch tweets from a single account
   */
  async fetchAccountTweets(account: string, query?: string): Promise<SocialMediaPost[]> {
    try {
      // Build query string
      let searchQuery = `from:${account}`;
      if (query) {
        searchQuery += ` ${query}`;
      }

      const url = `${API_CONFIG.social.twitter.baseUrl}/tweets/search/recent?query=${encodeURIComponent(searchQuery)}&max_results=10&tweet.fields=created_at,author_id&expansions=author_id&user.fields=verified`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${API_CONFIG.social.twitter.bearerToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Twitter API error: ${response.status}`);
      }

      const data = await response.json();

      // Cache the response
      this.twitterCache.set(account, { data: data.data || [], timestamp: Date.now() });

      return this.parseTwitterPosts(data.data || [], data.includes?.users);
    } catch (error) {
      console.error(`Error fetching tweets from @${account}:`, error);
      return [];
    }
  }

  /**
   * Fetch user's timeline
   */
  async fetchUserTimeline(userId: string, maxResults: number = 10): Promise<SocialMediaPost[]> {
    if (!API_CONFIG.social.twitter.enabled) {
      return [];
    }

    try {
      const url = `${API_CONFIG.social.twitter.baseUrl}/users/${userId}/tweets?max_results=${maxResults}&tweet.fields=created_at&exclude=retweets,replies`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${API_CONFIG.social.twitter.bearerToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Twitter API error: ${response.status}`);
      }

      const data = await response.json();
      return this.parseTwitterPosts(data.data || []);
    } catch (error) {
      console.error('Error fetching user timeline:', error);
      return [];
    }
  }

  /**
   * Monitor Twitter accounts for new posts
   * Uses polling (for real-time, use Twitter Streaming API on backend)
   */
  monitorTwitterAccounts(
    accounts: string[],
    callback: (posts: SocialMediaPost[]) => void,
    interval: number = 120000
  ): () => void {
    const intervalId = setInterval(async () => {
      const posts = await this.fetchTweets(accounts);
      if (posts.length > 0) {
        callback(posts);
      }
    }, interval);

    return () => clearInterval(intervalId);
  }

  /**
   * Fetch messages from Telegram channels
   * Requires Telegram Bot API and channel access
   */
  async fetchTelegramMessages(channels: string[]): Promise<SocialMediaPost[]> {
    if (!API_CONFIG.social.telegram.enabled) {
      console.warn('Telegram API is not enabled');
      return [];
    }

    try {
      const posts: SocialMediaPost[] = [];

      for (const channel of channels) {
        const messages = await this.fetchChannelMessages(channel);
        posts.push(...messages);
      }

      return posts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      console.error('Error fetching Telegram messages:', error);
      return [];
    }
  }

  /**
   * Fetch messages from a single Telegram channel
   */
  async fetchChannelMessages(channel: string): Promise<SocialMediaPost[]> {
    try {
      // Telegram Bot API endpoint
      const url = `${API_CONFIG.social.telegram.baseUrl}/bot${API_CONFIG.social.telegram.botToken}/getUpdates`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Telegram API error: ${response.status}`);
      }

      const data = await response.json();

      // Cache the response
      this.telegramCache.set(channel, { data: data.result || [], timestamp: Date.now() });

      return this.parseTelegramPosts(data.result || [], channel);
    } catch (error) {
      console.error(`Error fetching Telegram messages from ${channel}:`, error);
      return [];
    }
  }

  /**
   * Monitor Telegram channels for new messages
   */
  monitorTelegramChannels(
    channels: string[],
    callback: (posts: SocialMediaPost[]) => void,
    interval: number = 120000
  ): () => void {
    const intervalId = setInterval(async () => {
      const posts = await this.fetchTelegramMessages(channels);
      if (posts.length > 0) {
        callback(posts);
      }
    }, interval);

    return () => clearInterval(intervalId);
  }

  /**
   * Parse Twitter data into SocialMediaPost format
   */
  private parseTwitterPosts(tweets: any[], users?: any[]): SocialMediaPost[] {
    if (!tweets || tweets.length === 0) return [];

    return tweets.map(tweet => {
      const user = users?.find(u => u.id === tweet.author_id);

      return {
        id: tweet.id,
        platform: 'twitter' as const,
        author: user?.username || 'Unknown',
        text: tweet.text,
        timestamp: new Date(tweet.created_at),
        url: `https://twitter.com/i/web/status/${tweet.id}`,
        verified: user?.verified || false,
      };
    });
  }

  /**
   * Parse Telegram data into SocialMediaPost format
   */
  private parseTelegramPosts(updates: any[], channel: string): SocialMediaPost[] {
    if (!updates || updates.length === 0) return [];

    return updates
      .filter(update => update.channel_post)
      .map(update => {
        const post = update.channel_post;

        return {
          id: post.message_id.toString(),
          platform: 'telegram' as const,
          author: channel,
          text: post.text || '',
          timestamp: new Date(post.date * 1000),
          verified: true, // Telegram channels are verified by default
        };
      });
  }

  /**
   * Search for keywords across social media
   */
  async searchAcrossPlatforms(keyword: string): Promise<SocialMediaPost[]> {
    const [twitterPosts, telegramPosts] = await Promise.all([
      this.searchTwitter(keyword),
      this.searchTelegram(keyword),
    ]);

    return [...twitterPosts, ...telegramPosts].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  /**
   * Search Twitter for keyword
   */
  async searchTwitter(keyword: string): Promise<SocialMediaPost[]> {
    if (!API_CONFIG.social.twitter.enabled) {
      return [];
    }

    try {
      const url = `${API_CONFIG.social.twitter.baseUrl}/tweets/search/recent?query=${encodeURIComponent(keyword)}&max_results=20&tweet.fields=created_at,author_id&expansions=author_id&user.fields=verified`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${API_CONFIG.social.twitter.bearerToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Twitter API error: ${response.status}`);
      }

      const data = await response.json();
      return this.parseTwitterPosts(data.data || [], data.includes?.users);
    } catch (error) {
      console.error('Error searching Twitter:', error);
      return [];
    }
  }

  /**
   * Search Telegram for keyword
   * Note: Telegram search is limited and requires proper setup
   */
  async searchTelegram(keyword: string): Promise<SocialMediaPost[]> {
    // Telegram doesn't have direct search API
    // This would require fetching all messages and filtering
    // Or using a third-party service

    const channels = API_CONFIG.social.telegram.channels;
    const posts = await this.fetchTelegramMessages(channels);

    return posts.filter(post =>
      post.text.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  /**
   * Filter posts by date range
   */
  filterByDateRange(posts: SocialMediaPost[], startDate: Date, endDate: Date): SocialMediaPost[] {
    return posts.filter(
      post => post.timestamp >= startDate && post.timestamp <= endDate
    );
  }

  /**
   * Filter posts by platform
   */
  filterByPlatform(posts: SocialMediaPost[], platform: 'twitter' | 'telegram'): SocialMediaPost[] {
    return posts.filter(post => post.platform === platform);
  }

  /**
   * Filter posts by verified accounts only
   */
  filterVerifiedOnly(posts: SocialMediaPost[]): SocialMediaPost[] {
    return posts.filter(post => post.verified);
  }

  /**
   * Get statistics about social media posts
   */
  getStatistics(posts: SocialMediaPost[]): {
    total: number;
    byPlatform: { twitter: number; telegram: number };
    verified: number;
    timeRange: { earliest: Date; latest: Date } | null;
  } {
    if (posts.length === 0) {
      return {
        total: 0,
        byPlatform: { twitter: 0, telegram: 0 },
        verified: 0,
        timeRange: null,
      };
    }

    const byPlatform = posts.reduce(
      (acc, post) => {
        acc[post.platform]++;
        return acc;
      },
      { twitter: 0, telegram: 0 }
    );

    const verified = posts.filter(p => p.verified).length;

    const timestamps = posts.map(p => p.timestamp.getTime());
    const earliest = new Date(Math.min(...timestamps));
    const latest = new Date(Math.max(...timestamps));

    return {
      total: posts.length,
      byPlatform,
      verified,
      timeRange: { earliest, latest },
    };
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.twitterCache.clear();
    this.telegramCache.clear();
  }
}

// Export singleton instance
export const socialMediaService = new SocialMediaService();
