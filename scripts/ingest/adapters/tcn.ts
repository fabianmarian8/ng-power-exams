import { classifyEvent, fetchHtml, load, makeId, toIso } from './utils';
import type { Adapter } from './types';
import type { OutageEvent } from '../../../src/lib/outages-types';

const LISTING_URLS = [
  'https://www.tcn.org.ng/category/latest-news/',
  'https://www.tcn.org.ng/category/public-notice/'
];
const KEYWORDS = /(outage|maintenance|fault|shutdown|transmission|tower|132kv|330kv|blackout|collapse|restoration|upgrade|scada|line)/i;

const LOCATION_WHITELIST = [
  'Lagos',
  'Abuja',
  'Kaduna',
  'Port Harcourt',
  'Jos',
  'Kano',
  'Maiduguri',
  'Benin',
  'Abeokuta',
  'Osogbo',
  'Onitsha',
  'Calabar',
  'Enugu',
  'Gombe',
  'Yola'
];

function extractAreas(body: string): string[] {
  const locations = body.match(/\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\b/g) ?? [];
  const normalized = new Set<string>();
  for (const location of locations) {
    if (LOCATION_WHITELIST.some((city) => city.toLowerCase() === location.toLowerCase())) {
      normalized.add(location);
    }
  }
  return Array.from(normalized);
}

export const tcn: Adapter = async (ctx) => {
  const events: OutageEvent[] = [];
  const articleLinks = new Set<string>();

  for (const listingUrl of LISTING_URLS) {
    try {
      const listingHtml = await fetchHtml(ctx, listingUrl);
      const $ = load(listingHtml, ctx.cheerio);
      $('article, .post, .td_module_wrap, .blog-post').each((_, element) => {
        const node = $(element);
        const link = node.find('a').first();
        const href = link.attr('href');
        const title = (node.find('h1, h2, h3').first().text() || link.text() || node.text())
          .replace(/\s+/g, ' ')
          .trim();
        if (!href || !title) return;
        if (!KEYWORDS.test(title)) return;
        articleLinks.add(new URL(href, listingUrl).toString());
      });
    } catch (error) {
      console.error(`TCN listing fetch failed: ${listingUrl}`, error);
    }
  }

  for (const url of articleLinks) {
    try {
      const articleHtml = await fetchHtml(ctx, url);
      const article = load(articleHtml, ctx.cheerio);
      const heading =
        article('h1.entry-title, h1.post-title, h1, h2').first().text().replace(/\s+/g, ' ').trim() ||
        article('title').text().trim();
      if (!heading || !KEYWORDS.test(heading)) continue;
      const time = article('time.published, time.entry-date, time').first();
      const dateSource =
        time.attr('datetime') ??
        time.text() ??
        articleHtml.match(/\b\d{1,2}\s+[A-Za-z]+\s+\d{4}\b/)?.[0] ??
        articleHtml.match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0];
      const publishedAt = toIso(dateSource) ?? new Date().toISOString();
      const articleBody =
        article('article .entry-content').text() || article('article').text() || article('.entry-content').text();
      const fallbackBody = article('p').text();
      const bodyText = (articleBody || fallbackBody).replace(/\s+/g, ' ').trim();
      const areas = extractAreas(bodyText);

      events.push({
        id: makeId(url, heading, publishedAt),
        source: 'TCN',
        category: classifyEvent(heading, bodyText),
        title: heading,
        description: bodyText.slice(0, 1200),
        areas,
        publishedAt,
        detectedAt: new Date().toISOString(),
        sourceUrl: url,
        verifiedBy: 'TCN'
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
