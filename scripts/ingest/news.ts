import axios from 'axios';
import * as cheerio from 'cheerio';
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { NEWS_ADAPTERS } from './news/adapters/index.js';
import type { AdapterNewsItem, RegisteredAdapter } from './news/adapters/types';
import type { NewsItem, NewsPayload } from '../../src/shared/types';

const USER_AGENT = 'NaijaInfo-NewsIngest/1.0 (+https://ng-power-exams.local)';
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
  } catch (error) {
    return url;
  }
}

function extractHost(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch (error) {
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

function ensurePublishedAt(raw: string | undefined): string {
  if (!raw) {
    return toLagosIso(new Date());
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return toLagosIso(new Date());
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return toLagosIso(new Date(`${trimmed}T09:00:00+01:00`));
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(trimmed)) {
    return toLagosIso(new Date(`${trimmed}+01:00`));
  }
  if (/([+-]\d{2}:\d{2}|Z)$/.test(trimmed)) {
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.valueOf())) {
      return toLagosIso(parsed);
    }
  }
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.valueOf())) {
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

type AdapterContext = {
  axios: typeof axios;
  cheerio: typeof cheerio;
  userAgent: string;
};

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
      try {
        results[currentIndex] = await task();
      } catch (error) {
        throw error;
      }
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
    axios,
    cheerio,
    userAgent: USER_AGENT
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

  console.log('News summary:', summary);
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
