import type { AdapterContext, AdapterNewsItem, RegisteredAdapter } from './types';

const EXAMS_REGEX = /(JAMB|WAEC|NECO|UTME|SSCE|BECE|result|slip|checker)/i;
const POWER_REGEX = /(power|grid|outage|electricity|disco|transmission|TCN|Ikeja|Kaduna|Eko|Jos|EKEDC|PHCN|load shedding)/i;

interface MediaSource {
  name: string;
  url: string;
}

const MEDIA_SOURCES: MediaSource[] = [
  { name: 'Vanguard', url: 'https://www.vanguardngr.com/feed/' },
  { name: 'Punch', url: 'https://punchng.com/feed/' },
  { name: 'Daily Trust', url: 'https://dailytrust.com/feed/' },
  { name: 'Tribune', url: 'https://tribuneonlineng.com/feed/' },
  { name: 'Reuters', url: 'https://www.reuters.com/rssFeed/world/africa' }
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
    const response = await ctx.axios.get(source.url, {
      headers: {
        'User-Agent': ctx.userAgent,
        Accept: 'application/rss+xml, application/xml;q=0.9, */*;q=0.8'
      },
      timeout: 15_000
    });
    const xml = response.data as string;
    const $ = ctx.cheerio.load(xml, { xmlMode: true });
    const items: AdapterNewsItem[] = [];
    $('item').each((_, element) => {
      const node = $(element);
      const title = node.find('title').first().text().trim();
      const link = node.find('link').first().text().trim() || node.find('guid').first().text().trim();
      if (!title || !link) return;
      const descriptionNode = node.find('description').first().text() || node.find('content\\:encoded').first().text() || '';
      const summary = descriptionNode
        ? ctx.cheerio.load(`<div>${descriptionNode}</div>`).root().text().replace(/\s+/g, ' ').trim()
        : undefined;
      const pubDate =
        node.find('pubDate').first().text().trim() ||
        node.find('dc\\:date').first().text().trim() ||
        node.find('updated').first().text().trim();
      const domain = classifyDomain(title, summary);
      if (!domain) return;
      const publishedAt = pubDate && pubDate.trim().length ? new Date(pubDate).toISOString() : new Date().toISOString();
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
