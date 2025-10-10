import type { NewsItem, NewsDomain, NewsTier } from '../../../../src/shared/types';

type FetchInit = Parameters<typeof fetch>[1];

export interface AdapterContext {
  fetch: (url: string, init?: FetchInit) => Promise<{ status: number; body: string; ok: boolean }>;
  cheerio: typeof import('cheerio');
  userAgent: string;
}

export type AdapterNewsItem = Omit<NewsItem, 'id'> & { id?: string };

export interface RegisteredAdapter {
  name: string;
  domain: NewsDomain;
  tier: NewsTier;
  source: string;
  run: (ctx: AdapterContext) => Promise<AdapterNewsItem[]>;
}
