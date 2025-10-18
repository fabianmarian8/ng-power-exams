/**
 * Function Template
 * Štandardizovaná šablóna pre utility funkcie
 */

import { logger } from '../utils/logger';
import { errorHandler } from '../utils/error-handler';

/**
 * Template function
 * @param param1 - Description
 * @param param2 - Options
 * @returns Result or null
 * @example
 * ```typescript
 * const result = templateFunction('value', { option: true });
 * ```
 */
export function templateFunction<T>(
  param1: string,
  param2?: { option?: boolean }
): T | null {
  try {
    logger.info('Starting template function', { param1, param2 });

    if (!param1) {
      throw new Error('param1 is required');
    }

    // Implementation
    const result = null as T | null;

    logger.info('Template function completed', { result });
    return result;

  } catch (error) {
    errorHandler.handle(error, {
      context: 'templateFunction',
      params: { param1, param2 }
    });
    return null;
  }
}

export async function templateFunctionAsync<T>(
  param1: string,
  param2?: { option?: boolean }
): Promise<T | null> {
  try {
    logger.info('Starting async template function', { param1, param2 });

    await Promise.resolve();
    const result = null as T | null;

    logger.info('Async template function completed', { result });
    return result;

  } catch (error) {
    errorHandler.handle(error, {
      context: 'templateFunctionAsync',
      params: { param1, param2 }
    });
    return null;
  }
}

export interface TemplateFunctionOptions {
  option?: boolean;
  timeout?: number;
  retry?: number;
}

export interface TemplateFunctionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const DEFAULT_OPTIONS: TemplateFunctionOptions = {
  option: false,
  timeout: 5000,
  retry: 3
};

export const templateUtils = {
  templateFunction,
  templateFunctionAsync,
  DEFAULT_OPTIONS
};
