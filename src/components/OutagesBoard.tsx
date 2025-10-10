import { useMemo, useState } from 'react';
import { differenceInCalendarDays } from 'date-fns';
import { CalendarPlus, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useOutages } from '@/hooks/useOutages';
import { useNews } from '@/hooks/useNews';
import type { OutageItem } from '@/lib/outages-types';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatNewsDateTime } from '@/lib/utils';
import { NewsStrip } from '@/components/NewsStrip';
import { LastVerifiedLabel } from '@/components/LastVerifiedLabel';

const SOURCE_LABELS: Partial<Record<OutageItem['source'], string>> = {
  TCN: 'Transmission Company of Nigeria (TCN)',
  IKEJA: 'Ikeja Electric',
  EKEDC: 'Eko Electricity Distribution Company',
  KADUNA: 'Kaduna Electric',
  JED: 'Jos Electricity Distribution Plc (JED)',
  AEDC: 'Abuja Electricity Distribution Company (AEDC)',
  IBEDC: 'Ibadan Electricity Distribution Company'
};

const VERIFICATION_LABELS: Record<string, string> = {
  DISCO: 'DISCO',
  TCN: 'TCN',
  MEDIA: 'MEDIA',
  COMMUNITY: 'COMMUNITY',
  UNKNOWN: 'UNKNOWN'
};

const PORS_LINKS = [
  {
    label: 'PORS pre iOS',
    href: 'https://apps.apple.com/ng/app/nerc-pors/id6473401558'
  },
  {
    label: 'PORS pre Android',
    href: 'https://play.google.com/store/apps/details?id=com.nerc.pors'
  }
];

type PlannedFilter = 'today' | 'sevenDays' | 'all';

function formatDateTime(iso: string | undefined): string {
  if (!iso) return 'Neznámy čas';
  const date = new Date(iso);
  if (Number.isNaN(date.valueOf())) return 'Neznámy čas';
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getSourceBadgeLabel(item: OutageItem): string {
  return item.sourceName ?? SOURCE_LABELS[item.source] ?? item.source;
}

function getVerificationBadge(item: OutageItem) {
  if (!item.verifiedBy) return null;
  const label = VERIFICATION_LABELS[item.verifiedBy] ?? item.verifiedBy;
  return (
    <Badge variant="outline" className="uppercase tracking-tight">
      Verified by {label}
    </Badge>
  );
}

function isPlannedOngoing(item: OutageItem, now: Date) {
  if (item.status !== 'PLANNED') return false;
  const start = item.plannedWindow?.start ? new Date(item.plannedWindow.start) : undefined;
  const end = item.plannedWindow?.end ? new Date(item.plannedWindow.end) : undefined;
  if (start && end) {
    return start <= now && now <= end;
  }
  if (start && !end) {
    return start <= now;
  }
  return false;
}

function getWindowReference(item: OutageItem): { start?: Date; end?: Date } {
  const start = item.plannedWindow?.start ? new Date(item.plannedWindow.start) : undefined;
  const end = item.plannedWindow?.end ? new Date(item.plannedWindow.end) : undefined;
  return { start, end };
}

function matchesPlannedFilter(item: OutageItem, filter: PlannedFilter, now: Date): boolean {
  if (filter === 'all') return true;
  const { start, end } = getWindowReference(item);
  const reference = start ?? end;

  if (filter === 'today') {
    if (start && end && now >= start && now <= end) {
      return true;
    }
    if (!reference) return false;
    return reference.toDateString() === now.toDateString();
  }

  if (filter === 'sevenDays') {
    const windowEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    if (end && end < now) {
      return false;
    }
    if (!reference) {
      return true;
    }
    return reference >= now && reference <= windowEnd;
  }

  return true;
}

function toICalDate(iso: string): string {
  const date = new Date(iso);
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function buildCalendarLink(item: OutageItem): string | null {
  const windowStart = item.plannedWindow?.start ?? item.plannedWindow?.end ?? item.publishedAt;
  if (!windowStart) return null;
  const startIso = new Date(windowStart).toISOString();
  const endIso = item.plannedWindow?.end
    ? new Date(item.plannedWindow.end).toISOString()
    : new Date(new Date(windowStart).getTime() + 2 * 60 * 60 * 1000).toISOString();

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//NaijaInfo//PlannedOutages//EN',
    'BEGIN:VEVENT',
    `UID:${item.id}@naijainfo.ng`,
    `DTSTAMP:${toICalDate(new Date().toISOString())}`,
    `DTSTART:${toICalDate(startIso)}`,
    `DTEND:${toICalDate(endIso)}`,
    `SUMMARY:${(item.title ?? '').replace(/\n/g, ' ')}`,
    `DESCRIPTION:${(item.summary ?? item.title ?? '').replace(/\n/g, ' ')}`,
    item.officialUrl ? `URL:${item.officialUrl}` : undefined,
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean);

  return `data:text/calendar;charset=utf-8,${encodeURIComponent(lines.join('\r\n'))}`;
}

function PlannedCard({
  item,
  ongoing,
  plannedLabel,
  ongoingLabel,
  officialSourceLabel,
  addToCalendarLabel
}: {
  item: OutageItem;
  ongoing: boolean;
  plannedLabel: string;
  ongoingLabel: string;
  officialSourceLabel: string;
  addToCalendarLabel: string;
}) {
  const windowStart = item.plannedWindow?.start;
  const windowEnd = item.plannedWindow?.end;
  const areas = item.affectedAreas ?? [];
  const calendarLink = buildCalendarLink(item);

  return (
    <Card key={item.id} className="h-full hover:shadow-lg transition-shadow">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{getSourceBadgeLabel(item)}</Badge>
          <Badge variant="outline" className="bg-nigeria-green-light text-nigeria-green-dark">
            {plannedLabel}
          </Badge>
          {ongoing && (
            <Badge variant="default" className="bg-warning-orange text-white animate-pulse-glow">
              {ongoingLabel}
            </Badge>
          )}
          {getVerificationBadge(item)}
        </div>
        <CardTitle className="text-lg leading-tight">{item.title}</CardTitle>
        <CardDescription>Publikované {formatDateTime(item.publishedAt)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {item.summary && <p className="text-muted-foreground">{item.summary}</p>}
        {(windowStart || windowEnd) && (
          <div className="grid gap-2">
            {windowStart && (
              <div className="flex gap-2 text-sm">
                <span className="font-medium text-foreground">Od:</span>
                <span>{formatDateTime(windowStart)}</span>
              </div>
            )}
            {windowEnd && (
              <div className="flex gap-2 text-sm">
                <span className="font-medium text-foreground">Do:</span>
                <span>{formatDateTime(windowEnd)}</span>
              </div>
            )}
            {!windowEnd && !windowStart && <p>Časové okno nebolo špecifikované.</p>}
          </div>
        )}
        {areas.length > 0 && (
          <div>
            <p className="font-medium">Dotknuté oblasti</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {areas.map((area) => (
                <Badge key={area} variant="outline" className="rounded-full">
                  {area}
                </Badge>
              ))}
            </div>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="ghost" className="px-0 text-primary hover:text-primary">
            <a href={item.officialUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2">
              {officialSourceLabel}
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
          {calendarLink && (
            <Button variant="outline" size="sm" asChild>
              <a href={calendarLink} download={`${item.id}.ics`} className="inline-flex items-center gap-2">
                <CalendarPlus className="h-4 w-4" />
                {addToCalendarLabel}
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function LiveCard({
  item,
  statusLabel,
  officialSourceLabel
}: {
  item: OutageItem;
  statusLabel: string;
  officialSourceLabel: string;
}) {
  const areas = item.affectedAreas ?? [];
  const isUnplanned = item.status === 'UNPLANNED';
  const isRestored = item.status === 'RESTORED';
  
  return (
    <Card key={item.id} className="h-full hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{getSourceBadgeLabel(item)}</Badge>
          <Badge className={isUnplanned ? 'bg-urgent-red text-white' : isRestored ? 'bg-nigeria-green text-white' : ''}>
            {statusLabel}
          </Badge>
          {getVerificationBadge(item)}
        </div>
        <CardTitle className="text-lg leading-tight">{item.title}</CardTitle>
        <CardDescription>Publikované {formatDateTime(item.publishedAt)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {item.summary && <p className="text-muted-foreground">{item.summary}</p>}
        {areas.length > 0 && (
          <div>
            <p className="font-medium">Dotknuté oblasti</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {areas.map((area) => (
                <Badge key={area} variant="outline" className="rounded-full">
                  {area}
                </Badge>
              ))}
            </div>
          </div>
        )}
        <Button asChild variant="ghost" className="px-0 text-primary hover:text-primary">
          <a href={item.officialUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2">
            {officialSourceLabel}
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}

export function OutagesBoard() {
  const { t } = useLanguage();
  const { data, isLoading, error, isRefetching, planned, active, restored, lastIngest } = useOutages();
  const news = useNews();
  const latestPowerOfficial = news.data.latestOfficialByDomain.POWER;
  const powerLastUpdateLabel = latestPowerOfficial
    ? formatNewsDateTime(latestPowerOfficial)
    : t('news.awaitingFirstOfficial', 'Awaiting first official update');
  const awaitingPowerUpdate = latestPowerOfficial
    ? differenceInCalendarDays(new Date(), new Date(latestPowerOfficial)) > 14
    : false;
  const [plannedFilter, setPlannedFilter] = useState<PlannedFilter>('sevenDays');

  const filteredPlanned = useMemo(() => {
    const now = new Date();
    return planned
      .filter((item) => matchesPlannedFilter(item, plannedFilter, now))
      .sort((a, b) => {
        const aRef = a.plannedWindow?.start ?? a.plannedWindow?.end ?? a.publishedAt;
        const bRef = b.plannedWindow?.start ?? b.plannedWindow?.end ?? b.publishedAt;
        const aValue = aRef ? new Date(aRef).valueOf() : Number.POSITIVE_INFINITY;
        const bValue = bRef ? new Date(bRef).valueOf() : Number.POSITIVE_INFINITY;
        return aValue - bValue;
      });
  }, [planned, plannedFilter]);

  const header = (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Živý prehľad porúch</h2>
          <p className="text-sm text-muted-foreground">
            Údaje sú preberané z oficiálnych oznamov TCN a distribučných spoločností. Pre hlásenie novej poruchy použite aplikáciu PORS od NERC.
          </p>
          <div className="flex flex-col gap-2 text-xs text-muted-foreground md:flex-row md:flex-wrap">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">Posledný ingest:</span>
              <span>{lastIngest ? formatDateTime(lastIngest) : 'Čakáme na prvý import údajov…'}</span>
              {isRefetching && <span className="text-primary">(prebieha aktualizácia…)</span>}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <LastVerifiedLabel className="text-xs text-muted-foreground" />
              <span>{powerLastUpdateLabel}</span>
              {awaitingPowerUpdate && (
                <Badge className="bg-amber-200 text-amber-900 border-amber-300">
                  {t('news.awaitingNewOfficial')}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {PORS_LINKS.map((link) => (
            <Button key={link.href} asChild variant="outline" size="sm" className="inline-flex items-center gap-2">
              <a href={link.href} target="_blank" rel="noreferrer">
                {link.label}
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          ))}
        </div>
      </div>
      <NewsStrip domain="POWER" />
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        {header}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div 
              key={i} 
              className="h-48 rounded-lg bg-gradient-to-r from-muted via-muted-foreground/10 to-muted animate-shimmer"
              style={{
                backgroundSize: '200% 100%',
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        {header}
        <div className="rounded-xl bg-yellow-50 p-4 text-yellow-900">
          Data temporarily unavailable — source adapters returned no data. Please check again soon.
        </div>
      </div>
    );
  }

  const statusLabels: Record<OutageItem['status'], string> = {
    UNPLANNED: t('badge.unplanned', 'Neplánovaná porucha'),
    RESTORED: t('badge.restored', 'Obnovenie dodávky'),
    PLANNED: t('badge.planned', 'Plánovaná odstávka')
  };

  const liveItems = [...active, ...restored];

  return (
    <div className="space-y-6">
      {header}

      <section className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-xl font-semibold">{t('plannedOutages.header', 'Plánované odstávky')}</h3>
            <p className="text-sm text-muted-foreground">
              Sledujeme oficiálne harmonogramy údržby a plánovaných odstávok. Časy sú prepočítané do časovej zóny Africa/Lagos.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={plannedFilter === 'today' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPlannedFilter('today')}
            >
              {t('plannedOutages.filter.today', 'Dnes')}
            </Button>
            <Button
              type="button"
              variant={plannedFilter === 'sevenDays' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPlannedFilter('sevenDays')}
            >
              {t('plannedOutages.filter.sevenDays', 'Najbližších 7 dní')}
            </Button>
            <Button
              type="button"
              variant={plannedFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPlannedFilter('all')}
            >
              {t('plannedOutages.filter.all', 'Všetko')}
            </Button>
          </div>
        </div>
        {filteredPlanned.length === 0 ? (
          <Alert>
            <AlertTitle>Žiadne plánované odstávky</AlertTitle>
            <AlertDescription>
              Aktuálne neevidujeme žiadne plánované odstávky pre zvolený filter. Skontrolujte harmonogram neskôr.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredPlanned.map((item) => (
              <PlannedCard
                key={item.id}
                item={item}
                ongoing={isPlannedOngoing(item, new Date())}
                plannedLabel={t('badge.planned', 'Plánovaná odstávka')}
                ongoingLabel={t('badge.ongoing', 'Prebieha')}
                officialSourceLabel={t('common.officialSource', 'Oficiálny zdroj')}
                addToCalendarLabel={t('cta.addToCalendar', 'Pridať do kalendára')}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-xl font-semibold">Živé hlásenia</h3>
          <p className="text-sm text-muted-foreground">
            Zobrazuje neplánované poruchy a potvrdené obnovenia dodávky priamo z oficiálnych kanálov.
          </p>
        </div>
        {liveItems.length === 0 ? (
          <Alert>
            <AlertTitle>Žiadne nové oznámenia</AlertTitle>
            <AlertDescription>
              Aktuálne neevidujeme žiadne nové hlásenia od monitorovaných zdrojov. Sledujte nás neskôr.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {liveItems.map((item) => (
              <LiveCard
                key={item.id}
                item={item}
                statusLabel={statusLabels[item.status]}
                officialSourceLabel={t('common.officialSource', 'Oficiálny zdroj')}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default OutagesBoard;
