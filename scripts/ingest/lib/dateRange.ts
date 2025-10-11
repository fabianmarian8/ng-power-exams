const DEFAULT_TZ = 'Africa/Lagos';

const TIME_PATTERN = /(\d{1,2})(?::(\d{2}))?\s*(am|pm|hrs|hr|hours)?/i;
const TIME_RANGE_TOKEN =
  '(?:\\d{1,2}:\\d{2}(?:\\s*(?:am|pm|hrs?|hr|hours))?|\\d{1,2}\\s*(?:am|pm|hrs?|hr|hours))';
const DATE_TOKEN = '(?:\\d{1,2}\\s+[A-Za-z]{3,9}\\s+\\d{2,4}|\\d{1,2}[\\/\\-]\\d{1,2}[\\/\\-]\\d{2,4})';

const MONTHS: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12
};

function sanitize(text: string): string {
  return text.replace(/[\t\r\n]+/g, ' ').replace(/\s+/g, ' ').replace(/[–—]/g, '-').trim();
}

interface DateComponents {
  year: number;
  month: number;
  day: number;
}

function parseDateToken(token: string): DateComponents | null {
  const slash = token.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (slash) {
    const [, day, month, year] = slash;
    return {
      day: Number.parseInt(day, 10),
      month: Number.parseInt(month, 10),
      year: normalizeYear(year)
    };
  }

  const word = token.match(/^(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{2,4})$/);
  if (word) {
    const [, day, monthName, year] = word;
    const month = MONTHS[monthName.toLowerCase().slice(0, 3)];
    if (!month) return null;
    return {
      day: Number.parseInt(day, 10),
      month,
      year: normalizeYear(year)
    };
  }

  return null;
}

function normalizeYear(year: string): number {
  if (year.length === 2) {
    return Number.parseInt(`20${year}`, 10);
  }
  return Number.parseInt(year, 10);
}

function parseTimeToken(token: string | undefined): { hours: number; minutes: number } | undefined {
  if (!token) return undefined;
  const match = token.match(TIME_PATTERN);
  if (!match) return undefined;
  const raw = match[0];
  const hasSuffix = Boolean(match[3]);
  const hasColon = raw.includes(':');
  if (!hasSuffix && !hasColon) {
    return undefined;
  }
  let hours = Number.parseInt(match[1] ?? '0', 10);
  const minutes = match[2] ? Number.parseInt(match[2], 10) : 0;
  const suffix = match[3]?.toLowerCase();
  if (suffix === 'pm' && hours < 12) {
    hours += 12;
  }
  if (suffix === 'am' && hours === 12) {
    hours = 0;
  }
  return { hours, minutes };
}

function applyTime(
  components: DateComponents | null,
  timeToken: string | undefined,
  tz: string,
  fallback: { hours: number; minutes: number }
): string | undefined {
  if (!components) return undefined;
  const time = parseTimeToken(timeToken) ?? fallback;
  const localMillis = Date.UTC(
    components.year,
    components.month - 1,
    components.day,
    time.hours,
    time.minutes,
    0,
    0
  );
  const offsetMinutes = getOffsetMinutes(tz);
  return new Date(localMillis - offsetMinutes * 60_000).toISOString();
}

function getOffsetMinutes(tz: string): number {
  if (tz === 'Africa/Lagos') {
    return 60;
  }
  return 0;
}

function extractDateMatches(text: string): Array<{ raw: string; index: number }> {
  const pattern = /\b(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{2,4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}-\d{2}-\d{2})\b/g;
  const matches: Array<{ raw: string; index: number }> = [];
  let match: RegExpExecArray | null = null;
  while ((match = pattern.exec(text)) !== null) {
    matches.push({ raw: match[1], index: match.index });
  }
  return matches;
}

function findTimeNear(text: string, start: number, end: number): string | undefined {
  const window = text.slice(Math.max(0, start - 40), Math.min(text.length, end + 40));
  const match = window.match(TIME_PATTERN);
  return match?.[0];
}

function extractTimeTokens(text: string): string[] {
  const pattern = /\b\d{1,2}(?::\d{2})?\s*(?:am|pm|hrs|hr|hours)?\b/gi;
  const tokens: string[] = [];
  let match: RegExpExecArray | null = null;
  while ((match = pattern.exec(text)) !== null) {
    const token = match[0];
    if (parseTimeToken(token)) {
      tokens.push(token);
    }
  }
  return tokens;
}

export interface DateRangeResult {
  start?: string;
  end?: string;
}

export function parseDateRange(text: string, tz: string = DEFAULT_TZ): DateRangeResult {
  const normalized = sanitize(text);
  if (!normalized) return {};

  const timeTokens = extractTimeTokens(normalized);
  const rangePattern = new RegExp(
    `(${DATE_TOKEN})(?:\\s*(?:at|from|by)?\\s*(${TIME_RANGE_TOKEN}))?\\s*(?:to|through|-|until)\\s*(${TIME_RANGE_TOKEN})?\\s*(?:on\\s+)?(${DATE_TOKEN})?`,
    'i'
  );
  const rangeMatch = normalized.match(rangePattern);

  if (rangeMatch) {
    const [, date1, time1, time2, date2] = rangeMatch;
    const startDate = parseDateToken(date1);
    const endDate = parseDateToken(date2 ?? date1);
    const fallbackEnd = endDate && (!time2 ? { hours: 9, minutes: 0 } : { hours: 17, minutes: 0 });
    const start = applyTime(startDate, time1, tz, { hours: 9, minutes: 0 });
    const end = applyTime(endDate, time2, tz, fallbackEnd ?? { hours: 17, minutes: 0 });
    return { start: start ?? undefined, end: end ?? undefined };
  }

  const matches = extractDateMatches(normalized);
  if (matches.length === 0) {
    return {};
  }

  const first = matches[0];
  const second = matches[1];

  const firstDate = parseDateToken(first.raw);
  const secondDate = second ? parseDateToken(second.raw) : null;

  let time1 = findTimeNear(normalized, first.index, first.index + first.raw.length);
  if (!time1 && timeTokens.length > 0) {
    time1 = timeTokens[0];
  }
  let time2 = second ? findTimeNear(normalized, second.index, second.index + second.raw.length) : undefined;
  if (!time2 && timeTokens.length > 1) {
    time2 = timeTokens[1];
  }

  const start = applyTime(firstDate, time1, tz, { hours: 9, minutes: 0 }) ?? undefined;
  const endCandidate = secondDate ?? firstDate;
  const hasExplicitEnd = Boolean(secondDate) || Boolean(time2);
  let end: string | undefined;
  if (hasExplicitEnd) {
    const fallbackEnd = secondDate && !time2 ? { hours: 9, minutes: 0 } : { hours: 17, minutes: 0 };
    end = applyTime(endCandidate, time2, tz, fallbackEnd) ?? undefined;
  }

  if (!start) {
    return {};
  }

  if (end && end < start) {
    return { start, end: undefined };
  }

  return { start, end: end ?? undefined };
}
