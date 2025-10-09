import { classifyEvent, fetchHtml, load, makeId, toIso } from './utils';
import type { Adapter } from './types';
import type { OutageEvent } from '../../../src/lib/outages-types';

const LISTING_URL = 'https://tcn.org.ng/blog_grid_3.php';
const KEYWORDS = /(outage|maintenance|fault|shutdown|transmission|tower|132kv|330kv|blackout)/i;

function extractAreas(body: string): string[] {
  const locations = body.match(/\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\b/g) ?? [];
  const whitelist = ['Lagos', 'Abuja', 'Kaduna', 'Port Harcourt', 'Lekki', 'Ajah', 'Ikoyi', 'Yaba', 'Ikeja'];
  const normalized = new Set<string>();
  for (const location of locations) {
    if (whitelist.some((city) => city.toLowerCase() === location.toLowerCase())) {
      normalized.add(location);
    }
  }
  return Array.from(normalized);
}

export const tcn: Adapter = async (ctx) => {
  const events: OutageEvent[] = [];

  let listingHtml: string;
  try {
    listingHtml = await fetchHtml(ctx, LISTING_URL);
  } catch (error) {
    console.error('TCN listing fetch failed', error);
    return events;
  }

  const $ = load(listingHtml, ctx.cheerio);
  const links = new Set<string>();

  $('a').each((_, element) => {
    const node = $(element);
    const href = node.attr('href');
    const title = node.text().replace(/\s+/g, ' ').trim();
    if (!href || !title) return;
    if (!KEYWORDS.test(title)) return;
    links.add(new URL(href, LISTING_URL).toString());
  });

  for (const url of links) {
    try {
      const articleHtml = await fetchHtml(ctx, url);
      const article = load(articleHtml, ctx.cheerio);
      const heading = article('h1, h2, h3').first().text().replace(/\s+/g, ' ').trim() || article('title').text().trim();
      if (!heading || !KEYWORDS.test(heading)) continue;
      const time = article('time').first();
      const dateSource = time.attr('datetime') ?? time.text() ?? articleHtml.match(/\b\d{1,2}\s+[A-Za-z]+\s+\d{4}\b/)?.[0];
      const publishedAt = toIso(dateSource) ?? new Date().toISOString();
      const articleBody = article('article').text();
      const fallbackBody = article('p').text();
      const bodyText = (articleBody || fallbackBody).replace(/\s+/g, ' ').trim();
      const areas = extractAreas(bodyText);

      events.push({
        id: makeId(url, heading, publishedAt),
        source: 'TCN',
        category: classifyEvent(heading, bodyText),
        title: heading,
        description: bodyText.slice(0, 1000),
        areas,
        publishedAt,
        detectedAt: new Date().toISOString(),
        sourceUrl: url
      });
    } catch (error) {
      console.error(`TCN article fetch failed: ${url}`, error);
    }
  }

  const seen = new Set<string>();
  return events.filter((event) => {
    const key = `${event.source}:${event.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
