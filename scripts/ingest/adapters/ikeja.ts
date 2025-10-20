import { buildOutageItem, fetchHtml, load, resolvePlannedWindow, sanitizeText } from './utils';
import type { Adapter } from './types';
import type { OutageItem } from '../../../src/lib/outages-types';
import { validateOutageRelevance, extractPlannedWindowAI } from '../lib/aiValidator';

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
  plannedWindow?: ReturnType<typeof resolvePlannedWindow> | null;
  confidence?: number;
  status?: OutageItem['status'];
}): OutageItem {
  const plannedWindow = params.plannedWindow ?? resolvePlannedWindow(params.summary, params.publishedAt);
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
    confidence: params.confidence,
    status: params.status
  });
}

export const ikeja: Adapter = async (ctx) => {
  const collected: OutageItem[] = [];

  try {
    const { html, status, fromFixture } = await fetchHtml(ctx, CNN_URL, 'ikeja_news.html');
    console.log(`[IKEJA] fetch ${CNN_URL} status=${status}${fromFixture ? ' (fixture)' : ''}`);
    const $ = load(html, ctx.cheerio, { xmlMode: fromFixture });

    if (fromFixture) {
      const nodes = $('item').toArray();
      for (const element of nodes) {
        const node = $(element);
        const title = sanitizeText(node.find('title').text());
        const link = sanitizeText(node.find('link').text());
        const description = sanitizeText(node.find('description').text());
        const pubDate = sanitizeText(node.find('pubDate').text());
        if (!title || BLACKLIST_PATTERNS.some((pattern) => pattern.test(title))) {
          continue;
        }

        const summary = description || title;
        const validation = await validateOutageRelevance(title, summary);
        if (!validation.isRelevant || validation.confidence < 0.65) {
          console.log(`[IKEJA] Skipping irrelevant: ${title.slice(0, 60)}`);
          continue;
        }

        const publishedAt = pubDate ? new Date(pubDate).toISOString() : undefined;
        const aiPlannedWindow = await extractPlannedWindowAI(title, summary, publishedAt);
        const finalPlannedWindow = aiPlannedWindow ?? resolvePlannedWindow(`${title} ${summary}`, publishedAt);

        collected.push(
          createItem({
            sourceUrl: link || CNN_URL,
            title,
            summary,
            publishedAt,
            affectedAreas: validation.extractedInfo?.affectedAreas ?? extractAreas(summary),
            plannedWindow: finalPlannedWindow,
            confidence: validation.confidence,
            status: validation.extractedInfo?.outageType
          })
        );
      }
    } else {
      const processed = new Set<string>();

      const nodes = $('a, div, li').toArray();
      for (const el of nodes) {
        const el$ = $(el);
        const card = el$.closest('a, div, li');
        const title = card.text().replace(/\s+/g, ' ').trim();
        if (!title || title.length < 15) {
          continue;
        }
        if (processed.has(title)) {
          continue;
        }
        processed.add(title);

        const href = card.find('a').attr('href') ?? CNN_URL;
        const url = new URL(href, CNN_URL).toString();
        if (BLACKLIST_PATTERNS.some((pattern) => pattern.test(title))) {
          continue;
        }
        const areas = extractAreas(title);
        const publishedAt = parsePublishedAt(title);

        const validation = await validateOutageRelevance(title, title);
        if (!validation.isRelevant || validation.confidence < 0.65) {
          console.log(`[IKEJA] Skipping irrelevant: ${title.slice(0, 60)}`);
          continue;
        }

        const aiPlannedWindow = await extractPlannedWindowAI(title, title, publishedAt);
        const finalPlannedWindow = aiPlannedWindow ?? resolvePlannedWindow(title, publishedAt);

        collected.push(
          createItem({
            sourceUrl: url,
            title,
            summary: title,
            publishedAt,
            affectedAreas: validation.extractedInfo?.affectedAreas ?? areas,
            plannedWindow: finalPlannedWindow,
            confidence: validation.confidence,
            status: validation.extractedInfo?.outageType
          })
        );
      }

      for (const unit of BUSINESS_UNITS) {
        const url = `${CNN_URL}index3.php?menu_bu=${encodeURIComponent(unit)}`;
        try {
          const { html: unitHtml, status: unitStatus } = await fetchHtml(ctx, url);
          console.log(`[IKEJA] fetch ${url} status=${unitStatus}`);
          const unit$ = load(unitHtml, ctx.cheerio);
          const rows = unit$('table tr').toArray();
          for (const row of rows) {
            const text = unit$(row).text().replace(/\s+/g, ' ').trim();
            if (!text || text.length < 15) continue;
            if (BLACKLIST_PATTERNS.some((pattern) => pattern.test(text))) continue;
            const areas = extractAreas(text);
            const publishedAt = parsePublishedAt(text);

            const validation = await validateOutageRelevance(text, text);
            if (!validation.isRelevant || validation.confidence < 0.65) {
              console.log(`[IKEJA] Skipping irrelevant: ${text.slice(0, 60)}`);
              continue;
            }

            const aiPlannedWindow = await extractPlannedWindowAI(text, text, publishedAt);
            const finalPlannedWindow = aiPlannedWindow ?? resolvePlannedWindow(text, publishedAt);

            collected.push(
              createItem({
                sourceUrl: url,
                title: text,
                summary: text,
                publishedAt,
                affectedAreas: validation.extractedInfo?.affectedAreas ?? areas,
                plannedWindow: finalPlannedWindow,
                confidence: validation.confidence,
                status: validation.extractedInfo?.outageType
              })
            );
          }
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
