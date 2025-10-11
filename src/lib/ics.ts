import type { OutageItem } from '@/lib/outages-types';
import { DateTime, fromLagosISO, lagosNow } from '@shared/luxon';

function toIcsDateTime(dateTime: DateTime): string {
  return dateTime.toUTC().toFormat("yyyyMMdd'T'HHmmss'Z'");
}

function escape(text: string | undefined): string {
  if (!text) return '';
  return text.replace(/\\/g, '\\\\').replace(/\n+/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

export function generateOutageIcs(item: OutageItem): string | null {
  const startIso = item.start ?? item.plannedWindow?.start;
  const start = fromLagosISO(startIso);
  if (!start) {
    return null;
  }
  const endIso = item.end ?? item.plannedWindow?.end;
  const end = fromLagosISO(endIso) ?? start.plus({ hours: 2 });

  // Don't generate calendar link for events that ended more than 6 hours ago
  const now = lagosNow();
  const sixHoursAfterEnd = end.plus({ hours: 6 });
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
    `DTSTAMP:${toIcsDateTime(lagosNow())}`,
    `DTSTART:${toIcsDateTime(start)}`,
    `DTEND:${toIcsDateTime(end)}`,
    `SUMMARY:${escape(item.title)}`,
    `DESCRIPTION:${escape(item.summary ?? item.title)}`,
    item.officialUrl ? `URL:${escape(item.officialUrl)}` : undefined,
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean) as string[];

  const blob = lines.join('\r\n');
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(blob)}`;
}
