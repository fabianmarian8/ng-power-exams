import { buildOutageItem, fetchHtml, load, resolvePlannedWindow } from './utils';
import type { Adapter } from './types';
import type { OutageItem } from '../../../src/lib/outages-types';

const CATEGORY_URL = 'https://kadunaelectric.com/category/outage-information/';
const KEYWORDS = /(outage|fault|interruption|maintenance|shutdown|restoration|upgrade)/i;

export const kaduna: Adapter = async (ctx) => {
  const items: OutageItem[] = [];

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
      const parsedDate = dateText ? Date.parse(dateText) : NaN;
      const publishedAt = !Number.isNaN(parsedDate) ? new Date(parsedDate).toISOString() : undefined;
      const summary = node.find('p').first().text().replace(/\s+/g, ' ').trim() || title;
      const plannedWindow = resolvePlannedWindow(`${title} ${summary}`, publishedAt);

      items.push(
        buildOutageItem({
          source: 'KADUNA',
          sourceName: 'Kaduna Electric',
          title,
          summary,
          officialUrl: href,
          verifiedBy: 'DISCO',
          publishedAt,
          plannedWindow: plannedWindow ?? undefined,
          status: 'PLANNED'
        })
      );
    });
  } catch (error) {
    console.error('Kaduna scrape failed', error);
  }

  console.log(`[KADUNA] items=${items.length} windows=${items.filter((item) => item.plannedWindow?.start).length}`);

  return items;
};
