/**
 * E2E Worker Mock
 * 
 * Mock implementation for Web Workers in E2E testing environments.
 * Provides consistent worker behavior across different test scenarios.
 * 
 * @module E2EWorkerMock
 * @version 1.0.0
 */

import type { MockWorkerMessageEvent, MockWorkerErrorEvent } from '../../types/test-mocks';

/**
 * E2E Worker Mock class for simulating Web Worker behavior
 * 
 * @example
 * Basic usage of E2E Worker Mock
 */
export class E2EWorkerMock {
  public onmessage: ((event: MockWorkerMessageEvent) => void) | null = null;
  public onerror: ((event: MockWorkerErrorEvent) => void) | null = null;
  public onmessageerror: ((event: Event) => void) | null = null;

  private messageListeners: Array<(event: MockWorkerMessageEvent) => void> = [];
  private errorListeners: Array<(event: MockWorkerErrorEvent) => void> = [];
  private terminated = false;

  /**
   * Create a new E2E Worker Mock
   * 
   * @param scriptURL - The worker script URL (ignored in mock)
   * 
   * @param _options - Worker options (ignored in mock)
   *
   */
  constructor(
    public readonly scriptURL: string,
    public readonly _options?: WorkerOptions
  ) {
    // Simulate async worker initialization
    setTimeout(() => {
      if (!this.terminated) {
        this.dispatchEvent('ready', { type: 'ready' });
      }
    }, 10);
  }

  /**
   * Post a message to the worker
   * 
   * @param message - Message to send to worker
   * 
   * @param _transfer - Transferable objects (ignored in mock)
   *
   */
  postMessage(message: unknown, _transfer?: Transferable[]): void {
    if (this.terminated) {
      throw new Error('Worker has been terminated');
    }

    // Simulate async message processing
    setTimeout(() => {
      if (this.terminated) return;

      try {
        const event: MockWorkerMessageEvent = { data: message as any };
        
        // Process the message based on type
        if (typeof message === 'object' && message !== null) {
          const msg = message as any;
          
          if (msg.task) {
            // Execute task and return result
            let result: unknown;
            
            if (typeof msg.task === 'string') {
              // Handle string tasks (e.g., function strings)
              if (msg.task.startsWith('function') || msg.task.startsWith('(') || msg.task.startsWith('=>')) {
                try {
                  const func = new Function('return ' + msg.task)();
                  result = typeof func === 'function' ? func() : msg.task;
                } catch (error) {
                  this.dispatchError(error as Error);
                  return;
                }
              } else {
                result = msg.task;
              }
            } else if (typeof msg.task === 'function') {
              try {
                result = msg.task();
              } catch (error) {
                this.dispatchError(error as Error);
                return;
              }
            } else {
              result = msg.task;
            }

            // Send result back
            this.dispatchMessage({
              data: {
                id: msg.id,
                type: 'result',
                success: true,
                result
              }
            });
          } else {
            // Echo the message back
            this.dispatchMessage(event);
          }
        } else {
          // Handle primitive messages
          this.dispatchMessage(event);
        }
      } catch (error) {
        this.dispatchError(error as Error);
      }
    }, Math.random() * 10 + 5); // Simulate variable processing time
  }

  /**
   * Add event listener
   * 
   * @param type - Event type
   * 
   * @param listener - Event listener function
   * 
   * @param _options - Event listener options (ignored in mock)
   *
   */
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    _options?: boolean | AddEventListenerOptions
  ): void {
    if (typeof listener === 'function') {
      if (type === 'message') {
        this.messageListeners.push(listener as any);
      } else if (type === 'error') {
        this.errorListeners.push(listener as any);
      }
    }
  }

  /**
   * Remove event listener
   * 
   * @param type - Event type
   * 
   * @param listener - Event listener function
   * 
   * @param _options - Event listener options (ignored in mock)
   *
   */
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    _options?: boolean | EventListenerOptions
  ): void {
    if (typeof listener === 'function') {
      if (type === 'message') {
        const index = this.messageListeners.indexOf(listener as any);
        if (index > -1) {
          this.messageListeners.splice(index, 1);
        }
      } else if (type === 'error') {
        const index = this.errorListeners.indexOf(listener as any);
        if (index > -1) {
          this.errorListeners.splice(index, 1);
        }
      }
    }
  }

  /**
   * Terminate the worker
   */
  terminate(): void {
    this.terminated = true;
    this.messageListeners.length = 0;
    this.errorListeners.length = 0;
    this.onmessage = null;
    this.onerror = null;
    this.onmessageerror = null;
  }

  /**
   * Dispatch a message event
   * 
   * @param event - Message event to dispatch
   *
   */
  private dispatchMessage(event: MockWorkerMessageEvent): void {
    if (this.terminated) return;

    // Call onmessage handler
    if (this.onmessage) {
      this.onmessage(event);
    }

    // Call registered listeners
    this.messageListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.warn('Error in message listener:', error);
      }
    });
  }

  /**
   * Dispatch an error event
   * 
   * @param error - Error to dispatch
   *
   */
  private dispatchError(error: Error): void {
    if (this.terminated) return;

    const errorEvent: MockWorkerErrorEvent = {
      message: error.message,
      filename: this.scriptURL,
      lineno: 0,
      colno: 0,
      error
    };

    // Call onerror handler
    if (this.onerror) {
      this.onerror(errorEvent);
    }

    // Call registered error listeners
    this.errorListeners.forEach(listener => {
      try {
        listener(errorEvent);
      } catch (listenerError) {
        console.warn('Error in error listener:', listenerError);
      }
    });
  }

  /**
   * Dispatch a generic event
   * 
   * @param type - Event type
   * 
   * @param data - Event data
   *
   */
  private dispatchEvent(type: string, data: unknown): void {
    // This is a simplified event dispatch for testing
    // In a real implementation, this would create proper Event objects
    console.warn(`Worker event: ${type}`, data);
  }
}

/**
 * E2E Worker Pool Mock for managing multiple workers
 *
 * @example
 * Creating and using a worker pool mock
 * ```typescript
 * const pool = new E2EWorkerPoolMock(4, 'worker.js');
 * const result = await pool.executeTask(() => 42);
 * console.log(result); // 42
 * pool.terminate();
 * ```
 */
export class E2EWorkerPoolMock {
  private workers: Map<string, E2EWorkerMock> = new Map();
  private taskQueue: Array<{ id: string; task: unknown; resolve: (value: unknown) => void; reject: (error: Error) => void }> = [];
  private maxWorkers: number;
  private activeWorkers = 0;

  /**
   * Create a new E2E Worker Pool Mock
   * 
   * @param maxWorkers - Maximum number of workers
   * 
   * @param workerScript - Worker script URL
   *
   */
  constructor(maxWorkers = 4, private workerScript = 'mock-worker.js') {
    this.maxWorkers = maxWorkers;
  }

  /**
   * Execute a task using the worker pool
   * 
   * @param task - Task to execute
   * 
   * @returns Promise that resolves with task result
   *
   */
  async executeTask(task: unknown): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const taskId = `task-${Date.now()}-${Math.random()}`;
      
      this.taskQueue.push({
        id: taskId,
        task,
        resolve,
        reject
      });

      this.processQueue();
    });
  }

  /**
   * Process the task queue
   */
  private processQueue(): void {
    if (this.taskQueue.length === 0 || this.activeWorkers >= this.maxWorkers) {
      return;
    }

    const queuedTask = this.taskQueue.shift();
    if (!queuedTask) return;

    const workerId = `worker-${this.activeWorkers}`;
    const worker = new E2EWorkerMock(this.workerScript);
    
    this.workers.set(workerId, worker);
    this.activeWorkers++;

    // Set up worker message handling
    worker.onmessage = (event) => {
      const data = event.data as any;
      if (data.success) {
        queuedTask.resolve(data.result);
      } else {
        queuedTask.reject(new Error(data.error || 'Task failed'));
      }
      
      // Clean up worker
      this.cleanupWorker(workerId);
    };

    worker.onerror = (error) => {
      queuedTask.reject(new Error(error.message));
      this.cleanupWorker(workerId);
    };

    // Send task to worker
    worker.postMessage({
      id: queuedTask.id,
      task: queuedTask.task
    });
  }

  /**
   * Clean up a worker and process next task
   * 
   * @param workerId - ID of worker to clean up
   *
   */
  private cleanupWorker(workerId: string): void {
    const worker = this.workers.get(workerId);
    if (worker) {
      worker.terminate();
      this.workers.delete(workerId);
      this.activeWorkers--;
      
      // Process next task in queue
      setTimeout(() => this.processQueue(), 0);
    }
  }

  /**
   * Terminate all workers and clear queue
   */
  terminate(): void {
    this.workers.forEach(worker => worker.terminate());
    this.workers.clear();
    this.activeWorkers = 0;
    this.taskQueue.length = 0;
  }

  /**
   * Get current pool statistics
   * 
   * @returns Pool statistics
   *
   */
  getStats(): { activeWorkers: number; queuedTasks: number; maxWorkers: number } {
    return {
      activeWorkers: this.activeWorkers,
      queuedTasks: this.taskQueue.length,
      maxWorkers: this.maxWorkers
    };
  }
}

/**
 * Worker registry for managing worker instances in tests
 */
export const workerRegistry = {
  workers: new Map<string, E2EWorkerMock>(),
  pools: new Map<string, E2EWorkerPoolMock>(),

  /**
   * Register a worker instance
   * 
   * @param id - Worker ID
   * 
   * @param worker - Worker instance
   *
   */
  registerWorker(id: string, worker: E2EWorkerMock): void {
    this.workers.set(id, worker);
  },

  /**
   * Register a worker pool instance
   * 
   * @param id - Pool ID
   * 
   * @param pool - Pool instance
   *
   */
  registerPool(id: string, pool: E2EWorkerPoolMock): void {
    this.pools.set(id, pool);
  },

  /**
   * Get a registered worker
   * 
   * @param id - Worker ID
   * 
   * @returns Worker instance or undefined
   *
   */
  getWorker(id: string): E2EWorkerMock | undefined {
    return this.workers.get(id);
  },

  /**
   * Get a registered pool
   * 
   * @param id - Pool ID
   * 
   * @returns Pool instance or undefined
   *
   */
  getPool(id: string): E2EWorkerPoolMock | undefined {
    return this.pools.get(id);
  },

  /**
   * Clean up all registered workers and pools
   */
  cleanup(): void {
    this.workers.forEach(worker => worker.terminate());
    this.pools.forEach(pool => pool.terminate());
    this.workers.clear();
    this.pools.clear();
  }
};

// Export mock constructor for global Worker replacement
export const MockWorker = E2EWorkerMock;

// Export for vitest mocking
export default {
  E2EWorkerMock,
  E2EWorkerPoolMock,
  workerRegistry,
  MockWorker
}; 