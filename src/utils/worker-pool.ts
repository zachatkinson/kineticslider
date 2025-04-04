/**
 * WorkerPool utility for managing Web Workers
 */

/**
 * Options for WorkerPool configuration
 * @example
 * ```ts
 * const options: WorkerPoolOptions = {
 *   maxWorkers: 4,
 *   workerScript: '/path/to/worker.js',
 *   initialWorkers: 2,
 *   timeout: 30000
 * };
 * ```
 */
export interface WorkerPoolOptions {
  /** Maximum number of workers in the pool */
  maxWorkers?: number;
  /** Path to the worker script */
  workerScript: string;
  /** Initial number of workers to create */
  initialWorkers?: number;
  /** Timeout for worker operations in ms */
  timeout?: number;
}

/**
 * Task to be executed by a worker
 * @example
 * ```ts
 * const task: WorkerTask<number[], number> = {
 *   id: '123',
 *   data: [1, 2, 3],
 *   resolve: (result) => console.log(result),
 *   reject: (error) => console.error(error)
 * };
 * ```
 */
export interface WorkerTask<TData = unknown, TResult = unknown> {
  /** Unique identifier for the task */
  id: string;
  /** Data to be passed to the worker */
  data: TData;
  /** Resolve function for the task promise */
  resolve: (value: TResult) => void;
  /** Reject function for the task promise */
  reject: (reason: Error | unknown) => void;
}

/**
 * Pool of Web Workers for distributed processing
 * @example
 * ```ts
 * const pool = new WorkerPool({
 *   workerScript: '/path/to/worker.js',
 *   maxWorkers: 4
 * });
 * 
 * // Execute a task
 * pool.execute({ action: 'process', data: [1, 2, 3] })
 *   .then(result => console.log(result))
 *   .catch(error => console.error(error));
 * 
 * // Terminate the pool when done
 * pool.terminate();
 * ```
 */
export class WorkerPool {
  private workers: Worker[] = [];
  private availableWorkers: Worker[] = [];
  private taskQueue: WorkerTask<unknown, unknown>[] = [];
  private options: Required<WorkerPoolOptions>;
  private workerMap = new Map<Worker, WorkerTask<unknown, unknown> | null>();

  /**
   * Creates a new WorkerPool
   * @param options Configuration options for the WorkerPool
   */
  constructor(options: WorkerPoolOptions) {
    this.options = {
      maxWorkers: (options.maxWorkers ?? navigator.hardwareConcurrency) || 4,
      workerScript: options.workerScript,
      initialWorkers: options.initialWorkers ?? 2,
      timeout: options.timeout ?? 30000,
    };

    this.initialize();
  }

  /**
   * Initialize the worker pool
   */
  private initialize(): void {
    const initialWorkers = Math.min(
      this.options.initialWorkers,
      this.options.maxWorkers
    );

    for (let i = 0; i < initialWorkers; i++) {
      this.createWorker();
    }
  }

  /**
   * Create a new worker and add it to the pool
   * @returns The newly created worker
   */
  private createWorker(): Worker {
    const worker = new Worker(this.options.workerScript);
    
    worker.onmessage = (event: MessageEvent) => {
      const task = this.workerMap.get(worker);
      if (task) {
        task.resolve(event.data);
        this.workerMap.set(worker, null);
        this.availableWorkers.push(worker);
        this.processQueue();
      }
    };

    worker.onerror = (error: ErrorEvent) => {
      const task = this.workerMap.get(worker);
      if (task) {
        task.reject(error);
        this.workerMap.set(worker, null);
        this.availableWorkers.push(worker);
        this.processQueue();
      }
    };

    this.workers.push(worker);
    this.availableWorkers.push(worker);
    this.workerMap.set(worker, null);
    
    return worker;
  }

  /**
   * Execute a task using the worker pool
   * @param data Data to be processed by a worker
   * @returns Promise that resolves with the worker result
   */
  execute<TData = unknown, TResult = unknown>(data: TData): Promise<TResult> {
    return new Promise((resolve, reject) => {
      const task: WorkerTask<TData, TResult> = {
        id: crypto.randomUUID(),
        data,
        resolve,
        reject,
      };

      this.taskQueue.push(task as WorkerTask<unknown, unknown>);
      this.processQueue();

      // Set timeout for task
      setTimeout(() => {
        const index = this.taskQueue.findIndex(t => t.id === task.id);
        if (index !== -1) {
          const task = this.taskQueue.splice(index, 1)[0];
          task.reject(new Error(`Task timed out after ${this.options.timeout}ms`));
        }
      }, this.options.timeout);
    });
  }

  /**
   * Process the task queue if workers are available
   */
  private processQueue(): void {
    if (this.taskQueue.length === 0 || this.availableWorkers.length === 0) {
      return;
    }

    const worker = this.availableWorkers.pop();
    const task = this.taskQueue.shift();

    if (worker && task) {
      this.workerMap.set(worker, task);
      worker.postMessage(task.data);
    }
  }

  /**
   * Terminate all workers in the pool
   * @returns Void
   */
  terminate(): void {
    for (const worker of this.workers) {
      worker.terminate();
    }

    this.workers = [];
    this.availableWorkers = [];
    this.taskQueue = [];
    this.workerMap.clear();
  }

  /**
   * Get the number of active workers
   * @returns The total number of workers in the pool
   */
  get size(): number {
    return this.workers.length;
  }

  /**
   * Get the number of available workers
   * @returns The number of idle workers ready for tasks
   */
  get available(): number {
    return this.availableWorkers.length;
  }

  /**
   * Get the number of pending tasks
   * @returns The count of tasks waiting to be processed
   */
  get pending(): number {
    return this.taskQueue.length;
  }
} 