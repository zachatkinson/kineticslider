/**
 * Performance utilities for optimizing operations
 */

import type { FPS, ByteSize, Milliseconds } from '../types/branded';
import type { PerformanceMetrics, PerformanceMonitoringOptions } from '../types/performance';
import type { MetricSummary } from '../types/performance-shared';
import { calculateMean, calculateMedian, calculateStandardDeviation, calculatePercentile } from './math';

/**
 * Options for performance monitoring configuration
 */
// interface PerformanceMonitoringOptions {
//   /** Enable console logging of performance metrics */
//   enableLogging?: boolean;
//   /** Sampling rate for performance monitoring (0-1) */
//   sampleRate?: number;
//   /** Custom event handlers for performance events */
//   handlers?: {
//     onMeasure?: (name: string, duration: number) => void;
//     onError?: (error: Error) => void;
//   };
// }

/**
 * Creates a unique component ID for performance tracking
 * @returns A unique component ID
 */
export function createPerformanceComponentId(): string {
  return `perf-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 * 
 * @param fn The function to debounce
 * @param wait The number of milliseconds to delay
 * @returns A debounced version of the function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      fn(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttles a function to only execute once within the specified time period
 * 
 * @param fn The function to throttle
 * @param limit The time limit in milliseconds
 * @returns A throttled version of the function
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  let lastResult: ReturnType<T>;
  
  return function(...args: Parameters<T>): void {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Measures the execution time of a function
 * 
 * @param fn The function to measure
 * @param name Name to identify the measurement in logs
 * @returns A wrapped function that logs performance
 */
export function measurePerformance<T extends (...args: any[]) => any>(
  fn: T,
  name: string = 'Function'
): (...args: Parameters<T>) => ReturnType<T> {
  return function(...args: Parameters<T>): ReturnType<T> {
    const start = performance.now();
    const result = fn(...args);
    const end = performance.now();
    console.log(`${name} execution time: ${end - start}ms`);
    return result;
  };
}

/**
 * Creates a function that measures FPS over a specified duration
 * @param duration Duration in milliseconds to measure FPS
 * @returns Promise that resolves with the measured FPS
 */
export function measureFPS(duration: number = 1000): Promise<FPS> {
  return new Promise((resolve) => {
    let frameCount = 0;
    let startTime = performance.now();
    
    const countFrame = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - startTime >= duration) {
        const fps = (frameCount * 1000) / (currentTime - startTime) as FPS;
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
 * @param componentId - Unique identifier for the component being tracked
 * @param label - Optional description of the render operation
 * @param logToConsole - Whether to output results to console
 * @returns The render duration in milliseconds
 *
 * @example
 * ```ts
 * const start = performance.now();
 * // ... render component ...
 * const duration = trackRenderTime(start, 'MyComponent', 'Initial render');
 * ```
 *
 * @performance
 * - Uses high-resolution timestamps
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
  logToConsole = false
): Milliseconds {
  if (typeof startTime !== 'number' || isNaN(startTime)) {
    throw new TypeError('startTime must be a valid number');
  }

  if (!componentId || typeof componentId !== 'string') {
    throw new Error('componentId must be a non-empty string');
  }

  const time = performance.now() - startTime;
  
  if (logToConsole) {
    console.warn(
      `[Performance] ${componentId} ${
        label ? label + ' ' : ''
      }Render: ${time.toFixed(2)}ms`
    );
  }
  
  return time as Milliseconds;
}

/**
 * Track and measure interaction time for performance monitoring.
 *
 * Records the duration of user interactions like clicks, gestures, and
 * form submissions to help identify slow event handlers or unresponsive UIs.
 *
 * @param eventName - Name of the interaction event (e.g., 'click', 'drag', 'submit')
 * @param duration - Duration of the interaction in milliseconds
 * @param metadata - Optional additional context about the interaction
 *
 * @example
 * ```ts
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
 * ```
 */
export function trackInteraction(
  eventName: string,
  duration: Milliseconds,
  metadata?: Record<string, unknown>
): void {
  // Implementation
}

/**
 * Create a unique performance tracking ID for a component.
 *
 * @param prefix - Component name or identifier prefix
 * @param suffix - Optional unique suffix
 * @returns A unique tracking ID
 *
 * @example
 * ```ts
 * const id = createPerformanceId('Slider', 'main');
 * // Returns: "Slider_main_1234"
 * ```
 */
export function createPerformanceId(
  prefix: string,
  suffix?: string
): string {
  return `${prefix}${suffix ? '_' + suffix : ''}_${Date.now()}`;
}

/**
 * Initialize performance monitoring for a component.
 *
 * @param componentId - Unique identifier for the component
 * @param options - Configuration options for monitoring
 * @returns Cleanup function to stop monitoring
 *
 * @example
 * ```ts
 * const cleanup = initializePerformanceMonitoring('MyComponent', {
 *   enableLogging: true,
 *   sampleRate: 0.1
 * });
 * ```
 */
export function initializePerformanceMonitoring(
  componentId: string,
  options: PerformanceMonitoringOptions = {}
): () => void {
  const { enableLogging = false, sampleRate = 1 } = options;
  
  // Setup monitoring
  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach((entry) => {
      if (enableLogging) {
        console.log(`[Performance] ${componentId}: ${entry.name} - ${entry.duration}ms`);
      }
      options.handlers?.onMeasure?.(entry.name, entry.duration);
    });
  });
  
  observer.observe({ entryTypes: ['measure'] });
  
  // Return cleanup function
  return () => {
    observer.disconnect();
  };
}

/**
 * Create a performance monitor that tracks metrics over time.
 *
 * This function sets up continuous monitoring of key performance indicators
 * such as FPS, memory usage, and animation smoothness. It provides regular
 * updates of these metrics through the onMetricsUpdate callback.
 *
 * @param options - Configuration options for the performance monitor
 * @param options.onMetricsUpdate - Callback function that receives updated metrics
 * @param options.trackMemory - Whether to track memory usage (if available in browser)
 * @param options.includeWebVitals - Whether to include Web Vitals metrics
 * @param options.updateInterval - Interval in milliseconds for reporting updates
 * @param options.debug - Enable debug mode for additional logging
 * @param options.logToConsole - Whether to log metrics to console
 * @returns A cleanup function that stops monitoring when called
 *
 * @example
 * ```tsx
 * // Basic usage in a React component
 * useEffect(() => {
 *   const cleanup = createPerformanceMonitor({
 *     onMetricsUpdate: (metrics) => {
 *       console.log(`Current FPS: ${metrics.fps}`);
 *       if (metrics.fps < 30) {
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
 *     if (metrics.memoryUsage > 100_000_000) { // 100MB
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
    logToConsole = false
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

  function updateFPS() {
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
  function startMonitoring() {
    requestAnimationFrame(function measure() {
      updateFPS();

      if (trackMemory && (performance as any).memory) {
        metrics.memoryUsage = (performance as any).memory.usedJSHeapSize as ByteSize;
      }

      if (includeWebVitals) {
        // Add web vitals tracking here if needed
      }

      if (debug && logToConsole) {
        console.log('[Performance Monitor]', metrics);
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
 * Calculate summary statistics for performance metrics
 * @param values Array of metric values
 * @returns Statistical summary of the metrics
 */
export function calculateMetricSummary(values: number[]): MetricSummary {
  if (values.length === 0) return {
    avg: 0,
    median: 0,
    stdDev: 0,
    p95: 0,
    min: 0,
    max: 0,
    count: 0
  };

  return {
    avg: calculateMean(values),
    median: calculateMedian(values),
    stdDev: calculateStandardDeviation(values),
    p95: calculatePercentile(values, 95),
    min: Math.min(...values),
    max: Math.max(...values),
    count: values.length
  };
} 