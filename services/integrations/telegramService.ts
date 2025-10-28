/**
 * Telegram Bot Integration Service
 *
 * Integrates with Telegram Bot API to:
 * 1. Monitor public channels for news updates
 * 2. Interact with DisCo bots for outage information
 *
 * According to research report:
 * - Public channels: @PunchNewspaper, @tvcnews_nigeria, @nmliveupdates
 * - DisCo bots: @aedcelectricity (AEDC), @PHEDConnect_bot (PHED)
 * - Requires creating own bot via @BotFather
 * - Bot must be added to channels (requires admin permission)
 * - Can only receive new posts, not historical messages
 */

import { NewsItem, PowerOutage, OutageType, SourceType } from '../../types';

export interface TelegramMessage {
  message_id: number;
  chat: {
    id: number;
    title?: string;
    username?: string;
    type: string;
  };
  date: number;
  text?: string;
  caption?: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  channel_post?: TelegramMessage;
}

class TelegramService {
  private readonly BOT_API_URL = 'https://api.telegram.org/bot';
  private botToken: string | null = null;
  private lastUpdateId: number = 0;

  // Channels to monitor (must have bot added as admin)
  private readonly NEWS_CHANNELS = [
    '@PunchNewspaper',      // Punch Newspapers official channel
    '@tvcnews_nigeria',     // TVC News Nigeria
    '@nmliveupdates',       // Nairametrics Live Updates
  ];

  // DisCo bots to interact with
  private readonly DISCO_BOTS = [
    '@aedcelectricity',     // AEDC Telegram bot
    '@PHEDConnect_bot',     // PHED bot (Ibinabo)
  ];

  /**
   * Initialize bot with token
   */
  initialize(botToken: string): void {
    this.botToken = botToken;
  }

  /**
   * Check if bot is initialized
   */
  isInitialized(): boolean {
    return !!this.botToken;
  }

  /**
   * Get bot information
   */
  async getBotInfo(): Promise<any> {
    if (!this.botToken) {
      throw new Error('Bot token not set. Call initialize() first.');
    }

    try {
      const response = await fetch(`${this.BOT_API_URL}${this.botToken}/getMe`);
      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.description || 'Failed to get bot info');
      }

      return data.result;
    } catch (error) {
      console.error('Error getting bot info:', error);
      throw error;
    }
  }

  /**
   * Get updates from Telegram (long polling)
   */
  async getUpdates(offset?: number): Promise<TelegramUpdate[]> {
    if (!this.botToken) {
      throw new Error('Bot token not set. Call initialize() first.');
    }

    try {
      const params = new URLSearchParams({
        offset: (offset || this.lastUpdateId + 1).toString(),
        timeout: '30',
        allowed_updates: JSON.stringify(['message', 'channel_post']),
      });

      const response = await fetch(`${this.BOT_API_URL}${this.botToken}/getUpdates?${params}`);
      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.description || 'Failed to get updates');
      }

      const updates: TelegramUpdate[] = data.result;

      // Update last update ID
      if (updates.length > 0) {
        this.lastUpdateId = updates[updates.length - 1].update_id;
      }

      return updates;
    } catch (error) {
      console.error('Error getting updates:', error);
      return [];
    }
  }

  /**
   * Monitor channels for news updates
   */
  async monitorChannels(): Promise<NewsItem[]> {
    const updates = await this.getUpdates();
    const newsItems: NewsItem[] = [];

    for (const update of updates) {
      const post = update.channel_post;
      if (post && this.isFromMonitoredChannel(post)) {
        const newsItem = this.parseChannelPost(post);
        if (newsItem) {
          newsItems.push(newsItem);
        }
      }
    }

    return newsItems;
  }

  /**
   * Monitor DisCo bots for outage information
   */
  async monitorDisCoBots(): Promise<PowerOutage[]> {
    const updates = await this.getUpdates();
    const outages: PowerOutage[] = [];

    for (const update of updates) {
      const message = update.message;
      if (message && this.isFromDisCoBot(message)) {
        const outage = this.parseOutageMessage(message);
        if (outage) {
          outages.push(outage);
        }
      }
    }

    return outages;
  }

  /**
   * Send message to bot (for interacting with DisCo bots)
   */
  async sendMessage(chatId: number | string, text: string): Promise<boolean> {
    if (!this.botToken) {
      throw new Error('Bot token not set. Call initialize() first.');
    }

    try {
      const response = await fetch(`${this.BOT_API_URL}${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
        }),
      });

      const data = await response.json();
      return data.ok;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }

  /**
   * Query AEDC bot for outage status
   */
  async queryAEDCStatus(area: string): Promise<string | null> {
    try {
      // This would require knowing the chat ID of the bot
      // In practice, you'd need to have initiated a conversation first
      const botUsername = '@aedcelectricity';

      // Send query (this is simplified - actual implementation needs chat_id)
      // await this.sendMessage(botUsername, `Check outage status for ${area}`);

      // Wait for response and parse it
      // This requires a more sophisticated message handling system

      console.log('AEDC bot query not fully implemented - requires chat_id setup');
      return null;
    } catch (error) {
      console.error('Error querying AEDC bot:', error);
      return null;
    }
  }

  /**
   * Query PHED bot (Ibinabo) for outage status
   */
  async queryPHEDStatus(accountNumber?: string): Promise<string | null> {
    try {
      const botUsername = '@PHEDConnect_bot';

      // PHED bot accepts commands for billing, token, complaints, and outage info
      console.log('PHED bot query not fully implemented - requires chat_id setup');
      return null;
    } catch (error) {
      console.error('Error querying PHED bot:', error);
      return null;
    }
  }

  /**
   * Start long polling (for real-time updates)
   * This should be run in a background worker or service
   */
  startPolling(onUpdate: (updates: TelegramUpdate[]) => void, interval: number = 5000): () => void {
    if (!this.botToken) {
      throw new Error('Bot token not set. Call initialize() first.');
    }

    const pollInterval = setInterval(async () => {
      try {
        const updates = await this.getUpdates();
        if (updates.length > 0) {
          onUpdate(updates);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, interval);

    // Return cleanup function
    return () => clearInterval(pollInterval);
  }

  /**
   * Set webhook for receiving updates (alternative to polling)
   * Requires HTTPS endpoint
   */
  async setWebhook(url: string): Promise<boolean> {
    if (!this.botToken) {
      throw new Error('Bot token not set. Call initialize() first.');
    }

    try {
      const response = await fetch(`${this.BOT_API_URL}${this.botToken}/setWebhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url,
          allowed_updates: ['message', 'channel_post'],
        }),
      });

      const data = await response.json();
      return data.ok;
    } catch (error) {
      console.error('Error setting webhook:', error);
      return false;
    }
  }

  /**
   * Delete webhook (switch back to polling)
   */
  async deleteWebhook(): Promise<boolean> {
    if (!this.botToken) {
      throw new Error('Bot token not set. Call initialize() first.');
    }

    try {
      const response = await fetch(`${this.BOT_API_URL}${this.botToken}/deleteWebhook`, {
        method: 'POST',
      });

      const data = await response.json();
      return data.ok;
    } catch (error) {
      console.error('Error deleting webhook:', error);
      return false;
    }
  }

  /**
   * Check if message is from a monitored news channel
   */
  private isFromMonitoredChannel(message: TelegramMessage): boolean {
    const username = message.chat.username;
    if (!username) return false;

    return this.NEWS_CHANNELS.some(channel =>
      channel.toLowerCase().includes(username.toLowerCase())
    );
  }

  /**
   * Check if message is from a DisCo bot
   */
  private isFromDisCoBot(message: TelegramMessage): boolean {
    const username = message.chat.username;
    if (!username) return false;

    return this.DISCO_BOTS.some(bot =>
      bot.toLowerCase().includes(username.toLowerCase())
    );
  }

  /**
   * Parse channel post into NewsItem
   */
  private parseChannelPost(post: TelegramMessage): NewsItem | null {
    const text = post.text || post.caption;
    if (!text || text.length < 20) return null;

    try {
      // Extract category from content
      const category = this.detectCategory(text);

      // Extract title (first line or first 100 chars)
      const lines = text.split('\n');
      const title = lines[0].length > 10 ? lines[0] : text.substring(0, 100);

      // Summary is the full text (truncated)
      const summary = text.substring(0, 300);

      // Generate ID from message
      const id = this.generateNumericId(`${post.chat.id}-${post.message_id}`);

      return {
        id,
        category,
        title: title.trim(),
        summary: summary.trim(),
        timestamp: new Date(post.date * 1000),
        source: `Telegram: ${post.chat.title || post.chat.username || 'Unknown'}`,
        metadata: {
          telegramMessageId: post.message_id,
          telegramChatId: post.chat.id,
        },
      };
    } catch (error) {
      console.error('Error parsing channel post:', error);
      return null;
    }
  }

  /**
   * Parse message into PowerOutage
   */
  private parseOutageMessage(message: TelegramMessage): PowerOutage | null {
    const text = message.text || message.caption;
    if (!text) return null;

    try {
      // Look for outage indicators
      const lowerText = text.toLowerCase();
      if (!lowerText.includes('outage') && !lowerText.includes('power') && !lowerText.includes('supply')) {
        return null;
      }

      // Determine DisCo from chat
      const disCoId = this.getDisCoFromChat(message.chat.username || '');

      // Try to extract area information
      const area = this.extractArea(text);

      // Determine outage type
      const type = this.determineOutageType(text);

      // Generate ID
      const id = this.generateNumericId(`${message.chat.id}-${message.message_id}`);

      return {
        id: `telegram-${id}`,
        disCoId: disCoId || 'unknown',
        affectedArea: area || 'Unknown area',
        type,
        reason: text.substring(0, 200),
        startTime: new Date(message.date * 1000),
        source: `Telegram: ${message.chat.username || 'DisCo Bot'}`,
        sourceType: SourceType.Official,
        metadata: {
          telegramMessageId: message.message_id,
          telegramChatId: message.chat.id,
        },
      };
    } catch (error) {
      console.error('Error parsing outage message:', error);
      return null;
    }
  }

  /**
   * Detect news category from text
   */
  private detectCategory(text: string): 'ENERGY' | 'EDUCATION' {
    const lowerText = text.toLowerCase();

    const energyKeywords = ['power', 'electricity', 'outage', 'disco', 'nerc', 'energy', 'grid'];
    const educationKeywords = ['jamb', 'waec', 'neco', 'exam', 'result', 'education', 'student'];

    const energyScore = energyKeywords.reduce(
      (score, keyword) => score + (lowerText.includes(keyword) ? 1 : 0),
      0
    );

    const educationScore = educationKeywords.reduce(
      (score, keyword) => score + (lowerText.includes(keyword) ? 1 : 0),
      0
    );

    return energyScore > educationScore ? 'ENERGY' : 'EDUCATION';
  }

  /**
   * Get DisCo ID from chat username
   */
  private getDisCoFromChat(username: string): string | null {
    const mapping: { [key: string]: string } = {
      'aedc': 'aedc',
      'phed': 'phed',
      'ikeja': 'ikeja',
      'eko': 'eko',
      'ibedc': 'ibedc',
      'enugu': 'eedc',
    };

    const lower = username.toLowerCase();
    for (const [key, discoId] of Object.entries(mapping)) {
      if (lower.includes(key)) return discoId;
    }

    return null;
  }

  /**
   * Extract area from message text
   */
  private extractArea(text: string): string | null {
    // Look for common patterns like "Area: XYZ" or "in XYZ area"
    const patterns = [
      /area[:\s]+([^\n,\.]+)/i,
      /in\s+([^\s]+(?:\s+[^\s]+){0,2})\s+area/i,
      /affecting\s+([^\n,\.]+)/i,
      /location[:\s]+([^\n,\.]+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  }

  /**
   * Determine outage type from message
   */
  private determineOutageType(text: string): OutageType {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('planned') || lowerText.includes('maintenance') || lowerText.includes('scheduled')) {
      return OutageType.Planned;
    }

    if (lowerText.includes('restored') || lowerText.includes('resolved')) {
      return OutageType.Restored;
    }

    if (lowerText.includes('grid') || lowerText.includes('tcn')) {
      return OutageType.Grid;
    }

    return OutageType.Unplanned;
  }

  /**
   * Generate numeric ID from string
   */
  private generateNumericId(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Get list of monitored channels
   */
  getMonitoredChannels(): string[] {
    return [...this.NEWS_CHANNELS];
  }

  /**
   * Get list of DisCo bots
   */
  getDisCoBots(): string[] {
    return [...this.DISCO_BOTS];
  }
}

// Export singleton instance
export const telegramService = new TelegramService();
