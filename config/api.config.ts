/**
 * API Configuration for Data Sources Integration
 *
 * This file contains all API endpoints and configurations for:
 * - Official DisCo sources
 * - Social media sources (Twitter/X, Telegram)
 * - Exam board APIs
 * - News aggregation sources
 */

export interface APIConfig {
  baseUrl: string;
  apiKey?: string;
  enabled: boolean;
}

export interface DataSourceConfig {
  official: {
    discos: {
      ikeja: APIConfig;
      aedc: APIConfig;
      phed: APIConfig;
      eedc: APIConfig;
      eko: APIConfig;
      ibedc: APIConfig;
      kedco: APIConfig;
      kaduna: APIConfig;
      jos: APIConfig;
      yola: APIConfig;
      bedc: APIConfig;
      aba: APIConfig;
    };
    tcn: APIConfig;
    examBoards: {
      jamb: APIConfig;
      waec: APIConfig;
      neco: APIConfig;
    };
  };
  social: {
    twitter: {
      baseUrl: string;
      apiKey?: string;
      bearerToken?: string;
      enabled: boolean;
      accounts: string[];
    };
    telegram: {
      baseUrl: string;
      botToken?: string;
      enabled: boolean;
      channels: string[];
    };
  };
  news: {
    rss: string[];
    websites: string[];
  };
  polling: {
    powerOutages: number; // milliseconds
    examStatus: number;
    news: number;
  };
}

/**
 * Main configuration object
 *
 * IMPORTANT: For production use, move API keys to environment variables
 * and NEVER commit them to version control.
 */
export const API_CONFIG: DataSourceConfig = {
  official: {
    // DisCo API endpoints - These are example endpoints
    // Replace with actual DisCo APIs when available
    discos: {
      ikeja: {
        baseUrl: 'https://api.ikejaelectric.com/v1',
        apiKey: process.env.VITE_IKEJA_API_KEY,
        enabled: false, // Set to true when API is available
      },
      aedc: {
        baseUrl: 'https://api.aedcelectricity.com/v1',
        apiKey: process.env.VITE_AEDC_API_KEY,
        enabled: false,
      },
      phed: {
        baseUrl: 'https://api.phed.com.ng/v1',
        apiKey: process.env.VITE_PHED_API_KEY,
        enabled: false,
      },
      eedc: {
        baseUrl: 'https://api.enugudisco.com/v1',
        apiKey: process.env.VITE_EEDC_API_KEY,
        enabled: false,
      },
      eko: {
        baseUrl: 'https://api.ekedp.com/v1',
        apiKey: process.env.VITE_EKO_API_KEY,
        enabled: false,
      },
      ibedc: {
        baseUrl: 'https://api.ibedc.com/v1',
        apiKey: process.env.VITE_IBEDC_API_KEY,
        enabled: false,
      },
      kedco: {
        baseUrl: 'https://api.kedco.ng/v1',
        apiKey: process.env.VITE_KEDCO_API_KEY,
        enabled: false,
      },
      kaduna: {
        baseUrl: 'https://api.kadunaelectric.com/v1',
        apiKey: process.env.VITE_KADUNA_API_KEY,
        enabled: false,
      },
      jos: {
        baseUrl: 'https://api.jedplc.com/v1',
        apiKey: process.env.VITE_JOS_API_KEY,
        enabled: false,
      },
      yola: {
        baseUrl: 'https://api.yedc.com.ng/v1',
        apiKey: process.env.VITE_YOLA_API_KEY,
        enabled: false,
      },
      bedc: {
        baseUrl: 'https://api.bedcpower.com/v1',
        apiKey: process.env.VITE_BEDC_API_KEY,
        enabled: false,
      },
      aba: {
        baseUrl: 'https://api.abapower.com/v1',
        apiKey: process.env.VITE_ABA_API_KEY,
        enabled: false,
      },
    },
    // TCN (Transmission Company of Nigeria) API
    tcn: {
      baseUrl: 'https://api.tcn.org.ng/v1',
      apiKey: process.env.VITE_TCN_API_KEY,
      enabled: false,
    },
    // Exam Boards APIs - Note: No public APIs available per research report
    examBoards: {
      jamb: {
        baseUrl: 'https://efacility.jamb.gov.ng', // e-Facility portal (login required)
        apiKey: process.env.VITE_JAMB_API_KEY,
        enabled: false, // No public API - results via portal/SMS only
        // Twitter: @JAMBHQ for announcements
        // Website: https://www.jamb.gov.ng/ for bulletins
      },
      waec: {
        baseUrl: 'https://www.waecdirect.org', // Result checker (requires scratch card)
        apiKey: process.env.VITE_WAEC_API_KEY,
        enabled: false, // No public API - verification API for institutions only (paid)
        // Twitter: @waecnigeria for announcements
        // Website: https://www.waecnigeria.org/
      },
      neco: {
        baseUrl: 'https://results.neco.gov.ng', // Results portal
        apiKey: process.env.VITE_NECO_API_KEY,
        enabled: false, // No public API - verification via NERVS (paid for institutions)
        // Twitter: @OfficialNecoNG for announcements
        // Website: https://www.neco.gov.ng/
      },
    },
  },

  // Social Media Integrations
  social: {
    twitter: {
      baseUrl: 'https://api.twitter.com/2',
      apiKey: process.env.VITE_TWITTER_API_KEY,
      bearerToken: process.env.VITE_TWITTER_BEARER_TOKEN,
      enabled: !!process.env.VITE_TWITTER_BEARER_TOKEN,
      // Twitter accounts to monitor for power outage updates
      accounts: [
        'IkejaElectric',
        'AEDCelectricity',
        'ekedp',
        'Ibadandisco',
        'EnuguDisco',
        'PHED_NG',
        'kedcomanager',
        'KadunaElectric',
        'JosElectricity',
        'Yoladisco',
        'BedcElectricity',
        'TCN_NG', // Transmission Company of Nigeria
      ],
    },
    telegram: {
      baseUrl: 'https://api.telegram.org',
      botToken: process.env.VITE_TELEGRAM_BOT_TOKEN,
      enabled: !!process.env.VITE_TELEGRAM_BOT_TOKEN,
      // Telegram channels to monitor - Updated with real channels from research report
      channels: [
        // News channels
        '@PunchNewspaper',      // Punch Newspapers official channel (~29k subscribers)
        '@tvcnews_nigeria',     // TVC News Nigeria
        '@nmliveupdates',       // Nairametrics Live Updates (business/energy news)

        // DisCo bots (for outage information)
        '@aedcelectricity',     // AEDC Telegram chat bot
        '@PHEDConnect_bot',     // PHED bot (nicknamed "Ibinabo")

        // Other potential channels (add as discovered)
        '@theelectricityhub',   // The Electricity Hub (industry news)
      ],
    },
  },

  // News Sources - Updated with real RSS feeds from research report
  news: {
    // RSS Feeds for energy and education news
    rss: [
      // General news feeds
      'http://punchng.com/feed',
      'https://www.premiumtimesng.com/feed',
      'https://guardian.ng/feed',
      'https://www.vanguardngr.com/feed/',
      'https://www.channelstv.com/feed/',

      // Category-specific feeds
      'https://www.premiumtimesng.com/category/education/feed', // Education
      'https://guardian.ng/category/energy/feed', // Energy
    ],
    // Official DisCo and exam board websites (for scraping)
    websites: [
      // DisCo outage pages
      'https://www.ikejaelectric.com/fault-log',
      'https://www.ibedc.com/outage-information',
      'https://www.ekedp.com/service-alert',

      // News sites
      'https://punchng.com',
      'https://www.premiumtimesng.com',
      'https://guardian.ng',
      'https://www.vanguardngr.com',

      // Government/Regulatory
      'https://nerc.gov.ng',
      'https://tcn.org.ng',
    ],
  },

  // Polling intervals for different data sources (in milliseconds)
  polling: {
    powerOutages: 120000, // 2 minutes
    examStatus: 300000, // 5 minutes
    news: 600000, // 10 minutes
  },
};

/**
 * Backend API Configuration
 *
 * For a production-ready solution, you should implement a backend service that:
 * 1. Aggregates data from multiple sources
 * 2. Handles API rate limits and authentication
 * 3. Caches data to reduce API calls
 * 4. Provides WebSocket support for real-time updates
 */
export const BACKEND_API = {
  baseUrl: process.env.VITE_BACKEND_URL || 'http://localhost:3000/api',
  endpoints: {
    powerOutages: {
      list: '/power-outages',
      byDisCo: (disCoId: string) => `/power-outages/disco/${disCoId}`,
      byState: (state: string) => `/power-outages/state/${state}`,
      create: '/power-outages',
      update: (id: string) => `/power-outages/${id}`,
    },
    examStatus: {
      list: '/exam-status',
      byBoard: (boardId: string) => `/exam-status/${boardId}`,
      check: (boardId: string) => `/exam-status/${boardId}/check`,
    },
    news: {
      list: '/news',
      byCategory: (category: string) => `/news/category/${category}`,
      latest: '/news/latest',
    },
    social: {
      twitter: '/social/twitter',
      telegram: '/social/telegram',
    },
  },
  // WebSocket configuration for real-time updates
  websocket: {
    url: process.env.VITE_WS_URL || 'ws://localhost:3000',
    reconnectInterval: 5000,
    channels: {
      powerOutages: 'power-outages',
      examStatus: 'exam-status',
      news: 'news',
    },
  },
};

/**
 * Mock Data Configuration
 * Use mock data when external APIs are not available
 * Set VITE_USE_MOCK_DATA=false in .env.local to use real data sources
 */
export const USE_MOCK_DATA = process.env.VITE_USE_MOCK_DATA !== 'false'; // Default to mock unless explicitly disabled

/**
 * Helper function to check if a data source is available
 */
export const isDataSourceAvailable = (source: APIConfig): boolean => {
  return source.enabled && !!source.baseUrl;
};

/**
 * Helper function to get API headers
 */
export const getAPIHeaders = (apiKey?: string): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  return headers;
};
