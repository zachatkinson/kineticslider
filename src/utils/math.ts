/**
 * Math utility functions for statistical calculations and numerical operations
 */

import { _isFiniteNumber as isFiniteNumber } from './type-checks';

/**
 * Calculates the arithmetic mean of an array of numbers
 * @param values Array of numbers
 * @returns The arithmetic mean
 */
export function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/**
 * Calculates the median of an array of numbers
 * @param values Array of numbers
 * @returns The median value
 */
export function _calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

/**
 * Calculates the standard deviation of an array of numbers
 * @param values Array of numbers
 * @returns The standard deviation
 */
export function _calculateStandardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = calculateMean(values);
  const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
  return Math.sqrt(calculateMean(squaredDiffs));
}

/**
 * Clamps a number between a minimum and maximum value
 * @param value - The value to clamp
 * @param min - The minimum value
 * @param max - The maximum value
 * @returns The clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Linearly interpolates between two values
 * @param start - The start value
 * @param end - The end value
 * @param t - The interpolation factor (0-1)
 * @returns The interpolated value
 */
export function _lerp(start: number, end: number, t: number): number {
  return start + (end - start) * clamp(t, 0, 1);
}

/**
 * Maps a value from one range to another
 * @param value - The value to map
 * @param inMin - The minimum of the input range
 * @param inMax - The maximum of the input range
 * @param outMin - The minimum of the output range
 * @param outMax - The maximum of the output range
 * @returns The mapped value
 */
export function _mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

/**
 * Rounds a number to a specified number of decimal places
 * @param value - The value to round
 * @param decimals - The number of decimal places
 * @returns The rounded value
 */
export function _roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Checks if two numbers are approximately equal within a tolerance
 * @param a - The first number
 * @param b - The second number
 * @param tolerance - The tolerance (default: Number.EPSILON)
 * @returns True if the numbers are approximately equal
 */
export function _approximatelyEqual(
  a: number,
  b: number,
  tolerance: number = Number.EPSILON
): boolean {
  return Math.abs(a - b) <= tolerance;
}

/**
 * Generates a random number between min and max (inclusive)
 * @param min - The minimum value
 * @param max - The maximum value
 * @returns A random number between min and max
 */
export function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Generates a random integer between min and max (inclusive)
 * @param min - The minimum value
 * @param max - The maximum value
 * @returns A random integer between min and max
 */
export function _randomIntBetween(min: number, max: number): number {
  return Math.floor(randomBetween(min, max + 1));
}

/**
 * Safely performs arithmetic operations, handling edge cases
 */
export const _safeArithmetic = {
  add: (a: number, b: number): number => {
    if (!isFiniteNumber(a) || !isFiniteNumber(b)) return NaN;
    return a + b;
  },
  subtract: (a: number, b: number): number => {
    if (!isFiniteNumber(a) || !isFiniteNumber(b)) return NaN;
    return a - b;
  },
  multiply: (a: number, b: number): number => {
    if (!isFiniteNumber(a) || !isFiniteNumber(b)) return NaN;
    return a * b;
  },
  divide: (a: number, b: number): number => {
    if (!isFiniteNumber(a) || !isFiniteNumber(b) || b === 0) return NaN;
    return a / b;
  }
};

/**
 * Calculates a specified percentile of an array of numbers
 * @param values - Array of numbers
 * @param percentile - The percentile to calculate (0-100)
 * @returns The value at the specified percentile
 */
export function _calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  if (percentile < 0 || percentile > 100) {
    throw new Error('Percentile must be between 0 and 100');
  }
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, index))];
} 