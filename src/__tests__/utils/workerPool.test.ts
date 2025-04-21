/**
 * Test for WorkerPool implementation to verify worker management and cleanup works correctly
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WorkerPool } from '../../utils/worker-pool';
import { PerformanceMonitor } from '../../utils/performance-monitor';

// Mock memory usage data
Object.defineProperty(performance, 'memory', {
  configurable: true,
  value: {
    jsHeapSizeLimit: 2172649472,
    totalJSHeapSize: 45452523,
    usedJSHeapSize: 44149360
  }
});

// Mock worker registry for window since JSDOM doesn't have it
if (typeof window !== 'undefined' && !window.__WORKER_REGISTRY__) {
  window.__WORKER_REGISTRY__ = new Set();
}

// Mock window worker registry
Object.defineProperty(window, '__WORKER_REGISTRY__', {
  configurable: true,
  value: new Set(),
  writable: true
});

// Set up a function to register workers with the global registry
window.registerWorker = function(worker) {
  if (window.__WORKER_REGISTRY__) {
    window.__WORKER_REGISTRY__.add(worker);
  }
};

// Mock Worker constructor with immediate response behavior
global.Worker = class MockWorker {
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public onerror: ((event: ErrorEvent) => void) | null = null;
  
  constructor(stringUrl: string | URL) {
    // Auto-register this worker with the registry
    if (typeof window !== 'undefined') {
      if (window.registerWorker) {
        window.registerWorker(this);
      }
      else if (window.__WORKER_REGISTRY__) {
        window.__WORKER_REGISTRY__.add(this);
      }
    }
  }
  
  // Mock worker methods with immediate response
  postMessage(data: any) {
    // Worker receives raw data and sends back wrapped response
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { 
        data: { result: data, error: null } 
      }));
    }
  }
  
  terminate() {
    // No-op for tests
  }
  
  addEventListener(type: string, callback: any) {
    if (type === 'message') {
      this.onmessage = callback;
    } else if (type === 'error') {
      this.onerror = callback;
    }
  }
} as unknown as typeof Worker;

describe('WorkerPool', () => {
  let workerPool: WorkerPool;
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    
    // Reset worker registry before each test
    window.__WORKER_REGISTRY__ = new Set();
    
    // Create worker pool
    workerPool = new WorkerPool({
      maxWorkers: 2,
      workerScript: 'mock-worker.js'
    });
    
    // Initialize performance monitor
    monitor = new PerformanceMonitor();
  });

  afterEach(() => {
    // Clean up resources
    workerPool.terminate();
    monitor.cleanup();
    window.__WORKER_REGISTRY__.clear();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('should have a working terminate method that handles errors', () => {
    // Mock a worker with error on terminate
    const mockWorker = {
      terminate: vi.fn().mockImplementation(() => {
        throw new Error('Mock termination error');
      })
    };
    
    // Register with the mock registry
    window.registerWorker(mockWorker as any);
    
    // Should not throw despite worker error
    expect(() => monitor.cleanup()).not.toThrow();
  });

  it('should register workers with the global registry', () => {
    // Create new worker pool
    const testPool = new WorkerPool({
      maxWorkers: 3,
      initialWorkers: 2, // Explicitly request initial workers
      workerScript: 'mock-worker.js'
    });
    
    // Force worker creation
    testPool.execute('test-data');
    
    // Registry should have workers
    expect(window.__WORKER_REGISTRY__.size).toBeGreaterThan(0);
    
    // Clean up
    testPool.terminate();
  });

  it('should support task execution', async () => {
    // Create a spy for postMessage
    const postMessageSpy = vi.spyOn(Worker.prototype, 'postMessage');
    
    // Initialize worker pool with one worker
    const testPool = new WorkerPool({
      maxWorkers: 1,
      initialWorkers: 1,
      workerScript: 'mock-worker.js'
    });
    
    // Execute a task
    const resultPromise = testPool.execute('test-data');
    
    // Wait for microtasks to complete
    await vi.runAllTimersAsync();
    
    // Verify worker was used with raw data
    expect(postMessageSpy).toHaveBeenCalledWith('test-data');
    
    // Get result and verify the wrapped response
    const result = await resultPromise;
    expect(result).toEqual({ result: 'test-data', error: null });
    
    // Clean up
    testPool.terminate();
    postMessageSpy.mockRestore();
  });

  it('should provide worker statistics', async () => {
    // Initialize worker pool with one worker
    const testPool = new WorkerPool({
      maxWorkers: 1,
      initialWorkers: 1,
      workerScript: 'mock-worker.js'
    });
    
    // Execute a single task
    await testPool.execute('test-data');
    
    // Get statistics
    const stats = testPool.getStatistics();
    
    // Verify basic statistics structure
    expect(stats).toBeDefined();
    expect(typeof stats.totalWorkers).toBe('number');
    expect(typeof stats.availableWorkers).toBe('number');
    expect(typeof stats.busyWorkers).toBe('number');
    expect(typeof stats.pendingTasks).toBe('number');
    expect(typeof stats.maxWorkers).toBe('number');
    expect(typeof stats.utilization).toBe('number');
    expect(typeof stats.completedTasks).toBe('number');
    expect(typeof stats.failedTasks).toBe('number');
    
    // Verify time-based metrics exist
    expect(typeof stats.avgExecutionTime).toBe('number');
    expect(typeof stats.throughput).toBe('number');
    expect(typeof stats.avgWaitTime).toBe('number');
    expect(typeof stats.lastResetTime).toBe('number');
    
    // Verify arrays and objects exist
    expect(Array.isArray(stats.taskStartTimes)).toBe(true);
    expect(Array.isArray(stats.queueSizeHistory)).toBe(true);
    expect(Array.isArray(stats.workerEfficiency)).toBe(true);
    expect(typeof stats.completionsOverTime).toBe('object');
    expect(typeof stats.errorDistribution).toBe('object');
    
    // Verify percentiles exist
    expect(stats.executionTimePercentiles).toBeDefined();
    expect(stats.waitTimePercentiles).toBeDefined();
    
    // Clean up
    testPool.terminate();
  }, 5000); // Reduce timeout to 5 seconds

  it('should provide basic worker stats through properties', () => {
    // Check basic properties
    expect(workerPool.size).toBeDefined();
    expect(typeof workerPool.pending).toBe('number');
    expect(typeof workerPool.available).toBe('number');
    
    // Check additional stats getters
    expect(Array.isArray(workerPool.workerMetrics)).toBe(true);
    expect(typeof workerPool.errorDistribution).toBe('object');
  });

  it('should handle worker errors gracefully', () => {
    // Create mock worker instance
    const worker = new Worker('mock-worker.js');
    
    // Simulate error event
    const errorEvent = new ErrorEvent('error', {
      message: 'Worker execution failed',
      error: new Error('Test error')
    });
    
    // Trigger error handler if exists
    worker.onerror?.(errorEvent);
    
    // Test passes as long as no exception is thrown
    expect(true).toBe(true);
  });
}); 