import { buildOutageItem, fetchHtml, load, resolvePlannedWindow, sanitizeText } from './utils';
import type { Adapter } from './types';
import type { OutageItem } from '../../../src/lib/outages-types';
import { validateOutageRelevance, extractPlannedWindowAI } from '../lib/aiValidator';

const CATEGORY_URL = 'https://kadunaelectric.com/category/outage-information/';
const KEYWORDS = /(outage|fault|interruption|maintenance|shutdown|restoration|upgrade)/i;

export const kaduna: Adapter = async (ctx) => {
  const items: OutageItem[] = [];

  try {
    const { html, status, fromFixture } = await fetchHtml(ctx, CATEGORY_URL, 'kaduna_news.html');
    console.log(`[KADUNA] fetch ${CATEGORY_URL} status=${status}${fromFixture ? ' (fixture)' : ''}`);
    const $ = load(html, ctx.cheerio, { xmlMode: fromFixture });

    if (fromFixture) {
      const nodes = $('item').toArray();
      for (const item of nodes) {
        const node = $(item);
        const title = sanitizeText(node.find('title').text());
        const link = sanitizeText(node.find('link').text());
        const description = sanitizeText(node.find('description').text());
        const pubDate = sanitizeText(node.find('pubDate').text());
        if (!title || !KEYWORDS.test(title)) {
          continue;
        }
        const summary = description || title;
        const publishedAt = pubDate ? new Date(pubDate).toISOString() : undefined;

        const validation = await validateOutageRelevance(title, summary);
        if (!validation.isRelevant || validation.confidence < 0.65) {
          console.log(`[KADUNA] Skipping irrelevant: ${title.slice(0, 60)}`);
          continue;
        }

        const aiPlannedWindow = await extractPlannedWindowAI(title, summary, publishedAt);
        const finalPlannedWindow = aiPlannedWindow ?? resolvePlannedWindow(`${title} ${summary}`, publishedAt);

        items.push(
          buildOutageItem({
            source: 'KADUNA',
            sourceName: 'Kaduna Electric',
            title,
            summary,
            officialUrl: link || CATEGORY_URL,
            verifiedBy: 'DISCO',
            publishedAt,
            plannedWindow: finalPlannedWindow ?? undefined,
            confidence: validation.confidence,
            status: validation.extractedInfo?.outageType,
            affectedAreas: validation.extractedInfo?.affectedAreas
          })
        );
      }
    } else {
      const nodes = $('article, .post, .blog-post').toArray();
      for (const element of nodes) {
        const node = $(element);
        const link = node.find('a').first();
        const href = link.attr('href');
        const title = (link.text() || node.find('h2, h3').first().text()).replace(/\s+/g, ' ').trim();
        if (!href || !title || !KEYWORDS.test(title)) {
          continue;
        }

        const dateText = node.find('time').attr('datetime') ?? node.find('time').text();
        const parsedDate = dateText ? Date.parse(dateText) : NaN;
        const publishedAt = !Number.isNaN(parsedDate) ? new Date(parsedDate).toISOString() : undefined;
        const summary = node.find('p').first().text().replace(/\s+/g, ' ').trim() || title;

        const validation = await validateOutageRelevance(title, summary);
        if (!validation.isRelevant || validation.confidence < 0.65) {
          console.log(`[KADUNA] Skipping irrelevant: ${title.slice(0, 60)}`);
          continue;
        }

        const aiPlannedWindow = await extractPlannedWindowAI(title, summary, publishedAt);
        const finalPlannedWindow = aiPlannedWindow ?? resolvePlannedWindow(`${title} ${summary}`, publishedAt);

        items.push(
          buildOutageItem({
            source: 'KADUNA',
            sourceName: 'Kaduna Electric',
            title,
            summary,
            officialUrl: href,
            verifiedBy: 'DISCO',
            publishedAt,
            plannedWindow: finalPlannedWindow ?? undefined,
            confidence: validation.confidence,
            status: validation.extractedInfo?.outageType ?? (finalPlannedWindow ? 'PLANNED' : undefined),
            affectedAreas: validation.extractedInfo?.affectedAreas
          })
        );
      }
    }
  } catch (error) {
    console.error('Kaduna scrape failed', error);
  }

  console.log(
    `[KADUNA] items=${items.length} windows=${items.filter((item) => item.plannedWindow?.start).length} top=${items
      .slice(0, 3)
      .map((item) => item.title)
      .join(' | ')}`
  );

  return items;
};
