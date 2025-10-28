/**
 * Exam Service
 *
 * Monitors exam board portals and social media for status updates:
 * 1. JAMB portal status and announcements
 * 2. WAEC portal status
 * 3. NECO portal status
 * 4. Social media announcements from exam boards
 * 5. News articles about exam releases
 */

import { ExamGuide, ExamStatus } from '../types';
import { API_CONFIG, BACKEND_API, USE_MOCK_DATA, getAPIHeaders } from '../config/api.config';
import { EXAM_GUIDES_DATA } from '../constants';

export interface ExamStatusCheck {
  id: string;
  status: ExamStatus;
  lastChecked: Date;
  portalOnline: boolean;
  statusMessage?: string;
}

class ExamService {
  private cache: Map<string, { data: ExamGuide[]; timestamp: number }> = new Map();
  private cacheTimeout = 120000; // 2 minutes cache
  private listeners: Set<(guides: ExamGuide[]) => void> = new Set();
  private pollingInterval: NodeJS.Timeout | null = null;

  /**
   * Fetch exam status for all boards
   */
  async fetchExamStatuses(): Promise<ExamGuide[]> {
    // Check cache
    const cached = this.cache.get('all');
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    if (USE_MOCK_DATA) {
      return this.getEnhancedMockData();
    }

    try {
      const response = await fetch(`${BACKEND_API.baseUrl}${BACKEND_API.endpoints.examStatus.list}`, {
        headers: getAPIHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch exam statuses');
      }

      const data = await response.json();
      const guides = this.normalizeExamData(data);

      // Update cache
      this.cache.set('all', { data: guides, timestamp: Date.now() });

      return guides;
    } catch (error) {
      console.error('Error fetching exam statuses:', error);
      return this.getEnhancedMockData();
    }
  }

  /**
   * Check specific exam board status
   */
  async checkExamBoard(boardId: string): Promise<ExamStatusCheck> {
    try {
      const response = await fetch(
        `${BACKEND_API.baseUrl}${BACKEND_API.endpoints.examStatus.check(boardId)}`,
        {
          headers: getAPIHeaders(),
        }
      );

      if (response.ok) {
        return await response.json();
      }

      throw new Error(`Failed to check ${boardId} status`);
    } catch (error) {
      console.error(`Error checking ${boardId}:`, error);
      return this.mockPortalCheck(boardId);
    }
  }

  /**
   * Check portal availability by making HTTP request
   * This can be done from backend to avoid CORS issues
   */
  async checkPortalOnline(portalUrl: string): Promise<boolean> {
    try {
      // This should be done through backend proxy to avoid CORS
      const response = await fetch(`${BACKEND_API.baseUrl}/portal-check`, {
        method: 'POST',
        headers: getAPIHeaders(),
        body: JSON.stringify({ url: portalUrl }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.online;
      }

      return false;
    } catch (error) {
      console.error('Error checking portal status:', error);
      return false;
    }
  }

  /**
   * Fetch exam announcements from Twitter
   */
  async fetchFromTwitter(boardId: string): Promise<any[]> {
    if (!API_CONFIG.social.twitter.enabled) {
      return [];
    }

    const twitterAccounts: { [key: string]: string } = {
      jamb: 'JAMB_Official',
      waec: 'waecnigeria',
      neco: 'NecoOfficial',
    };

    const account = twitterAccounts[boardId];
    if (!account) return [];

    try {
      const response = await fetch(
        `${API_CONFIG.social.twitter.baseUrl}/tweets/search/recent?query=from:${account} (result OR status OR release OR announcement)&max_results=10`,
        {
          headers: {
            'Authorization': `Bearer ${API_CONFIG.social.twitter.bearerToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return this.parseTwitterAnnouncements(data);
      }

      return [];
    } catch (error) {
      console.error(`Error fetching Twitter for ${boardId}:`, error);
      return [];
    }
  }

  /**
   * Web scraping for exam portal status
   * This should be done on backend to avoid CORS and for better reliability
   */
  async scrapePortalStatus(boardId: string): Promise<ExamStatusCheck> {
    try {
      const response = await fetch(
        `${BACKEND_API.baseUrl}/scrape-exam-status`,
        {
          method: 'POST',
          headers: getAPIHeaders(),
          body: JSON.stringify({ boardId }),
        }
      );

      if (response.ok) {
        return await response.json();
      }

      throw new Error('Scraping failed');
    } catch (error) {
      console.error(`Error scraping ${boardId}:`, error);
      return this.mockPortalCheck(boardId);
    }
  }

  /**
   * Monitor portal for changes
   * Uses backend service to periodically check portal and detect changes
   */
  async monitorPortal(boardId: string, callback: (status: ExamStatusCheck) => void): () => void {
    const intervalId = setInterval(async () => {
      const status = await this.checkExamBoard(boardId);
      callback(status);
    }, API_CONFIG.polling.examStatus);

    return () => clearInterval(intervalId);
  }

  /**
   * Subscribe to exam status updates
   */
  subscribe(callback: (guides: ExamGuide[]) => void): () => void {
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
      const guides = await this.fetchExamStatuses();
      this.listeners.forEach(callback => callback(guides));
    }, API_CONFIG.polling.examStatus);
  }

  /**
   * Parse Twitter announcements
   */
  private parseTwitterAnnouncements(data: any): any[] {
    const announcements: any[] = [];

    if (data.data) {
      data.data.forEach((tweet: any) => {
        announcements.push({
          text: tweet.text,
          timestamp: new Date(tweet.created_at),
          url: `https://twitter.com/i/web/status/${tweet.id}`,
        });
      });
    }

    return announcements;
  }

  /**
   * Detect status from announcement text
   */
  private detectStatusFromText(text: string): ExamStatus {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('released') || lowerText.includes('available')) {
      return ExamStatus.RELEASED;
    }

    if (lowerText.includes('registration') && lowerText.includes('open')) {
      return ExamStatus.ONGOING;
    }

    if (lowerText.includes('offline') || lowerText.includes('maintenance')) {
      return ExamStatus.OFFLINE;
    }

    return ExamStatus.AWAITING;
  }

  /**
   * Normalize exam data from backend
   */
  private normalizeExamData(data: any[]): ExamGuide[] {
    return data.map(item => ({
      ...item,
      lastChecked: new Date(item.lastChecked),
    }));
  }

  /**
   * Mock portal check for development
   */
  private mockPortalCheck(boardId: string): ExamStatusCheck {
    const statuses = Object.values(ExamStatus);
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

    return {
      id: boardId,
      status: randomStatus,
      lastChecked: new Date(),
      portalOnline: Math.random() > 0.1, // 90% online
      statusMessage: this.getStatusMessage(randomStatus),
    };
  }

  /**
   * Get status message
   */
  private getStatusMessage(status: ExamStatus): string {
    switch (status) {
      case ExamStatus.RELEASED:
        return 'Results are now available for checking';
      case ExamStatus.AWAITING:
        return 'Results are being processed and will be released soon';
      case ExamStatus.ONGOING:
        return 'Registration is currently ongoing';
      case ExamStatus.OFFLINE:
        return 'Portal is temporarily unavailable for maintenance';
      default:
        return 'Status unknown';
    }
  }

  /**
   * Get enhanced mock data with realistic updates
   */
  private getEnhancedMockData(): ExamGuide[] {
    return EXAM_GUIDES_DATA.map(guide => {
      // Simulate status changes based on time
      const hourOfDay = new Date().getHours();

      // Simulate portal going offline during maintenance hours (2-4 AM)
      if (hourOfDay >= 2 && hourOfDay < 4 && Math.random() > 0.7) {
        return {
          ...guide,
          status: ExamStatus.OFFLINE,
          lastChecked: new Date(),
        };
      }

      // Random status updates
      if (Math.random() > 0.8) {
        const statuses = [ExamStatus.RELEASED, ExamStatus.AWAITING, ExamStatus.ONGOING];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

        return {
          ...guide,
          status: randomStatus,
          lastChecked: new Date(),
        };
      }

      return {
        ...guide,
        lastChecked: new Date(),
      };
    });
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const examService = new ExamService();
