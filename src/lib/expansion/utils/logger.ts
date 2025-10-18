/**
 * Logger Utility
 * Centralizované logovanie pre NG-Power-Exams
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

export interface LogMetadata {
  [key: string]: unknown;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  metadata?: LogMetadata;
  context?: string;
}

class Logger {
  private currentLevel: LogLevel = LogLevel.INFO;
  private readonly logs: LogEntry[] = [];
  private readonly maxLogs: number = 1000;

  setLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  debug(message: string, metadata?: LogMetadata): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  info(message: string, metadata?: LogMetadata): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  warn(message: string, metadata?: LogMetadata): void {
    this.log(LogLevel.WARN, message, metadata);
  }

  error(message: string, error?: Error | unknown, metadata?: LogMetadata): void {
    const errorMetadata = {
      ...metadata,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error
    };
    this.log(LogLevel.ERROR, message, errorMetadata);
  }

  private log(level: LogLevel, message: string, metadata?: LogMetadata): void {
    if (level < this.currentLevel) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      metadata,
      context: this.getContext()
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    this.outputToConsole(entry);
  }

  private outputToConsole(entry: LogEntry): void {
    const prefix = `[${entry.timestamp}] [${LogLevel[entry.level]}]`;
    const message = `${prefix} ${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG: console.debug(message, entry.metadata); break;
      case LogLevel.INFO: console.info(message, entry.metadata); break;
      case LogLevel.WARN: console.warn(message, entry.metadata); break;
      case LogLevel.ERROR: console.error(message, entry.metadata); break;
    }
  }

  private getContext(): string {
    return typeof window !== 'undefined' ? 'browser' : 'unknown';
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clear(): void {
    this.logs.length = 0;
  }

  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const logger = new Logger();

if (typeof window !== 'undefined') {
  const isDevelopment = window.location.hostname === 'localhost';
  logger.setLevel(isDevelopment ? LogLevel.DEBUG : LogLevel.INFO);
}

export function createScopedLogger(scope: string) {
  return {
    debug: (msg: string, meta?: LogMetadata) => logger.debug(`[${scope}] ${msg}`, meta),
    info: (msg: string, meta?: LogMetadata) => logger.info(`[${scope}] ${msg}`, meta),
    warn: (msg: string, meta?: LogMetadata) => logger.warn(`[${scope}] ${msg}`, meta),
    error: (msg: string, error?: Error | unknown, meta?: LogMetadata) => 
      logger.error(`[${scope}] ${msg}`, error, meta)
  };
}
