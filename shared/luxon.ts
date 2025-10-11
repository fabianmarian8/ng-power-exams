import { DateTime, Settings } from 'luxon';

export const LAGOS_TIMEZONE = 'Africa/Lagos';

Settings.defaultZone = LAGOS_TIMEZONE;

export function lagosNow(): DateTime {
  return DateTime.now().setZone(LAGOS_TIMEZONE);
}

export function fromLagosISO(iso?: string | null): DateTime | null {
  if (!iso) {
    return null;
  }
  const parsed = DateTime.fromISO(iso, { zone: LAGOS_TIMEZONE });
  return parsed.isValid ? parsed : null;
}

export function ensureLagos(dateTime?: DateTime | null): DateTime | null {
  if (!dateTime) {
    return null;
  }
  return dateTime.setZone(LAGOS_TIMEZONE);
}

export { Settings } from 'luxon';
export type { Duration } from 'luxon';
export { DateTime } from 'luxon';
