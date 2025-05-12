/**
 * Mock implementations for resource management
 */
import { vi } from "vitest";
import { EventEmitter } from "events";
import type {
  WorkerPoolOptions,
  WorkerPoolStats,
} from "../../../types/worker-pool";
import { ErrorSeverity, ErrorType } from "../../../types/error";

export const mockTerminate = vi.fn();

/**
 * Mock implementation of a worker pool for resource management in unit tests.
 *
 * @example
 * const pool = new WorkerPool({ maxWorkers: 2 });
 * await pool.execute(() => doWork());
 * pool.terminate();
 * @returns {WorkerPool} The mock worker pool instance.
 *
 */
export class WorkerPool extends EventEmitter {
  private workers: Worker[] = [];
  private availableWorkers: Worker[] = [];
  private taskQueue: Array<{
    task: () => unknown;
    resolve: (value: unknown) => void;
    reject: (error: unknown) => void;
  }> = [];
  private options: Required<WorkerPoolOptions>;
  private isInitialized = false;

  /**
   *
   */
  constructor(options: WorkerPoolOptions = {}) {
    super();
    this.options = {
      maxWorkers: options.maxWorkers || 2,
      initialWorkers: options.initialWorkers || 0,
      workerScript: options.workerScript || "",
      timeout: options.timeout || 30000,
      errorHandler: options.errorHandler || this.defaultErrorHandler.bind(this),
    };
  }

  /**
   * Default error handler for worker errors.
   *
   * @param error The error object
   *
   * @param context Context for the error
   *
   * @param context.taskId Optional task identifier
   *
   * @param context.operation Optional operation name
   *
   * @returns {void}
   *
   */
  private defaultErrorHandler(
    error: Error,
    context: { taskId?: string; operation?: string } = {},
  ): void {
    console.error("Worker error:", error, context);
  }

  /**
   * Execute a task in the worker pool.
   *
   * @param task The task function to execute
   *
   * @returns {Promise<T>} The result of the task
   *
   */
  async execute<T>(task: () => T | Promise<T>): Promise<T> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise<T>((resolve, reject) => {
      this.taskQueue.push({
        task: task as () => unknown,
        resolve: resolve as (value: unknown) => void,
        reject,
      });
      void this.processQueue();
    });
  }

  /**
   * Process the task queue and assign tasks to available workers.
   *
   * @returns {Promise<void>}
   *
   */
  private async processQueue(): Promise<void> {
    if (this.taskQueue.length === 0 || this.availableWorkers.length === 0) {
      return;
    }

    const { task, resolve, reject } = this.taskQueue.shift()!;
    const worker = this.availableWorkers.shift()!;

    try {
      const result = await task();
      resolve(result);
    } catch (error) {
      reject(error);
      if (this.options.errorHandler) {
        this.options.errorHandler(error as Error, {});
      }
    } finally {
      this.availableWorkers.push(worker);
      void this.processQueue();
    }
  }

  /**
   * Initialize the worker pool.
   *
   * @returns {Promise<void>}
   *
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    const initialWorkers = Math.min(this.options.maxWorkers, 2);
    for (let i = 0; i < initialWorkers; i++) {
      await this.createWorker();
    }

    this.isInitialized = true;
  }

  /**
   * Create a new worker and add it to the pool.
   *
   * @returns {Promise<void>}
   *
   */
  private async createWorker(): Promise<void> {
    const worker = {
      terminate: vi.fn(),
      postMessage: vi.fn(),
    } as unknown as Worker;

    this.workers.push(worker);
    this.availableWorkers.push(worker);
  }

  /**
   * Terminate all workers and reset the pool.
   *
   * @returns {void}
   *
   */
  terminate(): void {
    mockTerminate();
    this.workers.forEach((worker) => worker.terminate());
    this.workers = [];
    this.availableWorkers = [];
    this.taskQueue = [];
    this.isInitialized = false;
  }

  /**
   * Get statistics about the worker pool.
   *
   * @returns {WorkerPoolStats} The statistics object
   *
   */
  getStatistics(): WorkerPoolStats {
    const emptyErrorStats = {
      total: 0,
      byType: {} as Record<ErrorType, number>,
      bySeverity: {} as Record<ErrorSeverity, number>,
      errorTypeDistribution: {} as Record<ErrorType, number>,
      severityDistribution: {} as Record<ErrorSeverity, number>,
    };

    const emptyErrorTrends = {
      daily: {},
      weekly: {},
      monthly: {},
    };

    return {
      totalWorkers: this.workers.length,
      availableWorkers: this.availableWorkers.length,
      busyWorkers: this.workers.length - this.availableWorkers.length,
      queueSize: this.taskQueue.length,
      errorCount: 0,
      errorStats: emptyErrorStats,
      errorTrends: emptyErrorTrends,
      taskStartTimes: {},
      taskCompletionTimes: {},
      peakQueueSize: 0,
      avgWaitTime: 0,
      queueSizeHistory: [],
      lastResetTime: Date.now(),
    };
  }
}

/**
 * Mock implementation of a resource pool for tests.
 *
 * @example
 * const pool = new ResourcePool({ maxResources: 5 });
 * const resource = await pool.acquire();
 * await pool.release(resource);
 * @returns {ResourcePool} The mock resource pool instance.
 *
 */
export class ResourcePool {
  private _activeCount = 0;
  private _maxResources: number;
  private _timeout: number;
  private _resources: Set<unknown> = new Set();

  /**
   *
   */
  constructor(options: { maxResources?: number; timeout?: number } = {}) {
    this._maxResources = options.maxResources || 10;
    this._timeout = options.timeout || 30000;
  }

  /**
   * The number of currently active resources.
   *
   * @returns {number} The active resource count
   *
   */
  get activeCount(): number {
    return this._activeCount;
  }

  /**
   * Acquire a resource from the pool.
   *
   * @returns {Promise<unknown>} The acquired resource
   *
   */
  async acquire(): Promise<unknown> {
    if (this._activeCount >= this._maxResources) {
      throw new Error("Resource pool exhausted");
    }

    const resource = {};
    this._resources.add(resource);
    this._activeCount++;

    // Set timeout for resource
    setTimeout(() => {
      if (this._resources.has(resource)) {
        void this.release(resource);
      }
    }, this._timeout);

    return resource;
  }

  /**
   * Release a resource back to the pool.
   *
   * @param resource The resource to release
   *
   * @returns {Promise<void>}
   *
   */
  async release(resource: unknown): Promise<void> {
    if (!this._resources.has(resource)) {
      throw new Error("Resource not found in pool");
    }

    this._resources.delete(resource);
    this._activeCount--;
  }
}
