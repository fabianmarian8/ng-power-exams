import fs from 'node:fs/promises';
import path from 'node:path';

const OFFLINE = process.env.NEWS_OFFLINE === '1';
const FIXTURES_ROOT = path.join(process.cwd(), 'scripts/ingest/fixtures');

async function readFixture(fixtureName: string): Promise<string> {
  const fixturePath = path.join(FIXTURES_ROOT, fixtureName);
  return fs.readFile(fixturePath, 'utf8');
}

async function fetchRemote(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (NaijaInfoBot/1.0)',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    },
    signal: AbortSignal.timeout(15_000)
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} while fetching ${url}`);
  }

  return response.text();
}

export async function fetchHtml(url: string, fixtureName?: string): Promise<string> {
  if (OFFLINE) {
    if (!fixtureName) {
      throw new Error(`NEWS_OFFLINE=1 requires fixture for ${url}`);
    }
    return readFixture(fixtureName);
  }

  return fetchRemote(url);
}

export const isOfflineMode = OFFLINE;
