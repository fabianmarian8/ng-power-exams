import { fetchHtml, load } from './utils';
import type { Adapter } from './types';
import type { OutageItem } from '../../../src/lib/outages-types';

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
    $('h1, h2, h3, p')
      .filter((_, el) => /\b\d{1,2}(st|nd|rd|th)?\s+[A-Za-z]+\s+20\d{2}\b/.test($(el).text()))
      .first()
      .text(),
    html.match(/\b\d{1,2}(st|nd|rd|th)?\s+[A-Za-z]+\s+20\d{2}\b/)?.[0],
    html.match(/20\d{2}-\d{2}-\d{2}/)?.[0]
  ];
  for (const candidate of candidates) {
    if (!candidate) continue;
    const parsed = Date.parse(candidate);
    if (!Number.isNaN(parsed)) {
      return new Date(parsed).toISOString();
    }
  }
  return undefined;
}

function buildItem(params: {
  sourceUrl: string;
  feeder: string;
  businessUnit?: string;
  band?: string;
  hours?: number;
  remarks?: string;
  publishedAt: string;
}): OutageItem {
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

  return {
    id: '',
    source: 'JED',
    sourceName: 'Jos Electricity Distribution Plc',
    title,
    summary: descriptionParts.join(' ').trim(),
    publishedAt: params.publishedAt,
    status: 'UNPLANNED',
    plannedWindow: undefined,
    affectedAreas: areas,
    verifiedBy: 'DISCO',
    officialUrl: params.sourceUrl,
    confidence: 0.9,
    raw: {
      feeder: params.feeder,
      band: params.band,
      remarks: params.remarks,
      hours: params.hours
    }
  } satisfies OutageItem;
}

function aggregateDowngradedFeeders(items: OutageItem[]): OutageItem[] {
  const downgraded = items.filter(
    (item) => item.raw?.hours !== undefined && item.raw.hours < 4
  );

  if (downgraded.length === 0) return items;
  if (downgraded.length <= 5) return items;

  const aggregated: OutageItem = {
    ...downgraded[0],
    title: `${downgraded.length} feeders experiencing low supply hours`,
    summary: `Currently tracking ${downgraded.length} feeders with reduced availability. Check official source for full list.`,
    affectedAreas: Array.from(
      new Set(downgraded.flatMap((item) => item.affectedAreas ?? []))
    ).slice(0, 10)
  };

  const regular = items.filter(
    (item) => !(item.raw?.hours !== undefined && item.raw.hours < 4)
  );

  return [aggregated, ...regular];
}

export const jed: Adapter = async (ctx) => {
  const items: OutageItem[] = [];
  const seenTitles = new Set<string>();

  for (const pageUrl of PAGES) {
    let html: string;
    let fromFixture = false;
    try {
      const result = await fetchHtml(ctx, pageUrl, 'jed_news.html');
      html = result.html;
      fromFixture = result.fromFixture;
      console.log(`[JED] fetch ${pageUrl} status=${result.status}${fromFixture ? ' (fixture)' : ''}`);
    } catch (error) {
      console.error(`JED page fetch failed: ${pageUrl}`, error);
      continue;
    }

    const $ = load(html, ctx.cheerio, { xmlMode: fromFixture });
    const publishedAt = extractPublishedAt(html, $) ?? new Date().toISOString();

    if (fromFixture) {
      $('item').each((_, entry) => {
        const node = $(entry);
        const title = normalize(node.find('title').text());
        const link = normalize(node.find('link').text());
        const description = normalize(node.find('description').text());
        const pubDate = node.find('pubDate').text();
        if (!title) return;
        const outage: OutageItem = {
          id: '',
          source: 'JED',
          sourceName: 'Jos Electricity Distribution Plc',
          title,
          summary: description || title,
          publishedAt: pubDate ? new Date(pubDate).toISOString() : publishedAt,
          status: 'UNPLANNED',
          verifiedBy: 'DISCO',
          officialUrl: link || pageUrl,
          affectedAreas: [],
          raw: { description }
        };
        items.push(outage);
      });
      break;
    }

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

          const item = buildItem({
            sourceUrl: pageUrl,
            feeder,
            businessUnit,
            band,
            hours,
            remarks,
            publishedAt
          });

          const key = `${item.title}-${item.summary}`;
          if (seenTitles.has(key)) {
            return;
          }
          seenTitles.add(key);
          items.push(item);
        });
    });
  }

  const result = aggregateDowngradedFeeders(items);
  console.log(
    `[JED] items=${result.length} windows=${result.filter((item) => item.plannedWindow?.start).length} top=${result
      .slice(0, 3)
      .map((item) => item.title)
      .join(' | ')}`
  );
  return result;
};
