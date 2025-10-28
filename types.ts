export enum SourceType {
  Official = 'OFFICIAL',
  Unofficial = 'UNOFFICIAL',
}

export enum OutageType {
  Unplanned = 'UNPLANNED',
  Planned = 'PLANNED',
  Restored = 'RESTORED',
  Grid = 'GRID_STATUS',
}

export interface DisCo {
  id: string;
  name: string;
  shortName: string;
  states: string[];
  contacts: {
    phone: string;
    whatsapp: string;
    email: string;
  };
}

export interface PowerOutage {
  id: string;
  disCoId: string;
  affectedArea: string;
  type: OutageType;
  reason: string;
  startTime: Date;
  estimatedRestoreTime?: Date;
  restoredTime?: Date;
  source: string;
  sourceType: SourceType;
}

export enum ExamStatus {
  RELEASED = 'RESULTS RELEASED',
  AWAITING = 'AWAITING RELEASE',
  ONGOING = 'REGISTRATION ONGOING',
  OFFLINE = 'PORTAL OFFLINE',
}

export interface ExamGuide {
  id: string;
  name: string;
  acronym: string;
  description: string;
  status: ExamStatus;
  lastChecked: Date;
  portalUrl: string;
  quickLinks: { title: string; url: string }[];
  steps: {
    title: string;
    details: string;
  }[];
  commonIssues: {
    issue: string;
    solution: string;
  }[];
  smsGuide?: {
    title: string;
    steps: string[];
    note?: string;
  };
}

export interface NewsItem {
  id: number;
  category: 'ENERGY' | 'EDUCATION';
  title: string;
  summary: string;
  timestamp: Date;
}

export interface Language {
    code: string;
    name: string;
    flag: string;
}

export interface TipGuide {
    id: string;
    titleKey: string;
    content: string[];
}