import type { CheerioAPI } from 'cheerio';
import { buildOutageItem, fetchHtml, load, resolvePlannedWindow } from './utils';
import type { Adapter } from './types';
import type { OutageItem } from '../../../src/lib/outages-types';

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

function summarise(text: string): string {
  return text.split('. ').slice(0, 2).join('. ').slice(0, 320);
}

function extractPublishedAt(articleHtml: string, cheerioInstance: CheerioAPI): string {
  const time = cheerioInstance('time.published, time.entry-date, time').first();
  const dateSource =
    time.attr('datetime') ??
    time.text() ??
    articleHtml.match(/\b\d{1,2}\s+[A-Za-z]+\s+\d{4}\b/)?.[0] ??
    articleHtml.match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0];
  const parsed = dateSource ? Date.parse(dateSource) : NaN;
  if (!Number.isNaN(parsed)) {
    return new Date(parsed).toISOString();
  }
  return new Date().toISOString();
}

function createItem(params: {
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
  areas: string[];
  raw?: Record<string, unknown>;
}): OutageItem {
  const plannedWindow = resolvePlannedWindow(`${params.title} ${params.summary}`, params.publishedAt);
  return buildOutageItem({
    source: 'TCN',
    sourceName: 'Transmission Company of Nigeria',
    title: params.title,
    summary: params.summary,
    affectedAreas: params.areas,
    officialUrl: params.url,
    verifiedBy: 'TCN',
    publishedAt: params.publishedAt,
    plannedWindow: plannedWindow ?? undefined,
    raw: params.raw
  });
}

export const tcn: Adapter = async (ctx) => {
  const items: OutageItem[] = [];
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

      const bodyHtml =
        article('article .entry-content').text() || article('article').text() || article('.entry-content').text();
      const fallbackBody = article('p').text();
      const bodyText = (bodyHtml || fallbackBody).replace(/\s+/g, ' ').trim();
      const areas = extractAreas(bodyText);
      const summary = summarise(bodyText || heading);
      const publishedAt = extractPublishedAt(articleHtml, article);

      items.push(
        createItem({
          title: heading,
          summary,
          url,
          publishedAt,
          areas,
          raw: { bodyText }
        })
      );
    } catch (error) {
      console.error(`TCN article fetch failed: ${url}`, error);
    }
  }

  console.log(`[TCN] items=${items.length} windows=${items.filter((item) => item.plannedWindow?.start).length}`);

  return items;
};
