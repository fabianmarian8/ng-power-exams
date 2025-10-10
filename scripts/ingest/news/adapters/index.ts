import { examOfficialAdapters } from './official-exams';
import { powerOfficialAdapters } from './official-power';
import { mediaAdapters } from './media';
import type { RegisteredAdapter } from './types';

export const NEWS_ADAPTERS: RegisteredAdapter[] = [
  ...examOfficialAdapters,
  ...powerOfficialAdapters,
  ...mediaAdapters
];
