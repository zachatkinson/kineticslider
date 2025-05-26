import { ErrorSeverity, ErrorType } from "../../types/error";
import type { WorkerPoolStats, ErrorDistribution } from "./types";

const MAX_HISTORY_SIZE = 100;
const MINUTE = 60 * 1000;

/**
 * Worker pool statistics utilities
 *
 * @example
 * ```ts
 * import { getWorkerPoolStats } from './statistics';
 * const stats = getWorkerPoolStats();
 * console.log(stats);
 * ```
 */
export class StatisticsTracker {
  private executionTimes: number[] = [];
  private completionTimestamps: number[] = [];
  private queueSizeHistory: number[] = [];
  private taskStartTimes: number[] = [];
  private completedTasks = 0;
  private failedTasks = 0;
  private peakQueueSize = 0;
  private lastResetTime = Date.now();

  /**
   * Track the start of a task
   *
   * @param timestamp - The start time of the task
   *
   * @returns void
   *
   */
  public trackTaskStart(timestamp: number): void {
    this.taskStartTimes.push(timestamp);
    this.limitArray(this.taskStartTimes);
  }

  /**
   * Track the completion of a task
   *
   * @param executionTime - The execution time of the task
   *
   * @returns void
   *
   */
  public trackTaskCompletion(executionTime: number): void {
    this.completedTasks++;
    this.executionTimes.push(executionTime);
    this.completionTimestamps.push(Date.now());

    this.limitArray(this.executionTimes);
    this.limitArray(this.completionTimestamps);
  }

  /**
   * Track a failed task
   *
   * @returns void
   *
   */
  public trackTaskFailure(): void {
    this.failedTasks++;
  }

  /**
   * Track the current queue size
   *
   * @param size - The current queue size
   *
   * @returns void
   *
   */
  public trackQueueSize(size: number): void {
    this.queueSizeHistory.push(size);
    this.peakQueueSize = Math.max(this.peakQueueSize, size);
    this.limitArray(this.queueSizeHistory);
  }

  private limitArray<T>(arr: T[]): void {
    if (arr.length > MAX_HISTORY_SIZE) {
      arr.splice(0, arr.length - MAX_HISTORY_SIZE);
    }
  }

  private initializeErrorTypeDistribution(): Record<ErrorType, number> {
    return Object.values(ErrorType).reduce(
      (acc, type) => ({ ...acc, [type]: 0 }),
      {} as Record<ErrorType, number>,
    );
  }

  private initializeErrorSeverityCounts(): Record<ErrorSeverity, number> {
    return Object.values(ErrorSeverity).reduce(
      (acc, severity) => ({ ...acc, [severity]: 0 }),
      {} as Record<ErrorSeverity, number>,
    );
  }

  private initializeErrorTimeDistribution(): ErrorDistribution {
    return {
      daily: {},
      weekly: {},
      monthly: {},
      rateChangePercent: 0,
      trend: "stable",
    };
  }

  /**
   * Calculate statistics for the worker pool
   *
   * @param totalWorkers
   *
   * @param availableWorkers
   *
   * @param queueSize
   *
   * @param maxWorkers
   *
   * @returns {WorkerPoolStats} The calculated statistics
   *
   */
  public calculateStats(
    totalWorkers: number,
    availableWorkers: number,
    queueSize: number,
    maxWorkers: number,
  ): WorkerPoolStats {
    const now = Date.now();
    const busyWorkers = totalWorkers - availableWorkers;
    const utilization =
      totalWorkers > 0 ? (busyWorkers / totalWorkers) * 100 : 0;

    const avgExecutionTime = this.calculateAverage(this.executionTimes);
    const throughput = this.calculateThroughput(now);

    // Calculate pending tasks as sum of queued and in-progress tasks
    const pendingTasks = queueSize + busyWorkers;

    return {
      queueSize,
      activeWorkers: totalWorkers,
      totalWorkers,
      availableWorkers,
      busyWorkers,
      pendingTasks,
      maxWorkers,
      utilization,
      completedTasks: this.completedTasks,
      failedTasks: this.failedTasks,
      avgExecutionTime,
      throughput,
      errorStats: {
        errorDistribution: this.initializeErrorTypeDistribution(),
        severityCounts: this.initializeErrorSeverityCounts(),
        dailyTrends: {},
        averageProcessingTime: avgExecutionTime,
        topErrorPatterns: [],
        errorTimeDistribution: this.initializeErrorTimeDistribution(),
      },
    };
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return Math.round(sum / values.length);
  }

  private calculateThroughput(now: number): number {
    const oneMinuteAgo = now - MINUTE;
    const recentCompletions = this.completionTimestamps.filter(
      (timestamp) => timestamp > oneMinuteAgo,
    );
    return recentCompletions.length / 60; // Tasks per second
  }

  /**
   * Reset the statistics tracker to its initial state
   *
   * @returns void
   *
   */
  public reset(): void {
    this.executionTimes = [];
    this.completionTimestamps = [];
    this.queueSizeHistory = [];
    this.taskStartTimes = [];
    this.completedTasks = 0;
    this.failedTasks = 0;
    this.peakQueueSize = 0;
    this.lastResetTime = Date.now();
  }

  /**
   * Get all tracked metrics
   *
   * @returns {object} An object containing all tracked metrics
   *
   */
  public getMetrics(): {
    executionTimes: number[];
    completionTimestamps: number[];
    queueSizeHistory: number[];
    taskStartTimes: number[];
    completedTasks: number;
    failedTasks: number;
    peakQueueSize: number;
    lastResetTime: number;
  } {
    return {
      executionTimes: [...this.executionTimes],
      completionTimestamps: [...this.completionTimestamps],
      queueSizeHistory: [...this.queueSizeHistory],
      taskStartTimes: [...this.taskStartTimes],
      completedTasks: this.completedTasks,
      failedTasks: this.failedTasks,
      peakQueueSize: this.peakQueueSize,
      lastResetTime: this.lastResetTime,
    };
  }
}

/**
 * Get statistics for the worker pool
 *
 * @returns {Record<string, number>} An object containing worker pool statistics
 *
 * @example
 * ```ts
 * const stats = getWorkerPoolStats();
 * console.log(stats);
 * ```
 */
export function getWorkerPoolStats(): Record<string, number> {
  return {};
}

/**
 * Get the most recent statistics snapshot
 *
 * @returns {Record<string, number> | null} The latest statistics or null
 *
 */
export function getLastStatsSnapshot(): Record<string, number> | null {
  return null;
}
