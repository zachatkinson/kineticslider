/**
 * String utility functions
 */

/**
 * Capitalizes the first letter of a string
 *
 * @param str - The string to capitalize
 *
 * @returns The capitalized string
 *
 */
export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Converts a camelCase string to kebab-case
 *
 * @param str - The camelCase string
 *
 * @returns The kebab-case string
 *
 */
export function _camelToKebab(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

/**
 * Converts a kebab-case string to camelCase
 *
 * @param str - The kebab-case string
 *
 * @returns The camelCase string
 *
 */
export function _kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Truncates a string to a maximum length with ellipsis
 *
 * @param str - The string to truncate
 *
 * @param maxLength - Maximum length before truncation
 *
 * @returns The truncated string
 *
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}

/**
 * Checks if a string is empty or only whitespace
 *
 * @param str - The string to check
 *
 * @returns True if the string is empty or only whitespace
 *
 */
export function _isEmptyString(str: string | null | undefined): boolean {
  return !str || str.trim() === "";
}
