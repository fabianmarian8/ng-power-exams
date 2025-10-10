import { fetchHtml, load, makeId, toIso } from './utils';
import type { Adapter } from './types';
import type { OutageEvent } from '../../../src/lib/outages-types';

const PAGES = [
  'https://jedplc.com/feeder-availability.php',
  'https://jedplc.com/downgraded-feeders.php'
];

function normalize(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function normaliseHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function parseHours(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const match = value.replace(/,/g, '.').match(/(\d+(?:\.\d+)?)/);
  if (!match) return undefined;
  return Number.parseFloat(match[1]);
}

function extractPublishedAt(html: string, $: ReturnType<typeof load>): string | undefined {
  const timeNode = $('time').first();
  const candidates = [
    timeNode.attr('datetime'),
    timeNode.text(),
    $('h1, h2, h3, p').filter((_, el) => /\b\d{1,2}(st|nd|rd|th)?\s+[A-Za-z]+\s+20\d{2}\b/.test($(el).text())).first().text(),
    html.match(/\b\d{1,2}(st|nd|rd|th)?\s+[A-Za-z]+\s+20\d{2}\b/)?.[0],
    html.match(/20\d{2}-\d{2}-\d{2}/)?.[0]
  ];
  for (const candidate of candidates) {
    const iso = toIso(candidate ?? undefined);
    if (iso) {
      return iso;
    }
  }
  return undefined;
}

function buildEvent(params: {
  sourceUrl: string;
  feeder: string;
  businessUnit?: string;
  band?: string;
  hours?: number;
  remarks?: string;
  publishedAt: string;
}): OutageEvent {
  const hoursText = params.hours === undefined ? 'downgraded supply levels' : `${params.hours} hour${params.hours === 1 ? '' : 's'}`;
  const title = params.hours === undefined
    ? `${params.feeder} feeder downgraded in ${params.businessUnit ?? 'service area'}`
    : `${params.feeder} feeder recorded ${hoursText} of supply`;
  const descriptionParts = [
    `${params.feeder} feeder serving ${params.businessUnit ?? 'customers'} reported ${hoursText}.`
  ];
  if (params.band) {
    descriptionParts.push(`Band classification: ${params.band}.`);
  }
  if (params.remarks) {
    descriptionParts.push(params.remarks);
  }
  const areas = params.businessUnit
    ? params.businessUnit
        .split(/[,\/;&]+/)
        .map((part) => normalize(part))
        .filter(Boolean)
    : [];

  const baseDescription = descriptionParts.join(' ').trim();
  const category: OutageEvent['category'] = params.hours === 0 ? 'unplanned' : 'advisory';

  return {
    id: makeId(params.sourceUrl, title, params.publishedAt),
    source: 'JED',
    category,
    title,
    description: baseDescription,
    areas,
    feeder: params.feeder,
    publishedAt: params.publishedAt,
    detectedAt: new Date().toISOString(),
    sourceUrl: params.sourceUrl,
    verifiedBy: 'DisCo'
  };
}

export const jed: Adapter = async (ctx) => {
  const events: OutageEvent[] = [];
  const seenIds = new Set<string>();

  for (const pageUrl of PAGES) {
    let html: string;
    try {
      html = await fetchHtml(ctx, pageUrl);
    } catch (error) {
      console.error(`JED page fetch failed: ${pageUrl}`, error);
      continue;
    }

    const $ = load(html, ctx.cheerio);
    const publishedAt = extractPublishedAt(html, $) ?? new Date().toISOString();

    $('table').each((_, table) => {
      const headerNodes = $(table).find('thead th');
      const headers = headerNodes.length
        ? headerNodes
            .map((_, th) => normaliseHeader($(th).text()))
            .get()
        : [];

      $(table)
        .find('tbody tr, tr')
        .each((_, row) => {
          const cells = $(row)
            .find('td')
            .map((_, cell) => normalize($(cell).text()))
            .get();
          if (!cells.length) return;

          const data: Record<string, string> = {};
          if (headers.length === cells.length && headers.length > 0) {
            headers.forEach((header, index) => {
              data[header] = cells[index];
            });
          }

          const feeder = data['feeder name'] || data['feeder'] || cells[0];
          if (!feeder) return;

          const businessUnit = data['business unit'] || data['undertaking'] || data['location'] || data['station'];
          const band = data['band'] || data['customer band'] || data['band class'];
          const hoursValue = data['hours of availability'] || data['hours availability'] || data['hours'];
          const remarks = data['remarks'] || data['status'] || data['comment'] || data['downgraded from'];

          const hours = parseHours(hoursValue);
          const downgraded = /downgraded|band|upgrade|load/i.test(remarks ?? '') || /band/i.test(band ?? '');

          if (hours === undefined && !downgraded) {
            return;
          }

          if (hours !== undefined && hours > 4) {
            return;
          }

          const event = buildEvent({
            sourceUrl: pageUrl,
            feeder,
            businessUnit,
            band,
            hours,
            remarks,
            publishedAt
          });

          if (!seenIds.has(event.id)) {
            events.push(event);
            seenIds.add(event.id);
          }
        });
    });
  }

  return events;
};
