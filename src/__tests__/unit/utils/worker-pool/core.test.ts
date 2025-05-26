import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock worker_threads module
vi.mock('worker_threads', () => {
  let mockWorkerIdCounter = 0;
  class MockWorker {
    onmessage: ((event: MessageEvent) => void) | null = null;
    onerror: ((event: ErrorEvent) => void) | null = null;
    terminate = vi.fn(() => {
      if (window.__WORKER_REGISTRY__) {
        window.__WORKER_REGISTRY__.delete(this);
      }
    });
    private currentTaskId: string | undefined;
    private _onMessage?: (data: any) => void;
    private _onError?: (err: any) => void;
    private _onExit?: () => void;
    private _isTerminated = false;
    public readonly threadId: string;

    constructor() {
      this.threadId = `mock-worker-${mockWorkerIdCounter++}`;
      if (!window.__WORKER_REGISTRY__) {
        window.__WORKER_REGISTRY__ = new Set();
      }
      window.__WORKER_REGISTRY__.add(this);
    }

    on(event: string, handler: (...args: any[]) => void) {
      if (event === 'message') this._onMessage = handler;
      else if (event === 'error') this._onError = handler;
      else if (event === 'exit') this._onExit = handler;
    }

    async simulateMessage(data: any, taskId?: string) {
      if (this._isTerminated) return;
      await Promise.resolve();
      if (this._onMessage) {
        this._onMessage({
          target: this,
          data: {
            taskId: taskId ?? this.currentTaskId,
            result: data
          }
        });
      }
    }

    async simulateError(error: Error, taskId?: string) {
      if (this._isTerminated) return;
      await Promise.resolve();
      if (taskId) {
        this.currentTaskId = taskId;
      }
      if (this._onError) {
        this._onError(error);
      }
      await this.simulateExit();
    }

    async simulateExit() {
      if (this._isTerminated) return;
      this._isTerminated = true;
      await Promise.resolve();
      if (this._onExit) {
        this._onExit();
      }
      if (window.__WORKER_REGISTRY__) {
        window.__WORKER_REGISTRY__.delete(this);
      }
    }

    postMessage = vi.fn((data: any) => {
      if (this._isTerminated) return;
      this.currentTaskId = data.taskId;
    });
  }

  return {
    Worker: MockWorker,
    default: { Worker: MockWorker }
  };
});

import { WorkerPool } from '../../../../utils/worker-pool/core';
import { WorkerTask, WorkerPoolOptions, WorkerPoolError } from '../../../../utils/worker-pool/types';

// Mock global Worker
global.Worker = vi.mocked(require('worker_threads').Worker) as any;

// Mock global window.__WORKER_REGISTRY__
declare global {
  interface Window {
    __WORKER_REGISTRY__: Set<unknown>;
  }
}

describe('WorkerPool', () => {
  let workerPool: WorkerPool;
  const mockWorkerScript = './mock-worker.js';

  beforeEach(() => {
    workerPool = new WorkerPool({
      workerScript: mockWorkerScript,
      maxWorkers: 4,
      initialWorkers: 2
    } as WorkerPoolOptions);
    window.__WORKER_REGISTRY__ = new Set();
  });

  afterEach(() => {
    workerPool.reset();
    window.__WORKER_REGISTRY__ = new Set();
  });

  describe('Initialization and Configuration', () => {
    it('should create initial workers on initialize', async () => {
      await workerPool.initialize();
      expect(workerPool.getStatistics().activeWorkers).toBe(2);
      expect(workerPool.available).toBe(2);
    });

    it('should throw error if workerScript is not provided', () => {
      expect(() => new WorkerPool({ maxWorkers: 4 } as WorkerPoolOptions)).toThrow();
    });

    it('should not initialize twice', async () => {
      await workerPool.initialize();
      const initialStats = workerPool.getStatistics();
      await workerPool.initialize();
      expect(workerPool.getStatistics()).toEqual(initialStats);
    });

    it('should respect maxWorkers limit', async () => {
      const pool = new WorkerPool({
        workerScript: mockWorkerScript,
        maxWorkers: 2,
        initialWorkers: 4
      } as WorkerPoolOptions);
      await pool.initialize();
      expect(pool.getStatistics().activeWorkers).toBe(2);
    });
  });

  describe('Task Execution and Queue Management', () => {
    beforeEach(async () => {
      await workerPool.initialize();
    });

    it('should execute task successfully and return result', async () => {
      const task = { id: '1', data: { test: 'data' } } as WorkerTask;
      const result = { success: true };

      const worker = (workerPool as any).workers[0] as any;
      const promise = workerPool.execute(task);
      await worker.simulateMessage(result, task.id);
      const response = await promise;
      expect(response).toEqual(result);
      expect(workerPool.available).toBe(2);
    });

    it('should handle task queue when all workers are busy', async () => {
      const tasks = Array.from({ length: 6 }, (_, i) => ({
        id: String(i + 1),
        data: { test: `data${i + 1}` }
      })) as WorkerTask[];

      const results = tasks.map(() => ({ success: true }));
      const workers = (workerPool as any).workers as any[];

      const promises = tasks.map(task => workerPool.execute(task));

      expect(workerPool.available).toBe(0);
      expect(workerPool.pending).toBe(4);

      for (let i = 0; i < tasks.length; i++) {
        const worker = workers[i % workers.length];
        await worker.simulateMessage(results[i], tasks[i].id);
        await new Promise(resolve => setTimeout(resolve, 0));
      }

      const responses = await Promise.all(promises);
      expect(responses).toEqual(results);
      expect(workerPool.available).toBe(2);
      expect(workerPool.pending).toBe(0);
    });

    it('should handle task timeouts', async () => {
      const pool = new WorkerPool({
        workerScript: mockWorkerScript,
        maxWorkers: 2,
        timeout: 100
      } as WorkerPoolOptions);
      await pool.initialize();

      const task = { id: 'timeout-task', data: { test: 'data' } } as WorkerTask;
      const promise = pool.execute(task);
      
      // Don't simulate any response, let it timeout
      await expect(promise).rejects.toThrow();
      expect(pool.getStatistics().failedTasks).toBe(1);
    });
  });

  describe('Error Handling and Recovery', () => {
    beforeEach(async () => {
      await workerPool.initialize();
    });

    it('should handle worker errors and create new worker', async () => {
      const task = { id: '1', data: { test: 'data' } } as WorkerTask;
      const error = new Error('Test error');

      const worker = (workerPool as any).workers[0] as any;
      const errorHandler = vi.fn();
      const workerReplacedHandler = vi.fn();
      workerPool.on('error', errorHandler);
      workerPool.on('worker:replaced', workerReplacedHandler);

      const promise = workerPool.execute(task);
      promise.catch(() => {}); // Preemptively mark promise rejection as handled
      
      expect(workerPool.available).toBe(1);
      
      await worker.simulateError(error, task.id);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(errorHandler).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.objectContaining({
          message: 'Test error'
        })
      }));
      
      expect(workerReplacedHandler).toHaveBeenCalledWith(expect.objectContaining({
        oldWorkerId: expect.any(String),
        newWorkerId: expect.any(String)
      }));

      let thrownError: any = null;
      try {
        await promise;
      } catch (e) {
        thrownError = e;
      }
      expect(thrownError).toBeInstanceOf(WorkerPoolError);
      expect(thrownError.message).toBe('Test error');
      expect(thrownError.workerId).toBe(worker.threadId);

      expect(workerPool.size).toBe(2);
      expect(workerPool.available).toBe(2);
      expect(workerPool.pending).toBe(0);

      workerPool.off('error', errorHandler);
      workerPool.off('worker:replaced', workerReplacedHandler);
    });

    it('should handle worker exit and maintain pool size', async () => {
      const worker = (workerPool as any).workers[0] as any;
      await worker.simulateExit();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(workerPool.size).toBe(2);
      expect(workerPool.available).toBe(2);
    });
  });

  describe('Statistics and Monitoring', () => {
    beforeEach(async () => {
      await workerPool.initialize();
    });

    it('should track queue size and worker utilization', async () => {
      const tasks = Array.from({ length: 5 }, (_, i) => ({
        id: `task-${i}`,
        data: { test: `data-${i}` }
      }));

      const taskPromises = tasks.map(task => workerPool.execute(task));

      expect(workerPool.getStatistics().pendingTasks).toBe(5);
      expect(workerPool.getStatistics().availableWorkers).toBe(0);

      const workers = (workerPool as any).workers as any[];
      for (let i = 0; i < tasks.length; i++) {
        const worker = workers[i % workers.length];
        await worker.simulateMessage({ processed: tasks[i].data }, tasks[i].id);
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      await Promise.all(taskPromises);

      expect(workerPool.getStatistics().pendingTasks).toBe(0);
      expect(workerPool.getStatistics().availableWorkers).toBe(2);
      expect(workerPool.getStatistics().completedTasks).toBe(tasks.length);
    });

    it('should track error statistics', async () => {
      const task = { id: 'error-task', data: { shouldFail: true } };
      const errorHandler = vi.fn();
      workerPool.on('error', errorHandler);

      const taskPromise = workerPool.execute(task);
      const worker = (workerPool as any).workers[0] as any;
      await worker.simulateError(new Error('Test error'), task.id);

      let thrownError: any = null;
      try {
        await taskPromise;
      } catch (e) {
        thrownError = e;
      }

      expect(thrownError).toBeInstanceOf(Error);
      expect(workerPool.getStatistics().failedTasks).toBe(1);
      expect(workerPool.getStatistics().availableWorkers).toBe(2);
    });
  });

  describe('Worker Management', () => {
    beforeEach(async () => {
      await workerPool.initialize();
    });

    it('should terminate all workers on reset', async () => {
      const initialWorkers = [...(workerPool as any).workers] as any[];
      expect(initialWorkers.length).toBeGreaterThan(0);

      await workerPool.reset();
      
      initialWorkers.forEach(worker => {
        expect(worker.terminate).toHaveBeenCalled();
      });
      expect(workerPool.getStatistics().activeWorkers).toBe(0);
      expect(workerPool.getStatistics().totalWorkers).toBe(0);
      expect(workerPool.available).toBe(0);
      expect(workerPool.pending).toBe(0);
    });

    it('should register workers in global registry', async () => {
      expect(window.__WORKER_REGISTRY__?.size).toBe(2);
      
      workerPool.reset();
      expect(window.__WORKER_REGISTRY__?.size).toBe(0);
    });
  });

  describe('Edge Cases and Best Practices', () => {
    let pool: WorkerPool;
    const script = './mock-worker.js';

    beforeEach(async () => {
      pool = new WorkerPool({ workerScript: script, maxWorkers: 2, initialWorkers: 2, timeout: 100 } as WorkerPoolOptions);
      await pool.initialize();
    });

    afterEach(async () => {
      await pool.reset();
    });

    it('should reject task submission after reset', async () => {
      await pool.reset();
      const task = { id: 'late', data: {} } as WorkerTask;
      await expect(pool.execute(task)).rejects.toThrow();
    });

    it('should not crash if error handler throws', async () => {
      const errorHandler = vi.fn(() => { throw new Error('Handler fail'); });
      pool.on('error', errorHandler);
      const task = { id: 'err', data: {} } as WorkerTask;
      const worker = (pool as any).workers[0] as any;
      const promise = pool.execute(task);
      promise.catch(() => {});
      await worker.simulateError(new Error('Task fail'), task.id);
      await new Promise(r => setTimeout(r, 20));
      expect(errorHandler).toHaveBeenCalled();
      // Pool should still be operational
      expect(pool.size).toBe(2);
      pool.off('error', errorHandler);
    });

    it('should handle rapid consecutive worker failures', async () => {
      const errorHandler = vi.fn();
      pool.on('error', errorHandler);
      const tasks = [
        { id: 'a', data: {} },
        { id: 'b', data: {} }
      ] as WorkerTask[];
      const workers = (pool as any).workers as any[];
      const promises = tasks.map(task => pool.execute(task));
      promises.forEach(p => p.catch(() => {}));
      // Simulate first worker failure
      await workers[0].simulateError(new Error('fail1'), tasks[0].id);
      await new Promise(r => setTimeout(r, 20));
      // Get the new worker after replacement
      const newWorkers = (pool as any).workers as any[];
      const secondWorker = newWorkers.find(w => w !== workers[1]);
      // Simulate second worker failure on the new worker
      await secondWorker.simulateError(new Error('fail2'), tasks[1].id);
      await new Promise(r => setTimeout(r, 20));
      expect(errorHandler).toHaveBeenCalledTimes(2);
      expect(pool.size).toBe(2);
      pool.off('error', errorHandler);
    });

    it('should clean up timeouts after task completion or error', async () => {
      const task = { id: 'timeout-clean', data: {} } as WorkerTask;
      const worker = (pool as any).workers[0] as any;
      const promise = pool.execute(task);
      await worker.simulateMessage({ ok: true }, task.id);
      await promise;
      // Timeout should be cleaned up after successful completion
      expect((pool as any).taskTimeouts.has(task.id)).toBe(false);

      // Now test error path on the same worker
      const errTask = { id: 'timeout-err', data: {} } as WorkerTask;
      const errPromise = pool.execute(errTask);
      errPromise.catch(() => {});
      // Wait until the timeout is set for the error task
      await new Promise(resolve => {
        const check = () => {
          if ((pool as any).taskTimeouts.has(errTask.id)) {
            resolve(undefined);
          } else {
            setTimeout(check, 1);
          }
        };
        check();
      });
      await worker.simulateError(new Error('Simulated error'), errTask.id);
      // Timeout should be cleaned up after error
      expect((pool as any).taskTimeouts.has(errTask.id)).toBe(false);
    });

    it('should emit worker:replaced and error events only on error', async () => {
      const errorHandler = vi.fn();
      const replacedHandler = vi.fn();
      pool.on('error', errorHandler);
      pool.on('worker:replaced', replacedHandler);
      const task = { id: 'event-test', data: {} } as WorkerTask;
      const worker = (pool as any).workers[0] as any;
      const promise = pool.execute(task);
      promise.catch(() => {});
      await worker.simulateError(new Error('fail'), task.id);
      await new Promise(r => setTimeout(r, 10));
      expect(errorHandler).toHaveBeenCalled();
      expect(replacedHandler).toHaveBeenCalled();
      // Now simulate normal exit on the new worker after replacement
      const newWorker = (pool as any).workers.find((w: any) => w !== worker);
      await newWorker.simulateExit();
      await new Promise(r => setTimeout(r, 10));
      expect(replacedHandler).toHaveBeenCalledTimes(2);
      pool.off('error', errorHandler);
      pool.off('worker:replaced', replacedHandler);
    });
  });
}); 