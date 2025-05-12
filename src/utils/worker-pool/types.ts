import { ErrorType, ErrorSeverity } from "../../types/error";

export interface WorkerPoolOptions {
  workerScript: string;
  maxWorkers?: number;
  initialWorkers?: number;
  timeout?: number;
  errorHandler?: (error: Error, context: { taskId?: string; operation?: string }) => void;
}

export interface WorkerTask<T = unknown, R = unknown> {
  id: string;
  data: T;
  resolve?: (value: R) => void;
  reject?: (error: unknown) => void;
  createdAt?: number;
}

export interface WorkerStats {
  id: string;
  status: "available" | "busy";
  tasksProcessed: number;
  lastActive: number;
  errors: number;
}

export interface ErrorDistribution {
  daily: Record<string, number>;
  weekly: Record<string, number>;
  monthly: Record<string, number>;
  rateChangePercent: number;
  trend: "increasing" | "decreasing" | "stable";
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
  public readonly details: {
    taskId?: string;
    errorTime: number;
    workerId: string;
  };

  /**
   * Creates a new WorkerPoolError instance
   *
   * @param {object} message - Error details object
   *
   * @param {string} message.message - Error message
   *
   * @param {ErrorType} message.type - Type of error
   *
   * @param {ErrorSeverity} message.severity - Error severity level
   *
   * @param {string} message.workerId - ID of the worker that caused the error
   *
   * @param {Error} message.error - Original error object
   *
   * @param {string} message.timestamp - When the error occurred
   *
   * @param {string} message.operation - Operation that failed
   *
   * @param {string} message.category - Error category
   *
   * @param {string} message.stackTrace - Error stack trace
   *
   * @param {string} message.code - Error code
   *
   * @param {object} message.details - Additional error details
   *
   * @param {string} [message.details.taskId] - ID of the task that caused the error
   *
   * @param {number} message.details.errorTime - Timestamp when the error occurred
   *
   * @param {string} message.details.workerId - ID of the worker that caused the error
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
    details: {
      taskId?: string;
      errorTime: number;
      workerId: string;
    };
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

export interface WorkerPoolStats {
  queueSize: number;
  activeWorkers: number;
  totalWorkers: number;
  availableWorkers: number;
  busyWorkers: number;
  pendingTasks: number;
  maxWorkers: number;
  utilization: number;
  completedTasks: number;
  failedTasks: number;
  avgExecutionTime: number;
  throughput: number;
  errorStats: {
    errorDistribution: Record<ErrorType, number>;
    severityCounts: Record<ErrorSeverity, number>;
    dailyTrends: Record<string, number>;
    averageProcessingTime: number;
    topErrorPatterns: string[];
    errorTimeDistribution: ErrorDistribution;
  };
}
