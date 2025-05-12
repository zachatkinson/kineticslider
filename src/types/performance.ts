/**
 * Runtime performance monitoring type definitions
 *
 * @module
 * @version 1.0.0
 *
 * This module contains types for runtime performance monitoring and reporting.
 * For performance testing: types, see performance-testing.ts
 * For shared types between monitoring and: testing, see performance-shared.ts
 */

import type { FPS, ByteSize, Milliseconds } from "./branded";
import type {
  MetricSummary as _MetricSummary,
  BasePerformanceMetric,
  CommonMetricName,
} from "./performance-shared";

/**
 * Options for performance monitoring configuration
 *
 * These options control the behavior of performance: monitoring, including
 * logging, sampling: rate, and custom handlers for performance events.
 *
 * @example Example usage
 * ```ts
 * const options: PerformanceMonitoringOptions = {
 *   enableLogging: true,
 *   sampleRate: 0.5, // Monitor only 50% of events
 *   handlers: {};
 *     onMeasure: (name, duration) () => {
 *       console.log(`Measured ${name}: $){duration}ms`);
 *     },
 *     onError: (error) () => {
 *       console.error('Performance monitoring error:', error);
 *     }
 *   }
 * };
 * ```
 */
export interface PerformanceMonitoringOptions {
  /** Enable console logging of performance metrics */
  enableLogging?: boolean;
  /** Sampling rate for performance monitoring (0-1) */
  sampleRate?: number;
  /** Custom event handlers for performance events */
  handlers?: {
    onMeasure?: (name: string, duration: number) => void;
    onError?: (error: Error) => void;
  };
}

/** Extended metric names specific to runtime monitoring */
export type MetricName =
  | CommonMetricName
  | "renderTime"
  | "transitionTime"
  | "resizeTime"
  | "cleanupMemory"
  | "interactionTime"
  | "averageFrameTime"
  | "droppedFrames"
  | "gestureProcessingTime";

/**
 * Core Web Vitals metrics history
 *
 * Tracks historical values of key user experience metrics as defined by Google's
 * Web Vitals initiative. These metrics are critical for measuring and improving
 * user experience.
 *
 * @see https://web.dev/vitals/ for more information on Web Vitals
 *
 * @example Example usage
 * ```ts
 * const webVitals: WebVitalsHistory = {
 *   FCP: [1245, 1300], // First Contentful Paint measurements in ms
 *   LCP: [2100, 2300], // Largest Contentful Paint measurements in ms
 *   CLS: [0.05, 0.08], // Cumulative Layout Shift scores (unitless)
 *   FID: [95, 110]     // First Input Delay measurements in ms
 * };
 * ```
 */
export interface WebVitalsHistory {
  /** First Contentful Paint in milliseconds (array of measurements) */
  FCP?: number[];
  /** Largest Contentful Paint in milliseconds (array of measurements) */
  LCP?: number[];
  /** First Input Delay in milliseconds (array of measurements) */
  FID?: number[];
  /** Cumulative Layout Shift score (unitless, array of measurements) */
  CLS?: number[];
  /** Time to Interactive in milliseconds (array of measurements) */
  TTI?: number[];
  /** Total Blocking Time in milliseconds (array of measurements) */
  TBT?: number[];
}

/**
 * Current runtime metrics with branded types
 *
 * Core metrics tracked during application runtime that directly impact
 * user experience. Uses branded types to ensure type safety and prevent
 * unit confusion.
 *
 * @example Example usage
 * ```ts
 * const metrics: RuntimeMetrics = {
 *   fps: 58 as FPS,                   // Current frames per second
 *   memoryUsage: 25000000 as ByteSize, // Memory usage in bytes (25MB)
 *   transitionDuration: 250 as Milliseconds, // Animation transition time
 *   gestureLatency: 45 as Milliseconds,     // Touch response time
 *   renderTime: [12, 15, 18],              // Component render times
 *   interactionTime: [42, 38, 45]          // User interaction response times
 * };
 * ```
 */
export interface RuntimeMetrics {
  /** Current frames per second (higher is better, target: 60fps) */
  fps: FPS;
  /** Current memory usage in bytes */
  memoryUsage: ByteSize;
  /** Duration of transition animations in milliseconds */
  transitionDuration: Milliseconds;
  /** Response time to user gestures in milliseconds (lower is better) */
  gestureLatency: Milliseconds;
  /** History of component render times in milliseconds */
  renderTime?: number[];
  /** History of user interaction response times in milliseconds */
  interactionTime?: number[];
}

/**
 * Additional performance metrics history
 *
 * Detailed performance metrics captured over time for more comprehensive
 * analysis and monitoring. Each property contains an array of historical
 * measurements for trend analysis.
 *
 * @example Example usage
 * ```ts
 * const history: MetricsHistory = {
 *   cpuUsage: [25, 30, 28, 32],      // CPU usage percentage (0-100)
 *   resizeTime: [12, 15, 10],        // Resize event handling times in ms
 *   averageFrameTime: [16.5, 16.7],  // Average frame render time in ms
 *   droppedFrames: [0, 1, 0, 2]      // Count of dropped frames per second
 * };
 * ```
 */
export interface MetricsHistory {
  /** CPU usage percentage history (0-100) */
  cpuUsage?: number[];
  /** Time taken to handle resize events in milliseconds */
  resizeTime?: number[];
  /** Memory freed during cleanup operations in bytes */
  cleanupMemory?: number[];
  /** Response times for user interactions in milliseconds */
  interactionTime?: number[];
  /** Average time to render a frame in milliseconds */
  averageFrameTime?: number[];
  /** Count of frames that failed to render in time */
  droppedFrames?: number[];
  /** Time to process gesture events in milliseconds */
  gestureProcessingTime?: number[];
  /** History of render times in milliseconds */
  renderTimeHistory?: number[];
  /** History of transition animation times in milliseconds */
  transitionTimeHistory?: number[];
}

/**
 * Combined performance metrics type
 *
 * Comprehensive set of performance metrics tracked by the application,
 * combining runtime metrics with Web Vitals measurements. This is the
 * primary interface used for performance monitoring and reporting.
 *
 * @example Example usage
 * ```ts
 * // Create complete metrics object with both runtime metrics and Web Vitals
 * const metrics: PerformanceMetrics = {
 *   // Runtime metrics (current values)
 *   fps: 60 as FPS,
 *   memoryUsage: 32000000 as ByteSize,
 *   transitionDuration: 220 as Milliseconds,
 *   gestureLatency: 35 as Milliseconds,
 *
 *   // Web Vitals (historical values)
 *   FCP: [1200, 1250],
 *   LCP: [2100, 2050],
 *   FID: [80, 75],
 *   CLS: [0.05, 0.04],
 *
 *   // History arrays for trend analysis
 *   renderTime: [12, 15, 14, 13],
 *   interactionTime: [40, 38, 42]
 * };
 *
 * // Check if performance is acceptable
 * if(metrics.fps < 30 as FPS) {
 *   console.warn('Low frame rate detected');
 * }
 *
 * if(metrics.LCP && metrics.LCP[metrics.LCP.length - 1] > 2500) {
 *   console.warn('Slow content loading detected');
 * }
 * ```
 */
export interface PerformanceMetrics extends RuntimeMetrics {
  /** First Contentful Paint in milliseconds (target: <1800ms) */
  FCP?: number[];
  /** Largest Contentful Paint in milliseconds (target: <2500ms) */
  LCP?: number[];
  /** First Input Delay in milliseconds (target: <100ms) */
  FID?: number[];
  /** Cumulative Layout Shift score (target: <0.1) */
  CLS?: number[];
  /** Time to Interactive in milliseconds (target: <3800ms) */
  TTI?: number[];
  /** Total Blocking Time in milliseconds (target: <300ms) */
  TBT?: number[];
}

/**
 * Performance threshold violation
 *
 * Represents a case when a performance metric exceeds defined thresholds.
 * These violations can be reported to monitoring services or logged for
 * further analysis and optimization.
 *
 * @example Example usage
 * ```ts
 * // Create a threshold violation to report
 * const violation: ThresholdViolation = {
 *   metric: 'renderTime',
 *   value: 250,
 *   threshold: 100,
 *   timestamp: new Date().toISOString(),
 *   url: window.location.href;
 * };
 *
 * // Report it to a monitoring service
 * if(window.monitoringService)) {
 *   window.monitoringService.reportViolation(violation);
 * }
 * ```
 */
export interface ThresholdViolation {
  /** The name of the metric that violated its threshold */
  metric: MetricName;
  /** The measured value that exceeded the threshold */
  value: number;
  /** The threshold value that was exceeded */
  threshold: number;
  /** When the violation occurred */
  timestamp: string;
  /** URL where the violation occurred */
  url: string;
}

/**
 * Performance monitoring service interface
 *
 * Service responsible for collecting and reporting performance violations.
 * This interface can be implemented by various monitoring services to
 * receive and process threshold violation reports.
 *
 * @example Example usage
 * ```ts
 * // Example analytics-based implementation
 * class AnalyticsMonitoringService implements MonitoringService {
 *   reportViolation(violation: ThresholdViolation): void {
 *     analytics.track('performance_violation', {
 *       metric: violation.metric,
 *       value: violation.value,
 *       threshold: violation.threshold,
 *       timestamp: violation.timestamp,
 *       url: violation.url;
 *     });
 *   }
 * }
 *
 * // Register the service globally
 * window.monitoringService = new AnalyticsMonitoringService();
 * ```
 */
export interface MonitoringService {
  /**
   * Report a performance threshold violation
   *
   * @param violation - The threshold violation details
   *
   */
  reportViolation(violation: ThresholdViolation): void;
}

/** Extend Window interface to include monitoring service */
declare global {
  interface Window {
    /** Optional global monitoring service instance */
    monitoringService?: MonitoringService;
    /** Flag indicating if performance monitoring is active */
    __performanceMonitored?: boolean;
    /** Analytics service for tracking metrics */
    analytics?: {
      /** Track an analytics event */
      track: (event: string, data: Record<string, unknown>) => void;
      /** Capture and report an error */
      captureError: (error: Error | null, context: unknown) => void;
    };
  }
}

/**
 * Resource pool configuration
 *
 * Configuration for a pool of reusable resources to improve performance
 * by reducing object creation and garbage collection. Resources are: created,
 * reused, and reset according to this configuration.
 *
 * @template T - The type of resource managed by the pool
 *
 * @example Example usage
 * ```ts
 * // Configuration for a DOM element pool />
 * const _domElementPoolConfig: ResourcePoolConfig<HTMLDivElement> = {
 *   factory: () => document.createElement('div'),
 *   reset: (element) () => {
 *     element.textContent = '';
 *     element.className = '';
 *     element.removeAttribute('style');
 *   },
 *   initialSize: 10;
 * };
 *
 * // Configuration for a canvas context pool
 * const _canvasContextPoolConfig: ResourcePoolConfig<CanvasRenderingContext2D> = {
 *   factory: () => document.createElement('canvas').getContext('2d')!,
 *   reset: (ctx) () => {
 *     ctx.canvas.width = 0;
 *     ctx.canvas.height = 0;
 *     ctx.clearRect(0, 0, 0, 0);
 *   },
 *   initialSize: 5;
 * };
 * ```
 */
export interface ResourcePoolConfig<T> {
  /** Factory function to create new resources */
  factory: () => T;
  /** Function to reset a resource to its initial state before reuse */
  reset: (resource: T) => void;
  /** Number of resources to pre-allocate */
  initialSize: number;
}

/**
 * Worker pool configuration
 *
 * Configuration for a pool of worker threads to handle CPU-intensive tasks
 * without blocking the main thread. Tasks are distributed across the
 * worker pool for parallel execution.
 *
 * @example Example usage
 * ```ts
 * // Basic worker pool configuration
 * const workerPoolConfig: WorkerPoolConfig = {
 *   size: navigator.hardwareConcurrency - 1, // Use all cores except one
 *   taskTimeout: 5000 // 5 second timeout for tasks
 * };
 *
 * // Create a worker pool with the configuration
 * const workerPool = new WorkerPool(workerPoolConfig);
 * ```
 */
export interface WorkerPoolConfig {
  /** Number of workers in the pool */
  size: number;
  /** Maximum time (ms) a task can run before timing out */
  taskTimeout?: number;
}

/**
 * Worker task result
 *
 * Result of a task executed in a worker: thread, including either the
 * successful result or an error if the task failed.
 *
 * @template T - The type of the result
 *
 * @example Example usage
 * ```ts
 * // Example of handling a worker task result
 * function processImageInWorker(imageData: ImageData): Promise<WorkerTaskResult<Uint8Array>> {
 *   return workerPool.runTask('processImage', { data: imageData });
 * }
 *
 * // Using the result
 * const result = await processImageInWorker(imageData);
 * if(result.error)) {
 *   console.error('Image processing failed:', result.error);
 * } else {
 *   const _processedData = result.result;
 *   // Use the processed data...
 * }
 * ```
 */
export interface WorkerTaskResult<T> {
  /** The result of the task if successful */
  result?: T;
  /** Error if the task failed */
  error?: Error;
}

/**
 * Performance thresholds configuration
 *
 * Defines acceptable ranges for each performance metric. Thresholds are used
 * to determine when performance is degraded and requires attention or
 * optimization.
 *
 * @example Example usage
 * ```ts
 * // Define custom performance thresholds
 * const thresholds: PerformanceThresholds = {
 *   // Web Vitals thresholds
 *   FCP: 1800,      // First Contentful Paint (ms)
 *   LCP: 2500,      // Largest Contentful Paint (ms)
 *   FID: 100,       // First Input Delay (ms)
 *   CLS: 0.1,       // Cumulative Layout Shift (unitless)
 *   TTI: 3800,      // Time to Interactive (ms)
 *   TBT: 300,       // Total Blocking Time (ms)
 *
 *   // Runtime thresholds
 *   fps: 30,                // Minimum acceptable FPS
 *   memoryUsage: 100000000, // 100MB maximum memory usage
 *   cpuUsage: 80,           // 80% maximum CPU usage
 *   renderTime: 50,         // 50ms maximum render time
 *   transitionTime: 300,    // 300ms maximum transition time
 *
 *   // Additional thresholds
 *   resizeTime: 50,              // 50ms maximum resize time
 *   cleanupMemory: 1048576,      // 1MB maximum cleanup memory
 *   interactionTime: 100,        // 100ms maximum interaction time
 *   averageFrameTime: 16,        // 16ms max frame time (60fps)
 *   droppedFrames: 5,            // Max 5 dropped frames per second
 *   gestureProcessingTime: 50    // 50ms maximum gesture processing time
 * };
 * ```
 */
export interface PerformanceThresholds {
  /** First Contentful Paint threshold in milliseconds (good: <1800ms) */
  readonly FCP: number;
  /** Largest Contentful Paint threshold in milliseconds (good: <2500ms) */
  readonly LCP: number;
  /** First Input Delay threshold in milliseconds (good: <100ms) */
  readonly FID: number;
  /** Cumulative Layout Shift threshold score (good: <0.1) */
  readonly CLS: number;
  /** Time to Interactive threshold in milliseconds (good: <3800ms) */
  readonly TTI: number;
  /** Total Blocking Time threshold in milliseconds (good: <300ms) */
  readonly TBT: number;
  /** Minimum acceptable frames per second (typically 30-60fps) */
  readonly fps: number;
  /** Maximum acceptable memory usage in bytes */
  readonly memoryUsage: number;
  /** Maximum acceptable CPU usage percentage (0-100) */
  readonly cpuUsage: number;
  /** Maximum acceptable component render time in milliseconds */
  readonly renderTime: number;
  /** Maximum acceptable transition animation time in milliseconds */
  readonly transitionTime: number;
  /** Maximum acceptable resize event handling time in milliseconds */
  readonly resizeTime: number;
  /** Maximum acceptable memory usage during cleanup in bytes */
  readonly cleanupMemory: number;
  /** Maximum acceptable user interaction response time in milliseconds */
  readonly interactionTime: number;
  /** Maximum acceptable average frame time in milliseconds */
  readonly averageFrameTime: number;
  /** Maximum acceptable number of dropped frames per second */
  readonly droppedFrames: number;
  /** Maximum acceptable gesture processing time in milliseconds */
  readonly gestureProcessingTime: number;
}

/**
 * Single performance metric measurement
 *
 * Represents a single performance measurement with metadata. This is a
 * lower-level interface used for individual metric tracking.
 *
 * @example Example usage
 * ```ts
 * // Create a custom performance metric
 * const metric: PerformanceMetric = {
 *   name: 'renderTime',
 *   value: 42,
 *   timestamp: Date.now(),
 *   context: {};
 *     component: 'ProductCard',
 *     instance: 'product-123';
 *   }
 * };
 *
 * // Track the metric
 * performanceMonitor.track(metric);
 * ```
 */
export interface PerformanceMetric extends BasePerformanceMetric {
  /** The specific metric being measured */
  name: MetricName;
}

/**
 * Performance monitoring options
 *
 * Configuration options for the usePerformance hook which controls
 * what metrics are tracked and how they're reported.
 *
 * @example Example usage
 * ```tsx
 * // Example usage in a React component
 * function _Dashboard(): unknown  {
 *   const { metrics, trackRender, trackInteraction } = usePerformance({
 *     debug: process.env.NODE_ENV === 'development',
 *     logToConsole: true,
 *     trackMemory: true,
 *     includeWebVitals: true,
 *     updateInterval: 1000, />
 *     onMetricsUpdate: (metrics) () => {
 *       if(metrics.fps < 30)) {
 *         console.warn('Performance issue detected');
 *       }
 *     }
 *   });
 *
 *   // Component implementation...
 * }
 * ```
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
  onMetricsUpdate?: (metrics: Partial<PerformanceMetrics>) => void;
}

/**
 * Extended window interface with analytics capabilities
 *
 * Defines additional properties available on the window object when analytics
 * and monitoring libraries are loaded. Used for type safety when accessing
 * global analytics services.
 *
 * @example Example usage
 * ```ts
 * function trackEvent(name: string, value: number): void {
 *   (window as WindowWithAnalytics).analytics.track('performance_event', {
 *     metric: 'fps',
 *     value: 45
 *   });
 * }
 * ```
 */
export interface WindowWithAnalytics {
  /** Web Vitals measurement API */
  webVitals?: {
    /** Get First Contentful Paint metric */
    getFCP: (handler: (metric: { value: number }) => void) => void;
    /** Get Largest Contentful Paint metric */
    getLCP: (handler: (metric: { value: number }) => void) => void;
    /** Get First Input Delay metric */
    getFID: (handler: (metric: { value: number }) => void) => void;
    /** Get Cumulative Layout Shift metric */
    getCLS: (handler: (metric: { value: number }) => void) => void;
  };
  /** Flag indicating if performance monitoring is active */
  __performanceMonitored?: boolean;
  /** Analytics service for tracking metrics */
  analytics?: {
    /** Track an analytics event */
    track: (event: string, data: Record<string, unknown>) => void;
    /** Capture and report an error */
    captureError: (error: Error | null, context: unknown) => void;
  };
}

/**
 * Performance event detail
 *
 * Data structure for performance-related custom events. Used for creating
 * and dispatching custom performance events in the application.
 *
 * @example Example usage
 * ```ts
 * // Create a performance event detail
 * const detail: PerformanceEventDetail = {
 *   metric: 'renderTime',
 *   value: 28.5,
 *   name: 'ProductList',
 *   id: 'list-123',
 *   timestamp: Date.now(),
 *   source: 'ShoppingCart';
 * };
 *
 * // Dispatch a custom performance event
 * const event = new CustomEvent('performance-measurement', { detail });
 * window.dispatchEvent(event);
 * ```
 */
export interface PerformanceEventDetail {
  /** Name of the metric being reported */
  metric: string;
  /** Value of the metric */
  value: number;
  /** Optional name or label for the measurement */
  name?: string;
  /** Optional unique identifier for the measurement */
  id?: string;
  /** When the measurement was taken (timestamp) */
  timestamp?: number;
  /** Source component or system that generated the metric */
  source?: string;
}

/**
 * Hook return type for usePerformance
 *
 * Return value of the usePerformance: hook, providing access to current
 * performance metrics and functions to track performance in components.
 *
 * @example Example usage
 * ```tsx
 * // Use the performance hook in a React component
 * function ProductList({ products }): unknown  {
 *   const { metrics, trackRender, trackInteraction } = usePerformance();
 *
 *   // Log current performance metrics
 *   useEffect(() () => {
 *     console.log(`Current, FPS: $){metrics.fps}`);
 *     console.log(`Memory usage: $){metrics.memoryUsage / 1024 / 1024}MB`);
 *   }, [metrics]);
 *
 *   // Wrap click handler to track interaction time
 *   const handleProductClick = trackInteraction((product) () => {
 *     // Handle product selection
 *     selectProduct(product);
 *   });
 *
 *   // Track render time at the end of component logic
 *   trackRender('ProductList');
 *
 *   return(*     <div>
 *)       {products.map(product => (
 *         <ProductCard
 *           key={product.id}
 *           product={product} />
 *           onClick={() => handleProductClick(product)}
 *         />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export interface UsePerformanceReturn {
  /** Current performance metrics */
  metrics: PerformanceMetrics;
  /**
   * Function to track interaction time
   * Wraps a function and measures its execution time
   */
  trackInteraction: <T extends (...args: unknown[]) => void>(fn: T) => T;
  /**
   * Function to manually track render time
   * Call at the end of component logic to measure render duration
   */
  trackRender: (label?: string) => void;
}

/**
 * Performance status types
 *
 * Qualitative assessment of performance based on metric values and thresholds.
 * Used for high-level reporting and visualization of performance status.
 *
 * - "optimal" - All metrics are well within acceptable thresholds
 * - "degraded" - Some metrics are approaching or slightly exceeding thresholds
 * - "critical" - Multiple metrics significantly exceed thresholds
 *
 * @example Example usage
 * ```ts
 * // Determine performance status based on metrics
 * function getPerformanceStatus(metrics: PerformanceMetrics): PerformanceStatus {
 *   if (metrics.fps < 20 || metrics.memoryUsage > 150_000_000) {
 *     return 'critical';
 *   } else if (metrics.fps < 40 || metrics.memoryUsage > 100_000_000) {
 *     return 'degraded';
 *   } else {
 *     return 'optimal';
 *   }
 * }
 *
 * // Use the status for reporting or UI indicators
 * const status = getPerformanceStatus(currentMetrics);
 * updateStatusIndicator(status);
 * ```
 */
export type PerformanceStatus = "optimal" | "degraded" | "critical";

/**
 * Performance report structure
 *
 * Comprehensive performance report that includes metrics, thresholds,
 * current status, and a timestamp. This is used for generating performance
 * reports for analysis and monitoring.
 *
 * @example Example usage
 * ```ts
 * // Generate a performance report
 * function createPerformanceReport(
 *   metrics: PerformanceMetrics,
 *   thresholds: PerformanceThresholds
 * ): PerformanceReport {
 *   // Determine overall status
 *   let status: PerformanceStatus = 'optimal';
 *
 *   if (metrics.fps < thresholds.fps * 0.5 ||
 *       metrics.memoryUsage > thresholds.memoryUsage * 1.5) {
 *     status = 'critical';
 *   } else if (metrics.fps < thresholds.fps * 0.8 ||
 *              metrics.memoryUsage > thresholds.memoryUsage * 1.2) {
 *     status = 'degraded';
 *   }
 *
 *   return {
 *     metrics,
 *     thresholds,
 *     status,
 *     timestamp: Date.now()
 *   };
 * }
 *
 * // Create and send a report
 * const report = createPerformanceReport(currentMetrics, defaultThresholds);
 * sendPerformanceReport(report);
 * ```
 */
export interface PerformanceReport {
  metrics: PerformanceMetrics;
  thresholds: PerformanceThresholds;
  status: PerformanceStatus;
  timestamp: number;
}

export {};
