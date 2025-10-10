import type { OutageItem } from '../../../src/lib/outages-types';

type AxiosExport = typeof import('axios')['default'];

export interface AdapterContext {
  axios: AxiosExport;
  cheerio: typeof import('cheerio');
  userAgent: string;
}

export type Adapter = (ctx: AdapterContext) => Promise<OutageItem[]>;
