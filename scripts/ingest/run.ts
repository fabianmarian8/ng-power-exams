import axios from 'axios';
import * as cheerio from 'cheerio';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { DateTime } from 'luxon';
import { fromAdapters } from './adapters/index.js';
import schema from './schema/outages.schema.json' assert { type: 'json' };
import type { OutageItem } from '../../src/lib/outages-types';
import { ingestNews } from './news.js';

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);

const USER_AGENT = 'NaijaInfo-Ingest/1.0 (+https://ng-power-exams.local)';

function normalizeWhitespace(input: string | undefined | null): string | undefined {
  if (!input) return input ?? undefined;
  const trimmed = input.replace(/\s+/g, ' ').trim();
  return trimmed.length ? trimmed : undefined;
}

function uniqAreas(areas: string[] | undefined): string[] | undefined {
  if (!areas || areas.length === 0) return undefined;
  const seen = new Set<string>();
  const result: string[] = [];
  for (const area of areas) {
    const normalized = normalizeWhitespace(area);
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
  }
  return result.length ? result : undefined;
}

function makeId(item: OutageItem): string {
  const key = [
    item.source,
    normalizeWhitespace(item.title) ?? '',
    item.plannedWindow?.start ?? '',
    item.plannedWindow?.end ?? '',
    item.publishedAt ?? ''
  ].join('|');
  return createHash('sha1').update(key).digest('hex').slice(0, 12);
}

function normalizeItem(item: OutageItem): OutageItem {
  const normalizedTitle = normalizeWhitespace(item.title) ?? '';
  const normalizedSummary = normalizeWhitespace(item.summary);
  const normalizedAreas = uniqAreas(item.affectedAreas);

  const plannedWindow = item.plannedWindow
    ? {
        ...item.plannedWindow,
        timezone:
          item.plannedWindow.timezone ??
          (item.plannedWindow.start || item.plannedWindow.end ? 'Africa/Lagos' : undefined)
      }
    : undefined;

  return {
    ...item,
    id: makeId(item),
    title: normalizedTitle,
    summary: normalizedSummary,
    affectedAreas: normalizedAreas,
    plannedWindow,
    sourceName: normalizeWhitespace(item.sourceName),
    officialUrl: item.officialUrl,
    raw: item.raw,
    _score: item._score
  };
}

function dedupeItems(items: OutageItem[]): OutageItem[] {
  const seen = new Map<string, OutageItem>();
  for (const item of items) {
    const key = [
      item.source,
      normalizeWhitespace(item.title)?.toLowerCase() ?? '',
      item.plannedWindow?.start ?? '',
      item.plannedWindow?.end ?? ''
    ].join('|');
    if (!seen.has(key)) {
      seen.set(key, item);
      continue;
    }

    const existing = seen.get(key)!;
    const existingDate = new Date(existing.publishedAt).valueOf();
    const incomingDate = new Date(item.publishedAt).valueOf();
    if (incomingDate > existingDate) {
      seen.set(key, item);
    }
  }
  return Array.from(seen.values());
}

function sortItems(items: OutageItem[]): OutageItem[] {
  const rank: Record<OutageItem['status'], number> = {
    UNPLANNED: 0,
    RESTORED: 1,
    PLANNED: 2
  };

  return [...items].sort((a, b) => {
    const rankDiff = rank[a.status] - rank[b.status];
    if (rankDiff !== 0) return rankDiff;

    if (a.status === 'PLANNED' && b.status === 'PLANNED') {
      const startA = a.plannedWindow?.start ? new Date(a.plannedWindow.start).valueOf() : Number.POSITIVE_INFINITY;
      const startB = b.plannedWindow?.start ? new Date(b.plannedWindow.start).valueOf() : Number.POSITIVE_INFINITY;
      return startA - startB;
    }

    return new Date(b.publishedAt).valueOf() - new Date(a.publishedAt).valueOf();
  });
}

async function main() {
  const { items, stats, lastPublishedAtByAdapter } = await fromAdapters({
    axios,
    cheerio,
    userAgent: USER_AGENT
  });

  const normalizedItems = items.map(normalizeItem);
  const now = DateTime.now().setZone('Africa/Lagos');
  for (const item of normalizedItems) {
    if (item.status !== 'PLANNED' || !item.plannedWindow?.start) {
      continue;
    }

    const start = DateTime.fromISO(item.plannedWindow.start, { zone: 'Africa/Lagos' });
    const end = item.plannedWindow.end
      ? DateTime.fromISO(item.plannedWindow.end, { zone: 'Africa/Lagos' })
      : null;

    if (!start.isValid) {
      item.plannedWindow = undefined;
      continue;
    }

    const windowEnded = end?.isValid ? end < now : start < now;
    if (start < now.minus({ days: 1 }) && windowEnded) {
      item.plannedWindow = undefined;
      continue;
    }

    item.plannedWindow = {
      start: start.toISO(),
      end: end?.isValid ? end.toISO() : undefined,
      timezone: 'Africa/Lagos'
    };
  }
  const deduped = dedupeItems(normalizedItems);
  const sortedItems = sortItems(deduped);
  const latestSourceAt = sortedItems
    .map((item) => item.publishedAt)
    .filter(Boolean)
    .reduce<string | undefined>((latest, current) => {
      if (!current) return latest;
      if (!latest) return current;
      return new Date(current) > new Date(latest) ? current : latest;
    }, undefined);

  const payload = {
    items: sortedItems,
    generatedAt: new Date().toISOString(),
    latestSourceAt
  };

  const summaryLog = {
    TCN: stats.tcn,
    Ikeja: stats.ikeja,
    Eko: stats.eko,
    Kaduna: stats.kaduna,
    JED: stats.jed
  };
  console.log('Adapters summary:', summaryLog);
  console.log('Last published per adapter:', lastPublishedAtByAdapter);
  const totalItems = Object.values(stats).reduce((sum, count) => sum + count, 0);
  if (totalItems === 0) {
    console.warn('No data from adapters — writing empty outages.json');
  }

  if (!validate(payload)) {
    console.error('Validation failed', validate.errors);
    process.exitCode = 1;
    return;
  }

  await mkdir('public/live', { recursive: true });
  await writeFile('public/live/outages.json', JSON.stringify(payload, null, 2));
  console.log(`Generated ${payload.items.length} outages @ ${payload.generatedAt}`);

  let newsGeneratedAt: string | null = null;
  try {
    const newsResult = await ingestNews();
    newsGeneratedAt = newsResult.payload.generatedAt;
    console.log('News summary (run.ts):', newsResult.summary);
  } catch (error) {
    console.error('News ingest failed from run.ts', error);
  }

  const versionPayload = {
    updatedAt: newsGeneratedAt ?? payload.generatedAt,
    outagesUpdatedAt: payload.generatedAt,
    newsUpdatedAt: newsGeneratedAt
  };

  await writeFile('public/live/version.json', JSON.stringify(versionPayload, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
