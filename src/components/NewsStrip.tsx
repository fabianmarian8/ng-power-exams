import { ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNews } from '@/hooks/useNews';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatNewsDateTime } from '@/lib/utils';
import type { NewsDomain } from '@/shared/types';

interface NewsStripProps {
  domain: NewsDomain;
  max?: number;
}

export function NewsStrip({ domain, max = 3 }: NewsStripProps) {
  const { items, isLoading } = useNews();
  const { t } = useLanguage();
  const domainItems = items.filter((item) => item.domain === domain);
  const official = domainItems.filter((item) => item.tier === 'OFFICIAL');
  const media = domainItems.filter((item) => item.tier === 'MEDIA');
  const prioritized = [...official, ...media.filter((item) => !official.some((off) => off.id === item.id))];
  const displayed = prioritized.slice(0, max);
  const isPower = domain === 'POWER';
  const heading = domain === 'EXAMS' ? t('news.latestExamUpdates') : t('news.latestPowerUpdates');

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{heading}</h3>
        {isLoading && <span className="text-xs text-muted-foreground">Načítavam…</span>}
      </div>
      {displayed.length === 0 ? (
        <p className="text-sm text-muted-foreground">No recent updates yet.</p>
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
                </div>
                <CardTitle className="text-base leading-tight">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0 text-sm">
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
