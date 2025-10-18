import { buildOutageItem, fetchHtml, load, resolvePlannedWindow, sanitizeText } from './utils';
import type { Adapter } from './types';
import type { OutageItem } from '../../../src/lib/outages-types';

const VANGUARD_URL = 'https://www.vanguardngr.com/feed/';
const KEYWORDS = /(disco|power|electricity|outage|blackout|tcn|transmission|nepa|phcn|grid)/i;

export const vanguardNews: Adapter = async (ctx) => {
  const items: OutageItem[] = [];

  try {
    const { html, status, fromFixture } = await fetchHtml(ctx, VANGUARD_URL, 'vanguard_news.html');
    console.log(`[VANGUARD] fetch ${VANGUARD_URL} status=${status}${fromFixture ? ' (fixture)' : ''}`);
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

      // Identifikácia zdroja
      let source = 'MEDIA';
      let sourceName = 'Vanguard Nigeria (media)';
      
      if (/aedc|abuja/i.test(haystack)) {
        source = 'AEDC';
        sourceName = 'Abuja Electricity Distribution Company (via Vanguard)';
      } else if (/ekedc|eko/i.test(haystack)) {
        source = 'EKEDC';
        sourceName = 'Eko Electricity Distribution Company (via Vanguard)';
      } else if (/ikedc|ikeja/i.test(haystack)) {
        source = 'Ikeja';
        sourceName = 'Ikeja Electric (via Vanguard)';
      } else if (/tcn|national grid|transmission/i.test(haystack)) {
        source = 'TCN';
        sourceName = 'Transmission Company of Nigeria (via Vanguard)';
      }

      items.push(
        buildOutageItem({
          source,
          sourceName,
          title,
          summary: description || title,
          officialUrl: link || VANGUARD_URL,
          verifiedBy: 'MEDIA',
          plannedWindow: plannedWindow ?? undefined,
          publishedAt: pubDate ? new Date(pubDate).toISOString() : undefined,
          raw: { description, relaySource: 'vanguard' }
        })
      );
    });
  } catch (error) {
    console.error('Vanguard scrape failed', error);
  }

  console.log(
    `[VANGUARD] items=${items.length} windows=${items.filter((item) => item.plannedWindow?.start).length}`
  );

  return items;
};
