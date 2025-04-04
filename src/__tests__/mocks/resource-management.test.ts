/**
 * Tests for resource management mocks
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockTerminate, WorkerPool, ResourcePool as _ResourcePool } from './resource-management.mock';

describe('Resource Management Mocks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('WorkerPool should have a terminate method', () => {
    const workerPool = new WorkerPool();
    
    // Verify terminate exists and is a function 
    expect(workerPool.terminate).toBeDefined();
    expect(typeof workerPool.terminate).toBe('function');
    
    // Call terminate and verify the mock was called
    void workerPool.terminate();
    expect(mockTerminate).toHaveBeenCalled();
  });
  
  it('WorkerPool execute returns a promise that resolves with the task result', async () => {
    const workerPool = new WorkerPool();
    const result = await workerPool.execute(() => 'test result');
    expect(result).toBe('test result');
  });
}); 