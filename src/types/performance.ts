/**
 * Performance monitoring types and interfaces
 */

/**
 * Base performance metrics for monitoring slider behavior
 */
export interface PerformanceMetrics {
  /** Time taken for initial render */
  initialRenderTime?: number;
  /** Time taken for render updates */
  renderTime?: number;
  /** Time taken for interaction processing */
  interactionTime?: number;
  /** Average frame time during animations */
  averageFrameTime?: number;
  /** Number of frames dropped during animations */
  droppedFrames?: number;
  /** Memory usage during animations */
  memoryUsage?: number | null;
  /** Time taken for gesture processing */
  gestureProcessingTime?: number;
  /** Current frames per second */
  fps?: number | null;
}

/**
 * Extended performance metrics including web vitals
 */
export interface ExtendedPerformanceMetrics extends PerformanceMetrics {
  FCP?: number; // First Contentful Paint
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift
  TTI?: number; // Time to Interactive
  TBT?: number; // Total Blocking Time
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
