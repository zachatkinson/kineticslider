/**
 * Performance monitoring types and interfaces
 */

/**
 * Base performance metrics for monitoring slider behavior
 */
export interface PerformanceMetrics {
  /** Time taken for initial render */
  initialRenderTime: number;
  /** Average frame time during animations */
  averageFrameTime: number;
  /** Number of frames dropped during animations */
  droppedFrames: number;
  /** Memory usage during animations */
  memoryUsage: number;
  /** Time taken for gesture processing */
  gestureProcessingTime: number;
}

/**
 * Extended performance metrics including web vitals
 */
export interface ExtendedPerformanceMetrics extends PerformanceMetrics {
  FCP?: number;  // First Contentful Paint
  LCP?: number;  // Largest Contentful Paint
  FID?: number;  // First Input Delay
  CLS?: number;  // Cumulative Layout Shift
  TTI?: number;  // Time to Interactive
  TBT?: number;  // Total Blocking Time
}

/**
 * Window extensions for performance monitoring
 */
export interface WindowWithAnalytics extends Window {
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
} 