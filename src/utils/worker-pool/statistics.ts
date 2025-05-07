import { ErrorSeverity, ErrorType } from '../../types/error';
import type { WorkerPoolStats, ErrorDistribution } from './types';

const MAX_HISTORY_SIZE = 100;
const MINUTE = 60 * 1000;

export class StatisticsTracker {
  private executionTimes: number[] = [];
  private completionTimestamps: number[] = [];
  private queueSizeHistory: number[] = [];
  private taskStartTimes: number[] = [];
  private completedTasks = 0;
  private failedTasks = 0;
  private peakQueueSize = 0;
  private lastResetTime = Date.now();

  public trackTaskStart(timestamp: number): void {
    this.taskStartTimes.push(timestamp);
    this.limitArray(this.taskStartTimes);
  }

  public trackTaskCompletion(executionTime: number): void {
    this.completedTasks++;
    this.executionTimes.push(executionTime);
    this.completionTimestamps.push(Date.now());
    
    this.limitArray(this.executionTimes);
    this.limitArray(this.completionTimestamps);
  }

  public trackTaskFailure(): void {
    this.failedTasks++;
  }

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
      {} as Record<ErrorType, number>
    );
  }

  private initializeErrorSeverityCounts(): Record<ErrorSeverity, number> {
    return Object.values(ErrorSeverity).reduce(
      (acc, severity) => ({ ...acc, [severity]: 0 }),
      {} as Record<ErrorSeverity, number>
    );
  }

  private initializeErrorTimeDistribution(): ErrorDistribution {
    return {
      daily: {},
      weekly: {},
      monthly: {},
      rateChangePercent: 0,
      trend: 'stable'
    };
  }

  public calculateStats(
    totalWorkers: number,
    availableWorkers: number,
    queueSize: number,
    maxWorkers: number
  ): WorkerPoolStats {
    const now = Date.now();
    const busyWorkers = totalWorkers - availableWorkers;
    const utilization = totalWorkers > 0 ? (busyWorkers / totalWorkers) * 100 : 0;

    const avgExecutionTime = this.calculateAverage(this.executionTimes);
    const throughput = this.calculateThroughput(now);

    return {
      queueSize,
      activeWorkers: totalWorkers,
      totalWorkers,
      availableWorkers,
      busyWorkers,
      pendingTasks: queueSize,
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
        errorTimeDistribution: this.initializeErrorTimeDistribution()
      }
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
      timestamp => timestamp > oneMinuteAgo
    );
    return recentCompletions.length / 60; // Tasks per second
  }

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

  public getMetrics() {
    return {
      executionTimes: [...this.executionTimes],
      completionTimestamps: [...this.completionTimestamps],
      queueSizeHistory: [...this.queueSizeHistory],
      taskStartTimes: [...this.taskStartTimes],
      completedTasks: this.completedTasks,
      failedTasks: this.failedTasks,
      peakQueueSize: this.peakQueueSize,
      lastResetTime: this.lastResetTime
    };
  }
} 