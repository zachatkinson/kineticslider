/**
 * Performance monitoring utilities
 * Provides tools for measuring and tracking performance metrics
 */

import type { PerformanceResult, BenchmarkResult } from '../types/performance-testing';
import { MetricType, ImplementationType } from '../types/performance-testing';
import type { MetricSummary } from '../types/performance-shared';

/**
 * Performance monitor class for tracking performance metrics
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
  private observers: Set<ResizeObserver | IntersectionObserver>;
  private cleanupTasks: Set<() => void>;
  private metrics: PerformanceResult[];
  private isTracking: boolean;

  /**
   * Creates a new performance monitor instance
   */
  constructor() {
    this.observers = new Set();
    this.cleanupTasks = new Set();
    this.metrics = [];
    this.isTracking = false;
  }

  /**
   * Starts tracking FPS (frames per second)
   * @returns A function to stop tracking
   */
  trackFPS(): () => void {
    let frames = 0;
    let lastTime = performance.now();
    let rafId: number | null = null;
    
    const measure = (): void => {
      frames++;
      const now = performance.now();
      const elapsed = now - lastTime;
      
      if (elapsed >= 1000) {
        const fps = Math.round((frames * 1000) / elapsed);
        this.recordMetric({
          name: 'FPS',
          duration: elapsed,
          timestamp: new Date(),
          metricType: MetricType.RENDER_TIME,
          implementation: ImplementationType.NEW,
          value: fps,
          unit: 'fps'
        });
        
        frames = 0;
        lastTime = now;
      }
      
      rafId = requestAnimationFrame(measure);
    };
    
    // Start measuring
    rafId = requestAnimationFrame(measure);
    this.isTracking = true;
    
    // Return a function to stop tracking
    const stopTracking = (): void => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      this.isTracking = false;
    };
    
    this.addCleanupTask(stopTracking);
    return stopTracking;
  }

  /**
   * Starts tracking memory usage
   * @returns A function to stop tracking
   */
  trackMemory(): () => void {
    if (!performance || !('memory' in performance)) {
      console.warn('Memory API not available in this browser');
      return () => {}; // No-op if not supported
    }
    
    let intervalId: number | null = null;
    
    const measure = (): void => {
      // @ts-ignore - memory is non-standard but available in Chrome
      const memory = performance.memory;
      
      if (memory) {
        this.recordMetric({
          name: 'Memory Usage',
          duration: 0,
          timestamp: new Date(),
          metricType: MetricType.MEMORY_USAGE,
          implementation: ImplementationType.NEW,
          memoryUsage: memory.usedJSHeapSize / (1024 * 1024),
          value: memory.usedJSHeapSize / (1024 * 1024),
          unit: 'MB'
        });
      }
    };
    
    // Start measuring every 1s
    intervalId = window.setInterval(measure, 1000);
    this.isTracking = true;
    
    // Return a function to stop tracking
    const stopTracking = (): void => {
      if (intervalId !== null) {
        window.clearInterval(intervalId);
        intervalId = null;
      }
      this.isTracking = false;
    };
    
    this.addCleanupTask(stopTracking);
    return stopTracking;
  }

  /**
   * Records a performance metric
   * @param metric The metric to record
   */
  private recordMetric(metric: PerformanceResult): void {
    this.metrics.push(metric);
    
    // Limit the number of stored metrics to avoid memory issues
    if (this.metrics.length > 1000) {
      this.metrics.shift();
    }
  }

  /**
   * Returns all recorded metrics
   * @returns Array of performance metrics
   */
  getMetrics(): PerformanceResult[] {
    return [...this.metrics];
  }

  /**
   * Gets benchmark results based on recorded metrics
   * @returns Benchmark results
   */
  getBenchmarks(): BenchmarkResult[] {
    // Group metrics by name
    const metricsByName: Record<string, PerformanceResult[]> = {};
    
    for (const metric of this.metrics) {
      if (!metricsByName[metric.name]) {
        metricsByName[metric.name] = [];
      }
      
      metricsByName[metric.name].push(metric);
    }
    
    // Calculate summary for each metric group
    return Object.entries(metricsByName).map(([name, metrics]) => {
      const values = metrics.map(m => m.value || 0);
      
      // Calculate summary statistics
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);
      
      // Sort values for percentile calculations
      const sortedValues = [...values].sort((a, b) => a - b);
      const medianIdx = Math.floor(sortedValues.length / 2);
      const median = sortedValues.length % 2 === 0
        ? (sortedValues[medianIdx - 1] + sortedValues[medianIdx]) / 2
        : sortedValues[medianIdx];
      
      const p95Idx = Math.floor(sortedValues.length * 0.95);
      const p95 = sortedValues[p95Idx];
      
      // Calculate standard deviation
      const squaredDiffs = values.map(val => Math.pow(val - avg, 2));
      const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
      const stdDev = Math.sqrt(variance);
      
      const summary: MetricSummary = {
        avg,
        min,
        max,
        median,
        p95,
        stdDev,
        count: values.length
      };
      
      return {
        name,
        summary,
        timestamp: new Date()
      };
    });
  }

  /**
   * Add a cleanup task to be executed when cleanup() is called
   * @param task Function to execute during cleanup
   */
  addCleanupTask(task: () => void): void {
    this.cleanupTasks.add(task);
  }

  /**
   * Cleanup all observers and registered tasks
   */
  cleanup(): void {
    // Disconnect all observers
    this.observers.forEach(observer => {
      if (observer && typeof observer.disconnect === 'function') {
        observer.disconnect();
      }
    });
    
    // Execute all cleanup tasks
    this.cleanupTasks.forEach(task => {
      try {
        task();
      } catch (error) {
        console.error('Error executing cleanup task:', error);
      }
    });
    
    // Clear collections
    this.observers.clear();
    this.cleanupTasks.clear();
    this.isTracking = false;
  }
} 