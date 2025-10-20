import type { Adapter } from './types';
import { buildOutageItem } from './utils';
import type { OutageItem } from '../../../src/lib/outages-types';
import { validateOutageRelevance, extractPlannedWindowAI } from '../lib/aiValidator';

const TELEGRAM_CHANNELS = [
  'TCNNigeria',
  'EKEDCUpdates',
  'IkejaElectricNG',
  'JEDplcOfficial',
  'KadunaElectric',
  'AbujaElectric',
  'NERCNigeria'
];

export const telegram: Adapter = async (ctx) => {
  const items: OutageItem[] = [];

  if (!process.env.TELEGRAM_API_ID || !process.env.TELEGRAM_SESSION) {
    console.warn('[Telegram] Not configured, skipping (set TELEGRAM_API_ID, TELEGRAM_API_HASH, TELEGRAM_SESSION)');
    return items;
  }

  try {
    const { TelegramClient } = await import('telegram');
    const { StringSession } = await import('telegram/sessions');

    const client = new TelegramClient(
      new StringSession(process.env.TELEGRAM_SESSION),
      parseInt(process.env.TELEGRAM_API_ID, 10),
      process.env.TELEGRAM_API_HASH || '',
      {
        connectionRetries: 3,
        useWSS: true
      }
    );

    await client.connect();
    console.log('[Telegram] Connected');

    for (const channel of TELEGRAM_CHANNELS) {
      try {
        const messages = await client.getMessages(channel, { limit: 50 });

        for (const msg of messages) {
          if (!msg.text || msg.text.length < 20) continue;

          const title = msg.text.slice(0, 150).trim();
          const summary = msg.text;
          const publishedAt = new Date((msg.date || 0) * 1000).toISOString();

          const validation = await validateOutageRelevance(title, summary);

          if (!validation.isRelevant || validation.confidence < 0.7) {
            continue;
          }

          const plannedWindow = await extractPlannedWindowAI(title, summary, publishedAt);

          items.push(
            buildOutageItem({
              source: 'TELEGRAM',
              sourceName: `${channel} (Telegram)`,
              title,
              summary,
              affectedAreas: validation.extractedInfo?.affectedAreas,
              officialUrl: `https://t.me/${channel}/${msg.id}`,
              verifiedBy: channel.includes('TCN') ? 'TCN' : channel.includes('NERC') ? 'REGULATORY' : 'MEDIA',
              publishedAt,
              plannedWindow: plannedWindow ?? undefined,
              confidence: validation.confidence,
              status: validation.extractedInfo?.outageType ?? (plannedWindow ? 'PLANNED' : 'UNPLANNED'),
              raw: {
                messageId: msg.id,
                channel
              }
            })
          );
        }

        console.log(`[Telegram] ${channel}: ${items.filter((i) => i.raw?.channel === channel).length} items`);
      } catch (error) {
        console.error(`[Telegram] Failed for ${channel}:`, error instanceof Error ? error.message : error);
      }
    }

    await client.disconnect();
  } catch (error) {
    console.error('[Telegram] Setup error:', error instanceof Error ? error.message : error);
  }

  console.log(`[Telegram] Total items: ${items.length}`);
  return items;
};
