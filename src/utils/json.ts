/**
 * JSON utility functions
 */

/**
 * Safely parses JSON without throwing exceptions
 * @param value - The string to parse
 * @param fallback - Optional fallback value if parsing fails
 * @returns The parsed object or fallback value
 */
export function safeJsonParse<T>(value: string, fallback: T): T;
export function safeJsonParse<T>(value: string): T | null;
export function safeJsonParse<T>(value: string, fallback?: T): T | null {
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    return fallback !== undefined ? fallback : null;
  }
}

/**
 * Safely stringifies a value to JSON
 * @param value - The value to stringify
 * @param fallback - Optional fallback string if stringification fails
 * @returns The stringified value or fallback
 */
export function safeJsonStringify(value: unknown, fallback: string = ''): string {
  try {
    return JSON.stringify(value);
  } catch (error) {
    return fallback;
  }
}

/**
 * Safely gets a nested property from an object using a path string
 * @param obj - The object to get the property from
 * @param path - The path to the property (e.g. 'user.address.city')
 * @param defaultValue - Optional default value if property doesn't exist
 * @returns The property value or default value
 */
export function safeGet<T>(
  obj: Record<string, unknown>,
  path: string,
  defaultValue: T
): T {
  try {
    return path.split('.').reduce((acc: any, key: string) => {
      return acc?.[key];
    }, obj) ?? defaultValue;
  } catch {
    return defaultValue;
  }
} 