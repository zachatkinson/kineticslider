/**
 * @fileoverview ManagerCoordinator Unit Tests
 *
 * Unit tests for the manager coordination system.
 * Tests initialization, lifecycle management, and coordination between managers.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ManagerCoordinator } from '../../managers/index';
import { createMockGSAPTimeline } from '../utils/test-factories';

// Mock GSAP for isolated unit testing
vi.mock('gsap', () => ({
  gsap: {
    timeline: vi.fn(() => createMockGSAPTimeline()),
  },
}));

describe('ManagerCoordinator Unit Tests', () => {
  let coordinator: ManagerCoordinator;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    coordinator = new ManagerCoordinator();
  });

  afterEach(() => {
    coordinator.dispose();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('Initialization and Setup', () => {
    it('should initialize all managers during construction', () => {
      const managers = coordinator.getManagers();

      expect(managers.animationManager).toBeDefined();
      expect(managers.performanceMonitor).toBeDefined();
      expect(managers.memoryManager).toBeDefined();
      expect(managers.animationQueue).toBeDefined();
    });

    it('should create managers with correct types', () => {
      const managers = coordinator.getManagers();

      expect(managers.animationManager.constructor.name).toBe(
        'AnimationManager'
      );
      expect(managers.performanceMonitor.constructor.name).toBe(
        'PerformanceMonitor'
      );
      expect(managers.memoryManager.constructor.name).toBe('MemoryManager');
      expect(managers.animationQueue.constructor.name).toBe('AnimationQueue');
    });

    it('should provide consistent manager instances', () => {
      const managers1 = coordinator.getManagers();
      const managers2 = coordinator.getManagers();

      expect(managers1.animationManager).toBe(managers2.animationManager);
      expect(managers1.performanceMonitor).toBe(managers2.performanceMonitor);
      expect(managers1.memoryManager).toBe(managers2.memoryManager);
      expect(managers1.animationQueue).toBe(managers2.animationQueue);
    });
  });

  describe('Manager Lifecycle Control', () => {
    it('should start all managers when startAll() is called', () => {
      const managers = coordinator.getManagers();

      const performanceMonitorStartSpy = vi.spyOn(
        managers.performanceMonitor,
        'start'
      );
      const memoryManagerStartSpy = vi.spyOn(managers.memoryManager, 'start');
      const animationQueueStartSpy = vi.spyOn(managers.animationQueue, 'start');

      coordinator.startAll();

      expect(performanceMonitorStartSpy).toHaveBeenCalled();
      expect(memoryManagerStartSpy).toHaveBeenCalled();
      expect(animationQueueStartSpy).toHaveBeenCalled();
    });

    it('should stop all managers when stopAll() is called', () => {
      const managers = coordinator.getManagers();

      // Start first
      coordinator.startAll();

      const performanceMonitorStopSpy = vi.spyOn(
        managers.performanceMonitor,
        'stop'
      );
      const memoryManagerStopSpy = vi.spyOn(managers.memoryManager, 'stop');
      const animationQueueStopSpy = vi.spyOn(managers.animationQueue, 'stop');

      coordinator.stopAll();

      expect(performanceMonitorStopSpy).toHaveBeenCalled();
      expect(memoryManagerStopSpy).toHaveBeenCalled();
      expect(animationQueueStopSpy).toHaveBeenCalled();
    });

    it('should dispose all managers when dispose() is called', () => {
      const managers = coordinator.getManagers();

      const animationManagerDisposeSpy = vi.spyOn(
        managers.animationManager,
        'dispose'
      );
      const performanceMonitorDisposeSpy = vi.spyOn(
        managers.performanceMonitor,
        'dispose'
      );
      const memoryManagerDisposeSpy = vi.spyOn(
        managers.memoryManager,
        'dispose'
      );
      const animationQueueDisposeSpy = vi.spyOn(
        managers.animationQueue,
        'dispose'
      );

      coordinator.dispose();

      expect(animationManagerDisposeSpy).toHaveBeenCalled();
      expect(performanceMonitorDisposeSpy).toHaveBeenCalled();
      expect(memoryManagerDisposeSpy).toHaveBeenCalled();
      expect(animationQueueDisposeSpy).toHaveBeenCalled();
    });
  });

  describe('Manager Access and Coordination', () => {
    it('should provide access to all manager instances', () => {
      const managers = coordinator.getManagers();

      expect(managers).toHaveProperty('animationManager');
      expect(managers).toHaveProperty('performanceMonitor');
      expect(managers).toHaveProperty('memoryManager');
      expect(managers).toHaveProperty('animationQueue');
    });

    it('should enable manager-to-manager communication', () => {
      const managers = coordinator.getManagers();

      // All managers should have event capabilities for coordination
      expect(typeof managers.animationManager.on).toBe('function');
      expect(typeof managers.performanceMonitor.on).toBe('function');
      expect(typeof managers.memoryManager.on).toBe('function');
      expect(typeof managers.animationQueue.on).toBe('function');

      expect(typeof managers.animationManager.emit).toBe('function');
      expect(typeof managers.performanceMonitor.emit).toBe('function');
      expect(typeof managers.memoryManager.emit).toBe('function');
      expect(typeof managers.animationQueue.emit).toBe('function');
    });

    it('should maintain manager state across coordinator operations', () => {
      const managers = coordinator.getManagers();

      // Start managers
      coordinator.startAll();

      // Verify state persists
      const managersAfterStart = coordinator.getManagers();
      expect(managersAfterStart.animationManager).toBe(
        managers.animationManager
      );
      expect(managersAfterStart.performanceMonitor).toBe(
        managers.performanceMonitor
      );
      expect(managersAfterStart.memoryManager).toBe(managers.memoryManager);
      expect(managersAfterStart.animationQueue).toBe(managers.animationQueue);
    });
  });

  describe('Error Handling', () => {
    it('should propagate errors during manager start correctly', () => {
      // Use a separate coordinator instance for this test
      const testCoordinator = new ManagerCoordinator();
      const testManagers = testCoordinator.getManagers();

      // Mock one manager to throw error on start
      const startSpy = vi
        .spyOn(testManagers.performanceMonitor, 'start')
        .mockImplementation(() => {
          throw new Error('Start failed');
        });

      // ManagerCoordinator does NOT handle errors - they should propagate
      expect(() => testCoordinator.startAll()).toThrow('Start failed');

      // Restore the mock and clean up manually
      startSpy.mockRestore();
      try {
        testCoordinator.dispose();
      } catch {
        // Ignore cleanup errors
      }
    });

    it('should propagate errors during manager stop correctly', () => {
      // Use a separate coordinator instance for this test
      const testCoordinator = new ManagerCoordinator();
      const testManagers = testCoordinator.getManagers();

      testCoordinator.startAll();

      // Mock one manager to throw error on stop
      const stopSpy = vi
        .spyOn(testManagers.performanceMonitor, 'stop')
        .mockImplementation(() => {
          throw new Error('Stop failed');
        });

      // ManagerCoordinator does NOT handle errors - they should propagate
      expect(() => testCoordinator.stopAll()).toThrow('Stop failed');

      // Restore the mock and clean up manually
      stopSpy.mockRestore();
      try {
        testCoordinator.dispose();
      } catch {
        // Ignore cleanup errors
      }
    });

    it('should propagate errors during disposal correctly', () => {
      // Use a separate coordinator instance for this test
      const testCoordinator = new ManagerCoordinator();
      const testManagers = testCoordinator.getManagers();

      // Mock one manager to throw error on dispose
      const disposeSpy = vi
        .spyOn(testManagers.animationManager, 'dispose')
        .mockImplementation(() => {
          throw new Error('Disposal failed');
        });

      // ManagerCoordinator does NOT handle errors - they should propagate
      expect(() => testCoordinator.dispose()).toThrow('Disposal failed');

      // Restore the mock - no additional cleanup needed since disposal failed
      disposeSpy.mockRestore();
    });

    it('should handle multiple dispose calls gracefully', () => {
      // Use a separate coordinator instance for this test
      const testCoordinator = new ManagerCoordinator();

      testCoordinator.dispose();

      // Should not throw on multiple dispose calls (this behavior is correct)
      expect(() => testCoordinator.dispose()).not.toThrow();
    });
  });

  describe('Manager Integration Scenarios', () => {
    it('should support typical animation workflow', () => {
      const managers = coordinator.getManagers();

      // Start all managers for animation workflow
      coordinator.startAll();

      // Verify managers are ready for coordination
      expect(managers.animationManager).toBeDefined();
      expect(managers.performanceMonitor).toBeDefined();
      expect(managers.memoryManager).toBeDefined();
      expect(managers.animationQueue).toBeDefined();

      // Should be able to queue animations and monitor performance
      expect(typeof managers.animationManager.queueAnimation).toBe('function');
      expect(typeof managers.performanceMonitor.getMetrics).toBe('function');
      expect(typeof managers.memoryManager.getMemoryStats).toBe('function');
      expect(typeof managers.animationQueue.enqueue).toBe('function');
    });

    it('should support performance monitoring workflow', () => {
      const managers = coordinator.getManagers();

      coordinator.startAll();

      // Performance monitor should track metrics
      const metrics = managers.performanceMonitor.getMetrics();
      expect(metrics).toBeDefined();
      expect(typeof metrics.fps.current).toBe('number');
      expect(typeof metrics.fps.average).toBe('number');
    });

    it('should support memory management workflow', () => {
      const managers = coordinator.getManagers();

      coordinator.startAll();

      // Memory manager should track resources
      const stats = managers.memoryManager.getMemoryStats();
      expect(stats).toBeDefined();
      expect(typeof stats.totalResources).toBe('number');
      expect(typeof stats.estimatedMemoryUsage).toBe('number');
    });

    it('should support queue management workflow', () => {
      const managers = coordinator.getManagers();

      coordinator.startAll();

      // Animation queue should track statistics
      const stats = managers.animationQueue.getStats();
      expect(stats).toBeDefined();
      expect(typeof stats.totalItems).toBe('number');
      expect(typeof stats.processing.currentlyProcessing).toBe('number');
    });
  });

  describe('Development and Debugging Support', () => {
    it('should provide comprehensive manager access for debugging', () => {
      const managers = coordinator.getManagers();

      // Should provide access to all internal state for debugging
      expect(managers.animationManager).toBeDefined();
      expect(managers.performanceMonitor).toBeDefined();
      expect(managers.memoryManager).toBeDefined();
      expect(managers.animationQueue).toBeDefined();
    });

    it('should maintain manager consistency across operations', () => {
      const managersBeforeStart = coordinator.getManagers();

      coordinator.startAll();
      const managersAfterStart = coordinator.getManagers();

      coordinator.stopAll();
      const managersAfterStop = coordinator.getManagers();

      // All manager instances should be the same
      expect(managersBeforeStart.animationManager).toBe(
        managersAfterStart.animationManager
      );
      expect(managersAfterStart.animationManager).toBe(
        managersAfterStop.animationManager
      );

      expect(managersBeforeStart.performanceMonitor).toBe(
        managersAfterStart.performanceMonitor
      );
      expect(managersAfterStart.performanceMonitor).toBe(
        managersAfterStop.performanceMonitor
      );
    });
  });
});
