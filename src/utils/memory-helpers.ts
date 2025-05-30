/**
 * Memory tracking utility functions
 *
 * Utilities for monitoring memory usage and detecting potential memory leaks
 * Useful for performance monitoring and testing
 *
 * @module MemoryHelpers
 * @version 1.0.0
 */

import type { MemorySnapshot, MemoryComparison, MemoryMeasurement } from "../types/memory";

/**
 * Captures the current memory state
 * In a browser environment, uses performance.memory (Chrome only)
 * In testing environments, returns mock data if performance.memory is not available
 *
 * @returns Object containing memory usage metrics
 *
 * @example
 * ```ts
 * const snapshot = captureMemoryUsage();
 * console.log(`Used: ${snapshot.usedJSHeapSize} bytes`);
 * ```
 */
export function captureMemoryUsage(): MemorySnapshot {
  // Browser environment with memory API (Chrome)
  if (typeof performance !== "undefined" && performance.memory) {
    const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } =
      performance.memory;

    return {
      usedJSHeapSize,
      totalJSHeapSize,
      jsHeapSizeLimit,
      usedHeapPercentage: usedJSHeapSize / totalJSHeapSize,
      timestamp: Date.now(),
    };
  }

  // Testing environment with no memory API - return mock values
  return {
    usedJSHeapSize: 50000000,
    totalJSHeapSize: 100000000,
    jsHeapSizeLimit: 200000000,
    usedHeapPercentage: 0.5,
    timestamp: Date.now(),
  };
}

/**
 * Compares two memory snapshots to detect potential leaks
 *
 * @param before - Memory snapshot captured before operation
 *
 * @param after - Memory snapshot captured after operation
 *
 * @param options - Comparison options
 *
 * @param options.allowedIncrease - Maximum allowed percentage increase in memory usage (default: 0.05 or 5%)
 *
 * @returns Object with isClean flag and detailed comparison results
 *
 * @example
 * ```ts
 * const before = captureMemoryUsage();
 * // ... perform operation
 * const after = captureMemoryUsage();
 * const comparison = compareMemorySnapshots(before, after);
 * 
 * if (!comparison.isClean) {
 *   console.warn("Potential memory leak detected");
 * }
 * ```
 */
export function compareMemorySnapshots(
  before: MemorySnapshot,
  after: MemorySnapshot,
  options: { allowedIncrease?: number } = {},
): MemoryComparison {
  const { allowedIncrease = 0.05 } = options; // Default 5% allowed increase

  // Calculate the percentage change for each metric
  const changes: Record<string, {
    before: number;
    after: number;
    absoluteChange: number;
    percentageChange: number;
    potentialLeak?: boolean;
  }> = {};
  let isClean = true;

  // Compare each metric that exists in both snapshots
  Object.keys(before).forEach((key) => {
    if (typeof after[key as keyof MemorySnapshot] === "number" && key !== "timestamp") {
      const beforeValue = before[key as keyof MemorySnapshot] as number;
      const afterValue = after[key as keyof MemorySnapshot] as number;
      const absoluteChange = afterValue - beforeValue;
      const percentageChange = beforeValue ? absoluteChange / beforeValue : 0;

      changes[key] = {
        before: beforeValue,
        after: afterValue,
        absoluteChange,
        percentageChange,
      };

      // Mark as potential leak if percentage increase exceeds allowed threshold
      // Only check for positive changes (memory increases)
      if (percentageChange > allowedIncrease) {
        changes[key].potentialLeak = true;
        isClean = false;
      }
    }
  });

  return {
    isClean,
    details: changes,
  };
}

/**
 * Measures memory usage before and after executing a function
 *
 * @param fn - Function to execute and measure
 *
 * @param options - Measurement options
 *
 * @param options.allowedIncrease - Maximum allowed percentage increase in memory usage
 *
 * @returns Object containing function result and memory comparison
 *
 * @example
 * ```ts
 * const measurement = measureMemoryUsage(() => {
 *   // Some operation that might leak memory
 *   return processLargeDataSet();
 * });
 * 
 * if (!measurement.memoryUsage.isClean) {
 *   console.warn("Operation may have caused memory leak");
 * }
 * ```
 */
export function measureMemoryUsage<T>(
  fn: () => T,
  options: { allowedIncrease?: number } = {},
): MemoryMeasurement<T> {
  const before = captureMemoryUsage();
  const result = fn();
  const after = captureMemoryUsage();

  const memoryUsage = compareMemorySnapshots(before, after, options);

  return {
    result,
    memoryUsage,
  };
}

/**
 * Measures memory usage before and after executing an async function
 *
 * @param fn - Async function to execute and measure
 *
 * @param options - Measurement options
 *
 * @param options.allowedIncrease - Maximum allowed percentage increase in memory usage
 *
 * @returns Promise resolving to object containing function result and memory comparison
 *
 * @example
 * ```ts
 * const measurement = await measureMemoryUsageAsync(async () => {
 *   return await fetchLargeDataSet();
 * });
 * 
 * if (!measurement.memoryUsage.isClean) {
 *   console.warn("Async operation may have caused memory leak");
 * }
 * ```
 */
export async function measureMemoryUsageAsync<T>(
  fn: () => Promise<T>,
  options: { allowedIncrease?: number } = {},
): Promise<MemoryMeasurement<T>> {
  const before = captureMemoryUsage();
  const result = await fn();
  const after = captureMemoryUsage();

  const memoryUsage = compareMemorySnapshots(before, after, options);

  return {
    result,
    memoryUsage,
  };
}

/**
 * Triggers garbage collection if available (Node.js with --expose-gc flag)
 * In browser environments, this is a no-op
 *
 * @example
 * ```ts
 * // Before measuring memory
 * forceGarbageCollection();
 * const snapshot = captureMemoryUsage();
 * ```
 */
export function forceGarbageCollection(): void {
  // Node.js environment with garbage collection exposed
  if (typeof global !== "undefined" && global.gc) {
    global.gc();
  }
  // Browser environments don't have direct GC control
  // This is intentionally a no-op in browsers
}

/**
 * Creates a memory leak detector that can be used to monitor memory over time
 *
 * @param options - Detector options
 *
 * @param options.interval - How often to check memory (in milliseconds)
 *
 * @param options.threshold - Memory increase threshold to trigger warning
 *
 * @param options.onLeak - Callback when potential leak is detected
 *
 * @returns Object with start/stop methods and current status
 *
 * @example
 * ```ts
 * const detector = createMemoryLeakDetector({
 *   interval: 5000, // Check every 5 seconds
 *   threshold: 0.1, // 10% increase threshold
 *   onLeak: (comparison) => {
 *     console.warn("Memory leak detected:", comparison);
 *   }
 * });
 * 
 * detector.start();
 * // ... later
 * detector.stop();
 * ```
 */
export function createMemoryLeakDetector(options: {
  interval?: number;
  threshold?: number;
  onLeak?: (comparison: MemoryComparison) => void;
} = {}): {
  start: () => void;
  stop: () => void;
  getStatus: () => {
    isRunning: boolean;
    baseline: MemorySnapshot | null;
    interval: number;
    threshold: number;
  };
} {
  const { interval = 10000, threshold = 0.05, onLeak } = options;
  let intervalId: NodeJS.Timeout | number | null = null;
  let baseline: MemorySnapshot | null = null;
  let isRunning = false;

  const start = (): void => {
    if (isRunning) return;

    baseline = captureMemoryUsage();
    isRunning = true;

    intervalId = setInterval(() => {
      if (!baseline) return;

      const current = captureMemoryUsage();
      const comparison = compareMemorySnapshots(baseline, current, {
        allowedIncrease: threshold,
      });

      if (!comparison.isClean && onLeak) {
        onLeak(comparison);
      }

      // Update baseline to current snapshot for next comparison
      baseline = current;
    }, interval);
  };

  const stop = (): void => {
    if (!isRunning) return;

    if (intervalId) {
      clearInterval(intervalId as NodeJS.Timeout);
      intervalId = null;
    }
    baseline = null;
    isRunning = false;
  };

  const getStatus = (): {
    isRunning: boolean;
    baseline: MemorySnapshot | null;
    interval: number;
    threshold: number;
  } => ({
    isRunning,
    baseline: baseline ? { ...baseline } : null,
    interval,
    threshold,
  });

  return {
    start,
    stop,
    getStatus,
  };
} 