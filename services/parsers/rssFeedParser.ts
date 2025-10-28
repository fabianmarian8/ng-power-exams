/**
 * RSS Feed Parser for Nigerian News Sources
 *
 * Parses RSS feeds from major Nigerian news outlets
 *
 * According to research report, available RSS feeds:
 * - Punch: http://punchng.com/feed (all news)
 * - Premium Times: https://www.premiumtimesng.com/feed (all news)
 *                  https://www.premiumtimesng.com/category/education/feed (education)
 * - Guardian: https://guardian.ng/feed (all news)
 *             https://guardian.ng/category/energy/feed (energy)
 * - Vanguard: https://www.vanguardngr.com/feed/ (all news)
 * - Channels TV: https://www.channelstv.com/feed/ (all news)
 */

import { NewsItem } from '../../types';

export interface RSSFeed {
  url: string;
  source: string;
  category?: 'ENERGY' | 'EDUCATION' | 'ALL';
}

export interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: Date;
  author?: string;
  categories?: string[];
}

class RSSFeedParser {
  private readonly PROXY_URL = 'https://api.allorigins.win/raw?url=';

  // Nigerian news RSS feeds
  private readonly RSS_FEEDS: RSSFeed[] = [
    // General news feeds
    { url: 'http://punchng.com/feed', source: 'Punch Nigeria', category: 'ALL' },
    { url: 'https://www.premiumtimesng.com/feed', source: 'Premium Times', category: 'ALL' },
    { url: 'https://guardian.ng/feed', source: 'Guardian Nigeria', category: 'ALL' },
    { url: 'https://www.vanguardngr.com/feed/', source: 'Vanguard', category: 'ALL' },
    { url: 'https://www.channelstv.com/feed/', source: 'Channels TV', category: 'ALL' },

    // Category-specific feeds
    { url: 'https://www.premiumtimesng.com/category/education/feed', source: 'Premium Times', category: 'EDUCATION' },
    { url: 'https://guardian.ng/category/energy/feed', source: 'Guardian Nigeria', category: 'ENERGY' },
  ];

  /**
   * Fetch and parse all RSS feeds
   */
  async fetchAllFeeds(): Promise<NewsItem[]> {
    const allNews: NewsItem[] = [];

    // Fetch all feeds in parallel
    const feedPromises = this.RSS_FEEDS.map(feed => this.fetchFeed(feed));
    const results = await Promise.allSettled(feedPromises);

    results.forEach(result => {
      if (result.status === 'fulfilled') {
        allNews.push(...result.value);
      }
    });

    // Sort by date (newest first)
    allNews.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Remove duplicates based on title similarity
    return this.removeDuplicates(allNews);
  }

  /**
   * Fetch and parse a single RSS feed
   */
  async fetchFeed(feed: RSSFeed): Promise<NewsItem[]> {
    try {
      const response = await fetch(`${this.PROXY_URL}${encodeURIComponent(feed.url)}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const xml = await response.text();
      return this.parseRSS(xml, feed);
    } catch (error) {
      console.error(`Error fetching RSS feed from ${feed.source}:`, error);
      return [];
    }
  }

  /**
   * Fetch feeds by category
   */
  async fetchByCategory(category: 'ENERGY' | 'EDUCATION' | 'ALL'): Promise<NewsItem[]> {
    const relevantFeeds = category === 'ALL'
      ? this.RSS_FEEDS
      : this.RSS_FEEDS.filter(feed => feed.category === category || feed.category === 'ALL');

    const feedPromises = relevantFeeds.map(feed => this.fetchFeed(feed));
    const results = await Promise.allSettled(feedPromises);

    const allNews: NewsItem[] = [];
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        allNews.push(...result.value);
      }
    });

    // Filter by category if not ALL
    const filtered = category === 'ALL'
      ? allNews
      : allNews.filter(item => this.matchesCategory(item, category));

    // Sort and deduplicate
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return this.removeDuplicates(filtered);
  }

  /**
   * Parse RSS XML into NewsItem array
   */
  private parseRSS(xml: string, feed: RSSFeed): NewsItem[] {
    const newsItems: NewsItem[] = [];

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xml, 'text/xml');

      // Check for parsing errors
      const parserError = doc.querySelector('parsererror');
      if (parserError) {
        throw new Error('XML parsing error');
      }

      // RSS 2.0 format
      const items = doc.querySelectorAll('item');
      items.forEach((item, index) => {
        const rssItem = this.parseRSSItem(item);
        if (rssItem) {
          newsItems.push(this.convertToNewsItem(rssItem, feed, index));
        }
      });

      // Atom format (alternative)
      if (newsItems.length === 0) {
        const entries = doc.querySelectorAll('entry');
        entries.forEach((entry, index) => {
          const atomItem = this.parseAtomEntry(entry);
          if (atomItem) {
            newsItems.push(this.convertToNewsItem(atomItem, feed, index));
          }
        });
      }

      console.log(`Parsed ${newsItems.length} items from ${feed.source}`);
    } catch (error) {
      console.error(`Error parsing RSS from ${feed.source}:`, error);
    }

    return newsItems;
  }

  /**
   * Parse RSS 2.0 item element
   */
  private parseRSSItem(item: Element): RSSItem | null {
    try {
      const title = item.querySelector('title')?.textContent?.trim();
      const link = item.querySelector('link')?.textContent?.trim();
      const description = item.querySelector('description')?.textContent?.trim();
      const pubDate = item.querySelector('pubDate')?.textContent?.trim();
      const author = item.querySelector('author, creator, dc\\:creator')?.textContent?.trim();

      const categories: string[] = [];
      item.querySelectorAll('category').forEach(cat => {
        const catText = cat.textContent?.trim();
        if (catText) categories.push(catText);
      });

      if (!title || !link) return null;

      return {
        title,
        link,
        description: description || '',
        pubDate: this.parseDate(pubDate) || new Date(),
        author,
        categories,
      };
    } catch (error) {
      console.error('Error parsing RSS item:', error);
      return null;
    }
  }

  /**
   * Parse Atom entry element
   */
  private parseAtomEntry(entry: Element): RSSItem | null {
    try {
      const title = entry.querySelector('title')?.textContent?.trim();
      const linkEl = entry.querySelector('link[rel="alternate"], link');
      const link = linkEl?.getAttribute('href') || linkEl?.textContent?.trim();
      const summary = entry.querySelector('summary, content')?.textContent?.trim();
      const published = entry.querySelector('published, updated')?.textContent?.trim();
      const author = entry.querySelector('author name')?.textContent?.trim();

      const categories: string[] = [];
      entry.querySelectorAll('category').forEach(cat => {
        const term = cat.getAttribute('term');
        if (term) categories.push(term);
      });

      if (!title || !link) return null;

      return {
        title,
        link,
        description: summary || '',
        pubDate: this.parseDate(published) || new Date(),
        author,
        categories,
      };
    } catch (error) {
      console.error('Error parsing Atom entry:', error);
      return null;
    }
  }

  /**
   * Convert RSSItem to NewsItem
   */
  private convertToNewsItem(rssItem: RSSItem, feed: RSSFeed, index: number): NewsItem {
    // Detect category from content
    const detectedCategory = this.detectCategory(
      rssItem.title + ' ' + rssItem.description,
      rssItem.categories
    );

    // Generate a numeric ID from the link hash
    const id = this.generateNumericId(rssItem.link);

    return {
      id,
      category: detectedCategory,
      title: this.cleanHTML(rssItem.title),
      summary: this.cleanHTML(rssItem.description).substring(0, 300),
      timestamp: rssItem.pubDate,
      source: feed.source,
      url: rssItem.link,
      metadata: {
        author: rssItem.author,
        categories: rssItem.categories,
      },
    };
  }

  /**
   * Generate numeric ID from string
   */
  private generateNumericId(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Detect category from content and tags
   */
  private detectCategory(text: string, categories?: string[]): 'ENERGY' | 'EDUCATION' {
    const lowerText = text.toLowerCase();
    const catText = categories?.join(' ').toLowerCase() || '';

    const energyKeywords = [
      'power', 'electricity', 'outage', 'disco', 'nerc', 'tcn', 'grid',
      'energy', 'generator', 'transformer', 'feeder', 'blackout', 'ekedc',
      'ikeja electric', 'phed', 'ibedc', 'aedc', 'kedco'
    ];

    const educationKeywords = [
      'jamb', 'waec', 'neco', 'exam', 'result', 'admission', 'student',
      'university', 'education', 'school', 'utme', 'post-utme', 'matriculation'
    ];

    const energyScore = energyKeywords.reduce(
      (score, keyword) => score + (lowerText.includes(keyword) || catText.includes(keyword) ? 1 : 0),
      0
    );

    const educationScore = educationKeywords.reduce(
      (score, keyword) => score + (lowerText.includes(keyword) || catText.includes(keyword) ? 1 : 0),
      0
    );

    return energyScore > educationScore ? 'ENERGY' : 'EDUCATION';
  }

  /**
   * Check if news item matches category
   */
  private matchesCategory(item: NewsItem, category: 'ENERGY' | 'EDUCATION'): boolean {
    if (item.category === category) return true;

    // Double-check by re-analyzing content
    const text = item.title + ' ' + item.summary;
    const detectedCategory = this.detectCategory(text, item.metadata?.categories);
    return detectedCategory === category;
  }

  /**
   * Parse date string
   */
  private parseDate(dateStr?: string): Date | null {
    if (!dateStr) return null;

    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) return date;
    } catch (error) {
      console.error('Error parsing date:', error);
    }

    return null;
  }

  /**
   * Clean HTML tags from text
   */
  private cleanHTML(html: string): string {
    if (!html) return '';

    // Remove HTML tags
    let text = html.replace(/<[^>]*>/g, '');

    // Decode HTML entities
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    text = textarea.value;

    return text.trim();
  }

  /**
   * Remove duplicate news items
   */
  private removeDuplicates(items: NewsItem[]): NewsItem[] {
    const seen = new Set<string>();
    const unique: NewsItem[] = [];

    for (const item of items) {
      // Create a normalized key for comparison
      const key = this.normalizeForComparison(item.title);

      if (!seen.has(key)) {
        seen.add(key);
        unique.push(item);
      }
    }

    return unique;
  }

  /**
   * Normalize text for comparison
   */
  private normalizeForComparison(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .substring(0, 100); // Compare first 100 chars
  }

  /**
   * Get list of available feeds
   */
  getAvailableFeeds(): RSSFeed[] {
    return [...this.RSS_FEEDS];
  }

  /**
   * Test feed availability
   */
  async testFeed(feedUrl: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.PROXY_URL}${encodeURIComponent(feedUrl)}`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const rssFeedParser = new RSSFeedParser();
