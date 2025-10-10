import { DateTime } from 'luxon';

const ZONE = 'Africa/Lagos';

export type PlanWindow = { start?: string; end?: string; timezone?: string };

export function parsePlannedWindow(raw: string, basePublishedISO?: string): PlanWindow | null {
  const text = (raw || '').replace(/\s+/g, ' ').trim();
  if (!text) return null;

  let m = text.match(
    /\b(\d{1,2})[\/\-\s](\w{3,}|\d{1,2})[\/\-\s](\d{2,4})(?:[, ]+)?(\d{1,2}:\d{2}\s?(?:am|pm)?)?\s*(?:-|to|–|—)\s*(?:(\d{1,2})[\/\-\s](\w{3,}|\d{1,2})[\/\-\s](\d{2,4}))?(?:[, ]+)?(\d{1,2}:\d{2}\s?(?:am|pm)?)?/i
  );
  if (m) {
    const [, d1, mo1, y1, t1, d2, mo2, y2, t2] = m;
    const startIso = parseDateTime(d1, mo1, y1, t1);
    const endIso = parseDateTime(d2 ?? d1, mo2 ?? mo1, y2 ?? y1, t2 ?? null);
    if (startIso) {
      return { start: startIso, end: endIso ?? undefined, timezone: ZONE };
    }
  }

  m = text.match(/\bfrom\s+(\d{1,2}(?::\d{2})?\s?(?:am|pm)?)\s+(?:to|-|–)\s+(\d{1,2}(?::\d{2})?\s?(?:am|pm)?)\s+on\s+(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/i);
  if (m) {
    const [, tStart, tEnd, dateStr] = m;
    const [d, mo, y] = dateStr.split(/[\/-]/);
    const startIso = parseDateTime(d, mo, y, tStart);
    const endIso = parseDateTime(d, mo, y, tEnd);
    if (startIso) {
      return { start: startIso, end: endIso ?? undefined, timezone: ZONE };
    }
  }

  m = text.match(/\b(\d{1,2})[\/\-\s](\w{3,}|\d{1,2})[\/\-\s](\d{2,4})\b/);
  if (m) {
    const [, d, mo, y] = m;
    const startIso = parseDateTime(d, mo, y, '09:00');
    const endIso = parseDateTime(d, mo, y, '17:00');
    if (startIso) {
      return { start: startIso, end: endIso ?? undefined, timezone: ZONE };
    }
  }

  m = text.match(/\b(\d{1,2}(?::\d{2})?\s?(?:am|pm)?)\s+(?:to|-|–)\s+(\d{1,2}(?::\d{2})?\s?(?:am|pm)?)\b/i);
  if (m && basePublishedISO) {
    const [, startTime, endTime] = m;
    const base = DateTime.fromISO(basePublishedISO, { zone: ZONE });
    if (base.isValid) {
      const startIso = parseTimeOnDate(base, startTime);
      const endIso = parseTimeOnDate(base, endTime);
      if (startIso) {
        return { start: startIso, end: endIso ?? undefined, timezone: ZONE };
      }
    }
  }

  return null;
}

function parseDateTime(day: string, month: string, year: string, time?: string | null): string | null {
  const resolvedYear = year.length === 2 ? `20${year}` : year;
  const monthNum = isNaN(Number(month)) ? monthFromWord(month) : Number(month);
  if (!monthNum) return null;

  let dt = DateTime.fromObject({ day: Number(day), month: monthNum, year: Number(resolvedYear) }, { zone: ZONE });
  if (!dt.isValid) return null;
  if (time) {
    dt = applyTime(dt, time);
  }
  return dt.isValid ? dt.toISO() : null;
}

function monthFromWord(word: string): number | null {
  const token = word.toLowerCase().slice(0, 3);
  const index = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].indexOf(token);
  return index >= 0 ? index + 1 : null;
}

function applyTime(dt: DateTime, time: string): DateTime {
  const normalized = time.toLowerCase().replace(/\s+/g, '');
  const match = normalized.match(/(\d{1,2})(?::(\d{2}))?(am|pm)?/);
  if (!match) {
    return dt.set({ hour: 9, minute: 0 });
  }
  let hour = Number(match[1]);
  const minute = match[2] ? Number(match[2]) : 0;
  const meridiem = match[3];
  if (meridiem === 'pm' && hour < 12) {
    hour += 12;
  } else if (meridiem === 'am' && hour === 12) {
    hour = 0;
  }
  return dt.set({ hour, minute });
}

function parseTimeOnDate(base: DateTime, time: string): string | null {
  const dt = applyTime(base, time);
  return dt.isValid ? dt.toISO() : null;
}
