/**
 * Error Handler Utility
 * Centralizované spracovanie chýb pre NG-Power-Exams
 */

import { logger } from './logger';

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ErrorContext {
  context?: string;
  component?: string;
  action?: string;
  params?: Record<string, unknown>;
  userId?: string;
  sessionId?: string;
}

export interface HandledError {
  message: string;
  userMessage: string;
  severity: ErrorSeverity;
  timestamp: string;
  context?: ErrorContext;
  stack?: string;
  recoverable: boolean;
}

class ErrorHandler {
  private readonly errorHistory: HandledError[] = [];
  private readonly maxHistory: number = 100;

  handle(error: Error | unknown, context?: ErrorContext): HandledError {
    const handledError = this.processError(error, context);
    
    logger.error(handledError.message, error, {
      ...context,
      severity: handledError.severity
    });

    this.errorHistory.push(handledError);
    if (this.errorHistory.length > this.maxHistory) {
      this.errorHistory.shift();
    }

    return handledError;
  }

  private processError(error: Error | unknown, context?: ErrorContext): HandledError {
    const timestamp = new Date().toISOString();

    if (error instanceof Error) {
      return {
        message: error.message,
        userMessage: this.getUserFriendlyMessage(error),
        severity: this.determineSeverity(error),
        timestamp,
        context,
        stack: error.stack,
        recoverable: this.isRecoverable(error)
      };
    }

    if (typeof error === 'string') {
      return {
        message: error,
        userMessage: error,
        severity: ErrorSeverity.MEDIUM,
        timestamp,
        context,
        recoverable: true
      };
    }

    return {
      message: 'Unknown error occurred',
      userMessage: 'Vyskytla sa neočakávaná chyba. Skúste to prosím znova.',
      severity: ErrorSeverity.HIGH,
      timestamp,
      context,
      recoverable: false
    };
  }

  private determineSeverity(error: Error): ErrorSeverity {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch')) return ErrorSeverity.MEDIUM;
    if (message.includes('auth') || message.includes('permission')) return ErrorSeverity.HIGH;
    if (message.includes('critical') || message.includes('fatal')) return ErrorSeverity.CRITICAL;

    return ErrorSeverity.LOW;
  }

  private isRecoverable(error: Error): boolean {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('timeout')) return true;
    if (message.includes('auth') || message.includes('unauthorized')) return false;
    if (message.includes('validation') || message.includes('invalid')) return true;

    return true;
  }

  private getUserFriendlyMessage(error: Error): string {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch')) {
      return 'Problém so sieťovým pripojením. Skontrolujte prosím internetové pripojenie.';
    }
    if (message.includes('auth') || message.includes('unauthorized')) {
      return 'Nemáte oprávnenie na túto akciu. Prihláste sa prosím.';
    }
    if (message.includes('not found') || message.includes('404')) {
      return 'Požadovaný zdroj nebol nájdený.';
    }
    if (message.includes('timeout')) {
      return 'Operácia trvala príliš dlho. Skúste to prosím znova.';
    }
    if (message.includes('validation')) {
      return 'Neplatné údaje. Skontrolujte prosím vstupné polia.';
    }

    return 'Vyskytla sa chyba. Skúste to prosím znova.';
  }

  getHistory(): HandledError[] {
    return [...this.errorHistory];
  }

  getBySeverity(severity: ErrorSeverity): HandledError[] {
    return this.errorHistory.filter(err => err.severity === severity);
  }

  getCriticalErrors(): HandledError[] {
    return this.getBySeverity(ErrorSeverity.CRITICAL);
  }

  clearHistory(): void {
    this.errorHistory.length = 0;
  }

  exportReport(): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      totalErrors: this.errorHistory.length,
      bySeverity: {
        low: this.getBySeverity(ErrorSeverity.LOW).length,
        medium: this.getBySeverity(ErrorSeverity.MEDIUM).length,
        high: this.getBySeverity(ErrorSeverity.HIGH).length,
        critical: this.getBySeverity(ErrorSeverity.CRITICAL).length
      },
      errors: this.errorHistory
    }, null, 2);
  }

  handleAsync = (context?: ErrorContext) => {
    return (error: Error | unknown) => {
      this.handle(error, context);
      throw error;
    };
  };
}

export const errorHandler = new ErrorHandler();

export function withErrorHandling<T>(fn: () => T, context?: ErrorContext): T | null {
  try {
    return fn();
  } catch (error) {
    errorHandler.handle(error, context);
    return null;
  }
}

export async function withErrorHandlingAsync<T>(
  fn: () => Promise<T>,
  context?: ErrorContext
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    errorHandler.handle(error, context);
    return null;
  }
}
