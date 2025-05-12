/**
 * Error tracking utility functions
 *
 * @returns {ReturnType} The return value
 *
 */

import type { ErrorEvent, ErrorType } from "../types/error";

/**
 * Track an error with component context
 *
 * @param error
 *
 * @param type
 *
 * @param componentInfo
 *
 * @returns {unknown} - The return value
 *
 */
export function trackError(
  error: Error,
  type: ErrorType,
  componentInfo: Record<string, unknown>,
): void {
  const errorEvent: ErrorEvent = {
    type,
    message: error.message,
    stack: error.stack,
    timestamp: Date.now(),
    componentInfo,
  };

  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.error("Error:", errorEvent);
  }

  // Store in localStorage for debugging
  try {
    const errors = JSON.parse(localStorage.getItem("errors") || "[]");
    errors.push(errorEvent);
    localStorage.setItem("errors", JSON.stringify(errors));
  } catch (e) {
    console.error("Failed to track error:", e);
  }
}

/**
 * Creates an error tracker that wraps console.error
 *
 * @param componentInfo - Context information about the component
 *
 * @param type - Type of errors to track
 *
 * @returns Cleanup function to restore original console.error
 *
 */
export function createErrorTracker(
  componentInfo: Record<string, unknown>,
  type: ErrorType,
): () => void {
  const originalError = console.error;

  console.error = (...args: unknown[]) => {
    const error = args[0];
    if (error instanceof Error) {
      trackError(error, type, componentInfo);
    }
    originalError.apply(console, args);
  };

  return (): void => {
    console.error = originalError;
  };
}
