import * as cheerio from 'cheerio';
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { NEWS_ADAPTERS } from './news/adapters/index.js';
import type { AdapterContext, AdapterNewsItem, RegisteredAdapter } from './news/adapters/types';
import type { NewsItem, NewsPayload } from '../../src/shared/types';

const LAGOS_TIMEZONE = 'Africa/Lagos';

function normalizeSpaces(input: string | undefined | null): string | undefined {
  if (!input) return undefined;
  const normalized = input.replace(/\s+/g, ' ').trim();
  return normalized.length ? normalized : undefined;
}

function ensureTitle(input: string): string {
  return normalizeSpaces(input) ?? '';
}

function ensureUrl(url: string): string {
  try {
    return new URL(url).toString();
  } catch {
    return url;
  }
}

function extractHost(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
}

function toLagosIso(date: Date): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: LAGOS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
  const year = parts.year ?? '1970';
  const month = parts.month ?? '01';
  const day = parts.day ?? '01';
  const hour = parts.hour ?? '00';
  const minute = parts.minute ?? '00';
  const second = parts.second ?? '00';
  return `${year}-${month}-${day}T${hour}:${minute}:${second}+01:00`;
}

function parsePublished(raw: string | undefined): Date | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;

  if (/([+-]\d{2}:\d{2}|Z)$/.test(trimmed)) {
    const zoned = new Date(trimmed);
    if (!Number.isNaN(zoned.valueOf())) {
      return zoned;
    }
  }

  const isoMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::\d{2})?$/);
  if (isoMatch) {
    const [, datePart, timePart] = isoMatch;
    return new Date(`${datePart}T${timePart}+01:00`);
  }

  const yyyyMmDd = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (yyyyMmDd) {
    const [, yearRaw, monthRaw, dayRaw] = yyyyMmDd;
    const year = Number.parseInt(yearRaw, 10);
    const month = Number.parseInt(monthRaw, 10) - 1;
    const day = Number.parseInt(dayRaw, 10);
    return new Date(Date.UTC(year, month, day, 8, 0));
  }

  const ddMmmMatch = trimmed.match(
    /(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})(?:[,\s]+(\d{1,2}:\d{2})(?:\s*(AM|PM))?)?/
  );
  if (ddMmmMatch) {
    const [, dayRaw, monthRaw, yearRaw, timeRaw, meridiemRaw] = ddMmmMatch;
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const day = Number.parseInt(dayRaw, 10);
    const month = monthNames.indexOf(monthRaw.slice(0, 3).toLowerCase());
    const year = Number.parseInt(yearRaw, 10);
    let hour = 9;
    let minute = 0;
    if (timeRaw) {
      const [hourRaw, minuteRaw] = timeRaw.split(':');
      hour = Number.parseInt(hourRaw, 10);
      minute = Number.parseInt(minuteRaw, 10);
      if (Number.isNaN(hour)) hour = 9;
      if (Number.isNaN(minute)) minute = 0;
      if (meridiemRaw) {
        const meridiem = meridiemRaw.toUpperCase();
        if (meridiem === 'PM' && hour < 12) hour += 12;
        if (meridiem === 'AM' && hour === 12) hour = 0;
      }
    }
    return new Date(Date.UTC(year, month === -1 ? 0 : month, day, hour - 1, minute));
  }

  const slashMatch = trimmed.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}:\d{2})(?:\s*(AM|PM))?)?/);
  if (slashMatch) {
    const [, dayRaw, monthRaw, yearRaw, timeRaw, meridiemRaw] = slashMatch;
    const day = Number.parseInt(dayRaw, 10);
    const month = Number.parseInt(monthRaw, 10) - 1;
    const year = Number.parseInt(yearRaw, 10);
    let hour = 9;
    let minute = 0;
    if (timeRaw) {
      const [hourRaw, minuteRaw] = timeRaw.split(':');
      hour = Number.parseInt(hourRaw, 10);
      minute = Number.parseInt(minuteRaw, 10);
      if (Number.isNaN(hour)) hour = 9;
      if (Number.isNaN(minute)) minute = 0;
      if (meridiemRaw) {
        const meridiem = meridiemRaw.toUpperCase();
        if (meridiem === 'PM' && hour < 12) hour += 12;
        if (meridiem === 'AM' && hour === 12) hour = 0;
      }
    }
    return new Date(Date.UTC(year, Number.isNaN(month) ? 0 : month, day, hour - 1, minute));
  }

  const parsed = Date.parse(trimmed);
  if (!Number.isNaN(parsed)) {
    return new Date(parsed);
  }

  return undefined;
}

function ensurePublishedAt(raw: string | undefined): string {
  const parsed = parsePublished(raw);
  if (parsed) {
    return toLagosIso(parsed);
  }
  return toLagosIso(new Date());
}

function makeId(item: AdapterNewsItem, publishedAt: string): string {
  const key = `${item.source}|${item.officialUrl}|${publishedAt}`;
  return createHash('sha1').update(key).digest('hex');
}

function normaliseNewsItem(item: AdapterNewsItem): NewsItem {
  const publishedAt = ensurePublishedAt(item.publishedAt);
  return {
    id: makeId(item, publishedAt),
    domain: item.domain,
    tier: item.tier,
    source: item.source,
    title: ensureTitle(item.title),
    summary: normalizeSpaces(item.summary ?? undefined),
    publishedAt,
    officialUrl: ensureUrl(item.officialUrl),
    tags: item.tags,
    _score: item._score
  };
}

function areSimilar(a: NewsItem, b: NewsItem): boolean {
  const normalizedTitleA = a.title.toLowerCase();
  const normalizedTitleB = b.title.toLowerCase();
  const timeDiff = Math.abs(new Date(a.publishedAt).valueOf() - new Date(b.publishedAt).valueOf());
  const sameTitle = normalizedTitleA === normalizedTitleB;
  if (!sameTitle) return false;
  if (timeDiff > 1000 * 60 * 60 * 24) return false;
  const hostA = extractHost(a.officialUrl);
  const hostB = extractHost(b.officialUrl);
  if (!hostA || !hostB) return false;
  return hostA === hostB || hostA.endsWith(hostB) || hostB.endsWith(hostA);
}

function dedupe(items: NewsItem[]): NewsItem[] {
  const ordered = [...items].sort((a, b) => {
    if (a.tier === b.tier) {
      return new Date(b.publishedAt).valueOf() - new Date(a.publishedAt).valueOf();
    }
    return a.tier === 'OFFICIAL' ? -1 : 1;
  });
  const result: NewsItem[] = [];
  for (const item of ordered) {
    let suppressed = false;
    for (let i = 0; i < result.length; i += 1) {
      const existing = result[i];
      if (!areSimilar(existing, item)) {
        continue;
      }
      if (existing.tier === 'OFFICIAL' && item.tier === 'MEDIA') {
        suppressed = true;
        break;
      }
      if (existing.tier === 'MEDIA' && item.tier === 'OFFICIAL') {
        existing._score = -1;
        result[i] = item;
        suppressed = true;
        break;
      }
    }
    if (!suppressed) {
      result.push(item);
    }
  }
  return result.filter((entry) => entry._score !== -1);
}

function sortItems(items: NewsItem[]): NewsItem[] {
  return [...items].sort((a, b) => new Date(b.publishedAt).valueOf() - new Date(a.publishedAt).valueOf());
}

function computeLatestOfficial(items: NewsItem[]): NewsPayload['latestOfficialByDomain'] {
  const accumulator: NewsPayload['latestOfficialByDomain'] = {};
  for (const item of items) {
    if (item.tier !== 'OFFICIAL') continue;
    const current = accumulator[item.domain];
    if (!current || new Date(item.publishedAt).valueOf() > new Date(current).valueOf()) {
      accumulator[item.domain] = item.publishedAt;
    }
  }
  return accumulator;
}

function createSummaryCounter() {
  return {
    EXAMS_official: 0,
    EXAMS_media: 0,
    POWER_official: 0,
    POWER_media: 0
  } satisfies Record<'EXAMS_official' | 'EXAMS_media' | 'POWER_official' | 'POWER_media', number>;
}

function updateSummary(summary: ReturnType<typeof createSummaryCounter>, item: NewsItem) {
  const key = `${item.domain}_${item.tier.toLowerCase()}` as const;
  if (key in summary) {
    summary[key] += 1;
  }
}

async function runAdapter(
  adapter: RegisteredAdapter,
  ctx: AdapterContext
): Promise<{ adapter: RegisteredAdapter; items: AdapterNewsItem[] }> {
  try {
    const items = await adapter.run(ctx);
    return { adapter, items };
  } catch (error) {
    console.error(`News adapter failed: ${adapter.name}`, error);
    return { adapter, items: [] };
  }
}

async function runWithLimit<T>(limit: number, tasks: Array<() => Promise<T>>): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const currentIndex = nextIndex;
      if (currentIndex >= tasks.length) {
        break;
      }
      nextIndex += 1;
      const task = tasks[currentIndex];
      results[currentIndex] = await task();
    }
  }

  const workerCount = Math.min(limit, tasks.length);
  const workers = Array.from({ length: workerCount }, () => worker());
  await Promise.all(workers);
  return results;
}

export interface NewsIngestResult {
  payload: NewsPayload;
  summary: ReturnType<typeof createSummaryCounter>;
  countsByAdapter: Record<string, number>;
}

export async function ingestNews(): Promise<NewsIngestResult> {
  const ctx: AdapterContext = {
    cheerio
  };

  const adapterResults = await runWithLimit(
    4,
    NEWS_ADAPTERS.map((adapter) => () => runAdapter(adapter, ctx))
  );

  const rawItems: AdapterNewsItem[] = [];
  const countsByAdapter: Record<string, number> = {};
  for (const { adapter, items } of adapterResults) {
    countsByAdapter[adapter.name] = items.length;
    rawItems.push(
      ...items.map((item) => ({
        ...item,
        source: item.source ?? adapter.source,
        domain: item.domain ?? adapter.domain,
        tier: item.tier ?? adapter.tier
      }))
    );
  }

  const normalised = rawItems.map(normaliseNewsItem);
  const deduped = dedupe(normalised);
  const sorted = sortItems(deduped);
  const summary = createSummaryCounter();
  for (const item of sorted) {
    updateSummary(summary, item);
  }

  const payload: NewsPayload = {
    generatedAt: new Date().toISOString(),
    items: sorted,
    latestOfficialByDomain: computeLatestOfficial(sorted)
  };

  await mkdir('public/live', { recursive: true });
  await writeFile('public/live/news.json', JSON.stringify(payload, null, 2));

  console.log('News summary:');
  console.log(`  EXAMS_OFFICIAL: ${summary.EXAMS_official}, EXAMS_MEDIA: ${summary.EXAMS_media}`);
  console.log(`  POWER_OFFICIAL: ${summary.POWER_official}, POWER_MEDIA: ${summary.POWER_media}`);
  console.log('latestOfficialByDomain:');
  console.log(`  EXAMS: ${payload.latestOfficialByDomain.EXAMS ?? 'N/A'}`);
  console.log(`  POWER: ${payload.latestOfficialByDomain.POWER ?? 'N/A'}`);
  console.log('News adapter counts:', countsByAdapter);
  console.log(`Generated ${payload.items.length} news items @ ${payload.generatedAt}`);

  return { payload, summary, countsByAdapter };
}

if (process.argv[1] && process.argv[1].includes('news.ts')) {
  ingestNews().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
