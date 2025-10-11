import { toLagos, LAGOS_TZ } from "@/shared/luxon";

export function buildICS(opts: {
  title: string;
  description?: string;
  location?: string;
  start?: string;
  end?: string;
}): string {
  const s = opts.start ? toLagos(opts.start) : null;
  const e = opts.end ? toLagos(opts.end) : null;

  const end = e ?? (s ? s.plus({ hours: 2 }) : null);

  const dt = (d: ReturnType<typeof toLagos>) => d?.toFormat("yyyyMMdd'T'HHmmss");
  const esc = (x?: string) =>
    (x ?? "").replace(/\\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//NaijaInfo//Outage Planner//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    s ? `DTSTART;TZID=${LAGOS_TZ}:${dt(s)}` : "",
    end ? `DTEND;TZID=${LAGOS_TZ}:${dt(end)}` : "",
    `SUMMARY:${esc(opts.title)}`,
    opts.location ? `LOCATION:${esc(opts.location)}` : "",
    opts.description ? `DESCRIPTION:${esc(opts.description)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
    ""
  ]
    .filter(Boolean)
    .join("\r\n");

  return ics;
}
