/**
 * JSON utility functions
 */

/**
 * Safely parses a JSON string.
 * Returns the fallback value if parsing fails or if the input is not a string.
 *
 * @param value - The JSON string to parse
 *
 * @param fallback - A fallback value to return if parsing fails
 *
 * @returns The parsed object or the provided fallback value
 *
 */
export function safeJsonParse<T>(value: string, fallback: T): T;

/**
 * Safely parses a JSON string.
 * Returns null if parsing fails or if the input is not a string.
 *
 * @param value - The JSON string to parse
 *
 * @returns The parsed object or null if parsing fails
 *
 */
export function safeJsonParse<T>(value: string): T | null;

/**
 * Safely parses a JSON string.
 *
 * @param value - The JSON string to parse
 *
 * @param fallback - A fallback value to return if parsing fails
 *
 * @returns The parsed object, the fallback value, or null
 *
 */
export function safeJsonParse<T>(value: string, fallback?: T): T | null {
  if (typeof value !== "string") {
    return fallback ?? null;
  }

  try {
    return JSON.parse(value);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {
    return fallback ?? null;
  }
}

/**
 * Safely stringifies a value to JSON.
 *
 * @param value - The value to stringify
 *
 * @param fallback - A fallback string to return if stringification fails
 *
 * @returns The stringified value or the fallback string if stringification fails
 *
 */
export function safeJsonStringify(
  value: unknown,
  fallback: string = "",
): string {
  try {
    return JSON.stringify(value);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {
    return fallback;
  }
}

// Re-export the centralized safeGet function with path support for backward compatibility
export { safeGetNested as safeGet } from "./object-helpers";
