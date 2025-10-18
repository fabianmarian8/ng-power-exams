/**
 * Expansion Configuration
 * Centrálna konfigurácia pre expansion system
 */

export interface ExpansionConfig {
  features: {
    advancedLogging: boolean;
    errorTracking: boolean;
    performanceMonitoring: boolean;
    debugMode: boolean;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    maxLogs: number;
    consoleOutput: boolean;
  };
  errorHandling: {
    maxHistorySize: number;
    reportToServer: boolean;
    showUserMessages: boolean;
  };
  development: {
    mockData: boolean;
    slowMode: boolean;
    verboseOutput: boolean;
  };
}

const defaultConfig: ExpansionConfig = {
  features: {
    advancedLogging: true,
    errorTracking: true,
    performanceMonitoring: false,
    debugMode: false
  },
  logging: {
    level: 'info',
    maxLogs: 1000,
    consoleOutput: true
  },
  errorHandling: {
    maxHistorySize: 100,
    reportToServer: false,
    showUserMessages: true
  },
  development: {
    mockData: false,
    slowMode: false,
    verboseOutput: false
  }
};

const productionConfig: Partial<ExpansionConfig> = {
  features: {
    advancedLogging: false,
    errorTracking: true,
    performanceMonitoring: true,
    debugMode: false
  },
  logging: {
    level: 'warn',
    maxLogs: 500,
    consoleOutput: false
  }
};

const developmentConfig: Partial<ExpansionConfig> = {
  features: {
    advancedLogging: true,
    errorTracking: true,
    performanceMonitoring: true,
    debugMode: true
  },
  logging: {
    level: 'debug',
    maxLogs: 2000,
    consoleOutput: true
  },
  development: {
    mockData: true,
    slowMode: false,
    verboseOutput: true
  }
};

class ConfigManager {
  private config: ExpansionConfig = { ...defaultConfig };

  constructor() {
    this.loadEnvironmentConfig();
  }

  private loadEnvironmentConfig(): void {
    const isDevelopment = this.isDevelopmentEnvironment();
    if (isDevelopment) {
      this.config = this.mergeConfig(defaultConfig, developmentConfig);
    } else {
      this.config = this.mergeConfig(defaultConfig, productionConfig);
    }
  }

  private isDevelopmentEnvironment(): boolean {
    if (typeof window === 'undefined') return false;
    return (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.includes('dev.')
    );
  }

  private mergeConfig(base: ExpansionConfig, override: Partial<ExpansionConfig>): ExpansionConfig {
    return {
      features: { ...base.features, ...override.features },
      logging: { ...base.logging, ...override.logging },
      errorHandling: { ...base.errorHandling, ...override.errorHandling },
      development: { ...base.development, ...override.development }
    };
  }

  getConfig(): ExpansionConfig {
    return { ...this.config };
  }

  isFeatureEnabled(feature: keyof ExpansionConfig['features']): boolean {
    return this.config.features[feature];
  }

  setFeature(feature: keyof ExpansionConfig['features'], enabled: boolean): void {
    this.config.features[feature] = enabled;
  }

  getLoggingLevel(): string {
    return this.config.logging.level;
  }

  updateConfig(updates: Partial<ExpansionConfig>): void {
    this.config = this.mergeConfig(this.config, updates);
  }

  reset(): void {
    this.config = { ...defaultConfig };
    this.loadEnvironmentConfig();
  }
}

export const configManager = new ConfigManager();
export const expansionConfig = configManager.getConfig();

export function isFeatureEnabled(feature: keyof ExpansionConfig['features']): boolean {
  return configManager.isFeatureEnabled(feature);
}

export function getConfig(): ExpansionConfig {
  return configManager.getConfig();
}
