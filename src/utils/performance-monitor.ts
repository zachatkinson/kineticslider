/**
 * Performance monitoring utilities
 * Provides tools for measuring and tracking performance metrics
 */

import type { PerformanceResult as _PerformanceResult, BenchmarkResult as _BenchmarkResult, MetricType as _MetricType, ImplementationType as _ImplementationType } from "../types/performance-testing";
import type { MetricSummary as _MetricSummary } from "../types/performance-shared";

/**
 * Performance monitor class for tracking performance metrics
 *
 * @example
 * ```typescript
 * // Create a new performance monitor
 * const monitor = new PerformanceMonitor();
 *
 * // Start tracking FPS
 * const stopFPS = monitor.trackFPS();
 *
 * // Start tracking memory usage
 * const stopMemory = monitor.trackMemory();
 *
 * // Stop tracking after 10 seconds
 * setTimeout(() => {
 *   stopFPS();
 *   stopMemory();
 *
 *   // Get metrics
 *   const metrics = monitor.getMetrics();
 *   console.log(metrics);
 *
 *   // Get benchmarks
 *   const benchmarks = monitor.getBenchmarks();
 *   console.log(benchmarks);
 * }, 10000);
 * ```
 */
export class PerformanceMonitor {
  private metrics: Array<{
    name: string;
    value: number;
    timestamp: Date;
    duration: number;
    metricType: number;
    implementation: number;
    unit: string;
  }> = [];

  private cleanupTasks: Array<() => void> = [];
  private fpsInterval: number | null = null;
  private memoryInterval: number | null = null;
  private rafId: number | null = null;
  private observers: Set<ResizeObserver | IntersectionObserver> = new Set();

  /**
   * Track the current frames per second
   *
   * @returns A function to stop tracking
   *
   */
  trackFPS(): () => void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }

    let lastTime = performance.now();
    let frames = 0;

    const measure = (time: number): void => {
      frames++;

      if (time - lastTime >= 1000) {
        const fps = Math.round((frames * 1000) / (time - lastTime));
        this.recordMetric({
          name: "FPS",
          value: fps,
          timestamp: new Date(),
          duration: time - lastTime,
          metricType: 0,
          implementation: 0,
          unit: "fps",
        });

        frames = 0;
        lastTime = time;
      }

      this.rafId = requestAnimationFrame(measure);
    };

    this.rafId = requestAnimationFrame(measure);

    const stopTracking = (): void => {
      if (this.rafId !== null) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
    };

    this.addCleanupTask(stopTracking);
    return stopTracking;
  }

  /**
   * Track memory usage over time
   *
   * @returns A function to stop tracking
   *
   */
  trackMemory(): () => void {
    if (this.memoryInterval !== null) {
      clearInterval(this.memoryInterval);
    }

    // Check if the memory API is available
    if (!performance.memory) {
      console.warn("Memory API not available - memory tracking disabled");
      return () => {}; // Return noop function
    }

    const trackMemoryUsage = (): void => {
      try {
        const memory = performance.memory;

        if (memory) {
          const usedHeapSize = memory.usedJSHeapSize;
          const totalHeapSize = memory.totalJSHeapSize;
          const usagePercentage = (usedHeapSize / totalHeapSize) * 100;

          this.recordMetric({
            name: "Memory Usage",
            value: usagePercentage,
            timestamp: new Date(),
            duration: 0,
            metricType: 1,
            implementation: 0,
            unit: "%",
          });

          this.recordMetric({
            name: "Memory Used",
            value: usedHeapSize / (1024 * 1024), // Convert to MB
            timestamp: new Date(),
            duration: 0,
            metricType: 1,
            implementation: 0,
            unit: "MB",
          });
        }
      } catch (error) {
        console.error("Error tracking memory:", error);
      }
    };

    // Track immediately
    trackMemoryUsage();

    // Then track every second
    this.memoryInterval = window.setInterval(trackMemoryUsage, 1000);

    const stopTracking = (): void => {
      if (this.memoryInterval !== null) {
        clearInterval(this.memoryInterval);
        this.memoryInterval = null;
      }
    };

    this.addCleanupTask(stopTracking);
    return stopTracking;
  }

  /**
   * Record a performance metric
   *
   * @param metric
   *
   * @param metric.name
   *
   * @param metric.value
   *
   * @param metric.timestamp
   *
   * @param metric.duration
   *
   * @param metric.metricType
   *
   * @param metric.implementation
   *
   * @param metric.unit
   *
   */
  recordMetric(metric: {
    name: string;
    value: number;
    timestamp: Date;
    duration: number;
    metricType: number;
    implementation: number;
    unit: string;
  }): void {
    this.metrics.push(metric);

    // Limit the number of stored metrics to prevent memory bloat
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  /**
   * Get all recorded metrics
   *
   * @returns Array of recorded metrics
   *
   */
  getMetrics(): Array<{
    name: string;
    value: number;
    timestamp: Date;
    duration: number;
    metricType: number;
    implementation: number;
    unit: string;
  }> {
    return this.metrics;
  }

  /**
   * Get benchmark summaries calculated from metrics
   *
   * @returns Array of benchmark summaries
   *
   */
  getBenchmarks(): Array<{
    name: string;
    summary: {
      min: number;
      max: number;
      avg: number;
      p95?: number;
      count: number;
    };
  }> {
    const benchmarks: Record<
      string,
      {
        values: number[];
        name: string;
      }
    > = {};

    // Group metrics by name
    for (const metric of this.metrics) {
      if (!benchmarks[metric.name]) {
        benchmarks[metric.name] = {
          values: [],
          name: metric.name,
        };
      }

      benchmarks[metric.name].values.push(metric.value);
    }

    // Calculate summaries
    return Object.values(benchmarks).map((benchmark) => {
      const values = benchmark.values;
      const min = Math.min(...values);
      const max = Math.max(...values);
      const sum = values.reduce((a, b) => a + b, 0);
      const avg = sum / values.length;

      // Calculate p95 if there are enough values
      const p95 =
        values.length > 10
          ? values.sort((a, b) => a - b)[Math.floor(values.length * 0.95)]
          : undefined;

      return {
        name: benchmark.name,
        summary: {
          min,
          max,
          avg,
          p95,
          count: values.length,
        },
      };
    });
  }

  /**
   * Add a task to be executed during cleanup
   *
   * @param task
   *
   */
  addCleanupTask(task: () => void): void {
    this.cleanupTasks.push(task);
  }

  /**
   * Clean up all resources and stop tracking
   */
  cleanup(): void {
    // Execute all cleanup tasks
    for (const task of this.cleanupTasks) {
      try {
        task();
      } catch (error) {
        console.error("Error during cleanup task:", error);
      }
    }
    this.cleanupTasks = [];

    // Disconnect all observers
    for (const observer of this.observers) {
      try {
        observer.disconnect();
      } catch (error) {
        console.error("Error disconnecting observer:", error);
      }
    }
    this.observers.clear();

    // Clear intervals and animation frames
    if (this.fpsInterval !== null) {
      clearInterval(this.fpsInterval);
      this.fpsInterval = null;
    }
    if (this.memoryInterval !== null) {
      clearInterval(this.memoryInterval);
      this.memoryInterval = null;
    }
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    // Clear metrics
    this.metrics = [];
  }
}
