/**
 * Ikeja Electric Fault Log Scraper
 *
 * Scrapes outage data from Ikeja Electric's online fault log
 * Source: https://www.ikejaelectric.com/fault-log
 *
 * According to research report:
 * - The fault log is static HTML (possibly PHP backend)
 * - Shows current faults with details (feeder, areas affected, etc.)
 * - No JavaScript load needed, straightforward to parse
 * - Segmented by undertaking (regions: Abule Egba, Ikeja, Ikorodu, etc.)
 */

import { PowerOutage, OutageType, SourceType } from '../../types';

export interface IkejaFaultEntry {
  undertaking: string;
  feeder: string;
  areasAffected: string;
  fault: string;
  dateReported?: Date;
}

class IkejaElectricScraper {
  private readonly FAULT_LOG_URL = 'https://www.ikejaelectric.com/fault-log';
  private readonly PROXY_URL = 'https://api.allorigins.win/raw?url=';

  /**
   * Fetch and parse fault log from Ikeja Electric website
   */
  async scrapeFaultLog(): Promise<PowerOutage[]> {
    try {
      // Use CORS proxy to fetch the page
      const response = await fetch(`${this.PROXY_URL}${encodeURIComponent(this.FAULT_LOG_URL)}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      return this.parseHTML(html);
    } catch (error) {
      console.error('Error scraping Ikeja Electric fault log:', error);
      return [];
    }
  }

  /**
   * Parse HTML to extract fault information
   * The actual parsing will depend on the HTML structure
   */
  private parseHTML(html: string): PowerOutage[] {
    const outages: PowerOutage[] = [];

    try {
      // Create a DOM parser (browser environment)
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Look for fault entries
      // This selector needs to be adjusted based on actual HTML structure
      // Common patterns: tables, divs with classes, lists
      const faultEntries = this.extractFaultEntries(doc);

      faultEntries.forEach((entry, index) => {
        outages.push({
          id: `ikeja-${Date.now()}-${index}`,
          disCoId: 'ikeja',
          affectedArea: entry.areasAffected,
          type: this.determineOutageType(entry.fault),
          reason: `${entry.fault} - Feeder: ${entry.feeder}`,
          startTime: entry.dateReported || new Date(),
          source: 'Ikeja Electric Fault Log',
          sourceType: SourceType.Official,
          metadata: {
            undertaking: entry.undertaking,
            feeder: entry.feeder,
          },
        });
      });

      console.log(`Scraped ${outages.length} fault entries from Ikeja Electric`);
    } catch (error) {
      console.error('Error parsing HTML:', error);
    }

    return outages;
  }

  /**
   * Extract fault entries from document
   * This method handles multiple possible HTML structures
   */
  private extractFaultEntries(doc: Document): IkejaFaultEntry[] {
    const entries: IkejaFaultEntry[] = [];

    // Strategy 1: Try table-based layout
    const tables = doc.querySelectorAll('table');
    if (tables.length > 0) {
      tables.forEach(table => {
        const rows = table.querySelectorAll('tr');
        // Skip header row
        for (let i = 1; i < rows.length; i++) {
          const cells = rows[i].querySelectorAll('td, th');
          if (cells.length >= 4) {
            entries.push({
              undertaking: cells[0]?.textContent?.trim() || '',
              feeder: cells[1]?.textContent?.trim() || '',
              areasAffected: cells[2]?.textContent?.trim() || '',
              fault: cells[3]?.textContent?.trim() || '',
            });
          }
        }
      });
    }

    // Strategy 2: Try div/list-based layout
    if (entries.length === 0) {
      const faultDivs = doc.querySelectorAll('.fault-entry, .outage-item, [class*="fault"], [class*="outage"]');
      faultDivs.forEach(div => {
        const entry = this.extractFromDiv(div as HTMLElement);
        if (entry) entries.push(entry);
      });
    }

    // Strategy 3: Try structured data (JSON-LD, microdata)
    if (entries.length === 0) {
      const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
      jsonLdScripts.forEach(script => {
        try {
          const data = JSON.parse(script.textContent || '{}');
          if (data.faults || data.outages) {
            // Process structured data
            const faults = data.faults || data.outages;
            if (Array.isArray(faults)) {
              faults.forEach((fault: any) => {
                entries.push({
                  undertaking: fault.undertaking || fault.region || '',
                  feeder: fault.feeder || '',
                  areasAffected: fault.areas || fault.location || '',
                  fault: fault.description || fault.type || '',
                });
              });
            }
          }
        } catch (e) {
          // Ignore JSON parse errors
        }
      });
    }

    return entries;
  }

  /**
   * Extract fault entry from a div element
   */
  private extractFromDiv(div: HTMLElement): IkejaFaultEntry | null {
    try {
      // Look for specific patterns in the div
      const text = div.textContent || '';

      // Try to find labeled fields
      const undertaking = this.extractField(div, ['undertaking', 'region', 'area']);
      const feeder = this.extractField(div, ['feeder', 'line']);
      const areas = this.extractField(div, ['areas', 'affected', 'location']);
      const fault = this.extractField(div, ['fault', 'issue', 'problem', 'description']);

      if (areas && fault) {
        return {
          undertaking: undertaking || 'Unknown',
          feeder: feeder || 'Unknown',
          areasAffected: areas,
          fault: fault,
        };
      }
    } catch (error) {
      console.error('Error extracting from div:', error);
    }

    return null;
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
      if (byData?.textContent) return byData.textContent.trim();

      // Try label + value pattern
      const text = element.textContent || '';
      const regex = new RegExp(`${label}[:\\s-]+(.*?)(?:\\n|$)`, 'i');
      const match = text.match(regex);
      if (match) return match[1].trim();
    }

    return '';
  }

  /**
   * Determine outage type from fault description
   */
  private determineOutageType(fault: string): OutageType {
    const lowerFault = fault.toLowerCase();

    if (lowerFault.includes('planned') || lowerFault.includes('maintenance') || lowerFault.includes('scheduled')) {
      return OutageType.Planned;
    }

    if (lowerFault.includes('transformer') || lowerFault.includes('cable') || lowerFault.includes('fault')) {
      return OutageType.Unplanned;
    }

    if (lowerFault.includes('grid') || lowerFault.includes('tcn')) {
      return OutageType.Grid;
    }

    return OutageType.Unplanned;
  }

  /**
   * Health check - verify if the fault log page is accessible
   */
  async checkAvailability(): Promise<boolean> {
    try {
      const response = await fetch(`${this.PROXY_URL}${encodeURIComponent(this.FAULT_LOG_URL)}`, {
        method: 'HEAD',
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const ikejaElectricScraper = new IkejaElectricScraper();
