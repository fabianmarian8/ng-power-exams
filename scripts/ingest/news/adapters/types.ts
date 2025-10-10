import type { NewsItem, NewsDomain, NewsTier } from '../../../../src/shared/types';

export interface AdapterContext {
  cheerio: typeof import('cheerio');
}

export type AdapterNewsItem = Omit<NewsItem, 'id'> & { id?: string };

export interface RegisteredAdapter {
  name: string;
  domain: NewsDomain;
  tier: NewsTier;
  source: string;
  run: (ctx: AdapterContext) => Promise<AdapterNewsItem[]>;
}
