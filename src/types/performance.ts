/**
 * Runtime performance monitoring type definitions
 * @module
 * @version 1.0.0
 * 
 * This module contains types for runtime performance monitoring and reporting.
 * For performance testing types, see performance-testing.ts
 * For shared types between monitoring and testing, see performance-shared.ts
 */

import type { FPS, ByteSize, Milliseconds } from './branded';
import type { MetricSummary, BasePerformanceMetric, CommonMetricName } from './performance-shared';

/** Extended metric names specific to runtime monitoring */
export type MetricName = CommonMetricName
  | 'renderTime'
  | 'transitionTime'
  | 'resizeTime'
  | 'cleanupMemory'
  | 'interactionTime'
  | 'averageFrameTime'
  | 'droppedFrames'
  | 'gestureProcessingTime';

/** Core Web Vitals metrics history */
export interface WebVitalsHistory {
  FCP?: number[];
  LCP?: number[];
  FID?: number[];
  CLS?: number[];
  TTI?: number[];
  TBT?: number[];
}

/** Current runtime metrics with branded types */
export interface RuntimeMetrics {
  fps: FPS;
  memoryUsage: ByteSize;
  transitionDuration: Milliseconds;
  gestureLatency: Milliseconds;
  renderTime?: number[];
  interactionTime?: number[];
}

/** Additional performance metrics history */
export interface MetricsHistory {
  cpuUsage?: number[];
  resizeTime?: number[];
  cleanupMemory?: number[];
  interactionTime?: number[];
  averageFrameTime?: number[];
  droppedFrames?: number[];
  gestureProcessingTime?: number[];
  renderTimeHistory?: number[];
  transitionTimeHistory?: number[];
}

/** Combined performance metrics type */
export interface PerformanceMetrics extends RuntimeMetrics {
  FCP?: number[];
  LCP?: number[];
  FID?: number[];
  CLS?: number[];
  TTI?: number[];
  TBT?: number[];
}

/** Performance threshold violation */
export interface ThresholdViolation {
  metric: MetricName;
  value: number;
  threshold: number;
  timestamp: string;
  url: string;
}

/** Performance monitoring service interface */
export interface MonitoringService {
  reportViolation(violation: ThresholdViolation): void;
}

/** Extend Window interface to include monitoring service */
declare global {
  interface Window {
    monitoringService?: MonitoringService;
  }
}

/** Resource pool configuration */
export interface ResourcePoolConfig<T> {
  factory: () => T;
  reset: (resource: T) => void;
  initialSize: number;
}

/** Worker pool configuration */
export interface WorkerPoolConfig {
  size: number;
  taskTimeout?: number;
}

/** Worker task result */
export interface WorkerTaskResult<T> {
  result?: T;
  error?: Error;
}

/** Performance thresholds configuration */
export interface PerformanceThresholds {
  readonly FCP: number;
  readonly LCP: number;
  readonly FID: number;
  readonly CLS: number;
  readonly TTI: number;
  readonly TBT: number;
  readonly fps: number;
  readonly memoryUsage: number;
  readonly cpuUsage: number;
  readonly renderTime: number;
  readonly transitionTime: number;
  readonly resizeTime: number;
  readonly cleanupMemory: number;
  readonly interactionTime: number;
  readonly averageFrameTime: number;
  readonly droppedFrames: number;
  readonly gestureProcessingTime: number;
}

/** Single performance metric measurement */
export interface PerformanceMetric extends BasePerformanceMetric {
  name: MetricName;
}

/** Performance monitoring options */
export interface UsePerformanceOptions {
  /** Enable debug mode with verbose logging */
  debug?: boolean;
  /** Log performance metrics to console */
  logToConsole?: boolean;
  /** Track memory usage (if available in browser) */
  trackMemory?: boolean;
  /** Include Web Vitals metrics */
  includeWebVitals?: boolean;
  /** Interval (in ms) for updating metrics */
  updateInterval?: number;
  /** Callback for when metrics are updated */
  onMetricsUpdate?: (metrics: Partial<PerformanceMetrics>) => void;
}

/** Window interface with analytics extensions */
export interface WindowWithAnalytics {
  webVitals?: {
    getFCP: (handler: (metric: { value: number }) => void) => void;
    getLCP: (handler: (metric: { value: number }) => void) => void;
    getFID: (handler: (metric: { value: number }) => void) => void;
    getCLS: (handler: (metric: { value: number }) => void) => void;
  };
  __performanceMonitored?: boolean;
  analytics?: {
    track: (event: string, data: Record<string, unknown>) => void;
    captureError: (error: Error | null, context: unknown) => void;
  };
}

/** Performance event detail */
export interface PerformanceEventDetail {
  metric: string;
  value: number;
  name?: string;
  id?: string;
  timestamp?: number;
  source?: string;
}

/** Hook return type for usePerformance */
export interface UsePerformanceReturn {
  /** Current performance metrics */
  metrics: PerformanceMetrics;
  /** Function to track interaction time */
  trackInteraction: <T extends (...args: unknown[]) => void>(fn: T) => T;
  /** Function to manually track render time */
  trackRender: (label?: string) => void;
}

/** Performance status types */
export type PerformanceStatus = 'optimal' | 'degraded' | 'critical';

/** Performance report structure */
export interface PerformanceReport {
  metrics: PerformanceMetrics;
  thresholds: PerformanceThresholds;
  status: PerformanceStatus;
  timestamp: number;
}
