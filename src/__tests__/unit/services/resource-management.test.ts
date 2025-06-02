/**
 * Unit tests for Resource Management Services
 * Tests resource pooling, worker pool management, and performance optimization
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ResourcePool, WorkerPool } from '../../../services/resource-management';

// Test utilities following DRY principles
const createMockElement = (id: string = 'test'): HTMLDivElement => {
  const element = document.createElement('div');
  element.id = id;
  element.textContent = `Element ${id}`;
  return element;
};

const createElementFactory = (prefix: string = 'test') => {
  let counter = 0;
  return () => createMockElement(`${prefix}-${++counter}`);
};

const createElementReset = () => (element: HTMLDivElement) => {
  element.textContent = '';
  element.className = '';
  element.removeAttribute('style');
  element.removeAttribute('data-test');
};

// Simple Mock Worker for unit tests (no async behavior)
class MockWorker {
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public onerror: ((event: ErrorEvent) => void) | null = null;
  public onmessageerror: ((event: MessageEvent) => void) | null = null;
  private terminated = false;

  constructor(public scriptURL: string) {
    // Simulate worker creation errors for invalid scripts (synchronously)
    if (scriptURL.includes('invalid')) {
      if (this.onerror) {
        this.onerror(new ErrorEvent('error', { 
          message: 'Failed to load worker script',
          filename: scriptURL 
        }));
      }
    }
  }

  postMessage(_message: any): void {
    if (this.terminated) {
      throw new Error('Worker has been terminated');
    }
    // Unit tests don't need actual async message handling
  }

  terminate(): void {
    this.terminated = true;
    this.onmessage = null;
    this.onerror = null;
    this.onmessageerror = null;
  }
}

// Mock global Worker
const originalWorker = global.Worker;

describe('Resource Management Services', () => {
  beforeEach(() => {
    // Mock Worker constructor
    global.Worker = MockWorker as any;
  });

  afterEach(() => {
    // Restore original Worker
    global.Worker = originalWorker;
    vi.clearAllMocks();
  });

  describe('ResourcePool', () => {
    describe('Basic Functionality', () => {
      it('should create initial resources', () => {
        const factory = vi.fn(createElementFactory());
        const reset = vi.fn(createElementReset());
        const _pool = new ResourcePool(factory, reset, 3);

        expect(factory).toHaveBeenCalledTimes(3);
      });

      it('should acquire resources from pool', () => {
        const factory = createElementFactory();
        const reset = createElementReset();
        const pool = new ResourcePool(factory, reset, 2);

        const resource1 = pool.acquire();
        const resource2 = pool.acquire();

        expect(resource1).toBeInstanceOf(HTMLDivElement);
        expect(resource2).toBeInstanceOf(HTMLDivElement);
        expect(resource1).not.toBe(resource2);
      });

      it('should create new resource when pool is empty', () => {
        const factory = vi.fn(createElementFactory());
        const reset = createElementReset();
        const pool = new ResourcePool(factory, reset, 1);

        // Acquire more resources than initial size
        const resource1 = pool.acquire();
        const resource2 = pool.acquire();

        expect(factory).toHaveBeenCalledTimes(2); // 1 initial + 1 new
        expect(resource1).toBeInstanceOf(HTMLDivElement);
        expect(resource2).toBeInstanceOf(HTMLDivElement);
      });

      it('should release resources back to pool', () => {
        const factory = createElementFactory();
        const reset = vi.fn(createElementReset());
        const pool = new ResourcePool(factory, reset, 1);

        const resource = pool.acquire();
        resource.textContent = 'modified';
        resource.className = 'test-class';

        pool.release(resource);

        expect(reset).toHaveBeenCalledWith(resource);
        expect(reset).toHaveBeenCalledTimes(1);
      });

      it('should reuse released resources', () => {
        const factory = vi.fn(createElementFactory());
        const reset = createElementReset();
        const pool = new ResourcePool(factory, reset, 1);

        const resource1 = pool.acquire();
        pool.release(resource1);
        const resource2 = pool.acquire();

        expect(resource1).toBe(resource2);
        expect(factory).toHaveBeenCalledTimes(1); // Only initial creation
      });
    });

    describe('Resource Tracking', () => {
      it('should track resources in use', () => {
        const factory = createElementFactory();
        const reset = vi.fn(createElementReset());
        const pool = new ResourcePool(factory, reset, 2);

        const resource1 = pool.acquire();
        const resource2 = pool.acquire();

        // Try to release a resource not in use
        const externalResource = createMockElement('external');
        pool.release(externalResource);

        // Should not call reset for external resource
        expect(reset).not.toHaveBeenCalled();

        // Release actual resources
        pool.release(resource1);
        pool.release(resource2);

        expect(reset).toHaveBeenCalledTimes(2);
      });

      it('should handle double release gracefully', () => {
        const factory = createElementFactory();
        const reset = vi.fn(createElementReset());
        const pool = new ResourcePool(factory, reset, 1);

        const resource = pool.acquire();
        pool.release(resource);
        pool.release(resource); // Double release

        expect(reset).toHaveBeenCalledTimes(1);
      });
    });

    describe('Bulk Operations', () => {
      it('should release all resources', () => {
        const factory = createElementFactory();
        const reset = vi.fn(createElementReset());
        const pool = new ResourcePool(factory, reset, 2);

        const resource1 = pool.acquire();
        const resource2 = pool.acquire();
        const resource3 = pool.acquire(); // Forces new creation

        pool.releaseAll();

        expect(reset).toHaveBeenCalledTimes(3);
        expect(reset).toHaveBeenCalledWith(resource1);
        expect(reset).toHaveBeenCalledWith(resource2);
        expect(reset).toHaveBeenCalledWith(resource3);
      });

      it('should handle releaseAll with no resources in use', () => {
        const factory = createElementFactory();
        const reset = vi.fn(createElementReset());
        const pool = new ResourcePool(factory, reset, 2);

        pool.releaseAll();

        expect(reset).not.toHaveBeenCalled();
      });
    });

    describe('Edge Cases', () => {
      it('should handle factory that throws errors', () => {
        const factory = vi.fn(() => {
          throw new Error('Factory error');
        });
        const reset = createElementReset();

        expect(() => {
          new ResourcePool(factory, reset, 1);
        }).toThrow('Factory error');
      });

      it('should handle reset function that throws errors', () => {
        const factory = createElementFactory();
        const reset = vi.fn(() => {
          throw new Error('Reset error');
        });
        const pool = new ResourcePool(factory, reset, 1);

        const resource = pool.acquire();

        expect(() => {
          pool.release(resource);
        }).toThrow('Reset error');
      });

      it('should work with zero initial size', () => {
        const factory = vi.fn(createElementFactory());
        const reset = createElementReset();
        const pool = new ResourcePool(factory, reset, 0);

        expect(factory).not.toHaveBeenCalled();

        const resource = pool.acquire();
        expect(factory).toHaveBeenCalledTimes(1);
        expect(resource).toBeInstanceOf(HTMLDivElement);
      });
    });
  });

  describe('WorkerPool', () => {
    describe('Initialization', () => {
      it('should create worker pool with specified size', () => {
        const _pool = new WorkerPool({ 
          maxWorkers: 3,
          workerScript: '/test-worker.js'
        });

        expect(_pool.size).toBe(3);
        _pool.terminate();
      });

      it('should handle worker creation errors gracefully', () => {
        const errorHandler = vi.fn();
        
        const _pool = new WorkerPool({ 
          maxWorkers: 2,
          workerScript: '/invalid-worker.js',
          errorHandler
        });

        expect(_pool.size).toBe(2);
        _pool.terminate();
      });

      it('should initialize with default options', () => {
        const pool = new WorkerPool({ 
          maxWorkers: 2,
          workerScript: '/worker.js'
        });

        expect(pool).toBeDefined();
        expect(pool.size).toBe(2);
        expect(pool.activeTasks).toBe(0);
        expect(pool.pendingTasks).toBe(0);
        pool.terminate();
      });

      it('should handle different pool sizes', () => {
        const pool1 = new WorkerPool({ maxWorkers: 1, workerScript: '/worker.js' });
        const pool2 = new WorkerPool({ maxWorkers: 5, workerScript: '/worker.js' });

        expect(pool1.size).toBe(1);
        expect(pool2.size).toBe(5);
        
        pool1.terminate();
        pool2.terminate();
      });
    });

    describe('Configuration', () => {
      it('should accept custom worker script path', () => {
        const customScript = '/custom-worker.js';
        const pool = new WorkerPool({ 
          maxWorkers: 2,
          workerScript: customScript
        });

        expect(pool.size).toBe(2);
        pool.terminate();
      });

      it('should handle invalid worker scripts', () => {
        const errorHandler = vi.fn();
        
        const pool = new WorkerPool({ 
          maxWorkers: 1,
          workerScript: '/invalid-script.js',
          errorHandler
        });

        expect(pool.size).toBe(1);
        pool.terminate();
      });
    });

    describe('Basic Properties', () => {
      it('should provide performance metrics', () => {
        const pool = new WorkerPool({ 
          maxWorkers: 3,
          workerScript: '/worker.js'
        });

        expect(pool.size).toBe(3);
        expect(pool.activeTasks).toBe(0);
        expect(pool.pendingTasks).toBe(0);
        pool.terminate();
      });

      it('should handle pool termination', () => {
        const pool = new WorkerPool({ 
          maxWorkers: 2,
          workerScript: '/worker.js'
        });

        expect(pool.size).toBe(2);
        
        pool.terminate();
        
        expect(pool.size).toBe(0);
      });
    });

    describe('Error Handling', () => {
      it('should handle worker message posting errors', async () => {
        const errorHandler = vi.fn();
        const pool = new WorkerPool({ 
          maxWorkers: 1,
          workerScript: '/worker.js',
          errorHandler
        });

        // Mock postMessage to throw error
        const originalPostMessage = MockWorker.prototype.postMessage;
        MockWorker.prototype.postMessage = vi.fn(() => {
          throw new Error('PostMessage error');
        });

        // Test that execute method handles errors properly
        try {
          await pool.execute(() => 5);
          // Should not reach here
          expect.fail('Expected execute to throw an error');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toBe('PostMessage error');
        }

        // Restore original method
        MockWorker.prototype.postMessage = originalPostMessage;
        pool.terminate();
      });

      it('should handle termination errors gracefully', () => {
        const errorHandler = vi.fn();
        const pool = new WorkerPool({ 
          maxWorkers: 1,
          workerScript: '/worker.js',
          errorHandler
        });

        // Mock worker termination error
        const originalTerminate = MockWorker.prototype.terminate;
        MockWorker.prototype.terminate = vi.fn(() => {
          throw new Error('Termination error');
        });

        expect(() => pool.terminate()).not.toThrow();
        
        // Restore original method
        MockWorker.prototype.terminate = originalTerminate;
      });

      it('should handle window registry cleanup', () => {
        // Mock window with worker registry
        const mockRegistry = new Set();
        const originalWindow = global.window;
        
        global.window = {
          __WORKER_REGISTRY__: mockRegistry
        } as any;

        const pool = new WorkerPool({ 
          maxWorkers: 1,
          workerScript: '/worker.js'
        });

        pool.terminate();

        // Restore window
        global.window = originalWindow;
      });
    });
  });

  describe('Integration Tests', () => {
    it('should work together for basic resource management', () => {
      // Create resource pool for DOM elements
      const domPool = new ResourcePool(
        createElementFactory('integration'),
        createElementReset(),
        2
      );

      // Create worker pool for processing
      const workerPool = new WorkerPool({ 
        maxWorkers: 2,
        workerScript: '/integration-worker.js'
      });

      // Acquire resources
      const element1 = domPool.acquire();
      const element2 = domPool.acquire();

      expect(element1).toBeInstanceOf(HTMLDivElement);
      expect(element2).toBeInstanceOf(HTMLDivElement);

      // Release resources
      domPool.release(element1);
      domPool.release(element2);

      // Cleanup
      workerPool.terminate();

      expect(domPool).toBeDefined();
      expect(workerPool.size).toBe(0);
    });
  });
}); 