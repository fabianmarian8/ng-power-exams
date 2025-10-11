import type { CheerioOptions } from 'cheerio';
import fs from 'node:fs/promises';
import path from 'node:path';
import { DateTime } from 'luxon';
import type { AdapterContext } from './types';
import type { OutageItem, OutageStatus, VerificationSource } from '../../../src/lib/outages-types';
import { parsePlannedWindow, type PlanWindow } from '../lib/planWindow';
import { parseDateRange } from '../lib/dateRange';

const DEFAULT_TIMEZONE = 'Africa/Lagos';

const FIXTURES_ROOT = path.join(process.cwd(), 'scripts/ingest/fixtures');
const USE_FIXTURES = process.env.INGEST_FIXTURES_ONLY === '1';

const PLANNED_KEYWORDS = [
  'planned maintenance',
  'scheduled maintenance',
  'planned outage',
  'scheduled outage',
  'shutdown window',
  'feeder maintenance',
  'line maintenance',
  'transmission upgrade',
  'system rehabilitation',
  'transformer maintenance',
  'system maintenance'
];

const RESTORED_KEYWORDS = [
  'restored',
  'restoration complete',
  'supply restored',
  'power restored',
  'service resumed',
  'normal supply has resumed'
];

const UNPLANNED_KEYWORDS = [
  'fault',
  'unplanned outage',
  'blackout',
  'trip',
  'service interruption',
  'supply loss',
  'grid collapse',
  'feeder trip',
  'emergency maintenance',
  'load shedding'
];

async function readFixture(fixtureName: string): Promise<string> {
  const filePath = path.join(FIXTURES_ROOT, fixtureName);
  return fs.readFile(filePath, 'utf8');
}

export async function fetchHtml(
  ctx: AdapterContext,
  url: string,
  fixtureName?: string
): Promise<{ html: string; status: number; fromFixture: boolean }> {
  if (USE_FIXTURES) {
    if (!fixtureName) {
      throw new Error(`INGEST_FIXTURES_ONLY=1 requires fixture for ${url}`);
    }
    const html = await readFixture(fixtureName);
    return { html, status: 200, fromFixture: true };
  }

  const response = await ctx.axios.get<string>(url, {
    responseType: 'text',
    headers: {
      'User-Agent': ctx.userAgent,
      Accept: 'text/html,application/xhtml+xml'
    },
    timeout: 10_000
  });

  return { html: response.data, status: response.status, fromFixture: false };
}

export function load(html: string, cheerio: AdapterContext['cheerio'], options: CheerioOptions = {}) {
  return cheerio.load(html, { xmlMode: false, ...options });
}

export function sanitizeText(input: string | undefined | null): string {
  return (input ?? '').replace(/\s+/g, ' ').replace(/\u00a0/g, ' ').trim();
}

export function inferStatus(title: string, body = '', plannedWindow?: PlanWindow | undefined): OutageStatus {
  const haystack = `${title} ${body}`.toLowerCase();
  if (RESTORED_KEYWORDS.some((keyword) => haystack.includes(keyword))) {
    return 'RESTORED';
  }
  if (PLANNED_KEYWORDS.some((keyword) => haystack.includes(keyword))) {
    return 'PLANNED';
  }
  if (UNPLANNED_KEYWORDS.some((keyword) => haystack.includes(keyword))) {
    return 'UNPLANNED';
  }
  if (plannedWindow?.start || plannedWindow?.end) {
    return 'PLANNED';
  }
  return 'UNPLANNED';
}

export function resolveVerification(source?: string): VerificationSource | undefined {
  if (!source) return undefined;
  const normalized = source.toLowerCase();
  if (normalized.includes('tcn')) return 'TCN';
  if (normalized.includes('disco') || normalized.includes('distribution')) return 'DISCO';
  if (normalized.includes('media')) return 'MEDIA';
  if (normalized.includes('community')) return 'COMMUNITY';
  return 'UNKNOWN';
}

export function buildOutageItem(partial: Omit<OutageItem, 'id' | 'status' | 'publishedAt'> & {
  publishedAt?: string;
  status?: OutageStatus;
  fixtureName?: string;
}): OutageItem {
  const plannedWindow = partial.plannedWindow;
  const status = partial.status ?? inferStatus(partial.title, partial.summary ?? '', plannedWindow);
  const publishedAt = partial.publishedAt ?? new Date().toISOString();
  const confidence = (() => {
    if (partial.confidence) return partial.confidence;
    if (partial.verifiedBy === 'TCN') return 1;
    if (partial.verifiedBy === 'DISCO') return 0.9;
    if (partial.verifiedBy === 'MEDIA') return 0.6;
    return 0.5;
  })();

  const windowRange = plannedWindow ?? undefined;
  const range = windowRange
    ? {
        start: windowRange.start,
        end: windowRange.end
      }
    : undefined;

  return {
    ...partial,
    status,
    plannedWindow,
    publishedAt,
    confidence,
    start: range?.start,
    end: range?.end
  } as OutageItem;
}

export function resolvePlannedWindow(
  text: string,
  publishedAt?: string
): PlanWindow | undefined {
  const parsedRange = parseDateRange(text, DEFAULT_TIMEZONE);
  const fallback = parsePlannedWindow(text, publishedAt);
  const candidateStart = parsedRange.start ?? fallback?.start;
  const candidateEnd = parsedRange.end ?? fallback?.end;

  if (!candidateStart) {
    return undefined;
  }

  const now = DateTime.now().setZone(DEFAULT_TIMEZONE);
  const start = DateTime.fromISO(candidateStart, { zone: DEFAULT_TIMEZONE });
  const end = candidateEnd ? DateTime.fromISO(candidateEnd, { zone: DEFAULT_TIMEZONE }) : null;

  const hasFuture = (start.isValid && start >= now.startOf('day')) || (end?.isValid && end >= now.startOf('day'));

  if (!hasFuture) {
    return undefined;
  }

  return {
    start: start.isValid ? start.toISO() ?? candidateStart : candidateStart,
    end: end?.isValid ? end.toISO() ?? undefined : undefined,
    timezone: DEFAULT_TIMEZONE
  };
}
