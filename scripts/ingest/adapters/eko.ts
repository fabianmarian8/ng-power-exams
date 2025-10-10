import { buildOutageItem, fetchHtml, load, extractPlannedWindow } from './utils';
import type { Adapter } from './types';
import type { OutageItem } from '../../../src/lib/outages-types';

const BASE_URL = 'https://ekedp.com';
const NEWS_URL = `${BASE_URL}/news`;
const KEYWORDS = /(outage|blackout|maintenance|shutdown|fault|restoration|tcn|330kv|132kv|upgrade|planned)/i;

function createItem(params: {
  title: string;
  summary: string;
  url: string;
  publishedAt?: string;
}): OutageItem {
  const plannedWindow = extractPlannedWindow(`${params.title} ${params.summary}`);
  return buildOutageItem({
    source: 'EKEDC',
    sourceName: 'Eko Electricity Distribution Company',
    title: params.title,
    summary: params.summary,
    officialUrl: params.url,
    verifiedBy: 'DISCO',
    publishedAt: params.publishedAt,
    plannedWindow
  });
}

export const eko: Adapter = async (ctx) => {
  const items: OutageItem[] = [];

  try {
    const html = await fetchHtml(ctx, NEWS_URL);
    const $ = load(html, ctx.cheerio);

    $('article, .news-item, .card, a').each((_, element) => {
      const node = $(element);
      const link = node.find('a').first();
      const titleNode = node.find('h1, h2, h3').first();
      const title = (titleNode.text() || node.text()).replace(/\s+/g, ' ').trim();
      const href = (link.attr('href') ?? node.attr('href')) ?? '';
      if (!title || !href || !KEYWORDS.test(title)) return;

      const absoluteUrl = new URL(href, NEWS_URL).toString();
      const dateText = node.find('time').attr('datetime') ?? node.find('time').text();
      const parsedDate = dateText ? Date.parse(dateText) : NaN;
      const publishedAt = !Number.isNaN(parsedDate) ? new Date(parsedDate).toISOString() : undefined;
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
  } catch (error) {
    console.error('EKEDC scrape failed', error);
  }

  return items;
};
