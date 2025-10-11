import { useMemo, useState } from 'react';
import { CalendarPlus, CalendarClock, MapPin, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import type { OutageItem } from '@/lib/outages-types';
import { buildICS } from '@/lib/ics';
import { selectPlanned, type PlannedRange } from '@/hooks/useOutages';
import { OutageTimeline } from './OutageTimeline';
import { nowLagos, toLagos } from '@/shared/luxon';

interface PlannedBoardProps {
  items: OutageItem[];
  lastUpdated?: string;
}

const RANGE_OPTIONS: Array<{ label: string; value: PlannedRange }> = [
  { label: 'Today', value: 'today' },
  { label: 'Next 7 days', value: 'next7' },
  { label: 'All', value: 'all' }
];

function formatDateRange(item: OutageItem, t: (key: string, fallback: string) => string): string {
  const startIso = item.start ?? item.plannedWindow?.start;
  const endIso = item.end ?? item.plannedWindow?.end;
  if (!startIso && !endIso) {
    return t('outages.planned.unknownWindow', 'Schedule pending');
  }
  const start = startIso ? toLagos(startIso) : null;
  const end = endIso ? toLagos(endIso) : null;

  if (start?.isValid && end?.isValid) {
    if (start.hasSame(end, 'day')) {
      return `${start.toFormat('dd MMM, HH:mm')} – ${end.toFormat('HH:mm')}`;
    }
    return `${start.toFormat('dd MMM, HH:mm')} – ${end.toFormat('dd MMM, HH:mm')}`;
  }

  if (start?.isValid) {
    return start.toFormat('dd MMM, HH:mm');
  }

  if (end?.isValid) {
    return end.toFormat('dd MMM, HH:mm');
  }

  return t('outages.planned.unknownWindow', 'Schedule pending');
}

function isNewItem(item: OutageItem): boolean {
  const published = toLagos(item.publishedAt);
  if (!published || !published.isValid) return false;
  return nowLagos().diff(published, 'hours').hours <= 24;
}

function VerifiedBadge({ item }: { item: OutageItem }) {
  if (item.verifiedBy === 'MEDIA') {
    return <Badge variant="secondary">Reported by media</Badge>;
  }
  if (!item.verifiedBy || item.verifiedBy === 'UNKNOWN') {
    return null;
  }
  return (
    <Badge variant="outline" className="uppercase tracking-tight">
      Verified by {item.verifiedBy}
    </Badge>
  );
}

function ConfidenceTag({ item }: { item: OutageItem }) {
  if (typeof item.confidence !== 'number') return null;
  const percent = Math.round(item.confidence * 100);
  return (
    <Badge variant="outline" className="border-primary/40 text-primary">
      {percent}% confidence
    </Badge>
  );
}

function AreaChips({ areas }: { areas?: string[] }) {
  if (!areas?.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {areas.map((area) => (
        <Badge key={area} variant="secondary" className="flex items-center gap-1 text-xs">
          <MapPin className="h-3 w-3" />
          {area}
        </Badge>
      ))}
    </div>
  );
}

export function PlannedBoard({ items, lastUpdated }: PlannedBoardProps) {
  const { t } = useLanguage();
  const [range, setRange] = useState<PlannedRange>('next7');

  const filtered = useMemo(() => selectPlanned(items, range), [items, range]);
  const timelineItems = useMemo(() => selectPlanned(items, 'next7'), [items]);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">{t('outages.planned.title', 'Planned outages')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('outages.planned.subtitle', 'Official maintenance windows shared by DISCOs and TCN.')}
          </p>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground">
              {t('outages.planned.lastUpdated', 'Last updated')}: {toLagos(lastUpdated)?.toFormat('dd MMM HH:mm')}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 rounded-full border bg-background/60 p-1 shadow-sm">
          {RANGE_OPTIONS.map((option) => (
            <Button
              key={option.value}
              size="sm"
              variant={range === option.value ? 'default' : 'ghost'}
              className="rounded-full px-4"
              onClick={() => setRange(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      <OutageTimeline items={timelineItems} />

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {t('outages.planned.empty', 'No scheduled outages in this window.')}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => {
            const startIso = item.start ?? item.plannedWindow?.start;
            const endIso = item.end ?? item.plannedWindow?.end;
            const icsContent = startIso
              ? buildICS({
                  title: item.title,
                  description: item.summary,
                  location: item.affectedAreas?.join(', '),
                  start: startIso,
                  end: endIso ?? undefined,
                })
              : null;
            const calendarUrl = icsContent
              ? `data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`
              : null;
            const isNew = isNewItem(item);
            const scheduleLabel = formatDateRange(item, t);

            return (
              <Card key={item.id} className="flex h-full flex-col justify-between">
                <CardHeader className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs uppercase">
                      {item.sourceName ?? item.source}
                    </Badge>
                    {isNew && <Badge className="bg-emerald-500 text-white">NEW</Badge>}
                    <VerifiedBadge item={item} />
                    <ConfidenceTag item={item} />
                  </div>
                  <CardTitle className="text-lg leading-tight">{item.title}</CardTitle>
                  {item.summary && <p className="text-sm text-muted-foreground">{item.summary}</p>}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <CalendarClock className="h-4 w-4 text-primary" />
                    <span>{scheduleLabel}</span>
                  </div>
                  {item.affectedAreas && item.affectedAreas.length > 0 && <AreaChips areas={item.affectedAreas} />}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>
                        {t('outages.planned.published', 'Published')}{' '}
                        {toLagos(item.publishedAt)?.toFormat('dd MMM, HH:mm')}
                      </span>
                    </div>
                    {calendarUrl && (
                      <Button asChild size="sm" variant="outline" className="gap-2">
                        <a href={calendarUrl} download={`outage-${item.id}.ics`}>
                          <CalendarPlus className="h-4 w-4" />
                          {t('outages.planned.addToCalendar', 'Add to calendar')}
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
