/**
 * @fileoverview Performance Monitor for Phase 2.3
 *
 * Comprehensive performance monitoring system for GSAP animations.
 * Tracks frame rates, memory usage, animation execution times, and
 * provides performance optimization insights.
 *
 * @version 2.3.0
 */

import { SimpleEventEmitter } from '../core/event-emitter';
import { serviceContainer } from '../core/container';
import { PERFORMANCE_THRESHOLDS, ANIMATION_EVENTS } from '../core/constants';

/**
 * Performance metrics interface
 */
export interface PerformanceMetrics {
  /** Frame rate statistics */
  fps: {
    current: number;
    average: number;
    min: number;
    max: number;
  };
  /** Memory usage statistics */
  memory: {
    used: number;
    total: number;
    percentage: number;
    peak: number;
  };
  /** Animation execution statistics */
  animations: {
    active: number;
    completed: number;
    failed: number;
    averageExecutionTime: number;
  };
  /** System performance indicators */
  system: {
    cpuUsage: number;
    loadTime: number;
    responseTime: number;
  };
}

/**
 * Performance alert interface
 */
export interface PerformanceAlert {
  /** Alert severity level */
  level: 'warning' | 'critical';
  /** Alert message */
  message: string;
  /** Metric that triggered the alert */
  metric: string;
  /** Current value */
  currentValue: number;
  /** Threshold value */
  threshold: number;
  /** Timestamp of alert */
  timestamp: number;
}

/**
 * Performance monitoring system
 */
export class PerformanceMonitor extends SimpleEventEmitter {
  private isRunning = false;
  private startTime = 0;
  private frameCount = 0;
  private lastFrameTime = 0;
  private fpsHistory: number[] = [];
  private metricsHistory: PerformanceMetrics[] = [];

  // Performance counters
  private metrics: PerformanceMetrics = {
    fps: { current: 0, average: 0, min: 60, max: 0 },
    memory: { used: 0, total: 0, percentage: 0, peak: 0 },
    animations: { active: 0, completed: 0, failed: 0, averageExecutionTime: 0 },
    system: { cpuUsage: 0, loadTime: 0, responseTime: 0 },
  };

  // Monitoring intervals
  private fpsInterval: NodeJS.Timeout | null = null;
  private memoryInterval: NodeJS.Timeout | null = null;
  private alertInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.setupEventListeners();
  }

  // =============================================================================
  // 🎯 Public API - Performance Monitoring
  // =============================================================================

  /**
   * Start performance monitoring
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.startTime = performance.now();
    this.lastFrameTime = this.startTime;

    // Start FPS monitoring
    this.startFPSMonitoring();

    // Start memory monitoring
    this.startMemoryMonitoring();

    // Start performance alerts
    this.startAlertSystem();

    this.emit('monitor:started');
  }

  /**
   * Stop performance monitoring
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;

    // Clear all intervals
    if (this.fpsInterval) {
      clearInterval(this.fpsInterval);
      this.fpsInterval = null;
    }

    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
      this.memoryInterval = null;
    }

    if (this.alertInterval) {
      clearInterval(this.alertInterval);
      this.alertInterval = null;
    }

    this.emit('monitor:stopped');
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get performance history
   */
  getHistory(limit: number = 100): PerformanceMetrics[] {
    return this.metricsHistory.slice(-limit);
  }

  /**
   * Record animation start
   */
  recordAnimationStart(): void {
    this.metrics.animations.active++;
  }

  /**
   * Record animation completion
   */
  recordAnimationComplete(executionTime: number): void {
    this.metrics.animations.active = Math.max(
      0,
      this.metrics.animations.active - 1
    );
    this.metrics.animations.completed++;

    // Update average execution time
    const totalCompleted = this.metrics.animations.completed;
    this.metrics.animations.averageExecutionTime =
      (this.metrics.animations.averageExecutionTime * (totalCompleted - 1) +
        executionTime) /
      totalCompleted;
  }

  /**
   * Record animation failure
   */
  recordAnimationFailed(): void {
    this.metrics.animations.active = Math.max(
      0,
      this.metrics.animations.active - 1
    );
    this.metrics.animations.failed++;
  }

  /**
   * Get performance grade (A+ to F)
   */
  getPerformanceGrade(): string {
    const score = this.calculatePerformanceScore();

    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'B+';
    if (score >= 80) return 'B';
    if (score >= 75) return 'C+';
    if (score >= 70) return 'C';
    if (score >= 65) return 'D+';
    if (score >= 60) return 'D';
    return 'F';
  }

  // =============================================================================
  // 🔧 Private Implementation - Monitoring Systems
  // =============================================================================

  private setupEventListeners(): void {
    // Listen to animation events for performance tracking
    this.on('animation:started', (...args: unknown[]) => {
      const data = args[0] as { id?: string } | undefined;
      if (data?.id) {
        this.recordAnimationStart();
      }
    });

    this.on('animation:completed', (...args: unknown[]) => {
      const data = args[0] as
        | { id?: string; executionTime?: number }
        | undefined;
      if (data?.id && typeof data.executionTime === 'number') {
        this.recordAnimationComplete(data.executionTime);
      }
    });

    this.on(ANIMATION_EVENTS.ANIMATION_ERROR, () => {
      this.recordAnimationFailed();
    });
  }

  private startFPSMonitoring(): void {
    this.fpsInterval = setInterval(() => {
      this.updateFPSMetrics();
    }, 1000); // Update every second

    // Start frame counting
    this.requestFrameUpdate();
  }

  private requestFrameUpdate(): void {
    if (!this.isRunning) return;

    requestAnimationFrame((timestamp) => {
      this.frameCount++;

      // Calculate current FPS
      const timeDelta = timestamp - this.lastFrameTime;
      if (timeDelta >= 1000) {
        const currentFPS = Math.round((this.frameCount * 1000) / timeDelta);
        this.updateFPSData(currentFPS);

        this.frameCount = 0;
        this.lastFrameTime = timestamp;
      }

      this.requestFrameUpdate();
    });
  }

  private updateFPSData(fps: number): void {
    this.metrics.fps.current = fps;
    this.fpsHistory.push(fps);

    // Keep only last 60 readings (1 minute)
    if (this.fpsHistory.length > 60) {
      this.fpsHistory.shift();
    }

    // Update statistics
    this.metrics.fps.min = Math.min(this.metrics.fps.min, fps);
    this.metrics.fps.max = Math.max(this.metrics.fps.max, fps);
    this.metrics.fps.average = Math.round(
      this.fpsHistory.reduce((sum, f) => sum + f, 0) / this.fpsHistory.length
    );
  }

  private updateFPSMetrics(): void {
    // This method is called by the interval, actual FPS calculation
    // happens in requestFrameUpdate to be more accurate
  }

  private startMemoryMonitoring(): void {
    this.memoryInterval = setInterval(() => {
      this.updateMemoryMetrics();
    }, 5000); // Update every 5 seconds
  }

  protected updateMemoryMetrics(): void {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const memoryInfo = performance.memory as {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
      };

      this.metrics.memory.used = memoryInfo.usedJSHeapSize;
      this.metrics.memory.total = memoryInfo.totalJSHeapSize;
      this.metrics.memory.percentage =
        (this.metrics.memory.used / this.metrics.memory.total) * 100;
      this.metrics.memory.peak = Math.max(
        this.metrics.memory.peak,
        this.metrics.memory.used
      );
    }
  }

  private startAlertSystem(): void {
    this.alertInterval = setInterval(() => {
      this.checkPerformanceAlerts();
    }, 2000); // Check every 2 seconds
  }

  private checkPerformanceAlerts(): void {
    const alerts: PerformanceAlert[] = [];

    // Check FPS alerts
    if (this.metrics.fps.current < PERFORMANCE_THRESHOLDS.MIN_FPS) {
      alerts.push({
        level: 'critical',
        message: 'Frame rate below minimum threshold',
        metric: 'fps',
        currentValue: this.metrics.fps.current,
        threshold: PERFORMANCE_THRESHOLDS.MIN_FPS,
        timestamp: Date.now(),
      });
    }

    // Check memory alerts
    const memoryWarningThreshold =
      PERFORMANCE_THRESHOLDS.MEMORY_WARNING_THRESHOLD;
    const memoryCriticalThreshold =
      PERFORMANCE_THRESHOLDS.MEMORY_CRITICAL_THRESHOLD;

    if (this.metrics.memory.used > memoryCriticalThreshold) {
      alerts.push({
        level: 'critical',
        message: 'Memory usage critical',
        metric: 'memory',
        currentValue: this.metrics.memory.used,
        threshold: memoryCriticalThreshold,
        timestamp: Date.now(),
      });
    } else if (this.metrics.memory.used > memoryWarningThreshold) {
      alerts.push({
        level: 'warning',
        message: 'Memory usage high',
        metric: 'memory',
        currentValue: this.metrics.memory.used,
        threshold: memoryWarningThreshold,
        timestamp: Date.now(),
      });
    }

    // Check animation execution time alerts
    if (
      this.metrics.animations.averageExecutionTime >
      PERFORMANCE_THRESHOLDS.EXECUTION_TIME_WARNING
    ) {
      alerts.push({
        level: 'warning',
        message: 'Animation execution time high',
        metric: 'executionTime',
        currentValue: this.metrics.animations.averageExecutionTime,
        threshold: PERFORMANCE_THRESHOLDS.EXECUTION_TIME_WARNING,
        timestamp: Date.now(),
      });
    }

    // Emit alerts
    alerts.forEach((alert) => {
      this.emit('performance:alert', alert);
    });

    // Store metrics snapshot
    this.storeMetricsSnapshot();
  }

  private storeMetricsSnapshot(): void {
    this.metricsHistory.push({ ...this.metrics });

    // Keep only last 1000 snapshots
    if (this.metricsHistory.length > 1000) {
      this.metricsHistory.shift();
    }
  }

  private calculatePerformanceScore(): number {
    let score = 100;

    // FPS score (40% weight)
    const fpsScore = Math.min(
      100,
      (this.metrics.fps.average / PERFORMANCE_THRESHOLDS.TARGET_FPS) * 100
    );
    score = score * 0.4 + fpsScore * 0.4;

    // Memory score (30% weight)
    const memoryScore = Math.max(0, 100 - this.metrics.memory.percentage);
    score = score * 0.7 + memoryScore * 0.3;

    // Animation performance score (30% weight)
    const animationScore =
      this.metrics.animations.failed === 0
        ? 100
        : Math.max(
            0,
            100 -
              (this.metrics.animations.failed /
                Math.max(1, this.metrics.animations.completed)) *
                100
          );
    score = score * 0.7 + animationScore * 0.3;

    return Math.round(score);
  }

  /**
   * Cleanup and dispose
   */
  dispose(): void {
    this.stop();
    this.removeAllListeners();
    this.fpsHistory = [];
    this.metricsHistory = [];
  }
}

// Register with service container
serviceContainer.register('PerformanceMonitor', () => new PerformanceMonitor());
