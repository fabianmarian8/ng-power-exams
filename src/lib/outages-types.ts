export type OutageSource =
  | 'TCN'
  | 'EKEDC'
  | 'KADUNA'
  | 'JED'
  | 'AEDC'
  | 'IBEDC'
  | 'IKEJA'
  | 'TWITTER'
  | 'TELEGRAM'
  | 'NERC'
  | 'OTHER';

export type OutageStatus = 'PLANNED' | 'UNPLANNED' | 'RESTORED';

export type VerificationSource = 'DISCO' | 'TCN' | 'MEDIA' | 'COMMUNITY' | 'REGULATORY' | 'UNKNOWN';

export interface OutageItem {
  id: string;
  source: OutageSource;
  sourceName?: string;
  title: string;
  summary?: string;
  publishedAt: string;
  status: OutageStatus;
  /**
   * Normalised planned start in ISO-8601 (UTC) derived from source text.
   */
  start?: string;
  /**
   * Normalised planned end in ISO-8601 (UTC) derived from source text.
   */
  end?: string;
  plannedWindow?: {
    start?: string;
    end?: string;
    timezone?: string;
  };
  affectedAreas?: string[];
  verifiedBy?: VerificationSource;
  officialUrl?: string;
  raw?: Record<string, any>;
  confidence?: number;
  _score?: number;
}

export interface OutagesPayload {
  generatedAt: string;
  latestSourceAt?: string;
  items: OutageItem[];
  planned?: OutageItem[];
}
