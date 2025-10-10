import type { AdapterContext, AdapterNewsItem } from './types';

function stripHtml(input: string, cheerio: AdapterContext['cheerio']): string {
  const $ = cheerio.load(`<div>${input}</div>`);
  return $.root().text().replace(/\s+/g, ' ').trim();
}

function normaliseUrl(base: string, url: string): string {
  try {
    return new URL(url, base).toString();
  } catch (error) {
    return url;
  }
}

function parseDate(raw: string): string | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const hasTime = /\d{1,2}:\d{2}/.test(trimmed);
  const isoWithTimeZoneMatch = trimmed.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
  if (!hasTime && !isoWithTimeZoneMatch) {
    const dateOnlyMatch = trimmed.match(/\d{4}-\d{2}-\d{2}/);
    if (dateOnlyMatch) {
      return `${dateOnlyMatch[0]}T09:00:00+01:00`;
    }
  }
  const parsed = Date.parse(trimmed);
  if (!Number.isNaN(parsed)) {
    return new Date(parsed).toISOString();
  }
  return undefined;
}

interface RssAdapterConfig {
  url: string;
  domain: AdapterNewsItem['domain'];
  tier: AdapterNewsItem['tier'];
  source: string;
  keywords?: RegExp;
  limit?: number;
}

export function createRssAdapter(config: RssAdapterConfig) {
  return async (ctx: AdapterContext): Promise<AdapterNewsItem[]> => {
    try {
      const response = await ctx.axios.get(config.url, {
        headers: {
          'User-Agent': ctx.userAgent,
          Accept: 'application/rss+xml, application/xml;q=0.9, */*;q=0.8'
        },
        timeout: 15_000
      });
      const xml = response.data as string;
      const $ = ctx.cheerio.load(xml, { xmlMode: true });
      const items: AdapterNewsItem[] = [];
      $('item').each((_, element) => {
        if (config.limit && items.length >= config.limit) {
          return false;
        }
        const node = $(element);
        const title = node.find('title').first().text().trim();
        const link = node.find('link').first().text().trim() || node.find('guid').first().text().trim();
        const pubDate =
          node.find('pubDate').first().text().trim() ||
          node.find('dc\\:date').first().text().trim() ||
          node.find('updated').first().text().trim();
        const descriptionNode =
          node.find('description').first().text() || node.find('content\\:encoded').first().text() || '';
        const summary = descriptionNode ? stripHtml(descriptionNode, ctx.cheerio) : undefined;
        if (!title || !link) {
          return;
        }
        if (config.keywords && !(config.keywords.test(title) || (summary && config.keywords.test(summary)))) {
          return;
        }
        const publishedAt = pubDate ? parseDate(pubDate) : undefined;
        items.push({
          domain: config.domain,
          tier: config.tier,
          source: config.source,
          title,
          summary,
          officialUrl: normaliseUrl(config.url, link),
          publishedAt: publishedAt ?? new Date().toISOString()
        });
      });
      return items;
    } catch (error) {
      console.error(`RSS adapter failed for ${config.source} (${config.url})`, error);
      return [];
    }
  };
}

export function selectTopItems(items: AdapterNewsItem[], limit: number): AdapterNewsItem[] {
  return items
    .sort((a, b) => new Date(b.publishedAt).valueOf() - new Date(a.publishedAt).valueOf())
    .slice(0, limit);
}
