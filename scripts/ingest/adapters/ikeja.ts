import { dedupeEvents, fetchHtml, load, makeId, classifyEvent, toIso } from './utils';
import type { Adapter } from './types';
import type { OutageEvent } from '../../../src/lib/outages-types';

const BASE_URL = 'https://www.ikejaelectric.com';
const CNN_URL = `${BASE_URL}/cnn/`;
const BUSINESS_UNITS = ['ABULE', 'AKOWONJO', 'IKEJA', 'IKORODU', 'OSHODI', 'SHOMOLU'];

function extractAreas(text: string): string[] {
  const match = text.match(/AREAS\s+AFFECTED:?([^\n]+)/i);
  if (!match) return [];
  return match[1]
    .split(/[,;]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function createEvent(params: {
  sourceUrl: string;
  title: string;
  description: string;
  publishedAt?: string;
  feeder?: string;
  areas?: string[];
}): OutageEvent {
  const publishedAt = params.publishedAt ?? new Date().toISOString();
  return {
    id: makeId(params.sourceUrl, params.title, publishedAt),
    source: 'IKEDC',
    category: classifyEvent(params.title, params.description),
    title: params.title,
    description: params.description,
    areas: params.areas ?? [],
    feeder: params.feeder,
    publishedAt,
    detectedAt: new Date().toISOString(),
    sourceUrl: params.sourceUrl,
    verifiedBy: 'DisCo'
  };
}

export const ikeja: Adapter = async (ctx) => {
  const collected: OutageEvent[] = [];

  try {
    const html = await fetchHtml(ctx, CNN_URL);
    const $ = load(html, ctx.cheerio);
    const processed = new Set<string>();

    $('a, div, li').each((_, el) => {
      const el$ = $(el);
      const card = el$.closest('a, div, li');
      const title = card.text().replace(/\s+/g, ' ').trim();
      if (!title) {
        return;
      }
      if (!/(fault|outage|restoration)/i.test(title)) return;
      if (processed.has(title)) return;
      processed.add(title);

      const href = card.find('a').attr('href') ?? CNN_URL;
      const url = new URL(href, CNN_URL).toString();
      const areas = extractAreas(title);
      const feeder = title.match(/\b([0-9]{2}-[A-Z0-9-]+)\b/)?.[1];
      const dateMatch = title.match(/\b\d{1,2}[-\/]\w{3,9}[-\/]\d{2,4}\b/);
      const publishedAt = toIso(dateMatch?.[0]);

      collected.push(
        createEvent({
          sourceUrl: url,
          title,
          description: title,
          publishedAt,
          feeder,
          areas
        })
      );
    });
  } catch (error) {
    console.error('IKEDC CNN scrape failed', error);
  }

  for (const unit of BUSINESS_UNITS) {
    const url = `${CNN_URL}index3.php?menu_bu=${encodeURIComponent(unit)}`;
    try {
      const html = await fetchHtml(ctx, url);
      const $ = load(html, ctx.cheerio);
      $('table tr').each((_, row) => {
        const text = $(row).text().replace(/\s+/g, ' ').trim();
        if (!text) return;
        if (!/(fault|outage|restoration)/i.test(text)) return;
        const areas = extractAreas(text);
        const feeder = text.match(/\b([0-9]{2}-[A-Z0-9-]+)\b/)?.[1];
        const publishedAt = toIso(text.match(/\b\d{1,2}[-\/]\w{3,9}[-\/]\d{2,4}\b/)?.[0]);

        collected.push(
          createEvent({
            sourceUrl: url,
            title: text,
            description: text,
            publishedAt,
            feeder,
            areas
          })
        );
      });
    } catch (error) {
      console.error(`IKEDC BU scrape failed (${unit})`, error);
    }
  }

  return dedupeEvents(collected);
};
