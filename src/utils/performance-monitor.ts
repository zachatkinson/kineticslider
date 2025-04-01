import { type Metric } from 'web-vitals';
import type { PerformanceMetrics } from '../types/performance';
import type { MetricSummary } from '../types/performance-shared';
import type { ResourcePoolKey } from '../types/performance-resources';
import { ResourcePool, WorkerPool } from '../services/resource-management';

/**
 * Monitors performance metrics during application runtime.
 * 
 * The PerformanceMonitor class provides utilities for tracking, analyzing, and reporting
 * various performance metrics including FPS, memory usage, and custom timing measurements.
 * 
 * @example
 * ```ts
 * // Create a new performance monitor
 * const monitor = new PerformanceMonitor({
 *   onUpdate: (metrics) => {
 *     console.log('Updated metrics:', metrics);
 *   }
 * });
 * 
 * // Start monitoring FPS and memory usage
 * const stopFPS = monitor.trackFPS();
 * const stopMemory = monitor.trackMemory();
 * 
 * // Track custom metrics
 * monitor.track('renderTime', 12.5);
 * 
 * // Get a summary of collected metrics
 * const fpsSummary = monitor.getMetricSummary('fps');
 * console.log(`Average FPS: ${fpsSummary?.avg || 0}`);
 * 
 * // Later, clean up all resources
 * monitor.cleanup();
 * 
 * // Or stop individual tracking
 * stopFPS();
 * stopMemory();
 * ```
 */
export class PerformanceMonitor {
  /**
   * @internal
   * Storage for collected metrics
   */
  private metrics: Record<string, number[]> = {};
  
  /**
   * @internal
   * Callback executed when metrics are updated
   */
  private onUpdate?: (metrics: Record<string, number[]>) => void;
  
  /**
   * @internal
   * Flag to track if FPS monitoring is active
   */
  private isFPSMonitoring = false;
  
  /**
   * @internal
   * Flag to track if memory monitoring is active
   */
  private isMemoryMonitoring = false;
  
  /**
   * @internal
   * Interval ID for periodic monitoring
   */
  private monitoringIntervalId?: ReturnType<typeof setInterval>;
  
  /**
   * @internal
   * Animation frame ID for FPS monitoring
   */
  private animFrameId?: number;
  
  /**
   * @internal
   * Stores the count of frames for FPS calculation
   */
  private frameCount = 0;
  
  /**
   * @internal
   * Timestamp of last FPS measurement
   */
  private lastFPSUpdateTime = 0;
  
  /**
   * Set of observers used for performance monitoring
   * @private
   */
  private observers: Set<ResizeObserver | IntersectionObserver> = new Set();
  
  /**
   * Set of cleanup functions to execute when monitoring ends
   * @private
   */
  private cleanupTasks: Set<() => void> = new Set();
  
  /**
   * Map of resource pools by type for efficient object reuse
   * @private
   */
  private resourcePools: Map<ResourcePoolKey, ResourcePool<any>> = new Map();
  
  /**
   * Worker pool for offloading heavy computations
   * @private
   */
  private workerPool: WorkerPool;

  /**
   * Creates a new performance monitor.
   * 
   * @param options - Configuration options
   * @param options.onUpdate - Optional callback invoked when metrics are updated
   */
  constructor(options: { onUpdate?: (metrics: Record<string, number[]>) => void } = {}) {
    this.onUpdate = options.onUpdate;

    // Initialize metric arrays
    Object.keys(this.getThresholds()).forEach((metric) => {
      this.metrics[metric as keyof PerformanceMetrics] = [];
    });

    // Initialize worker pool
    this.workerPool = new WorkerPool(
      Math.max(navigator.hardwareConcurrency - 1, 1)
    );

    // Setup cleanup on window unload
    if (typeof window !== 'undefined') {
      window.addEventListener('unload', () => this.cleanup());
    }

    // Initialize resource pools
    this.initializeResourcePools();
  }

  /**
   * Get performance thresholds based on cursor rules.
   * These thresholds are used to trigger warnings when metrics exceed acceptable values.
   * 
   * @returns {Object} Object containing threshold values for each metric
   * @private
   */
  private getThresholds() {
    return {
      FCP: 1800, // First Contentful Paint
      LCP: 2500, // Largest Contentful Paint
      FID: 100, // First Input Delay
      CLS: 0.1, // Cumulative Layout Shift
      TTI: 3800, // Time to Interactive
      TBT: 200, // Total Blocking Time
      fps: 60, // Standard refresh rate
      memoryUsage: 0.8, // 80% of heap size
      cpuUsage: 0.7, // 70% of CPU
      renderTime: 1000, // 1s max render time
      transitionTime: 300, // smooth animation threshold
      resizeTime: 50, // responsive resize threshold
      cleanupMemory: 1024 * 1024, // 1MB
      interactionTime: 100, // 100ms interaction time
      averageFrameTime: 16, // ~60fps frame time
      droppedFrames: 5, // max 5 dropped frames
      gestureProcessingTime: 50 // 50ms gesture processing
    } as const;
  }

  /**
   * Initialize resource pools for common operations
   * Creates and configures pools for DOM elements and canvas contexts
   * 
   * @private
   */
  private initializeResourcePools() {
    // Pool for DOM elements
    this.resourcePools.set('dom', new ResourcePool(
      () => document.createElement('div'),
      (el) => {
        el.textContent = '';
        el.className = '';
        el.removeAttribute('style');
      },
      10
    ));

    // Pool for canvas contexts
    this.resourcePools.set('canvas', new ResourcePool(
      () => document.createElement('canvas').getContext('2d'),
      (ctx) => {
        ctx.canvas.width = 0;
        ctx.canvas.height = 0;
        ctx.clearRect(0, 0, 0, 0);
      },
      5
    ));
  }

  /**
   * Track a performance metric value and check against defined thresholds.
   * 
   * This method records the value of a specified metric and compares it against
   * predefined thresholds. If the value exceeds the threshold, a warning is logged
   * and a threshold violation is reported.
   * 
   * @param metric - Name of the metric to track
   * @param value - Numerical value of the measurement
   * 
   * @example
   * ```ts
   * // Track component render time
   * function MyComponent() {
   *   const renderStart = performance.now();
   *   
   *   // Component logic...
   *   
   *   useEffect(() => {
   *     const renderTime = performance.now() - renderStart;
   *     monitor.track('renderTime', renderTime);
   *   }, []);
   *   
   *   return <div>My Component</div>;
   * }
   * ```
   */
  public track(metric: keyof PerformanceMetrics, value: number): void {
    if (!this.metrics[metric]) {
      this.metrics[metric] = [];
    }
    this.metrics[metric]?.push(value);

    // Check against thresholds
    const threshold = this.getThresholds()[metric];
    if (threshold && value > threshold) {
      console.warn(`Performance threshold exceeded for ${metric}: ${value}`);
      this.reportThresholdViolation(metric, value, threshold);
    }

    // Cleanup old metrics to prevent memory growth
    this.cleanupOldMetrics(metric);
  }

  /**
   * Calculate summary statistics for a specific metric.
   * 
   * Processes all collected values for a given metric and returns statistical
   * information including average, percentiles, minimum and maximum values.
   * 
   * @param metric - Name of the metric to summarize
   * @returns Statistical summary or null if no data is available
   * 
   * @example
   * ```ts
   * // Get statistics for FPS measurements
   * const fpsStats = monitor.getMetricSummary('fps');
   * 
   * if (fpsStats) {
   *   console.log(`Average FPS: ${fpsStats.avg.toFixed(1)}`);
   *   console.log(`Min FPS: ${fpsStats.min}`);
   *   console.log(`Max FPS: ${fpsStats.max}`);
   *   console.log(`95th percentile: ${fpsStats.p95}`);
   *   console.log(`Sample count: ${fpsStats.count}`);
   * }
   * 
   * // Check if render time is within acceptable range
   * const renderStats = monitor.getMetricSummary('renderTime');
   * if (renderStats && renderStats.avg > 100) {
   *   console.warn('Render performance is degraded');
   * }
   * ```
   */
  public getMetricSummary(metric: keyof PerformanceMetrics): MetricSummary | null {
    const values = this.metrics[metric];
    if (!values || values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    return {
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      p95: sorted[Math.floor(values.length * 0.95)],
      max: Math.max(...values),
      min: Math.min(...values),
      count: values.length,
    };
  }

  /**
   * Register a cleanup task that will be executed when monitor.cleanup() is called.
   * 
   * Use this method to register custom cleanup functions that should be executed
   * when the performance monitor is being cleaned up.
   * 
   * @param cleanup - Cleanup function to register
   * 
   * @example
   * ```ts
   * // Register a custom event listener cleanup
   * const listener = () => monitor.track('scrollEvent', performance.now());
   * window.addEventListener('scroll', listener);
   * 
   * // Make sure the listener is removed during cleanup
   * monitor.registerCleanup(() => {
   *   window.removeEventListener('scroll', listener);
   * });
   * ```
   */
  public registerCleanup(cleanup: () => void): void {
    this.cleanupTasks.add(cleanup);
  }

  /**
   * Register an observer for automatic cleanup when monitor.cleanup() is called.
   * 
   * This method keeps track of observers (like ResizeObserver or IntersectionObserver)
   * and ensures they are properly disconnected during cleanup.
   * 
   * @param observer - Observer instance to register
   * 
   * @example
   * ```ts
   * // Create and register a resize observer
   * const resizeObserver = new ResizeObserver(entries => {
   *   entries.forEach(entry => {
   *     const width = entry.contentRect.width;
   *     const height = entry.contentRect.height;
   *     monitor.track('elementResize', width * height);
   *   });
   * });
   * 
   * // Start observing an element
   * resizeObserver.observe(document.getElementById('container'));
   * 
   * // Register for automatic cleanup
   * monitor.registerObserver(resizeObserver);
   * ```
   */
  public registerObserver(observer: ResizeObserver | IntersectionObserver): void {
    this.observers.add(observer);
  }

  /**
   * Clean up all registered resources and stop all monitoring activities.
   * 
   * This method performs a complete cleanup by:
   * - Disconnecting all registered observers
   * - Running all registered cleanup tasks
   * - Releasing all resources from resource pools
   * - Terminating the worker pool
   * - Clearing all collected metrics
   * 
   * @example
   * ```ts
   * // When component unmounts or monitoring is no longer needed
   * useEffect(() => {
   *   const monitor = new PerformanceMonitor();
   *   monitor.trackFPS();
   *   monitor.trackMemory();
   *   
   *   return () => {
   *     monitor.cleanup();
   *   };
   * }, []);
   * ```
   */
  public cleanup(): void {
    // Clean up observers
    this.observers.forEach((observer) => observer.disconnect());
    this.observers.clear();

    // Run cleanup tasks
    this.cleanupTasks.forEach((task) => task());
    this.cleanupTasks.clear();

    // Release resource pools
    this.resourcePools.forEach(pool => pool.releaseAll());
    this.resourcePools.clear();

    // Terminate worker pool
    this.workerPool.terminate();

    // Clear metrics
    this.metrics = {};
  }

  /**
   * Track web vitals metrics from the web-vitals library
   * 
   * @param {Metric} metric - Web vitals metric object
   * @example
   * ```typescript
   * import { onFCP, onLCP } from 'web-vitals';
   * 
   * onFCP((metric) => {
   *   monitor.trackWebVital(metric);
   * });
   * ```
   * @public
   */
  public trackWebVital(metric: Metric): void {
    const metricName = metric.name.toUpperCase() as keyof PerformanceMetrics;
    if (this.metrics[metricName]) {
      this.track(metricName, metric.value);
    }
  }

  /**
   * Start monitoring frames per second (FPS).
   * 
   * This method uses requestAnimationFrame to calculate the current FPS
   * and track it over time. It returns a function that can be called to
   * stop the FPS monitoring.
   * 
   * @returns A function that stops FPS monitoring when called
   * 
   * @example
   * ```ts
   * // Start FPS monitoring
   * const stopFPSMonitoring = monitor.trackFPS();
   * 
   * // Later, stop monitoring if needed
   * document.getElementById('stop-btn').addEventListener('click', () => {
   *   stopFPSMonitoring();
   *   
   *   // Get the final FPS summary
   *   const fpsSummary = monitor.getMetricSummary('fps');
   *   console.log(`Average FPS: ${fpsSummary?.avg || 0}`);
   * });
   * ```
   */
  public trackFPS(): () => void {
    let lastTime = performance.now();
    let frames = 0;
    let rafId: number;

    const measure = () => {
      const now = performance.now();
      frames++;

      if (now >= lastTime + 1000) {
        const fps = Math.round((frames * 1000) / (now - lastTime));
        this.track('fps', fps);
        frames = 0;
        lastTime = now;
      }

      rafId = requestAnimationFrame(measure);
    };

    rafId = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(rafId);
  }

  /**
   * Start monitoring memory usage if available in the browser.
   * 
   * This method tracks memory usage metrics like heap size over time.
   * It's particularly useful for detecting memory leaks or excessive
   * memory consumption.
   * 
   * Note: Memory API is only available in Chrome and some Chromium-based browsers.
   * 
   * @returns A function that stops memory monitoring when called
   * 
   * @example
   * ```ts
   * // Start memory monitoring with a conditional check
   * let stopMemoryMonitoring = () => {};
   * if (performance && (performance as any).memory) {
   *   stopMemoryMonitoring = monitor.trackMemory();
   *   console.log('Memory monitoring started');
   * } else {
   *   console.log('Memory monitoring not supported in this browser');
   * }
   * 
   * // Stop monitoring when needed
   * stopMemoryMonitoring();
   * ```
   */
  public trackMemory(): () => void {
    let intervalId: number;

    if ('memory' in performance) {
      intervalId = window.setInterval(() => {
        const memory = (performance as any).memory;
        if (memory) {
          const usage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
          this.track('memoryUsage', usage);
        }
      }, 10000);
    }

    return () => clearInterval(intervalId);
  }

  /**
   * Report threshold violation to monitoring service if available
   * 
   * @param {keyof PerformanceMetrics} metric - The metric that violated the threshold
   * @param {number} value - The measured value
   * @param {number} threshold - The threshold that was exceeded
   * @private
   */
  private reportThresholdViolation(
    metric: keyof PerformanceMetrics,
    value: number,
    threshold: number
  ): void {
    const violation = {
      metric,
      value,
      threshold,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };

    // Send to monitoring service if available
    if (window.monitoringService) {
      window.monitoringService.reportViolation(violation);
    }
  }

  /**
   * Remove old metrics to prevent excessive memory usage
   * 
   * @param {keyof PerformanceMetrics} metric - The metric to clean up
   * @private
   */
  private cleanupOldMetrics(metric: keyof PerformanceMetrics): void {
    const MAX_METRICS = 1000;
    const values = this.metrics[metric];
    if (values && values.length > MAX_METRICS) {
      this.metrics[metric] = values.slice(-MAX_METRICS);
    }
  }
} 