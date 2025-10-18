import { buildOutageItem, fetchHtml, load, resolvePlannedWindow, sanitizeText } from './utils';
import type { Adapter } from './types';
import type { OutageItem } from '../../../src/lib/outages-types';

const GUARDIAN_URL = 'https://guardian.ng/feed/';
const KEYWORDS = /(disco|power|electricity|outage|blackout|tcn|transmission|aedc|ekedc|ikedc|phcn)/i;

export const guardianNG: Adapter = async (ctx) => {
  const items: OutageItem[] = [];

  try {
    const { html, status, fromFixture } = await fetchHtml(ctx, GUARDIAN_URL, 'guardian_ng.html');
    console.log(`[GUARDIAN_NG] fetch ${GUARDIAN_URL} status=${status}${fromFixture ? ' (fixture)' : ''}`);
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
      let sourceName = 'The Guardian Nigeria (media)';
      
      if (/aedc|abuja/i.test(haystack)) {
        source = 'AEDC';
        sourceName = 'Abuja Electricity Distribution Company (via Guardian)';
      } else if (/ekedc|eko|lagos/i.test(haystack)) {
        source = 'EKEDC';
        sourceName = 'Eko Electricity Distribution Company (via Guardian)';
      } else if (/ikedc|ikeja/i.test(haystack)) {
        source = 'Ikeja';
        sourceName = 'Ikeja Electric (via Guardian)';
      } else if (/tcn|transmission/i.test(haystack)) {
        source = 'TCN';
        sourceName = 'Transmission Company of Nigeria (via Guardian)';
      }

      items.push(
        buildOutageItem({
          source,
          sourceName,
          title,
          summary: description || title,
          officialUrl: link || GUARDIAN_URL,
          verifiedBy: 'MEDIA',
          plannedWindow: plannedWindow ?? undefined,
          publishedAt: pubDate ? new Date(pubDate).toISOString() : undefined,
          raw: { description, relaySource: 'guardian_ng' }
        })
      );
    });
  } catch (error) {
    console.error('Guardian NG scrape failed', error);
  }

  console.log(
    `[GUARDIAN_NG] items=${items.length} windows=${items.filter((item) => item.plannedWindow?.start).length}`
  );

  return items;
};
