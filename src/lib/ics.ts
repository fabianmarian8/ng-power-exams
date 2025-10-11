import { DateTime } from 'luxon';
import type { OutageItem } from '@/lib/outages-types';

const TZ = 'Africa/Lagos';

function toIcsDate(iso: string): string {
  return DateTime.fromISO(iso, { zone: TZ }).toUTC().toFormat("yyyyMMdd'T'HHmmss'Z'");
}

function escape(text: string | undefined): string {
  if (!text) return '';
  return text.replace(/\\/g, '\\\\').replace(/\n+/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

export function generateOutageIcs(item: OutageItem): string | null {
  const startIso = item.start ?? item.plannedWindow?.start;
  if (!startIso) {
    return null;
  }
  const start = DateTime.fromISO(startIso, { zone: TZ });
  if (!start.isValid) {
    return null;
  }
  const endIso = item.end ?? item.plannedWindow?.end;
  const end = endIso ? DateTime.fromISO(endIso, { zone: TZ }) : start.plus({ hours: 2 });
  const safeEnd = end.isValid ? end : start.plus({ hours: 2 });

  // Don't generate calendar link for events that ended more than 6 hours ago
  const now = DateTime.now().setZone(TZ);
  const sixHoursAfterEnd = safeEnd.plus({ hours: 6 });
  if (now.toMillis() > sixHoursAfterEnd.toMillis()) {
    return null;
  }

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//NaijaInfo//Outage Planner//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${item.id}@naijainfo.ng`,
    `DTSTAMP:${toIcsDate(DateTime.now().setZone(TZ).toISO()!)}`,
    `DTSTART:${toIcsDate(start.toISO()!)}`,
    `DTEND:${toIcsDate(safeEnd.toISO()!)}`,
    `SUMMARY:${escape(item.title)}`,
    `DESCRIPTION:${escape(item.summary ?? item.title)}`,
    item.officialUrl ? `URL:${escape(item.officialUrl)}` : undefined,
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean) as string[];

  const blob = lines.join('\r\n');
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(blob)}`;
}
