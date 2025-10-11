import { buildOutageItem, fetchHtml, load, resolvePlannedWindow, sanitizeText } from './utils';
import type { Adapter } from './types';
import type { OutageItem } from '../../../src/lib/outages-types';

const BASE_URL = 'https://www.ikejaelectric.com';
const CNN_URL = `${BASE_URL}/cnn/`;
const BUSINESS_UNITS = ['ABULE', 'AKOWONJO', 'IKEJA', 'IKORODU', 'OSHODI', 'SHOMOLU'];

const BLACKLIST_PATTERNS = [/customer notice/i, /payment/i, /vending/i, /meter/i];

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
    publishedAt: params.publishedAt
  });
}

export const ikeja: Adapter = async (ctx) => {
  const collected: OutageItem[] = [];

  try {
    const { html, status, fromFixture } = await fetchHtml(ctx, CNN_URL, 'ikeja_news.html');
    console.log(`[IKEJA] fetch ${CNN_URL} status=${status}${fromFixture ? ' (fixture)' : ''}`);
    const $ = load(html, ctx.cheerio, { xmlMode: fromFixture });

    if (fromFixture) {
      $('item').each((_, item) => {
        const node = $(item);
        const title = sanitizeText(node.find('title').text());
        const link = sanitizeText(node.find('link').text());
        const description = sanitizeText(node.find('description').text());
        const pubDate = sanitizeText(node.find('pubDate').text());
        if (!title || BLACKLIST_PATTERNS.some((pattern) => pattern.test(title))) return;
        const plannedWindow = resolvePlannedWindow(`${title} ${description}`);

        collected.push(
          createItem({
            sourceUrl: link || CNN_URL,
            title,
            summary: description || title,
            publishedAt: pubDate ? new Date(pubDate).toISOString() : undefined,
            affectedAreas: extractAreas(description || title)
          })
        );
      });
    } else {
      const processed = new Set<string>();

      $('a, div, li').each((_, el) => {
        const el$ = $(el);
        const card = el$.closest('a, div, li');
        const title = card.text().replace(/\s+/g, ' ').trim();
        if (!title || title.length < 15) {
          return;
        }
        if (processed.has(title)) return;
        processed.add(title);

        const href = card.find('a').attr('href') ?? CNN_URL;
        const url = new URL(href, CNN_URL).toString();
        if (BLACKLIST_PATTERNS.some((pattern) => pattern.test(title))) {
          return;
        }
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

      for (const unit of BUSINESS_UNITS) {
        const url = `${CNN_URL}index3.php?menu_bu=${encodeURIComponent(unit)}`;
        try {
          const { html: unitHtml, status: unitStatus } = await fetchHtml(ctx, url);
          console.log(`[IKEJA] fetch ${url} status=${unitStatus}`);
          const unit$ = load(unitHtml, ctx.cheerio);
          unit$('table tr').each((_, row) => {
            const text = unit$(row).text().replace(/\s+/g, ' ').trim();
            if (!text || text.length < 15) return;
            if (BLACKLIST_PATTERNS.some((pattern) => pattern.test(text))) return;
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
    }
  } catch (error) {
    console.error('IKEDC CNN scrape failed', error);
  }

  console.log(
    `[IKEJA] items=${collected.length} windows=${collected.filter((item) => item.plannedWindow?.start).length} top=${collected
      .slice(0, 3)
      .map((item) => item.title)
      .join(' | ')}`
  );

  return collected;
};
