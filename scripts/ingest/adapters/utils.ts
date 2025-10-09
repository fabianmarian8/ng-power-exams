import crypto from 'node:crypto';
import { parseISO, isValid } from 'date-fns';
import type { LoadOptions } from 'cheerio';
import type { AdapterContext } from './types';
import type { OutageEvent } from '../../../src/lib/outages-types';

export async function fetchHtml(ctx: AdapterContext, url: string): Promise<string> {
  const response = await ctx.axios.get<string>(url, {
    responseType: 'text',
    headers: {
      'User-Agent': ctx.userAgent,
      Accept: 'text/html,application/xhtml+xml'
    },
    timeout: 20_000
  });
  return response.data;
}

export function load(html: string, cheerio: AdapterContext['cheerio'], options: LoadOptions = {}) {
  return cheerio.load(html, { decodeEntities: true, xmlMode: false, ...options });
}

export function toIso(input: string | undefined | null): string | undefined {
  if (!input) return undefined;
  const trimmed = input.trim();
  if (!trimmed) return undefined;

  const asDate = new Date(trimmed);
  if (!Number.isNaN(asDate.valueOf())) {
    return asDate.toISOString();
  }

  const parsed = parseISO(trimmed);
  if (isValid(parsed)) {
    return parsed.toISOString();
  }

  return undefined;
}

export function classifyEvent(title: string, body = ''): OutageEvent['category'] {
  const haystack = `${title} ${body}`.toLowerCase();
  if (/(restore|restored|restoration)/.test(haystack)) return 'restoration';
  if (/(planned|maintenance|upgrade|preventive)/.test(haystack)) return 'planned';
  if (/(fault|outage|blackout|trip|shutdown|interruption)/.test(haystack)) return 'unplanned';
  return 'advisory';
}

export function makeId(sourceUrl: string, title: string, publishedAt: string): string {
  const hash = crypto.createHash('sha256');
  hash.update(sourceUrl);
  hash.update(title);
  hash.update(publishedAt);
  return hash.digest('hex').slice(0, 32);
}

export function dedupeEvents(events: OutageEvent[]): OutageEvent[] {
  const seen = new Set<string>();
  return events.filter((event) => {
    const key = `${event.source}:${event.title.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
