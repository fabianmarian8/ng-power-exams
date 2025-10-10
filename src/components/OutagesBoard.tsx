import { useMemo, useState } from 'react';
import { DateTime } from 'luxon';
import { differenceInCalendarDays } from 'date-fns';
import { CalendarPlus, ExternalLink, Zap, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useOutages, selectPlanned, type PlannedRange } from '@/hooks/useOutages';
import { useNews } from '@/hooks/useNews';
import type { OutageItem, OutageSource } from '@/lib/outages-types';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatNewsDateTime } from '@/lib/utils';
import { NewsStrip } from '@/components/NewsStrip';
import { LastVerifiedLabel } from '@/components/LastVerifiedLabel';
import { OutagesFilter } from '@/components/OutagesFilter';

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

function formatDateTime(iso: string | undefined, t: (key: string, fallback: string) => string): string {
  if (!iso) return t('common.unknownTime', 'Unknown time');
  const dt = DateTime.fromISO(iso, { zone: TIMEZONE });
  if (!dt.isValid) return t('common.unknownTime', 'Unknown time');
  return dt.toFormat('dd MMM yyyy, HH:mm');
}

function formatScheduledRange(startIso?: string, endIso?: string): string | null {
  const start = startIso ? DateTime.fromISO(startIso, { zone: TIMEZONE }) : null;
  const end = endIso ? DateTime.fromISO(endIso, { zone: TIMEZONE }) : null;

  if (start?.isValid && end?.isValid) {
    if (start.hasSame(end, 'day')) {
      return `${start.toFormat('dd MMM yyyy, HH:mm')} – ${end.toFormat('HH:mm')}`;
    }
    return `${start.toFormat('dd MMM yyyy, HH:mm')} – ${end.toFormat('dd MMM yyyy, HH:mm')}`;
  }

  if (start?.isValid) {
    return start.toFormat('dd MMM yyyy, HH:mm');
  }

  if (end?.isValid) {
    return end.toFormat('dd MMM yyyy, HH:mm');
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

function PlannedCard({ item, t }: { item: OutageItem; t: (key: string, fallback?: string) => string }) {
  const now = DateTime.now().setZone(TIMEZONE);
  const ongoing = isPlannedOngoing(item, now);
  const hasSchedule = !!item.plannedWindow?.start;
  const calendarLink = buildCalendarLink(item);
  
  const SourceIcon = item.source === 'TCN' ? Radio : Zap;
  const borderColor = item.source === 'TCN' ? 'border-l-blue-500' : 'border-l-orange-500';

  return (
    <Card className={`h-full hover:shadow-lg transition-shadow border-l-4 ${borderColor}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <SourceIcon className="h-3 w-3" />
              {getSourceBadgeLabel(item)}
            </Badge>
            <Badge variant="outline" className="bg-nigeria-green-light text-nigeria-green-dark">
              {t('badge.planned', 'Planned')}
            </Badge>
            {ongoing && (
              <Badge variant="default" className="bg-warning-orange text-white animate-pulse-glow">
                {t('badge.ongoing', 'Ongoing')}
              </Badge>
            )}
            {getVerificationBadge(item)}
          </div>
        </div>
        <CardTitle className="text-base leading-tight">{item.title}</CardTitle>
        {hasSchedule && (
          <div className="rounded-md bg-muted/50 p-3 text-sm">
            <p className="font-medium">{t('plannedOutages.scheduled', 'Scheduled')}:</p>
            <p className="text-muted-foreground mt-1">{formatScheduledRange(item.plannedWindow?.start, item.plannedWindow?.end)}</p>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {item.summary && <p className="text-muted-foreground">{item.summary}</p>}

        {item.affectedAreas && item.affectedAreas.length > 0 && (
          <div className="rounded-md bg-muted/30 p-3 text-sm">
            <p className="font-medium">{t('outagesBoard.affectedAreas', 'Affected Areas')}:</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {item.affectedAreas.map((area) => (
                <Badge key={area} variant="outline" className="rounded-full">
                  {area}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <CardDescription>{t('outagesBoard.published', 'Published')} {formatDateTime(item.publishedAt, t)}</CardDescription>

        <div className="flex flex-col gap-2">
        {item.officialUrl && (
          <Button variant="outline" size="sm" asChild className="w-full">
            <a href={item.officialUrl} target="_blank" rel="noopener noreferrer">
              {t('common.officialSource', 'Official Source')}
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        )}

        {calendarLink && (
          <Button variant="default" size="sm" asChild className="w-full">
            <a href={calendarLink} download={`outage-${item.id}.ics`}>
              {t('cta.addToCalendar', 'Add to Calendar')}
              <CalendarPlus className="ml-2 h-4 w-4" />
            </a>
          </Button>
        )}
        </div>
      </CardContent>
    </Card>
  );
}

function LiveCard({ item, t }: { item: OutageItem; t: (key: string, fallback?: string) => string }) {
  const SourceIcon = item.source === 'TCN' ? Radio : Zap;
  const borderColor = 
    item.status === 'UNPLANNED' ? 'border-l-urgent-red' :
    item.status === 'RESTORED' ? 'border-l-nigeria-green' :
    item.source === 'TCN' ? 'border-l-blue-500' : 'border-l-orange-500';
  
  return (
    <Card className={`h-full hover:shadow-lg transition-shadow border-l-4 ${borderColor}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <SourceIcon className="h-3 w-3" />
              {getSourceBadgeLabel(item)}
            </Badge>
            {item.status === 'UNPLANNED' && (
              <Badge className="bg-urgent-red text-white">
                {t('badge.unplanned', 'Unplanned')}
              </Badge>
            )}
            {item.status === 'RESTORED' && (
              <Badge className="bg-nigeria-green text-white">
                {t('badge.restored', 'Restored')}
              </Badge>
            )}
            {getVerificationBadge(item)}
          </div>
        </div>
        <CardTitle className="text-base leading-tight">{item.title}</CardTitle>
        <CardDescription>{t('outagesBoard.published', 'Published')} {formatDateTime(item.publishedAt, t)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {item.summary && <p className="text-muted-foreground">{item.summary}</p>}

        {item.affectedAreas && item.affectedAreas.length > 0 && (
          <div className="rounded-md bg-muted/30 p-3 text-sm">
            <p className="font-medium">{t('outagesBoard.affectedAreas', 'Affected Areas')}:</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {item.affectedAreas.map((area) => (
                <Badge key={area} variant="outline" className="rounded-full">
                  {area}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {item.officialUrl && (
          <Button variant="outline" size="sm" asChild className="w-full">
            <a href={item.officialUrl} target="_blank" rel="noopener noreferrer">
              {t('common.officialSource', 'Official Source')}
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function OutagesBoard() {
  const { t } = useLanguage();
  const { all, planned, active, restored, lastIngest, isLoading, error, isRefetching } = useOutages();
  const [plannedFilter, setPlannedFilter] = useState<PlannedRange>('next7');
  
  const [selectedSources, setSelectedSources] = useState<OutageSource[]>([
    'TCN', 'EKEDC', 'IKEJA', 'KADUNA', 'JED', 'AEDC', 'IBEDC'
  ]);
  const [searchQuery, setSearchQuery] = useState('');

  const availableSources = useMemo(() => {
    const sources = new Set<OutageSource>();
    [...planned, ...active, ...restored].forEach((item) => sources.add(item.source));
    return Array.from(sources);
  }, [planned, active, restored]);

  const filteredPlanned = useMemo(() => {
    let items = selectPlanned(planned, plannedFilter);
    
    items = items.filter((item) => selectedSources.includes(item.source));
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.summary?.toLowerCase().includes(query) ||
          item.affectedAreas?.some((area) => area.toLowerCase().includes(query))
      );
    }
    
    return items;
  }, [planned, plannedFilter, selectedSources, searchQuery]);

  const filteredLive = useMemo(() => {
    let items = [...active, ...restored];
    
    items = items.filter((item) => selectedSources.includes(item.source));
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.summary?.toLowerCase().includes(query) ||
          item.affectedAreas?.some((area) => area.toLowerCase().includes(query))
      );
    }
    
    return items;
  }, [active, restored, selectedSources, searchQuery]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-8">
        <header className="space-y-4">
          <h2 className="text-2xl font-semibold">{t('outagesBoard.liveOverview', 'Live Outages Overview')}</h2>
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
        </header>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-8">
        <Alert>
          <AlertTitle>Error loading outages</AlertTitle>
          <AlertDescription>
            {t('outagesBoard.errorLoading', 'Failed to load outage data. Please try again later.')}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <header className="space-y-4">
          <h2 className="text-2xl font-semibold">{t('outagesBoard.liveOverview', 'Live Outages Overview')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('outagesBoard.dataDescription', 'Data is sourced from official TCN and distribution company announcements. To report a new outage, use NERC\'s PORS app.')}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('outagesBoard.lastIngest', 'Last ingest')}: {lastIngest ? formatNewsDateTime(lastIngest) : t('outagesBoard.awaitingFirstData', 'Awaiting first data import…')}
            {isRefetching && ` ${t('outagesBoard.refreshing', '(refreshing…)')}`}
          </p>
          
          <OutagesFilter
            sources={availableSources}
            selectedSources={selectedSources}
            onSourceToggle={(source) => {
              setSelectedSources((prev) =>
                prev.includes(source)
                  ? prev.filter((s) => s !== source)
                  : [...prev, source]
              );
            }}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </header>

        <NewsStrip domain="POWER" />

        <section className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">{t('plannedOutages.header', 'Planned Outages')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('outagesBoard.scheduleInfo', 'We monitor official maintenance schedules and planned outages. Times are converted to Africa/Lagos timezone.')}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={plannedFilter === 'today' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPlannedFilter('today')}
              className="text-xs"
            >
              {t('plannedOutages.today', 'Today')}
            </Button>
            <Button
              variant={plannedFilter === 'next7' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPlannedFilter('next7')}
              className="text-xs"
            >
              {t('plannedOutages.next7Days', 'Next 7 Days')}
            </Button>
            <Button
              variant={plannedFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPlannedFilter('all')}
              className="text-xs"
            >
              {t('plannedOutages.all', 'All')}
            </Button>
          </div>

          {filteredPlanned.length === 0 ? (
            <Alert>
              <AlertTitle>{t('outagesBoard.noPlannedOutages', 'No Planned Outages')}</AlertTitle>
              <AlertDescription>
                {t('outagesBoard.noPlannedOutagesDescription', 'Currently no planned outages for the selected filter. Check the schedule later.')}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredPlanned.map((item) => (
                <PlannedCard key={item.id} item={item} t={t} />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">{t('outagesBoard.liveReports', 'Live Reports')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('outagesBoard.liveReportsDescription', 'Shows unplanned outages and confirmed power restorations directly from official channels.')}
            </p>
          </div>

          {filteredLive.length === 0 ? (
            <Alert>
              <AlertTitle>{t('outagesBoard.noNewAnnouncements', 'No New Announcements')}</AlertTitle>
              <AlertDescription>
                {t('outagesBoard.noNewAnnouncementsDescription', 'Currently no new reports from monitored sources. Check back later.')}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredLive.map((item) => (
                <LiveCard key={item.id} item={item} t={t} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default OutagesBoard;
