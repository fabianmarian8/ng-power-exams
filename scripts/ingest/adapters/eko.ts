import { classifyEvent, fetchHtml, load, makeId, toIso } from './utils';
import type { Adapter } from './types';
import type { OutageEvent } from '../../../src/lib/outages-types';

const BASE_URL = 'https://ekedp.com';
const NEWS_URL = `${BASE_URL}/news`;
const KEYWORDS = /(outage|blackout|maintenance|shutdown|fault|restoration|tcn|330kv|132kv)/i;

export const eko: Adapter = async (ctx) => {
  const events: OutageEvent[] = [];

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
      const publishedAt = toIso(dateText) ?? new Date().toISOString();
      const description = node.find('p').first().text().replace(/\s+/g, ' ').trim() || title;

      events.push({
        id: makeId(absoluteUrl, title, publishedAt),
        source: 'EKEDC',
        category: classifyEvent(title, description),
        title,
        description,
        areas: [],
        publishedAt,
        detectedAt: new Date().toISOString(),
        sourceUrl: absoluteUrl
      });
    });
  } catch (error) {
    console.error('EKEDC scrape failed', error);
  }

  const seen = new Set<string>();
  return events.filter((event) => {
    if (seen.has(event.id)) return false;
    seen.add(event.id);
    return true;
  });
};
