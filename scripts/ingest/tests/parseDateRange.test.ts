import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseDateRange } from '../lib/dateRange';

const TZ = 'Africa/Lagos';

describe('parseDateRange', () => {
  it('parses explicit day range with times', () => {
    const text = 'Maintenance scheduled from 8:00am to 5:00pm on 12/10/2025.';
    const result = parseDateRange(text, TZ);
    assert.ok(result.start);
    assert.ok(result.end);
    assert.equal(result.start, '2025-10-12T07:00:00.000Z');
    assert.equal(result.end, '2025-10-12T16:00:00.000Z');
  });

  it('falls back to single date when end missing', () => {
    const text = 'Work will occur on 5 March 2026 for network upgrade.';
    const result = parseDateRange(text, TZ);
    assert.ok(result.start);
    assert.equal(result.start, '2026-03-05T08:00:00.000Z');
    assert.equal(result.end, undefined);
  });

  it('handles range with two dates', () => {
    const text = 'Outage from 14 April 2026 to 16 April 2026 for line maintenance.';
    const result = parseDateRange(text, TZ);
    assert.ok(result.start);
    assert.ok(result.end);
    assert.equal(result.start, '2026-04-14T08:00:00.000Z');
    assert.equal(result.end, '2026-04-16T08:00:00.000Z');
  });
});
