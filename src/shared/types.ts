export type NewsDomain = "EXAMS" | "POWER";
export type NewsTier = "OFFICIAL" | "MEDIA";

export interface NewsItem {
  id: string;
  domain: NewsDomain;
  tier: NewsTier;
  source: string;
  title: string;
  summary?: string;
  publishedAt: string;
  officialUrl: string;
  tags?: string[];
  _score?: number;
}

export interface NewsPayload {
  generatedAt: string;
  items: NewsItem[];
  latestOfficialByDomain: {
    EXAMS?: string;
    POWER?: string;
  };
}
