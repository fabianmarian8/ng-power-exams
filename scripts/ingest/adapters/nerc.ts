import type { Adapter } from './types';
import { buildOutageItem, fetchHtml, load, sanitizeText } from './utils';
import type { OutageItem } from '../../../src/lib/outages-types';
import { validateOutageRelevance, extractPlannedWindowAI } from '../lib/aiValidator';

const BASE_URL = 'https://nerc.gov.ng';
const NEWS_URLS = [
  `${BASE_URL}/news-events`,
  `${BASE_URL}/media-library/press-release`
];

export const nerc: Adapter = async (ctx) => {
  const items: OutageItem[] = [];
  const articleLinks = new Set<string>();

  for (const listingUrl of NEWS_URLS) {
    try {
      const { html, status } = await fetchHtml(ctx, listingUrl);
      console.log(`[NERC] Fetched ${listingUrl} - status ${status}`);

      const $ = load(html, ctx.cheerio);

      $('article, .news-item, .post, .entry').each((_, element) => {
        const node = $(element);
        const link = node.find('a').first();
        const href = link.attr('href');
        const title = (
          node.find('h1, h2, h3, h4').first().text() ||
          link.text() ||
          node.text()
        )
          .replace(/\s+/g, ' ')
          .trim();

        if (!href || !title || title.length < 15) return;

        const absoluteUrl = new URL(href, listingUrl).toString();
        articleLinks.add(absoluteUrl);
      });

      console.log(`[NERC] Found ${articleLinks.size} article links from ${listingUrl}`);
    } catch (error) {
      console.error(`[NERC] Failed to fetch listing ${listingUrl}:`, error instanceof Error ? error.message : error);
    }
  }

  for (const url of Array.from(articleLinks).slice(0, 30)) {
    try {
      const { html } = await fetchHtml(ctx, url);
      const $ = load(html, ctx.cheerio);

      const title = sanitizeText($('h1, .entry-title, .post-title').first().text());
      const contentNode = $('article .entry-content, article, .post-content, .content');
      const bodyText = sanitizeText(contentNode.text());
      const summary = bodyText.slice(0, 500);

      if (!title || title.length < 15) continue;

      const validation = await validateOutageRelevance(title, summary);

      if (!validation.isRelevant || validation.confidence < 0.7) {
        console.log(`[NERC] Skipping irrelevant: ${title.slice(0, 60)}`);
        continue;
      }

      const dateText = $('time').attr('datetime') || $('time').text() || $('.published, .date').text();
      const publishedAt = dateText ? new Date(dateText).toISOString() : new Date().toISOString();

      const plannedWindow = await extractPlannedWindowAI(title, bodyText, publishedAt);

      items.push(
        buildOutageItem({
          source: 'NERC',
          sourceName: 'Nigerian Electricity Regulatory Commission',
          title,
          summary,
          affectedAreas: validation.extractedInfo?.affectedAreas,
          officialUrl: url,
          verifiedBy: 'REGULATORY',
          publishedAt,
          plannedWindow: plannedWindow ?? undefined,
          confidence: validation.confidence,
          status: validation.extractedInfo?.outageType ?? (plannedWindow ? 'PLANNED' : 'UNPLANNED'),
          raw: { bodyText: bodyText.slice(0, 1000) }
        })
      );
    } catch (error) {
      console.error(`[NERC] Failed to fetch article ${url}:`, error instanceof Error ? error.message : error);
    }
  }

  console.log(`[NERC] Total items: ${items.length} (planned: ${items.filter((i) => i.plannedWindow).length})`);
  return items;
};
