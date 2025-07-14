/**
 * @fileoverview PerformanceMonitor for FPS and Memory Tracking
 *
 * Comprehensive performance monitoring system with:
 * 1. Real-time FPS tracking and analysis
 * 2. Memory usage monitoring and leak detection
 * 3. Performance history and trend analysis
 * 4. Configurable warning and critical thresholds
 *
 * @version 1.0.0
 */

import type { IPerformanceMonitor, PerformanceMetrics } from '../core/types';
import { RENDERING_PERFORMANCE, PERFORMANCE } from '../core/constants';

/**
 * Performance sample for tracking over time
 */
interface PerformanceSample {
  timestamp: number;
  fps: number;
  memoryUsed: number;
  memoryTotal: number;
  renderTime: number;
  activeSprites: number;
}

/**
 * Performance thresholds configuration
 */
interface PerformanceThresholds {
  fps: {
    warning: number;
    critical: number;
  };
  memory: {
    warning: number; // percentage (0-100)
    critical: number; // percentage (0-100)
  };
  renderTime: {
    warning: number; // milliseconds
    critical: number; // milliseconds
  };
}

/**
 * Performance trend analysis
 */
interface PerformanceTrends {
  fps: {
    trend: 'improving' | 'stable' | 'degrading';
    change: number; // percentage change
  };
  memory: {
    trend: 'improving' | 'stable' | 'degrading';
    change: number; // percentage change
  };
  overall: 'excellent' | 'good' | 'fair' | 'poor';
}

/**
 * PerformanceMonitor for FPS and memory tracking
 */
export class PerformanceMonitor implements IPerformanceMonitor {
  private isRunning = false;
  private samples: PerformanceSample[] = [];
  private maxSamples = RENDERING_PERFORMANCE.SAMPLE_SIZE;

  // Performance tracking
  private frameCount = 0;
  private lastFrameTime = 0;
  private lastUpdateTime = 0;
  private currentMetrics: PerformanceMetrics;

  // Monitoring intervals
  private fpsInterval?: number;
  private memoryInterval?: number;

  // Thresholds
  private thresholds: PerformanceThresholds;

  // Event callbacks
  private warningCallbacks: Array<(metric: string, value: number) => void> = [];
  private criticalCallbacks: Array<(metric: string, value: number) => void> =
    [];

  constructor() {
    this.currentMetrics = this.createDefaultMetrics();
    this.thresholds = this.createDefaultThresholds();
  }

  /**
   * Start performance monitoring
   */
  start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.frameCount = 0;
    this.lastFrameTime = performance.now();
    this.lastUpdateTime = performance.now();

    // Start FPS monitoring
    this.startFpsMonitoring();

    // Start memory monitoring
    this.startMemoryMonitoring();
  }

  /**
   * Stop performance monitoring
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    // Clear intervals
    if (this.fpsInterval) {
      clearInterval(this.fpsInterval);
      this.fpsInterval = undefined;
    }

    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
      this.memoryInterval = undefined;
    }
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    this.updateMetrics();
    return { ...this.currentMetrics };
  }

  /**
   * Get performance history for specified duration
   */
  getHistory(duration = 60000): PerformanceMetrics[] {
    const cutoffTime = Date.now() - duration;
    const filteredSamples = this.samples.filter(
      (sample) => sample.timestamp >= cutoffTime
    );

    // Convert samples to PerformanceMetrics format
    return filteredSamples.map((sample) => ({
      fps: {
        current: sample.fps,
        average: sample.fps,
        min: sample.fps,
        max: sample.fps,
      },
      memory: {
        used: sample.memoryUsed,
        total: sample.memoryTotal,
        percentage: (sample.memoryUsed / sample.memoryTotal) * 100,
        peak: sample.memoryUsed,
      },
      rendering: {
        drawCalls: 0,
        triangles: 0,
        textures: sample.activeSprites,
        shaders: 0,
      },
      loading: {
        totalAssets: 0,
        loadedAssets: 0,
        failedAssets: 0,
        averageLoadTime: sample.renderTime,
      },
    }));
  }

  /**
   * Get performance trends analysis
   */
  getTrends(): PerformanceTrends {
    if (this.samples.length < 2) {
      return {
        fps: { trend: 'stable', change: 0 },
        memory: { trend: 'stable', change: 0 },
        overall: 'good',
      };
    }

    // Analyze recent vs older samples
    const recentSamples = this.samples.slice(-10);
    const olderSamples = this.samples.slice(-20, -10);

    const recentFps = this.averageFps(recentSamples);
    const olderFps = this.averageFps(olderSamples);
    const fpsChange =
      olderFps > 0 ? ((recentFps - olderFps) / olderFps) * 100 : 0;

    const recentMemory = this.averageMemoryUsage(recentSamples);
    const olderMemory = this.averageMemoryUsage(olderSamples);
    const memoryChange =
      olderMemory > 0 ? ((recentMemory - olderMemory) / olderMemory) * 100 : 0;

    return {
      fps: {
        trend:
          fpsChange > 5 ? 'improving' : fpsChange < -5 ? 'degrading' : 'stable',
        change: fpsChange,
      },
      memory: {
        trend:
          memoryChange < -5
            ? 'improving'
            : memoryChange > 5
              ? 'degrading'
              : 'stable',
        change: memoryChange,
      },
      overall: this.calculateOverallGrade(recentFps, recentMemory),
    };
  }

  /**
   * Reset performance counters
   */
  reset(): void {
    this.samples = [];
    this.frameCount = 0;
    this.currentMetrics = this.createDefaultMetrics();
  }

  /**
   * Set performance warning thresholds
   */
  setThresholds(
    warning: Partial<PerformanceMetrics>,
    critical: Partial<PerformanceMetrics>
  ): void {
    if (warning.fps?.min !== undefined) {
      this.thresholds.fps.warning = warning.fps.min;
    }
    if (critical.fps?.min !== undefined) {
      this.thresholds.fps.critical = critical.fps.min;
    }
    if (warning.memory?.percentage !== undefined) {
      this.thresholds.memory.warning = warning.memory.percentage;
    }
    if (critical.memory?.percentage !== undefined) {
      this.thresholds.memory.critical = critical.memory.percentage;
    }
  }

  /**
   * Add warning callback
   */
  onWarning(callback: (metric: string, value: number) => void): void {
    this.warningCallbacks.push(callback);
  }

  /**
   * Add critical callback
   */
  onCritical(callback: (metric: string, value: number) => void): void {
    this.criticalCallbacks.push(callback);
  }

  /**
   * Record frame for FPS calculation
   */
  recordFrame(): void {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    this.frameCount++;

    // Calculate frame time
    if (this.lastFrameTime > 0) {
      const frameTime = currentTime - this.lastFrameTime;
      this.currentMetrics.rendering.drawCalls++;

      // Check render time threshold
      if (frameTime > this.thresholds.renderTime.critical) {
        this.triggerCritical('renderTime', frameTime);
      } else if (frameTime > this.thresholds.renderTime.warning) {
        this.triggerWarning('renderTime', frameTime);
      }
    }

    this.lastFrameTime = currentTime;
  }

  /**
   * Dispose of performance monitor
   */
  dispose(): void {
    this.stop();
    this.samples = [];
    this.warningCallbacks = [];
    this.criticalCallbacks = [];
  }

  // =============================================================================
  // Private Methods
  // =============================================================================

  /**
   * Create default performance metrics
   */
  private createDefaultMetrics(): PerformanceMetrics {
    return {
      fps: {
        current: 0,
        average: 0,
        min: 0,
        max: 0,
      },
      memory: {
        used: 0,
        total: 0,
        percentage: 0,
        peak: 0,
      },
      rendering: {
        drawCalls: 0,
        triangles: 0,
        textures: 0,
        shaders: 0,
      },
      loading: {
        totalAssets: 0,
        loadedAssets: 0,
        failedAssets: 0,
        averageLoadTime: 0,
      },
    };
  }

  /**
   * Create default performance thresholds
   */
  private createDefaultThresholds(): PerformanceThresholds {
    return {
      fps: {
        warning: RENDERING_PERFORMANCE.WARNING_THRESHOLDS.FPS_LOW,
        critical: RENDERING_PERFORMANCE.CRITICAL_THRESHOLDS.FPS_CRITICAL,
      },
      memory: {
        warning: RENDERING_PERFORMANCE.WARNING_THRESHOLDS.MEMORY_HIGH * 100,
        critical: RENDERING_PERFORMANCE.CRITICAL_THRESHOLDS.MEMORY_CRITICAL * 100,
      },
      renderTime: {
        warning: PERFORMANCE.FRAME_BUDGET_MS,
        critical: PERFORMANCE.FRAME_BUDGET_MS * 2,
      },
    };
  }

  /**
   * Start FPS monitoring
   */
  private startFpsMonitoring(): void {
    this.fpsInterval = window.setInterval(() => {
      this.updateFpsMetrics();
    }, RENDERING_PERFORMANCE.FPS_MONITOR_INTERVAL);
  }

  /**
   * Start memory monitoring
   */
  private startMemoryMonitoring(): void {
    this.memoryInterval = window.setInterval(() => {
      this.updateMemoryMetrics();
    }, RENDERING_PERFORMANCE.MEMORY_CHECK_INTERVAL);
  }

  /**
   * Update FPS metrics
   */
  private updateFpsMetrics(): void {
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastUpdateTime;

    if (deltaTime > 0) {
      const fps = (this.frameCount * 1000) / deltaTime;

      this.currentMetrics.fps.current = fps;

      // Update min/max
      if (
        this.currentMetrics.fps.min === 0 ||
        fps < this.currentMetrics.fps.min
      ) {
        this.currentMetrics.fps.min = fps;
      }
      if (fps > this.currentMetrics.fps.max) {
        this.currentMetrics.fps.max = fps;
      }

      // Check thresholds
      if (fps < this.thresholds.fps.critical) {
        this.triggerCritical('fps', fps);
      } else if (fps < this.thresholds.fps.warning) {
        this.triggerWarning('fps', fps);
      }

      // Reset counters
      this.frameCount = 0;
      this.lastUpdateTime = currentTime;
    }
  }

  /**
   * Update memory metrics
   */
  private updateMemoryMetrics(): void {
    if (
      'memory' in performance &&
      (
        performance as Performance & {
          memory?: { usedJSHeapSize: number; totalJSHeapSize: number };
        }
      ).memory
    ) {
      const memory = (
        performance as Performance & {
          memory: { usedJSHeapSize: number; totalJSHeapSize: number };
        }
      ).memory;

      this.currentMetrics.memory.used = memory.usedJSHeapSize;
      this.currentMetrics.memory.total = memory.totalJSHeapSize;
      this.currentMetrics.memory.percentage =
        (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100;

      // Update peak
      if (memory.usedJSHeapSize > this.currentMetrics.memory.peak) {
        this.currentMetrics.memory.peak = memory.usedJSHeapSize;
      }

      // Check thresholds
      if (
        this.currentMetrics.memory.percentage > this.thresholds.memory.critical
      ) {
        this.triggerCritical('memory', this.currentMetrics.memory.percentage);
      } else if (
        this.currentMetrics.memory.percentage > this.thresholds.memory.warning
      ) {
        this.triggerWarning('memory', this.currentMetrics.memory.percentage);
      }
    }
  }

  /**
   * Update all metrics and add sample
   */
  private updateMetrics(): void {
    // Update average FPS from samples
    if (this.samples.length > 0) {
      this.currentMetrics.fps.average = this.averageFps(this.samples);
    }

    // Add current sample
    const sample: PerformanceSample = {
      timestamp: Date.now(),
      fps: this.currentMetrics.fps.current,
      memoryUsed: this.currentMetrics.memory.used,
      memoryTotal: this.currentMetrics.memory.total,
      renderTime:
        this.lastFrameTime > 0 ? performance.now() - this.lastFrameTime : 0,
      activeSprites: this.currentMetrics.rendering.textures,
    };

    this.samples.push(sample);

    // Limit sample history
    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }
  }

  /**
   * Calculate average FPS from samples
   */
  private averageFps(samples: PerformanceSample[]): number {
    if (samples.length === 0) return 0;
    const sum = samples.reduce((total, sample) => total + sample.fps, 0);
    return sum / samples.length;
  }

  /**
   * Calculate average memory usage from samples
   */
  private averageMemoryUsage(samples: PerformanceSample[]): number {
    if (samples.length === 0) return 0;
    const sum = samples.reduce(
      (total, sample) => total + (sample.memoryUsed / sample.memoryTotal) * 100,
      0
    );
    return sum / samples.length;
  }

  /**
   * Calculate overall performance grade
   */
  private calculateOverallGrade(
    fps: number,
    memoryUsage: number
  ): 'excellent' | 'good' | 'fair' | 'poor' {
    if (fps >= 55 && memoryUsage < 50) return 'excellent';
    if (fps >= 45 && memoryUsage < 70) return 'good';
    if (fps >= 30 && memoryUsage < 85) return 'fair';
    return 'poor';
  }

  /**
   * Trigger warning callbacks
   */
  private triggerWarning(metric: string, value: number): void {
    this.warningCallbacks.forEach((callback) => {
      try {
        callback(metric, value);
      } catch {
        // Silently handle callback errors
      }
    });
  }

  /**
   * Trigger critical callbacks
   */
  private triggerCritical(metric: string, value: number): void {
    this.criticalCallbacks.forEach((callback) => {
      try {
        callback(metric, value);
      } catch {
        // Silently handle callback errors
      }
    });
  }
}
