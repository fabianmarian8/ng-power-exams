import { createRssAdapter } from './utils';
import type { RegisteredAdapter } from './types';

const EXAM_KEYWORDS = /(JAMB|UTME|result|slip|checker|CAPS|WAEC|SSCE|BECE|NECO|token|e-?PIN|admission|release)/i;

export const examOfficialAdapters: RegisteredAdapter[] = [
  {
    name: 'jambOfficial',
    domain: 'EXAMS',
    tier: 'OFFICIAL',
    source: 'JAMB',
    run: createRssAdapter({
      url: 'https://www.jamb.gov.ng/feed/',
      domain: 'EXAMS',
      tier: 'OFFICIAL',
      source: 'JAMB',
      keywords: EXAM_KEYWORDS,
      limit: 15
    })
  },
  {
    name: 'waecOfficial',
    domain: 'EXAMS',
    tier: 'OFFICIAL',
    source: 'WAEC',
    run: createRssAdapter({
      url: 'https://www.waecnigeria.org/feed/',
      domain: 'EXAMS',
      tier: 'OFFICIAL',
      source: 'WAEC',
      keywords: EXAM_KEYWORDS,
      limit: 15
    })
  },
  {
    name: 'necoOfficial',
    domain: 'EXAMS',
    tier: 'OFFICIAL',
    source: 'NECO',
    run: createRssAdapter({
      url: 'https://www.neco.gov.ng/feed/',
      domain: 'EXAMS',
      tier: 'OFFICIAL',
      source: 'NECO',
      keywords: EXAM_KEYWORDS,
      limit: 15
    })
  }
];
