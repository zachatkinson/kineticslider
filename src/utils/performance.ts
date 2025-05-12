/**
 * Performance utilities for optimizing operations
 */

import type { FPS, ByteSize, Milliseconds } from "../types/branded";
import type {
  PerformanceMetrics,
  PerformanceMonitoringOptions,
} from "../types/performance";
import type { MetricSummary } from "../types/performance-shared";
import {
  calculateMean,
  _calculateMedian as calculateMedian,
  _calculateStandardDeviation as calculateStandardDeviation,
  _calculatePercentile as calculatePercentile,
} from "./math";
import { debounce, throttle } from "./common";

/**
 * Performance sample data structure
 *
 * @example
 * A sample data point from performance monitoring
 * const sample = {
 *   timestamp: Date.now(),
 *   fps: 60,
 *   memory: {
 *     used: 100000,
 *     limit: 200000
 *   }
 * };
 */
interface PerformanceSample {
  timestamp: number;
  fps: number;
  memory?: {
    used: number;
    limit: number;
  };
}

/**
 * Frame callback function type
 */
type FrameCallback = (timestamp: number) => void;

/**
 * Options for performance monitoring configuration
 */
// interface PerformanceMonitoringOptions {
//   /** Enable console logging of performance metrics */
//   enableLogging?: boolean;
//   /** Sampling rate for performance monitoring (0-1) */
//   sampleRate?: number;
//   /** Custom event handlers for performance events */
//   handlers?: {};
//     onMeasure?: (name: string, duration: number) => void;
//     onError?: (error: Error) => void;
//   };
// }

/**
 * Creates a unique component ID for performance tracking
 *
 * @returns A unique component ID
 *
 */
export function _createPerformanceComponentId(): string {
  return `perf-${Math.random().toString(36).substr(2, 9)}`;
}

// Re-export debounce and throttle from common for backward compatibility
export { debounce, throttle };

/**
 * Measures the execution time of a function
 *
 * @param fn The function to measure
 *
 * @param name Name to identify the measurement in logs
 *
 * @returns A wrapped function that logs performance
 *
 */
export function measurePerformance<
  T extends (...args: unknown[]) => unknown,
  R = ReturnType<T>,
>(fn: T, name: string = "Function"): (...args: Parameters<T>) => R {
  return function (...args: Parameters<T>): R {
    const start = performance.now();
    const result = fn(...args) as R;
    const end = performance.now();
    // Log only warnings and errors as per ESLint config
    console.warn(`${name} execution time: ${end - start}ms`);
    return result;
  };
}

/**
 * Creates a function that measures FPS over a specified duration
 *
 * @param duration Duration in milliseconds to measure FPS
 *
 * @returns Promise that resolves with the measured FPS
 *
 */
export function _measureFPS(duration: number = 1000): Promise<FPS> {
  return new Promise((resolve) => {
    let frameCount = 0;
    let startTime = performance.now();

    const countFrame = (): void => {
      frameCount++;
      const currentTime = performance.now();

      if (currentTime - startTime >= duration) {
        const fps = ((frameCount * 1000) / (currentTime - startTime)) as FPS;
        resolve(fps);
      } else {
        requestAnimationFrame(countFrame);
      }
    };

    requestAnimationFrame(countFrame);
  });
}

/**
 * Track render time for a component with detailed performance metrics.
 *
 * @param startTime - High-resolution timestamp when render started
 *
 * @param componentId - Unique identifier for the component being tracked
 *
 * @param label - Optional description of the render operation
 *
 * @param logToConsole - Whether to output results to console
 *
 * @returns The render duration in milliseconds
 *
 * @example Example usage
 * ```ts
 * const start = performance.now();
 * // ... render component ...
 * const duration = trackRenderTime(start, 'MyComponent', 'Initial render');
 * ```
 *
 * @description * - Uses high-resolution timestamps
 * - Minimal overhead for timing
 * - Optional console logging
 *
 * @throws {TypeError} If startTime is not a valid number
 * @throws {Error} If componentId is empty or invalid
 */
export function trackRenderTime(
  startTime: number,
  componentId: string,
  label?: string,
  logToConsole = false,
): Milliseconds {
  if (typeof startTime !== "number" || isNaN(startTime)) {
    throw new TypeError("startTime must be a valid number");
  }

  if (!componentId || typeof componentId !== "string") {
    throw new Error("componentId must be a non-empty string");
  }

  const time = performance.now() - startTime;

  if (logToConsole) {
    console.warn(
      `[Performance] ${componentId} ${
        label ? label + " " : ""
      }Render: ${time.toFixed(2)}ms`,
    );
  }

  return time as Milliseconds;
}

/**
 * Track and measure interaction time for performance monitoring.
 *
 * Records the duration of user interactions like: clicks, gestures, and
 * form submissions to help identify slow event handlers or unresponsive UIs.
 *
 * @param _eventName - Name of the interaction event (e.g., 'click', 'drag', 'submit')
 *
 * @param _duration - Duration of the interaction in milliseconds
 *
 * @param _metadata - Optional additional context about the interaction
 *
 * @example
 * // Track a button click interaction
 * button.addEventListener('click', () => {
 *   const startTime = performance.now();
 *
 *   // Handle the click...
 *   doSomething();
 *
 *   const duration = performance.now() - startTime;
 *   trackInteraction('button_click', duration as Milliseconds, {
 *     buttonId: 'submit-button',
 *     context: 'checkout-form'
 *   });
 * });
 * @returns {void} This function doesn't return a value
 *
 */
export function trackInteraction(
  _eventName: string,
  _duration: Milliseconds,
  _metadata?: Record<string, unknown>,
): void {
  // Implementation
}

/**
 * Create a unique performance tracking ID for a component.
 *
 * @param prefix - Component name or identifier prefix
 *
 * @param suffix - Optional unique suffix
 *
 * @returns A unique tracking ID
 *
 * @example Example usage
 * ```ts
 * const _id = createPerformanceId('Slider', 'main');
 * // Returns: "Slider_main_1234";
 * ```
 */
export function createPerformanceId(prefix: string, suffix?: string): string {
  return `${prefix}${suffix ? "_" + suffix : ""}_${Date.now()}`;
}

/**
 * Initialize performance monitoring for a component.
 *
 * @param componentId - Unique identifier for the component
 *
 * @param options - Configuration options for monitoring
 *
 * @returns Cleanup function to stop monitoring
 *
 * @example Example usage
 * ```ts
 * const cleanup = initializePerformanceMonitoring('MyComponent', {
 *   enableLogging: true,
 *   sampleRate: 0.1
 * });
 * ```
 */
export function initializePerformanceMonitoring(
  componentId: string,
  options: PerformanceMonitoringOptions = {},
): () => void {
  const { enableLogging = false, sampleRate: _sampleRate = 1 } = options;

  // Setup monitoring
  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach((entry) => {
      if (enableLogging) {
        console.warn(
          `[Performance] ${componentId}: ${entry.name} - ${entry.duration}ms`,
        );
      }
      options.handlers?.onMeasure?.(entry.name, entry.duration);
    });
  });

  observer.observe({ entryTypes: ["measure"] });

  // Return cleanup function
  return (): void => {
    observer.disconnect();
  };
}

/**
 * Create a performance monitor that tracks metrics over time.
 *
 * This function sets up continuous monitoring of key performance indicators
 * such as: FPS, memory: usage, and animation smoothness. It provides regular
 * updates of these metrics through the onMetricsUpdate callback.
 *
 * @param options - Configuration options for the performance monitor
 *
 * @param options.onMetricsUpdate - Callback function that receives updated metrics
 *
 * @param options.trackMemory - Whether to track memory usage (if available in browser)
 *
 * @param options.includeWebVitals - Whether to include Web Vitals metrics
 *
 * @param options.updateInterval - Interval in milliseconds for reporting updates
 *
 * @param options.debug - Enable debug mode for additional logging
 *
 * @param options.logToConsole - Whether to log metrics to console
 *
 * @returns A cleanup function that stops monitoring when called
 *
 * @example Example usage
 * ```tsx
 * // Basic usage in a React component
 * useEffect(() => {
 *   const cleanup = createPerformanceMonitor({
 *     onMetricsUpdate: (metrics) => {
 *       console.log(`Current, FPS: ${metrics.fps}`);
 *       if(metrics.fps < 30) {
 *         console.warn('Low frame rate detected');
 *       }
 *     },
 *     updateInterval: 2000, // Update every 2 seconds
 *     trackMemory: true
 *   });
 *
 *   return cleanup; // Automatically cleaned up on unmount
 * }, []);
 *
 * // Advanced usage with analytics integration
 * const cleanup = createPerformanceMonitor({
 *   onMetricsUpdate: (metrics) => {
 *     // Send metrics to analytics when they exceed thresholds
 *     if(metrics.memoryUsage > 100_000_000) { // 100MB
 *       analytics.track('high_memory_usage', {
 *         memoryUsage: metrics.memoryUsage,
 *         fps: metrics.fps,
 *         url: window.location.href
 *       });
 *     }
 *   },
 *   trackMemory: true,
 *   debug: process.env.NODE_ENV === 'development',
 *   updateInterval: 5000
 * });
 * ```
 */
export function createPerformanceMonitor(options: {
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
  trackMemory?: boolean;
  includeWebVitals?: boolean;
  updateInterval?: number;
  debug?: boolean;
  logToConsole?: boolean;
}): () => void {
  const {
    onMetricsUpdate,
    trackMemory = true,
    includeWebVitals = false,
    updateInterval = 1000,
    debug = false,
    logToConsole = false,
  } = options;

  let intervalId: ReturnType<typeof setInterval>;
  const metrics: PerformanceMetrics = {
    fps: 0 as FPS,
    memoryUsage: 0 as ByteSize,
    transitionDuration: 0 as Milliseconds,
    gestureLatency: 0 as Milliseconds,
    renderTime: [],
    interactionTime: [],
  };

  // Track FPS
  let frameCount = 0;
  let lastTime = performance.now();

  function updateFPS(): void {
    const currentTime = performance.now();
    const elapsed = currentTime - lastTime;
    frameCount++;

    if (elapsed >= 1000) {
      metrics.fps = ((frameCount * 1000) / elapsed) as FPS;
      frameCount = 0;
      lastTime = currentTime;
    }
  }

  // Start monitoring
  function startMonitoring(): void {
    requestAnimationFrame(function measure(): void {
      updateFPS();

      if (
        trackMemory &&
        (performance as unknown as { memory?: { usedJSHeapSize: number } })
          .memory
      ) {
        metrics.memoryUsage = (
          performance as unknown as { memory: { usedJSHeapSize: number } }
        ).memory.usedJSHeapSize as ByteSize;
      }

      if (includeWebVitals) {
        // Add web vitals tracking here if needed
      }

      if (debug && logToConsole) {
        console.warn("[Performance Monitor]", metrics);
      }

      requestAnimationFrame(measure);
    });

    intervalId = setInterval(() => {
      onMetricsUpdate?.(metrics);
    }, updateInterval);
  }

  startMonitoring();

  // Return cleanup function
  return () => {
    clearInterval(intervalId);
  };
}

/**
 * Calculate summary statistics for a set of metrics
 *
 * @param values - Array of numeric values to analyze
 *
 * @returns Summary statistics for the metrics
 *
 */
export function _calculateMetricSummary(values: number[]): MetricSummary {
  if (values.length === 0)
    return {
      avg: 0,
      median: 0,
      stdDev: 0,
      p95: 0,
      min: 0,
      max: 0,
      count: 0,
    };

  return {
    avg: calculateMean(values),
    median: calculateMedian(values),
    stdDev: calculateStandardDeviation(values),
    p95: calculatePercentile(values, 95),
    min: Math.min(...values),
    max: Math.max(...values),
    count: values.length,
  };
}

/**
 * Track a performance event with metadata
 *
 * @param _eventName - Name of the event to track
 *
 * @param _duration - Duration of the event in milliseconds
 *
 * @param _metadata - Optional metadata about the event
 *
 */
export const trackEvent = (
  _eventName: string,
  _duration: number,
  _metadata?: Record<string, unknown>,
): void => {
  // Implementation
};

// Define a simple interface for the batch process function
interface _PerformanceData {
  timestamp: number;
  metric: string;
  value: number;
}

/**
 * Batch process performance data with sampling
 *
 * @param data - Array of performance data points
 *
 * @param _sampleRate - Rate at which to sample data (0-1)
 *
 */
function _batchProcess(data: _PerformanceData[], _sampleRate = 0.1): void {
  // Implementation
}

/**
 * Report a custom performance event
 *
 * @param _eventName - Name of the custom event
 *
 * @param _duration - Duration of the event in milliseconds
 *
 * @param _metadata - Optional metadata about the event
 *
 */
export function reportCustomEvent(
  _eventName: string,
  _duration: number,
  _metadata?: Record<string, unknown>,
): void {
  // Implementation
}

/**
 * Start sampling performance metrics at regular intervals
 *
 * @param callback - Function to call with each performance sample
 *
 * @param _interval - Interval between samples in milliseconds
 *
 * @returns Function to stop the performance sampling
 *
 */
export function startPerformanceSampling(
  callback: (data: PerformanceSample) => void,
  _interval = 500,
): () => void {
  // Implementation would go here
  return () => {
    // Cleanup logic
  };
}

/**
 * Set up an animation loop with requestAnimationFrame
 *
 * @param _callback - Function to call on each animation frame
 *
 * @returns {void}
 *
 */
function _animationLoop(_callback: FrameCallback): void {
  // Implementation would go here
}
