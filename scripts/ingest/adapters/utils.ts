import type { CheerioOptions } from 'cheerio';
import { DateTime } from 'luxon';
import type { AdapterContext } from './types';
import type { OutageItem, OutageStatus, VerificationSource } from '../../../src/lib/outages-types';
import { parsePlannedWindow, type PlanWindow } from '../lib/planWindow';

const DEFAULT_TIMEZONE = 'Africa/Lagos';

const PLANNED_KEYWORDS = [
  'planned',
  'maintenance',
  'upgrade',
  'scheduled',
  'shutdown',
  'outage window',
  'downtime',
  'feeder maintenance',
  'system upgrade',
  'rehabilitation'
];

const RESTORED_KEYWORDS = ['restored', 'restoration complete', 'supply restored'];

const UNPLANNED_KEYWORDS = ['fault', 'outage', 'blackout', 'trip', 'interruption', 'loss of supply'];

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

export function load(html: string, cheerio: AdapterContext['cheerio'], options: CheerioOptions = {}) {
  return cheerio.load(html, { xmlMode: false, ...options });
}

export function classifyStatus(title: string, body = ''): OutageStatus {
  const haystack = `${title} ${body}`.toLowerCase();
  if (PLANNED_KEYWORDS.some((keyword) => haystack.includes(keyword))) {
    return 'PLANNED';
  }
  if (RESTORED_KEYWORDS.some((keyword) => haystack.includes(keyword))) {
    return 'RESTORED';
  }
  if (UNPLANNED_KEYWORDS.some((keyword) => haystack.includes(keyword))) {
    return 'UNPLANNED';
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
}): OutageItem {
  const status = partial.status ?? classifyStatus(partial.title, partial.summary ?? '');
  const publishedAt = partial.publishedAt ?? new Date().toISOString();
  const plannedWindow = partial.plannedWindow;

  return {
    ...partial,
    status,
    plannedWindow,
    publishedAt
  } as OutageItem;
}

export function resolvePlannedWindow(
  text: string,
  publishedAt?: string
): PlanWindow | undefined {
  const parsed = parsePlannedWindow(text, publishedAt);
  if (!parsed?.start) {
    return undefined;
  }

  const now = DateTime.now().setZone(DEFAULT_TIMEZONE);
  const start = DateTime.fromISO(parsed.start, { zone: DEFAULT_TIMEZONE });
  const end = parsed.end ? DateTime.fromISO(parsed.end, { zone: DEFAULT_TIMEZONE }) : null;

  const hasFuture = (start.isValid && start >= now) || (end?.isValid && end >= now);

  if (!hasFuture) {
    return undefined;
  }

  return {
    start: start.isValid ? start.toISO() ?? parsed.start : parsed.start,
    end: end?.isValid ? end.toISO() ?? undefined : undefined,
    timezone: parsed.timezone ?? DEFAULT_TIMEZONE
  };
}
