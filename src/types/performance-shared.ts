/**
 * Shared performance type definitions used across monitoring and testing
 * @module
 * @version 1.0.0
 */

/**
 * Basic metric summary statistics
 * Contains statistical values calculated from a series of metric measurements
 * 
 * @interface
 * @example
 * ```typescript
 * // Example metric summary for FPS measurements
 * const fpsSummary: MetricSummary = {
 *   avg: 58.7,
 *   p95: 60,
 *   min: 45,
 *   max: 60,
 *   count: 120,
 *   median: 59,
 *   stdDev: 3.2
 * };
 * ```
 */
export interface MetricSummary {
  /** 
   * Average (mean) value of the metric
   */
  avg: number;
  
  /**
   * Median value of the metric (middle value in the sorted data)
   */
  median?: number;
  
  /**
   * Standard deviation of the metric (measure of dispersion)
   */
  stdDev?: number;
  
  /**
   * 95th percentile value (value below which 95% of observations fall)
   */
  p95: number;
  
  /**
   * Minimum recorded value
   */
  min: number;
  
  /**
   * Maximum recorded value
   */
  max: number;
  
  /**
   * Number of measurements included in these statistics
   */
  count: number;
}

/**
 * Base performance metric structure
 * Core structure for all performance measurements
 * 
 * @interface
 * @example
 * ```typescript
 * // Example of a frame rate measurement
 * const fpsMetric: BasePerformanceMetric = {
 *   name: 'fps',
 *   value: 60,
 *   timestamp: Date.now(),
 *   unit: 'fps'
 * };
 * ```
 */
export interface BasePerformanceMetric {
  /**
   * Identifier for the metric
   */
  name: string;
  
  /**
   * Numerical value of the measurement
   */
  value: number;
  
  /**
   * When the measurement was taken
   */
  timestamp: number | Date;
  
  /**
   * Unit of measurement
   */
  unit?: 'ms' | 'fps' | 'bytes' | 'score';
}

/**
 * Common metric names used across the system
 * Core web vitals and general performance metrics
 * 
 * @type
 * @example
 * ```typescript
 * // Using a common metric name in a function
 * function trackMetric(name: CommonMetricName, value: number) {
 *   if (name === 'FCP' || name === 'LCP') {
 *     console.log(`Critical rendering metric ${name}: ${value}ms`);
 *   } else if (name === 'fps') {
 *     console.log(`Frame rate: ${value} FPS`);
 *   }
 * }
 * ```
 */
export type CommonMetricName = 
  /** First Contentful Paint (ms) */
  | 'FCP'
  /** Largest Contentful Paint (ms) */
  | 'LCP'
  /** First Input Delay (ms) */
  | 'FID'
  /** Cumulative Layout Shift (unitless) */
  | 'CLS'
  /** Time to Interactive (ms) */
  | 'TTI'
  /** Total Blocking Time (ms) */
  | 'TBT'
  /** Frames Per Second */
  | 'fps'
  /** Memory Usage (bytes or %) */
  | 'memoryUsage'
  /** CPU Utilization (%) */
  | 'cpuUsage'; 