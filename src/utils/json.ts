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

/**
 * Helper function to safely get a nested property from an object using a path string.
 * Path can be dot notation like 'a.b.c' or array notation like 'a[0].b.c[1]'.
 *
 * @param obj - Object to get value from
 *
 * @param path - Path to property, using dot notation, can include array indices as [0]
 *
 * @param defaultValue - Default value to return if the property does not exist
 *
 * @returns The property value or the default value if the property does not exist
 *
 */
export function safeGet<T>(
  obj: Record<string, unknown>,
  path: string,
  defaultValue: T,
): T {
  if (!obj || !path) {
    return defaultValue;
  }

  // Match any property name or array index inside brackets
  const parts = path
    .replace(/\[(\w+)\]/g, ".$1") // convert [0] to .0
    .replace(/^\./, "") // strip leading dot
    .split(".");

  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return defaultValue;
    }

    if (typeof current !== "object") {
      return defaultValue;
    }

    current = (current as Record<string, unknown>)[part];
  }

  return current !== undefined && current !== null
    ? (current as T)
    : defaultValue;
}
