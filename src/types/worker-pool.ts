/**
 * Worker pool type definitions and interfaces
 *
 * @module WorkerPool
 * @version 1.0.0
 */

import type { ErrorType, ErrorSeverity } from "./error";

/**
 * Configuration options for worker pool
 *
 * @example
 * ```ts
 * const options: WorkerPoolOptions = {
 *   maxWorkers: 4,
 *   timeout: 30000,
 *   retries: 3,
 *   errorHandler: (error, context) => console.error('Worker error:', error)
 * };
 * ```
 */
export interface WorkerPoolOptions {
  maxWorkers?: number;
  timeout?: number;
  retries?: number;
  workerScript?: string;
  errorHandler?: (error: Error, context: { taskId?: string; operation?: string }) => void;
}

/**
 * Task to be executed by a worker
 *
 * @example
 * ```ts
 * const task: WorkerTask<string, number> = {
 *   id: 'task-1',
 *   data: 'process this',
 *   timeout: 5000
 * };
 * ```
 */
export interface WorkerTask<TInput = unknown, TOutput = unknown> {
  id: string;
  data: TInput;
  timeout?: number;
  task: (data: TInput) => TOutput | Promise<TOutput>;
  void: unknown;
}

/**
 * Statistics for the worker pool
 *
 * @example
 * ```ts
 * const stats: WorkerPoolStats = {
 *   totalWorkers: 4,
 *   activeWorkers: 2,
 *   queuedTasks: 5,
 *   completedTasks: 100,
 *   failedTasks: 2
 * };
 * ```
 */
export interface WorkerPoolStats {
  totalWorkers: number;
  activeWorkers: number;
  queuedTasks: number;
  completedTasks: number;
  failedTasks: number;
}

/**
 * Statistics for individual workers
 *
 * @example
 * ```ts
 * const workerStats: WorkerStats = {
 *   id: 'worker-1',
 *   status: 'busy',
 *   tasksProcessed: 25,
 *   lastActive: Date.now(),
 *   errors: 1
 * };
 * ```
 */
export interface WorkerStats {
  id: string;
  status: "available" | "busy";
  tasksProcessed: number;
  lastActive: number;
  errors: number;
}

/**
 * Error distribution statistics over time periods
 *
 * @example
 * ```ts
 * const distribution: ErrorDistribution = {
 *   daily: { '2024-01-01': 5, '2024-01-02': 3 },
 *   weekly: { '2024-W01': 8 },
 *   monthly: { '2024-01': 8 },
 *   rateChangePercent: -20,
 *   trend: 'decreasing'
 * };
 * ```
 */
export interface ErrorDistribution {
  daily: Record<string, number>;
  weekly: Record<string, number>;
  monthly: Record<string, number>;
  rateChangePercent: number;
  trend: "increasing" | "decreasing" | "stable";
}

/**
 * Additional details for worker pool errors
 *
 * @example
 * ```ts
 * const errorDetails: WorkerPoolErrorDetails = {
 *   errorTime: Date.now(),
 *   workerId: 'worker-1',
 *   taskId: 'task-123',
 *   taskData: { input: 'data' },
 *   timeout: 30000
 * };
 * ```
 */
export interface WorkerPoolErrorDetails {
  errorTime?: number;
  workerId?: string;
  taskId?: string;
  taskData?: unknown;
  timeout?: number;
}

/**
 * Custom error class for worker pool related errors
 *
 * @example
 * ```ts
 * throw new WorkerPoolError({
 *   message: 'Worker failed to process task',
 *   type: ErrorType.WORKER_ERROR,
 *   severity: ErrorSeverity.ERROR,
 *   workerId: 'worker-1',
 *   error: new Error('Task processing failed'),
 *   timestamp: new Date().toISOString(),
 *   operation: 'processTask',
 *   category: 'worker',
 *   stackTrace: new Error().stack || '',
 *   code: 'WORKER_ERROR',
 *   details: {
 *     taskId: 'task-1',
 *     errorTime: Date.now(),
 *     workerId: 'worker-1'
 *   }
 * });
 * ```
 */
export class WorkerPoolError extends Error {
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly workerId: string;
  public readonly error: Error;
  public readonly timestamp: string;
  public readonly operation: string;
  public readonly category: string;
  public readonly stackTrace: string;
  public readonly code: string;
  public readonly details: WorkerPoolErrorDetails;

  /**
   * Creates a new WorkerPoolError instance
   *
   * @param params - Error details object
   *
   * @param params.message - Error message
   *
   * @param params.type - Type of error
   *
   * @param params.severity - Error severity level
   *
   * @param params.workerId - ID of the worker that caused the error
   *
   * @param params.error - Original error object
   *
   * @param params.timestamp - When the error occurred
   *
   * @param params.operation - Operation that failed
   *
   * @param params.category - Error category
   *
   * @param params.stackTrace - Error stack trace
   *
   * @param params.code - Error code
   *
   * @param params.details - Additional error details
   *
   */
  constructor({
    message,
    type,
    severity,
    workerId,
    error,
    timestamp,
    operation,
    category,
    stackTrace,
    code,
    details,
  }: {
    message: string;
    type: ErrorType;
    severity: ErrorSeverity;
    workerId: string;
    error: Error;
    timestamp: string;
    operation: string;
    category: string;
    stackTrace: string;
    code: string;
    details: WorkerPoolErrorDetails;
  }) {
    super(message);
    this.name = "WorkerPoolError";
    this.type = type;
    this.severity = severity;
    this.workerId = workerId;
    this.error = error;
    this.timestamp = timestamp;
    this.operation = operation;
    this.category = category;
    this.stackTrace = stackTrace;
    this.code = code;
    this.details = details;
  }
}
