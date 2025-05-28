/**
 * React ref utility helper functions
 *
 * Functions for working with React refs safely
 */

import type { RefObject } from "react";

/**
 * Checks if a ref is not null and has a current value
 *
 * @param ref - The ref to check
 *
 * @returns Type guard indicating if ref has a current value
 *
 */
export function isRefNotNull<T>(
  ref: RefObject<T>,
): ref is RefObject<T> & { current: T } {
  return ref.current !== null;
}

/**
 * Safely access a ref's current value
 *
 * @param ref - The ref to access
 *
 * @param fallback - Fallback value if ref is null
 *
 * @returns The ref's current value or fallback
 *
 */
export function safeRefAccess<T>(
  ref: RefObject<T>,
  fallback: T,
): T {
  return ref.current ?? fallback;
}

/**
 * Execute a function on a ref's current value if it exists
 *
 * @param ref - The ref to check
 *
 * @param callback - Function to execute with the ref's current value
 *
 * @returns The result of the callback or undefined
 *
 */
export function withRef<T, R>(
  ref: RefObject<T>,
  callback: (current: T) => R,
): R | undefined {
  if (ref.current) {
    return callback(ref.current);
  }
  return undefined;
} 