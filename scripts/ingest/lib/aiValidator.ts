import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || ''
});

export interface ValidationResult {
  isRelevant: boolean;
  confidence: number;
  reason: string;
  extractedInfo?: {
    affectedAreas?: string[];
    outageType?: 'PLANNED' | 'UNPLANNED' | 'RESTORED';
  };
}

export async function validateOutageRelevance(
  title: string,
  summary: string
): Promise<ValidationResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('[AI Validator] No API key, skipping validation');
    return {
      isRelevant: true,
      confidence: 0.5,
      reason: 'API key not configured'
    };
  }

  try {
    const prompt = `Analyze if this article is specifically about electricity/power outages, maintenance, grid issues, or power supply in Nigeria.

Title: ${title}
Summary: ${summary}

RELEVANT topics:
- Power outages (planned or unplanned)
- Electricity supply interruptions
- TCN/DisCo maintenance
- Grid collapse/failure
- Power restoration
- Feeder faults
- Transmission issues
- Electricity tariffs/billing related to outages

NOT RELEVANT:
- General crime news
- Sports
- Politics (unless directly about power sector)
- Entertainment
- Business news (unless about power companies)

Respond ONLY with valid JSON (no markdown, no code blocks):
{
  "isRelevant": true/false,
  "confidence": 0.0-1.0,
  "reason": "brief explanation in English",
  "extractedInfo": {
    "affectedAreas": ["Lagos", "Abuja"],
    "outageType": "PLANNED" or "UNPLANNED" or "RESTORED"
  }
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    let responseText = content.text.trim();
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');

    const result = JSON.parse(responseText) as ValidationResult;

    console.log(
      `[AI Validator] "${title.slice(0, 60)}" -> relevant=${result.isRelevant} confidence=${result.confidence}`
    );

    return result;
  } catch (error) {
    console.error('[AI Validator] Error:', error);
    const powerKeywords = /(outage|power|electricity|grid|disco|tcn|nepa|supply|blackout|feeder|maintenance|restoration)/i;
    const isRelevant = powerKeywords.test(`${title} ${summary}`);

    return {
      isRelevant,
      confidence: isRelevant ? 0.6 : 0.3,
      reason: 'Fallback keyword validation due to API error'
    };
  }
}

export async function extractPlannedWindowAI(
  title: string,
  content: string,
  publishedAt?: string
): Promise<{ start: string; end: string; timezone: string } | null> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return null;
  }

  try {
    const prompt = `Extract FUTURE planned maintenance/outage window from this Nigerian power utility announcement.

Published: ${publishedAt || 'unknown'}
Title: ${title}
Content: ${content}

Look for:
- Future dates and times (not past events)
- Scheduled/planned maintenance
- Announced outage windows
- "from X to Y" time ranges

Nigerian timezone: Africa/Lagos (WAT, UTC+1)

If you find a FUTURE planned outage with specific date/time, respond with JSON:
{
  "found": true,
  "start": "2025-10-25T09:00:00+01:00",
  "end": "2025-10-25T17:00:00+01:00",
  "timezone": "Africa/Lagos"
}

If no future planned window found (or dates are in the past), respond:
{
  "found": false
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }]
    });

    const responseContent = message.content[0];
    if (responseContent.type !== 'text') {
      return null;
    }

    let responseText = responseContent.text.trim();
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');

    const result = JSON.parse(responseText);

    if (result.found && result.start) {
      const now = new Date();
      const startDate = new Date(result.start);

      if (startDate > now) {
        console.log(`[AI Extractor] Found planned window: ${result.start} -> ${result.end}`);
        return {
          start: result.start,
          end: result.end || result.start,
          timezone: result.timezone || 'Africa/Lagos'
        };
      }
    }

    return null;
  } catch (error) {
    console.error('[AI Extractor] Error:', error);
    return null;
  }
}
