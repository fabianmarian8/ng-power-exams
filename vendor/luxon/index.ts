const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function zoneOffsetMinutes(zone: string): number {
  if (zone === 'Africa/Lagos') {
    return 60;
  }
  return 0;
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}

interface LocalComponents {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
}

function toLocalComponents(epochMillis: number, zone: string): LocalComponents | null {
  if (!Number.isFinite(epochMillis)) return null;
  const offset = zoneOffsetMinutes(zone);
  const date = new Date(epochMillis + offset * 60_000);
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hour: date.getUTCHours(),
    minute: date.getUTCMinutes(),
    second: date.getUTCSeconds(),
    millisecond: date.getUTCMilliseconds()
  };
}

function fromLocalComponents(components: LocalComponents | null, zone: string): DateTime {
  if (!components) {
    return new DateTime(Number.NaN, zone, false);
  }
  const offset = zoneOffsetMinutes(zone);
  const millis = Date.UTC(
    components.year,
    components.month - 1,
    components.day,
    components.hour,
    components.minute,
    components.second,
    components.millisecond
  ) - offset * 60_000;
  return new DateTime(millis, zone, Number.isFinite(millis));
}

function formatNumber(value: number, length: number): string {
  return String(Math.trunc(value)).padStart(length, '0');
}

function formatOffset(zone: string): string {
  const minutes = zoneOffsetMinutes(zone);
  const sign = minutes >= 0 ? '+' : '-';
  const absolute = Math.abs(minutes);
  const hours = Math.floor(absolute / 60);
  const mins = absolute % 60;
  return `${sign}${formatNumber(hours, 2)}:${formatNumber(mins, 2)}`;
}

export class DateTime {
  constructor(private readonly epochMillis: number, private readonly zone: string, private readonly valid: boolean) {}

  static now(): DateTime {
    return new DateTime(Date.now(), 'UTC', true);
  }

  static fromISO(value: string, options?: { zone?: string }): DateTime {
    const date = new Date(value);
    const zone = options?.zone ?? 'UTC';
    if (Number.isNaN(date.valueOf())) {
      return new DateTime(Number.NaN, zone, false);
    }
    return new DateTime(date.valueOf(), zone, true);
  }

  static fromObject(parts: { year: number; month: number; day: number }, options?: { zone?: string }): DateTime {
    const zone = options?.zone ?? 'UTC';
    if (!Number.isFinite(parts.year) || !Number.isFinite(parts.month) || !Number.isFinite(parts.day)) {
      return new DateTime(Number.NaN, zone, false);
    }
    return fromLocalComponents(
      {
        year: Math.trunc(parts.year),
        month: Math.trunc(parts.month),
        day: Math.trunc(parts.day),
        hour: 0,
        minute: 0,
        second: 0,
        millisecond: 0
      },
      zone
    );
  }

  set(values: { hour?: number; minute?: number }): DateTime {
    if (!this.valid) return this;
    const local = toLocalComponents(this.epochMillis, this.zone);
    if (!local) return new DateTime(Number.NaN, this.zone, false);
    if (values.hour !== undefined) {
      local.hour = clamp(values.hour, 0, 23);
    }
    if (values.minute !== undefined) {
      local.minute = clamp(values.minute, 0, 59);
    }
    local.second = 0;
    local.millisecond = 0;
    return fromLocalComponents(local, this.zone);
  }

  setZone(zone: string): DateTime {
    if (!this.valid) {
      return new DateTime(this.epochMillis, zone, false);
    }
    return new DateTime(this.epochMillis, zone, true);
  }

  startOf(unit: 'day'): DateTime {
    if (unit !== 'day' || !this.valid) return this;
    const local = toLocalComponents(this.epochMillis, this.zone);
    if (!local) return new DateTime(Number.NaN, this.zone, false);
    local.hour = 0;
    local.minute = 0;
    local.second = 0;
    local.millisecond = 0;
    return fromLocalComponents(local, this.zone);
  }

  endOf(unit: 'day'): DateTime {
    if (unit !== 'day' || !this.valid) return this;
    const local = toLocalComponents(this.epochMillis, this.zone);
    if (!local) return new DateTime(Number.NaN, this.zone, false);
    local.hour = 23;
    local.minute = 59;
    local.second = 59;
    local.millisecond = 999;
    return fromLocalComponents(local, this.zone);
  }

  plus(values: { days?: number }): DateTime {
    const days = values.days ?? 0;
    if (!this.valid || !Number.isFinite(days)) return this;
    return new DateTime(this.epochMillis + days * 86_400_000, this.zone, true);
  }

  minus(values: { days?: number }): DateTime {
    const days = values.days ?? 0;
    if (!this.valid || !Number.isFinite(days)) return this;
    return new DateTime(this.epochMillis - days * 86_400_000, this.zone, true);
  }

  toISO(): string | null {
    if (!this.valid) return null;
    const local = toLocalComponents(this.epochMillis, this.zone);
    if (!local) return null;
    return `${formatNumber(local.year, 4)}-${formatNumber(local.month, 2)}-${formatNumber(local.day, 2)}T${formatNumber(local.hour, 2)}:${formatNumber(local.minute, 2)}:${formatNumber(local.second, 2)}${formatOffset(this.zone)}`;
  }

  toFormat(pattern: string): string {
    if (!this.valid) return 'Invalid DateTime';
    const local = toLocalComponents(this.epochMillis, this.zone);
    if (!local) return 'Invalid DateTime';
    switch (pattern) {
      case 'dd LLL yyyy, HH:mm':
        return `${formatNumber(local.day, 2)} ${MONTH_NAMES[clamp(local.month, 1, 12) - 1]} ${formatNumber(local.year, 4)}, ${formatNumber(local.hour, 2)}:${formatNumber(local.minute, 2)}`;
      case 'HH:mm':
        return `${formatNumber(local.hour, 2)}:${formatNumber(local.minute, 2)}`;
      default:
        return this.toISO() ?? '';
    }
  }

  toMillis(): number {
    return this.epochMillis;
  }

  get isValid(): boolean {
    return this.valid;
  }

  valueOf(): number {
    return this.epochMillis;
  }

  hasSame(other: DateTime, unit: 'day'): boolean {
    if (unit !== 'day' || !this.valid || !other.valid) {
      return false;
    }
    const own = toLocalComponents(this.epochMillis, this.zone);
    const converted = toLocalComponents(other.epochMillis, this.zone);
    if (!own || !converted) return false;
    return own.year === converted.year && own.month === converted.month && own.day === converted.day;
  }

  toUTC(): DateTime {
    return new DateTime(this.epochMillis, 'UTC', this.valid);
  }
}

