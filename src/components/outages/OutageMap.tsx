import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';
import type { OutageItem } from '@/lib/outages-types';

interface OutageMapProps {
  outages: OutageItem[];
}

interface LocationGroup {
  location: string;
  outages: OutageItem[];
  planned: number;
  live: number;
  restored: number;
}

export function OutageMap({ outages }: OutageMapProps) {
  const locationGroups = useMemo(() => {
    const groups = new Map<string, LocationGroup>();

    outages.forEach((outage) => {
      const locations = outage.affectedAreas || ['Unknown Location'];
      
      locations.forEach((location) => {
        if (!groups.has(location)) {
          groups.set(location, {
            location,
            outages: [],
            planned: 0,
            live: 0,
            restored: 0
          });
        }

        const group = groups.get(location)!;
        group.outages.push(outage);

        if (outage.status === 'PLANNED') group.planned++;
        else if (outage.status === 'RESTORED') group.restored++;
        else group.live++;
      });
    });

    return Array.from(groups.values()).sort((a, b) => 
      (b.planned + b.live) - (a.planned + a.live)
    );
  }, [outages]);

  if (locationGroups.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Outages by Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No location data available for current outages.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Outages by Location
          </CardTitle>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-full bg-blue-500" />
              <span>Planned</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <span>Live</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span>Restored</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {locationGroups.map((group) => (
            <Card key={group.location} className="border-l-4 border-l-primary">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <CardTitle className="text-base">{group.location}</CardTitle>
                  </div>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {group.outages.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  {group.planned > 0 && (
                    <div className="rounded-lg bg-blue-500/10 p-2">
                      <div className="text-lg font-bold text-blue-600">{group.planned}</div>
                      <div className="text-xs text-muted-foreground">Planned</div>
                    </div>
                  )}
                  {group.live > 0 && (
                    <div className="rounded-lg bg-red-500/10 p-2">
                      <div className="text-lg font-bold text-red-600">{group.live}</div>
                      <div className="text-xs text-muted-foreground">Live</div>
                    </div>
                  )}
                  {group.restored > 0 && (
                    <div className="rounded-lg bg-green-500/10 p-2">
                      <div className="text-lg font-bold text-green-600">{group.restored}</div>
                      <div className="text-xs text-muted-foreground">Restored</div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {group.outages.slice(0, 2).map((outage) => (
                    <div
                      key={outage.id}
                      className="rounded border bg-muted/50 p-2 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="font-medium leading-tight line-clamp-2">
                            {outage.title}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {outage.sourceName || outage.source}
                          </div>
                        </div>
                        <Badge
                          variant={
                            outage.status === 'PLANNED'
                              ? 'secondary'
                              : outage.status === 'RESTORED'
                              ? 'default'
                              : 'destructive'
                          }
                          className="shrink-0 text-xs"
                        >
                          {outage.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {group.outages.length > 2 && (
                    <div className="text-center text-xs text-muted-foreground">
                      +{group.outages.length - 2} more
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
