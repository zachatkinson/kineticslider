/**
 * Tests for PerformanceMonitor
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PerformanceMonitor } from '../../utils/performance-monitor';

// Mock dependencies
vi.mock('../../services/resource-management', () => {
  const mockTerminate = vi.fn();
  
  return {
    ResourcePool: vi.fn().mockImplementation(() => ({
      acquire: vi.fn(),
      release: vi.fn(),
      releaseAll: vi.fn(),
    })),
    WorkerPool: vi.fn().mockImplementation(() => ({
      execute: vi.fn().mockImplementation((task: () => unknown) => 
        Promise.resolve(typeof task === 'function' ? task() : null)
      ),
      terminate: mockTerminate,
    })),
  };
});

// Mock for the WorkerPool
vi.mock('../../utils/worker-pool', () => {
  return {
    WorkerPool: class MockWorkerPool {
      terminate = vi.fn();
    }
  };
});

// Extend the PerformanceMonitor class for testing
class TestablePerformanceMonitor extends PerformanceMonitor {
  public addTestObserver(observer: ResizeObserver | IntersectionObserver): void {
    this['observers'].add(observer);
  }
}

describe('PerformanceMonitor', () => {
  let monitor: TestablePerformanceMonitor;
  
  beforeEach(() => {
    vi.clearAllMocks();
    monitor = new TestablePerformanceMonitor();
  });
  
  it('should initialize properly', () => {
    expect(monitor).toBeInstanceOf(PerformanceMonitor);
  });

  it('should have basic tracking methods', () => {
    expect(typeof monitor.trackFPS).toBe('function');
    expect(typeof monitor.trackMemory).toBe('function');
    expect(typeof monitor.cleanup).toBe('function');
  });

  it('should handle tracking and cleanup correctly', () => {
    // Start tracking
    const stopFPS = monitor.trackFPS();
    expect(typeof stopFPS).toBe('function');

    // Verify cleanup works
    monitor.cleanup();
  });

  it('should properly cleanup registered resources', () => {
    // Add an observer to be cleaned up
    const mockObserver = {
      disconnect: vi.fn(),
      observe: vi.fn(),
    };
    
    // Use the test method to add the observer
    monitor.addTestObserver(mockObserver as unknown as ResizeObserver);
    
    // Add a cleanup task using the correct method
    const cleanupTask = vi.fn();
    monitor.addCleanupTask(cleanupTask);
    
    // Execute cleanup
    monitor.cleanup();
    
    // Verify observer was disconnected
    expect(mockObserver.disconnect).toHaveBeenCalled();
    
    // Verify cleanup task was executed
    expect(cleanupTask).toHaveBeenCalled();
  });
}); 