/**
 * Standardized error handling for E2E tests
 * Provides context protection and consistent error management
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Page } from '@playwright/test';

export class E2EErrorHandler {
  private static readonly CONTEXT_CLOSURE_PATTERNS = [
    'Target page, context or browser has been closed',
    'Execution context was destroyed',
    'Protocol error',
    'page.evaluate: Target closed',
    'page.locator: Target closed',
  ];

  /**
   * Check if an error is due to browser context closure
   */
  static isContextClosureError(error: any): boolean {
    const message = error?.message || '';
    return this.CONTEXT_CLOSURE_PATTERNS.some((pattern) =>
      message.includes(pattern)
    );
  }

  /**
   * Execute an operation with context protection
   */
  static async withContextProtection<T>(
    page: Page,
    operation: () => Promise<T>,
    defaultValue?: T
  ): Promise<T | undefined> {
    try {
      if (page.isClosed()) {
        console.warn('[E2EErrorHandler] Page is already closed');
        return defaultValue;
      }

      return await operation();
    } catch (error) {
      if (this.isContextClosureError(error)) {
        console.warn('[E2EErrorHandler] Context closure detected:', error);
        return defaultValue;
      }

      // Re-throw non-context errors
      throw error;
    }
  }

  /**
   * Execute an operation with retry logic
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000,
    shouldRetry?: (error: any) => boolean
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (shouldRetry && !shouldRetry(error)) {
          throw error;
        }

        if (attempt < maxRetries) {
          console.warn(
            `[E2EErrorHandler] Attempt ${attempt} failed, retrying...`
          );
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    throw lastError;
  }

  /**
   * Safe page evaluation with context protection
   */
  static async safeEvaluate<T>(
    page: Page,
    fn: () => T,
    defaultValue?: T
  ): Promise<T | undefined> {
    return this.withContextProtection(
      page,
      async () => await page.evaluate(fn),
      defaultValue
    );
  }

  /**
   * Safe element interaction with context protection
   */
  static async safeClick(
    page: Page,
    selector: string,
    options?: { timeout?: number }
  ): Promise<boolean> {
    try {
      const result = await this.withContextProtection(
        page,
        async () => {
          await page.click(selector, options);
          return true;
        },
        false
      );
      return result || false;
    } catch (error) {
      console.warn(`[E2EErrorHandler] Failed to click ${selector}:`, error);
      return false;
    }
  }

  /**
   * Wait for condition with context protection
   */
  static async waitForCondition(
    page: Page,
    condition: () => Promise<boolean>,
    timeoutMs: number = 5000,
    intervalMs: number = 100,
    _throwOnTimeout: boolean = true
  ): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      if (page.isClosed()) {
        return false;
      }

      try {
        const result = await condition();
        if (result) {
          return true;
        }
      } catch (error) {
        if (this.isContextClosureError(error)) {
          return false;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    return false;
  }
}
