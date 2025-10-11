export declare class DateTime {
    private readonly epochMillis;
    private readonly zone;
    private readonly valid;
    constructor(epochMillis: number, zone: string, valid: boolean);
    static now(): DateTime;
    static fromISO(value: string, options?: {
        zone?: string;
    }): DateTime;
    static fromObject(parts: {
        year: number;
        month: number;
        day: number;
    }, options?: {
        zone?: string;
    }): DateTime;
    set(values: {
        hour?: number;
        minute?: number;
    }): DateTime;
    setZone(zone: string): DateTime;
    startOf(unit: 'day'): DateTime;
    endOf(unit: 'day'): DateTime;
    plus(values: {
        days?: number;
    }): DateTime;
    minus(values: {
        days?: number;
    }): DateTime;
    toISO(): string | null;
    toFormat(pattern: string): string;
    toMillis(): number;
    get isValid(): boolean;
    valueOf(): number;
    hasSame(other: DateTime, unit: 'day'): boolean;
    toUTC(): DateTime;
}
