import { ErrorSeverity, ErrorType } from "../../types/error";
import type { WorkerPoolError, ErrorDistribution } from "./types";

const MAX_ERROR_HISTORY = 100;
const MAX_ERROR_PATTERNS = 50;

/**
 * Error handling utilities for worker pool
 *
 * @example
 * ```ts
 * import { handleWorkerError } from './error-handling';
 * try {
 *   // ...
 * } catch (error) {
 *   handleWorkerError(error);
 * }
 * ```
 */

/**
 * Tracks and analyzes errors in the worker pool.
 *
 * @example
 * ```ts
 * const tracker = new ErrorTracker();
 * tracker.trackError(workerError);
 * const stats = tracker.getErrorStats();
 * ```
 */
export class ErrorTracker {
  private lastErrors: WorkerPoolError[] = [];
  private errorTypeDistribution: Record<ErrorType, number>;
  private errorSeverityCounts: Record<ErrorSeverity, number>;
  private errorStackPatterns = new Map<string, number>();
  private errorTimeDistribution: ErrorDistribution = {
    daily: {},
    weekly: {},
    monthly: {},
    rateChangePercent: 0,
    trend: "stable",
  };

  /**
   * Creates a new ErrorTracker instance
   */
  constructor() {
    this.errorTypeDistribution = this.initializeErrorCounts(ErrorType);
    this.errorSeverityCounts = this.initializeErrorCounts(ErrorSeverity);
  }

  private initializeErrorCounts<T extends string>(
    enumType: Record<string, T>,
  ): Record<T, number> {
    return Object.values(enumType).reduce(
      (acc, value) => ({ ...acc, [value]: 0 }),
      {} as Record<T, number>,
    );
  }

  /**
   * Track a new error in the error tracker
   *
   * @param error - The error to track
   *
   * @returns void
   *
   */
  public trackError(error: WorkerPoolError): void {
    // Update error counts
    this.errorTypeDistribution[error.type]++;
    this.errorSeverityCounts[error.severity]++;

    // Add to error history with size limit
    this.lastErrors.unshift(error);
    if (this.lastErrors.length > MAX_ERROR_HISTORY) {
      this.lastErrors.pop();
    }

    // Track error pattern
    const pattern = this.extractErrorPattern(error.stackTrace);
    this.errorStackPatterns.set(
      pattern,
      (this.errorStackPatterns.get(pattern) || 0) + 1,
    );

    // Cleanup old patterns if needed
    if (this.errorStackPatterns.size > MAX_ERROR_PATTERNS) {
      const entries = Array.from(this.errorStackPatterns.entries());
      entries.sort((a, b) => b[1] - a[1]);
      this.errorStackPatterns = new Map(entries.slice(0, MAX_ERROR_PATTERNS));
    }

    // Update time distribution
    this.updateTimeDistribution(error);
  }

  private extractErrorPattern(stack: string): string {
    const lines = stack.split("\n");
    return lines[0]?.trim() || "unknown";
  }

  private updateTimeDistribution(error: WorkerPoolError): void {
    const date = new Date(error.timestamp);
    const dateKey = this.formatDate(date);

    this.errorTimeDistribution.daily[dateKey] =
      (this.errorTimeDistribution.daily[dateKey] || 0) + 1;

    // Cleanup old entries
    this.cleanupTimeDistribution();
  }

  private formatDate(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  }

  private cleanupTimeDistribution(): void {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    Object.keys(this.errorTimeDistribution.daily).forEach((dateKey) => {
      const entryDate = new Date(dateKey);
      if (entryDate < thirtyDaysAgo) {
        delete this.errorTimeDistribution.daily[dateKey];
      }
    });
  }

  /**
   * Get the top error patterns
   *
   * @param limit - The maximum number of patterns to return
   *
   * @returns Array of pattern/count objects
   *
   */
  public getTopErrorPatterns(limit = 5): Array<{ pattern: string; count: number }> {
    return Array.from(this.errorStackPatterns.entries())
      .map(([pattern, count]) => ({ pattern, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Get error statistics summary
   *
   * @returns An object with error stats
   *
   */
  public getErrorStats(): {
    errorTypeDistribution: Record<ErrorType, number>;
    errorSeverityCounts: Record<ErrorSeverity, number>;
    errorTimeDistribution: ErrorDistribution;
    recentErrors: WorkerPoolError[];
    topPatterns: Array<{ pattern: string; count: number }>;
  } {
    return {
      errorTypeDistribution: { ...this.errorTypeDistribution },
      errorSeverityCounts: { ...this.errorSeverityCounts },
      errorTimeDistribution: { ...this.errorTimeDistribution },
      recentErrors: [...this.lastErrors],
      topPatterns: this.getTopErrorPatterns(),
    };
  }

  /**
   * Reset the error tracker to its initial state
   *
   * @returns void
   *
   */
  public reset(): void {
    this.lastErrors = [];
    this.errorTypeDistribution = this.initializeErrorCounts(ErrorType);
    this.errorSeverityCounts = this.initializeErrorCounts(ErrorSeverity);
    this.errorStackPatterns.clear();
    this.errorTimeDistribution = {
      daily: {},
      weekly: {},
      monthly: {},
      rateChangePercent: 0,
      trend: "stable",
    };
  }
}

/**
 * Handles errors from worker pool operations
 *
 * @param error - The error to handle
 *
 * @returns The processed error
 *
 * @example
 * ```ts
 * try {
 *   // ...
 * } catch (error) {
 *   handleWorkerError(error);
 * }
 * ```
 */
export function handleWorkerError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

/**
 * Returns a summary of worker errors
 *
 * @returns An object summarizing errors
 *
 */
export function getWorkerErrorSummary(): Record<string, number> {
  return {};
}

/**
 * Returns the most recent worker error
 *
 * @returns The most recent error or null
 *
 */
export function getLastWorkerError(): Error | null {
  return null;
}
