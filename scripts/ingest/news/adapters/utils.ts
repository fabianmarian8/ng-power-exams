import type { AdapterContext, AdapterNewsItem } from './types';
import { fetchHtml, isOfflineMode } from '../../lib/fetchHtml';

export function sanitizeHtml(input: string, cheerio: AdapterContext['cheerio']): string {
  const $ = cheerio.load(input);
  $('script, style, noscript').remove();
  const allowed = $('article, time, h1, h2, a[href]');
  if (allowed.length > 0) {
    const pieces: string[] = [];
    allowed.each((index, element) => {
      void index;
      const node = $(element);
      if (node.is('time')) {
        const datetime = node.attr('datetime');
        if (datetime) {
          pieces.push(datetime);
        }
      }
      pieces.push(node.text());
    });
    const combined = pieces.join(' ');
    const normalized = combined.replace(/\s+/g, ' ').trim();
    if (normalized) {
      return normalized;
    }
  }
  const fallback = $.root().text().replace(/\s+/g, ' ').trim();
  return fallback;
}

function normaliseUrl(base: string, url: string): string {
  try {
    return new URL(url, base).toString();
  } catch {
    return url;
  }
}

function parseDdMmmYyyy(value: RegExpMatchArray): Date {
  const [, dayRaw, monthRaw, yearRaw, timeRaw, meridiemRaw] = value;
  const day = Number.parseInt(dayRaw, 10);
  const monthNames = [
    'jan',
    'feb',
    'mar',
    'apr',
    'may',
    'jun',
    'jul',
    'aug',
    'sep',
    'oct',
    'nov',
    'dec'
  ];
  const month = monthNames.indexOf(monthRaw.slice(0, 3).toLowerCase());
  const year = Number.parseInt(yearRaw, 10);
  let hour = 9;
  let minute = 0;
  if (timeRaw) {
    const [hRaw, mRaw] = timeRaw.split(':');
    hour = Number.parseInt(hRaw, 10);
    minute = Number.parseInt(mRaw, 10);
    if (Number.isNaN(hour)) hour = 9;
    if (Number.isNaN(minute)) minute = 0;
    if (meridiemRaw) {
      const meridiem = meridiemRaw.toUpperCase();
      if (meridiem === 'PM' && hour < 12) {
        hour += 12;
      }
      if (meridiem === 'AM' && hour === 12) {
        hour = 0;
      }
    }
  }
  return new Date(Date.UTC(year, month === -1 ? 0 : month, day, hour - 1, minute));
}

function parseDmyWithSlash(value: RegExpMatchArray): Date {
  const [, dayRaw, monthRaw, yearRaw, timeRaw, meridiemRaw] = value;
  const day = Number.parseInt(dayRaw, 10);
  const month = Number.parseInt(monthRaw, 10) - 1;
  const year = Number.parseInt(yearRaw, 10);
  let hour = 9;
  let minute = 0;
  if (timeRaw) {
    const [hRaw, mRaw] = timeRaw.split(':');
    hour = Number.parseInt(hRaw, 10);
    minute = Number.parseInt(mRaw, 10);
    if (Number.isNaN(hour)) hour = 9;
    if (Number.isNaN(minute)) minute = 0;
    if (meridiemRaw) {
      const meridiem = meridiemRaw.toUpperCase();
      if (meridiem === 'PM' && hour < 12) {
        hour += 12;
      }
      if (meridiem === 'AM' && hour === 12) {
        hour = 0;
      }
    }
  }
  return new Date(Date.UTC(year, Number.isNaN(month) ? 0 : month, day, hour - 1, minute));
}

export function parsePublishedDate(raw: string): Date | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;

  const isoMatch = trimmed.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(?:([+-]\d{2}:\d{2})|Z)?/);
  if (isoMatch) {
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.valueOf())) {
      return parsed;
    }
  }

  const ddMmmMatch = trimmed.match(
    /(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})(?:[,\s]+(\d{1,2}:\d{2})(?:\s*(AM|PM))?)?/
  );
  if (ddMmmMatch) {
    return parseDdMmmYyyy(ddMmmMatch);
  }

  const slashMatch = trimmed.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}:\d{2})(?:\s*(AM|PM))?)?/);
  if (slashMatch) {
    return parseDmyWithSlash(slashMatch);
  }

  const yyyyMmDdMatch = trimmed.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (yyyyMmDdMatch) {
    const [, yearRaw, monthRaw, dayRaw] = yyyyMmDdMatch;
    const year = Number.parseInt(yearRaw, 10);
    const month = Number.parseInt(monthRaw, 10) - 1;
    const day = Number.parseInt(dayRaw, 10);
    return new Date(Date.UTC(year, month, day, 8, 0));
  }

  const timestamp = Date.parse(trimmed);
  if (!Number.isNaN(timestamp)) {
    return new Date(timestamp);
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
  fixture?: string;
}


export function createRssAdapter(config: RssAdapterConfig) {
  return async (ctx: AdapterContext): Promise<AdapterNewsItem[]> => {
    try {
      const xml = await fetchHtml(config.url, config.fixture);
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
          node.find('dc\:date').first().text().trim() ||
          node.find('updated').first().text().trim();
        const descriptionNode =
          node.find('description').first().text() || node.find('content\:encoded').first().text() || '';
        const summary = descriptionNode ? sanitizeHtml(descriptionNode, ctx.cheerio) : undefined;
        if (!title || !link) {
          return;
        }
        if (config.keywords && !(config.keywords.test(title) || (summary && config.keywords.test(summary)))) {
          return;
        }
        const parsedDate = pubDate ? parsePublishedDate(pubDate) : undefined;
        items.push({
          domain: config.domain,
          tier: config.tier,
          source: config.source,
          title,
          summary,
          officialUrl: normaliseUrl(config.url, link),
          publishedAt: parsedDate ? parsedDate.toISOString() : new Date().toISOString()
        });
      });
      const mode = isOfflineMode ? 'offline' : 'online';
      console.log(
        `[news][${config.source}] mode=${mode} itemsFound=${items.length} firstTitles=${items
          .slice(0, 3)
          .map((item) => item.title)
          .join(' | ')}`
      );
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
