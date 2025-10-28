/**
 * CORS Proxy Utility
 *
 * Provides multiple strategies for bypassing CORS restrictions when scraping websites
 *
 * Available proxy services:
 * 1. AllOrigins - https://allorigins.win (free, no rate limit mentioned)
 * 2. CORS Anywhere - https://cors-anywhere.herokuapp.com (requires request access)
 * 3. ThingProxy - https://thingproxy.freeboard.io (free, simple)
 * 4. Custom backend proxy (recommended for production)
 *
 * Note: Public CORS proxies should only be used for development/testing.
 * For production, implement your own backend proxy service.
 */

export enum ProxyService {
  AllOrigins = 'allorigins',
  ThingProxy = 'thingproxy',
  CorsAnywhere = 'corsanywhere',
  Custom = 'custom',
}

export interface ProxyConfig {
  service: ProxyService;
  customUrl?: string;
  timeout?: number;
  retries?: number;
}

class CorsProxyUtil {
  private readonly PROXY_URLS = {
    [ProxyService.AllOrigins]: 'https://api.allorigins.win/raw?url=',
    [ProxyService.ThingProxy]: 'https://thingproxy.freeboard.io/fetch/',
    [ProxyService.CorsAnywhere]: 'https://cors-anywhere.herokuapp.com/',
    [ProxyService.Custom]: '', // Will be set via config
  };

  private config: ProxyConfig = {
    service: ProxyService.AllOrigins,
    timeout: 30000, // 30 seconds
    retries: 2,
  };

  /**
   * Configure the proxy service
   */
  configure(config: Partial<ProxyConfig>): void {
    this.config = { ...this.config, ...config };

    if (config.service === ProxyService.Custom && !config.customUrl) {
      console.warn('Custom proxy service selected but customUrl not provided');
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): ProxyConfig {
    return { ...this.config };
  }

  /**
   * Fetch URL through proxy
   */
  async fetch(url: string, options?: RequestInit): Promise<Response> {
    const proxyUrl = this.buildProxyUrl(url);

    let lastError: Error | null = null;
    const maxRetries = this.config.retries || 0;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`Retry attempt ${attempt}/${maxRetries} for ${url}`);
          // Wait before retry (exponential backoff)
          await this.delay(Math.pow(2, attempt) * 1000);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(proxyUrl, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok && response.status >= 500) {
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }

        return response;
      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors (4xx)
        if (error instanceof Error && error.message.includes('4')) {
          throw error;
        }

        // Don't retry if it's the last attempt
        if (attempt === maxRetries) {
          break;
        }
      }
    }

    throw lastError || new Error('Failed to fetch through proxy');
  }

  /**
   * Fetch text content through proxy
   */
  async fetchText(url: string): Promise<string> {
    const response = await this.fetch(url);
    return await response.text();
  }

  /**
   * Fetch JSON through proxy
   */
  async fetchJSON<T = any>(url: string): Promise<T> {
    const response = await this.fetch(url);
    return await response.json();
  }

  /**
   * Try multiple proxy services until one succeeds
   */
  async fetchWithFallback(url: string, services?: ProxyService[]): Promise<Response> {
    const tryServices = services || [
      ProxyService.AllOrigins,
      ProxyService.ThingProxy,
    ];

    let lastError: Error | null = null;

    for (const service of tryServices) {
      try {
        console.log(`Trying proxy service: ${service}`);
        const originalService = this.config.service;
        this.config.service = service;

        const response = await this.fetch(url);

        // Restore original service
        this.config.service = originalService;

        return response;
      } catch (error) {
        console.error(`Failed with ${service}:`, error);
        lastError = error as Error;
      }
    }

    throw lastError || new Error('All proxy services failed');
  }

  /**
   * Check if a proxy service is available
   */
  async testProxy(service: ProxyService): Promise<boolean> {
    try {
      const originalService = this.config.service;
      this.config.service = service;

      // Test with a known working URL
      const testUrl = 'https://www.example.com';
      const response = await this.fetch(testUrl, {
        method: 'HEAD',
      });

      this.config.service = originalService;

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check availability of all proxy services
   */
  async testAllProxies(): Promise<{ [key in ProxyService]?: boolean }> {
    const services = [
      ProxyService.AllOrigins,
      ProxyService.ThingProxy,
      ProxyService.CorsAnywhere,
    ];

    const results: { [key in ProxyService]?: boolean } = {};

    await Promise.all(
      services.map(async (service) => {
        results[service] = await this.testProxy(service);
      })
    );

    return results;
  }

  /**
   * Build proxy URL based on configured service
   */
  private buildProxyUrl(targetUrl: string): string {
    const { service, customUrl } = this.config;

    if (service === ProxyService.Custom) {
      if (!customUrl) {
        throw new Error('Custom proxy URL not configured');
      }
      return `${customUrl}${encodeURIComponent(targetUrl)}`;
    }

    const proxyBase = this.PROXY_URLS[service];
    if (!proxyBase) {
      throw new Error(`Unknown proxy service: ${service}`);
    }

    return `${proxyBase}${encodeURIComponent(targetUrl)}`;
  }

  /**
   * Delay helper for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get recommended proxy service based on use case
   */
  getRecommendedService(useCase: 'scraping' | 'rss' | 'api'): ProxyService {
    switch (useCase) {
      case 'scraping':
        // AllOrigins works well for HTML scraping
        return ProxyService.AllOrigins;
      case 'rss':
        // ThingProxy is good for RSS feeds
        return ProxyService.ThingProxy;
      case 'api':
        // Custom backend proxy recommended for API calls
        return ProxyService.Custom;
      default:
        return ProxyService.AllOrigins;
    }
  }

  /**
   * Check if direct fetch is possible (no CORS issue)
   */
  async canFetchDirectly(url: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Smart fetch - tries direct first, falls back to proxy
   */
  async smartFetch(url: string, options?: RequestInit): Promise<Response> {
    // Try direct fetch first
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        console.log('Direct fetch successful');
        return response;
      }
    } catch (error) {
      console.log('Direct fetch failed, trying proxy...');
    }

    // Fall back to proxy
    return this.fetch(url, options);
  }
}

// Export singleton instance
export const corsProxy = new CorsProxyUtil();

// Export helper functions for convenience
export const fetchThroughProxy = (url: string, options?: RequestInit) =>
  corsProxy.fetch(url, options);

export const fetchTextThroughProxy = (url: string) =>
  corsProxy.fetchText(url);

export const fetchJSONThroughProxy = <T = any>(url: string) =>
  corsProxy.fetchJSON<T>(url);
