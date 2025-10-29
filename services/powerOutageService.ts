/**
 * Power Outage Service
 *
 * Aggregates power outage data from multiple sources:
 * 1. Official DisCo APIs and websites
 * 2. Twitter/X accounts of DisCos
 * 3. Telegram channels
 * 4. TCN (Transmission Company of Nigeria)
 * 5. User reports (community-sourced, unverified)
 */

import { PowerOutage, OutageType, SourceType } from '../types';
import { API_CONFIG, BACKEND_API, USE_MOCK_DATA, getAPIHeaders } from '../config/api.config';
import { POWER_OUTAGES_DATA } from '../constants';
import { ikejaElectricScraper } from './scrapers/ikejaElectricScraper';
import { ibedcScraper } from './scrapers/ibedcScraper';
import { telegramService } from './integrations/telegramService';

export interface OutageFilter {
  disCoId?: string;
  state?: string;
  type?: OutageType;
  sourceType?: SourceType;
}

export interface OutageUpdate {
  id: string;
  type?: OutageType;
  estimatedRestoreTime?: Date;
  restoredTime?: Date;
}

class PowerOutageService {
  private cache: Map<string, { data: PowerOutage[]; timestamp: number }> = new Map();
  private cacheTimeout = 60000; // 1 minute cache
  private listeners: Set<(outages: PowerOutage[]) => void> = new Set();
  private pollingInterval: NodeJS.Timeout | null = null;

  /**
   * Fetch power outages from all available sources
   */
  async fetchPowerOutages(): Promise<PowerOutage[]> {
    // Check cache first
    const cached = this.cache.get('all');
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      // Aggregate outages from multiple sources in parallel
      const [
        backendOutages,
        ikejaOutages,
        ibedcOutages,
        telegramOutages,
      ] = await Promise.allSettled([
        this.fetchFromBackend(),
        this.fetchFromIkeja(),
        this.fetchFromIBEDC(),
        this.fetchFromTelegram(),
      ]);

      // Combine all results
      const allOutages: PowerOutage[] = [];

      if (backendOutages.status === 'fulfilled') {
        allOutages.push(...backendOutages.value);
      }
      if (ikejaOutages.status === 'fulfilled') {
        allOutages.push(...ikejaOutages.value);
      }
      if (ibedcOutages.status === 'fulfilled') {
        allOutages.push(...ibedcOutages.value);
      }
      if (telegramOutages.status === 'fulfilled') {
        allOutages.push(...telegramOutages.value);
      }

      // Remove duplicates and sort by start time
      const uniqueOutages = this.removeDuplicates(allOutages);
      uniqueOutages.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

      // Update cache
      this.cache.set('all', { data: uniqueOutages, timestamp: Date.now() });

      console.log(`Aggregated ${uniqueOutages.length} outages from ${this.countSources(allOutages)} sources`);

      return uniqueOutages;
    } catch (error) {
      console.error('⚠️ Error fetching power outages:', error);
      console.log('⚠️ Returning empty array - no mock data fallback');
      return [];
    }
  }

  /**
   * Fetch outages from backend API
   */
  private async fetchFromBackend(): Promise<PowerOutage[]> {
    try {
      const response = await fetch(`${BACKEND_API.baseUrl}${BACKEND_API.endpoints.powerOutages.list}`, {
        headers: getAPIHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch from backend');
      }

      const data = await response.json();
      return this.normalizeOutageData(data);
    } catch (error) {
      console.error('Backend fetch failed:', error);
      return [];
    }
  }

  /**
   * Fetch outages from Ikeja Electric scraper
   */
  private async fetchFromIkeja(): Promise<PowerOutage[]> {
    try {
      console.log('Scraping Ikeja Electric fault log...');
      const outages = await ikejaElectricScraper.scrapeFaultLog();
      console.log(`Scraped ${outages.length} outages from Ikeja Electric`);
      return outages;
    } catch (error) {
      console.error('Ikeja Electric scraping failed:', error);
      return [];
    }
  }

  /**
   * Fetch outages from IBEDC scraper
   */
  private async fetchFromIBEDC(): Promise<PowerOutage[]> {
    try {
      console.log('Scraping IBEDC outage information...');
      const outages = await ibedcScraper.scrapeOutages();
      console.log(`Scraped ${outages.length} outages from IBEDC`);
      return outages;
    } catch (error) {
      console.error('IBEDC scraping failed:', error);
      return [];
    }
  }

  /**
   * Fetch power outages from Twitter/X
   * Monitors DisCo Twitter accounts for outage announcements
   */
  async fetchFromTwitter(): Promise<PowerOutage[]> {
    if (!API_CONFIG.social.twitter.enabled) {
      return [];
    }

    try {
      const outages: PowerOutage[] = [];

      for (const account of API_CONFIG.social.twitter.accounts) {
        const response = await fetch(
          `${API_CONFIG.social.twitter.baseUrl}/tweets/search/recent?query=from:${account} (outage OR maintenance OR fault OR "no power")&max_results=10`,
          {
            headers: {
              'Authorization': `Bearer ${API_CONFIG.social.twitter.bearerToken}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const parsedOutages = this.parseTwitterData(data, account);
          outages.push(...parsedOutages);
        }
      }

      return outages;
    } catch (error) {
      console.error('Error fetching from Twitter:', error);
      return [];
    }
  }

  /**
   * Fetch power outages from Telegram channels
   */
  async fetchFromTelegram(): Promise<PowerOutage[]> {
    if (!API_CONFIG.social.telegram.enabled) {
      return [];
    }

    try {
      console.log('Monitoring Telegram DisCo bots...');

      // Check if Telegram service is initialized
      if (!telegramService.isInitialized()) {
        const botToken = API_CONFIG.social.telegram.botToken;
        if (botToken) {
          telegramService.initialize(botToken);
        } else {
          console.warn('Telegram bot token not configured');
          return [];
        }
      }

      // Monitor DisCo bots for outage information
      const outages = await telegramService.monitorDisCoBots();
      console.log(`Retrieved ${outages.length} outages from Telegram bots`);

      return outages;
    } catch (error) {
      console.error('Error fetching from Telegram:', error);
      return [];
    }
  }

  /**
   * Fetch power outages from official DisCo APIs
   */
  async fetchFromDisCo(disCoId: string): Promise<PowerOutage[]> {
    const disCoConfig = API_CONFIG.official.discos[disCoId as keyof typeof API_CONFIG.official.discos];

    if (!disCoConfig || !disCoConfig.enabled) {
      return [];
    }

    try {
      const response = await fetch(`${disCoConfig.baseUrl}/outages`, {
        headers: getAPIHeaders(disCoConfig.apiKey),
      });

      if (response.ok) {
        const data = await response.json();
        return this.normalizeDisCoData(data, disCoId);
      }

      return [];
    } catch (error) {
      console.error(`Error fetching from DisCo ${disCoId}:`, error);
      return [];
    }
  }

  /**
   * Fetch grid status from TCN
   */
  async fetchGridStatus(): Promise<PowerOutage[]> {
    if (!API_CONFIG.official.tcn.enabled) {
      return [];
    }

    try {
      const response = await fetch(`${API_CONFIG.official.tcn.baseUrl}/grid-status`, {
        headers: getAPIHeaders(API_CONFIG.official.tcn.apiKey),
      });

      if (response.ok) {
        const data = await response.json();
        return this.parseGridStatus(data);
      }

      return [];
    } catch (error) {
      console.error('Error fetching grid status:', error);
      return [];
    }
  }

  /**
   * Submit user report (community-sourced outage information)
   */
  async submitUserReport(outage: Omit<PowerOutage, 'id' | 'sourceType'>): Promise<PowerOutage> {
    try {
      const response = await fetch(`${BACKEND_API.baseUrl}${BACKEND_API.endpoints.powerOutages.create}`, {
        method: 'POST',
        headers: getAPIHeaders(),
        body: JSON.stringify({
          ...outage,
          sourceType: SourceType.Unofficial,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Clear cache to force refresh
        this.cache.clear();
        // Notify listeners
        this.notifyListeners();
        return data;
      }

      throw new Error('Failed to submit user report');
    } catch (error) {
      console.error('Error submitting user report:', error);
      throw error;
    }
  }

  /**
   * Update outage status (e.g., mark as restored)
   */
  async updateOutage(update: OutageUpdate): Promise<PowerOutage> {
    try {
      const response = await fetch(
        `${BACKEND_API.baseUrl}${BACKEND_API.endpoints.powerOutages.update(update.id)}`,
        {
          method: 'PATCH',
          headers: getAPIHeaders(),
          body: JSON.stringify(update),
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Clear cache
        this.cache.clear();
        // Notify listeners
        this.notifyListeners();
        return data;
      }

      throw new Error('Failed to update outage');
    } catch (error) {
      console.error('Error updating outage:', error);
      throw error;
    }
  }

  /**
   * Filter outages based on criteria
   */
  filterOutages(outages: PowerOutage[], filter: OutageFilter): PowerOutage[] {
    return outages.filter(outage => {
      if (filter.disCoId && outage.disCoId !== filter.disCoId) return false;
      if (filter.type && outage.type !== filter.type) return false;
      if (filter.sourceType && outage.sourceType !== filter.sourceType) return false;
      // State filtering would require DisCo lookup
      return true;
    });
  }

  /**
   * Subscribe to real-time updates
   */
  subscribe(callback: (outages: PowerOutage[]) => void): () => void {
    this.listeners.add(callback);

    // Start polling if not already started
    if (!this.pollingInterval) {
      this.startPolling();
    }

    // Return unsubscribe function
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
      await this.fetchPowerOutages();
      this.notifyListeners();
    }, API_CONFIG.polling.powerOutages);
  }

  /**
   * Notify all listeners of data updates
   */
  private async notifyListeners(): Promise<void> {
    const outages = await this.fetchPowerOutages();
    this.listeners.forEach(callback => callback(outages));
  }

  /**
   * Parse Twitter data into PowerOutage format
   */
  private parseTwitterData(data: any, account: string): PowerOutage[] {
    // This is a simplified parser
    // In production, use NLP/AI to extract outage information from tweets
    const outages: PowerOutage[] = [];

    if (data.data) {
      data.data.forEach((tweet: any) => {
        // Extract outage information from tweet text
        // This is a placeholder - implement proper parsing logic
        const text = tweet.text.toLowerCase();

        if (text.includes('outage') || text.includes('fault') || text.includes('maintenance')) {
          outages.push({
            id: `twitter-${tweet.id}`,
            disCoId: this.mapTwitterAccountToDisCo(account),
            affectedArea: 'Area mentioned in tweet', // Extract from tweet
            type: text.includes('maintenance') ? OutageType.Planned : OutageType.Unplanned,
            reason: tweet.text,
            startTime: new Date(tweet.created_at),
            source: `Twitter @${account}`,
            sourceType: SourceType.Official,
          });
        }
      });
    }

    return outages;
  }

  /**
   * Parse Telegram data
   */
  private parseTelegramData(data: any): PowerOutage[] {
    // Similar to Twitter parsing
    // Implement Telegram-specific parsing logic
    return [];
  }

  /**
   * Normalize DisCo API data
   */
  private normalizeDisCoData(data: any, disCoId: string): PowerOutage[] {
    // Each DisCo may have different API response format
    // Normalize to common PowerOutage interface
    return data.map((item: any) => ({
      id: item.id || `${disCoId}-${Date.now()}`,
      disCoId,
      affectedArea: item.area || item.feeder || item.location,
      type: this.normalizeOutageType(item.type || item.status),
      reason: item.reason || item.description,
      startTime: new Date(item.startTime || item.start_time),
      estimatedRestoreTime: item.estimatedRestoreTime ? new Date(item.estimatedRestoreTime) : undefined,
      restoredTime: item.restoredTime ? new Date(item.restoredTime) : undefined,
      source: `${disCoId.toUpperCase()} Official API`,
      sourceType: SourceType.Official,
    }));
  }

  /**
   * Parse grid status from TCN
   */
  private parseGridStatus(data: any): PowerOutage[] {
    if (data.status === 'collapsed' || data.status === 'partial_collapse') {
      return [{
        id: `grid-${Date.now()}`,
        disCoId: 'grid',
        affectedArea: 'Nationwide',
        type: OutageType.Grid,
        reason: data.reason || 'National Grid issue',
        startTime: new Date(data.timestamp),
        source: 'TCN Official',
        sourceType: SourceType.Official,
      }];
    }
    return [];
  }

  /**
   * Normalize outage data from backend
   */
  private normalizeOutageData(data: any[]): PowerOutage[] {
    return data.map(item => ({
      ...item,
      startTime: new Date(item.startTime),
      estimatedRestoreTime: item.estimatedRestoreTime ? new Date(item.estimatedRestoreTime) : undefined,
      restoredTime: item.restoredTime ? new Date(item.restoredTime) : undefined,
    }));
  }

  /**
   * Get enhanced mock data with realistic variations
   */
  private getEnhancedMockData(): PowerOutage[] {
    const now = Date.now();

    // Create dynamic mock data based on current time
    const mockOutages = POWER_OUTAGES_DATA.map((outage, index) => {
      // Simulate some outages getting restored
      const hoursSinceStart = (now - outage.startTime.getTime()) / (1000 * 60 * 60);

      if (outage.type === OutageType.Unplanned && hoursSinceStart > 4 && Math.random() > 0.5) {
        return {
          ...outage,
          type: OutageType.Restored,
          restoredTime: new Date(now - Math.random() * 1000 * 60 * 30), // Restored in last 30 min
        };
      }

      return outage;
    });

    // Add some new random outages
    if (Math.random() > 0.7) {
      const discos = ['ikeja', 'aedc', 'phed', 'eedc', 'eko', 'ibedc'];
      const randomDisCo = discos[Math.floor(Math.random() * discos.length)];

      mockOutages.push({
        id: `outage-${now}`,
        disCoId: randomDisCo,
        affectedArea: 'New Random Area',
        type: Math.random() > 0.5 ? OutageType.Unplanned : OutageType.Planned,
        reason: 'Newly detected outage',
        startTime: new Date(now - Math.random() * 1000 * 60 * 60), // Within last hour
        source: 'Twitter @DisCo',
        sourceType: SourceType.Official,
      });
    }

    return mockOutages;
  }

  /**
   * Normalize outage type from various formats
   */
  private normalizeOutageType(type: string): OutageType {
    const normalized = type.toLowerCase();
    if (normalized.includes('plan') || normalized.includes('maintenance')) return OutageType.Planned;
    if (normalized.includes('restore') || normalized.includes('fixed')) return OutageType.Restored;
    if (normalized.includes('grid')) return OutageType.Grid;
    return OutageType.Unplanned;
  }

  /**
   * Map Twitter account to DisCo ID
   */
  private mapTwitterAccountToDisCo(account: string): string {
    const mapping: { [key: string]: string } = {
      'IkejaElectric': 'ikeja',
      'AEDCelectricity': 'aedc',
      'ekedp': 'eko',
      'Ibadandisco': 'ibedc',
      'EnuguDisco': 'eedc',
      'PHED_NG': 'phed',
      'kedcomanager': 'kedco',
      'KadunaElectric': 'kaduna',
      'JosElectricity': 'jos',
      'Yoladisco': 'yola',
      'BedcElectricity': 'bedc',
    };

    return mapping[account] || 'unknown';
  }

  /**
   * Remove duplicate outages based on similarity
   */
  private removeDuplicates(outages: PowerOutage[]): PowerOutage[] {
    const seen = new Map<string, PowerOutage>();

    for (const outage of outages) {
      // Create a unique key based on location and time
      const key = this.createOutageKey(outage);

      // Keep the first occurrence or the one with more details
      if (!seen.has(key)) {
        seen.set(key, outage);
      } else {
        const existing = seen.get(key)!;
        // Prefer official sources
        if (outage.sourceType === SourceType.Official && existing.sourceType !== SourceType.Official) {
          seen.set(key, outage);
        }
        // Prefer entries with more information
        else if (outage.reason.length > existing.reason.length) {
          seen.set(key, outage);
        }
      }
    }

    return Array.from(seen.values());
  }

  /**
   * Create a unique key for outage deduplication
   */
  private createOutageKey(outage: PowerOutage): string {
    const area = outage.affectedArea.toLowerCase().replace(/[^\w]/g, '');
    const disco = outage.disCoId.toLowerCase();
    const date = outage.startTime.toDateString();
    return `${disco}-${area}-${date}`;
  }

  /**
   * Count number of different sources
   */
  private countSources(outages: PowerOutage[]): number {
    const sources = new Set(outages.map(o => o.source));
    return sources.size;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const powerOutageService = new PowerOutageService();
