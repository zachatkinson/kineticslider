/**
 * Migration utility functions
 *
 * Utilities for performance benchmarking, feature monitoring, and migration tasks
 *
 * @module MigrationHelpers
 * @version 1.0.0
 */

import type { TestPerformanceMetric, BenchmarkResult, FeatureEvent as _FeatureEvent, FeatureMetrics } from "../types/migration";
import { FeatureFlag } from "../types/feature-flags";
import type { MetricSummary } from "../types/performance-shared";
import { calculateMean, _calculateMedian as calculateMedian, _calculateStandardDeviation as calculateStandardDeviation, _calculatePercentile as calculatePercentile } from "./math";

// Global feature metrics storage
const featureMetrics = new Map<string, unknown>();

/**
 * Collects performance metrics for benchmarking
 *
 * @returns Array of performance metrics
 *
 * @example
 * ```ts
 * const metrics = collectPerformanceMetrics();
 * console.log(`Collected ${metrics.length} metrics`);
 * ```
 */
export function collectPerformanceMetrics(): TestPerformanceMetric[] {
  const metrics: TestPerformanceMetric[] = [];
  const timestamp = new Date();
  const featureFlags = Object.values(FeatureFlag).reduce((acc, flag) => ({
    ...acc,
    [flag]: false
  }), {} as Record<FeatureFlag, boolean>);

  const fps = calculateFPS();
  metrics.push({
    name: 'fps',
    value: fps,
    unit: 'fps',
    timestamp,
    featureFlags
  });

  return metrics;
}

/**
 * Analyzes benchmark data and provides statistical summary
 *
 * @param metrics - Array of performance metrics to analyze
 *
 * @returns Benchmark result with statistical analysis
 *
 * @example
 * ```ts
 * const metrics = collectPerformanceMetrics();
 * const analysis = analyzeBenchmarkData(metrics);
 * console.log(`Average: ${analysis.summary.avg}, P95: ${analysis.summary.p95}`);
 * ```
 */
export function analyzeBenchmarkData(metrics: TestPerformanceMetric[]): BenchmarkResult {
  const values = metrics.map(m => m.value);
  const sorted = [...values].sort((a, b) => a - b);

  return {
    name: 'performance-analysis',
    summary: {
      avg: calculateMean(values),
      median: calculateMedian(values),
      stdDev: calculateStandardDeviation(values),
      p95: calculatePercentile(values, 95),
      min: sorted.length > 0 ? sorted[0] : 0,
      max: sorted.length > 0 ? sorted[sorted.length - 1] : 0,
      count: values.length
    },
    timestamp: new Date()
  };
}

/**
 * Tracks a feature usage event
 *
 * @param _featureName - The name of the feature being tracked (currently unused)
 *
 * @param eventData - Additional event data
 *
 * @returns Promise that resolves when tracking is complete
 *
 */
export async function trackFeatureEvent(
  _featureName: string,
  eventData: Record<string, unknown> = {}
): Promise<void> {
  // Implementation would track feature usage
  // For now, just store in memory
  if (!featureMetrics.has("events")) {
    featureMetrics.set("events", []);
  }
  
  const events = featureMetrics.get("events") as Array<Record<string, unknown>>;
  events.push({
    timestamp: Date.now(),
    ...eventData,
  });
}

/**
 * Retrieves metrics for a specific feature
 *
 * @param _featureName - The feature flag to get metrics for
 *
 * @returns The metrics for the specified feature
 *
 * @example
 * ```ts
 * const metrics = getFeatureMetrics(FeatureFlag.NEW_CORE_SLIDER);
 * console.log(`Usage count: ${metrics.usageCount}, Error rate: ${metrics.errorRate}`);
 * ```
 */
export function getFeatureMetrics(_featureName: FeatureFlag): FeatureMetrics {
  // Implementation would retrieve from actual metrics store
  return {
    usageCount: 0,
    errorCount: 0,
    errorRate: 0,
    averageLatency: 0,
    lastUpdated: new Date()
  };
}

/**
 * Calculates summary statistics for a set of values
 *
 * @param values - Array of numeric values to analyze
 *
 * @returns Summary statistics
 *
 * @example
 * ```ts
 * const values = [1, 2, 3, 4, 5];
 * const summary = calculateMetricSummary(values);
 * console.log(`Mean: ${summary.avg}, Median: ${summary.median}`);
 * ```
 */
export function calculateMetricSummary(values: number[]): MetricSummary {
  const sorted = [...values].sort((a, b) => a - b);
  
  return {
    avg: calculateMean(values),
    median: calculateMedian(values),
    stdDev: calculateStandardDeviation(values),
    p95: calculatePercentile(values, 95),
    min: sorted.length > 0 ? sorted[0] : 0,
    max: sorted.length > 0 ? sorted[sorted.length - 1] : 0,
    count: values.length
  };
}

/**
 * Measures execution time of a function
 *
 * @param name - Name for the measurement
 *
 * @param fn - Function to measure
 *
 * @returns Promise resolving to the execution time in milliseconds
 *
 * @example
 * ```ts
 * const duration = await measureExecutionTime('myFunction', async () => {
 *   await someAsyncOperation();
 * });
 * console.log(`Execution took ${duration}ms`);
 * ```
 */
export async function measureExecutionTime(
  name: string,
  fn: () => Promise<void> | void
): Promise<number> {
  const start = performance.now();
  await fn();
  const end = performance.now();
  const duration = end - start;
  
  return duration;
}

/**
 * Measures frames per second over a specified duration
 *
 * @param name - Name for the measurement
 *
 * @param durationMs - Duration to measure FPS over (default: 1000ms)
 *
 * @returns Promise resolving to the measured FPS
 *
 * @example
 * ```ts
 * const fps = await measureFPS('animation-test', 2000);
 * console.log(`Measured FPS: ${fps}`);
 * ```
 */
export function measureFPS(name: string, durationMs: number = 1000): Promise<number> {
  return new Promise((resolve) => {
    let frameCount = 0;
    let startTime = performance.now();

    const countFrame = (): void => {
      frameCount++;
      const currentTime = performance.now();

      if (currentTime - startTime >= durationMs) {
        const fps = (frameCount * 1000) / (currentTime - startTime);
        resolve(fps);
      } else {
        requestAnimationFrame(countFrame);
      }
    };

    requestAnimationFrame(countFrame);
  });
}

/**
 * Calculates frames per second (internal helper)
 *
 * @returns Calculated FPS value
 *
 */
function calculateFPS(): number {
  // In a real implementation, this would measure actual FPS
  // For now, return a default value
  return 60;
} 