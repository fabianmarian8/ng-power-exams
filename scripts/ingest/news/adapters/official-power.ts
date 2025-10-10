import { createRssAdapter } from './utils';
import type { RegisteredAdapter } from './types';

const POWER_KEYWORDS = /(outage|maintenance|restoration|grid|transmission|feeder|load|power|electricity|disco|fault|interruption|upgrade)/i;

export const powerOfficialAdapters: RegisteredAdapter[] = [
  {
    name: 'tcnOfficial',
    domain: 'POWER',
    tier: 'OFFICIAL',
    source: 'TCN',
    run: createRssAdapter({
      url: 'https://www.tcn.org.ng/feed/',
      domain: 'POWER',
      tier: 'OFFICIAL',
      source: 'TCN',
      keywords: POWER_KEYWORDS,
      limit: 20,
      fixture: 'tcn_news.html'
    })
  },
  {
    name: 'ikejaOfficial',
    domain: 'POWER',
    tier: 'OFFICIAL',
    source: 'Ikeja Electric',
    run: createRssAdapter({
      url: 'https://www.ikejaelectric.com/feed/',
      domain: 'POWER',
      tier: 'OFFICIAL',
      source: 'Ikeja Electric',
      keywords: POWER_KEYWORDS,
      limit: 20,
      fixture: 'ikeja_news.html'
    })
  },
  {
    name: 'ekedcOfficial',
    domain: 'POWER',
    tier: 'OFFICIAL',
    source: 'EKEDC',
    run: createRssAdapter({
      url: 'https://www.ekedp.com/feed/',
      domain: 'POWER',
      tier: 'OFFICIAL',
      source: 'EKEDC',
      keywords: POWER_KEYWORDS,
      limit: 20,
      fixture: 'ekedc_news.html'
    })
  },
  {
    name: 'kadunaOfficial',
    domain: 'POWER',
    tier: 'OFFICIAL',
    source: 'Kaduna Electric',
    run: createRssAdapter({
      url: 'https://kadunaelectric.com/feed/',
      domain: 'POWER',
      tier: 'OFFICIAL',
      source: 'Kaduna Electric',
      keywords: POWER_KEYWORDS,
      limit: 20,
      fixture: 'kaduna_news.html'
    })
  },
  {
    name: 'jedOfficial',
    domain: 'POWER',
    tier: 'OFFICIAL',
    source: 'JED',
    run: createRssAdapter({
      url: 'https://www.jedplc.com/feed/',
      domain: 'POWER',
      tier: 'OFFICIAL',
      source: 'JED',
      keywords: POWER_KEYWORDS,
      limit: 20,
      fixture: 'jed_news.html'
    })
  }
];
