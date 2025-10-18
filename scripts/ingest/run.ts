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
import { deduplicateOutages } from './lib/deduplication.js';

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
    item.start ?? item.plannedWindow?.start ?? '',
    item.end ?? item.plannedWindow?.end ?? '',
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

  const start = item.start ?? plannedWindow?.start;
  const end = item.end ?? plannedWindow?.end;
  const baseItem = {
    ...item,
    plannedWindow,
    start,
    end
  } as OutageItem;

  const confidence =
    typeof item.confidence === 'number'
      ? item.confidence
      : item.verifiedBy === 'TCN'
        ? 1
        : item.verifiedBy === 'DISCO'
          ? 0.9
          : item.verifiedBy === 'MEDIA'
            ? 0.6
            : item.confidence;

  return {
    ...baseItem,
    id: makeId(baseItem),
    title: normalizedTitle,
    summary: normalizedSummary,
    affectedAreas: normalizedAreas,
    sourceName: normalizeWhitespace(item.sourceName),
    officialUrl: item.officialUrl,
    raw: item.raw,
    confidence,
    _score: item._score
  };
}

function sortItems(items: OutageItem[]): OutageItem[] {
  const planned = items
    .filter((item) => item.status === 'PLANNED' && (item.start || item.plannedWindow?.start))
    .sort((a, b) => {
      const aStart = new Date(a.start ?? a.plannedWindow?.start ?? 0).valueOf();
      const bStart = new Date(b.start ?? b.plannedWindow?.start ?? 0).valueOf();
      return aStart - bStart;
    });

  const live = items
    .filter((item) => item.status !== 'PLANNED')
    .sort((a, b) => new Date(b.publishedAt).valueOf() - new Date(a.publishedAt).valueOf());

  const plannedIds = new Set(planned.map((item) => item.id));
  const remainder = items.filter((item) => item.status === 'PLANNED' && !plannedIds.has(item.id));

  return [...planned, ...live, ...remainder];
}

async function main() {
  const { items, stats, lastPublishedAtByAdapter } = await fromAdapters({
    axios,
    cheerio,
    userAgent: USER_AGENT
  });

  const normalizedItems = items.map(normalizeItem);
  const deduped = deduplicateOutages(normalizedItems);
  const now = DateTime.now().setZone('Africa/Lagos');
  for (const item of deduped) {
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
    if (start < now.minus({ days: 30 }) && windowEnded) {
      item.plannedWindow = undefined;
      continue;
    }

    item.plannedWindow = {
      start: start.toISO(),
      end: end?.isValid ? end.toISO() : undefined,
      timezone: 'Africa/Lagos'
    };
  }
  const sortedItems = sortItems(deduped);
  const latestSourceAt = sortedItems
    .map((item) => item.publishedAt)
    .filter(Boolean)
    .reduce<string | undefined>((latest, current) => {
      if (!current) return latest;
      if (!latest) return current;
      return new Date(current) > new Date(latest) ? current : latest;
    }, undefined);

  const plannedItems = sortedItems
    .filter((item) => item.status === 'PLANNED' && (item.start || item.plannedWindow?.start))
    .sort((a, b) => new Date(a.start ?? a.plannedWindow?.start ?? 0).valueOf() - new Date(b.start ?? b.plannedWindow?.start ?? 0).valueOf());

  const payload = {
    items: sortedItems,
    planned: plannedItems,
    generatedAt: new Date().toISOString(),
    latestSourceAt
  };

  const summaryLog = {
    TCN: stats.tcn,
    Ikeja: stats.ikeja,
    EKEDC: stats.ekedc,
    Kaduna: stats.kaduna,
    JED: stats.jed,
    Media: stats.media,
    PremiumTimes: stats.premiumTimes,
    Guardian: stats.guardian,
    Vanguard: stats.vanguard
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
