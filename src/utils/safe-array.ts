/**
 * @fileoverview Safe Array Operations Utility
 *
 * Provides type-safe array operations that prevent object injection vulnerabilities
 * while maintaining type safety and performance.
 *
 * @version 1.0.0
 */

/**
 * Safe array access with bounds checking
 * @param array - The array to access
 * @param index - The index to access
 * @returns The element at the index or undefined if out of bounds
 */
export function safeArrayAccess<T>(array: T[], index: number): T | undefined {
  if (!Array.isArray(array) || typeof index !== 'number') {
    return undefined;
  }

  if (index < 0 || index >= array.length) {
    return undefined;
  }

  return array.at(index);
}

/**
 * Safe array assignment with bounds checking
 * @param array - The array to modify
 * @param index - The index to assign to
 * @param value - The value to assign
 * @returns True if assignment was successful, false otherwise
 */
export function safeArrayAssign<T>(
  array: T[],
  index: number,
  value: T
): boolean {
  if (!Array.isArray(array) || typeof index !== 'number') {
    return false;
  }

  if (index < 0) {
    return false;
  }

  // Ensure array is large enough
  if (index >= array.length) {
    array.length = index + 1;
  }

  // Use safe assignment through array methods
  array.splice(index, 1, value);
  return true;
}

/**
 * Safe array iteration with type safety
 * @param array - The array to iterate over
 * @param callback - The callback function to call for each element
 */
export function safeArrayIterate<T>(
  array: T[],
  callback: (element: T, index: number) => void
): void {
  if (!Array.isArray(array)) {
    return;
  }

  for (const [index, element] of array.entries()) {
    callback(element, index);
  }
}

/**
 * Safe array find with predicate
 * @param array - The array to search
 * @param predicate - The predicate function
 * @returns The found element or undefined
 */
export function safeArrayFind<T>(
  array: T[],
  predicate: (element: T, index: number) => boolean
): T | undefined {
  if (!Array.isArray(array)) {
    return undefined;
  }

  for (const [index, element] of array.entries()) {
    if (predicate(element, index)) {
      return element;
    }
  }

  return undefined;
}

/**
 * Safe array insertion with priority ordering
 * @param array - The array to insert into
 * @param item - The item to insert
 * @param compareFn - Function to compare items for ordering
 * @returns The insertion index
 */
export function safeArrayInsertSorted<T>(
  array: T[],
  item: T,
  compareFn: (a: T, b: T) => number
): number {
  if (!Array.isArray(array)) {
    return -1;
  }

  let insertIndex = 0;

  for (const [index, element] of array.entries()) {
    if (compareFn(item, element) < 0) {
      insertIndex = index;
      break;
    }
    insertIndex = index + 1;
  }

  array.splice(insertIndex, 0, item);
  return insertIndex;
}

/**
 * Safe array removal by index
 * @param array - The array to remove from
 * @param index - The index to remove
 * @returns The removed element or undefined
 */
export function safeArrayRemove<T>(array: T[], index: number): T | undefined {
  if (!Array.isArray(array) || typeof index !== 'number') {
    return undefined;
  }

  if (index < 0 || index >= array.length) {
    return undefined;
  }

  const removed = array.splice(index, 1);
  return removed[0];
}

/**
 * Type guard for checking if a value is a valid array index
 * @param value - The value to check
 * @param arrayLength - The length of the array
 * @returns True if value is a valid index
 */
export function isValidArrayIndex(
  value: unknown,
  arrayLength: number
): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 0 &&
    value < arrayLength
  );
}

/**
 * Safe array slice with bounds checking
 * @param array - The array to slice
 * @param start - The start index
 * @param end - The end index (optional)
 * @returns A new array with the sliced elements
 */
export function safeArraySlice<T>(
  array: T[],
  start: number,
  end?: number
): T[] {
  if (!Array.isArray(array)) {
    return [];
  }

  const safeStart = Math.max(0, Math.min(start, array.length));
  const safeEnd =
    end !== undefined ? Math.max(0, Math.min(end, array.length)) : array.length;

  return array.slice(safeStart, safeEnd);
}
