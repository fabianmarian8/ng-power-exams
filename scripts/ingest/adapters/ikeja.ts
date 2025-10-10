import { buildOutageItem, fetchHtml, load, resolvePlannedWindow } from './utils';
import type { Adapter } from './types';
import type { OutageItem } from '../../../src/lib/outages-types';

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

function parsePublishedAt(text: string): string | undefined {
  const dateMatch = text.match(/\b\d{1,2}[-\/]\w{3,9}[-\/]\d{2,4}\b/);
  if (!dateMatch) return undefined;
  const parsed = Date.parse(dateMatch[0]);
  if (!Number.isNaN(parsed)) {
    return new Date(parsed).toISOString();
  }
  return undefined;
}

function createItem(params: {
  sourceUrl: string;
  title: string;
  summary: string;
  publishedAt?: string;
  affectedAreas?: string[];
}): OutageItem {
  const plannedWindow = resolvePlannedWindow(params.summary, params.publishedAt);
  return buildOutageItem({
    source: 'IKEJA',
    sourceName: 'Ikeja Electric',
    title: params.title,
    summary: params.summary,
    affectedAreas: params.affectedAreas,
    officialUrl: params.sourceUrl,
    verifiedBy: 'DISCO',
    plannedWindow: plannedWindow ?? undefined,
    publishedAt: params.publishedAt,
    status: 'PLANNED'
  });
}

export const ikeja: Adapter = async (ctx) => {
  const collected: OutageItem[] = [];

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
      if (processed.has(title)) return;
      processed.add(title);

      const href = card.find('a').attr('href') ?? CNN_URL;
      const url = new URL(href, CNN_URL).toString();
      const areas = extractAreas(title);
      const publishedAt = parsePublishedAt(title);

      collected.push(
        createItem({
          sourceUrl: url,
          title,
          summary: title,
          publishedAt,
          affectedAreas: areas
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
        const areas = extractAreas(text);
        const publishedAt = parsePublishedAt(text);

        collected.push(
          createItem({
            sourceUrl: url,
            title: text,
            summary: text,
            publishedAt,
            affectedAreas: areas
          })
        );
      });
    } catch (error) {
      console.error(`IKEDC BU scrape failed (${unit})`, error);
    }
  }

  console.log(
    `[IKEJA] items=${collected.length} windows=${collected.filter((item) => item.plannedWindow?.start).length}`
  );

  return collected;
};
