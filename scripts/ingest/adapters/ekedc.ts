import { buildOutageItem, fetchHtml, load, resolvePlannedWindow, sanitizeText } from './utils';
import type { Adapter } from './types';
import type { OutageItem } from '../../../src/lib/outages-types';

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
}): OutageItem {
  const plannedWindow = resolvePlannedWindow(`${params.title} ${params.summary}`, params.publishedAt);
  return buildOutageItem({
    source: 'EKEDC',
    sourceName: 'Eko Electricity Distribution Company',
    title: params.title,
    summary: params.summary,
    officialUrl: params.url,
    verifiedBy: 'DISCO',
    publishedAt: params.publishedAt,
    plannedWindow: plannedWindow ?? undefined
  });
}

export const ekedc: Adapter = async (ctx) => {
  const items: OutageItem[] = [];

  try {
    const { html, status, fromFixture } = await fetchHtml(ctx, NEWS_URL, 'ekedc_news.html');
    console.log(`[EKEDC] fetch ${NEWS_URL} status=${status}${fromFixture ? ' (fixture)' : ''}`);
    const $ = load(html, ctx.cheerio, { xmlMode: fromFixture });

    if (fromFixture) {
      $('item').each((_, item) => {
        const node = $(item);
        const title = sanitizeText(node.find('title').text());
        const link = sanitizeText(node.find('link').text());
        const description = sanitizeText(node.find('description').text());
        const pubDate = sanitizeText(node.find('pubDate').text());
        if (!title || !KEYWORDS.test(title)) return;

        items.push(
          createItem({
            title,
            summary: description || title,
            url: link || NEWS_URL,
            publishedAt: pubDate ? new Date(pubDate).toISOString() : undefined
          })
        );
      });
    } else {
      $('article, .news-item, .card, a').each((_, element) => {
        const node = $(element);
        const link = node.find('a').first();
        const titleNode = node.find('h1, h2, h3').first();
        const title = (titleNode.text() || node.text()).replace(/\s+/g, ' ').trim();
        const href = (link.attr('href') ?? node.attr('href')) ?? '';
        if (!title || title.length < 10 || !href || !KEYWORDS.test(title)) return;
        if (BLACKLIST_PATTERNS.some((pattern) => pattern.test(title))) return;

        const absoluteUrl = new URL(href, NEWS_URL).toString();
        const dateText = node.find('time').attr('datetime') ?? node.find('time').text();
        const parsedDate = dateText ? Date.parse(dateText) : NaN;
        const publishedAt = !Number.isNaN(parsedDate) ? new Date(parsedDate).toISOString() : undefined;

        if (!publishedAt) {
          console.log(`[EKEDC] Skipping item without date: ${title}`);
          return;
        }

        if (Date.now() - Date.parse(publishedAt) > 90 * 24 * 60 * 60 * 1000) {
          console.log(`[EKEDC] Skipping old item: ${title}`);
          return;
        }

        const summary = node.find('p').first().text().replace(/\s+/g, ' ').trim() || title;

        items.push(
          createItem({
            title,
            summary,
            url: absoluteUrl,
            publishedAt
          })
        );
      });
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
