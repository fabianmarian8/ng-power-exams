import { eko } from './eko';
import { ikeja } from './ikeja';
import { kaduna } from './kaduna';
import { tcn } from './tcn';
import type { AdapterContext } from './types';
import type { OutageEvent } from '../../../src/lib/outages-types';

type AdapterName = 'tcn' | 'ikeja' | 'eko' | 'kaduna';

interface AdapterResult {
  events: OutageEvent[];
  stats: Record<AdapterName, number>;
}

export async function fromAdapters(ctx: AdapterContext): Promise<AdapterResult> {
  const adapters: Record<AdapterName, () => Promise<OutageEvent[]>> = {
    tcn: () => tcn(ctx),
    ikeja: () => ikeja(ctx),
    eko: () => eko(ctx),
    kaduna: () => kaduna(ctx)
  };

  const stats: Record<AdapterName, number> = {
    tcn: 0,
    ikeja: 0,
    eko: 0,
    kaduna: 0
  };

  const events: OutageEvent[] = [];

  await Promise.all(
    Object.entries(adapters).map(async ([name, adapter]) => {
      const adapterName = name as AdapterName;
      try {
        const adapterEvents = await adapter();
        stats[adapterName] = adapterEvents.length;
        events.push(...adapterEvents);
      } catch (error) {
        stats[adapterName] = 0;
        console.error(`Adapter failed: ${adapterName}`, error);
      }
    })
  );

  return { events, stats };
}
