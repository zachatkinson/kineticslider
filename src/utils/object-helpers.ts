/**
 * Object utility helper functions
 *
 * Centralized utilities for working with objects, properties, and values safely
 *
 * @module ObjectHelpers
 * @version 1.0.0
 */

/**
 * Helper function to check if a value is empty
 *
 * @param value - The value to check
 *
 * @returns True if the value is empty, false otherwise
 *
 * @example
 * ```ts
 * isEmpty(null) // true
 * isEmpty("") // true
 * isEmpty([]) // true
 * isEmpty({}) // true
 * isEmpty("hello") // false
 * ```
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
}

/**
 * Helper function to safely get a value from an object by key
 *
 * @param obj - The object to get the value from
 *
 * @param key - The key to get the value for
 *
 * @param defaultValue - The default value to return if the key doesn't exist
 *
 * @returns The value from the object or the default value
 *
 * @example
 * ```ts
 * const obj = { a: 1, b: { c: 2 } };
 * safeGet(obj, "a", 0) // 1
 * safeGet(obj, "nonexistent", "default") // "default"
 * safeGet(null, "key", "default") // "default"
 * ```
 */
export function safeGet<T>(
  obj: Record<string, unknown> | null | undefined,
  key: string,
  defaultValue: T,
): T {
  if (!obj) return defaultValue;
  return (obj[key] as T) ?? defaultValue;
}

/**
 * Helper function to safely get a nested property from an object using dot notation
 *
 * @param obj - The object to get the value from
 *
 * @param path - The dot-notation path to the value (e.g., "a.b.c")
 *
 * @param defaultValue - The default value to return if the path doesn't exist
 *
 * @returns The value from the object or the default value
 *
 * @example
 * ```ts
 * const obj = { a: { b: { c: 42 } } };
 * safeGetNested(obj, "a.b.c", 0) // 42
 * safeGetNested(obj, "a.b.d", "default") // "default"
 * safeGetNested(null, "a.b.c", 0) // 0
 * ```
 */
export function safeGetNested<T>(obj: unknown, path: string, defaultValue: T): T {
  if (obj === null || obj === undefined) return defaultValue;
  if (typeof obj !== "object") return defaultValue;

  const keys = path.split(".");
  let result: unknown = obj;

  for (const key of keys) {
    if (result === null || result === undefined || typeof result !== "object") {
      return defaultValue;
    }
    if (Object.prototype.hasOwnProperty.call(result, key)) {
      result = (result as Record<string, unknown>)[key];
    } else {
      return defaultValue;
    }
    if (result === undefined) {
      return defaultValue;
    }
  }

  return result as T;
}

/**
 * Helper function to safely get a nested property with array notation support
 *
 * @param obj - Object to get value from
 *
 * @param path - Path to property, using dot notation, can include array indices as [0]
 *
 * @param defaultValue - Default value to return if the property does not exist
 *
 * @returns The property value or the default value if the property does not exist
 *
 * @example
 * ```ts
 * const obj = { users: [{ name: "John" }, { name: "Jane" }] };
 * safeGetPath(obj, "users[0].name", "Unknown") // "John"
 * safeGetPath(obj, "users[2].name", "Unknown") // "Unknown"
 * ```
 */
export function safeGetPath<T>(
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

/**
 * Checks if an object has a specific property
 *
 * @param obj - The object to check
 *
 * @param key - The property key to check for
 *
 * @returns True if the object has the property
 *
 * @example
 * ```ts
 * const obj = { a: 1, b: null };
 * hasProperty(obj, "a") // true
 * hasProperty(obj, "b") // true
 * hasProperty(obj, "c") // false
 * ```
 */
export function hasProperty(obj: unknown, key: string): boolean {
  return obj !== null && obj !== undefined && typeof obj === "object" && key in obj;
}

/**
 * Safely sets a value on an object if the object exists
 *
 * @param obj - The object to set the value on
 *
 * @param key - The property key to set
 *
 * @param value - The value to set
 *
 * @returns True if the value was set, false otherwise
 *
 * @example
 * ```ts
 * const obj = { a: 1 };
 * safeSet(obj, "b", 2) // true, obj is now { a: 1, b: 2 }
 * safeSet(null, "b", 2) // false
 * ```
 */
export function safeSet(obj: unknown, key: string, value: unknown): boolean {
  if (obj !== null && obj !== undefined && typeof obj === "object") {
    (obj as Record<string, unknown>)[key] = value;
    return true;
  }
  return false;
} 