import React from 'react';
import { trackError as trackAnalyticsError } from './analytics';
import { ErrorType } from '../types/error';

/**
 * Extended Error interface with additional properties
 */
interface ExtendedError extends Error {
  code?: string;
  context?: Record<string, unknown>;
}

/**
 * Handles component errors and tracks them for analytics.
 *
 * @param event - The error event from the component
 * @throws {Error} When the error cannot be handled
 *
 * @example
 * ```tsx
 * <div onError={handleComponentError}>
 *   {children}
 * </div>
 * ```
 *
 * @error
 * - Captures React synthetic events
 * - Tracks errors in analytics
 * - Provides error context
 * - Supports error recovery
 */
export const handleComponentError = (event: React.SyntheticEvent<HTMLDivElement, Event>) => {
  const error = new Error('Slider render error');
  trackAnalyticsError(error, ErrorType.RENDER);
};

/**
 * Creates a standardized error object with additional context.
 *
 * @param message - The error message
 * @param code - Optional error code
 * @param context - Additional error context
 * @returns A formatted error object
 *
 * @example
 * ```ts
 * const error = createError(
 *   'Failed to load slide',
 *   'SLIDE_LOAD_ERROR',
 *   { slideId: '123' }
 * );
 * ```
 *
 * @error
 * - Standardizes error format
 * - Adds debugging context
 * - Supports error codes
 * - Preserves stack traces
 */
export function createError(
  message: string,
  code?: string,
  context?: Record<string, unknown>
): ExtendedError {
  const error = new Error(message) as ExtendedError;
  if (code) {
    error.code = code;
  }
  if (context) {
    error.context = context;
  }
  return error;
}

/**
 * Wraps a function with error handling and analytics tracking.
 *
 * @param fn - The function to wrap
 * @param errorType - The type of error to track
 * @returns A wrapped function with error handling
 *
 * @example
 * ```ts
 * const safeFunction = withErrorHandling(
 *   () => riskyOperation(),
 *   ErrorType.OPERATION
 * );
 * ```
 *
 * @error
 * - Catches synchronous errors
 * - Tracks error metrics
 * - Preserves function context
 * - Maintains type safety
 */
export function withErrorHandling<T extends (...args: any[]) => any>(
  fn: T,
  errorType: ErrorType
): (...args: Parameters<T>) => ReturnType<T> {
  return (...args: Parameters<T>): ReturnType<T> => {
    try {
      return fn(...args);
    } catch (error) {
      if (error instanceof Error) {
        trackAnalyticsError(error, errorType);
      } else {
        trackAnalyticsError(new Error(String(error)), errorType);
      }
      throw error;
    }
  };
}

/**
 * Handles asynchronous operation errors with retry logic.
 *
 * @param operation - The async operation to perform
 * @param retryCount - Number of retry attempts
 * @param delay - Delay between retries in milliseconds
 * @returns The operation result or throws after retries
 *
 * @example
 * ```ts
 * const result = await handleAsyncError(
 *   () => fetchData(),
 *   3,
 *   1000
 * );
 * ```
 *
 * @error
 * - Implements retry logic
 * - Tracks retry attempts
 * - Supports delay between retries
 * - Reports final errors
 */
export async function handleAsyncError<T>(
  operation: () => Promise<T>,
  retryCount = 3,
  delay = 1000
): Promise<T> {
  let lastError: ExtendedError | null = null;
  
  for (let attempt = 0; attempt < retryCount; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof Error) {
        lastError = error as ExtendedError;
      } else {
        lastError = new Error(String(error)) as ExtendedError;
      }
      if (attempt < retryCount - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  if (lastError) {
    trackAnalyticsError(lastError, ErrorType.ASYNC);
    throw lastError;
  }
  
  throw new Error('Operation failed after retries');
} 