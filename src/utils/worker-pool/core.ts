import {
  ErrorSeverity,
  ErrorType,
} from "../../types/error";
import type { WorkerPoolOptions, WorkerTask, WorkerPoolStats } from "./types";
import { WorkerPoolError } from "./types";
import { ErrorTracker } from "./error-handling";
import { StatisticsTracker } from "./statistics";
import { EventEmitter } from "events";
import { Worker } from 'worker_threads';

/**
 * A class that manages a pool of web workers for parallel task execution.
 * Provides functionality for task queuing, worker management, and error handling.
 * 
 * @example
 * ```typescript
 * const pool = new WorkerPool({
 *   workerScript: 'worker.js',
 *   maxWorkers: 4
 * });
 * await pool.initialize();
 * await pool.execute({ data: { type: 'task', payload: {} } });
 * ```
 */
export class WorkerPool extends EventEmitter {
  private workers: Worker[] = [];
  private taskQueue: Array<{
    task: WorkerTask;
    resolve: (value: unknown) => void;
    reject: (error: unknown) => void;
  }> = [];
  private isShuttingDown = false;
  private completedTasks = 0;
  private failedTasks = 0;
  private inFlightTasks = new Map<Worker, {
    task: WorkerTask;
    resolve: (value: unknown) => void;
    reject: (error: unknown) => void;
  }>();
  private idleWorkers: Set<Worker> = new Set();
  private options: Required<WorkerPoolOptions>;
  private errorTracker: ErrorTracker;
  private statsTracker: StatisticsTracker;
  private maxWorkers: number;
  private isInitialized = false;
  private isProcessingQueue = false;
  private taskTimeouts = new Map<string, NodeJS.Timeout>();
  private taskPromises = new Map<string, { resolve: (value: unknown) => void; reject: (reason?: unknown) => void }>();
  private startTime = Date.now();
  private handledWorkers = new Set<Worker>();

  /**
   * Creates a new WorkerPool instance with the specified options.
   * 
   * @param options - Configuration options for the worker pool
   *
   * @throws {Error} If workerScript is not provided
   */
  constructor(options: WorkerPoolOptions) {
    super();
    if (!options.workerScript) {
      throw new Error("Worker script path is required");
    }

    this.options = {
      maxWorkers: options.maxWorkers || navigator.hardwareConcurrency || 4,
      initialWorkers: options.initialWorkers || 0,
      workerScript: options.workerScript,
      timeout: options.timeout || 30000,
      errorHandler: options.errorHandler || this.defaultErrorHandler.bind(this),
    };

    this.errorTracker = new ErrorTracker();
    this.statsTracker = new StatisticsTracker();
    this.maxWorkers = this.options.maxWorkers;
  }

  /**
   * Initializes the worker pool by creating initial workers.
   * 
   * @returns Promise that resolves when initialization is complete
   *
   */
  public async initialize(): Promise<void> {
    if (this.workers.length > 0) return;
    
    const initialWorkers = Math.min(this.options.initialWorkers || 2, this.maxWorkers);
    for (let i = 0; i < initialWorkers; i++) {
      this.createWorker();
    }

    this.isInitialized = true;
    this.statsTracker.trackQueueSize(0);
  }

  /**
   * Creates a new worker and adds it to the pool.
   * 
   * @param isReplacement
   *
   * @returns The newly created worker
   *
   */
  private createWorker(isReplacement = false): Worker {
    // Only enforce maxWorkers limit for new workers, not replacements
    if (!isReplacement && this.workers.length >= this.maxWorkers) {
      throw new Error(`Cannot create more than ${this.maxWorkers} workers`);
    }

    const worker = new Worker(this.options.workerScript);
    
    worker.on('message', (result) => {
      const taskData = this.inFlightTasks.get(worker);
      if (taskData) {
        this.inFlightTasks.delete(worker);
        this.completedTasks++;
        this.idleWorkers.add(worker);
        this.cleanupTask(taskData.task.id);
        taskData.resolve(result.data.result);
        this.processNextTask();
      }
    });

    worker.on('error', (error) => {
      try {
        if (this.handledWorkers.has(worker)) return;
        this.handledWorkers.add(worker);
        let taskId: string | undefined;
        const taskData = this.inFlightTasks.get(worker);
        let poolError: WorkerPoolError = new WorkerPoolError({
          message: error.message,
          type: ErrorType.WORKER_POOL,
          severity: ErrorSeverity.ERROR,
          workerId: String(worker.threadId ?? ''),
          error: error,
          timestamp: new Date().toISOString(),
          operation: "worker_pool",
          category: "execution",
          code: "WORKER_ERROR",
          stackTrace: error.stack ?? '',
          details: {},
        });
        if (taskData) {
          taskId = taskData.task.id;
          this.inFlightTasks.delete(worker);
          this.failedTasks++;
          poolError = new WorkerPoolError({
            message: error.message,
            type: ErrorType.WORKER_POOL,
            severity: ErrorSeverity.ERROR,
            workerId: String(worker.threadId ?? ''),
            error: error,
            timestamp: new Date().toISOString(),
            operation: "worker_pool",
            category: "execution",
            code: "WORKER_ERROR",
            stackTrace: error.stack ?? '',
            details: {},
          });
          if (taskId && this.taskPromises.has(taskId)) {
            this.taskPromises.get(taskId)?.reject(poolError);
            this.taskPromises.delete(taskId);
          }
        } else if ('currentTaskId' in worker && worker.currentTaskId) {
          taskId = String(worker.currentTaskId);
          if (taskId && this.taskPromises.has(taskId)) {
            poolError = new WorkerPoolError({
              message: error.message,
              type: ErrorType.WORKER_POOL,
              severity: ErrorSeverity.ERROR,
              workerId: String(worker.threadId ?? ''),
              error: error,
              timestamp: new Date().toISOString(),
              operation: "worker_pool",
              category: "execution",
              code: "WORKER_ERROR",
              stackTrace: error.stack ?? '',
              details: {},
            });
            this.taskPromises.get(taskId)?.reject(poolError);
            this.taskPromises.delete(taskId);
          }
        }
        // Always clean up the task timeout and resources if we have a taskId
        if (taskId) {
          this.cleanupTask(taskId);
        }
        // Replace the worker (inline logic)
        const workerIndex = this.workers.indexOf(worker);
        if (workerIndex !== -1) {
          this.workers.splice(workerIndex, 1);
        }
        this.idleWorkers.delete(worker);
        const newWorker = this.createWorker(true);
        this.emit('worker:replaced', {
          oldWorkerId: String(worker.threadId ?? ''),
          newWorkerId: String(newWorker.threadId ?? '')
        });
        this.emit('error', poolError);
      } catch {
        // Defensive: don't let error handler throw
      }
    });

    worker.on('exit', () => {
      try {
        if (this.handledWorkers.has(worker)) return;
        this.handledWorkers.add(worker);
        let taskId: string | undefined;
        const taskData = this.inFlightTasks.get(worker);
        if (taskData) {
          taskId = taskData.task.id;
          this.inFlightTasks.delete(worker);
          this.failedTasks++;
          const exitError = new Error('Worker exited unexpectedly');
          const poolError = new WorkerPoolError({
            message: 'Worker exited unexpectedly',
            type: ErrorType.WORKER_POOL,
            severity: ErrorSeverity.ERROR,
            workerId: String(worker.threadId ?? ''),
            error: exitError,
            timestamp: new Date().toISOString(),
            operation: "worker_pool",
            category: "execution",
            stackTrace: exitError.stack || "",
            code: "WORKER_EXIT",
            details: {
              taskId: taskData.task.id,
              taskData: taskData.task.data,
              errorTime: Date.now(),
              workerId: String(worker.threadId ?? '')
            }
          });
          this.emit('error', poolError);
          taskData.reject(poolError);
        }
        // Always clean up timeout for this worker's task
        if (!taskId && 'currentTaskId' in worker && typeof (worker as unknown as { currentTaskId?: string }).currentTaskId === 'string') {
          taskId = (worker as unknown as { currentTaskId: string }).currentTaskId;
        }
        if (taskId) this.cleanupTask(taskId);
        // Remove exited worker and create replacement
        const workerIndex = this.workers.indexOf(worker);
        if (workerIndex !== -1) {
          this.workers.splice(workerIndex, 1);
        }
        this.idleWorkers.delete(worker);
        const newWorker = this.createWorker(true);
        this.emit('worker:replaced', {
          oldWorkerId: String(worker.threadId ?? ''),
          newWorkerId: String(newWorker.threadId ?? '')
        });
      } catch (e) {
        console.error('Error in exit event handler:', e);
      }
    });

    this.workers.push(worker);
    if (this.inFlightTasks.size === 0) {
      this.idleWorkers.add(worker);
    }
    return worker;
  }

  /**
   * Executes a task using the worker pool.
   * 
   * @param task - The task to execute
   *
   * @returns Promise that resolves when the task is queued
   *
   */
  public async execute(task: WorkerTask): Promise<unknown> {
    if (!this.isInitialized) {
      throw new WorkerPoolError({
        message: "Worker pool not initialized",
        type: ErrorType.WORKER_POOL,
        severity: ErrorSeverity.ERROR,
        workerId: "unknown",
        error: new Error("Worker pool not initialized"),
        timestamp: new Date().toISOString(),
        operation: "worker_pool",
        category: "execution",
        code: "NOT_INITIALIZED",
        stackTrace: new Error().stack || "",
        details: {
          taskId: task.id,
          errorTime: Date.now(),
          workerId: "unknown"
        }
      });
    }

    return new Promise((resolve, reject) => {
      // Set up timeout
      const timeoutId = setTimeout(() => {
        this.failedTasks++;
        const error = new WorkerPoolError({
          message: `Task ${task.id} timed out after ${this.options.timeout}ms`,
          type: ErrorType.WORKER_POOL,
          severity: ErrorSeverity.ERROR,
          workerId: "unknown",
          error: new Error("Task timeout"),
          timestamp: new Date().toISOString(),
          operation: "worker_pool",
          category: "execution",
          code: "TASK_TIMEOUT",
          stackTrace: new Error().stack || "",
          details: {
            taskId: task.id,
            errorTime: Date.now(),
            workerId: "unknown",
            timeout: this.options.timeout
          }
        });
        this.cleanupTask(task.id);
        reject(error);
      }, this.options.timeout);

      this.taskTimeouts.set(task.id, timeoutId);
      this.taskPromises.set(task.id, { resolve, reject });

      this.taskQueue.push({ task, resolve, reject });
      this.processNextTask();
    });
  }

  private processNextTask(): void {
    if (this.taskQueue.length > 0 && this.idleWorkers.size > 0) {
      const worker = this.idleWorkers.values().next().value;
      if (!worker) return;
      
      this.idleWorkers.delete(worker);
      const taskData = this.taskQueue.shift();
      if (taskData) {
        this.inFlightTasks.set(worker, taskData);
        // Ensure the worker knows about the task ID
        if ('currentTaskId' in worker) {
          (worker as unknown as { currentTaskId: string }).currentTaskId = taskData.task.id;
        }
        worker.postMessage(taskData.task);
      }
    }
  }

  /**
   * Gets the current statistics for the worker pool.
   * 
   * @returns The current worker pool statistics
   *
   */
  public getStatistics(): WorkerPoolStats {
    return {
      totalWorkers: this.workers.length,
      availableWorkers: this.idleWorkers.size,
      busyWorkers: this.inFlightTasks.size,
      queueSize: this.taskQueue.length,
      errorCount: this.failedTasks,
      errorStats: {
        total: this.failedTasks,
        byType: {
          render: 0,
          async: 0,
          animation: 0,
          validation: 0,
          resource: 0,
          interaction: 0,
          state: 0,
          operation: 0,
          gesture: 0,
          navigation: 0,
          animation_error: 0,
          asset_loading: 0,
          image_load_error: 0,
          network: 0,
          user_input: 0,
          configuration: 0,
          unknown: 0,
          performance: 0,
          initialization: 0,
          worker_pool: 0
        },
        bySeverity: { info: 0, warning: 0, error: 0, critical: 0 },
        errorTypeDistribution: {
          render: 0,
          async: 0,
          animation: 0,
          validation: 0,
          resource: 0,
          interaction: 0,
          state: 0,
          operation: 0,
          gesture: 0,
          navigation: 0,
          animation_error: 0,
          asset_loading: 0,
          image_load_error: 0,
          network: 0,
          user_input: 0,
          configuration: 0,
          unknown: 0,
          performance: 0,
          initialization: 0,
          worker_pool: 0
        },
        severityDistribution: { info: 0, warning: 0, error: 0, critical: 0 }
      },
      errorTrends: {
        daily: {},
        weekly: {},
        monthly: {}
      },
      taskStartTimes: {},
      taskCompletionTimes: {},
      peakQueueSize: Math.max(this.taskQueue.length, 0),
      avgWaitTime: 0,
      queueSizeHistory: [this.taskQueue.length],
      lastResetTime: this.startTime
    };
  }

  /**
   * Resets the worker pool to its initial state.
   * 
   * @returns Promise that resolves when reset is complete
   *
   */
  public async reset(): Promise<void> {
    this.isShuttingDown = true;
    await Promise.all(this.workers.map(worker => worker.terminate()));
    this.workers = [];
    this.taskQueue = [];
    this.inFlightTasks.clear();
    this.idleWorkers.clear();
    this.completedTasks = 0;
    this.failedTasks = 0;
    this.isShuttingDown = false;
    this.handledWorkers.clear();
    this.statsTracker.reset();
  }

  /**
   * Default error handler for worker pool errors.
   * 
   * @param error - The error that occurred
   *
   * @param context - Additional context about the error
   *
   * @param context.taskId - The ID of the task associated with the error (optional)
   *
   * @param context.operation - The operation being performed when the error occurred (optional)
   *
   */
  private defaultErrorHandler(
    error: Error,
    context: { taskId?: string; operation?: string },
  ): void {
    console.error("Worker pool error:", error, context);
  }

  /**
   * Gets the total number of workers in the pool.
   * 
   * @returns The total number of workers
   *
   */
  public get size(): number {
    return this.workers.length;
  }

  /**
   * Gets the number of available workers.
   * 
   * @returns The number of available workers
   *
   */
  public get available(): number {
    return this.idleWorkers.size;
  }

  /**
   * Gets the number of pending tasks.
   * 
   * @returns The number of pending tasks
   *
   */
  public get pending(): number {
    return this.taskQueue.length;
  }

  private cleanupTask(taskId: string): void {
    // Clear timeout
    const timeout = this.taskTimeouts.get(taskId);
    if (timeout) {
      clearTimeout(timeout);
      this.taskTimeouts.delete(taskId);
    }
    // Clear promise
    const promise = this.taskPromises.get(taskId);
    if (promise) {
      this.taskPromises.delete(taskId);
    }
    // Remove from in-flight tasks
    for (const [worker, taskData] of this.inFlightTasks.entries()) {
      if (taskData.task.id === taskId) {
        this.inFlightTasks.delete(worker);
        this.idleWorkers.add(worker);
      }
    }
    // Remove from task queue
    const queueIndex = this.taskQueue.findIndex(item => item.task.id === taskId);
    if (queueIndex !== -1) {
      this.taskQueue.splice(queueIndex, 1);
    }
    // Clear currentTaskId on all workers that have it set to this taskId
    for (const worker of this.workers) {
      if ('currentTaskId' in worker && (worker as unknown as { currentTaskId?: string }).currentTaskId === taskId) {
        (worker as unknown as { currentTaskId?: string }).currentTaskId = undefined;
      }
    }
  }
}
