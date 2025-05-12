/**
 * Mock implementations for resource management in browser tests.
 *
 * @example
 * import { WorkerPool, ResourcePool } from './resource-management.mock';
 * const pool = new WorkerPool({ maxWorkers: 2 });
 * await pool.execute(() => doWork());
 * pool.terminate();
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
 * Mock implementation of a worker pool for resource management in tests.
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
  private errorCount = 0;
  private taskStartTimes: Record<string, number> = {};
  private taskCompletionTimes: Record<string, number> = {};
  private queueSizeHistory: number[] = [];
  private peakQueueSize = 0;

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

    // Initialize immediately
    void this.initialize();
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
    this.errorCount++;
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

    const taskId = Math.random().toString(36).substring(2, 9);
    this.taskStartTimes[taskId] = Date.now();
    this.queueSizeHistory.push(this.taskQueue.length);
    this.peakQueueSize = Math.max(this.peakQueueSize, this.taskQueue.length);

    return new Promise<T>((resolve, reject) => {
      // Wrap the task execution to handle errors properly
      const wrappedTask = async (): Promise<unknown> => {
        try {
          const result = await task();
          this.taskCompletionTimes[taskId] = Date.now();
          return result;
        } catch (error) {
          this.taskCompletionTimes[taskId] = Date.now();
          // Call error handler directly here
          if (this.options.errorHandler) {
            this.options.errorHandler(error as Error, { taskId });
          }
          throw error;
        }
      };

      // Add task to queue
      this.taskQueue.push({
        task: wrappedTask,
        resolve: (value: unknown) => resolve(value as T),
        reject,
      });

      // Process queue in the next tick to avoid stack overflow
      setTimeout(() => {
        void this.processQueue();
      }, 0);
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

    // Process all tasks that can be processed
    while (this.taskQueue.length > 0 && this.availableWorkers.length > 0) {
      const task = this.taskQueue.shift();
      if (!task) continue;

      const worker = this.availableWorkers.shift();
      if (!worker) {
        // If no worker is available, put the task back and exit
        this.taskQueue.unshift(task);
        break;
      }

      try {
        const result = await task.task();
        task.resolve(result);
      } catch (error) {
        task.reject(error);
      } finally {
        // Return the worker to the available pool
        this.availableWorkers.push(worker);
      }
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

    // Create initial workers
    const workerCount = Math.min(
      this.options.initialWorkers || 1,
      this.options.maxWorkers,
    );

    for (let i = 0; i < workerCount; i++) {
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
    // Create a fake worker for testing
    const worker = {} as Worker;

    // Add it to our pools
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
    this.workers = [];
    this.availableWorkers = [];
    this.taskQueue = [];
    this.isInitialized = false;
    this.errorCount = 0;
    this.taskStartTimes = {};
    this.taskCompletionTimes = {};
    this.queueSizeHistory = [];
    this.peakQueueSize = 0;
  }

  /**
   * Get statistics about the worker pool.
   *
   * @returns {WorkerPoolStats} The statistics object
   *
   */
  getStatistics(): WorkerPoolStats {
    const emptyErrorStats = {
      total: this.errorCount,
      byType: {} as Record<ErrorType, number>,
      bySeverity: {} as Record<ErrorSeverity, number>,
      errorTypeDistribution: {} as Record<ErrorType, number>,
      severityDistribution: {} as Record<ErrorSeverity, number>,
    };

    const emptyErrorTrends = {
      daily: {} as Record<string, number>,
      weekly: {} as Record<string, number>,
      monthly: {} as Record<string, number>,
    };

    const avgWaitTime =
      this.queueSizeHistory.length > 0
        ? this.queueSizeHistory.reduce((a, b) => a + b, 0) /
          this.queueSizeHistory.length
        : 0;

    return {
      totalWorkers: this.workers.length,
      availableWorkers: this.availableWorkers.length,
      busyWorkers: this.workers.length - this.availableWorkers.length,
      queueSize: this.taskQueue.length,
      errorCount: this.errorCount,
      errorStats: emptyErrorStats,
      errorTrends: emptyErrorTrends,
      taskStartTimes: this.taskStartTimes,
      taskCompletionTimes: this.taskCompletionTimes,
      peakQueueSize: this.peakQueueSize,
      avgWaitTime,
      queueSizeHistory: this.queueSizeHistory,
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
  private _timeouts: Map<unknown, ReturnType<typeof setTimeout>> = new Map();

  /**
   *
   */
  constructor(options: { maxResources?: number; timeout?: number } = {}) {
    this._maxResources = options.maxResources || 10;
    this._timeout = options.timeout || 30000;
  }

  /**
   * Get the number of active resources.
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
    const timeoutId = setTimeout(() => {
      if (this._resources.has(resource)) {
        void this.release(resource);
      }
    }, this._timeout);

    this._timeouts.set(resource, timeoutId);

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

    const timeoutId = this._timeouts.get(resource);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this._timeouts.delete(resource);
    }

    this._resources.delete(resource);
    this._activeCount--;
  }
}

/**
 * Create a mock resource management object.
 *
 * @example
 * const mock = createResourceManagementMock();
 * @returns {object} The mock resource management object
 *
 */
export const createResourceManagementMock = (): object => {
  // Implementation of createResourceManagementMock function
  return {};
};

/**
 * Mock function for resource cleanup.
 *
 * @example
 * cleanupResources();
 * @returns {void}
 *
 */
export const cleanupResources = (): void => {
  // Implementation of cleanupResources function
};

/**
 * Mock function for resource allocation.
 *
 * @example
 * await allocateResources();
 * @returns {Promise<void>}
 *
 */
export const allocateResources = async (): Promise<void> => {
  // Implementation of allocateResources function
};

/**
 * Mock function for resource deallocation.
 *
 * @example
 * deallocateResources();
 * @returns {void}
 *
 */
export const deallocateResources = (): void => {
  // Implementation of deallocateResources function
};
