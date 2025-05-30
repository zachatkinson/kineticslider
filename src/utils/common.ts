/**
 * Common utility functions that can be used across the application
 */

import type { Result } from "../types/common";
import { safeJsonParse as _safeJsonParse } from "./json";
import { safeGetNested as _safeGetNested } from "./object-helpers";

/**
 * Creates a debounced function that delays invoking the provided function
 * until after the specified wait time has elapsed since the last invocation
 *
 * @param func - The function to debounce
 *
 * @param wait - The number of milliseconds to delay
 *
 * @returns A debounced version of the function
 *
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function (...args: Parameters<T>): void {
    const later = (): void => {
      timeout = null;
      func(...args);
    };

    if (timeout !== null) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(later, wait);
  };
}

/**
 * Creates a throttled function that only invokes the provided function
 * at most once per every wait milliseconds
 *
 * @param func - The function to throttle
 *
 * @param wait - The number of milliseconds to wait between invocations
 *
 * @returns A throttled version of the function
 *
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return function (...args: Parameters<T>): void {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, wait);
    }
  };
}

/**
 * Creates a function that memoizes the result of func
 *
 * @param func - The function to memoize
 *
 * @returns A memoized function that caches results
 *
 */
export function memoize<
  T extends (...args: unknown[]) => unknown,
  R = ReturnType<T>,
>(func: T): (...args: Parameters<T>) => R {
  const cache = new Map<string, R>();

  return function (...args: Parameters<T>): R {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      const cachedResult = cache.get(key);
      if (cachedResult !== undefined) {
        return cachedResult;
      }
    }

    const result = func(...args) as R;
    cache.set(key, result);
    return result;
  };
}

/**
 * Sleeps for the specified number of milliseconds
 *
 * @param ms - The number of milliseconds to sleep
 *
 * @returns A promise that resolves after the specified time
 *
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Creates a random ID with an optional prefix
 *
 * @param prefix - Optional prefix for the ID
 *
 * @returns A random ID string
 *
 */
export function _createRandomId(prefix: string = ""): string {
  return `${prefix}${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Performs a deep clone of the provided object
 *
 * @param obj - The object to clone
 *
 * @returns A deep clone of the object
 *
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

/**
 * Performs a shallow merge of objects
 *
 * @param target - The target object
 *
 * @param sources - The source objects
 *
 * @returns The merged object
 *
 */
export function shallowMerge<T>(target: T, ...sources: Partial<T>[]): T {
  return Object.assign({}, target, ...sources);
}

/**
 * Creates a success result object
 *
 * @param data - The data to include in the result
 *
 * @returns {Result<T>} A success result object
 *
 */
export function createSuccessResult<T>(data: T): Result<T> {
  return {
    success: true,
    data,
  };
}

/**
 * Creates an error result object
 *
 * @param error - The error to include in the result
 *
 * @returns {Result<T, E>} An error result object
 *
 */
export function createErrorResult<T, E = Error>(error: E): Result<T, E> {
  return {
    success: false,
    error,
  };
}

/**
 * Safely attempt an operation, returning a Result type
 *
 * @param operation - The operation to attempt
 *
 * @returns {Result<T>} A Result containing either the success value or error
 *
 */
export function tryOperation<T>(operation: () => T): Result<T> {
  try {
    const data = operation();
    return createSuccessResult(data);
  } catch (error) {
    return createErrorResult<T>(
      error instanceof Error ? error : new Error(String(error)),
    );
  }
}

/**
 * Safely attempt an async operation, returning a Result type
 *
 * @param operation - The async operation to attempt
 *
 * @returns {Promise<Result<T>>} A Promise resolving to a Result containing either the success value or error
 *
 */
export async function tryAsync<T>(
  operation: () => Promise<T>,
): Promise<Result<T>> {
  try {
    const data = await operation();
    return createSuccessResult(data);
  } catch (error) {
    return createErrorResult<T>(
      error instanceof Error ? error : new Error(String(error)),
    );
  }
}

// Re-export safeJsonParse from centralized location
export { safeJsonParse } from "./json";

// Re-export getNestedValue as alias for safeGetNested from centralized location
export { safeGetNested as getNestedValue } from "./object-helpers";
