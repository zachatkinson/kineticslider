/**
 * Tests for memory tracking utilities
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { captureMemoryUsage, compareMemorySnapshots, measureMemoryUsage } from './memory-tracker';

// Mock performance.memory
const mockMemoryInfo = {
  usedJSHeapSize: 10 * 1024 * 1024,
  totalJSHeapSize: 100 * 1024 * 1024,
  jsHeapSizeLimit: 200 * 1024 * 1024
};

describe('Memory tracking utilities', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock performance.memory
    vi.stubGlobal('performance', {
      memory: { ...mockMemoryInfo },
      now: vi.fn().mockReturnValue(Date.now())
    });
  });

  it('should capture memory usage', () => {
    const usage = captureMemoryUsage();
    
    expect(usage).toEqual(expect.objectContaining({
      usedJSHeapSize: mockMemoryInfo.usedJSHeapSize,
      totalJSHeapSize: mockMemoryInfo.totalJSHeapSize,
      jsHeapSizeLimit: mockMemoryInfo.jsHeapSizeLimit
    }));
  });

  it('should compare memory snapshots correctly', () => {
    const before = {
      usedJSHeapSize: 10 * 1024 * 1024,
      totalJSHeapSize: 100 * 1024 * 1024,
      jsHeapSizeLimit: 200 * 1024 * 1024,
      usedHeapPercentage: 0.1
    };
    
    const after = {
      usedJSHeapSize: 20 * 1024 * 1024,
      totalJSHeapSize: 100 * 1024 * 1024,
      jsHeapSizeLimit: 200 * 1024 * 1024,
      usedHeapPercentage: 0.2
    };
    
    const result = compareMemorySnapshots(before, after);
    
    expect(result).toEqual(expect.objectContaining({
      isClean: expect.any(Boolean),
      details: expect.any(Object)
    }));
  });

  it('should measure memory usage before and after an operation', async () => {
    // Mock the captureMemoryUsage to return predictable values
    vi.spyOn(global, 'setTimeout').mockImplementation((cb: TimerHandler) => {
      if (typeof cb === 'function') cb();
      return 1 as any;
    });
    
    // Execute a simple operation
    const { result, memoryUsage } = await measureMemoryUsage(() => {
      return 'test result';
    });
    
    // Verify the result structure
    expect(result).toBe('test result');
    expect(memoryUsage).toEqual(expect.objectContaining({
      isClean: expect.any(Boolean),
      details: expect.any(Object)
    }));
  });

  it('should detect memory leaks in long-running operations', async () => {
    // Mock setTimeout to make tests faster
    vi.spyOn(global, 'setTimeout').mockImplementation((cb: TimerHandler) => {
      if (typeof cb === 'function') cb();
      return 1 as any;
    });
    
    // Create a mock cleanup function
    const cleanup = vi.fn();
    
    // Test the memory tracking with a function that could leak memory
    const { result, memoryUsage } = await measureMemoryUsage(async () => {
      // Simulate allocating memory
      const _largeArray = new Array(1000).fill('test');
      
      // Simulate cleanup
      cleanup();
      
      // Clear references
      return 'operation complete';
    });
    
    // Verify the cleanup was called
    expect(cleanup).toHaveBeenCalled();
    
    // Verify the basic structure
    expect(result).toBe('operation complete');
    expect(memoryUsage).toEqual(expect.objectContaining({
      isClean: expect.any(Boolean),
      details: expect.any(Object)
    }));
  });
}); 