import { ekedc } from './ekedc';
import { ikeja } from './ikeja';
import { kaduna } from './kaduna';
import { jed } from './jed';
import { tcn } from './tcn';
import type { AdapterContext } from './types';
import type { OutageItem } from '../../../src/lib/outages-types';

import { mediaRelay } from './mediaRelay';

type AdapterName = 'tcn' | 'ikeja' | 'ekedc' | 'kaduna' | 'jed' | 'media';

interface AdapterResult {
  items: OutageItem[];
  stats: Record<AdapterName, number>;
  lastPublishedAtByAdapter: Record<AdapterName, string | null>;
}

export async function fromAdapters(ctx: AdapterContext): Promise<AdapterResult> {
  const adapters: Record<AdapterName, () => Promise<OutageItem[]>> = {
    tcn: () => tcn(ctx),
    ikeja: () => ikeja(ctx),
    ekedc: () => ekedc(ctx),
    kaduna: () => kaduna(ctx),
    jed: () => jed(ctx),
    media: () => mediaRelay(ctx)
  };

  const stats: Record<AdapterName, number> = {
    tcn: 0,
    ikeja: 0,
    ekedc: 0,
    kaduna: 0,
    jed: 0,
    media: 0
  };

  const lastPublishedAtByAdapter: Record<AdapterName, string | null> = {
    tcn: null,
    ikeja: null,
    ekedc: null,
    kaduna: null,
    jed: null,
    media: null
  };

  const items: OutageItem[] = [];

  await Promise.all(
    Object.entries(adapters).map(async ([name, adapter]) => {
      const adapterName = name as AdapterName;
      try {
        const adapterItems = await adapter();
        stats[adapterName] = adapterItems.length;
        items.push(...adapterItems);
        const latest = adapterItems.reduce<string | null>((acc, item) => {
          if (!item.publishedAt) return acc;
          if (!acc) return item.publishedAt;
          return new Date(item.publishedAt) > new Date(acc) ? item.publishedAt : acc;
        }, null);
        lastPublishedAtByAdapter[adapterName] = latest;
      } catch (error) {
        stats[adapterName] = 0;
        console.error(`Adapter failed: ${adapterName}`, error);
      }
    })
  );

  return { items, stats, lastPublishedAtByAdapter };
}
