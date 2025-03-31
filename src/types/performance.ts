/**
 * Performance monitoring types and interfaces
 */

/**
 * Base performance metrics for monitoring slider behavior
 */
export interface PerformanceMetrics {
  /** First Contentful Paint - time until first content appears */
  FCP: number[];
  /** Largest Contentful Paint - time until largest content element appears */
  LCP: number[];
  /** First Input Delay - time until first user interaction is processed */
  FID: number[];
  /** Cumulative Layout Shift - measure of visual stability */
  CLS: number[];
  /** Time to Interactive - time until page becomes fully interactive */
  TTI: number[];
  /** Frames per second measurements */
  fps: number[];
  /** Memory usage as a fraction of total heap size */
  memoryUsage: number[];
  /** CPU usage as a fraction of available processing power */
  cpuUsage: number[];
  /** Time taken for initial component render */
  renderTime: number[];
  /** Time taken for slide transition animations */
  transitionTime: number[];
  /** Time taken to process window resize events */
  resizeTime: number[];
  /** Memory freed during cleanup operations */
  cleanupMemory: number[];
  /** Time taken for interaction processing */
  interactionTime: number[];
  /** Average frame time during animations */
  averageFrameTime: number[];
  /** Number of frames dropped during animations */
  droppedFrames: number[];
  /** Time taken for gesture processing */
  gestureProcessingTime: number[];
}

/**
 * Statistical summary of a performance metric.
 */
export interface MetricSummary {
  /** Average value of the metric */
  avg: number;
  /** 95th percentile value */
  p95: number;
  /** Maximum recorded value */
  max: number;
  /** Minimum recorded value */
  min: number;
  /** Number of measurements taken */
  count: number;
}

/**
 * Extended performance metrics including additional web vitals
 */
export interface ExtendedPerformanceMetrics extends PerformanceMetrics {
  /** Total Blocking Time */
  TBT: number[];
}

/**
 * Options for the usePerformance hook
 */
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
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
}

/**
 * Window extensions for performance monitoring
 */
export interface WindowWithAnalytics {
  analytics?: {
    track: (event: string, data: unknown) => void;
  };
  errorTracker?: {
    captureError: (error: Error | null, context: unknown) => void;
  };
  webVitals: {
    getFCP: (cb: (metric: { value: number }) => void) => void;
    getLCP: (cb: (metric: { value: number }) => void) => void;
    getFID: (cb: (metric: { value: number }) => void) => void;
    getCLS: (cb: (metric: { value: number }) => void) => void;
    getTTI: (cb: (metric: { value: number }) => void) => void;
    getTBT: (cb: (metric: { value: number }) => void) => void;
  };
  __performanceMonitored?: boolean;
  requestIdleCallback: (
    callback: IdleRequestCallback,
    options?: IdleRequestOptions
  ) => number;
}

export interface PerformanceEventDetail {
  metric: string;
  value: number;
  name?: string;
  id?: string;
  timestamp?: number;
  source?: string;
}

/**
 * Return type for usePerformance hook
 */
export interface UsePerformanceReturn {
  /** Current performance metrics */
  metrics: PerformanceMetrics;
  /** Function to track interaction time */
  trackInteraction: <T extends (...args: unknown[]) => void>(fn: T) => T;
  /** Function to manually track render time */
  trackRender: (label?: string) => void;
}
