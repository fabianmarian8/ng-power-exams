import type { Adapter } from './types';
import { buildOutageItem, sanitizeText } from './utils';
import type { OutageItem } from '../../../src/lib/outages-types';
import { validateOutageRelevance, extractPlannedWindowAI } from '../lib/aiValidator';

const TWITTER_ACCOUNTS = [
  'TCN_NG',
  'EKEDP',
  'IkejaElectric',
  'JEDplc',
  'KadunaElectric',
  'NERCNG',
  'AbujaElectric',
  'PHED_NG'
];

const NITTER_INSTANCE = 'https://nitter.net';

export const twitter: Adapter = async (ctx) => {
  const items: OutageItem[] = [];

  for (const account of TWITTER_ACCOUNTS) {
    try {
      const rssUrl = `${NITTER_INSTANCE}/${account}/rss`;
      const response = await ctx.axios.get(rssUrl, {
        headers: { 'User-Agent': ctx.userAgent },
        timeout: 15000
      });

      const $ = ctx.cheerio.load(response.data, { xmlMode: true });

      const tweetItems = $('item').toArray().slice(0, 20);

      for (const item of tweetItems) {
        const node = $(item);
        const title = sanitizeText(node.find('title').text());
        const description = sanitizeText(node.find('description').text());
        const link = sanitizeText(node.find('link').text());
        const pubDate = sanitizeText(node.find('pubDate').text());

        if (!title || title.length < 10) continue;

        const validation = await validateOutageRelevance(title, description);

        if (!validation.isRelevant || validation.confidence < 0.65) {
          console.log(`[Twitter] Skipping irrelevant: ${title.slice(0, 60)}`);
          continue;
        }

        const plannedWindow = await extractPlannedWindowAI(
          title,
          description,
          pubDate ? new Date(pubDate).toISOString() : undefined
        );

        const outageItem = buildOutageItem({
          source: 'TWITTER',
          sourceName: `@${account} (X/Twitter)`,
          title,
          summary: description || title,
          affectedAreas: validation.extractedInfo?.affectedAreas,
          officialUrl: link || `https://twitter.com/${account}`,
          verifiedBy: account.includes('TCN') ? 'TCN' : account.includes('NERC') ? 'REGULATORY' : 'MEDIA',
          publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
          plannedWindow: plannedWindow ?? undefined,
          confidence: validation.confidence,
          status: validation.extractedInfo?.outageType ?? (plannedWindow ? 'PLANNED' : 'UNPLANNED'),
          raw: {
            tweetUrl: link,
            account: `@${account}`,
            description
          }
        });

        items.push(outageItem);
      }

      const accountTag = `@${account}`;
      console.log(`[Twitter] ${accountTag}: ${items.filter((i) => i.raw?.account === accountTag).length} items`);
    } catch (error) {
      console.error(`[Twitter] Failed for @${account}:`, error instanceof Error ? error.message : error);
    }
  }

  console.log(`[Twitter] Total items: ${items.length}`);
  return items;
};
