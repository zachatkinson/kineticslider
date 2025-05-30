/**
 * Memory-related type definitions
 *
 * This module contains type definitions for memory tracking and monitoring,
 * including snapshots, comparisons, and measurements.
 *
 * @module Memory
 * @version 1.0.0
 */

/**
 * Memory usage snapshot interface
 *
 * @example Memory snapshot structure
 * ```ts
 * const snapshot: MemorySnapshot = {
 *   usedJSHeapSize: 50000000,
 *   totalJSHeapSize: 100000000,
 *   jsHeapSizeLimit: 200000000,
 *   usedHeapPercentage: 0.5,
 *   timestamp: Date.now()
 * };
 * ```
 */
export interface MemorySnapshot {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usedHeapPercentage: number;
  timestamp: number;
}

/**
 * Memory comparison result interface
 *
 * @example Memory comparison result
 * ```ts
 * const comparison: MemoryComparison = {
 *   isClean: true,
 *   details: {
 *     usedJSHeapSize: {
 *       before: 50000000,
 *       after: 52000000,
 *       absoluteChange: 2000000,
 *       percentageChange: 0.04
 *     }
 *   }
 * };
 * ```
 */
export interface MemoryComparison {
  isClean: boolean;
  details: Record<string, {
    before: number;
    after: number;
    absoluteChange: number;
    percentageChange: number;
    potentialLeak?: boolean;
  }>;
}

/**
 * Memory measurement result interface
 *
 * @example Memory measurement result
 * ```ts
 * const measurement: MemoryMeasurement<string> = {
 *   result: "operation completed",
 *   memoryUsage: {
 *     isClean: true,
 *     details: {}
 *   }
 * };
 * ```
 */
export interface MemoryMeasurement<T> {
  result: T;
  memoryUsage: MemoryComparison;
}

/**
 * Global interface extensions for memory tracking
 */
declare global {
  interface Performance {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  }

  interface Global {
    gc?: () => void;
  }
} 