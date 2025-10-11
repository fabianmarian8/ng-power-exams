import { DateTime } from "luxon";

export const LAGOS_TZ = "Africa/Lagos";

export const nowLagos = () => DateTime.now().setZone(LAGOS_TZ);
export const toLagos = (iso?: string | null) =>
  iso ? DateTime.fromISO(iso, { zone: LAGOS_TZ }) : null;

export const fmtDateTime = (iso: string) =>
  toLagos(iso)?.toFormat("d LLL yyyy, HH:mm");

export const isTodayLagos = (iso: string) => {
  const d = toLagos(iso);
  if (!d) return false;
  return d.hasSame(nowLagos(), "day");
};

export const inNextDaysLagos = (iso: string, days: number) => {
  const d = toLagos(iso);
  if (!d) return false;
  const n = nowLagos();
  return d >= n.startOf("day") && d <= n.plus({ days }).endOf("day");
};

export const overlapsToday = (startIso?: string, endIso?: string) => {
  const n = nowLagos();
  const start = startIso ? toLagos(startIso)! : null;
  const end = endIso ? toLagos(endIso)! : null;
  const startOfDay = n.startOf("day");
  const endOfDay = n.endOf("day");

  if (start && end) return start <= endOfDay && end >= startOfDay;
  if (start && !end) return start.hasSame(n, "day");
  return false;
};
