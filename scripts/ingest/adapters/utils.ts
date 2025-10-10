import type { CheerioOptions } from 'cheerio';
import { parse } from 'date-fns';
import type { AdapterContext } from './types';
import type { OutageItem, OutageStatus, VerificationSource } from '../../../src/lib/outages-types';

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

const DATE_PATTERNS = [
  "d MMMM yyyy HH:mm",
  "d MMM yyyy HH:mm",
  "d MMM yyyy",
  "d/M/yyyy HH:mm",
  "d/M/yyyy",
  "d-M-yyyy HH:mm",
  "d-M-yyyy",
  "MMMM d, yyyy HH:mm",
  "MMMM d, yyyy",
  "MMM d, yyyy HH:mm",
  "MMM d, yyyy"
];

const TIME_RANGE_REGEX = /\b(\d{1,2}(?::\d{2})?\s?(?:am|pm)?)\s*(?:-|to|–|—)\s*(\d{1,2}(?::\d{2})?\s?(?:am|pm)?)\b/i;
const DATE_REGEX =
  /(\d{1,2}\/[\d]{1,2}\/[\d]{2,4}|\d{1,2}-[\d]{1,2}-[\d]{2,4}|\d{1,2}\s+\w+\s+\d{4}|\w+\s+\d{1,2},\s*\d{4})/gi;

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

function tryParseDate(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const direct = Date.parse(`${trimmed}`);
  if (!Number.isNaN(direct)) {
    return new Date(direct).toISOString();
  }

  for (const pattern of DATE_PATTERNS) {
    try {
      const parsed = parse(trimmed, pattern, new Date());
      if (!Number.isNaN(parsed.valueOf())) {
        return parsed.toISOString();
      }
    } catch (error) {
      // ignore pattern failure
    }
  }

  return undefined;
}

function applyTimezone(iso: string | undefined): string | undefined {
  if (!iso) return undefined;
  return new Date(iso).toISOString();
}

export function extractPlannedWindow(text: string): OutageItem['plannedWindow'] | undefined {
  const haystack = text || '';
  const normalizedText = haystack.replace(/\s+/g, ' ');
  const timeRangeMatch = normalizedText.match(TIME_RANGE_REGEX);
  const dateMatches = [...normalizedText.matchAll(DATE_REGEX)].map((match) => match[0]);

  if (timeRangeMatch && dateMatches.length > 0) {
    const [_, rawStartTime, rawEndTime] = timeRangeMatch;
    const datePart = dateMatches[0];
    const start = tryParseDate(`${datePart} ${rawStartTime}`) ?? tryParseDate(datePart);
    const end = tryParseDate(`${datePart} ${rawEndTime}`) ?? tryParseDate(datePart);
    if (start || end) {
      return {
        start: applyTimezone(start),
        end: applyTimezone(end),
        timezone: DEFAULT_TIMEZONE
      };
    }
  }

  if (dateMatches.length >= 2) {
    const [first, second] = dateMatches;
    const start = tryParseDate(first);
    const end = tryParseDate(second);
    if (start || end) {
      return {
        start: applyTimezone(start),
        end: applyTimezone(end),
        timezone: DEFAULT_TIMEZONE
      };
    }
  }

  if (dateMatches.length === 1) {
    const only = dateMatches[0];
    const start = tryParseDate(only);
    if (start) {
      return {
        start: applyTimezone(start),
        timezone: DEFAULT_TIMEZONE
      };
    }
  }

  return undefined;
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
  const plannedWindow = status === 'PLANNED'
    ? partial.plannedWindow ?? extractPlannedWindow(`${partial.title} ${partial.summary ?? ''}`)
    : partial.plannedWindow;

  return {
    ...partial,
    status,
    plannedWindow,
    publishedAt
  } as OutageItem;
}
