import { buildOutageItem, fetchHtml, load, resolvePlannedWindow, sanitizeText } from './utils';
import type { Adapter } from './types';
import type { OutageItem } from '../../../src/lib/outages-types';
import { validateOutageRelevance, extractPlannedWindowAI } from '../lib/aiValidator';

const BASE_URL = 'https://ekedp.com';
const NEWS_URL = `${BASE_URL}/news`;
const KEYWORDS = /(power outage|service interruption|scheduled maintenance|maintenance|unplanned shutdown|feeder fault|supply restoration|tcn outage|grid collapse)/i;

const BLACKLIST_PATTERNS = [
  /prepaid meter/i,
  /meter upgrade/i,
  /contact.*team/i,
  /rapid response/i,
  /report.*fault/i,
  /whistle.*blow/i,
  /upgraded.*downgraded.*feeders/i,
  /customer.*service/i,
  /payment/i,
  /bill/i,
  /tariff/i,
  /sts\s*$/i,
  /^\s*$/
];

function createItem(params: {
  title: string;
  summary: string;
  url: string;
  publishedAt?: string;
  plannedWindow?: ReturnType<typeof resolvePlannedWindow> | null;
  confidence?: number;
  status?: OutageItem['status'];
}): OutageItem {
  const plannedWindow =
    params.plannedWindow ?? resolvePlannedWindow(`${params.title} ${params.summary}`, params.publishedAt);
  return buildOutageItem({
    source: 'EKEDC',
    sourceName: 'Eko Electricity Distribution Company',
    title: params.title,
    summary: params.summary,
    officialUrl: params.url,
    verifiedBy: 'DISCO',
    publishedAt: params.publishedAt,
    plannedWindow: plannedWindow ?? undefined,
    confidence: params.confidence,
    status: params.status
  });
}

export const ekedc: Adapter = async (ctx) => {
  const items: OutageItem[] = [];

  try {
    const { html, status, fromFixture } = await fetchHtml(ctx, NEWS_URL, 'ekedc_news.html');
    console.log(`[EKEDC] fetch ${NEWS_URL} status=${status}${fromFixture ? ' (fixture)' : ''}`);
    const $ = load(html, ctx.cheerio, { xmlMode: fromFixture });

    if (fromFixture) {
      const nodes = $('item').toArray();
      for (const element of nodes) {
        const node = $(element);
        const title = sanitizeText(node.find('title').text());
        const link = sanitizeText(node.find('link').text());
        const description = sanitizeText(node.find('description').text());
        const pubDate = sanitizeText(node.find('pubDate').text());
        if (!title || !KEYWORDS.test(title)) {
          continue;
        }

        const validation = await validateOutageRelevance(title, description || title);
        if (!validation.isRelevant || validation.confidence < 0.65) {
          console.log(`[EKEDC] Skipping irrelevant: ${title.slice(0, 60)}`);
          continue;
        }

        const publishedAt = pubDate ? new Date(pubDate).toISOString() : undefined;
        const aiPlannedWindow = await extractPlannedWindowAI(title, description || title, publishedAt ?? undefined);
        const finalPlannedWindow = aiPlannedWindow ?? resolvePlannedWindow(`${title} ${description}`, publishedAt);

        items.push(
          createItem({
            title,
            summary: description || title,
            url: link || NEWS_URL,
            publishedAt,
            plannedWindow: finalPlannedWindow,
            confidence: validation.confidence,
            status: validation.extractedInfo?.outageType
          })
        );
      }
    } else {
      const nodes = $('article, .news-item, .card, a').toArray();
      for (const element of nodes) {
        const node = $(element);
        const link = node.find('a').first();
        const titleNode = node.find('h1, h2, h3').first();
        const title = (titleNode.text() || node.text()).replace(/\s+/g, ' ').trim();
        const href = (link.attr('href') ?? node.attr('href')) ?? '';
        if (!title || title.length < 10 || !href || !KEYWORDS.test(title)) {
          continue;
        }
        if (BLACKLIST_PATTERNS.some((pattern) => pattern.test(title))) {
          continue;
        }

        const absoluteUrl = new URL(href, NEWS_URL).toString();
        const dateText = node.find('time').attr('datetime') ?? node.find('time').text();
        const parsedDate = dateText ? Date.parse(dateText) : NaN;
        const publishedAt = !Number.isNaN(parsedDate) ? new Date(parsedDate).toISOString() : undefined;

        if (!publishedAt) {
          console.log(`[EKEDC] Skipping item without date: ${title}`);
          continue;
        }

        if (Date.now() - Date.parse(publishedAt) > 90 * 24 * 60 * 60 * 1000) {
          console.log(`[EKEDC] Skipping old item: ${title}`);
          continue;
        }

        const summary = node.find('p').first().text().replace(/\s+/g, ' ').trim() || title;

        const validation = await validateOutageRelevance(title, summary);
        if (!validation.isRelevant || validation.confidence < 0.65) {
          console.log(`[EKEDC] Skipping irrelevant: ${title.slice(0, 60)}`);
          continue;
        }

        const aiPlannedWindow = await extractPlannedWindowAI(title, summary, publishedAt);
        const finalPlannedWindow = aiPlannedWindow ?? resolvePlannedWindow(`${title} ${summary}`, publishedAt);

        items.push(
          createItem({
            title,
            summary,
            url: absoluteUrl,
            publishedAt,
            plannedWindow: finalPlannedWindow,
            confidence: validation.confidence,
            status: validation.extractedInfo?.outageType
          })
        );
      }
    }
  } catch (error) {
    console.error('EKEDC scrape failed', error);
  }

  console.log(
    `[EKEDC] items=${items.length} windows=${items.filter((item) => item.plannedWindow?.start).length} top=${items
      .slice(0, 3)
      .map((item) => item.title)
      .join(' | ')}`
  );

  return items;
};
