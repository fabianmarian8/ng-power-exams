import { useMemo } from 'react';
import { DateTime } from 'luxon';
import { AlertTriangle, RefreshCw, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import type { OutageItem } from '@/lib/outages-types';

const TZ = 'Africa/Lagos';

interface LiveBoardProps {
  items: OutageItem[];
}

function isNew(item: OutageItem): boolean {
  const published = DateTime.fromISO(item.publishedAt, { zone: TZ });
  if (!published.isValid) return false;
  return DateTime.now().setZone(TZ).diff(published, 'hours').hours <= 24;
}

function statusBadge(item: OutageItem) {
  if (item.status === 'RESTORED') {
    return (
      <Badge className="bg-emerald-500 text-white flex items-center gap-1">
        <RefreshCw className="h-3.5 w-3.5" /> Restored
      </Badge>
    );
  }
  return (
    <Badge className="bg-warning-orange text-white flex items-center gap-1">
      <AlertTriangle className="h-3.5 w-3.5" /> Live outage
    </Badge>
  );
}

export function LiveBoard({ items }: LiveBoardProps) {
  const { t } = useLanguage();
  const sorted = useMemo(
    () =>
      [...items]
        .sort((a, b) => new Date(b.publishedAt).valueOf() - new Date(a.publishedAt).valueOf())
        .slice(0, 12),
    [items]
  );

  if (sorted.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">{t('outages.live.title', 'Live outage reports')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('outages.live.subtitle', 'Real-time fault, restoration and emergency updates from DISCOs and media.')}
          </p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sorted.map((item) => {
          const published = DateTime.fromISO(item.publishedAt).setZone(TZ);
          return (
            <Card key={item.id} className="flex h-full flex-col justify-between border-l-4 border-l-warning-orange">
              <CardHeader className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="flex items-center gap-1 text-xs uppercase">
                    <Zap className="h-3 w-3" /> {item.sourceName ?? item.source}
                  </Badge>
                  {statusBadge(item)}
                  {isNew(item) && <Badge className="bg-emerald-500 text-white">NEW</Badge>}
                  {item.verifiedBy === 'MEDIA' ? (
                    <Badge variant="outline">Reported by media</Badge>
                  ) : item.verifiedBy && item.verifiedBy !== 'UNKNOWN' ? (
                    <Badge variant="outline">Verified by {item.verifiedBy}</Badge>
                  ) : null}
                </div>
                <CardTitle className="text-lg leading-tight">{item.title}</CardTitle>
                {item.summary && <p className="text-sm text-muted-foreground">{item.summary}</p>}
              </CardHeader>
              <CardContent className="space-y-3">
                {item.affectedAreas?.length ? (
                  <p className="text-xs text-muted-foreground">
                    {item.affectedAreas.slice(0, 4).join(', ')}
                    {item.affectedAreas.length > 4 ? '…' : ''}
                  </p>
                ) : null}
                <div className="text-xs text-muted-foreground">
                  {t('outages.live.publishedAt', 'Published')}: {published.isValid ? published.toFormat('dd MMM, HH:mm') : 'TBC'}
                </div>
                {item.officialUrl && (
                  <a
                    href={item.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-primary underline"
                  >
                    {t('outages.live.openSource', 'Open official update')}
                  </a>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
