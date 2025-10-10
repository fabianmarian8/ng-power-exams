import { eko } from './eko';
import { ikeja } from './ikeja';
import { kaduna } from './kaduna';
import { jed } from './jed';
import { tcn } from './tcn';
import type { AdapterContext } from './types';
import type { OutageEvent } from '../../../src/lib/outages-types';

type AdapterName = 'tcn' | 'ikeja' | 'eko' | 'kaduna' | 'jed';

interface AdapterResult {
  events: OutageEvent[];
  stats: Record<AdapterName, number>;
  lastPublishedAtByAdapter: Record<AdapterName, string | null>;
}

export async function fromAdapters(ctx: AdapterContext): Promise<AdapterResult> {
  const adapters: Record<AdapterName, () => Promise<OutageEvent[]>> = {
    tcn: () => tcn(ctx),
    ikeja: () => ikeja(ctx),
    eko: () => eko(ctx),
    kaduna: () => kaduna(ctx),
    jed: () => jed(ctx)
  };

  const stats: Record<AdapterName, number> = {
    tcn: 0,
    ikeja: 0,
    eko: 0,
    kaduna: 0,
    jed: 0
  };

  const lastPublishedAtByAdapter: Record<AdapterName, string | null> = {
    tcn: null,
    ikeja: null,
    eko: null,
    kaduna: null,
    jed: null
  };

  const events: OutageEvent[] = [];

  await Promise.all(
    Object.entries(adapters).map(async ([name, adapter]) => {
      const adapterName = name as AdapterName;
      try {
        const adapterEvents = await adapter();
        stats[adapterName] = adapterEvents.length;
        events.push(...adapterEvents);
        const latest = adapterEvents.reduce<string | null>((acc, event) => {
          if (!acc) return event.publishedAt;
          return new Date(event.publishedAt) > new Date(acc) ? event.publishedAt : acc;
        }, null);
        lastPublishedAtByAdapter[adapterName] = latest;
      } catch (error) {
        stats[adapterName] = 0;
        console.error(`Adapter failed: ${adapterName}`, error);
      }
    })
  );

  return { events, stats, lastPublishedAtByAdapter };
}
