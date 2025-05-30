/**
 * Worker Pool Implementation
 * 
 * Provides a thread pool for managing background tasks with configurable
 * concurrency limits and task queuing.
 * 
 * @example Basic worker pool usage
 * ```ts
 * const pool = new WorkerPool({ maxWorkers: 4 });
 * await pool.execute(myTask);
 * ```
 */

import type { 
  WorkerPoolOptions, 
  WorkerTask, 
  WorkerPoolStats,
} from "../types/worker-pool";
import { ErrorType, ErrorSeverity } from "../types/error";
import { EventEmitter as _EventEmitter } from "events";

// Create a local WorkerPoolError class since we can't import the interface as a value
/**
 * Custom error class for worker pool operations
 * 
 * @example Worker pool error handling
 * ```ts
 * try {
 *   await pool.execute(task);
 * } catch (error) {
 *   if (error instanceof WorkerPoolError) {
 *     console.log(`Worker ${error.workerId} failed: ${error.message}`);
 *   }
 * }
 * ```
 */
class WorkerPoolError extends Error {
  public readonly workerId: string;
  public readonly error: string;
  public readonly timestamp: string;
  public readonly operation: string;
  public readonly category: string;
  public readonly stackTrace: string;
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly code: string;
  public readonly details: {
    taskId?: string;
    errorTime: number;
    workerId: string;
  };

  /**
   *
   */
  constructor(params: {
    message: string;
    workerId: string;
    error: string;
    timestamp: string;
    operation: string;
    category: string;
    stackTrace: string;
    type: ErrorType;
    severity: ErrorSeverity;
    code: string;
    details: {
      taskId?: string;
      errorTime: number;
      workerId: string;
    };
  }) {
    super(params.message);
    this.name = "WorkerPoolError";
    this.workerId = params.workerId;
    this.error = params.error;
    this.timestamp = params.timestamp;
    this.operation = params.operation;
    this.category = params.category;
    this.stackTrace = params.stackTrace;
    this.type = params.type;
    this.severity = params.severity;
    this.code = params.code;
    this.details = params.details;
  }
}

export type { WorkerPoolError };

/**
 * WorkerPool class for managing a pool of Web Workers
 *
 * @example
 * ```ts
 * const pool = new WorkerPool({ workerScript: 'worker.js', maxWorkers: 4 });
 * pool.execute({ type: 'doWork', payload: 123 }).then(result => {
 *   console.log(result);
 * });
 * ```
 */
export class WorkerPool<_T = unknown, _R = unknown> {
  private taskQueue: WorkerTask<unknown, unknown>[] = [];
  private taskMap: Map<string, WorkerTask> = new Map(); // Track active tasks by ID
  private availableWorkers: Worker[] = [];
  private workers: Worker[] = [];
  private currentTaskId: string | undefined;
  private options: WorkerPoolOptions;

  /**
   * Create a new WorkerPool
   *
   * @param options
   *
   */
  constructor(options: WorkerPoolOptions) {
    this.options = options;
    this.currentTaskId = undefined;
    this.initialize();
  }

  /**
   * Execute a task using an available worker
   *
   * @param data - The data to process
   *
   * @returns Promise that resolves with the result
   *
   * @example Execute a task
   * ```ts
   * const result = await pool.execute({ input: 'data' });
   * ```
   */
  public async execute<T = unknown, R = unknown>(data: T): Promise<R> {
    const task: WorkerTask<T, R> = {
      id: Math.random().toString(36).substring(7),
      data,
      resolve: (_value: R) => {},
      reject: (_error: unknown) => {},
    };

    return new Promise<R>((resolve, reject) => {
      task.resolve = resolve;
      task.reject = reject;
      this.taskQueue.push(task as WorkerTask<unknown, unknown>);
      this.processQueue();
    });
  }

  /**
   * Terminate all workers in the pool
   *
   * @returns {Promise<void>} A promise that resolves when all workers are terminated
   *
   */
  public async terminate(): Promise<void> {
    const terminatePromises = this.workers.map((worker) => {
      return new Promise<void>((resolve) => {
        try {
          worker.terminate();
          resolve();
        } catch {
          // Just resolve even if there's an error
          resolve();
        }
      });
    });

    await Promise.all(terminatePromises);

    // Clear task queue, map, and workers
    this.taskQueue = [];
    this.taskMap.clear();
    this.workers = [];
    this.availableWorkers = [];
  }

  /**
   * Get current worker pool statistics
   *
   * @returns {WorkerPoolStats} The current statistics of the worker pool
   *
   */
  public getStatistics(): WorkerPoolStats {
    return {
      totalWorkers: this.workers.length,
      availableWorkers: this.availableWorkers.length,
      busyWorkers: this.workers.length - this.availableWorkers.length,
      queueSize: this.taskQueue.length,
      errorCount: 0, // TODO: Implement error tracking
      errorStats: {
        total: 0,
        byType: {} as Record<ErrorType, number>,
        bySeverity: {} as Record<ErrorSeverity, number>,
        errorTypeDistribution: {} as Record<ErrorType, number>,
        severityDistribution: {} as Record<ErrorSeverity, number>,
      },
      errorTrends: {
        daily: {},
        weekly: {},
        monthly: {},
      },
      taskStartTimes: {},
      taskCompletionTimes: {},
      peakQueueSize: this.taskQueue.length,
      avgWaitTime: 0,
      queueSizeHistory: [this.taskQueue.length],
      lastResetTime: Date.now(),
    };
  }

  /**
   * Process the next task in the queue
   *
   * @returns {void} Nothing
   *
   */
  private processQueue(): void {
    if (this.taskQueue.length === 0 || this.availableWorkers.length === 0) {
      return;
    }

    const task = this.taskQueue.shift();
    const worker = this.availableWorkers.shift();

    if (!task || !worker) {
      return;
    }

    this.currentTaskId = task.id;

    // Store task in the map for later lookup
    this.taskMap.set(task.id, task);

    try {
      worker.postMessage({
        taskId: task.id,
        data: task.data,
      });
    } catch {
      if (task.reject) {
        const workerError = this.handleWorkerError(
          new Error('Worker error'),
          worker.toString(),
          task.id,
        );
        task.reject(workerError);

        // Remove task from map
        this.taskMap.delete(task.id);
      }
      this.availableWorkers.push(worker);
      this.processQueue();
    }
  }

  /**
   * Initialize the worker pool with initial workers
   */
  private initialize(): void {
    const initialWorkers = this.options.initialWorkers || 0;

    // Create initial workers
    for (let i = 0; i < initialWorkers; i++) {
      this.createWorker();
    }
  }

  /**
   * Create a new worker and add it to the pool
   */
  private createWorker(): void {
    const workerScript = this.options.workerScript;
    if (!workerScript) {
      throw new Error('Worker script is required');
    }
    
    const worker = new Worker(workerScript);

    // Set up event listeners
    worker.addEventListener("message", (event) => {
      if (!event.data?.taskId) {
        return;
      }

      // Look up task in the map instead of the queue
      const task = this.taskMap.get(event.data.taskId);
      if (task && task.resolve) {
        task.resolve(event.data.result);

        // Remove task from map
        this.taskMap.delete(event.data.taskId);

        this.availableWorkers.push(worker);
        this.processQueue();
      }
    });

    worker.addEventListener("error", (error) => {
      const workerId = worker.toString();

      // Use currentTaskId to lookup task in the map
      if (this.currentTaskId) {
        const task = this.taskMap.get(this.currentTaskId);
        if (task && task.reject) {
          task.reject(this.handleWorkerError(error, workerId, task.id));

          // Remove task from map
          this.taskMap.delete(task.id);
        }
      }

      this.availableWorkers.push(worker);
      this.processQueue();
    });

    worker.addEventListener("messageerror", (error) => {
      const workerId = worker.toString();

      // Use currentTaskId to lookup task in the map
      if (this.currentTaskId) {
        const task = this.taskMap.get(this.currentTaskId);
        if (task && task.reject) {
          task.reject(this.handleWorkerError(error, workerId, task.id));

          // Remove task from map
          this.taskMap.delete(task.id);
        }
      }

      this.availableWorkers.push(worker);
      this.processQueue();
    });

    this.workers.push(worker);
    this.availableWorkers.push(worker);
  }

  /**
   * Handle worker errors
   *
   * @param error
   *
   * @param workerId
   *
   * @param taskId
   *
   * @returns {WorkerPoolError} The constructed worker pool error
   *
   */
  private handleWorkerError(
    error: Error | ErrorEvent | MessageEvent,
    workerId: string,
    taskId?: string,
  ): WorkerPoolError {
    const errorMessage = error instanceof Error ? error.message : error.toString();
    const errorString = error instanceof Error ? error.toString() : error.toString();
    
    return new WorkerPoolError({
      message: errorMessage,
      type: ErrorType.WORKER_POOL,
      severity: ErrorSeverity.ERROR,
      workerId,
      error: errorString,
      timestamp: new Date().toISOString(),
      operation: "worker_pool",
      category: "worker_error",
      stackTrace: error instanceof Error ? error.stack || "" : "",
      code: "WORKER_ERROR",
      details: {
        taskId,
        errorTime: Date.now(),
        workerId,
      },
    });
  }
}
