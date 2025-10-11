import { ExternalLink, Radio } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { OutageItem } from '@/lib/outages-types';
import { useLanguage } from '@/contexts/LanguageContext';
import { fromLagosISO } from '@shared/luxon';

interface NationalGridCardProps {
  item?: OutageItem;
}

export function NationalGridCard({ item }: NationalGridCardProps) {
  const { t } = useLanguage();
  const published = item ? fromLagosISO(item.publishedAt) : null;

  return (
    <Card className="border-primary/40 bg-primary/5">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Radio className="h-5 w-5 text-primary" />
            {t('outages.grid.title', 'National grid status (TCN)')}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {item
              ? item.summary ?? item.title
              : t('outages.grid.noUpdate', 'No fresh bulletin from TCN yet. Check official feed below.')}
          </p>
          {item && published?.isValid && (
            <p className="text-xs text-muted-foreground">
              {t('outages.grid.lastUpdate', 'Last update')}: {published.toFormat('dd MMM, HH:mm')}
            </p>
          )}
        </div>
        <Button asChild variant="outline" className="gap-2">
          <a href="https://www.tcn.org.ng/category/public-notice/" target="_blank" rel="noopener noreferrer">
            {t('outages.grid.openFeed', 'Open TCN public notices')} <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </CardHeader>
      {item && (
        <CardContent className="space-y-2 text-sm">
          <p className="font-medium">{item.title}</p>
          {item.officialUrl && (
            <a
              href={item.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              {t('outages.grid.readBulletin', 'Read TCN bulletin')}
            </a>
          )}
        </CardContent>
      )}
    </Card>
  );
}
