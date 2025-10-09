export type SourceId = 'TCN' | 'IKEDC' | 'EKEDC' | 'KADUNA';
export type Category = 'planned' | 'unplanned' | 'restoration' | 'advisory';

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
}

export interface OutagesPayload {
  events: OutageEvent[];
  generatedAt: string;
}
