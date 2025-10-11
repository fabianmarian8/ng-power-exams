import { Dot } from 'lucide-react';
import type { OutageItem } from '@/lib/outages-types';
import { fromLagosISO, lagosNow } from '@shared/luxon';

interface OutageTimelineProps {
  items: OutageItem[];
}

export function OutageTimeline({ items }: OutageTimelineProps) {
  const now = lagosNow();
  const sorted = [...items]
    .map((item) => ({
      item,
      start: fromLagosISO(item.start ?? item.plannedWindow?.start),
      end: fromLagosISO(item.end ?? item.plannedWindow?.end)
    }))
    .filter((entry) => entry.start && entry.start > now)
    .sort((a, b) => a.start!.toMillis() - b.start!.toMillis())
    .slice(0, 6);

  if (sorted.length === 0) {
    return null;
  }

  const maxDuration = Math.max(
    ...sorted.map(({ start, end }) => {
      if (!start || !end) {
        return 2;
      }
      return Math.max(1, end.diff(start, 'hours').hours || 2);
    })
  );

  return (
    <div className="rounded-xl border bg-muted/40 p-4">
      <div className="grid gap-4 md:grid-cols-2">
        {sorted.map(({ item, start, end }) => {
          const duration = start && end ? Math.max(1, end.diff(start, 'hours').hours) : 2;
          const height = 40 + (duration / maxDuration) * 60;

          return (
            <div key={item.id} className="flex gap-3">
              <div className="relative flex w-3 flex-col items-center">
                <span className="flex h-3 w-3 items-center justify-center rounded-full bg-primary" />
                <span className="flex-1 w-px bg-primary/40" style={{ minHeight: `${height}px` }} />
              </div>
              <div className="flex-1 rounded-lg bg-background px-4 py-3 shadow-sm">
                <p className="text-xs uppercase text-muted-foreground">{start ? start.toFormat('dd MMM, HH:mm') : 'TBC'}</p>
                <p className="font-medium leading-tight">{item.title}</p>
                {item.affectedAreas?.length ? (
                  <p className="mt-1 text-xs text-muted-foreground">{item.affectedAreas.slice(0, 3).join(', ')}</p>
                ) : null}
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <Dot className="h-4 w-4" />
                  <span>
                    {start && end ? `${start.toFormat('HH:mm')} – ${end.toFormat('HH:mm')}` : 'Duration pending'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
