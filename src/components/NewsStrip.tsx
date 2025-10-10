import { ExternalLink } from 'lucide-react';
import { differenceInCalendarDays, differenceInHours } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNews } from '@/hooks/useNews';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatNewsDateTime } from '@/lib/utils';
import type { NewsDomain } from '@/shared/types';
import { LastVerifiedLabel } from '@/components/LastVerifiedLabel';

interface NewsStripProps {
  domain: NewsDomain;
  max?: number;
}

export function NewsStrip({ domain, max = 3 }: NewsStripProps) {
  const { items, data, isLoading } = useNews();
  const { t } = useLanguage();
  const domainItems = items.filter((item) => item.domain === domain);
  const official = domainItems.filter((item) => item.tier === 'OFFICIAL');
  const media = domainItems.filter((item) => item.tier === 'MEDIA');
  const now = new Date();
  const recentMedia = media.filter((item) => differenceInCalendarDays(now, new Date(item.publishedAt)) <= 30);
  const prioritized = [
    ...official,
    ...recentMedia.filter((item) => !official.some((off) => off.id === item.id))
  ];
  const displayed = prioritized.slice(0, max);
  const isPower = domain === 'POWER';
  const heading = domain === 'EXAMS' ? t('news.latestExamUpdates') : t('news.latestPowerUpdates');
  const latestOfficial = data.latestOfficialByDomain[domain];
  const awaitingUpdate = latestOfficial
    ? differenceInCalendarDays(new Date(), new Date(latestOfficial)) > 14
    : false;
  const lastVerifiedLabel = latestOfficial
    ? formatNewsDateTime(latestOfficial)
    : t('news.noOfficialUpdateYet', 'No official update yet');

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold">{heading}</h3>
        {isLoading && <span className="text-xs text-muted-foreground">{t('news.loading', 'Loading…')}</span>}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <LastVerifiedLabel />
        <span>{lastVerifiedLabel}</span>
        {awaitingUpdate && (
          <Badge className="bg-amber-200 text-amber-900 border-amber-300">
            {t('news.awaitingNewOfficial')}
          </Badge>
        )}
      </div>
      {displayed.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('news.noRecentUpdates', 'No recent updates yet.')}</p>
      ) : (
        <div
          className={
            isPower
              ? 'flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 [&>*]:snap-start snap-x'
              : 'space-y-3'
          }
        >
          {displayed.map((item) => (
            <Card
              key={item.id}
              className={isPower ? 'min-w-[260px] shrink-0 snap-start' : 'transition-shadow hover:shadow-sm'}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={item.tier === 'OFFICIAL' ? 'default' : 'secondary'}
                      className="uppercase tracking-tight"
                    >
                      {item.tier === 'OFFICIAL' ? t('news.official') : t('news.media')}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{item.source}</span>
                  </div>
                  {differenceInHours(new Date(), new Date(item.publishedAt)) < 48 && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                      {t('news.newBadge', 'NEW')}
                    </span>
                  )}
                </div>
                <CardTitle className="text-base leading-tight">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0 text-sm">
                {item.tier === 'MEDIA' && (
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {t('news.reportedBy', { source: item.source })}
                  </p>
                )}
                {item.summary && <p className="text-muted-foreground">{item.summary}</p>}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatNewsDateTime(item.publishedAt)}</span>
                  <a
                    href={item.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    <span className="sr-only">{item.source}</span>
                    <ExternalLink className="h-4 w-4" aria-hidden />
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
