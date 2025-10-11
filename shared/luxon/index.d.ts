declare module 'luxon' {
  export interface DurationObject {
    years?: number;
    quarters?: number;
    months?: number;
    weeks?: number;
    days?: number;
    hours?: number;
    minutes?: number;
    seconds?: number;
    milliseconds?: number;
  }

  export interface DateTimeOptions {
    zone?: string;
    locale?: string;
  }

  export class Duration {
    as(unit: string): number;
    hours: number;
    minutes: number;
    seconds: number;
  }

  export class DateTime {
    static now(): DateTime;
    static fromISO(iso: string, options?: DateTimeOptions): DateTime;
    static fromJSDate(date: Date, options?: DateTimeOptions): DateTime;
    
    isValid: boolean;
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
    millisecond: number;
    
    setZone(zone: string): DateTime;
    toUTC(): DateTime;
    toISO(): string | null;
    toFormat(format: string): string;
    toJSDate(): Date;
    valueOf(): number;
    
    plus(duration: DurationObject): DateTime;
    minus(duration: DurationObject): DateTime;
    diff(other: DateTime, unit?: string | string[]): Duration;
    hasSame(other: DateTime, unit: string): boolean;
  }
}
