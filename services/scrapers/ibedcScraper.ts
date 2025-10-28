/**
 * IBEDC (Ibadan Electricity Distribution Company) Outage Scraper
 *
 * Scrapes outage data from IBEDC's Outage Information page
 * Source: https://www.ibedc.com/outage-information
 *
 * According to research report:
 * - Provides a ready-made list of outages by region in HTML
 * - Covers Oyo, Ogun, Osun, Kwara states (South-West Nigeria)
 * - Can be scraped for near real-time outage updates
 * - Filterable regions make it easy to parse
 * - Regular updates, high accuracy (official source)
 */

import { PowerOutage, OutageType, SourceType } from '../../types';

export interface IBEDCOutageEntry {
  state: string;
  area: string;
  feeder: string;
  status: string;
  dateReported: Date;
  estimatedRestoration?: Date;
}

class IBEDCScraper {
  private readonly OUTAGE_INFO_URL = 'https://www.ibedc.com/outage-information';
  private readonly PROXY_URL = 'https://api.allorigins.win/raw?url=';

  // States covered by IBEDC
  private readonly STATES = ['Oyo', 'Ogun', 'Osun', 'Kwara'];

  /**
   * Fetch and parse outage information from IBEDC website
   */
  async scrapeOutages(): Promise<PowerOutage[]> {
    try {
      const response = await fetch(`${this.PROXY_URL}${encodeURIComponent(this.OUTAGE_INFO_URL)}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      return this.parseHTML(html);
    } catch (error) {
      console.error('Error scraping IBEDC outage information:', error);
      return [];
    }
  }

  /**
   * Scrape outages for a specific state
   */
  async scrapeByState(state: string): Promise<PowerOutage[]> {
    const allOutages = await this.scrapeOutages();
    return allOutages.filter(outage =>
      outage.metadata?.state?.toLowerCase() === state.toLowerCase()
    );
  }

  /**
   * Parse HTML to extract outage information
   */
  private parseHTML(html: string): PowerOutage[] {
    const outages: PowerOutage[] = [];

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      const outageEntries = this.extractOutageEntries(doc);

      outageEntries.forEach((entry, index) => {
        outages.push({
          id: `ibedc-${Date.now()}-${index}`,
          disCoId: 'ibedc',
          affectedArea: `${entry.area}, ${entry.state}`,
          type: this.determineOutageType(entry.status),
          reason: `${entry.status} - Feeder: ${entry.feeder}`,
          startTime: entry.dateReported,
          estimatedRestoreTime: entry.estimatedRestoration,
          source: 'IBEDC Outage Information',
          sourceType: SourceType.Official,
          metadata: {
            state: entry.state,
            feeder: entry.feeder,
            area: entry.area,
          },
        });
      });

      console.log(`Scraped ${outages.length} outage entries from IBEDC`);
    } catch (error) {
      console.error('Error parsing IBEDC HTML:', error);
    }

    return outages;
  }

  /**
   * Extract outage entries from document
   */
  private extractOutageEntries(doc: Document): IBEDCOutageEntry[] {
    const entries: IBEDCOutageEntry[] = [];

    // Strategy 1: Table-based layout
    const tables = doc.querySelectorAll('table.outage-table, table[class*="outage"], table');
    tables.forEach(table => {
      const rows = table.querySelectorAll('tbody tr, tr');

      rows.forEach((row, index) => {
        // Skip header row
        if (index === 0 && this.isHeaderRow(row)) return;

        const cells = row.querySelectorAll('td, th');
        if (cells.length >= 3) {
          const entry = this.parseTableRow(cells);
          if (entry) entries.push(entry);
        }
      });
    });

    // Strategy 2: Card/List-based layout
    if (entries.length === 0) {
      const outageCards = doc.querySelectorAll('.outage-card, .outage-item, [class*="outage-"]');
      outageCards.forEach(card => {
        const entry = this.parseCard(card as HTMLElement);
        if (entry) entries.push(entry);
      });
    }

    // Strategy 3: State-specific sections
    if (entries.length === 0) {
      this.STATES.forEach(state => {
        const stateSection = doc.querySelector(`#${state.toLowerCase()}, .state-${state.toLowerCase()}, [data-state="${state}"]`);
        if (stateSection) {
          const stateEntries = this.parseStateSection(stateSection as HTMLElement, state);
          entries.push(...stateEntries);
        }
      });
    }

    return entries;
  }

  /**
   * Check if a row is a header row
   */
  private isHeaderRow(row: Element): boolean {
    const text = row.textContent?.toLowerCase() || '';
    return text.includes('state') || text.includes('area') || text.includes('feeder') || text.includes('status');
  }

  /**
   * Parse a table row into an outage entry
   */
  private parseTableRow(cells: NodeListOf<Element>): IBEDCOutageEntry | null {
    try {
      // Common table structures:
      // [State, Area, Feeder, Status, Date, Estimated Restoration]
      // [Area, Feeder, Status, Date]
      // [Location, Description, Date]

      const cellTexts = Array.from(cells).map(cell => cell.textContent?.trim() || '');

      // Try to identify which column is which
      let state = '';
      let area = '';
      let feeder = '';
      let status = '';
      let dateReported = new Date();

      if (cells.length >= 5) {
        // Full format
        state = this.findState(cellTexts[0]) || this.findState(cellTexts.join(' '));
        area = cellTexts[1];
        feeder = cellTexts[2];
        status = cellTexts[3];
        dateReported = this.parseDate(cellTexts[4]) || new Date();
      } else if (cells.length >= 4) {
        // Medium format
        const combined = cellTexts.join(' ');
        state = this.findState(combined);
        area = cellTexts[0];
        feeder = cellTexts[1];
        status = cellTexts[2];
        dateReported = this.parseDate(cellTexts[3]) || new Date();
      } else if (cells.length >= 3) {
        // Minimal format
        const combined = cellTexts.join(' ');
        state = this.findState(combined);
        area = cellTexts[0];
        feeder = 'Unknown';
        status = cellTexts[1];
        dateReported = this.parseDate(cellTexts[2]) || new Date();
      }

      // Only return if we have minimum required data
      if (area && status) {
        return {
          state: state || 'Unknown',
          area,
          feeder,
          status,
          dateReported,
        };
      }
    } catch (error) {
      console.error('Error parsing table row:', error);
    }

    return null;
  }

  /**
   * Parse a card/div element
   */
  private parseCard(card: HTMLElement): IBEDCOutageEntry | null {
    try {
      const text = card.textContent || '';

      const state = this.findState(text);
      const area = this.extractField(card, ['area', 'location', 'region']) || 'Unknown';
      const feeder = this.extractField(card, ['feeder', 'line']) || 'Unknown';
      const status = this.extractField(card, ['status', 'fault', 'issue']) || 'Outage';
      const dateStr = this.extractField(card, ['date', 'reported', 'time']);
      const dateReported = this.parseDate(dateStr) || new Date();

      if (area && status) {
        return {
          state: state || 'Unknown',
          area,
          feeder,
          status,
          dateReported,
        };
      }
    } catch (error) {
      console.error('Error parsing card:', error);
    }

    return null;
  }

  /**
   * Parse a state section
   */
  private parseStateSection(section: HTMLElement, state: string): IBEDCOutageEntry[] {
    const entries: IBEDCOutageEntry[] = [];

    const items = section.querySelectorAll('li, .item, .outage');
    items.forEach(item => {
      const text = item.textContent?.trim() || '';
      if (text.length > 10) {
        entries.push({
          state,
          area: text.split('-')[0]?.trim() || text.substring(0, 50),
          feeder: 'Unknown',
          status: 'Outage',
          dateReported: new Date(),
        });
      }
    });

    return entries;
  }

  /**
   * Find state name in text
   */
  private findState(text: string): string {
    for (const state of this.STATES) {
      if (text.toLowerCase().includes(state.toLowerCase())) {
        return state;
      }
    }
    return '';
  }

  /**
   * Extract field value by looking for labels
   */
  private extractField(element: HTMLElement, labels: string[]): string {
    for (const label of labels) {
      // Try class-based selection
      const byClass = element.querySelector(`.${label}, [class*="${label}"]`);
      if (byClass?.textContent) return byClass.textContent.trim();

      // Try data attribute
      const byData = element.querySelector(`[data-${label}]`);
      if (byData) {
        const value = byData.getAttribute(`data-${label}`) || byData.textContent;
        if (value) return value.trim();
      }

      // Try label + value pattern
      const text = element.textContent || '';
      const regex = new RegExp(`${label}[:\\s-]+(.*?)(?:\\n|,|$)`, 'i');
      const match = text.match(regex);
      if (match && match[1]) return match[1].trim();
    }

    return '';
  }

  /**
   * Parse date string into Date object
   */
  private parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;

    try {
      // Try standard date parsing
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) return date;

      // Try common Nigerian date formats
      // e.g., "23/12/2024", "23-12-2024", "23 Dec 2024"
      const formats = [
        /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/, // DD/MM/YYYY or DD-MM-YYYY
        /(\d{1,2})\s+(\w+)\s+(\d{4})/, // DD MMM YYYY
      ];

      for (const format of formats) {
        const match = dateStr.match(format);
        if (match) {
          if (format === formats[0]) {
            // DD/MM/YYYY
            const [, day, month, year] = match;
            return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          } else if (format === formats[1]) {
            // DD MMM YYYY
            return new Date(dateStr);
          }
        }
      }
    } catch (error) {
      console.error('Error parsing date:', error);
    }

    return null;
  }

  /**
   * Determine outage type from status description
   */
  private determineOutageType(status: string): OutageType {
    const lowerStatus = status.toLowerCase();

    if (lowerStatus.includes('planned') || lowerStatus.includes('maintenance') || lowerStatus.includes('scheduled')) {
      return OutageType.Planned;
    }

    if (lowerStatus.includes('restored') || lowerStatus.includes('fixed') || lowerStatus.includes('resolved')) {
      return OutageType.Restored;
    }

    if (lowerStatus.includes('grid') || lowerStatus.includes('tcn')) {
      return OutageType.Grid;
    }

    return OutageType.Unplanned;
  }

  /**
   * Health check - verify if the outage page is accessible
   */
  async checkAvailability(): Promise<boolean> {
    try {
      const response = await fetch(`${this.PROXY_URL}${encodeURIComponent(this.OUTAGE_INFO_URL)}`, {
        method: 'HEAD',
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get list of states covered by IBEDC
   */
  getSupportedStates(): string[] {
    return [...this.STATES];
  }
}

// Export singleton instance
export const ibedcScraper = new IBEDCScraper();
