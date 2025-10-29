import { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';

interface DataSourceStatus {
  name: string;
  type: 'scraping' | 'rss' | 'api';
  status: 'online' | 'offline' | 'not-configured';
  lastCheck?: Date;
  itemsCount?: number;
  error?: string;
}

/**
 * Development-only component to display real-time status of all data sources
 * Shows which sources are working, failing, or not configured
 */
export function DataSourcesDebug() {
  const [sources, setSources] = useState<DataSourceStatus[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development
    if (import.meta.env.PROD) return;

    checkAllSources();
    const interval = setInterval(checkAllSources, 30000); // Check every 30s

    return () => clearInterval(interval);
  }, []);

  const checkAllSources = async () => {
    const results: DataSourceStatus[] = [];

    // Check Ikeja Electric scraper
    try {
      const { ikejaElectricScraper } = await import('../services/scrapers/ikejaElectricScraper');
      const data = await ikejaElectricScraper.scrapeFaultLog();
      results.push({
        name: 'Ikeja Electric Scraper',
        type: 'scraping',
        status: data.length > 0 ? 'online' : 'offline',
        lastCheck: new Date(),
        itemsCount: data.length,
      });
    } catch (error) {
      results.push({
        name: 'Ikeja Electric Scraper',
        type: 'scraping',
        status: 'offline',
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Check IBEDC scraper
    try {
      const { ibedcScraper } = await import('../services/scrapers/ibedcScraper');
      const data = await ibedcScraper.scrapeOutages();
      results.push({
        name: 'IBEDC Scraper',
        type: 'scraping',
        status: data.length > 0 ? 'online' : 'offline',
        lastCheck: new Date(),
        itemsCount: data.length,
      });
    } catch (error) {
      results.push({
        name: 'IBEDC Scraper',
        type: 'scraping',
        status: 'offline',
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Check RSS feeds
    try {
      const { rssFeedParser } = await import('../services/parsers/rssFeedParser');
      const data = await rssFeedParser.fetchByCategory('ALL');
      results.push({
        name: 'RSS Feeds (7 sources)',
        type: 'rss',
        status: data.length > 0 ? 'online' : 'offline',
        lastCheck: new Date(),
        itemsCount: data.length,
      });
    } catch (error) {
      results.push({
        name: 'RSS Feeds (7 sources)',
        type: 'rss',
        status: 'offline',
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Check Telegram API
    const telegramToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
    results.push({
      name: 'Telegram Bot API',
      type: 'api',
      status: telegramToken ? 'online' : 'not-configured',
      lastCheck: new Date(),
    });

    // Check Twitter API
    const twitterToken = import.meta.env.VITE_TWITTER_BEARER_TOKEN;
    results.push({
      name: 'Twitter/X API',
      type: 'api',
      status: twitterToken ? 'online' : 'not-configured',
      lastCheck: new Date(),
    });

    // Check Backend API
    try {
      const response = await fetch('http://localhost:3000/api/health', { signal: AbortSignal.timeout(2000) });
      results.push({
        name: 'Backend API',
        type: 'api',
        status: response.ok ? 'online' : 'offline',
        lastCheck: new Date(),
      });
    } catch {
      results.push({
        name: 'Backend API',
        type: 'api',
        status: 'offline',
        lastCheck: new Date(),
        error: 'Not running on localhost:3000',
      });
    }

    setSources(results);
  };

  if (import.meta.env.PROD) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isVisible && (
        <button
          onClick={() => setIsVisible(true)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg hover:bg-primary/90 transition-colors"
        >
          📊 Data Sources
        </button>
      )}

      {isVisible && (
        <Card className="w-96 max-h-[600px] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Data Sources Status</h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3">
            {sources.map((source) => (
              <div
                key={source.name}
                className="border border-border rounded-lg p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{source.name}</span>
                  <Badge
                    variant={
                      source.status === 'online'
                        ? 'default'
                        : source.status === 'not-configured'
                        ? 'secondary'
                        : 'destructive'
                    }
                  >
                    {source.status}
                  </Badge>
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center justify-between">
                    <span>Type:</span>
                    <span className="font-mono">{source.type}</span>
                  </div>
                  {source.lastCheck && (
                    <div className="flex items-center justify-between">
                      <span>Last check:</span>
                      <span>{source.lastCheck.toLocaleTimeString()}</span>
                    </div>
                  )}
                  {source.itemsCount !== undefined && (
                    <div className="flex items-center justify-between">
                      <span>Items fetched:</span>
                      <span className="font-semibold text-foreground">
                        {source.itemsCount}
                      </span>
                    </div>
                  )}
                  {source.error && (
                    <div className="text-destructive mt-2">
                      Error: {source.error}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <button
              onClick={checkAllSources}
              className="w-full bg-secondary text-secondary-foreground px-3 py-2 rounded-md text-sm hover:bg-secondary/80 transition-colors"
            >
              🔄 Refresh All
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
