import {
  ErrorSeverity,
  ErrorType,
  WorkerPoolError,
} from "../../types/error";
import type { WorkerPoolOptions, WorkerTask, WorkerPoolStats } from "./types";
import { ErrorTracker } from "./error-handling";
import { StatisticsTracker } from "./statistics";
import { EventEmitter } from "events";

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
  private availableWorkers: Worker[] = [];
  private taskQueue: WorkerTask[] = [];
  private workerMap = new Map<Worker, WorkerTask<unknown, unknown> | null>();
  private workerIds = new Set<string>();
  private workerIdCounter = 0;
  private currentWorkerId?: string;
  private currentOperation?: string;
  private currentTaskId?: string;
  private options: Required<WorkerPoolOptions>;
  private errorTracker: ErrorTracker;
  private statsTracker: StatisticsTracker;
  private queueSizeSamplingInterval: ReturnType<typeof setInterval> | null = null;
  private maxWorkers: number;
  private isInitialized = false;

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
      throw new Error("Worker script URL is required");
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
    if (this.isInitialized) return;

    // Create initial workers
    const initialWorkers = Math.min(this.maxWorkers, 2);
    for (let i = 0; i < initialWorkers; i++) {
      await this.createWorker();
    }

    this.isInitialized = true;
    this.statsTracker.trackQueueSize(0);
  }

  /**
   * Creates a new worker and adds it to the pool.
   * 
   * @returns The newly created worker
   *
   */
  private createWorker(): Worker {
    const worker = new Worker(this.options.workerScript);
    const workerId = this.workerIdCounter.toString();
    this.workerIdCounter++;
    this.workerIds.add(workerId);
    this.workers.push(worker);
    this.availableWorkers.push(worker);
    this.workerMap.set(worker, null);

    worker.addEventListener("message", this.handleWorkerMessage.bind(this));
    worker.addEventListener("error", this.handleWorkerError.bind(this));

    // Register worker with global registry
    if (typeof window !== "undefined" && window.__WORKER_REGISTRY__) {
      window.__WORKER_REGISTRY__.add(worker);
    }

    return worker;
  }

  /**
   * Handles messages received from workers.
   * 
   * @param event - The message event from the worker
   *
   */
  private handleWorkerMessage(event: MessageEvent): void {
    const worker = event.target as Worker;
    this.availableWorkers.push(worker);
    void this.processQueue();
  }

  /**
   * Handles errors from workers.
   * 
   * @param event - The error event from the worker
   *
   */
  private handleWorkerError = (event: ErrorEvent): void => {
    const worker = event.target as Worker;
    const error = event.error || new Error(event.message);
    const errorTime = Date.now();
    const workerId = this.getWorkerId(worker);

    const workerError: WorkerPoolError = {
      name: error.name || "Error",
      message: error.message || "Unknown error",
      type: ErrorType.WORKER_POOL,
      workerId,
      error: error.message || "Worker error occurred",
      timestamp: new Date(errorTime).toISOString(),
      operation: "worker_pool",
      category: "execution",
      stackTrace: error.stack || "",
      severity: ErrorSeverity.ERROR,
      code: "WORKER_EXECUTION_ERROR",
      details: {
        taskId: this.currentTaskId,
        errorTime,
        workerId,
      },
      toErrorInfo() {
        return {
          name: this.name,
          message: this.message,
          componentStack: this.stackTrace,
          stack: this.stackTrace || null,
          code: this.code,
          timestamp: this.timestamp,
          details: this.details,
        };
      },
    };

    this.statsTracker.trackTaskFailure();
    this.emit("error", { error: workerError, worker });

    // Remove the worker from the pool and create a new one
    this.terminateWorker(worker);
    void this.createWorker();
  };

  /**
   * Terminates a worker and removes it from the pool.
   * 
   * @param worker - The worker to terminate
   *
   */
  private terminateWorker(worker: Worker): void {
    const index = this.workers.indexOf(worker);
    if (index !== -1) {
      this.workers.splice(index, 1);
    }

    const availableIndex = this.availableWorkers.indexOf(worker);
    if (availableIndex !== -1) {
      this.availableWorkers.splice(availableIndex, 1);
    }

    worker.terminate();

    // Unregister from global registry
    if (typeof window !== "undefined" && window.__WORKER_REGISTRY__) {
      window.__WORKER_REGISTRY__.delete(worker);
    }
  }

  /**
   * Executes a task using the worker pool.
   * 
   * @param task - The task to execute
   *
   * @returns Promise that resolves when the task is queued
   *
   */
  public async execute(task: WorkerTask): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    this.taskQueue.push(task);
    this.statsTracker.trackQueueSize(this.taskQueue.length);
    this.statsTracker.trackTaskStart(Date.now());

    await this.processQueue();
  }

  /**
   * Processes the task queue by assigning tasks to available workers.
   * 
   * @returns Promise that resolves when the queue is processed
   *
   */
  private async processQueue(): Promise<void> {
    while (this.taskQueue.length > 0 && this.availableWorkers.length > 0) {
      const task = this.taskQueue.shift();
      const worker = this.availableWorkers.shift();
      
      if (!task || !worker) continue;

      try {
        const startTime = Date.now();
        await worker.postMessage(task.data);
        const executionTime = Date.now() - startTime;
        this.statsTracker.trackTaskCompletion(executionTime);
      } catch (error) {
        this.statsTracker.trackTaskFailure();
        // Create an ErrorEvent from the caught error
        const errorEvent = new ErrorEvent("error", {
          error: error as Error,
          message: (error as Error).message,
          lineno: undefined,
          colno: undefined,
          filename: undefined,
        });
        // Set the target to the current worker
        Object.defineProperty(errorEvent, "target", { value: worker });
        this.handleWorkerError(errorEvent);
      }
    }

    // Create new worker if needed and queue is not empty
    if (this.taskQueue.length > 0 && this.workers.length < this.maxWorkers) {
      await this.createWorker();
      await this.processQueue();
    }
  }

  /**
   * Gets the current statistics for the worker pool.
   * 
   * @returns The current worker pool statistics
   *
   */
  public getStatistics(): WorkerPoolStats {
    return this.statsTracker.calculateStats(
      this.workers.length,
      this.availableWorkers.length,
      this.taskQueue.length,
      this.maxWorkers,
    );
  }

  /**
   * Resets the worker pool to its initial state.
   */
  public reset(): void {
    // Terminate all workers
    for (const worker of this.workers) {
      worker.terminate();
    }

    this.workers = [];
    this.availableWorkers = [];
    this.taskQueue = [];
    this.isInitialized = false;
    this.workerIds.clear();
    this.workerIdCounter = 0;
    this.currentWorkerId = undefined;
    this.currentOperation = undefined;
    this.currentTaskId = undefined;

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
    return this.availableWorkers.length;
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

  /**
   * Gets the ID of a worker.
   * 
   * @param worker - The worker to get the ID for
   *
   * @returns The worker's ID
   *
   */
  private getWorkerId(worker: Worker): string {
    return Array.from(this.workerIds)[this.workers.indexOf(worker)] || "unknown";
  }
}
