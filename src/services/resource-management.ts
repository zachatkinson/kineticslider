/**
 * Resource management services for performance optimization
 *
 * @module
 * @version 1.0.0
 */

import type { WorkerTask } from "../types/performance-resources";
import type { ResourceError as _ResourceError } from "../types/error";
import type { ExtendedError as _ExtendedError } from "../types/error";

/**
 * Resource pool for reusing objects
 * Implements resource pooling pattern for performance optimization
 *
 * @template T - Type of resources managed by this pool
 * @class
 * @example Example usage
 * ```typescript
 * // Create a resource pool for DOM elements
 * const domPool = new ResourcePool<HTMLDivElement>(
 *   () => document.createElement('div'),
 *   (el) => {
 *     el.textContent = '';
 *     el.className = '';
 *     el.removeAttribute('style');
 *   },
 *   10
 * );
 *
 * // Acquire a resource
 * const div = domPool.acquire();
 *
 * // Use the resource
 * div.textContent = 'Hello World';
 * document.body.appendChild(div);
 *
 * // When: done, release it back to the pool
 * document.body.removeChild(div);
 * domPool.release(div);
 * ```
 */
export class ResourcePool<T> {
  /**
   * Available resources
   *
   * @private
   */
  private resources: T[] = [];

  /**
   * Resources currently in use
   *
   * @private
   */
  private inUse = new Set<T>();

  /**
   * Create a new resource pool
   *
   * @param {() => T} factory - Factory function to create new resources
   *
   * @param {(resource: T) => void} reset - Function to reset a resource before returning to pool
   *
   * @param {number} initialSize - Initial number of resources to create
   *
   */
  constructor(
    private factory: () => T,
    private reset: (resource: T) => void,
    private initialSize: number,
  ) {
    for (let i = 0; i < initialSize; i++) {
      this.resources.push(factory());
    }
  }

  /**
   * Acquire a resource from the pool
   * Creates a new one if none are available
   *
   * @returns {T} A resource instance, either reused from the pool or newly created
   *
   * @example Example usage
   * ```typescript
   * // Acquire a canvas context from the pool
   * const ctx = canvasPool.acquire();
   *
   * // Use it for drawing operations
   * ctx.fillRect(0, 0, 100, 100);
   * ```
   */
  acquire(): T {
    let resource = this.resources.pop();
    if (!resource) {
      resource = this.factory();
    }
    this.inUse.add(resource);
    return resource;
  }

  /**
   * Release a resource back to the pool
   * The resource is reset before being returned to the available pool
   *
   * @param {T} resource - The resource to release
   *
   * @example Example usage
   * ```typescript
   * // When done with the: resource, release it
   * canvasPool.release(ctx);
   * ```
   */
  release(resource: T): void {
    if (this.inUse.has(resource)) {
      this.reset(resource);
      this.inUse.delete(resource);
      this.resources.push(resource);
    }
  }

  /**
   * Release all resources back to the pool
   * Calls release() on each resource currently in use
   *
   * @example Example usage
   * ```typescript
   * // Release all resources when component unmounts
   * useEffect(() => {
   *   return () => {
   *     domPool.releaseAll();
   *   };
   * }, []);
   * ```
   */
  releaseAll(): void {
    this.inUse.forEach((resource) => this.release(resource));
  }
}

/**
 * Options for configuring a WorkerPool
 *
 * @example
 * ```typescript
 * // Configure a worker pool with 4 workers and custom error handling
 * const workerPoolOptions: WorkerPoolOptions = {
 *   maxWorkers: 4,
 *   workerScript: '/path/to/worker.js',
 *   errorHandler: (error) => {
 *     console.error('Worker error:', error);
 *     analytics.trackError(error);
 *   }
 * };
 *
 * // Create a worker pool with these options
 * const pool = new WorkerPool(workerPoolOptions);
 * ```
 */
export interface WorkerPoolOptions {
  /** Maximum number of workers in the pool */
  maxWorkers?: number;
  /** Path to the worker script */
  workerScript?: string;
  /** Error handler for worker errors */
  errorHandler?: (error: Error | unknown) => void;
}

/**
 * Worker pool for offloading heavy computations
 * Manages a pool of Web Workers for parallel task execution
 *
 * @class
 * @example Example usage
 * ```typescript
 * // Create a worker pool with 4 workers
 * const workerPool = new WorkerPool(4);
 *
 * // Execute a heavy computation
 * workerPool.execute(() => {
 *   // This runs in a worker thread
 *   const result = heavyComputation(1000000);
 *   return result;
 * })
 * .then(result => {
 *   console.log('Computation result:', result);
 * })
 * .catch(err => {
 *   console.error('Worker error:', err);
 * });
 *
 * // Terminate the pool when done
 * workerPool.terminate();
 * ```
 */
export class WorkerPool {
  /**
   * Array of all workers in the pool
   *
   * @private
   */
  private workers: Worker[] = [];

  /**
   * Queue of pending tasks
   *
   * @private
   */
  private taskQueue: Array<WorkerTask<unknown>> = [];

  /**
   * Workers that are currently idle and ready to process tasks
   *
   * @private
   */
  private availableWorkers: Worker[] = [];

  /**
   * Abort controller for cancelling operations
   *
   * @private
   */
  private abortController: AbortController = new AbortController();

  /**
   * Error handler for worker errors
   *
   * @private
   */
  private errorHandler?: (error: Error | unknown) => void;

  /**
   * Create a new worker pool
   *
   * @param {WorkerPoolOptions} options - WorkerPool configuration options
   *
   */
  constructor(options: WorkerPoolOptions) {
    const size = options.maxWorkers || 2;
    this.errorHandler = options.errorHandler;

    for (let i = 0; i < size; i++) {
      try {
        // Use the provided workerScript if available (for tests), otherwise use the built JS worker for production/integration
        const workerScript =
          options.workerScript ||
          new URL("../../dist/workers/pool-worker.js", import.meta.url);
        const worker = new Worker(workerScript, { type: "module" });
        this.workers.push(worker);
        this.availableWorkers.push(worker);
        this.setupWorker(worker);

        // Register worker with global registry if in test environment
        if (typeof window !== "undefined") {
          // Use the registerWorker function if available
          if (window.registerWorker) {
            window.registerWorker(worker);
          }
          // Otherwise add directly to the registry if it exists
          else if (window.__WORKER_REGISTRY__) {
            window.__WORKER_REGISTRY__.add(worker);
          }
        }
      } catch (error) {
        console.error("Error creating worker:", error);
        if (this.errorHandler) {
          this.errorHandler(error);
        }
      }
    }
  }

  /**
   * Set up message handling for a worker
   * Configures handlers for task completion and error reporting
   *
   * @param {Worker} worker - The worker to set up
   *
   * @private
   */
  private setupWorker(worker: Worker): void {
    // Worker registration is now handled in the constructor

    worker.onmessage = (event: MessageEvent): void => {
      const { result, error } = event.data;
      const task = this.taskQueue.shift();
      if (task) {
        if (error) {
          task.reject(error);
          if (this.errorHandler) {
            this.errorHandler(error);
          }
        } else {
          task.resolve(result);
        }
      }
      this.availableWorkers.push(worker);
      this.processQueue();
    };

    worker.onerror = (event) => {
      const task = this.taskQueue.shift();
      if (task) {
        const error = new Error(`Worker error: ${event.message}`);
        task.reject(error);

        if (this.errorHandler) {
          this.errorHandler(error);
        }
      }
      this.availableWorkers.push(worker);
      this.processQueue();
    };
  }

  /**
   * Process the task queue, assigning tasks to available workers
   * Called whenever a worker becomes available or a new task is added
   *
   * @private
   */
  private processQueue(): void {
    // Check if we should abort processing
    if (this.abortController.signal.aborted) {
      return;
    }

    while (this.taskQueue.length > 0 && this.availableWorkers.length > 0) {
      const task = this.taskQueue[0];
      const worker = this.availableWorkers.pop();
      if (worker && task) {
        this.taskQueue.shift();
        try {
          worker.postMessage({ task: task.toString() });
        } catch (error) {
          console.error("Error posting message to worker:", error);
          task.reject(error);
          this.availableWorkers.push(worker);
          if (this.errorHandler) {
            this.errorHandler(error);
          }
        }
      }
    }
  }

  /**
   * Execute a task on an available worker
   * If all workers are busy, the task is queued until one becomes available
   *
   * @template T - The return type of the task
   * @param {() => T} task - The task to execute
   *
   * @param {object} options - Options for task execution
   *
   * @param {AbortSignal} [options.signal] - Optional abort signal for cancelling the task
   *
   * @returns {Promise<T>} A promise that resolves with the task result
   *
   * @example Example usage
   * ```typescript
   * // Execute an image processing task with abort support
   * const abortController = new AbortController();
   *
   * workerPool.execute(
   *   () => {
   *     // This runs in a worker thread
   *     const imageData = processImage(rawData);
   *     return imageData;
   *   },
   *   { signal: abortController.signal }
   * )
   * .then(processed => {
   *   displayImage(processed);
   * })
   * .catch(err => {
   *   if(err.name === 'AbortError') {
   *     console.log('Processing was cancelled');
   *   } else {
   *     console.error('Processing error:', err);
   *   }
   * });
   *
   * // Cancel the task if needed
   * abortController.abort();
   * ```
   */
  execute<T>(task: () => T, options?: { signal?: AbortSignal }): Promise<T> {
    return new Promise((resolve, reject) => {
      const signal = options?.signal;

      // Handle pre-aborted task
      if (signal?.aborted) {
        reject(new DOMException("Task aborted", "AbortError"));
        return;
      }

      // Create the task
      const taskObj: WorkerTask<unknown> = {
        task: task as () => unknown,
        resolve: resolve as (value: unknown) => void,
        reject,
      };
      this.taskQueue.push(taskObj);

      // Handle abort signals
      if (signal) {
        const onAbort = (): void => {
          const index = this.taskQueue.indexOf(taskObj);
          if (index !== -1) {
            this.taskQueue.splice(index, 1);
            reject(new DOMException("Task aborted", "AbortError"));
          }
          signal.removeEventListener("abort", onAbort);
        };

        signal.addEventListener("abort", onAbort);
      }

      this.processQueue();
    });
  }

  /**
   * Abort all pending tasks and stop processing the queue
   * Tasks that are already running will continue until completion
   *
   * @returns {number} The number of tasks that were aborted
   *
   */
  abort(): number {
    this.abortController.abort();

    const pendingTasks = this.taskQueue.length;

    // Reject all pending tasks
    this.taskQueue.forEach((task) =>
      task.reject(new DOMException("All tasks aborted", "AbortError")),
    );

    this.taskQueue = [];

    // Create new abort controller for potential reuse
    this.abortController = new AbortController();

    return pendingTasks;
  }

  /**
   * Get the number of workers in the pool
   *
   * @returns {number} The number of workers
   *
   */
  get size(): number {
    return this.workers.length;
  }

  /**
   * Get the number of busy workers
   *
   * @returns {number} The number of busy workers
   *
   */
  get activeTasks(): number {
    return this.workers.length - this.availableWorkers.length;
  }

  /**
   * Get the number of pending tasks
   *
   * @returns {number} The number of pending tasks
   *
   */
  get pendingTasks(): number {
    return this.taskQueue.length;
  }

  /**
   * Terminate all workers and clear the task queue
   * This should be called when the pool is no longer needed
   *
   * @example Example usage
   * ```typescript
   * // When the application shuts down
   * useEffect(() => {
   *   return () => {
   *     workerPool.terminate();
   *   };
   * }, []);
   * ```
   */
  public terminate(): void {
    try {
      // Abort all pending tasks
      this.abort();

      // Terminate all workers
      this.workers.forEach((worker) => {
        try {
          if (typeof window !== "undefined") {
            // Use the window registry cleanup methods if available
            if (window.__WORKER_REGISTRY__) {
              window.__WORKER_REGISTRY__.delete(worker);
            }
          }
          worker.terminate();
        } catch (error) {
          console.warn("Error terminating worker:", error);
          if (this.errorHandler) {
            this.errorHandler(error);
          }
        }
      });
    } catch (error) {
      console.warn("Error during worker pool termination:", error);
      if (this.errorHandler) {
        this.errorHandler(error);
      }
    } finally {
      // Clean up resources regardless of errors
      this.workers = [];
      this.availableWorkers = [];
      this.taskQueue = [];
    }
  }
}
