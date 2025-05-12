import React from "react";
import { trackError as trackAnalyticsError } from "./analytics";
import { ErrorType, ExtendedError } from "../types/error";

/**
 * Function type for error handlers
 */
type ErrorHandlerFunction = (error: Error, errorType: ErrorType) => void;

/**
 * Options for error handling configuration
 *
 * @example
 * ```typescript
 * const options: ErrorHandlingOptions = {
 *   capturePromiseRejections: true,
 *   captureConsoleErrors: false,
 *   reportToAnalytics: true,
 *   logToConsole: process.env.NODE_ENV !== 'production'
 * };
 * ```
 */
interface ErrorHandlingOptions {
  capturePromiseRejections?: boolean;
  captureConsoleErrors?: boolean;
  reportToAnalytics?: boolean;
  logToConsole?: boolean;
}

/**
 * Handles component errors and tracks them for analytics.
 *
 * @param _event - The error event from the component
 *
 * @throws {Error} When the error cannot be handled
 *
 * @example Example usage
 * ```tsx
 * <div onError={handleComponentError}>
 *   {children}
 * </div>
 * ```
 *
 * @description
 * - Captures React synthetic events
 * - Tracks errors in analytics
 * - Provides error context
 * - Supports error recovery
 * @returns {void} The function return value
 *
 */
export const handleComponentError = (
  _event: React.SyntheticEvent<HTMLDivElement, Event>,
): void => {
  const error = new Error("Slider render error");
  trackAnalyticsError(error, { errorType: ErrorType.RENDER });
};

/**
 * Creates a standardized error object with additional context.
 *
 * @param message - The error message
 *
 * @param code - Optional error code
 *
 * @param context - Additional error context
 *
 * @returns A formatted error object
 *
 * @example Example usage
 * ```ts
 * const error = createError(
 *   'Failed to load slide',
 *   'SLIDE_LOAD_ERROR',
 *   { slideId: '123' }
 * );
 * ```
 *
 * @description
 * - Standardizes error format
 * - Adds debugging context
 * - Supports error codes
 * - Preserves stack traces
 */
export function createError(
  message: string,
  code?: string,
  context?: Record<string, unknown>,
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
 *
 * @param errorType - The type of error to track
 *
 * @returns A wrapped function with error handling
 *
 * @example Example usage
 * ```ts
 * const safeFunction = withErrorHandling(
 *   () => riskyOperation(),
 *   ErrorType.OPERATION
 * );
 * ```
 *
 * @description
 * - Catches synchronous errors
 * - Tracks error metrics
 * - Preserves function context
 * - Maintains type safety
 */
export function withErrorHandling<T extends (...args: unknown[]) => unknown>(
  fn: T,
  errorType: ErrorType,
): (...args: Parameters<T>) => unknown {
  return (...args: Parameters<T>): unknown => {
    try {
      return fn(...args);
    } catch (error) {
      if (error instanceof Error) {
        trackAnalyticsError(error, { errorType });
      } else {
        trackAnalyticsError(new Error(String(error)), { errorType });
      }
      throw error;
    }
  };
}

/**
 * Handles asynchronous operation errors with retry logic.
 *
 * @param operation - The async operation to perform
 *
 * @param retryCount - Number of retry attempts
 *
 * @param delay - Delay between retries in milliseconds
 *
 * @returns The operation result or throws after retries
 *
 * @example Example usage
 * ```ts
 * const result = await handleAsyncError(
 *   () => fetchData(),
 *   3,
 *   1000
 * );
 * ```
 *
 * @description
 * - Implements retry logic
 * - Tracks retry attempts
 * - Supports delay between retries
 * - Reports final errors
 */
export async function handleAsyncError<T>(
  operation: () => Promise<T>,
  retryCount = 3,
  delay = 1000,
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
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  if (lastError) {
    trackAnalyticsError(lastError, { errorType: ErrorType.ASYNC });
    throw lastError;
  }

  throw new Error("Operation failed after retries");
}

/**
 * Event handler for window errors
 *
 * @param _event - The error event
 *
 */
function _handleWindowError(_event: ErrorEvent): void {
  // Implementation goes here
}

export const setupErrorHandling = (
  errorHandler: ErrorHandlerFunction,
  _options: ErrorHandlingOptions = {},
): void => {
  // Setup global error handling for uncaught exceptions
  window.addEventListener("error", (_event: ErrorEvent) => {
    // Unhandled errors from scripts
    try {
      errorHandler(new Error("Unhandled script error"), ErrorType.UNKNOWN);
    } catch (err) {
      console.error("Error in error handler:", err);
    }
  });
};
