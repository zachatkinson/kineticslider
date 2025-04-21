/**
 * WorkerPool utility for managing Web Workers
 */

import { ErrorSeverity, ErrorType, ExtendedError, SliderErrorInfo } from '../types/error';
import type { OperationError } from '../types/error';
import { trackError } from './error-tracking';

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
  workerScript?: string;
  /** Initial number of workers to create */
  initialWorkers?: number;
  /** Timeout for worker operations in ms */
  timeout?: number;
  /**
   * Custom error handler for worker errors
   */
  errorHandler?: (error: Error, context: { taskId?: string; operation?: string }) => void;
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
  /** Time when task was created */
  createdAt?: number;
  /** Priority of the task (higher value = higher priority) */
  priority?: number;
  /** Category of the task for analytics (optional) */
  category?: string;
  /** Timeout ID for the task */
  timeoutId?: ReturnType<typeof setTimeout>;
}

/**
 * Statistics for the WorkerPool
 */
export interface WorkerPoolStats {
  /** Total number of workers in the pool */
  totalWorkers: number;
  /** Number of available workers */
  availableWorkers: number;
  /** Number of busy workers */
  busyWorkers: number;
  /** Number of tasks waiting in queue */
  pendingTasks: number;
  /** Maximum configured workers */
  maxWorkers: number;
  /** Worker utilization percentage (0-100) */
  utilization: number;
  /** Total tasks completed successfully */
  completedTasks: number;
  /** Total tasks that failed */
  failedTasks: number;
  /** Average task execution time in ms */
  avgExecutionTime: number;
  /** Throughput (tasks per second) over the last minute */
  throughput: number;
  /** Peak number of queued tasks */
  peakQueueSize: number;
  /** Average wait time for tasks in queue (ms) */
  avgWaitTime: number;
  /** Task start timestamps (for tracking request patterns) */
  taskStartTimes: number[];
  /** Task queue length over time (samples) */
  queueSizeHistory: number[];
  /** Last time statistics were reset */
  lastResetTime: number;
  /** Performance percentiles for task execution times (p50, p90, p95, p99) */
  executionTimePercentiles: Record<string, number>;
  /** Performance percentiles for wait times (p50, p90, p95, p99) */
  waitTimePercentiles: Record<string, number>;
  /** Worker efficiency metrics showing execution time distribution by worker */
  workerEfficiency: Array<{
    workerId: string;
    tasksCompleted: number;
    totalExecutionTime: number;
    averageExecutionTime: number;
    errorRate: number;
  }>;
  /** Tasks completed per minute over time (last 10 minutes) */
  completionsOverTime: Record<string, number>;
  /** Error types and their frequencies */
  errorDistribution: Record<string, number>;
  /** Categories of tasks and their counts */
  taskCategories: Record<string, number>;
  /** Performance metrics by task category */
  categoryPerformance: {
    category: string;
    count: number;
    avgExecutionTime: number;
    successRate: number;
  }[];
  /** Concurrent task execution metrics */
  concurrencyMetrics: {
    avgConcurrentTasks: number;
    peakConcurrentTasks: number;
    concurrencyTimestamps: Array<{timestamp: number, concurrentTasks: number}>;
  };
  /** Memory usage estimates (if available) */
  memoryMetrics?: {
    estimatedMemoryUsage: number;
    peakMemoryUsage: number;
  };
  /** Error trend analysis over time */
  errorTrends: {
    daily: { [key: string]: number };
    weekly: { [key: string]: number };
    monthly: { [key: string]: number };
    rateChangePercent?: number;
    trend?: 'increasing' | 'decreasing' | 'stable';
  };
  /** Detailed error diagnostics for debugging */
  errorDiagnostics: {
    /** Correlation between concurrent tasks and error rates */
    concurrencyCorrelation: number;
    /** Correlation between queue size and error rates */
    queueSizeCorrelation: number;
    /** Most error-prone workers (if identifiable) */
    errorProneWorkers: Array<{ workerId: string; errorCount: number }>;
    /** Most common error stack traces (patterns) */
    commonErrorPatterns: Array<{ pattern: string; count: number }>;
  };
  /** Distribution of errors by severity */
  errorSeverityDistribution: Record<ErrorSeverity, number>;
  /** Distribution of errors by category */
  errorCategoryDistribution: Record<string, number>;
  /** Distribution of errors by type */
  errorTypeDistribution: Record<string, number>;
  /** Workers with error statistics */
  workerErrors: Array<{ workerId: string; errorCount: number }>;
  /** Most error-prone workers by ID and count */
  errorProneWorkerIds: Array<{ workerId: string; errorCount: number }>;
  errorCount: number;
  errorTypes: { [key in ErrorType]: number };
  errorSeverities: { [key in ErrorSeverity]: number };
  errorCounts: { [key in ErrorType]: number };
  severityCounts: { [key in ErrorSeverity]: number };
  dailyTrends: { [date: string]: number };
}

export interface ErrorStats {
  type: string;
  count: number;
  lastOccurred: number;
  standardCategory?: string;
}

export interface ErrorDetail {
  message: string;
  type: string;
  timestamp: number;
  stackTrace?: string;
  severity: ErrorSeverity;
}

interface BaseError extends Omit<ExtendedError, 'timestamp' | 'type' | 'severity'> {
  timestamp: string;
  type: ErrorType;
  severity: ErrorSeverity;
}

interface WorkerPoolError extends BaseError {
  workerId: string;
  error: Error | string;
  operation: string;
  category: string;
  stackTrace: string;
}

interface ErrorDiagnostics {
  concurrencyCorrelation: number;
  queueSizeCorrelation: number;
  errorProneWorkers: Array<{ workerId: string; errorCount: number }>;
  commonErrorPatterns: Array<{ pattern: string; count: number }>;
}

// Define missing interfaces
export interface WorkerPerformanceMetric {
  workerId: string;
  tasksCompleted: number;
  totalExecutionTime: number;
  averageExecutionTime: number;
  errorRate: number;
}

export interface TaskTimeSeriesData {
  timestamp: string;
  count: number;
}

export interface ErrorDistributionData {
  category: string;
  count: number;
  percentage: number;
  lastOccurred: number;
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
  private taskQueue: WorkerTask[] = [];
  private availableWorkers: Worker[] = [];
  private workers: Worker[] = [];
  private errorTypeDistribution: Map<string, number> = new Map();
  private errorSeverityCounts: Map<string, number> = new Map();
  private errorCauseAnalysis: Record<string, number> = {};
  private lastErrors: WorkerPoolError[] = [];
  private operationErrorCounts: Map<string, number> = new Map();
  private errorTimeDistribution: Map<string, number> = new Map();
  private options: Required<WorkerPoolOptions>;
  private workerMap = new Map<Worker, WorkerTask<unknown, unknown> | null>();
  
  // Statistics tracking
  private completedTasks = 0;
  private failedTasks = 0;
  private executionTimes: number[] = [];
  private peakQueueSize = 0;
  private waitTimes: number[] = [];
  private completionTimestamps: number[] = [];
  private taskStartTimes: number[] = [];
  private queueSizeHistory: number[] = [];
  private lastResetTime = Date.now();
  private queueSizeSamplingInterval: ReturnType<typeof setInterval> | null = null;
  
  // Additional statistics tracking
  private workerPerformance: Map<string, {
    tasksCompleted: number;
    totalExecutionTime: number;
    averageExecutionTime?: number;
  }> = new Map();
  private workerIdCounter = 0;
  private workerIds: Map<Worker, string> = new Map();
  private errorCounts: Record<string, number> = {};
  private minutelyCompletions: Record<string, number> = {};
  private lastMinuteTimestamp = Date.now();
  private errorHandler: Required<WorkerPoolOptions>['errorHandler'];
  
  private taskCategories: Map<string, number> = new Map();
  private categoryExecutionTimes: Map<string, number[]> = new Map();
  private categorySuccessRates: Map<string, {success: number, total: number}> = new Map();
  private concurrentTasksHistory: Array<{timestamp: number, concurrentTasks: number}> = [];
  private currentConcurrentTasks = 0;
  private peakConcurrentTasks = 0;
  private estimatedMemoryUsage = 0;
  private peakMemoryUsage = 0;
  private memoryUpdateInterval: ReturnType<typeof setInterval> | null = null;
  private memoryUsageSamples: number[] = [];
  private lastMemorySampleTime: number = 0;
  
  // New fields for enhanced error tracking
  private taskRetryAttempts: Map<string, number> = new Map();
  private taskRetrySuccesses = 0;
  private taskPermanentFailures = 0;
  private dailyErrorCounts: Record<string, number> = {};
  private lastErrorSpike: number | null = null;
  private errorRateHistory: Array<{timestamp: number, count: number}> = [];
  private workerErrorCounts: Map<string, number> = new Map();
  private errorStackPatterns: Map<string, number> = new Map();
  
  private errorsByType: Map<string, ErrorStats> = new Map();
  
  /** Map to track errors by categories */
  private categoryErrorCounts: Map<string, number> = new Map();
  
  private _errorDistribution = new Map<string, number>();
  private workerErrorStats = new Map<string, {
    totalErrors: number;
    lastError: number;
    categories: Record<string, number>;
  }>();
  private activeWorkers = 0;
  private errorStats: ErrorStats = {
    type: '',
    count: 0,
    lastOccurred: 0
  };
  
  private errorTrends: WorkerPoolStats['errorTrends'] = {
    daily: {},
    weekly: {},
    monthly: {}
  };

  private errorCategoryDistribution = new Map<string, number>();
  
  /**
   * Creates a new WorkerPool
   * @param options Configuration options for the WorkerPool
   */
  constructor(options: WorkerPoolOptions = {}) {
    // Validate required workerScript
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
    
    // Set the error handler with default fallback
    this.errorHandler = this.options.errorHandler;
    
    this.initialize();
    
    // Start queue size sampling - only if not in test environment
    if (process.env.NODE_ENV !== 'test') {
      this.startStatisticsCollection();
    }
  }

  private startStatisticsCollection(): void {
    // Start queue size sampling
    this.queueSizeSamplingInterval = setInterval(() => {
      this.queueSizeHistory.push(this.taskQueue.length);
      // Keep history to a reasonable size
      if (this.queueSizeHistory.length > 100) {
        this.queueSizeHistory.shift();
      }
      
      // Track minutely completions
      const now = Date.now();
      if (now - this.lastMinuteTimestamp >= 60000) {
        const completionCount = this.completionTimestamps.filter(
          ts => ts >= this.lastMinuteTimestamp && ts <= now
        ).length;
        
        this.minutelyCompletions[now] = completionCount;
        
        // Keep only last 10 minutes
        if (Object.keys(this.minutelyCompletions).length > 10) {
          const oldestMinute = Math.min(...Object.keys(this.minutelyCompletions).map(Number));
          delete this.minutelyCompletions[oldestMinute];
        }
        
        this.lastMinuteTimestamp = now;
      }
    }, 5000); // Sample every 5 seconds
    
    // Set up memory monitoring if performance.memory is available
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      this.memoryUpdateInterval = setInterval(() => {
        this.updateMemoryUsage();
      }, 5000); // Check every 5 seconds
    }
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
   * @private
   */
  private createWorker(): Worker {
    const worker = new Worker(this.options.workerScript);
    const workerId = this.initializeWorker(worker);

    worker.addEventListener("message", (event) => {
      if (!this.workerMap.has(worker)) {
        return;
      }

      const task = this.workerMap.get(worker);
      if (!task) {
        this.workerMap.delete(worker);
        this.availableWorkers.push(worker);
        this.processQueue();
        return;
      }

      this.completedTasks++; // Track completed task
      
      // Calculate execution time
      const executionTime = Date.now() - (task.createdAt || Date.now());
      this.executionTimes.push(executionTime);
      // Keep only the last 100 execution times for memory efficiency
      if (this.executionTimes.length > 100) {
        this.executionTimes.shift();
      }
      
      // Update worker-specific statistics
      const workerStats = this.workerPerformance.get(workerId) || { tasksCompleted: 0, totalExecutionTime: 0 };
      workerStats.tasksCompleted++;
      workerStats.totalExecutionTime += executionTime;
      workerStats.averageExecutionTime = workerStats.tasksCompleted > 0 ? workerStats.totalExecutionTime / workerStats.tasksCompleted : 0;
      this.workerPerformance.set(workerId, workerStats);
      
      // Track errors if this is an error response
      if (event.data?.error) {
        this.workerErrorCounts.set(workerId, (this.workerErrorCounts.get(workerId) || 0) + 1);
      }
      
      // Record completion timestamp for throughput calculation
      this.completionTimestamps.push(Date.now());
      // Keep only the last 100 completion timestamps
      if (this.completionTimestamps.length > 100) {
        this.completionTimestamps.shift();
      }

      this.workerMap.delete(worker);
      this.availableWorkers.push(worker);
      task.resolve(event.data);
      this.processQueue();

      // Sample memory usage if the worker reports it
      if (event.data.memoryUsage) {
        this.trackMemoryUsage(event.data.memoryUsage);
      }
    });

    worker.addEventListener("error", (event) => {
      if (!this.workerMap.has(worker)) {
        return;
      }

      const task = this.workerMap.get(worker);
      if (!task) {
        this.workerMap.delete(worker);
        this.availableWorkers.push(worker);
        this.processQueue();
        return;
      }

      this.failedTasks++; // Track failed task
      
      // Create comprehensive error with context
      const workerError = new Error(`Worker error: ${event.message}`);
      const sliderError = this.captureErrorWithContext(workerError, task.id, 'worker');
      
      // Update worker-specific error counts
      const workerId = this.workerIds.get(worker) || 'unknown';
      this.workerErrorCounts.set(workerId, (this.workerErrorCounts.get(workerId) || 0) + 1);
      
      // Categorize the error
      const errorCategory = this.categorizeError(sliderError);
      if (!this.categoryErrorCounts.has(errorCategory)) {
        this.categoryErrorCounts.set(errorCategory, 0);
      }
      this.categoryErrorCounts.set(
        errorCategory, 
        this.categoryErrorCounts.get(errorCategory)! + 1
      );
      
      this.workerMap.delete(worker);
      this.availableWorkers.push(worker);
      task.reject(sliderError);
      this.processQueue();
    });

    this.workers.push(worker);
    this.availableWorkers.push(worker);
    this.workerMap.set(worker, null);
    
    // Register worker with global registry
    if (typeof window !== 'undefined' && window.__WORKER_REGISTRY__) {
      window.__WORKER_REGISTRY__.add(worker);
    }
    
    return worker;
  }

  /**
   * Initialize worker-specific statistics
   * @param worker The worker to initialize
   * @returns The worker ID
   */
  private initializeWorker(worker: Worker): string {
    const workerId = `worker-${this.workerIdCounter++}`;
    this.workerIds.set(worker, workerId);
    this.workerPerformance.set(workerId, { 
      tasksCompleted: 0, 
      totalExecutionTime: 0
    });
    this.workerErrorCounts.set(workerId, 0);
    return workerId;
  }

  /**
   * Execute a task using the worker pool
   * @param data Data to be processed by a worker
   * @param priority Optional task priority (higher value = higher priority)
   * @param category Optional task category for analytics
   * @returns Promise that resolves with the worker result
   */
  public async execute<T = any, R = any>(data: T, priority = 0, category?: string): Promise<R> {
    return new Promise<R>((resolve, reject) => {
      const now = Date.now();
      
      // Track task start time
      this.taskStartTimes.push(now);
      // Keep history to a reasonable size
      if (this.taskStartTimes.length > 1000) {
        this.taskStartTimes.shift();
      }
      
      const task: WorkerTask<T, R> = {
        id: crypto.randomUUID(),
        data,
        resolve,
        reject,
        createdAt: now,
        priority,
        category
      };

      // Track task category if provided
      if (category) {
        this.taskCategories.set(category, (this.taskCategories.get(category) || 0) + 1);
        
        // Initialize category tracking if it doesn't exist
        if (!this.categoryExecutionTimes.has(category)) {
          this.categoryExecutionTimes.set(category, []);
        }
        
        if (!this.categorySuccessRates.has(category)) {
          this.categorySuccessRates.set(category, {success: 0, total: 0});
        }
        
        // Increment total for this category
        const currentStats = this.categorySuccessRates.get(category)!;
        currentStats.total++;
        this.categorySuccessRates.set(category, currentStats);
      }
      
      // Insert the task based on priority
      if (priority > 0 && this.taskQueue.length > 0) {
        const index = this.taskQueue.findIndex(t => (t.priority || 0) < priority);
        if (index !== -1) {
          this.taskQueue.splice(index, 0, task as WorkerTask<unknown, unknown>);
        } else {
          this.taskQueue.push(task as WorkerTask<unknown, unknown>);
        }
      } else {
        this.taskQueue.push(task as WorkerTask<unknown, unknown>);
      }
      
      // Update peak queue size if necessary
      if (this.taskQueue.length > this.peakQueueSize) {
        this.peakQueueSize = this.taskQueue.length;
      }
      
      this.processQueue();

      // Add timeout handling if specified
      let timeoutId: NodeJS.Timeout | undefined;
      if (this.options.timeout) {
        timeoutId = setTimeout(() => {
          // Check if the task is still in the workerMap
          let worker: Worker | undefined;
          for (const [w, t] of this.workerMap.entries()) {
            if (t && t.id === task.id) {
              worker = w;
              break;
            }
          }
          
          if (!worker) return; // Task already completed
          
          // Create timeout error with full context
          const timeoutError = new Error(`Task ${task.id} timed out after ${this.options.timeout}ms`);
          const sliderError = this.captureErrorWithContext(timeoutError, task.id, 'timeout');
          
          // Clean up
          this.workerMap.delete(worker);
          this.availableWorkers.push(worker);
          this.failedTasks++;
          
          // Track error by category
          const errorType = 'timeout';
          this.errorCounts[errorType] = (this.errorCounts[errorType] || 0) + 1;
          
          // Reject the task with the enhanced error
          reject(sliderError);
        }, this.options.timeout);
      }

      // Update concurrent tasks metrics
      this.currentConcurrentTasks = this.workers.length - this.availableWorkers.length;
      this.peakConcurrentTasks = Math.max(this.peakConcurrentTasks, this.currentConcurrentTasks);
      this.concurrentTasksHistory.push({
        timestamp: Date.now(),
        concurrentTasks: this.currentConcurrentTasks
      });
      
      // Limit history size to avoid memory leaks
      if (this.concurrentTasksHistory.length > 100) {
        this.concurrentTasksHistory = this.concurrentTasksHistory.slice(-100);
      }
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
      // Track when task was assigned to a worker
      (worker as any).__assignedTime = Date.now();
      this.workerMap.set(worker, task);
      worker.postMessage(task.data);
      
      // Track when a worker picks up a task for concurrency metrics
      this.currentConcurrentTasks = this.workers.length - this.availableWorkers.length;
      this.concurrentTasksHistory.push({
        timestamp: Date.now(),
        concurrentTasks: this.currentConcurrentTasks
      });
    }
  }

  /**
   * Terminate all workers in the pool
   * @returns Void
   */
  terminate(): void {
    try {
      // Clear all intervals first
      if (this.queueSizeSamplingInterval) {
        clearInterval(this.queueSizeSamplingInterval);
        this.queueSizeSamplingInterval = null;
      }
      
      if (this.memoryUpdateInterval) {
        clearInterval(this.memoryUpdateInterval);
        this.memoryUpdateInterval = null;
      }
      
      // Clear task queue and any scheduled timeouts
      this.taskQueue.forEach(task => {
        if (task.timeoutId) {
          clearTimeout(task.timeoutId);
        }
        
        // Create termination error with full context
        const terminationError = new Error('WorkerPool termination: pending task cancelled');
        const workerPoolError = this.captureErrorWithContext(
          terminationError, 
          task.id, 
          'termination'
        );
        
        task.reject(workerPoolError);
      });
      this.taskQueue = [];
      
      // Terminate each worker and remove from the global registry
      this.workers.forEach(worker => {
        try {
          worker.terminate();
          // Remove from global registry if it exists
          if (typeof window !== 'undefined' && window.__WORKER_REGISTRY__) {
            window.__WORKER_REGISTRY__.delete(worker);
          }
        } catch (e) {
          console.error('Error terminating worker:', e);
        }
      });
      
      // Clear arrays and maps
      this.workers = [];
      this.availableWorkers = [];
      this.workerMap.clear();
      if (this.workerPerformance) {
        this.workerPerformance.clear();
      }
      this.workerIds.clear();
    } catch (error) {
      // Capture the termination error with context
      const workerPoolError = this.captureErrorWithContext(
        error instanceof Error ? error : new Error(String(error)),
        undefined,
        'termination'
      );
      
      console.error('Error during WorkerPool termination:', workerPoolError);
    }
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

  /**
   * Calculate percentiles from an array of numbers
   * @param values Array of values to calculate percentiles from
   * @param percentiles Array of percentiles to calculate (0-1)
   * @returns Object with percentile keys and values
   */
  private calculatePercentiles(values: number[]): { p50: number; p90: number; p95: number; p99: number } {
    if (values.length === 0) {
      return { p50: 0, p90: 0, p95: 0, p99: 0 };
    }
    
    const sorted = [...values].sort((a, b) => a - b);
    
    return {
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p90: sorted[Math.floor(sorted.length * 0.9)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }

  /**
   * Get comprehensive statistics about the worker pool
   * @returns Statistics about the worker pool including utilization
   */
  getStatistics(): WorkerPoolStats {
    const totalWorkers = this.size;
    const availableWorkers = this.available;
    const busyWorkers = totalWorkers - availableWorkers;
    const pendingTasks = this.pending;
    const maxWorkers = this.options.maxWorkers;
    const utilization = totalWorkers > 0 ? (busyWorkers / totalWorkers) * 100 : 0;

    // Calculate average execution time
    const avgExecutionTime = this.executionTimes.length > 0
      ? this.executionTimes.reduce((sum, time) => sum + time, 0) / this.executionTimes.length
      : 0;

    // Calculate average wait time
    const avgWaitTime = this.waitTimes.length > 0
      ? this.waitTimes.reduce((sum, time) => sum + time, 0) / this.waitTimes.length
      : 0;

    // Calculate throughput (tasks per second over the last minute)
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentCompletions = this.completionTimestamps.filter(timestamp => timestamp > oneMinuteAgo);
    const throughput = recentCompletions.length / 60; // Tasks per second

    // Calculate execution time percentiles
    const executionPercentiles = this.calculatePercentiles(this.executionTimes);
    const waitPercentiles = this.calculatePercentiles(this.waitTimes);

    // Get worker efficiency metrics
    const workerEfficiency: Array<{
      workerId: string;
      tasksCompleted: number;
      totalExecutionTime: number;
      averageExecutionTime: number;
      errorRate: number;
    }> = Array.from(this.workerPerformance.entries())
      .map(([id, data]) => {
        const errorCount = this.workerErrorCounts.get(id) ?? 0;
        return {
          workerId: id,
          tasksCompleted: data.tasksCompleted,
          totalExecutionTime: data.totalExecutionTime,
          averageExecutionTime: data.tasksCompleted > 0 ? data.totalExecutionTime / data.tasksCompleted : 0,
          errorRate: data.tasksCompleted > 0 ? errorCount / data.tasksCompleted : 0
        };
      });
    
    // Format the task completions over time
    const completionsOverTime: Record<string, number> = Object.fromEntries(
      Object.entries(this.minutelyCompletions)
    );
    
    // Compile the error distribution
    const errorDistribution: Record<string, number> = Object.fromEntries(
      this._errorDistribution.entries()
    );
    
    // Format error time distribution
    const errorTimeSeries: Record<string, number> = Object.fromEntries(
      this.errorTimeDistribution.entries()
    );
    
    // Collect error data by standard categories
    const errorCategories: Record<string, number> = Object.fromEntries(
      this.categoryErrorCounts.entries()
    );
    
    // Get workers sorted by error count
    const workersByError: Array<{
      workerId: string;
      errorCount: number;
    }> = Array.from(this.workerErrorCounts.entries())
      .map(([workerId, count]) => ({ workerId, errorCount: count }))
      .sort((a, b) => b.errorCount - a.errorCount)
      .slice(0, 5);
    
    // Get common error patterns
    const errorPatterns: Array<{
      pattern: string;
      count: number;
    }> = Array.from(this.errorStackPatterns.entries())
      .map(([pattern, count]) => ({ pattern, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Format error severity counts
    const errorSeverityCount: Record<string, number> = {};
    this.errorSeverityCounts.forEach((count, severity) => {
      errorSeverityCount[severity] = count;
    });
    
    // Return comprehensive statistics
    const stats: WorkerPoolStats = {
      totalWorkers,
      availableWorkers,
      busyWorkers,
      pendingTasks,
      maxWorkers,
      utilization,
      completedTasks: this.completedTasks,
      failedTasks: this.failedTasks,
      avgExecutionTime,
      throughput,
      peakQueueSize: this.peakQueueSize,
      avgWaitTime,
      taskStartTimes: [...this.taskStartTimes],
      queueSizeHistory: [...this.queueSizeHistory],
      lastResetTime: this.lastResetTime,
      executionTimePercentiles: executionPercentiles,
      waitTimePercentiles: waitPercentiles,
      workerEfficiency,
      completionsOverTime,
      errorDistribution,
      errorCategories,
      errorTimeSeries,
      errorSeverityCount,
      lastErrors: this.lastErrors,
      errorsByCategory: Object.fromEntries(this.categoryErrorCounts.entries()),
      errorsByOperation: Object.fromEntries(this.operationErrorCounts.entries()),
      workersByError,
      errorPatterns,
      errorRecoveryMetrics: {
        retriedTasksSuccess: this.taskRetrySuccesses,
        avgRetriesToSuccess: this.calculateAvgRetriesToSuccess(),
        permanentFailures: this.taskPermanentFailures,
        recoveryTimeFromLastSpike: this.calculateRecoveryTime() || 0
      },
      errorTrends: {
        daily: { ...this.dailyErrorCounts },
        weekly: [],
        monthly: []
      },
      errorDiagnostics: {
        concurrencyCorrelation: this.calculateErrorConcurrencyCorrelation(),
        queueSizeCorrelation: this.calculateErrorQueueSizeCorrelation(),
        errorProneWorkers: this.getErrorProneWorkers(),
        commonErrorPatterns: this.getCommonErrorPatterns()
      },
      errorCauseDistribution: { ...this.errorCauseAnalysis },
      errors: this.getErrorStats(),
      errorDiagnostics: {
        concurrencyCorrelation: this.calculateErrorConcurrencyCorrelation(),
        queueSizeCorrelation: this.calculateErrorQueueSizeCorrelation(),
        errorProneWorkers: this.getErrorProneWorkers(),
        commonErrorPatterns: this.getCommonErrorPatterns()
      },
      workerErrors: Array.from(this.workerErrorStats.entries())
        .map(([workerId, stats]) => ({ workerId, errorCount: stats.totalErrors })),
      errorPatterns: Array.from(this.errorStackPatterns.entries())
        .map(([pattern, count]) => ({ pattern, count }))
    };

    return stats;
  }

  /**
   * Reset all statistics counters
   */
  resetStatistics(): void {
    this.completedTasks = 0;
    this.failedTasks = 0;
    this.executionTimes = [];
    this.peakQueueSize = this.taskQueue.length;
    this.waitTimes = [];
    this.completionTimestamps = [];
    this.taskStartTimes = [];
    this.queueSizeHistory = [this.taskQueue.length];
    this.lastResetTime = Date.now();
    
    // Reset additional statistics
    this.workers.forEach(worker => {
      this.workerPerformance.set(this.workerIds.get(worker) || '', { tasksCompleted: 0, totalExecutionTime: 0 });
    });
    this.errorCounts = {};
    this.minutelyCompletions = {};
    this.lastMinuteTimestamp = Date.now();
    
    // Reset additional metrics
    this.taskCategories.clear();
    this.categoryExecutionTimes.clear();
    this.categorySuccessRates.clear();
    this.concurrentTasksHistory = [{
      timestamp: Date.now(),
      concurrentTasks: this.workers.length - this.availableWorkers.length
    }];
    this.currentConcurrentTasks = this.workers.length - this.availableWorkers.length;
    this.peakConcurrentTasks = this.currentConcurrentTasks;
    this.estimatedMemoryUsage = 0;
    this.peakMemoryUsage = 0;
    this.memoryUsageSamples = [];
    this.lastMemorySampleTime = 0;
    this.errorTypeDistribution = new Map();
    
    this.errorSeverityCounts = new Map();
    
    this.lastErrors = [];
    
    // Reset enhanced error tracking
    this.taskRetryAttempts.clear();
    this.taskRetrySuccesses = 0;
    this.taskPermanentFailures = 0;
    this.errorRateHistory = [];
    this.lastErrorSpike = null;
    this.workerErrorCounts.clear();
    this.errorStackPatterns.clear();
    this.errorCauseAnalysis = {};
    
    // Reset daily buckets
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
      this.dailyErrorCounts[dateKey] = 0;
    }
    
    this.errorsByType.clear();
    this.errorTimeDistribution = new Map();
    this.errorCauseAnalysis = {};
    this.errorSeverityCounts = new Map();
    this.operationErrorCounts = new Map();
    this.lastErrors = [];

    // Re-initialize error severity counters
    Object.values(ErrorSeverity).forEach(severity => {
      if (typeof severity === 'string') {
        this.errorSeverityCounts.set(severity as ErrorSeverity, 0);
      }
    });

    // Reset error tracking
    this.errorTypeDistribution.clear();
    this.errorSeverityCounts.clear();
    this.categoryErrorCounts.clear();
    this.operationErrorCounts.clear();
    this.errorTimeDistribution.clear();
    this._errorDistribution.clear();
    this.lastErrors = [];
    this.workerErrorCounts.clear();
    
    // Re-initialize error tracking
    this.initializeErrorTracking();
  }

  /**
   * Get the average execution time of tasks in milliseconds
   * @returns The average execution time or 0 if no tasks have been executed
   */
  private getAverageExecutionTime(): number {
    if (this.executionTimes.length === 0) return 0;
    const sum = this.executionTimes.reduce((acc, time) => acc + time, 0);
    return Math.round(sum / this.executionTimes.length);
  }

  /**
   * Get the throughput in tasks per second based on recent completions
   * @returns The throughput in tasks per second
   */
  public get throughput(): number {
    if (this.completionTimestamps.length < 2) return 0;
    
    const now = Date.now();
    const timeframe = 60000; // 1 minute in ms
    const recentTimestamps = this.completionTimestamps.filter(
      timestamp => now - timestamp < timeframe
    );
    
    if (recentTimestamps.length < 2) return 0;
    
    // Calculate tasks per second
    const oldestTimestamp = Math.min(...recentTimestamps);
    const timeRange = (now - oldestTimestamp) / 1000; // in seconds
    return recentTimestamps.length / timeRange;
  }

  /**
   * Get the success rate of task execution
   * @returns The success rate as a number between 0 and 1
   */
  public get successRate(): number {
    const totalTasks = this.completedTasks + this.failedTasks;
    if (totalTasks === 0) return 1; // No failures if no tasks
    return this.completedTasks / totalTasks;
  }
  
  /**
   * Get the current worker efficiency data
   * @returns Information about worker performance
   */
  public get workerMetrics(): { workerId: string, tasksCompleted: number, avgExecutionTime: number }[] {
    return Array.from(this.workerPerformance.entries()).map(([worker, stats]) => {
      const workerId = this.workerIds.get(worker) || "unknown";
      return {
        workerId,
        tasksCompleted: stats.tasksCompleted,
        avgExecutionTime: stats.tasksCompleted > 0 
          ? stats.totalExecutionTime / stats.tasksCompleted 
          : 0
      };
    });
  }
  
  /**
   * Get the distribution of error types
   * @returns Object mapping error types to their occurrence counts
   */
  public get errorDistribution(): Record<string, number> {
    const distribution: Record<string, number> = {};
    this._errorDistribution.forEach((count, type) => {
      distribution[type] = count;
    });
    return distribution;
  }

  private updateMemoryUsage(): void {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memoryInfo = (performance as any).memory;
      
      // Rough estimate based on heap size divided by total workers
      // This is approximate and depends on browser implementation
      if (this.workers.length > 0 && memoryInfo.usedJSHeapSize) {
        this.estimatedMemoryUsage = Math.round(memoryInfo.usedJSHeapSize / (1024 * 1024)); // MB
        this.peakMemoryUsage = Math.max(this.peakMemoryUsage, this.estimatedMemoryUsage);
      }
    }
  }

  /**
   * Get statistics for a specific task category
   * @param category The category to get statistics for
   * @returns Performance metrics for the requested category or null if no data
   */
  public getCategoryMetrics(category: string): {
    count: number;
    avgExecutionTime: number;
    successRate: number;
  } | null {
    if (!this.taskCategories.has(category)) {
      return null;
    }
    
    const count = this.taskCategories.get(category) || 0;
    const executionTimes = this.categoryExecutionTimes.get(category) || [];
    const avgExecTime = executionTimes.length > 0
      ? executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length
      : 0;
      
    const successRateData = this.categorySuccessRates.get(category) || {success: 0, total: 0};
    const successRate = successRateData.total > 0
      ? successRateData.success / successRateData.total
      : 1;
      
    return {
      count,
      avgExecutionTime: avgExecTime,
      successRate
    };
  }
  
  /**
   * Get memory usage metrics for the worker pool
   * @returns Memory usage statistics if available, or null if not supported
   */
  public getMemoryMetrics(): { current: number, peak: number } | null {
    if (typeof performance === 'undefined' || !(performance as any).memory) {
      return null;
    }
    
    return {
      current: this.estimatedMemoryUsage,
      peak: this.peakMemoryUsage
    };
  }
  
  /**
   * Get concurrency metrics for the worker pool
   * @returns Metrics about concurrent task execution
   */
  public getConcurrencyMetrics(): {
    current: number,
    peak: number,
    average: number
  } {
    const concurrentTasksData = this.concurrentTasksHistory.map(item => item.concurrentTasks);
    const average = concurrentTasksData.length > 0
      ? concurrentTasksData.reduce((sum, count) => sum + count, 0) / concurrentTasksData.length
      : 0;
      
    return {
      current: this.currentConcurrentTasks,
      peak: this.peakConcurrentTasks,
      average
    };
  }

  /**
   * Default error handler for worker errors
   */
  private defaultErrorHandler(error: Error, context: { taskId?: string; operation?: string }): void {
    console.error(`WorkerPool error in ${context.operation}:`, error);
    
    // Create an error object with worker-specific metadata
    const workerError = new Error(error.message) as Error & {
      type: ErrorType;
      severity: ErrorSeverity;
      timestamp: number;
      details: {
        operation: string;
        context: { taskId: string | undefined };
      };
    };
    
    workerError.type = ErrorType.OPERATION;
    workerError.severity = ErrorSeverity.ERROR;
    workerError.timestamp = Date.now();
    workerError.details = {
      operation: context.operation,
      context: { taskId: context.taskId }
    };
    
    this.recordError(workerError);
    
    // Track in error counts
    const errorKey = error.message || 'UnknownError';
    this.errorCounts[errorKey] = (this.errorCounts[errorKey] || 0) + 1;
  }

  /**
   * Track memory usage from worker reports
   * @param memoryUsage Memory usage value in bytes
   */
  private trackMemoryUsage(memoryUsage: number): void {
    const now = Date.now();
    this.memoryUsageSamples.push(memoryUsage);
    
    // Keep samples from the last hour
    const oneHourAgo = now - 60 * 60 * 1000;
    this.memoryUsageSamples = this.memoryUsageSamples.filter(
      (_, i, arr) => i > arr.length - 100 || i >= this.memoryUsageSamples.length - 1000
    );
    
    // Update peak memory
    if (memoryUsage > this.peakMemoryUsage) {
      this.peakMemoryUsage = memoryUsage;
    }
    
    this.lastMemorySampleTime = now;
  }

  /**
   * Handle task error with enhanced diagnostics
   */
  private handleTaskError(error: Error, taskId: string): void {
    // Determine error type and severity with enhanced type checking
    let errorType: ErrorType = ErrorType.OPERATION;
    let severity: ErrorSeverity = ErrorSeverity.ERROR;
    
    // Check if error has type and severity properties
    if ('type' in error && error.type) {
      // Handle both string and enum types
      if (typeof error.type === 'string') {
        // Check if the string error type exists in ErrorType enum
        const matchedType = Object.values(ErrorType).find(t => t === error.type);
        errorType = matchedType ? matchedType as ErrorType : ErrorType.OPERATION;
      } else {
        errorType = error.type as ErrorType;
      }
    }
    
    if ('severity' in error && error.severity) {
      severity = error.severity as ErrorSeverity;
    }
    
    // Create enhanced error context
    const errorContext = {
      taskId,
      component: 'WorkerPool',
      operationTime: Date.now(),
      queueSize: this.taskQueue.length,
      workerCount: this.workers.length,
      availableWorkers: this.availableWorkers.length
    };
    
    // Track error in distribution
    this.errorTypeDistribution.set(String(errorType), (this.errorTypeDistribution.get(String(errorType)) || 0) + 1);
    this.errorSeverityCounts.set(String(severity), (this.errorSeverityCounts.get(String(severity)) || 0) + 1);
    
    // Store recent errors (keep last 10) with enhanced context
    this.lastErrors.unshift({
      type: String(errorType),
      message: error.message,
      timestamp: Date.now(),
      stackTrace: error.stack || '',
      severity: String(severity),
      category: 'general',
      stack: error.stack
    });
    
    if (this.lastErrors.length > 10) {
      this.lastErrors.pop();
    }
    
    // Create a standardized OperationError for consistency
    const operationError: OperationError = {
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
      type: errorType,
      severity,
      details: {
        operation: 'workerExecution',
        input: taskId,
        context: errorContext
      }
    };
    
    // Track in global error tracking if available
    if (typeof window !== 'undefined') {
      // First try the application's trackError function
      if (typeof (window as any).trackError === 'function') {
        (window as any).trackError(operationError, errorType, { component: 'WorkerPool', taskId });
      } else {
        // If not available, use the custom error handler
        this.errorHandler(error, { taskId, operation: 'workerExecution' });
      }
    } else {
      // Fallback to the custom error handler
      this.errorHandler(error, { taskId, operation: 'workerExecution' });
    }
    
    // Add additional diagnostic information if debug mode is enabled
    if (process.env.NODE_ENV === 'development') {
      console.warn('WorkerPool task error details:', {
        errorType,
        severity,
        taskId,
        message: error.message,
        queueStatus: `${this.taskQueue.length} pending, ${this.availableWorkers.length}/${this.workers.length} available`,
        timestamp: new Date().toISOString()
      });
    }
    
    // Enhanced error diagnostics
    const errorPattern = this.analyzeErrorStack(error);
    this.analyzeErrorCause(error);
    
    // Update daily error count
    const today = new Date();
    const dateKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    this.dailyErrorCounts[dateKey] = (this.dailyErrorCounts[dateKey] || 0) + 1;
    
    // Track error by worker if possible
    const workerEntry = this.workerMap.entries().next().value;
    if (workerEntry) {
      const worker = workerEntry[0];
      const workerId = this.workerIds.get(worker);
      if (workerId) {
        this.workerErrorCounts.set(workerId, (this.workerErrorCounts.get(workerId) || 0) + 1);
      }
    }
  }

  /**
   * Record an error for tracking and analytics
   * @param error Error to record
   */
  private recordError(error: Error & { 
    type?: ErrorType; 
    severity?: ErrorSeverity;
    timestamp?: number | string;
    context?: Record<string, unknown>;
  }): void {
    // Get error type and severity
    const errorType = error.type || ErrorType.OPERATION;
    const severity = error.severity || ErrorSeverity.ERROR;
    const timestamp = typeof error.timestamp === 'number' 
      ? error.timestamp 
      : typeof error.timestamp === 'string' 
        ? parseInt(String(Date.parse(error.timestamp)), 10)
        : Date.now();

    // Create standard error format
    const errorDetails: WorkerPoolError = {
      workerId: 'unknown',
      error,
      timestamp,
      operation: error.context?.operation as string || 'unknown',
      category: 'general',
      stackTrace: error.stack || '',
      severity,
      type: errorType
    };

    // Set error category
    errorDetails.category = this.categorizeError(errorDetails);

    // Update error type distribution
    this._errorDistribution.set(
      String(errorType), 
      (this._errorDistribution.get(String(errorType)) || 0) + 1
    );
    
    // Track by severity
    this.errorSeverityCounts.set(
      String(severity),
      (this.errorSeverityCounts.get(String(severity)) || 0) + 1
    );
    
    // Store in recent errors list
    this.lastErrors.unshift(errorDetails);
    if (this.lastErrors.length > 10) {
      this.lastErrors.pop();
    }
    
    // Extract error cause for root cause analysis
    let errorCause = 'unknown';
    if (error instanceof Error && 'cause' in error) {
      errorCause = String((error as any).cause);
    } else if (error.message.includes(':')) {
      // Attempt to parse cause from message
      errorCause = error.message.split(':')[0].trim();
    }
    
    // Update cause analysis
    this.errorCauseAnalysis[errorCause] = (this.errorCauseAnalysis[errorCause] || 0) + 1;
    
    // Track by standard category (network, timeout, etc.)
    this.categoryErrorCounts.set(
      errorDetails.category,
      (this.categoryErrorCounts.get(errorDetails.category) || 0) + 1
    );
    
    // Track when errors happen for time distribution
    const hourKey = new Date(timestamp).getHours().toString().padStart(2, '0');
    this.errorTimeDistribution.set(
      hourKey,
      (this.errorTimeDistribution.get(hourKey) || 0) + 1
    );
    
    // Track by error type with additional metadata
    const existingStats = this.errorsByType.get(String(errorType));
    if (existingStats) {
      existingStats.count += 1;
      existingStats.lastOccurred = timestamp;
      existingStats.standardCategory = errorDetails.category;
    } else {
      this.errorsByType.set(String(errorType), {
        type: String(errorType),
        count: 1,
        lastOccurred: timestamp,
        standardCategory: errorDetails.category
      });
    }
    
    // If there's operation info in the context, track it
    if (error.context && typeof error.context.operation === 'string') {
      const operation = String(error.context.operation);
      errorDetails.operation = operation;
      this.operationErrorCounts.set(
        operation,
        (this.operationErrorCounts.get(operation) || 0) + 1
      );
    }
    
    // Track in daily error stats
    const today = new Date(timestamp);
    const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    this.dailyErrorCounts[dateKey] = (this.dailyErrorCounts[dateKey] || 0) + 1;
    
    // Analyze error stack and track patterns
    if (error.stack) {
      const pattern = this.extractErrorPattern(error.stack);
      this.errorStackPatterns.set(
        pattern,
        (this.errorStackPatterns.get(pattern) || 0) + 1
      );
    }
    
    // Update error rate history for trend analysis
    this.updateErrorRateHistory();
    
    // Check for error spike (sudden increase in error rate)
    const recentErrorCount = this.errorRateHistory
      .filter(entry => Date.now() - entry.timestamp < 5 * 60 * 1000) // Last 5 minutes
      .reduce((sum, entry) => sum + entry.count, 0);
      
    // If error rate is high and we haven't recorded a spike recently
    const isErrorSpike = recentErrorCount > 10;
    const noRecentSpike = !this.lastErrorSpike || (Date.now() - this.lastErrorSpike > 15 * 60 * 1000);
    
    if (isErrorSpike && noRecentSpike) {
      this.lastErrorSpike = Date.now();
      
      // Log diagnostic info about the spike in development
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        console.warn('WorkerPool Error Spike Detected', {
          time: new Date().toISOString(),
          recentErrorCount,
          queueSize: this.taskQueue.length,
          workers: this.workers.length,
          availableWorkers: this.availableWorkers.length,
          mostCommonType: this.getMostCommonErrorType(),
          mostCommonCategory: this.getMostCommonErrorCategory()
        });
      }
    }
  }
  
  /**
   * Extract a general pattern from an error stack
   * @param stack Error stack trace
   * @returns Simplified pattern representation
   */
  private extractErrorPattern(stack: string): string {
    // Simple pattern extraction - first line of stack
    const firstLine = stack.split('\n')[0] || '';
    return firstLine.trim();
  }

  /**
   * Categorize an error based on its properties
   * @param error Error to categorize
   * @returns Error category
   */
  private categorizeError(error: WorkerPoolError): string {
    const { message, type } = error;
    
    if (message.includes('timeout')) return 'timeout';
    if (message.includes('network') || message.includes('fetch') || message.includes('http')) return 'network';
    if (message.includes('memory') || message.includes('allocation')) return 'memory';
    if (message.includes('permission') || message.includes('access')) return 'permission';
    if (message.includes('undefined') || message.includes('null')) return 'reference';
    
    // Default to type-based categorization
    return type.toLowerCase();
  }

  /**
   * Update error rate history
   */
  private updateErrorRateHistory(): void {
    this.errorRateHistory.push({
      timestamp: Date.now(),
      count: 1
    });
    
    // Limit history to last 24 hours
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    this.errorRateHistory = this.errorRateHistory.filter(entry => entry.timestamp >= dayAgo);
  }

  /**
   * Get error information from a worker
   * @param workerId The worker ID to get error information for
   * @returns Error statistics for the specified worker or undefined if worker not found
   */
  public getWorkerErrorStats(workerId: string): { 
    errorCount: number; 
    lastError?: WorkerPoolError;
  } | undefined {
    if (!this.workerErrorStats.has(workerId)) {
      return undefined;
    }
    
    return this.workerErrorStats.get(workerId);
  }

  /**
   * Get workers with the most errors
   * @param limit Maximum number of workers to return
   * @returns Array of worker IDs and error counts
   */
  public getTopErrorWorkers(limit = 5): Array<{ workerId: string; errorCount: number }> {
    return Array.from(this.workerErrorStats.entries())
      .map(([workerId, stats]) => ({
        workerId,
        errorCount: stats.totalErrors
      }))
      .sort((a, b) => b.errorCount - a.errorCount)
      .slice(0, limit);
  }

  /**
   * Get the most common error patterns
   * @param limit Maximum number of patterns to return
   * @returns Array of error patterns and counts
   */
  public getTopErrorPatterns(limit = 5): Array<{ pattern: string; count: number }> {
    return Array.from(this.errorStackPatterns.entries())
      .map(([pattern, count]) => ({ pattern, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Get the most common error type
   * @returns The most common error type
   */
  private getMostCommonErrorType(): string {
    let maxType = '';
    let maxCount = 0;
    
    this.errorTypeDistribution.forEach((count, type) => {
      if (count > maxCount) {
        maxCount = count;
        maxType = type;
      }
    });
    
    return maxType;
  }

  /**
   * Get the most common error category
   * @returns The most common error category
   */
  private getMostCommonErrorCategory(): string {
    let maxCategory = '';
    let maxCount = 0;
    
    this.categoryErrorCounts.forEach((count, category) => {
      if (count > maxCount) {
        maxCount = count;
        maxCategory = category;
      }
    });
    
    return maxCategory;
  }

  /**
   * Initialize error tracking data structures
   */
  private initializeErrorTracking(): void {
    // Initialize error type distribution with all error types
    Object.values(ErrorType).forEach(type => {
      this.errorTypeDistribution.set(String(type), 0);
    });
    
    // Initialize error severity counters
    Object.values(ErrorSeverity).forEach(severity => {
      this.errorSeverityCounts.set(String(severity), 0);
    });
    
    // Clear last errors
    this.lastErrors = [];
  }
  
  /**
   * Record and analyze a retry attempt for a task
   */
  private recordRetryAttempt(taskId: string, succeeded: boolean): void {
    const attempts = this.taskRetryAttempts.get(taskId) || 0;
    
    if (succeeded) {
      this.taskRetrySuccesses++;
      this.executionTimes.push(Date.now() - (this.taskStartTimes[this.taskStartTimes.length - 1] || Date.now()));
      this.taskRetryAttempts.delete(taskId);
    } else {
      this.taskRetryAttempts.set(taskId, attempts + 1);
      
      // Consider it a permanent failure after 3 retries
      if (attempts + 1 >= 3) {
        this.taskPermanentFailures++;
        this.taskRetryAttempts.delete(taskId);
      }
    }
  }
  
  /**
   * Calculate the average number of retries before success
   */
  private calculateAvgRetriesToSuccess(): number {
    // This is a simplified calculation - in a real system, you'd track each retry sequence
    const totalRetries = Array.from(this.taskRetryAttempts.values()).reduce((sum, count) => sum + count, 0);
    return this.taskRetrySuccesses > 0 ? totalRetries / this.taskRetrySuccesses : 0;
  }
  
  /**
   * Calculate recovery time from last error spike
   */
  private calculateRecoveryTime(): number | undefined {
    if (!this.lastErrorSpike) return undefined;
    
    const now = Date.now();
    // If we've had no significant errors in the last 5 minutes, we've "recovered"
    const recentErrors = this.lastErrors.filter(err => err.timestamp > now - 5 * 60 * 1000).length;
    
    if (recentErrors <= 1) {
      return now - this.lastErrorSpike;
    }
    
    return undefined; // Still in error state
  }
  
  /**
   * Calculate error rate change percentage (last 24h vs previous 24h)
   */
  private calculateErrorRateChange(): number {
    if (this.errorRateHistory.length < 96) return 0;
    
    const now = Date.now();
    const last24h = this.errorRateHistory.filter(entry => entry.timestamp > now - 24 * 60 * 60 * 1000);
    const previous24h = this.errorRateHistory.filter(
      entry => entry.timestamp <= now - 24 * 60 * 60 * 1000 && 
               entry.timestamp > now - 48 * 60 * 60 * 1000
    );
    
    const currentRate = last24h.reduce((sum, entry) => sum + entry.count, 0);
    const previousRate = previous24h.reduce((sum, entry) => sum + entry.count, 0);
    
    if (previousRate === 0) return currentRate > 0 ? 100 : 0;
    
    return ((currentRate - previousRate) / previousRate) * 100;
  }
  
  /**
   * Determine if error trend is increasing, decreasing, or stable
   */
  private determineErrorTrend(): 'increasing' | 'decreasing' | 'stable' {
    const change = this.calculateErrorRateChange();
    
    if (change > 10) return 'increasing';
    if (change < -10) return 'decreasing';
    return 'stable';
  }
  
  /**
   * Calculate correlation between concurrency and error rates
   */
  private calculateErrorConcurrencyCorrelation(): number {
    if (this.concurrentTasksHistory.length < 10 || this.errorRateHistory.length < 10) {
      return 0;
    }
    
    // Align data points by timestamp
    const timestamps = this.concurrentTasksHistory.map(entry => entry.timestamp);
    const errorsData = this.errorRateHistory.filter(entry => 
      timestamps.includes(entry.timestamp)
    );
    
    if (errorsData.length < 10) return 0;
    
    const concurrencyValues = this.concurrentTasksHistory
      .filter(entry => errorsData.some(e => e.timestamp === entry.timestamp))
      .map(entry => entry.concurrentTasks);
    
    const errorValues = errorsData.map(entry => entry.count);
    
    return this.calculateCorrelation(concurrencyValues, errorValues);
  }
  
  /**
   * Calculate correlation between queue size and error rates
   */
  private calculateErrorQueueSizeCorrelation(): number {
    if (this.queueSizeHistory.length < 10 || this.errorRateHistory.length < 10) {
      return 0;
    }
    
    // Since we don't have timestamps for queue size history, we'll use the most recent data points
    const queueSizeSamples = this.queueSizeHistory.slice(-this.errorRateHistory.length);
    const errorCounts = this.errorRateHistory.map(entry => entry.count).slice(-queueSizeSamples.length);
    
    return this.calculateCorrelation(queueSizeSamples, errorCounts);
  }
  
  /**
   * Get the most error-prone workers
   */
  private getErrorProneWorkers(): Array<{workerId: string, errorCount: number}> {
    return Array.from(this.workerErrorCounts.entries())
      .map(([workerId, count]) => ({ workerId, errorCount: count }))
      .sort((a, b) => b.errorCount - a.errorCount)
      .slice(0, 5);
  }
  
  /**
   * Get the most common error patterns from stack traces
   */
  private getCommonErrorPatterns(): Array<{pattern: string, count: number}> {
    return Array.from(this.errorStackPatterns.entries())
      .map(([pattern, count]) => ({ pattern, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }
  
  /**
   * Calculate correlation between two arrays of numeric values
   */
  private calculateCorrelation(arrX: number[], arrY: number[]): number {
    if (arrX.length !== arrY.length || arrX.length === 0) return 0;
    
    // Calculate means
    const meanX = arrX.reduce((sum, val) => sum + val, 0) / arrX.length;
    const meanY = arrY.reduce((sum, val) => sum + val, 0) / arrY.length;
    
    // Calculate covariance and variances
    let covariance = 0;
    let varX = 0;
    let varY = 0;
    
    for (let i = 0; i < arrX.length; i++) {
      const diffX = arrX[i] - meanX;
      const diffY = arrY[i] - meanY;
      covariance += diffX * diffY;
      varX += diffX * diffX;
      varY += diffY * diffY;
    }
    
    // Calculate correlation coefficient
    if (varX === 0 || varY === 0) return 0;
    return covariance / Math.sqrt(varX * varY);
  }
  
  /**
   * Get detailed error cause distribution
   */
  public get errorCauseDistributionData(): Record<string, number> {
    return { ...this.errorCauseAnalysis };
  }
  
  /**
   * Get error trend data for visualization
   */
  public get errorTrendData(): Array<{timestamp: number, count: number}> {
    return [...this.errorRateHistory];
  }
  
  /**
   * Execute a task with retry capabilities
   */
  public async executeWithRetry<T = any, R = any>(
    data: T, 
    priority = 0, 
    category?: string, 
    maxRetries = 2
  ): Promise<R> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.execute<T, R>(data, priority, category);
        
        // If this was a retry, record the successful retry
        if (attempt > 0) {
          this.recordRetryAttempt(String(data), true);
        }
        
        return result;
      } catch (error) {
        lastError = error as Error;
        
        // Record the retry attempt
        this.recordRetryAttempt(String(data), false);
        
        // If we've exhausted all retries, throw the last error
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Exponential backoff with jitter
        const backoff = Math.min(1000 * Math.pow(2, attempt), 10000) + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, backoff));
      }
    }
    
    // This should never happen, but TypeScript doesn't know that
    throw lastError || new Error('Unknown error during retry execution');
  }

  /**
   * Track an error that occurred in the worker pool
   * @param error The error details
   */
  private trackError(error: WorkerPoolError): void {
    // Update error stats by type
    const errorCategory = error.category || 'unknown';
    if (!this.errorsByType.has(errorCategory)) {
      this.errorsByType.set(errorCategory, {
        type: errorCategory,
        count: 0,
        lastOccurred: Date.now()
      });
    }
    
    const stats = this.errorsByType.get(errorCategory)!;
    stats.count++;
    stats.lastOccurred = error.timestamp || Date.now();
    
    // Track error severity distribution
    const severity = error.severity || ErrorSeverity.ERROR;
    this.errorSeverityCounts.set(String(severity), (this.errorSeverityCounts.get(String(severity)) || 0) + 1);
    
    // Track error by standard categories based on core error handling rules
    const standardCategory = this.categorizeError(error);
    if (!this.errorCauseAnalysis[standardCategory]) {
      this.errorCauseAnalysis[standardCategory] = 0;
    }
    this.errorCauseAnalysis[standardCategory]++;
    
    // Store error in the recent errors list (limited to 10)
    this.lastErrors.unshift({
      type: String(error.type),
      message: error.error.message,
      timestamp: error.timestamp || Date.now(),
      stackTrace: error.error.stack || '',
      severity: String(severity)
    });
    
    if (this.lastErrors.length > 10) {
      this.lastErrors.pop();
    }
    
    // Track error with operation context
    if (error.operation) {
      if (!this.operationErrorCounts.has(error.operation)) {
        this.operationErrorCounts.set(error.operation, {});
      }
      
      const operationErrors = this.operationErrorCounts.get(error.operation)!;
      const errorType = String(error.type);
      operationErrors[errorType] = (operationErrors[errorType] || 0) + 1;
    }
    
    // Update time distribution for temporal pattern analysis
    const hour = new Date().getHours().toString().padStart(2, '0');
    const timeKey = `${hour}:00`;
    this.errorTimeDistribution.set(
      timeKey, 
      (this.errorTimeDistribution.get(timeKey) || 0) + 1
    );
    
    // Log the error in development mode
    if (process.env.NODE_ENV === 'development') {
      console.error(`[WorkerPool] ${error.error.message}`, error.error);
    }
    
    // Call the configured error handler if provided
    if (this.options.errorHandler) {
      try {
        this.options.errorHandler(error.error, {
          taskId: error.workerId,
          operation: error.operation || 'unknown'
        });
      } catch (handlerError) {
        // If the error handler itself throws, log but don't propagate
        console.error('[WorkerPool] Error handler failed:', handlerError);
      }
    }
  }
  
  /**
   * Categorize an error based on its properties and message
   * @param error The error to categorize
   * @returns The standardized error category
   */
  private categorizeError(error: WorkerPoolError): string {
    // If the error already has a category, use it
    if (error.category) return error.category;
    
    const msg = error.error.message.toLowerCase();
    
    // Network related errors
    if (
      msg.includes('network') || 
      msg.includes('connection') || 
      msg.includes('timeout') ||
      msg.includes('offline')
    ) {
      return 'network';
    }
    
    // Resource errors
    if (
      msg.includes('memory') || 
      msg.includes('resource') || 
      msg.includes('capacity') ||
      msg.includes('full')
    ) {
      return 'resource';
    }
    
    // Task execution errors
    if (
      msg.includes('execution') || 
      msg.includes('processing') || 
      msg.includes('operation')
    ) {
      return 'execution';
    }
    
    // Worker lifecycle errors
    if (
      msg.includes('worker') || 
      msg.includes('spawn') || 
      msg.includes('terminate')
    ) {
      return 'worker_lifecycle';
    }
    
    // Data errors
    if (
      msg.includes('data') || 
      msg.includes('input') || 
      msg.includes('format') ||
      msg.includes('parse')
    ) {
      return 'data';
    }
    
    // Default to runtime errors
    return 'runtime';
  }
  
  /**
   * Get statistics about errors by type
   */
  private getErrorStats(): ErrorStats[] {
    return Array.from(this.errorsByType.values()).map(stat => ({
      ...stat,
      standardCategory: this.errorCauseAnalysis[stat.type] ? stat.type : 'Unknown'
    }));
  }

  /**
   * Improved error tracking and reporting for WorkerPool errors
   * Takes a comprehensive snapshot of the worker pool state at the time of error
   * @param error The error that occurred
   * @param taskId The ID of the task that caused the error (if applicable)
   * @param source The source of the error (worker, queue, execution, etc.)
   */
  private captureErrorWithContext(
    error: Error, 
    taskId?: string, 
    source: 'worker' | 'queue' | 'execution' | 'timeout' | 'termination' = 'execution'
  ): WorkerPoolError {
    // Get additional context information that may help diagnose the error
    const context: Record<string, unknown> = {
      timestamp: Date.now(),
      poolStats: {
        workers: this.workers.length,
        availableWorkers: this.availableWorkers.length,
        pendingTasks: this.taskQueue.length,
        completedTasks: this.completedTasks,
        failedTasks: this.failedTasks,
      },
      source,
    };

    // Add task-specific info if available
    if (taskId) {
      const workerId = this.getWorkerIdForTask(taskId);
      if (workerId) {
        context.workerId = workerId;
      }
      context.taskId = taskId;
    }

    // Extract error information
    let errorType = ErrorType.OPERATION;
    let severity = this.determineSeverity(error, source);
    
    // If error has type property, use it
    if ('type' in error && error.type) {
      const matchedType = Object.values(ErrorType).find(t => t === error.type);
      errorType = matchedType ? matchedType as ErrorType : ErrorType.OPERATION;
    }
    
    // If error has severity property, use it
    if ('severity' in error && typeof error.severity !== 'undefined') {
      severity = error.severity as ErrorSeverity;
    }
    
    // Create standardized error object
    const errorObj: WorkerPoolError = {
      workerId: 'unknown',
      error,
      timestamp: Date.now(),
      operation: 'unknown',
      category: 'unknown',
      stackTrace: error.stack || '',
      severity,
      type: errorType
    };
    
    return errorObj;
  }

  /**
   * Determine the severity of an error based on its type and context
   */
  private determineSeverity(error: Error, source: string): ErrorSeverity {
    // Check if error already has a severity
    if ('severity' in error && (error as any).severity) {
      return (error as any).severity;
    }

    // Determine severity based on error message patterns
    const message = error.message.toLowerCase();
    
    // Critical errors that may affect system stability
    if (
      message.includes('out of memory') || 
      message.includes('stack overflow') ||
      message.includes('worker terminated') ||
      (source === 'termination' && this.failedTasks > 10)
    ) {
      return ErrorSeverity.CRITICAL;
    }
    
    // Serious errors that affect functionality
    if (
      message.includes('timeout') || 
      source === 'timeout' ||
      message.includes('abort') ||
      (this.lastErrors.length > 5 && this.lastErrors.every(e => e.timestamp > Date.now() - 60000))
    ) {
      return ErrorSeverity.ERROR; 
    }
    
    // Warnings for less serious issues
    if (
      message.includes('retry') || 
      message.includes('delay') ||
      this.taskQueue.length > this.workers.length * 3
    ) {
      return ErrorSeverity.WARNING;
    }
    
    // Default to ERROR severity
    return ErrorSeverity.ERROR;
  }

  /**
   * Get worker ID for a specific task
   */
  private getWorkerIdForTask(taskId: string): string | undefined {
    for (const [worker, task] of this.workerMap.entries()) {
      if (task && task.id === taskId) {
        const workerId = this.workerIds.get(worker);
        return workerId !== undefined ? workerId : undefined;
      }
    }
    return undefined;
  }

  /**
   * Track error frequency per worker
   */
  private recordWorkerError(worker: Worker, error: Error): void {
    const workerId = this.workerIds.get(worker);
    if (workerId) {
      const currentCount = this.workerErrorCounts.get(workerId) || 0;
      this.workerErrorCounts.set(workerId, currentCount + 1);
    }
  }

  /**
   * Increment error count for a specific category
   * @param category The error category
   */
  private incrementErrorCategory(category: string): void {
    const current = this.errorTypeDistribution.get(category) || 0;
    this.errorTypeDistribution.set(category, current + 1);
  }

  /**
   * Get error information from a worker
   * @param workerId The worker ID to get error information for
   * @returns Error statistics for the specified worker or undefined if worker not found
   */
  public getWorkerErrorStats(workerId: string): { 
    errorCount: number; 
    lastError?: WorkerPoolError;
  } | undefined {
    if (!this.workerErrorStats.has(workerId)) {
      return undefined;
    }
    
    return this.workerErrorStats.get(workerId);
  }

  /**
   * Get workers with the most errors
   * @param limit Maximum number of workers to return
   * @returns Array of worker IDs and error counts
   */
  public getTopErrorWorkers(limit = 5): Array<{ workerId: string; errorCount: number }> {
    return Array.from(this.workerErrorStats.entries())
      .map(([workerId, stats]) => ({
        workerId,
        errorCount: stats.totalErrors
      }))
      .sort((a, b) => b.errorCount - a.errorCount)
      .slice(0, limit);
  }

  /**
   * Get the most common error patterns
   * @param limit Maximum number of patterns to return
   * @returns Array of error patterns and counts
   */
  public getTopErrorPatterns(limit = 5): Array<{ pattern: string; count: number }> {
    return Array.from(this.errorStackPatterns.entries())
      .map(([pattern, count]) => ({ pattern, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  private handleWorkerError(worker: Worker | string, error: Error | string, operation: string = 'unknown'): WorkerPoolError {
    const workerId = typeof worker === 'string' ? worker : (worker as any)?.workerId || 'unknown';
    const errorMessage = error instanceof Error ? error.message : error;
    const stackTrace = error instanceof Error ? error.stack : new Error().stack;
    const timestamp = new Date().toISOString();

    const errorInfo: WorkerPoolError = {
      workerId,
      error: error instanceof Error ? error : new Error(errorMessage),
      timestamp,
      operation,
      category: 'worker',
      stackTrace: stackTrace || '',
      severity: this.determineSeverity(errorMessage),
      type: ErrorType.WORKER_POOL,
      cause: error instanceof Error ? error.cause : undefined
    };

    this.recordError(errorInfo);
    return errorInfo;
  }

  private determineSeverity(message: string | Error): ErrorSeverity {
    const msg = typeof message === 'string' ? message.toLowerCase() : message.message.toLowerCase();
    if (msg.includes('critical') || msg.includes('fatal')) {
      return ErrorSeverity.CRITICAL;
    } else if (msg.includes('warning')) {
      return ErrorSeverity.WARNING;
    }
    return ErrorSeverity.ERROR;
  }

  private updateErrorStats(errorInfo: WorkerPoolError): void {
    const { workerId, timestamp, category, severity, type } = errorInfo;
    
    this.errorTypeDistribution.set(type, (this.errorTypeDistribution.get(type) || 0) + 1);
    this.errorSeverityCounts.set(severity, (this.errorSeverityCounts.get(severity) || 0) + 1);
    this.errorCategoryDistribution.set(category, (this.errorCategoryDistribution.get(category) || 0) + 1);
    
    const today = new Date().toISOString().split('T')[0];
    if (!this.errorTrends.daily) {
      this.errorTrends.daily = {};
    }
    this.errorTrends.daily[today] = (this.errorTrends.daily[today] || 0) + 1;
    
    const workerStats = this.workerErrorStats.get(workerId) || {
      totalErrors: 0,
      lastError: Date.parse(timestamp),
      categories: {}
    };
    
    workerStats.totalErrors++;
    workerStats.lastError = Date.parse(timestamp);
    workerStats.categories[category] = (workerStats.categories[category] || 0) + 1;
    this.workerErrorStats.set(workerId, workerStats);
  }

  public getWorkerErrorStats(workerId: string): { errorCount: number; lastError?: WorkerPoolError } | undefined {
    const stats = this.workerErrorStats.get(workerId);
    if (!stats) return undefined;
    
    return {
      errorCount: stats.totalErrors,
      lastError: this.lastErrors.find(err => err.workerId === workerId)
    };
  }

  private operationErrorCounts = new Map<string, number>();

  private recordError(error: WorkerPoolError): void {
    if (error.operation) {
      this.operationErrorCounts.set(
        error.operation,
        (this.operationErrorCounts.get(error.operation) || 0) + 1
      );
    }
    
    this.updateErrorStats(error);
  }

  private getWorkerStats(): WorkerPoolStats {
    const stats: WorkerPoolStats = {
      totalWorkers: this.workers.length,
      availableWorkers: this.availableWorkers.length,
      busyWorkers: this.workers.length - this.availableWorkers.length,
      pendingTasks: this.taskQueue.length,
      maxWorkers: this.options.maxWorkers,
      utilization: this.workers.length > 0 ? ((this.workers.length - this.availableWorkers.length) / this.workers.length) * 100 : 0,
      completedTasks: this.completedTasks,
      failedTasks: this.failedTasks,
      avgExecutionTime: this.getAverageExecutionTime(),
      throughput: this.throughput,
      peakQueueSize: this.peakQueueSize,
      avgWaitTime: this.waitTimes.length > 0 ? this.waitTimes.reduce((a, b) => a + b) / this.waitTimes.length : 0,
      taskStartTimes: [...this.taskStartTimes],
      queueSizeHistory: [...this.queueSizeHistory],
      lastResetTime: this.lastResetTime,
      executionTimePercentiles: this.calculatePercentiles(this.executionTimes),
      waitTimePercentiles: this.calculatePercentiles(this.waitTimes),
      workerEfficiency: Array.from(this.workerPerformance.entries()).map(([workerId, stats]) => ({
        workerId,
        tasksCompleted: stats.tasksCompleted,
        totalExecutionTime: stats.totalExecutionTime,
        averageExecutionTime: stats.tasksCompleted > 0 ? stats.totalExecutionTime / stats.tasksCompleted : 0,
        errorRate: (this.workerErrorCounts.get(workerId) || 0) / (stats.tasksCompleted || 1)
      })),
      completionsOverTime: { ...this.minutelyCompletions },
      errorDistribution: this.errorDistribution,
      taskCategories: Object.fromEntries(this.taskCategories),
      categoryPerformance: Array.from(this.taskCategories.entries()).map(([category, count]) => ({
        category,
        count,
        avgExecutionTime: this.categoryExecutionTimes.get(category)?.reduce((a, b) => a + b, 0) || 0,
        successRate: this.categorySuccessRates.get(category)?.success || 0
      })),
      concurrencyMetrics: {
        avgConcurrentTasks: this.currentConcurrentTasks,
        peakConcurrentTasks: this.peakConcurrentTasks,
        concurrencyTimestamps: [...this.concurrentTasksHistory]
      },
      memoryMetrics: this.estimatedMemoryUsage > 0 ? {
        estimatedMemoryUsage: this.estimatedMemoryUsage,
        peakMemoryUsage: this.peakMemoryUsage
      } : undefined,
      errorTrends: {
        dailyCounts: { ...this.dailyErrorCounts },
        rateChangePercent: this.calculateErrorRateChange(),
        trend: this.determineErrorTrend()
      },
      errorDiagnostics: {
        concurrencyCorrelation: this.calculateErrorConcurrencyCorrelation(),
        queueSizeCorrelation: this.calculateErrorQueueSizeCorrelation(),
        errorProneWorkers: Array.from(this.workerErrorCounts.entries())
          .map(([workerId, count]) => ({ workerId, errorCount: count }))
          .sort((a, b) => b.errorCount - a.errorCount)
          .slice(0, 5),
        commonErrorPatterns: Array.from(this.errorStackPatterns.entries())
          .map(([pattern, count]) => ({ pattern, count }))
      },
      errorSeverityDistribution: Object.fromEntries(
        Array.from(this.errorSeverityCounts.entries())
          .map(([severity, count]) => [severity as ErrorSeverity, count])
      ) as Record<ErrorSeverity, number>,
      errorCategoryDistribution: Object.fromEntries(this.categoryErrorCounts),
      errorTypeDistribution: Object.fromEntries(this._errorDistribution),
      workerErrors: Array.from(this.workerErrorStats.entries())
        .map(([workerId, stats]) => ({ workerId, errorCount: stats.totalErrors })),
      errorProneWorkerIds: Array.from(this.workerErrorCounts.entries())
        .map(([workerId, count]) => ({ workerId, errorCount: count }))
        .sort((a, b) => b.errorCount - a.errorCount)
        .slice(0, 5)
    };

    return stats;
  }

  private analyzeErrorStack(error: Error): string {
    return error.stack ?? '';
  }

  private calculateAverageTaskTime(): number {
    return this.executionTimes.length > 0 
      ? this.executionTimes.reduce((sum, time) => sum + time, 0) / this.executionTimes.length 
      : 0;
  }
} 