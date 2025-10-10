import { useMemo } from 'react';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useOutages } from '@/hooks/useOutages';
import type { OutageEvent } from '@/lib/outages-types';

const SOURCE_LABELS: Record<OutageEvent['source'], string> = {
  TCN: 'Transmission Company of Nigeria (TCN)',
  IKEDC: 'Ikeja Electric',
  EKEDC: 'Eko Electricity Distribution Company',
  KADUNA: 'Kaduna Electric',
  JED: 'Jos Electricity Distribution Plc (JED)'
};

const CATEGORY_LABELS: Record<OutageEvent['category'], string> = {
  planned: 'Plánovaná odstávka',
  unplanned: 'Neplánovaná porucha',
  restoration: 'Obnovenie dodávky',
  advisory: 'Prevádzkové obmedzenie (Band A/B)'
};

const VERIFICATION_LABELS: Record<OutageEvent['verifiedBy'], string> = {
  TCN: 'TCN',
  DisCo: 'DisCo',
  Media: 'Media',
  Community: 'Community'
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

export function OutagesBoard() {
  const { data, isLoading, error, isRefetching } = useOutages();
  const events = useMemo(() => {
    if (!data) return [];
    return [...data.events].sort(
      (a, b) => new Date(b.publishedAt).valueOf() - new Date(a.publishedAt).valueOf()
    );
  }, [data]);

  const header = (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Živý prehľad porúch</h2>
        <p className="text-sm text-muted-foreground">
          Údaje sú preberané z oficiálnych oznamov TCN a distribučných spoločností. Pre hlásenie novej poruchy použite aplikáciu PORS od NERC.
        </p>
        <div className="flex flex-col gap-2 text-xs text-muted-foreground md:flex-row md:flex-wrap">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">Posledný ingest:</span>
            <span>
              {data?.generatedAt
                ? new Date(data.generatedAt).toLocaleString()
                : 'Čakáme na prvý import údajov…'}
            </span>
            {isRefetching && <span className="text-primary">(prebieha aktualizácia…)</span>}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">Posledné hlásenie zo zdrojov:</span>
            <span>
              {data?.lastSourceUpdate
                ? new Date(data.lastSourceUpdate).toLocaleString()
                : 'Žiadne hlásenia v sledovanom období'}
            </span>
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
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        {header}
        <Card>
          <CardHeader>
            <CardTitle>Načítavam živé hlásenia…</CardTitle>
            <CardDescription>Overujeme oficiálne zdroje distribučných spoločností.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse text-sm text-muted-foreground">Prosím, čakajte…</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {header}
      {error || !data ? (
        <div className="rounded-xl bg-yellow-50 p-4 text-yellow-900">
          Data temporarily unavailable — source adapters returned no data. Please check again soon.
        </div>
      ) : events.length === 0 ? (
        <Alert>
          <AlertTitle>Žiadne nové oznámenia</AlertTitle>
          <AlertDescription>
            Aktuálne neevidujeme žiadne nové hlásenia od monitorovaných zdrojov. Sledujte nás neskôr.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {events.map((event) => (
            <Card key={event.id} className="h-full">
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{SOURCE_LABELS[event.source]}</Badge>
                  <Badge className="capitalize">{CATEGORY_LABELS[event.category]}</Badge>
                  <Badge variant="outline" className="uppercase tracking-tight">
                    Verified by {VERIFICATION_LABELS[event.verifiedBy]}
                  </Badge>
                </div>
                <CardTitle className="text-lg leading-tight">{event.title}</CardTitle>
                <CardDescription>
                  Publikované {new Date(event.publishedAt).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="whitespace-pre-line text-muted-foreground">{event.description}</p>
                {event.areas.length > 0 && (
                  <div>
                    <p className="font-medium">Dotknuté oblasti</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {event.areas.map((area) => (
                        <Badge key={area} variant="outline" className="rounded-full">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {event.window && (event.window.start || event.window.end) && (
                  <div className="space-y-1">
                    <p className="font-medium">Odhadované okno</p>
                    <p className="text-muted-foreground">
                      {event.window.start ? new Date(event.window.start).toLocaleString() : 'Neznámy začiatok'}
                      {' '}–{' '}
                      {event.window.end ? new Date(event.window.end).toLocaleString() : 'Neznámy koniec'}
                    </p>
                  </div>
                )}
                <Button asChild variant="ghost" className="px-0 text-primary hover:text-primary">
                  <a href={event.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2">
                    Oficiálny zdroj
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default OutagesBoard;
