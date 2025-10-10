import type { OutageItem } from '../../../src/lib/outages-types';

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/i)
      .map((token) => token.trim())
      .filter(Boolean)
  );
}

function similarity(a: string, b: string): number {
  const tokensA = tokenize(a);
  const tokensB = tokenize(b);
  if (tokensA.size === 0 || tokensB.size === 0) return 0;
  const intersection = new Set([...tokensA].filter((token) => tokensB.has(token)));
  const union = new Set([...tokensA, ...tokensB]);
  return intersection.size / union.size;
}

function pickBestCandidate(group: OutageItem[]): OutageItem {
  return [...group].sort((a, b) => {
    if (a.source === 'TCN' && b.source !== 'TCN') return -1;
    if (b.source === 'TCN' && a.source !== 'TCN') return 1;

    const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : Number.POSITIVE_INFINITY;
    const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : Number.POSITIVE_INFINITY;
    return dateA - dateB;
  })[0];
}

export function deduplicateOutages(items: OutageItem[]): OutageItem[] {
  const groups: OutageItem[][] = [];

  for (const item of items) {
    let merged = false;

    for (const group of groups) {
      const representative = group[0];
      const titleSim = similarity(item.title, representative.title);
      const summarySim = item.summary && representative.summary ? similarity(item.summary, representative.summary) : 0;

      if (titleSim > 0.7 || summarySim > 0.7) {
        group.push(item);
        merged = true;
        break;
      }
    }

    if (!merged) {
      groups.push([item]);
    }
  }

  return groups.map((group) => pickBestCandidate(group));
}
