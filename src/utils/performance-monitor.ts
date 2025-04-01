import { type Metric } from 'web-vitals';
import type { PerformanceMetrics, MetricSummary } from '../types/performance';

/**
 * Performance monitoring utility that tracks various performance metrics
 * and provides analysis capabilities. Implements standardized performance
 * monitoring patterns and resource management.
 */
export class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {};
  private observers: Set<ResizeObserver | IntersectionObserver> = new Set();
  private cleanupTasks: Set<() => void> = new Set();
  private resourcePools: Map<string, ResourcePool<any>> = new Map();
  private workerPool: WorkerPool;

  /**
   * Initializes performance monitoring with standardized thresholds
   * and resource management.
   */
  constructor() {
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
      this.reportThresholdViolation(metric, value, threshold);
    }

    // Cleanup old metrics to prevent memory growth
    this.cleanupOldMetrics(metric);
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

    // Release resource pools
    this.resourcePools.forEach(pool => pool.releaseAll());
    this.resourcePools.clear();

    // Terminate worker pool
    this.workerPool.terminate();

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
   * Track memory usage if the browser supports the memory API.
   * Measurements are taken every 10 seconds and tracked as a ratio of used/available heap size.
   * 
   * Note: This API is only available in Chromium-based browsers.
   * For other browsers, this method will have no effect.
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
   * Report threshold violations for monitoring
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
   * Clean up old metrics to prevent unbounded memory growth
   */
  private cleanupOldMetrics(metric: keyof PerformanceMetrics): void {
    const MAX_METRICS = 1000;
    const values = this.metrics[metric];
    if (values && values.length > MAX_METRICS) {
      this.metrics[metric] = values.slice(-MAX_METRICS);
    }
  }
}

/**
 * Resource pool for reusing objects
 */
class ResourcePool<T> {
  private resources: T[] = [];
  private inUse = new Set<T>();

  constructor(
    private factory: () => T,
    private reset: (resource: T) => void,
    private initialSize: number
  ) {
    for (let i = 0; i < initialSize; i++) {
      this.resources.push(factory());
    }
  }

  acquire(): T {
    let resource = this.resources.pop();
    if (!resource) {
      resource = this.factory();
    }
    this.inUse.add(resource);
    return resource;
  }

  release(resource: T): void {
    if (this.inUse.has(resource)) {
      this.reset(resource);
      this.inUse.delete(resource);
      this.resources.push(resource);
    }
  }

  releaseAll(): void {
    this.inUse.forEach(resource => this.release(resource));
  }
}

/**
 * Worker pool for offloading heavy computations
 */
class WorkerPool {
  private workers: Worker[] = [];
  private taskQueue: Array<{
    task: () => void;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];
  private availableWorkers: Worker[] = [];

  constructor(size: number) {
    for (let i = 0; i < size; i++) {
      const worker = new Worker(new URL('../workers/pool-worker.ts', import.meta.url));
      this.workers.push(worker);
      this.availableWorkers.push(worker);
      this.setupWorker(worker);
    }
  }

  private setupWorker(worker: Worker): void {
    worker.onmessage = (event) => {
      const { result, error } = event.data;
      const task = this.taskQueue.shift();
      if (task) {
        if (error) {
          task.reject(error);
        } else {
          task.resolve(result);
        }
      }
      this.availableWorkers.push(worker);
      this.processQueue();
    };
  }

  private processQueue(): void {
    while (this.taskQueue.length > 0 && this.availableWorkers.length > 0) {
      const task = this.taskQueue[0];
      const worker = this.availableWorkers.pop();
      if (worker && task) {
        this.taskQueue.shift();
        worker.postMessage({ task: task.toString() });
      }
    }
  }

  execute<T>(task: () => T): Promise<T> {
    return new Promise((resolve, reject) => {
      this.taskQueue.push({ task, resolve, reject });
      this.processQueue();
    });
  }

  terminate(): void {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.availableWorkers = [];
    this.taskQueue = [];
  }
} 