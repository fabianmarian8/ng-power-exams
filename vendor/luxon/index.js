const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function zoneOffsetMinutes(zone) {
    if (zone === 'Africa/Lagos') {
        return 60;
    }
    return 0;
}
function clamp(value, min, max) {
    if (!Number.isFinite(value))
        return min;
    return Math.min(Math.max(value, min), max);
}
function toLocalComponents(epochMillis, zone) {
    if (!Number.isFinite(epochMillis))
        return null;
    const offset = zoneOffsetMinutes(zone);
    const date = new Date(epochMillis + offset * 60000);
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
function fromLocalComponents(components, zone) {
    if (!components) {
        return new DateTime(Number.NaN, zone, false);
    }
    const offset = zoneOffsetMinutes(zone);
    const millis = Date.UTC(components.year, components.month - 1, components.day, components.hour, components.minute, components.second, components.millisecond) - offset * 60000;
    return new DateTime(millis, zone, Number.isFinite(millis));
}
function formatNumber(value, length) {
    return String(Math.trunc(value)).padStart(length, '0');
}
function formatOffset(zone) {
    const minutes = zoneOffsetMinutes(zone);
    const sign = minutes >= 0 ? '+' : '-';
    const absolute = Math.abs(minutes);
    const hours = Math.floor(absolute / 60);
    const mins = absolute % 60;
    return `${sign}${formatNumber(hours, 2)}:${formatNumber(mins, 2)}`;
}
export class DateTime {
    constructor(epochMillis, zone, valid) {
        this.epochMillis = epochMillis;
        this.zone = zone;
        this.valid = valid;
    }
    static now() {
        return new DateTime(Date.now(), 'UTC', true);
    }
    static fromISO(value, options) {
        var _a;
        const date = new Date(value);
        const zone = (_a = options === null || options === void 0 ? void 0 : options.zone) !== null && _a !== void 0 ? _a : 'UTC';
        if (Number.isNaN(date.valueOf())) {
            return new DateTime(Number.NaN, zone, false);
        }
        return new DateTime(date.valueOf(), zone, true);
    }
    static fromObject(parts, options) {
        var _a;
        const zone = (_a = options === null || options === void 0 ? void 0 : options.zone) !== null && _a !== void 0 ? _a : 'UTC';
        if (!Number.isFinite(parts.year) || !Number.isFinite(parts.month) || !Number.isFinite(parts.day)) {
            return new DateTime(Number.NaN, zone, false);
        }
        return fromLocalComponents({
            year: Math.trunc(parts.year),
            month: Math.trunc(parts.month),
            day: Math.trunc(parts.day),
            hour: 0,
            minute: 0,
            second: 0,
            millisecond: 0
        }, zone);
    }
    set(values) {
        if (!this.valid)
            return this;
        const local = toLocalComponents(this.epochMillis, this.zone);
        if (!local)
            return new DateTime(Number.NaN, this.zone, false);
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
    setZone(zone) {
        if (!this.valid) {
            return new DateTime(this.epochMillis, zone, false);
        }
        return new DateTime(this.epochMillis, zone, true);
    }
    startOf(unit) {
        if (unit !== 'day' || !this.valid)
            return this;
        const local = toLocalComponents(this.epochMillis, this.zone);
        if (!local)
            return new DateTime(Number.NaN, this.zone, false);
        local.hour = 0;
        local.minute = 0;
        local.second = 0;
        local.millisecond = 0;
        return fromLocalComponents(local, this.zone);
    }
    endOf(unit) {
        if (unit !== 'day' || !this.valid)
            return this;
        const local = toLocalComponents(this.epochMillis, this.zone);
        if (!local)
            return new DateTime(Number.NaN, this.zone, false);
        local.hour = 23;
        local.minute = 59;
        local.second = 59;
        local.millisecond = 999;
        return fromLocalComponents(local, this.zone);
    }
    plus(values) {
        var _a;
        const days = (_a = values.days) !== null && _a !== void 0 ? _a : 0;
        if (!this.valid || !Number.isFinite(days))
            return this;
        return new DateTime(this.epochMillis + days * 86400000, this.zone, true);
    }
    minus(values) {
        var _a;
        const days = (_a = values.days) !== null && _a !== void 0 ? _a : 0;
        if (!this.valid || !Number.isFinite(days))
            return this;
        return new DateTime(this.epochMillis - days * 86400000, this.zone, true);
    }
    toISO() {
        if (!this.valid)
            return null;
        const local = toLocalComponents(this.epochMillis, this.zone);
        if (!local)
            return null;
        return `${formatNumber(local.year, 4)}-${formatNumber(local.month, 2)}-${formatNumber(local.day, 2)}T${formatNumber(local.hour, 2)}:${formatNumber(local.minute, 2)}:${formatNumber(local.second, 2)}${formatOffset(this.zone)}`;
    }
    toFormat(pattern) {
        var _a;
        if (!this.valid)
            return 'Invalid DateTime';
        const local = toLocalComponents(this.epochMillis, this.zone);
        if (!local)
            return 'Invalid DateTime';
        switch (pattern) {
            case 'dd LLL yyyy, HH:mm':
                return `${formatNumber(local.day, 2)} ${MONTH_NAMES[clamp(local.month, 1, 12) - 1]} ${formatNumber(local.year, 4)}, ${formatNumber(local.hour, 2)}:${formatNumber(local.minute, 2)}`;
            case 'HH:mm':
                return `${formatNumber(local.hour, 2)}:${formatNumber(local.minute, 2)}`;
            default:
                return (_a = this.toISO()) !== null && _a !== void 0 ? _a : '';
        }
    }
    toMillis() {
        return this.epochMillis;
    }
    get isValid() {
        return this.valid;
    }
    valueOf() {
        return this.epochMillis;
    }
    hasSame(other, unit) {
        if (unit !== 'day' || !this.valid || !other.valid) {
            return false;
        }
        const own = toLocalComponents(this.epochMillis, this.zone);
        const converted = toLocalComponents(other.epochMillis, this.zone);
        if (!own || !converted)
            return false;
        return own.year === converted.year && own.month === converted.month && own.day === converted.day;
    }
    toUTC() {
        return new DateTime(this.epochMillis, 'UTC', this.valid);
    }
}
