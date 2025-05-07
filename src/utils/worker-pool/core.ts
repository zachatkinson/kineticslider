import { ErrorSeverity, ErrorType, BaseError, WorkerPoolError } from '../../types/error';
import type { WorkerPoolOptions, WorkerTask, WorkerPoolStats } from './types';
import { ErrorTracker } from './error-handling';
import { StatisticsTracker } from './statistics';
import { EventEmitter } from 'events';

export class WorkerPool extends EventEmitter {
  private workers: Worker[] = [];
  private availableWorkers: Worker[] = [];
  private taskQueue: WorkerTask[] = [];
  private workerMap = new Map<Worker, WorkerTask<any, any> | null>();
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

  constructor(options: WorkerPoolOptions) {
    super();
    if (!options.workerScript) {
      throw new Error('Worker script URL is required');
    }

    this.options = {
      maxWorkers: options.maxWorkers || navigator.hardwareConcurrency || 4,
      initialWorkers: options.initialWorkers || 0,
      workerScript: options.workerScript,
      timeout: options.timeout || 30000,
      errorHandler: options.errorHandler || this.defaultErrorHandler.bind(this)
    };

    this.errorTracker = new ErrorTracker();
    this.statsTracker = new StatisticsTracker();

    this.maxWorkers = this.options.maxWorkers;
  }

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

  private createWorker(): Worker {
    const worker = new Worker(this.options.workerScript);
    const workerId = this.workerIdCounter.toString();
    this.workerIdCounter++;
    this.workerIds.add(workerId);
    this.workers.push(worker);
    this.availableWorkers.push(worker);
    this.workerMap.set(worker, null);

    worker.addEventListener('message', this.handleWorkerMessage.bind(this));
    worker.addEventListener('error', this.handleWorkerError.bind(this));

    // Register worker with global registry
    if (typeof window !== 'undefined' && window.__WORKER_REGISTRY__) {
      window.__WORKER_REGISTRY__.add(worker);
    }

    return worker;
  }

  private handleWorkerMessage(event: MessageEvent): void {
    const worker = event.target as Worker;
    this.availableWorkers.push(worker);
    this.processQueue();
  }

  private handleWorkerError = (event: ErrorEvent): void => {
    const worker = event.target as Worker;
    const error = event.error || new Error(event.message);
    const errorTime = Date.now();
    const workerId = this.getWorkerId(worker);
    
    const workerError: WorkerPoolError = {
      name: error.name || 'Error',
      message: error.message || 'Unknown error',
      type: ErrorType.WORKER_POOL,
      workerId,
      error: error.message || 'Worker error occurred',
      timestamp: new Date(errorTime).toISOString(),
      operation: 'worker_pool',
      category: 'execution',
      stackTrace: error.stack || '',
      severity: ErrorSeverity.ERROR,
      code: 'WORKER_EXECUTION_ERROR',
      details: {
        taskId: this.currentTaskId,
        errorTime,
        workerId
      },
      toErrorInfo() {
        return {
          name: this.name,
          message: this.message,
          componentStack: this.stackTrace,
          stack: this.stackTrace || null,
          code: this.code,
          timestamp: this.timestamp,
          details: this.details
        };
      }
    };

    this.statsTracker.trackTaskFailure();
    this.emit('error', { error: workerError, worker });
    
    // Remove the worker from the pool and create a new one
    this.terminateWorker(worker);
    this.createWorker();
  }

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
    if (typeof window !== 'undefined' && window.__WORKER_REGISTRY__) {
      window.__WORKER_REGISTRY__.delete(worker);
    }
  }

  public async execute(task: WorkerTask): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    this.taskQueue.push(task);
    this.statsTracker.trackQueueSize(this.taskQueue.length);
    this.statsTracker.trackTaskStart(Date.now());

    await this.processQueue();
  }

  private async processQueue(): Promise<void> {
    while (this.taskQueue.length > 0 && this.availableWorkers.length > 0) {
      const task = this.taskQueue.shift()!;
      const worker = this.availableWorkers.shift()!;

      try {
        const startTime = Date.now();
        await worker.postMessage(task.data);
        const executionTime = Date.now() - startTime;
        this.statsTracker.trackTaskCompletion(executionTime);
      } catch (error) {
        this.statsTracker.trackTaskFailure();
        // Create an ErrorEvent from the caught error
        const errorEvent = new ErrorEvent('error', {
          error: error as Error,
          message: (error as Error).message,
          lineno: undefined,
          colno: undefined,
          filename: undefined
        });
        // Set the target to the current worker
        Object.defineProperty(errorEvent, 'target', { value: worker });
        this.handleWorkerError(errorEvent);
      }
    }

    // Create new worker if needed and queue is not empty
    if (this.taskQueue.length > 0 && this.workers.length < this.maxWorkers) {
      await this.createWorker();
      await this.processQueue();
    }
  }

  public getStatistics(): WorkerPoolStats {
    return this.statsTracker.calculateStats(
      this.workers.length,
      this.availableWorkers.length,
      this.taskQueue.length,
      this.maxWorkers
    );
  }

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

  private defaultErrorHandler(error: Error, context: { taskId?: string; operation?: string }): void {
    console.error('Worker pool error:', error, context);
  }

  public get size(): number {
    return this.workers.length;
  }

  public get available(): number {
    return this.availableWorkers.length;
  }

  public get pending(): number {
    return this.taskQueue.length;
  }

  private getWorkerId(worker: Worker): string {
    const workerId = Array.from(this.workerIds).find(id => 
      this.workers[parseInt(id, 10)] === worker
    ) || '';
    return workerId;
  }
} 