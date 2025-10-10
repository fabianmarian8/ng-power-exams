import type { AdapterContext, AdapterNewsItem, RegisteredAdapter } from './types';
import { fetchHtml, isOfflineMode } from '../../lib/fetchHtml';
import { parsePublishedDate, sanitizeHtml } from './utils';

const EXAMS_REGEX = /(JAMB|WAEC|NECO|UTME|SSCE|BECE|result|slip|checker)/i;
const POWER_REGEX = /(power|grid|outage|electricity|disco|transmission|TCN|Ikeja|Kaduna|Eko|Jos|EKEDC|PHCN|load shedding)/i;

interface MediaSource {
  name: string;
  url: string;
  fixture: string;
}

const MEDIA_SOURCES: MediaSource[] = [
  { name: 'Vanguard', url: 'https://www.vanguardngr.com/feed/', fixture: 'vanguard_power.html' },
  { name: 'Punch', url: 'https://punchng.com/feed/', fixture: 'punch_exams.html' },
  { name: 'Daily Trust', url: 'https://dailytrust.com/feed/', fixture: 'dailytrust_power.html' },
  { name: 'Tribune', url: 'https://tribuneonlineng.com/feed/', fixture: 'tribune_power.html' },
  { name: 'Reuters', url: 'https://www.reuters.com/rssFeed/world/africa', fixture: 'reuters_africa.html' }
];

function classifyDomain(title: string, summary?: string): AdapterNewsItem['domain'] | null {
  const haystack = `${title} ${summary ?? ''}`;
  if (EXAMS_REGEX.test(haystack)) {
    return 'EXAMS';
  }
  if (POWER_REGEX.test(haystack)) {
    return 'POWER';
  }
  return null;
}

async function fetchMediaFeed(ctx: AdapterContext, source: MediaSource): Promise<AdapterNewsItem[]> {
  try {
    const xml = await fetchHtml(source.url, source.fixture);
    const $ = ctx.cheerio.load(xml, { xmlMode: true });
    const items: AdapterNewsItem[] = [];
    $('item').each((_, element) => {
      const node = $(element);
      const title = node.find('title').first().text().trim();
      const link = node.find('link').first().text().trim() || node.find('guid').first().text().trim();
      if (!title || !link) return;
      const descriptionNode = node.find('description').first().text() || node.find('content\:encoded').first().text() || '';
      const summary = descriptionNode ? sanitizeHtml(descriptionNode, ctx.cheerio) : undefined;
      const pubDate =
        node.find('pubDate').first().text().trim() ||
        node.find('dc\:date').first().text().trim() ||
        node.find('updated').first().text().trim();
      const domain = classifyDomain(title, summary);
      if (!domain) return;
      const parsedDate = pubDate && pubDate.trim().length ? parsePublishedDate(pubDate) : undefined;
      const publishedAt = parsedDate ? parsedDate.toISOString() : new Date().toISOString();
      items.push({
        domain,
        tier: 'MEDIA',
        source: source.name,
        title,
        summary,
        officialUrl: link,
        publishedAt
      });
    });
    console.log(
      `[news][${source.name}] mode=${isOfflineMode ? 'offline' : 'online'} itemsFound=${items.length} firstTitles=${items
        .slice(0, 3)
        .map((item) => item.title)
        .join(' | ')}`
    );
    return items;
  } catch (error) {
    console.error(`Media RSS fetch failed for ${source.name}`, error);
    return [];
  }
}

export const mediaAdapters: RegisteredAdapter[] = MEDIA_SOURCES.map((source) => ({
  name: `${source.name.toLowerCase().replace(/[^a-z]+/g, '-')}-media`,
  domain: 'POWER',
  tier: 'MEDIA',
  source: source.name,
  run: async (ctx: AdapterContext) => fetchMediaFeed(ctx, source)
}));
