import type { OutagesPayload } from '@/lib/outages-types';

export const OUTAGES_FALLBACK: OutagesPayload = {
  generatedAt: '2025-10-01T08:05:00.000Z',
  latestSourceAt: '2025-10-01T07:30:00.000Z',
  items: [
    {
      id: 'tcn-2025-10-01-jebba-maintenance',
      source: 'TCN',
      sourceName: 'Transmission Company of Nigeria',
      title: 'TCN schedules OPGW upgrade between Jebba and Osogbo',
      summary:
        'The Transmission Company of Nigeria will execute an Optical Ground Wire (OPGW) upgrade on the Jebba–Osogbo 330kV corridor.',
      publishedAt: '2025-10-01T07:30:00.000Z',
      status: 'PLANNED',
      start: '2025-10-01T09:00:00.000Z',
      end: '2025-10-01T17:00:00.000Z',
      plannedWindow: {
        start: '2025-10-01T09:00:00.000Z',
        end: '2025-10-01T17:00:00.000Z',
        timezone: 'Africa/Lagos'
      },
      affectedAreas: ['Jebba', 'Osogbo', 'Ilorin'],
      verifiedBy: 'TCN',
      officialUrl: 'https://www.tcn.org.ng/latest-news/tcn-schedules-opgw-upgrade-between-jebba-and-osogbo/',
      confidence: 1
    },
    {
      id: 'jed-2025-10-01-rayfield-band-a',
      source: 'JED',
      sourceName: 'Jos Electricity Distribution Plc',
      title: 'Rayfield Band A feeder downgraded to 4 hours availability',
      summary:
        'Jos Electricity Distribution Plc reports that the Rayfield Band A feeder recorded only four hours of supply during the latest review window.',
      publishedAt: '2025-10-01T06:50:00.000Z',
      status: 'UNPLANNED',
      affectedAreas: ['Rayfield', 'Bukuru'],
      verifiedBy: 'DISCO',
      officialUrl: 'https://jedplc.com/feeder-availability.php',
      confidence: 0.9
    },
    {
      id: 'kaduna-2025-09-21-kaduna-metropolis-update',
      source: 'KADUNA',
      sourceName: 'Kaduna Electric',
      title: 'Update on prolonged outage across Kaduna metropolis',
      summary:
        'Kaduna Electric says TCN maintenance on the 33kV Mando line is still ongoing, keeping parts of Kaduna metropolis without supply.',
      publishedAt: '2025-09-21T16:20:00.000Z',
      status: 'UNPLANNED',
      affectedAreas: ['Kaduna North', 'Kaduna South'],
      verifiedBy: 'DISCO',
      officialUrl: 'https://kadunaelectric.com/an-update-on-the-power-supply-situation-in-kaduna-metropolis/',
      confidence: 0.9
    },
    {
      id: 'ekedc-2025-07-05-lekki-maintenance',
      source: 'EKEDC',
      sourceName: 'Eko Electricity Distribution Company',
      title: 'Lekki business unit: 25-day day-time maintenance by TCN',
      summary:
        'Eko Disco informs customers in Lekki, Ajah, and Ibeju-Lekki that TCN will carry out critical maintenance between 9 a.m. and 6 p.m. daily for 25 days.',
      publishedAt: '2025-07-05T09:10:00.000Z',
      status: 'PLANNED',
      start: '2025-07-06T09:00:00.000Z',
      plannedWindow: {
        start: '2025-07-06T09:00:00.000Z',
        timezone: 'Africa/Lagos'
      },
      affectedAreas: ['Lekki', 'Ajah', 'Ibeju-Lekki'],
      verifiedBy: 'DISCO',
      officialUrl:
        'https://ekedp.com/news/ekedc-set-for-operational-system-upgrade-urges-customers-to-recharge-and-pay-their-bills-to-avoid-service-disruption-4927',
      confidence: 0.9
    }
  ]
};
