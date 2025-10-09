import { eko } from './eko';
import { ikeja } from './ikeja';
import { kaduna } from './kaduna';
import { tcn } from './tcn';
import type { AdapterContext } from './types';
import type { OutageEvent } from '../../../src/lib/outages-types';

export async function fromAdapters(ctx: AdapterContext): Promise<OutageEvent[]> {
  const results = await Promise.allSettled([
    tcn(ctx),
    ikeja(ctx),
    eko(ctx),
    kaduna(ctx)
  ]);

  return results.flatMap((result) => (result.status === 'fulfilled' ? result.value : []));
}
