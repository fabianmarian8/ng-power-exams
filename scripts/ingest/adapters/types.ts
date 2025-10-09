import type { OutageEvent } from '../../../src/lib/outages-types';

export interface AdapterContext {
  axios: typeof import('axios');
  cheerio: typeof import('cheerio');
  userAgent: string;
}

export type Adapter = (ctx: AdapterContext) => Promise<OutageEvent[]>;
