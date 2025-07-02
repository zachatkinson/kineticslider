import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ManagerCoordinator } from '../../managers';

describe('Animation Coordination Integration', () => {
  let coordinator: ManagerCoordinator;

  beforeEach(() => {
    // Mock performance APIs
    Object.defineProperty(window, 'performance', {
      value: {
        now: vi.fn(() => Date.now()),
        memory: {
          usedJSHeapSize: 1000000,
          totalJSHeapSize: 2000000,
          jsHeapSizeLimit: 4000000,
        },
      },
      writable: true,
    });

    // Create coordinator (handles all manager creation)
    coordinator = new ManagerCoordinator();
  });

  afterEach(() => {
    coordinator.dispose();
    vi.clearAllMocks();
  });

  describe('Manager Lifecycle', () => {
    it('should start and stop all managers', () => {
      expect(() => coordinator.startAll()).not.toThrow();
      expect(() => coordinator.stopAll()).not.toThrow();
    });

    it('should provide access to all managers', () => {
      const managers = coordinator.getManagers();

      expect(managers.animationManager).toBeDefined();
      expect(managers.performanceMonitor).toBeDefined();
      expect(managers.memoryManager).toBeDefined();
      expect(managers.animationQueue).toBeDefined();
    });

    it('should dispose all managers cleanly', () => {
      const managers = coordinator.getManagers();

      // Verify managers exist before disposal
      expect(managers.animationManager).toBeDefined();

      // Dispose should not throw
      expect(() => coordinator.dispose()).not.toThrow();
    });
  });

  describe('Manager Integration', () => {
    it('should coordinate manager startup', () => {
      const managers = coordinator.getManagers();

      // Start all managers
      coordinator.startAll();

      // Verify managers are accessible
      expect(managers.performanceMonitor).toBeDefined();
      expect(managers.memoryManager).toBeDefined();
      expect(managers.animationQueue).toBeDefined();
    });

    it('should handle manager shutdown gracefully', () => {
      coordinator.startAll();

      // Stop all managers
      expect(() => coordinator.stopAll()).not.toThrow();
    });
  });

  describe('Performance Monitoring Integration', () => {
    it('should provide performance monitoring capabilities', () => {
      const managers = coordinator.getManagers();
      coordinator.startAll();

      // Verify performance monitor provides metrics
      const metrics = managers.performanceMonitor.getMetrics();
      expect(metrics).toBeDefined();
      expect(typeof metrics.fps).toBe('object');
      expect(typeof metrics.memory).toBe('object');
      expect(typeof metrics.animations).toBe('object');
    });

    it('should track performance history', () => {
      const managers = coordinator.getManagers();
      coordinator.startAll();

      // Start performance recording (no arguments)
      managers.performanceMonitor.recordAnimationStart();

      // Complete animation (only execution time)
      managers.performanceMonitor.recordAnimationComplete(150);

      // Verify metrics updated
      const metrics = managers.performanceMonitor.getMetrics();
      expect(metrics.animations.completed).toBeGreaterThan(0);
    });
  });

  describe('Memory Management Integration', () => {
    it('should provide memory tracking capabilities', () => {
      const managers = coordinator.getManagers();
      coordinator.startAll();

      // Track a test resource (using simplified API)
      managers.memoryManager.trackResource({
        id: 'test-resource',
        type: 'timeline',
        memorySize: 1024,
        isActive: true,
        metadata: { test: true },
      });

      // Verify tracking
      const stats = managers.memoryManager.getMemoryStats();
      expect(stats.totalResources).toBeGreaterThan(0);
    });

    it('should perform cleanup operations', () => {
      const managers = coordinator.getManagers();
      coordinator.startAll();

      // Force cleanup
      const cleanedCount = managers.memoryManager.forceCleanup();
      expect(typeof cleanedCount).toBe('number');
    });
  });

  describe('Animation Queue Integration', () => {
    it('should provide queue management capabilities', () => {
      const managers = coordinator.getManagers();
      coordinator.startAll();

      // Get queue statistics
      const stats = managers.animationQueue.getStats();
      expect(stats).toBeDefined();
      expect(typeof stats.totalItems).toBe('number');
      expect(typeof stats.byPriority).toBe('object');
    });

    it('should handle queue state queries', () => {
      const managers = coordinator.getManagers();
      coordinator.startAll();

      // Get queue state
      const state = managers.animationQueue.getQueueState();
      expect(state).toBeDefined();
      expect(typeof state.queueLength).toBe('number');
      expect(typeof state.processingCount).toBe('number');
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle manager errors gracefully', () => {
      const managers = coordinator.getManagers();

      // Test error resilience during startup
      expect(() => coordinator.startAll()).not.toThrow();

      // Test error resilience during operation
      expect(() => {
        managers.performanceMonitor.getMetrics();
        managers.memoryManager.getMemoryStats();
        managers.animationQueue.getStats();
      }).not.toThrow();
    });

    it('should handle disposal errors gracefully', () => {
      coordinator.startAll();

      // Multiple disposals should not throw
      expect(() => coordinator.dispose()).not.toThrow();
      expect(() => coordinator.dispose()).not.toThrow();
    });
  });

  describe('System Coordination', () => {
    it('should coordinate full system lifecycle', () => {
      // Start system
      expect(() => coordinator.startAll()).not.toThrow();

      const managers = coordinator.getManagers();

      // Verify all subsystems operational
      expect(managers.performanceMonitor.getMetrics()).toBeDefined();
      expect(managers.memoryManager.getMemoryStats()).toBeDefined();
      expect(managers.animationQueue.getStats()).toBeDefined();

      // Stop system
      expect(() => coordinator.stopAll()).not.toThrow();

      // Dispose system
      expect(() => coordinator.dispose()).not.toThrow();
    });
  });
});
