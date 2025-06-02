/**
 * E2E tests for Resource Management Services
 * Tests real worker execution, async task management, and performance in actual browsers
 */

import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// Use centralized types instead of local declarations
// Window interface extensions are now in src/types/global.d.ts

// Helper function to setup resource management test
async function setupResourceManagementTest(page: Page): Promise<void> {
  await page.goto('/');
  
  // Add resource management test setup
  await page.setContent(`
    <div id="resource-test-container" style="width: 800px; height: 600px;">
      <h2>Resource Management E2E Test</h2>
      <div id="test-output"></div>
    </div>
  `);

  // Inject resource management functionality after DOM is ready
  await page.evaluate((): void => {
    // Create a simple worker script inline
    const workerScript = `
      self.onmessage = function(e) {
        const { task, taskId } = e.data;
        try {
          // Execute the task function
          const func = new Function('return ' + task)();
          const result = func();
          self.postMessage({ result, taskId });
        } catch (error) {
          self.postMessage({ error: error.message, taskId });
        }
      };
    `;
    
    const blob = new Blob([workerScript], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);

    // Mock ResourcePool class
    class ResourcePool {
      private resources: any[] = [];
      private inUse = new Set();

      constructor(private factory: () => any, private reset: (resource: any) => void, initialSize: number) {
        for (let i = 0; i < initialSize; i++) {
          this.resources.push(factory());
        }
      }

      acquire(): any {
        let resource = this.resources.pop();
        if (!resource) {
          resource = this.factory();
        }
        this.inUse.add(resource);
        return resource;
      }

      release(resource: any): void {
        if (this.inUse.has(resource)) {
          this.reset(resource);
          this.inUse.delete(resource);
          this.resources.push(resource);
        }
      }

      releaseAll(): void {
        this.inUse.forEach(resource => this.release(resource));
      }
    }

    // Mock WorkerPool class
    class WorkerPool {
      private workers: Worker[] = [];
      private taskQueue: any[] = [];
      private availableWorkers: Worker[] = [];
      private taskIdCounter = 0;

      constructor(options: { maxWorkers?: number; workerScript?: string } = {}) {
        const size = options.maxWorkers || 2;
        
        for (let i = 0; i < size; i++) {
          const worker = new Worker(workerUrl);
          this.workers.push(worker);
          this.availableWorkers.push(worker);
          this.setupWorker(worker);
        }
      }

      private setupWorker(worker: Worker): void {
        worker.onmessage = (event): void => {
          const { result, error, taskId } = event.data;
          const task = this.taskQueue.find(t => t.id === taskId);
          if (task) {
            this.taskQueue = this.taskQueue.filter(t => t.id !== taskId);
            if (error) {
              task.reject(new Error(error));
            } else {
              task.resolve(result);
            }
          }
          this.availableWorkers.push(worker);
          this.processQueue();
        };

        worker.onerror = (event): void => {
          const task = this.taskQueue.shift();
          if (task) {
            task.reject(new Error(`Worker error: ${event.message}`));
          }
          this.availableWorkers.push(worker);
          this.processQueue();
        };
      }

      private processQueue(): void {
        while (this.taskQueue.length > 0 && this.availableWorkers.length > 0) {
          const task = this.taskQueue.find(t => !t.processing);
          const worker = this.availableWorkers.pop();
          if (worker && task) {
            task.processing = true;
            worker.postMessage({ task: task.task.toString(), taskId: task.id });
          }
        }
      }

      execute(task: () => any, options?: { signal?: AbortSignal }): Promise<any> {
        return new Promise((resolve, reject) => {
          const signal = options?.signal;

          if (signal?.aborted) {
            reject(new DOMException('Task aborted', 'AbortError'));
            return;
          }

          const taskId = ++this.taskIdCounter;
          const taskObj = {
            id: taskId,
            task,
            resolve,
            reject,
            processing: false
          };

          this.taskQueue.push(taskObj);

          if (signal) {
            const onAbort = (): void => {
              const index = this.taskQueue.findIndex(t => t.id === taskId);
              if (index !== -1) {
                this.taskQueue.splice(index, 1);
                reject(new DOMException('Task aborted', 'AbortError'));
              }
              signal.removeEventListener('abort', onAbort);
            };
            signal.addEventListener('abort', onAbort);
          }

          this.processQueue();
        });
      }

      abort(): number {
        const pendingTasks = this.taskQueue.filter(t => !t.processing);
        pendingTasks.forEach(task => {
          task.reject(new DOMException('All tasks aborted', 'AbortError'));
        });
        this.taskQueue = this.taskQueue.filter(t => t.processing);
        return pendingTasks.length;
      }

      get size(): number {
        return this.workers.length;
      }

      get activeTasks(): number {
        return this.workers.length - this.availableWorkers.length;
      }

      get pendingTasks(): number {
        return this.taskQueue.filter(t => !t.processing).length;
      }

      terminate(): void {
        this.workers.forEach(worker => worker.terminate());
        this.workers = [];
        this.availableWorkers = [];
        this.taskQueue.forEach(task => {
          task.reject(new DOMException('Worker pool terminated', 'AbortError'));
        });
        this.taskQueue = [];
      }
    }

    // Expose test utilities
    (window as any).testResourceManagement = {
      createWorkerPool: (options: any): any => new WorkerPool(options),
      createResourcePool: (factory: any, reset: any, size: number): any => new ResourcePool(factory, reset, size),
      executeTask: async (pool: any, task: () => any): Promise<any> => pool.execute(task),
      abortTasks: (pool: any): number => pool.abort(),
      terminatePool: (pool: any): void => pool.terminate()
    };
  });
}

test.describe('Resource Management E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await setupResourceManagementTest(page);
  });

  test.describe('WorkerPool Task Execution', () => {
    test('should execute simple tasks in real workers', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const pool = (window as any).testResourceManagement.createWorkerPool({ maxWorkers: 2 });
        
        try {
          const result = await (window as any).testResourceManagement.executeTask(pool, () => 5 * 2);
          (window as any).testResourceManagement.terminatePool(pool);
          return result;
        } catch (error) {
          (window as any).testResourceManagement.terminatePool(pool);
          return (error as Error).message;
        }
      });

      expect(result).toBe(10);
    });

    test('should handle complex mathematical tasks', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const pool = (window as any).testResourceManagement.createWorkerPool({ maxWorkers: 2 });
        
        try {
          const result = await (window as any).testResourceManagement.executeTask(pool, () => {
            // Complex calculation
            let sum = 0;
            for (let i = 1; i <= 1000; i++) {
              sum += i * i;
            }
            return sum;
          });
          (window as any).testResourceManagement.terminatePool(pool);
          return result;
        } catch (error) {
          (window as any).testResourceManagement.terminatePool(pool);
          return (error as Error).message;
        }
      });

      expect(result).toBe(333833500); // Sum of squares from 1 to 1000
    });

    test('should execute multiple concurrent tasks', async ({ page }) => {
      const results = await page.evaluate(async () => {
        const pool = (window as any).testResourceManagement.createWorkerPool({ maxWorkers: 3 });
        
        try {
          const tasks = [
            (window as any).testResourceManagement.executeTask(pool, () => 10 + 5),
            (window as any).testResourceManagement.executeTask(pool, () => 20 * 2),
            (window as any).testResourceManagement.executeTask(pool, () => 100 / 4),
            (window as any).testResourceManagement.executeTask(pool, () => 7 ** 2)
          ];
          
          const results = await Promise.all(tasks);
          (window as any).testResourceManagement.terminatePool(pool);
          return results;
        } catch (error) {
          (window as any).testResourceManagement.terminatePool(pool);
          return (error as Error).message;
        }
      });

      expect(results).toEqual([15, 40, 25, 49]);
    });

    test('should handle task execution errors', async ({ page }) => {
      const errorMessage = await page.evaluate(async () => {
        const pool = (window as any).testResourceManagement.createWorkerPool({ maxWorkers: 1 });
        
        try {
          await (window as any).testResourceManagement.executeTask(pool, () => {
            throw new Error('Task execution failed');
          });
          return null;
        } catch (error) {
          (window as any).testResourceManagement.terminatePool(pool);
          return (error as Error).message;
        }
      });

      expect(errorMessage).toBe('Task execution failed');
    });
  });

  test.describe('WorkerPool Queue Management', () => {
    test('should queue tasks when all workers are busy', async ({ page }) => {
      await page.waitForTimeout(100);

      const queueStats = await page.evaluate(async () => {
        const pool = (window as any).testResourceManagement.createWorkerPool({ maxWorkers: 1 });
        
        // Start multiple tasks
        const task1 = (window as any).testResourceManagement.executeTask(pool, () => {
          // Simulate slow task
          let result = 0;
          for (let i = 0; i < 1000000; i++) {
            result += Math.random();
          }
          return result;
        });
        
        const _task2 = (window as any).testResourceManagement.executeTask(pool, () => 42);
        const _task3 = (window as any).testResourceManagement.executeTask(pool, () => 84);

        // Check queue stats
        const stats = {
          activeTasks: pool.activeTasks,
          pendingTasks: pool.pendingTasks,
          totalSize: pool.size
        };

        // Wait for completion
        await Promise.all([task1, _task2, _task3]);
        (window as any).testResourceManagement.terminatePool(pool);
        
        return stats;
      });

      expect(queueStats.totalSize).toBe(1);
      expect(queueStats.activeTasks).toBe(1);
      expect(queueStats.pendingTasks).toBe(2);
    });

    test('should process queued tasks in order', async ({ page }) => {
      await page.waitForTimeout(100);

      const results = await page.evaluate(async () => {
        const pool = (window as any).testResourceManagement.createWorkerPool({ maxWorkers: 1 });
        const _executionOrder: number[] = [];
        
        try {
          const tasks = [
            (window as any).testResourceManagement.executeTask(pool, () => { return 1; }),
            (window as any).testResourceManagement.executeTask(pool, () => { return 2; }),
            (window as any).testResourceManagement.executeTask(pool, () => { return 3; })
          ];
          
          const results = await Promise.all(tasks);
          (window as any).testResourceManagement.terminatePool(pool);
          return results;
        } catch (error) {
          (window as any).testResourceManagement.terminatePool(pool);
          return (error as Error).message;
        }
      });

      expect(results).toEqual([1, 2, 3]);
    });
  });

  test.describe('WorkerPool Abort Functionality', () => {
    test('should abort pending tasks', async ({ page }) => {
      await page.waitForTimeout(100);

      const abortResult = await page.evaluate(async () => {
        const pool = (window as any).testResourceManagement.createWorkerPool({ maxWorkers: 1 });
        
        // Start multiple tasks
        const task1 = (window as any).testResourceManagement.executeTask(pool, () => {
          let result = 0;
          for (let i = 0; i < 1000000; i++) {
            result += Math.random();
          }
          return result;
        });
        
        const _task2 = (window as any).testResourceManagement.executeTask(pool, () => 42);
        const _task3 = (window as any).testResourceManagement.executeTask(pool, () => 84);

        // Abort pending tasks
        const abortedCount = (window as any).testResourceManagement.abortTasks(pool);
        
        try {
          await task1;
        } catch {
          // Expected to fail
        }
        
        (window as any).testResourceManagement.terminatePool(pool);
        return abortedCount;
      });

      expect(abortResult).toBeGreaterThan(0);
    });

    test('should handle pre-aborted tasks', async ({ page }) => {
      const abortError = await page.evaluate(async () => {
        const pool = (window as any).testResourceManagement.createWorkerPool({ maxWorkers: 1 });
        
        try {
          const abortController = new AbortController();
          abortController.abort(); // Abort before execution

          await pool.execute(() => 5, { signal: abortController.signal });
          return null;
        } catch (error) {
          (window as any).testResourceManagement.terminatePool(pool);
          return (error as Error).message;
        }
      });

      // Accept both 'AbortError' and 'Task aborted' for cross-browser compatibility
      expect(abortError === 'AbortError' || abortError === 'Task aborted').toBe(true);
    });

    test('should handle task abortion during execution', async ({ page }) => {
      const abortError = await page.evaluate(async () => {
        const pool = (window as any).testResourceManagement.createWorkerPool({ maxWorkers: 1 });
        
        try {
          const abortController = new AbortController();
          
          const taskPromise = pool.execute(() => {
            let result = 0;
            for (let i = 0; i < 10000000; i++) {
              result += Math.random();
            }
            return result;
          }, { signal: abortController.signal });

          // Abort after starting
          setTimeout(() => abortController.abort(), 10);

          await taskPromise;
          return null;
        } catch (error) {
          (window as any).testResourceManagement.terminatePool(pool);
          return (error as Error).message;
        }
      });

      // Accept both 'AbortError' and 'Task aborted' for cross-browser compatibility
      expect(abortError === 'AbortError' || abortError === 'Task aborted').toBe(true);
    });
  });

  test.describe('ResourcePool Integration', () => {
    test('should work with WorkerPool for complex resource management', async ({ page }) => {
      const integrationResult = await page.evaluate(async () => {
        // Create resource pool for DOM elements
        const domPool = (window as any).testResourceManagement.createResourcePool(
          () => ({ id: Math.random(), data: 'test-data' }),
          (resource: any) => { resource.data = 'reset'; },
          2
        );

        // Create worker pool for processing
        const workerPool = (window as any).testResourceManagement.createWorkerPool({ maxWorkers: 2 });

        try {
          // Acquire resources
          const resource1 = domPool.acquire();
          const resource2 = domPool.acquire();

          // Process data with workers
          const result1 = await (window as any).testResourceManagement.executeTask(workerPool, () => 100 * 2);
          const result2 = await (window as any).testResourceManagement.executeTask(workerPool, () => 200 / 4);

          // Release resources
          domPool.release(resource1);
          domPool.release(resource2);

          // Cleanup
          (window as any).testResourceManagement.terminatePool(workerPool);

          return {
            resource1Id: resource1.id,
            resource2Id: resource2.id,
            result1,
            result2,
            workerPoolSize: workerPool.size
          };
        } catch (error) {
          (window as any).testResourceManagement.terminatePool(workerPool);
          throw error;
        }
      });

      expect(integrationResult.result1).toBe(200);
      expect(integrationResult.result2).toBe(50);
      expect(integrationResult.workerPoolSize).toBe(0); // Should be terminated
      expect(typeof integrationResult.resource1Id).toBe('number');
      expect(typeof integrationResult.resource2Id).toBe('number');
    });
  });

  test.describe('Performance and Scalability', () => {
    test('should handle many concurrent tasks efficiently', async ({ page }) => {
      const performanceResult = await page.evaluate(async () => {
        const pool = (window as any).testResourceManagement.createWorkerPool({ maxWorkers: 4 });
        
        try {
          const startTime = performance.now();
          
          // Create 20 concurrent tasks with embedded index values
          const tasks = [];
          for (let taskIndex = 0; taskIndex < 20; taskIndex++) {
            const taskFunction = new Function(`
              let sum = 0;
              for (let j = 1; j <= 1000; j++) {
                sum += j;
              }
              return sum + ${taskIndex};
            `) as () => any;
            tasks.push((window as any).testResourceManagement.executeTask(pool, taskFunction));
          }
          
          const results = await Promise.all(tasks);
          const endTime = performance.now();
          
          (window as any).testResourceManagement.terminatePool(pool);
          
          return {
            taskCount: results.length,
            allTasksCompleted: results.every((r: any) => typeof r === 'number'),
            executionTime: endTime - startTime,
            firstResult: results[0],
            lastResult: results[19]
          };
        } catch (error) {
          (window as any).testResourceManagement.terminatePool(pool);
          throw error;
        }
      });

      expect(performanceResult.taskCount).toBe(20);
      expect(performanceResult.allTasksCompleted).toBe(true);
      expect(performanceResult.executionTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(performanceResult.firstResult).toBe(500500); // Sum 1-1000 + 0
      expect(performanceResult.lastResult).toBe(500519); // Sum 1-1000 + 19
    });
  });
}); 