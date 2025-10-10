import { classifyEvent, fetchHtml, load, makeId, toIso } from './utils';
import type { Adapter } from './types';
import type { OutageEvent } from '../../../src/lib/outages-types';

const CATEGORY_URL = 'https://kadunaelectric.com/category/outage-information/';
const KEYWORDS = /(outage|fault|interruption|maintenance|shutdown|restoration)/i;

export const kaduna: Adapter = async (ctx) => {
  const events: OutageEvent[] = [];

  try {
    const html = await fetchHtml(ctx, CATEGORY_URL);
    const $ = load(html, ctx.cheerio);

    $('article, .post, .blog-post').each((_, element) => {
      const node = $(element);
      const link = node.find('a').first();
      const href = link.attr('href');
      const title = (link.text() || node.find('h2, h3').first().text()).replace(/\s+/g, ' ').trim();
      if (!href || !title || !KEYWORDS.test(title)) return;

      const dateText = node.find('time').attr('datetime') ?? node.find('time').text();
      const publishedAt = toIso(dateText) ?? new Date().toISOString();
      const description = node.find('p').first().text().replace(/\s+/g, ' ').trim() || title;

      events.push({
        id: makeId(href, title, publishedAt),
        source: 'KADUNA',
        category: classifyEvent(title, description),
        title,
        description,
        areas: [],
        publishedAt,
        detectedAt: new Date().toISOString(),
        sourceUrl: href,
        verifiedBy: 'DisCo'
      });
    });
  } catch (error) {
    console.error('Kaduna scrape failed', error);
  }

  const seen = new Set<string>();
  return events.filter((event) => {
    if (seen.has(event.id)) return false;
    seen.add(event.id);
    return true;
  });
};
