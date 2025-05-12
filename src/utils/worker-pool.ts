/**
 * WorkerPool utility for managing Web Workers
 */
import {
  WorkerPoolOptions,
  WorkerTask,
  WorkerPoolError,
} from "./worker-pool/types";
import { ErrorType, ErrorSeverity } from "../types/error";

export type { WorkerPoolError };

/**
 * Simplified worker pool statistics interface
 *
 * @example
 * ```ts
 * const stats: WorkerPoolStats = {
 *   totalWorkers: 4,
 *   availableWorkers: 2,
 *   busyWorkers: 2,
 *   queueSize: 1
 * };
 * ```
 */
export interface WorkerPoolStats {
  totalWorkers: number;
  availableWorkers: number;
  busyWorkers: number;
  queueSize: number;
}

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
export class WorkerPool {
  private taskQueue: WorkerTask[] = [];
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
   * Execute a task on a worker
   *
   * @param data
   *
   * @returns {Promise<R>} A promise that resolves with the result of the worker task
   *
   */
  public async execute<T = unknown, R = unknown>(data: T): Promise<R> {
    type Task = WorkerTask<T, R> & {
      resolve: (value: R) => void;
      reject: (error: unknown) => void;
    };

    const task: Task = {
      id: Math.random().toString(36).substring(7),
      data,
      resolve: (_value: R) => {},
      reject: (_error: unknown) => {},
    };

    return new Promise<R>((resolve, reject) => {
      task.resolve = resolve;
      task.reject = reject;
      this.taskQueue.push(task as unknown as WorkerTask);
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
    const worker = new Worker(this.options.workerScript);

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
    return new WorkerPoolError({
      message: error instanceof Error ? error.message : error.toString(),
      type: ErrorType.WORKER_POOL,
      severity: ErrorSeverity.ERROR,
      workerId,
      error: error instanceof Error ? error : new Error(error.toString()),
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
