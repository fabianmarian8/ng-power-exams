import { buildOutageItem, fetchHtml, load, resolvePlannedWindow, sanitizeText } from './utils';
import type { Adapter } from './types';
import type { OutageItem } from '../../../src/lib/outages-types';

const PREMIUM_TIMES_URL = 'https://www.premiumtimesng.com/feed';
const KEYWORDS = /(disco|aedc|ekedc|ikedc|power outage|electricity|load shedding|transmission|tcn|maintenance|blackout)/i;

export const premiumTimes: Adapter = async (ctx) => {
  const items: OutageItem[] = [];

  try {
    const { html, status, fromFixture } = await fetchHtml(ctx, PREMIUM_TIMES_URL, 'premium_times.html');
    console.log(`[PREMIUM_TIMES] fetch ${PREMIUM_TIMES_URL} status=${status}${fromFixture ? ' (fixture)' : ''}`);
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

      // Pokús sa identifikovať konkrétny DISCO
      let source = 'MEDIA';
      let sourceName = 'Premium Times Nigeria (media)';
      
      if (/aedc|abuja/i.test(haystack)) {
        source = 'AEDC';
        sourceName = 'Abuja Electricity Distribution Company (via Premium Times)';
      } else if (/ekedc|eko|lekki/i.test(haystack)) {
        source = 'EKEDC';
        sourceName = 'Eko Electricity Distribution Company (via Premium Times)';
      } else if (/ikedc|ikeja/i.test(haystack)) {
        source = 'Ikeja';
        sourceName = 'Ikeja Electric (via Premium Times)';
      } else if (/tcn|transmission/i.test(haystack)) {
        source = 'TCN';
        sourceName = 'Transmission Company of Nigeria (via Premium Times)';
      }

      items.push(
        buildOutageItem({
          source,
          sourceName,
          title,
          summary: description || title,
          officialUrl: link || PREMIUM_TIMES_URL,
          verifiedBy: 'MEDIA',
          plannedWindow: plannedWindow ?? undefined,
          publishedAt: pubDate ? new Date(pubDate).toISOString() : undefined,
          raw: { description, relaySource: 'premium_times' }
        })
      );
    });
  } catch (error) {
    console.error('Premium Times scrape failed', error);
  }

  console.log(
    `[PREMIUM_TIMES] items=${items.length} windows=${items.filter((item) => item.plannedWindow?.start).length}`
  );

  return items;
};
