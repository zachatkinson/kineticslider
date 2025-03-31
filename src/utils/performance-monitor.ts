import { type Metric } from 'web-vitals';
import type { PerformanceMetrics, MetricSummary } from '../types/performance';

/**
 * Performance monitoring utility that tracks various performance metrics
 * and provides analysis capabilities.
 */
export class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {};
  private observers: Set<ResizeObserver | IntersectionObserver> = new Set();
  private cleanupTasks: Set<() => void> = new Set();

  /**
   * Initializes performance monitoring
   * @param options - Configuration options
   */
  constructor() {
    // Initialize metric arrays
    Object.keys(this.getThresholds()).forEach((metric) => {
      this.metrics[metric as keyof PerformanceMetrics] = [];
    });

    // Setup cleanup on window unload
    window.addEventListener('unload', () => this.cleanup());
  }

  /**
   * Get performance thresholds based on cursor rules.
   * These thresholds are used to trigger warnings when metrics exceed acceptable values.
   * 
   * @returns {Object} Object containing threshold values for each metric
   */
  private getThresholds() {
    return {
      FCP: 1800, // Google recommended
      LCP: 2500, // Google recommended
      FID: 100, // Google recommended
      CLS: 0.1, // Google recommended
      TTI: 3800, // Based on average 4G connection
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
   * Track a performance metric value and check against defined thresholds.
   * If the value exceeds the threshold, a warning is logged.
   * 
   * @param metric - Name of the metric to track
   * @param value - Numerical value of the measurement
   * @example
   * ```typescript
   * // Track render time
   * monitor.track('renderTime', performance.now() - startTime);
   * 
   * // Track memory usage
   * monitor.track('memoryUsage', performance.memory.usedJSHeapSize);
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
      // Could integrate with error tracking service here
    }
  }

  /**
   * Calculate summary statistics for a specific metric.
   * Returns null if no measurements exist for the metric.
   * 
   * @param metric - Name of the metric to summarize
   * @returns Statistical summary including average, 95th percentile, max, min, and count
   * @example
   * ```typescript
   * const fpsStats = monitor.getMetricSummary('fps');
   * if (fpsStats) {
   *   console.log(`Average FPS: ${fpsStats.avg}`);
   *   console.log(`95th percentile FPS: ${fpsStats.p95}`);
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
   * Register a cleanup task
   * @param cleanup - Cleanup function
   */
  public registerCleanup(cleanup: () => void): void {
    this.cleanupTasks.add(cleanup);
  }

  /**
   * Register an observer for cleanup
   * @param observer - Observer instance
   */
  public registerObserver(observer: ResizeObserver | IntersectionObserver): void {
    this.observers.add(observer);
  }

  /**
   * Clean up all registered resources
   */
  public cleanup(): void {
    // Clean up observers
    this.observers.forEach((observer) => observer.disconnect());
    this.observers.clear();

    // Run cleanup tasks
    this.cleanupTasks.forEach((task) => task());
    this.cleanupTasks.clear();

    // Clear metrics
    this.metrics = {};
  }

  /**
   * Track web vitals metrics
   * @param metric - Web vitals metric
   */
  public trackWebVital(metric: Metric): void {
    const metricName = metric.name.toUpperCase() as keyof PerformanceMetrics;
    if (this.metrics[metricName]) {
      this.track(metricName, metric.value);
    }
  }

  /**
   * Track frames per second over time using requestAnimationFrame.
   * FPS is calculated by counting frames over a 1-second interval.
   * Values are automatically tracked and can be accessed via getMetricSummary('fps').
   * 
   * Algorithm:
   * 1. Start a RAF loop
   * 2. Count frames within each 1-second window
   * 3. Calculate FPS as (frames * 1000) / elapsed time
   * 4. Reset counter and start new window
   */
  public trackFPS(): void {
    let lastTime = performance.now();
    let frames = 0;

    const measure = () => {
      const now = performance.now();
      frames++;

      if (now >= lastTime + 1000) {
        const fps = Math.round((frames * 1000) / (now - lastTime));
        this.track('fps', fps);
        frames = 0;
        lastTime = now;
      }

      requestAnimationFrame(measure);
    };

    requestAnimationFrame(measure);
  }

  /**
   * Track memory usage if the browser supports the memory API.
   * Measurements are taken every 10 seconds and tracked as a ratio of used/available heap size.
   * 
   * Note: This API is only available in Chromium-based browsers.
   * For other browsers, this method will have no effect.
   */
  public trackMemory(): void {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        if (memory) {
          const usage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
          this.track('memoryUsage', usage);
        }
      }, 10000);
    }
  }
} 