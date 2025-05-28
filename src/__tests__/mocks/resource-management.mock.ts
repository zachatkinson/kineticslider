/**
 * Consolidated mock implementations for resource management
 * Shared between unit and browser tests to eliminate duplication
 *
 * @example
 * import { WorkerPool, ResourcePool, mockTerminate } from '@/__tests__/mocks';
 * const pool = new WorkerPool({ maxWorkers: 2 });
 * await pool.execute(() => doWork());
 * pool.terminate();
 */
import { vi } from "vitest";
import { EventEmitter } from "events";
import type {
  WorkerPoolOptions,
  WorkerPoolStats,
} from "../../types/worker-pool";
import { ErrorSeverity, ErrorType } from "../../types/error";

/**
 * Shared mock terminate function
 */
export const mockTerminate = vi.fn();

/**
 * Mock implementation of a worker pool for resource management tests.
 * Works in both unit and browser test environments.
 *
 * @example
 * const pool = new WorkerPool({ maxWorkers: 2 });
 * await pool.execute(() => doWork());
 * pool.terminate();
 *
 * @returns WorkerPool instance
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
   * Creates a new WorkerPool instance
   *
   * @param options Configuration options for the worker pool
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
   * Default error handler for worker errors
   *
   * @param error The error object
   *
   * @param context Context for the error
   *
   * @param context.taskId
   *
   * @param context.operation
   *
   * @returns void
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
   * Execute a task in the worker pool
   *
   * @param task The task function to execute
   *
   * @returns Promise that resolves with the task result
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
      const wrappedTask = async (): Promise<unknown> => {
        try {
          const result = await task();
          this.taskCompletionTimes[taskId] = Date.now();
          return result;
        } catch (error) {
          this.taskCompletionTimes[taskId] = Date.now();
          if (this.options.errorHandler) {
            this.options.errorHandler(error as Error, { taskId });
          }
          throw error;
        }
      };

      this.taskQueue.push({
        task: wrappedTask,
        resolve: (value: unknown) => resolve(value as T),
        reject,
      });

      setTimeout(() => {
        void this.processQueue();
      }, 0);
    });
  }

  /**
   * Process the task queue and assign tasks to available workers
   *
   * @returns Promise that resolves when processing is complete
   *
   */
  private async processQueue(): Promise<void> {
    while (this.taskQueue.length > 0 && this.availableWorkers.length > 0) {
      const task = this.taskQueue.shift();
      if (!task) continue;

      const worker = this.availableWorkers.shift();
      if (!worker) {
        this.taskQueue.unshift(task);
        break;
      }

      try {
        const result = await task.task();
        task.resolve(result);
      } catch (error) {
        task.reject(error);
      } finally {
        this.availableWorkers.push(worker);
      }
    }
  }

  /**
   * Initialize the worker pool
   *
   * @returns Promise that resolves when initialization is complete
   *
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

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
   * Create a new worker and add it to the pool
   *
   * @returns Promise that resolves when worker is created
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
   * Terminate all workers and reset the pool
   *
   * @returns void
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
   * Get statistics about the worker pool
   *
   * @returns The statistics object
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
      daily: {},
      weekly: {},
      monthly: {},
    };

    // Calculate average wait time
    const waitTimes = Object.values(this.taskCompletionTimes).map((completion, index) => {
      const start = Object.values(this.taskStartTimes)[index];
      return start ? completion - start : 0;
    });
    const avgWaitTime = waitTimes.length > 0 
      ? waitTimes.reduce((sum, time) => sum + time, 0) / waitTimes.length 
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
 * Mock implementation of a resource pool for testing
 *
 * @example
 * const pool = new ResourcePool({ maxResources: 5 });
 * const resource = await pool.acquire();
 * await pool.release(resource);
 */
export class ResourcePool {
  private _activeCount = 0;
  private _maxResources: number;
  private _timeout: number;
  private _resources: Set<unknown> = new Set();
  private _timeouts: Map<unknown, ReturnType<typeof setTimeout>> = new Map();

  /**
   * Creates a new ResourcePool instance
   *
   * @param options Configuration options
   *
   * @param options.maxResources Maximum number of resources to allow
   *
   * @param options.timeout Timeout for resource operations
   *
   */
  constructor(options: { maxResources?: number; timeout?: number } = {}) {
    this._maxResources = options.maxResources || 10;
    this._timeout = options.timeout || 5000;
  }

  /**
   * Get the current active resource count
   *
   * @returns The number of active resources
   *
   */
  get activeCount(): number {
    return this._activeCount;
  }

  /**
   * Acquire a resource from the pool
   *
   * @returns Promise that resolves with the acquired resource
   *
   */
  async acquire(): Promise<unknown> {
    if (this._activeCount >= this._maxResources) {
      throw new Error("Resource pool exhausted");
    }

    const resource = {
      id: Math.random().toString(36).substring(2, 9),
      acquired: Date.now(),
    };

    this._resources.add(resource);
    this._activeCount++;

    // Set a timeout for the resource
    const timeout = setTimeout(() => {
      this.release(resource).catch(console.error);
    }, this._timeout);
    this._timeouts.set(resource, timeout);

    return resource;
  }

  /**
   * Release a resource back to the pool
   *
   * @param resource The resource to release
   *
   * @returns Promise that resolves when resource is released
   *
   */
  async release(resource: unknown): Promise<void> {
    if (!this._resources.has(resource)) {
      throw new Error("Resource not found in pool");
    }

    this._resources.delete(resource);
    this._activeCount = Math.max(0, this._activeCount - 1);

    // Clear the timeout
    const timeout = this._timeouts.get(resource);
    if (timeout) {
      clearTimeout(timeout);
      this._timeouts.delete(resource);
    }
  }
}

/**
 * Creates a complete resource management mock setup
 *
 * @param _options - Configuration options for the mock
 *
 * @param _options.maxResources - Maximum number of resources to allow
 *
 * @param _options.timeout - Timeout for resource operations
 *
 * @returns Object containing all resource management mocks
 *
 */
export function createResourceManagementMock(_options: {
  maxResources?: number;
  timeout?: number;
} = {}): {
  WorkerPool: typeof WorkerPool;
  ResourcePool: typeof ResourcePool;
  mockTerminate: typeof mockTerminate;
  allocate: typeof allocateResources;
  deallocate: typeof deallocateResources;
  cleanup: typeof cleanupResources;
} {
  return {
    WorkerPool,
    ResourcePool,
    mockTerminate,
    cleanup: cleanupResources,
    allocate: allocateResources,
    deallocate: deallocateResources,
  };
}

/**
 * Clean up all resources and reset state
 *
 * @returns void
 *
 */
export const cleanupResources = (): void => {
  mockTerminate.mockReset();
  // Additional cleanup logic can be added here
};

/**
 * Allocate test resources
 *
 * @returns Promise that resolves when allocation is complete
 *
 */
export const allocateResources = async (): Promise<void> => {
  // Mock resource allocation logic
  await new Promise(resolve => setTimeout(resolve, 10));
};

/**
 * Deallocate test resources
 *
 * @returns void
 *
 */
export const deallocateResources = (): void => {
  // Mock resource deallocation logic
  cleanupResources();
}; 