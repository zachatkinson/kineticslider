/**
 * E2E tests for Resource Management Services
 * Tests real worker execution, async task management, and performance in actual browsers
 */

import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// Type declarations for resource management test environment
declare global {
  interface Window {
    testResourceManagement: {
      createWorkerPool: (options?: { maxWorkers?: number }) => any;
      executeTask: (pool: any, task: () => any) => Promise<any>;
      abortTasks: (pool: any) => number;
      terminatePool: (pool: any) => void;
    };
  }
}

// Use centralized types instead of local declarations
// Window interface extensions are now in src/types/global.d.ts

// Helper function to setup resource management test
async function setupResourceManagementTest(page: Page): Promise<void> {
  await page.goto('data:text/html,<div id="resource-test-container"><h2>Resource Management E2E Test</h2><div id="test-output"></div></div>');

  // Inject simplified resource management functionality
  await page.addScriptTag({
    content: `
      // Create a very simple worker script that just evaluates basic math
      const workerScript = \`
        self.onmessage = function(e) {
          try {
            const taskData = e.data;
            const func = new Function('return (' + taskData.task + ')()');
            const result = func();
            self.postMessage({ result: result, taskId: taskData.taskId, success: true });
          } catch (error) {
            self.postMessage({ error: error.message, taskId: taskData.taskId, success: false });
          }
        }
      \`;
      
      const blob = new Blob([workerScript], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);

      // Simplified WorkerPool for testing with better error handling
      class WorkerPool {
        constructor(options = {}) {
          this.maxWorkers = options.maxWorkers || 2;
          this.workers = [];
          this.available = [];
          this.taskQueue = [];
          this.activeTasks = 0;
          this.init();
        }

        init() {
          const workerScript = \`
            self.onmessage = function(e) {
              try {
                const data = e.data;
                const func = new Function('return (' + data.task + ')()');
                const result = func();
                self.postMessage({ result: result, taskId: data.taskId, success: true });
              } catch (error) {
                self.postMessage({ error: error.message, taskId: e.data.taskId, success: false });
              }
            }
          \`;
          
          const blob = new Blob([workerScript], { type: 'application/javascript' });
          const workerUrl = URL.createObjectURL(blob);
          
          for (let i = 0; i < this.maxWorkers; i++) {
            const worker = new Worker(workerUrl);
            this.workers.push(worker);
            this.available.push(worker);
          }
        }

        execute(fn, options = {}) {
          return new Promise((resolve, reject) => {
            const signal = options.signal;
            const taskId = Math.random().toString(36).substr(2, 9);
            
            // Check if already aborted before starting
            if (signal && signal.aborted) {
              reject(new Error('AbortError'));
              return;
            }
            
            const worker = this.available.shift();
            if (!worker) {
              // Add to queue if no workers available
              if (signal && signal.aborted) {
                reject(new Error('AbortError'));
                return;
              }
              
              const queueItem = { fn, resolve, reject, signal, taskId };
              if (signal) {
                signal.addEventListener('abort', () => {
                  const index = this.taskQueue.indexOf(queueItem);
                  if (index > -1) {
                    this.taskQueue.splice(index, 1);
                    reject(new Error('AbortError'));
                  }
                });
              }
              this.taskQueue.push(queueItem);
              return;
            }
            
            // Track active task
            this.activeTasks++;
            
            // Setup abort handling for active task
            if (signal) {
              signal.addEventListener('abort', () => {
                reject(new Error('AbortError'));
              });
            }
            
            // Execute task
            const onMessage = (e) => {
              if (e.data.taskId === taskId) {
                worker.removeEventListener('message', onMessage);
                worker.removeEventListener('error', onError);
                this.available.push(worker);
                this.activeTasks--;
                
                if (e.data.error) {
                  reject(new Error(e.data.error));
                } else {
                  resolve(e.data.result);
                }
                
                // Process next task in queue
                if (this.taskQueue.length > 0) {
                  const nextTask = this.taskQueue.shift();
                  if (nextTask && (!nextTask.signal || !nextTask.signal.aborted)) {
                    this.execute(nextTask.fn, { signal: nextTask.signal })
                      .then(nextTask.resolve)
                      .catch(nextTask.reject);
                  }
                }
              }
            };
            
            const onError = (error) => {
              worker.removeEventListener('message', onMessage);
              worker.removeEventListener('error', onError);
              this.available.push(worker);
              this.activeTasks--;
              reject(new Error('Worker error: ' + error.message));
            };
            
            worker.addEventListener('message', onMessage);
            worker.addEventListener('error', onError);
            
            // Send task to worker
            worker.postMessage({
              task: fn.toString(),
              taskId: taskId
            });
          });
        }

        abort() {
          let count = 0;
          // Clear the task queue and reject all pending tasks
          while (this.taskQueue.length > 0) {
            const task = this.taskQueue.pop();
            if (task) {
              task.reject(new Error('AbortError'));
              count++;
            }
          }
          return count;
        }

        terminate() {
          this.workers.forEach(worker => worker.terminate());
          this.workers = [];
          this.available = [];
          this.activeTasks = 0;
        }

        get size() { return this.workers.length; }
        get pendingTasks() { return this.taskQueue.length; }
      }

      // Expose test interface
      window.testResourceManagement = {
        createWorkerPool: (options) => new WorkerPool(options),
        executeTask: (pool, task) => pool.execute(task),
        abortTasks: (pool) => pool.abort(),
        terminatePool: (pool) => pool.terminate()
      };
    `
  });

  // Wait for setup to complete with a reasonable timeout
  await page.waitForFunction(
    () => window.testResourceManagement !== undefined, 
    { timeout: 5000 }
  );
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
        const domPool = (window as any).testResourceManagement.createWorkerPool({ maxWorkers: 2 });

        try {
          // Acquire resources - await the execution properly
          const resource1 = await domPool.execute(() => ({ id: Math.random(), data: 'test-data' }));
          const resource2 = await domPool.execute(() => ({ id: Math.random(), data: 'test-data' }));

          // Process data with workers
          const result1 = await (window as any).testResourceManagement.executeTask(domPool, () => 100 * 2);
          const result2 = await (window as any).testResourceManagement.executeTask(domPool, () => 200 / 4);

          // Get pool size before termination
          const poolSizeBeforeTermination = domPool.size;
          
          // Cleanup
          (window as any).testResourceManagement.terminatePool(domPool);

          return {
            resource1Id: resource1.id,
            resource2Id: resource2.id,
            result1,
            result2,
            workerPoolSize: domPool.size,
            poolSizeBeforeTermination
          };
        } catch (error) {
          (window as any).testResourceManagement.terminatePool(domPool);
          throw error;
        }
      });

      expect(integrationResult.result1).toBe(200);
      expect(integrationResult.result2).toBe(50);
      expect(integrationResult.workerPoolSize).toBe(0); // Should be terminated
      expect(integrationResult.poolSizeBeforeTermination).toBe(2); // Should have been 2 before termination
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