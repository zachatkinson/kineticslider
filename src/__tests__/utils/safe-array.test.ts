/**
 * @fileoverview Tests for Safe Array Operations Utility
 *
 * Comprehensive tests for type-safe array operations including:
 * - Bounds checking and safety validation
 * - Array manipulation operations
 * - Type guards and validation
 * - Edge cases and error handling
 */

import { describe, it, expect } from 'vitest';
import {
  safeArrayAccess,
  safeArrayAssign,
  safeArrayIterate,
  safeArrayFind,
  safeArrayInsertSorted,
  safeArrayRemove,
  isValidArrayIndex,
  safeArraySlice,
} from '../../utils/safe-array';

describe('Safe Array Operations', () => {
  describe('safeArrayAccess', () => {
    it('should return element at valid index', () => {
      const array = [1, 2, 3, 4, 5];

      expect(safeArrayAccess(array, 0)).toBe(1);
      expect(safeArrayAccess(array, 2)).toBe(3);
      expect(safeArrayAccess(array, 4)).toBe(5);
    });

    it('should return undefined for out of bounds indices', () => {
      const array = [1, 2, 3];

      expect(safeArrayAccess(array, -1)).toBeUndefined();
      expect(safeArrayAccess(array, 3)).toBeUndefined();
      expect(safeArrayAccess(array, 10)).toBeUndefined();
    });

    it('should return undefined for invalid inputs', () => {
      const array = [1, 2, 3];

      // Invalid array
      expect(safeArrayAccess(null as unknown as number[], 0)).toBeUndefined();
      expect(
        safeArrayAccess(undefined as unknown as number[], 0)
      ).toBeUndefined();
      expect(
        safeArrayAccess('not-array' as unknown as number[], 0)
      ).toBeUndefined();
      expect(safeArrayAccess({} as unknown as number[], 0)).toBeUndefined();

      // Invalid index
      expect(
        safeArrayAccess(array, 'string' as unknown as number)
      ).toBeUndefined();
      expect(safeArrayAccess(array, null as unknown as number)).toBeUndefined();
      expect(
        safeArrayAccess(array, undefined as unknown as number)
      ).toBeUndefined();
      expect(safeArrayAccess(array, NaN)).toBeUndefined();
    });

    it('should handle empty arrays', () => {
      const array: number[] = [];

      expect(safeArrayAccess(array, 0)).toBeUndefined();
      expect(safeArrayAccess(array, -1)).toBeUndefined();
    });

    it('should work with different data types', () => {
      const stringArray = ['a', 'b', 'c'];
      const objectArray = [{ id: 1 }, { id: 2 }];
      const booleanArray = [true, false, true];

      expect(safeArrayAccess(stringArray, 1)).toBe('b');
      expect(safeArrayAccess(objectArray, 0)).toEqual({ id: 1 });
      expect(safeArrayAccess(booleanArray, 2)).toBe(true);
    });
  });

  describe('safeArrayAssign', () => {
    it('should assign value at valid index', () => {
      const array = [1, 2, 3];

      const result = safeArrayAssign(array, 1, 99);

      expect(result).toBe(true);
      expect(array[1]).toBe(99);
      expect(array).toEqual([1, 99, 3]);
    });

    it('should extend array when index is beyond current length', () => {
      const array = [1, 2];

      const result = safeArrayAssign(array, 4, 5);

      expect(result).toBe(true);
      expect(array.length).toBe(5);
      expect(array[4]).toBe(5);
      expect(array[2]).toBeUndefined();
      expect(array[3]).toBeUndefined();
    });

    it('should reject negative indices', () => {
      const array = [1, 2, 3];
      const originalArray = [...array];

      const result = safeArrayAssign(array, -1, 99);

      expect(result).toBe(false);
      expect(array).toEqual(originalArray);
    });

    it('should reject invalid inputs', () => {
      const array = [1, 2, 3];

      // Invalid array
      expect(safeArrayAssign(null as unknown as number[], 0, 1)).toBe(false);
      expect(safeArrayAssign(undefined as unknown as number[], 0, 1)).toBe(
        false
      );
      expect(safeArrayAssign('not-array' as unknown as number[], 0, 1)).toBe(
        false
      );

      // Invalid index
      expect(safeArrayAssign(array, 'string' as unknown as number, 1)).toBe(
        false
      );
      expect(safeArrayAssign(array, null as unknown as number, 1)).toBe(false);
      expect(safeArrayAssign(array, NaN, 1)).toBe(false);
    });

    it('should work with different data types', () => {
      const stringArray = ['a', 'b'];
      const objectArray = [{ id: 1 }];

      expect(safeArrayAssign(stringArray, 0, 'z')).toBe(true);
      expect(stringArray[0]).toBe('z');

      expect(safeArrayAssign(objectArray, 1, { id: 2 })).toBe(true);
      expect(objectArray[1]).toEqual({ id: 2 });
    });

    it('should handle empty arrays', () => {
      const array: number[] = [];

      const result = safeArrayAssign(array, 0, 42);

      expect(result).toBe(true);
      expect(array).toEqual([42]);
    });
  });

  describe('safeArrayIterate', () => {
    it('should iterate over all elements with correct parameters', () => {
      const array = ['a', 'b', 'c'];
      const results: Array<{ element: string; index: number }> = [];

      safeArrayIterate(array, (element, index) => {
        results.push({ element, index });
      });

      expect(results).toEqual([
        { element: 'a', index: 0 },
        { element: 'b', index: 1 },
        { element: 'c', index: 2 },
      ]);
    });

    it('should handle empty arrays gracefully', () => {
      const array: string[] = [];
      let callCount = 0;

      safeArrayIterate(array, () => {
        callCount++;
      });

      expect(callCount).toBe(0);
    });

    it('should ignore invalid arrays', () => {
      let callCount = 0;
      const callback = () => {
        callCount++;
      };

      safeArrayIterate(null as unknown as string[], callback);
      safeArrayIterate(undefined as unknown as string[], callback);
      safeArrayIterate('not-array' as unknown as string[], callback);
      safeArrayIterate({} as unknown as string[], callback);

      expect(callCount).toBe(0);
    });

    it('should work with different data types', () => {
      const mixedArray = [1, 'string', { key: 'value' }, true, null];
      const results: unknown[] = [];

      safeArrayIterate(mixedArray, (element) => {
        results.push(element);
      });

      expect(results).toEqual([1, 'string', { key: 'value' }, true, null]);
    });

    it('should handle callback errors gracefully', () => {
      const array = [1, 2, 3];

      expect(() => {
        safeArrayIterate(array, () => {
          throw new Error('Callback error');
        });
      }).toThrow('Callback error');
    });
  });

  describe('safeArrayFind', () => {
    it('should find element that matches predicate', () => {
      const array = [1, 2, 3, 4, 5];

      const result = safeArrayFind(array, (element) => element > 3);

      expect(result).toBe(4);
    });

    it('should return undefined when no element matches', () => {
      const array = [1, 2, 3];

      const result = safeArrayFind(array, (element) => element > 10);

      expect(result).toBeUndefined();
    });

    it('should return first matching element', () => {
      const array = [1, 3, 5, 7, 9];

      const result = safeArrayFind(array, (element) => element > 4);

      expect(result).toBe(5);
    });

    it('should provide correct parameters to predicate', () => {
      const array = ['a', 'b', 'c'];
      const calls: Array<{ element: string; index: number }> = [];

      safeArrayFind(array, (element, index) => {
        calls.push({ element, index });
        return element === 'b';
      });

      expect(calls).toEqual([
        { element: 'a', index: 0 },
        { element: 'b', index: 1 },
      ]);
    });

    it('should handle invalid arrays', () => {
      const predicate = (element: unknown) => element === 'test';

      expect(
        safeArrayFind(null as unknown as number[], predicate)
      ).toBeUndefined();
      expect(
        safeArrayFind(undefined as unknown as number[], predicate)
      ).toBeUndefined();
      expect(
        safeArrayFind('not-array' as unknown as number[], predicate)
      ).toBeUndefined();
    });

    it('should handle empty arrays', () => {
      const array: number[] = [];

      const result = safeArrayFind(array, () => true);

      expect(result).toBeUndefined();
    });

    it('should work with complex objects', () => {
      const array = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' },
      ];

      const result = safeArrayFind(array, (item) => item.name === 'Bob');

      expect(result).toEqual({ id: 2, name: 'Bob' });
    });
  });

  describe('safeArrayInsertSorted', () => {
    it('should insert in correct sorted position', () => {
      const array = [1, 3, 5, 7];
      const compareFn = (a: number, b: number) => a - b;

      const index = safeArrayInsertSorted(array, 4, compareFn);

      expect(index).toBe(2);
      expect(array).toEqual([1, 3, 4, 5, 7]);
    });

    it('should insert at beginning when item is smallest', () => {
      const array = [2, 4, 6];
      const compareFn = (a: number, b: number) => a - b;

      const index = safeArrayInsertSorted(array, 1, compareFn);

      expect(index).toBe(0);
      expect(array).toEqual([1, 2, 4, 6]);
    });

    it('should insert at end when item is largest', () => {
      const array = [1, 3, 5];
      const compareFn = (a: number, b: number) => a - b;

      const index = safeArrayInsertSorted(array, 7, compareFn);

      expect(index).toBe(3);
      expect(array).toEqual([1, 3, 5, 7]);
    });

    it('should handle empty arrays', () => {
      const array: number[] = [];
      const compareFn = (a: number, b: number) => a - b;

      const index = safeArrayInsertSorted(array, 5, compareFn);

      expect(index).toBe(0);
      expect(array).toEqual([5]);
    });

    it('should work with string sorting', () => {
      const array = ['apple', 'cherry', 'orange'];
      const compareFn = (a: string, b: string) => a.localeCompare(b);

      const index = safeArrayInsertSorted(array, 'banana', compareFn);

      expect(index).toBe(1);
      expect(array).toEqual(['apple', 'banana', 'cherry', 'orange']);
    });

    it('should work with reverse sorting', () => {
      const array = [9, 7, 5, 3];
      const compareFn = (a: number, b: number) => b - a; // Reverse order

      const index = safeArrayInsertSorted(array, 6, compareFn);

      expect(index).toBe(2);
      expect(array).toEqual([9, 7, 6, 5, 3]);
    });

    it('should handle duplicate values', () => {
      const array = [1, 3, 3, 5];
      const compareFn = (a: number, b: number) => a - b;

      const index = safeArrayInsertSorted(array, 3, compareFn);

      expect(index).toBe(1);
      expect(array).toEqual([1, 3, 3, 3, 5]);
    });

    it('should return -1 for invalid arrays', () => {
      const compareFn = (a: number, b: number) => a - b;

      expect(
        safeArrayInsertSorted(null as unknown as number[], 1, compareFn)
      ).toBe(-1);
      expect(
        safeArrayInsertSorted(undefined as unknown as number[], 1, compareFn)
      ).toBe(-1);
      expect(
        safeArrayInsertSorted('not-array' as unknown as number[], 1, compareFn)
      ).toBe(-1);
    });

    it('should work with complex objects', () => {
      const array = [
        { priority: 1, name: 'low' },
        { priority: 5, name: 'high' },
      ];
      const compareFn = (a: { priority: number }, b: { priority: number }) =>
        a.priority - b.priority;

      const index = safeArrayInsertSorted(
        array,
        { priority: 3, name: 'medium' },
        compareFn
      );

      expect(index).toBe(1);
      expect(array).toEqual([
        { priority: 1, name: 'low' },
        { priority: 3, name: 'medium' },
        { priority: 5, name: 'high' },
      ]);
    });
  });

  describe('safeArrayRemove', () => {
    it('should remove element at valid index', () => {
      const array = [1, 2, 3, 4, 5];

      const removed = safeArrayRemove(array, 2);

      expect(removed).toBe(3);
      expect(array).toEqual([1, 2, 4, 5]);
    });

    it('should remove first element', () => {
      const array = ['a', 'b', 'c'];

      const removed = safeArrayRemove(array, 0);

      expect(removed).toBe('a');
      expect(array).toEqual(['b', 'c']);
    });

    it('should remove last element', () => {
      const array = [10, 20, 30];

      const removed = safeArrayRemove(array, 2);

      expect(removed).toBe(30);
      expect(array).toEqual([10, 20]);
    });

    it('should return undefined for out of bounds indices', () => {
      const array = [1, 2, 3];
      const originalArray = [...array];

      expect(safeArrayRemove(array, -1)).toBeUndefined();
      expect(safeArrayRemove(array, 3)).toBeUndefined();
      expect(safeArrayRemove(array, 10)).toBeUndefined();
      expect(array).toEqual(originalArray);
    });

    it('should return undefined for invalid inputs', () => {
      const array = [1, 2, 3];

      // Invalid array
      expect(safeArrayRemove(null as unknown as number[], 0)).toBeUndefined();
      expect(
        safeArrayRemove(undefined as unknown as number[], 0)
      ).toBeUndefined();
      expect(
        safeArrayRemove('not-array' as unknown as number[], 0)
      ).toBeUndefined();

      // Invalid index
      expect(
        safeArrayRemove(array, 'string' as unknown as number)
      ).toBeUndefined();
      expect(safeArrayRemove(array, null as unknown as number)).toBeUndefined();
      expect(safeArrayRemove(array, NaN)).toBeUndefined();
    });

    it('should handle empty arrays', () => {
      const array: number[] = [];

      const removed = safeArrayRemove(array, 0);

      expect(removed).toBeUndefined();
      expect(array).toEqual([]);
    });

    it('should work with complex objects', () => {
      const array = [
        { id: 1, name: 'first' },
        { id: 2, name: 'second' },
        { id: 3, name: 'third' },
      ];

      const removed = safeArrayRemove(array, 1);

      expect(removed).toEqual({ id: 2, name: 'second' });
      expect(array).toEqual([
        { id: 1, name: 'first' },
        { id: 3, name: 'third' },
      ]);
    });
  });

  describe('isValidArrayIndex', () => {
    it('should return true for valid indices', () => {
      expect(isValidArrayIndex(0, 5)).toBe(true);
      expect(isValidArrayIndex(2, 5)).toBe(true);
      expect(isValidArrayIndex(4, 5)).toBe(true);
    });

    it('should return false for out of bounds indices', () => {
      expect(isValidArrayIndex(-1, 5)).toBe(false);
      expect(isValidArrayIndex(5, 5)).toBe(false);
      expect(isValidArrayIndex(10, 5)).toBe(false);
    });

    it('should return false for non-integer numbers', () => {
      expect(isValidArrayIndex(1.5, 5)).toBe(false);
      expect(isValidArrayIndex(2.1, 5)).toBe(false);
      expect(isValidArrayIndex(Infinity, 5)).toBe(false);
      expect(isValidArrayIndex(-Infinity, 5)).toBe(false);
      expect(isValidArrayIndex(NaN, 5)).toBe(false);
    });

    it('should return false for non-numbers', () => {
      expect(isValidArrayIndex('0', 5)).toBe(false);
      expect(isValidArrayIndex(null, 5)).toBe(false);
      expect(isValidArrayIndex(undefined, 5)).toBe(false);
      expect(isValidArrayIndex({}, 5)).toBe(false);
      expect(isValidArrayIndex([], 5)).toBe(false);
      expect(isValidArrayIndex(true, 5)).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(isValidArrayIndex(0, 0)).toBe(false); // Empty array
      expect(isValidArrayIndex(0, 1)).toBe(true); // Single element array
      expect(isValidArrayIndex(-0, 5)).toBe(true); // Negative zero
    });

    it('should work with large arrays', () => {
      const largeArrayLength = 1000000;
      expect(isValidArrayIndex(0, largeArrayLength)).toBe(true);
      expect(isValidArrayIndex(999999, largeArrayLength)).toBe(true);
      expect(isValidArrayIndex(1000000, largeArrayLength)).toBe(false);
    });
  });

  describe('safeArraySlice', () => {
    it('should slice array with valid bounds', () => {
      const array = [1, 2, 3, 4, 5];

      expect(safeArraySlice(array, 1, 4)).toEqual([2, 3, 4]);
      expect(safeArraySlice(array, 0, 3)).toEqual([1, 2, 3]);
      expect(safeArraySlice(array, 2)).toEqual([3, 4, 5]);
    });

    it('should handle negative start indices', () => {
      const array = [1, 2, 3, 4, 5];

      expect(safeArraySlice(array, -1, 3)).toEqual([1, 2, 3]);
      expect(safeArraySlice(array, -10, 2)).toEqual([1, 2]);
    });

    it('should handle out of bounds indices', () => {
      const array = [1, 2, 3];

      expect(safeArraySlice(array, 1, 10)).toEqual([2, 3]);
      expect(safeArraySlice(array, 5, 10)).toEqual([]);
      expect(safeArraySlice(array, 0, -1)).toEqual([]);
    });

    it('should handle start greater than end', () => {
      const array = [1, 2, 3, 4, 5];

      expect(safeArraySlice(array, 3, 1)).toEqual([]);
      expect(safeArraySlice(array, 4, 2)).toEqual([]);
    });

    it('should return empty array for invalid arrays', () => {
      expect(safeArraySlice(null as unknown as number[], 0, 1)).toEqual([]);
      expect(safeArraySlice(undefined as unknown as number[], 0, 1)).toEqual(
        []
      );
      expect(safeArraySlice('not-array' as unknown as number[], 0, 1)).toEqual(
        []
      );
      expect(safeArraySlice({} as unknown as number[], 0, 1)).toEqual([]);
    });

    it('should handle empty arrays', () => {
      const array: number[] = [];

      expect(safeArraySlice(array, 0, 1)).toEqual([]);
      expect(safeArraySlice(array, -1, 1)).toEqual([]);
    });

    it('should not modify original array', () => {
      const array = [1, 2, 3, 4, 5];
      const original = [...array];

      const result = safeArraySlice(array, 1, 3);

      expect(result).toEqual([2, 3]);
      expect(array).toEqual(original);
    });

    it('should work with different data types', () => {
      const stringArray = ['a', 'b', 'c', 'd', 'e'];
      const objectArray = [{ id: 1 }, { id: 2 }, { id: 3 }];

      expect(safeArraySlice(stringArray, 1, 3)).toEqual(['b', 'c']);
      expect(safeArraySlice(objectArray, 0, 2)).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it('should handle missing end parameter', () => {
      const array = [1, 2, 3, 4, 5];

      expect(safeArraySlice(array, 2)).toEqual([3, 4, 5]);
      expect(safeArraySlice(array, 0)).toEqual([1, 2, 3, 4, 5]);
      expect(safeArraySlice(array, 5)).toEqual([]);
    });
  });

  describe('Integration Tests', () => {
    it('should work together for complex operations', () => {
      const array = [3, 1, 4, 1, 5, 9];

      // Find the largest element
      const largest = safeArrayFind(array, (element, index) => {
        return !safeArrayFind(array, (other, otherIndex) => {
          return otherIndex !== index && other > element;
        });
      });
      expect(largest).toBe(9);

      // Remove the largest element
      const largestIndex = array.indexOf(largest!);
      const removed = safeArrayRemove(array, largestIndex);
      expect(removed).toBe(9);
      expect(array).toEqual([3, 1, 4, 1, 5]);

      // Insert a new element in sorted position
      const sortedIndex = safeArrayInsertSorted(array, 2, (a, b) => a - b);
      expect(array).toEqual([2, 3, 1, 4, 1, 5]);
      expect(sortedIndex).toBe(0);
    });

    it('should handle error cases gracefully in combination', () => {
      const invalidArray = null as unknown as number[];

      expect(safeArrayAccess(invalidArray, 0)).toBeUndefined();
      expect(safeArrayFind(invalidArray, () => true)).toBeUndefined();
      expect(safeArrayRemove(invalidArray, 0)).toBeUndefined();
      expect(safeArraySlice(invalidArray, 0, 1)).toEqual([]);
      expect(safeArrayInsertSorted(invalidArray, 1, (a, b) => a - b)).toBe(-1);
    });
  });
});
