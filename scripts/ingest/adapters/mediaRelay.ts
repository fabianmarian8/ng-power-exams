import { buildOutageItem, fetchHtml, load, resolvePlannedWindow, sanitizeText } from './utils';
import type { Adapter } from './types';
import type { OutageItem } from '../../../src/lib/outages-types';

const MEDIA_FEED_URL = 'https://tribuneonlineng.com/feed';
const KEYWORDS = /(aedc|abuja|power outage|load shedding|transmission|tcn|maintenance)/i;

export const mediaRelay: Adapter = async (ctx) => {
  const items: OutageItem[] = [];

  try {
    const { html, status, fromFixture } = await fetchHtml(ctx, MEDIA_FEED_URL, 'tribune_power.html');
    console.log(`[MEDIA] fetch ${MEDIA_FEED_URL} status=${status}${fromFixture ? ' (fixture)' : ''}`);
    const $ = load(html, ctx.cheerio, { xmlMode: true });

    $('item').each((_, node) => {
      const element = $(node);
      const title = sanitizeText(element.find('title').text());
      const link = sanitizeText(element.find('link').text());
      const description = sanitizeText(element.find('description').text());
      const pubDate = sanitizeText(element.find('pubDate').text());
      const haystack = `${title} ${description}`;

      if (!title || !KEYWORDS.test(haystack)) {
        return;
      }

      const plannedWindow = resolvePlannedWindow(haystack, pubDate ? new Date(pubDate).toISOString() : undefined);

      items.push(
        buildOutageItem({
          source: 'AEDC',
          sourceName: 'Abuja Electricity Distribution Company (media relay)',
          title,
          summary: description || title,
          officialUrl: link || MEDIA_FEED_URL,
          verifiedBy: 'MEDIA',
          plannedWindow: plannedWindow ?? undefined,
          publishedAt: pubDate ? new Date(pubDate).toISOString() : undefined,
          raw: { description, relaySource: 'media' }
        })
      );
    });
  } catch (error) {
    console.error('Media relay scrape failed', error);
  }

  console.log(
    `[MEDIA] items=${items.length} windows=${items.filter((item) => item.plannedWindow?.start).length} top=${items
      .slice(0, 3)
      .map((item) => item.title)
      .join(' | ')}`
  );

  return items;
};
