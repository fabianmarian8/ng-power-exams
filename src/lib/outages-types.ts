export type SourceId = 'TCN' | 'IKEDC' | 'EKEDC' | 'KADUNA' | 'JED';
export type Category = 'planned' | 'unplanned' | 'restoration' | 'advisory';
export type VerificationSource = 'TCN' | 'DisCo' | 'Media' | 'Community';

export interface OutageEvent {
  id: string;
  source: SourceId;
  category: Category;
  title: string;
  description: string;
  areas: string[];
  feeder?: string;
  window?: { start?: string; end?: string };
  publishedAt: string;
  detectedAt: string;
  sourceUrl: string;
  verifiedBy: VerificationSource;
}

export interface OutagesPayload {
  events: OutageEvent[];
  generatedAt: string;
  lastSourceUpdate: string | null;
}
