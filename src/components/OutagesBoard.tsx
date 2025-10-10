import { useMemo, useState } from 'react';
import { DateTime } from 'luxon';
import { differenceInCalendarDays } from 'date-fns';
import { CalendarPlus, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useOutages, selectPlanned, type PlannedRange } from '@/hooks/useOutages';
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

const TIMEZONE = 'Africa/Lagos';

function formatDateTime(iso: string | undefined): string {
  if (!iso) return 'Neznámy čas';
  const dt = DateTime.fromISO(iso, { zone: TIMEZONE });
  if (!dt.isValid) return 'Neznámy čas';
  return dt.toFormat('dd LLL yyyy, HH:mm');
}

function formatScheduledRange(startIso?: string, endIso?: string): string | null {
  const start = startIso ? DateTime.fromISO(startIso, { zone: TIMEZONE }) : null;
  const end = endIso ? DateTime.fromISO(endIso, { zone: TIMEZONE }) : null;

  if (start?.isValid && end?.isValid) {
    if (start.hasSame(end, 'day')) {
      return `${start.toFormat('dd LLL yyyy, HH:mm')} – ${end.toFormat('HH:mm')}`;
    }
    return `${start.toFormat('dd LLL yyyy, HH:mm')} – ${end.toFormat('dd LLL yyyy, HH:mm')}`;
  }

  if (start?.isValid) {
    return start.toFormat('dd LLL yyyy, HH:mm');
  }

  if (end?.isValid) {
    return end.toFormat('dd LLL yyyy, HH:mm');
  }

  return null;
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

function isPlannedOngoing(item: OutageItem, now: DateTime) {
  if (item.status !== 'PLANNED' || !item.plannedWindow?.start) return false;
  const start = DateTime.fromISO(item.plannedWindow.start, { zone: TIMEZONE });
  if (!start.isValid) return false;
  const end = item.plannedWindow.end
    ? DateTime.fromISO(item.plannedWindow.end, { zone: TIMEZONE })
    : null;
  if (end?.isValid) {
    return start <= now && now <= end;
  }
  return start <= now;
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
  addToCalendarLabel,
  scheduledLabel,
  noScheduleLabel,
  publishedLabel
}: {
  item: OutageItem;
  ongoing: boolean;
  plannedLabel: string;
  ongoingLabel: string;
  officialSourceLabel: string;
  addToCalendarLabel: string;
  scheduledLabel: string;
  noScheduleLabel: string;
  publishedLabel: string;
}) {
  const windowStart = item.plannedWindow?.start;
  const windowEnd = item.plannedWindow?.end;
  const areas = item.affectedAreas ?? [];
  const calendarLink = buildCalendarLink(item);
  const scheduledRange = formatScheduledRange(windowStart, windowEnd);

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
        <div className="space-y-1 text-sm text-muted-foreground">
          {scheduledRange ? (
            <div>
              <span className="font-medium text-foreground">{scheduledLabel}</span>{' '}
              <span>{scheduledRange}</span>
            </div>
          ) : (
            <Badge variant="outline" className="bg-muted text-muted-foreground">
              {noScheduleLabel}
            </Badge>
          )}
          <div className="text-xs text-muted-foreground">
            {publishedLabel} {formatDateTime(item.publishedAt)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
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
    : t('news.noOfficialUpdateYet', 'No official update yet');
  const awaitingPowerUpdate = latestPowerOfficial
    ? differenceInCalendarDays(new Date(), new Date(latestPowerOfficial)) > 14
    : false;
  const [plannedFilter, setPlannedFilter] = useState<PlannedRange>('next7');

  const filteredPlanned = useMemo(() => selectPlanned(planned, plannedFilter), [planned, plannedFilter]);
  const now = DateTime.now().setZone(TIMEZONE);

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
              variant={plannedFilter === 'next7' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPlannedFilter('next7')}
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
                ongoing={isPlannedOngoing(item, now)}
                plannedLabel={t('badge.planned', 'Plánovaná odstávka')}
                ongoingLabel={t('badge.ongoing', 'Prebieha')}
                officialSourceLabel={t('common.officialSource', 'Oficiálny zdroj')}
                addToCalendarLabel={t('cta.addToCalendar', 'Pridať do kalendára')}
                scheduledLabel={t('plannedOutages.scheduledLabel', 'Scheduled:')}
                noScheduleLabel={t('plannedOutages.noScheduleProvided', 'No schedule provided')}
                publishedLabel={t('plannedOutages.publishedLabel', 'Published:')}
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
