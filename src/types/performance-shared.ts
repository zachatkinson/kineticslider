/**
 * Shared performance type definitions used across monitoring and testing
 * @module
 * @version 1.0.0
 */

/** Basic metric summary statistics */
export interface MetricSummary {
  mean: number;
  median: number;
  stdDev: number;
  p95: number;
  count: number;
}

/** Base performance metric structure */
export interface BasePerformanceMetric {
  name: string;
  value: number;
  timestamp: number | Date;
  unit?: 'ms' | 'fps' | 'bytes' | 'score';
}

/** Common metric names used across the system */
export type CommonMetricName = 
  | 'FCP'
  | 'LCP'
  | 'FID'
  | 'CLS'
  | 'TTI'
  | 'TBT'
  | 'fps'
  | 'memoryUsage'
  | 'cpuUsage'; 