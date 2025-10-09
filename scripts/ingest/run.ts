import axios from 'axios';
import * as cheerio from 'cheerio';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { mkdir, writeFile } from 'node:fs/promises';
import { fromAdapters } from './adapters/index.js';
import schema from './schema/outages.schema.json' assert { type: 'json' };

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);

const USER_AGENT = 'NaijaInfo-Ingest/1.0 (+https://ng-power-exams.local)';

async function main() {
  const events = await fromAdapters({ axios, cheerio, userAgent: USER_AGENT });
  const uniqueById = new Map<string, typeof events[number]>();
  for (const event of events) {
    if (!uniqueById.has(event.id)) {
      uniqueById.set(event.id, event);
    }
  }

  const payload = {
    events: Array.from(uniqueById.values()),
    generatedAt: new Date().toISOString()
  };

  if (!validate(payload)) {
    console.error('Validation failed', validate.errors);
    process.exitCode = 1;
    return;
  }

  await mkdir('public/live', { recursive: true });
  await writeFile('public/live/outages.json', JSON.stringify(payload, null, 2));
  await writeFile('public/live/version.json', JSON.stringify({ updatedAt: payload.generatedAt }, null, 2));
  console.log(`Generated ${payload.events.length} outages @ ${payload.generatedAt}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
