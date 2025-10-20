import { useMemo } from 'react';
import { MapContainer, TileLayer, Popup, CircleMarker } from 'react-leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';
import type { OutageItem } from '@/lib/outages-types';
import 'leaflet/dist/leaflet.css';

const NIGERIAN_CITIES_COORDS: Record<string, [number, number]> = {
  Lagos: [6.5244, 3.3792],
  Abuja: [9.0765, 7.3986],
  Kano: [12.0022, 8.592],
  Ibadan: [7.3775, 3.947],
  'Port Harcourt': [4.8156, 7.0498],
  'Benin City': [6.335, 5.6037],
  Kaduna: [10.5105, 7.4165],
  Enugu: [6.5244, 7.5105],
  Jos: [9.8965, 8.8583],
  Calabar: [4.9758, 8.3417],
  Abeokuta: [7.1475, 3.3619],
  Osogbo: [7.7667, 4.5667],
  Maiduguri: [11.8333, 13.15],
  Onitsha: [6.1667, 6.7833],
  Warri: [5.5167, 5.75],
  Ilorin: [8.5, 4.55],
  Akure: [7.2667, 5.2],
  Owerri: [5.48, 7.0333],
  Sokoto: [13.0622, 5.2339],
  Uyo: [5.0333, 7.9333],
  Aba: [5.1067, 7.3667],
  Bauchi: [10.3158, 9.8442],
  Yola: [9.2, 12.4833],
  Gombe: [10.29, 11.17]
};

interface OutageMapProps {
  outages: OutageItem[];
}

function getMarkerColor(status: string): string {
  switch (status) {
    case 'PLANNED':
      return '#3b82f6';
    case 'UNPLANNED':
      return '#ef4444';
    case 'RESTORED':
      return '#10b981';
    default:
      return '#6b7280';
  }
}

export function OutageMap({ outages }: OutageMapProps) {
  const outagesWithCoords = useMemo(() => {
    return outages
      .map((outage) => {
        const city = outage.affectedAreas?.find((area) => NIGERIAN_CITIES_COORDS[area]);

        if (!city) return null;

        return {
          ...outage,
          coords: NIGERIAN_CITIES_COORDS[city],
          city
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [outages]);

  if (outagesWithCoords.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Outage Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No outages with location data to display on the map.
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
            Outage Map
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
        <MapContainer
          center={[9.082, 8.675]}
          zoom={6}
          style={{ height: '500px', width: '100%', borderRadius: '8px' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {outagesWithCoords.map((outage) => (
            <CircleMarker
              key={outage.id}
              center={outage.coords}
              radius={8}
              fillColor={getMarkerColor(outage.status)}
              color="#fff"
              weight={2}
              opacity={1}
              fillOpacity={0.8}
            >
              <Popup>
                <div className="min-w-[250px] space-y-2 p-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm leading-tight">{outage.title}</h3>
                    <Badge
                      variant={
                        outage.status === 'RESTORED'
                          ? 'default'
                          : outage.status === 'PLANNED'
                            ? 'secondary'
                            : 'destructive'
                      }
                      className="shrink-0"
                    >
                      {outage.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{outage.summary?.slice(0, 150)}</p>
                  <div className="flex items-center gap-1 text-xs">
                    <MapPin className="h-3 w-3" />
                    <span className="font-medium">{outage.city}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Source: {outage.sourceName || outage.source}
                  </div>
                  {outage.officialUrl && (
                    <a
                      href={outage.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      View details →
                    </a>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </CardContent>
    </Card>
  );
}
