/**
 * @fileoverview MemoryManager Unit Tests
 *
 * Unit tests for the memory management system.
 * Tests resource tracking, memory leak detection, and cleanup.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  MemoryManager,
  type ResourceInfo,
} from '../../managers/memory-manager';
import { createTestResourceInfo } from '../utils/test-factories';
import { ANIMATION_EVENTS } from '../../core/constants';

// Helper to create multiple test resources
function createTestResourceInfos(count: number): ResourceInfo[] {
  return Array.from({ length: count }, (_, i) => ({
    ...createTestResourceInfo(),
    id: `test-resource-${i}`,
    memorySize: 1000 + i * 100,
  }));
}

describe('MemoryManager Integration Tests', () => {
  let memoryManager: MemoryManager;

  beforeEach(() => {
    // Mock performance APIs
    Object.defineProperty(global, 'performance', {
      value: {
        memory: {
          usedJSHeapSize: 1000000,
          totalJSHeapSize: 2000000,
          jsHeapSizeLimit: 4000000,
        },
        now: vi.fn(() => Date.now()),
      },
      writable: true,
    });

    // Create fresh instances
    memoryManager = new MemoryManager();
  });

  afterEach(() => {
    memoryManager.dispose();
    vi.clearAllMocks();
  });

  describe('Resource Lifecycle Integration', () => {
    it('should track and manage resource lifecycle', () => {
      const initialStats = memoryManager.getMemoryStats();

      expect(initialStats.totalResources).toBe(0);
      expect(initialStats.activeResources).toBe(0);
      expect(initialStats.estimatedMemoryUsage).toBe(0);

      // Start memory management
      memoryManager.start();
      memoryManager.enableAutoCleanup();
    });

    it('should handle auto cleanup lifecycle', () => {
      memoryManager.start();
      memoryManager.enableAutoCleanup();
      memoryManager.disableAutoCleanup();
      memoryManager.stop();

      const stats = memoryManager.getMemoryStats();
      expect(stats.totalResources).toBe(0);
    });
  });

  describe('Resource Tracking Integration', () => {
    it('should track multiple resources and update statistics', () => {
      const resources = createTestResourceInfos(3);

      resources.forEach((resource) => {
        memoryManager.trackResource(resource);
      });

      const stats = memoryManager.getMemoryStats();
      expect(stats.totalResources).toBe(3);
      expect(stats.estimatedMemoryUsage).toBe(
        resources.reduce((sum, r) => sum + r.memorySize, 0)
      );
    });

    it('should handle reference counting correctly', () => {
      const resource = createTestResourceInfos(1)[0];
      memoryManager.trackResource(resource);

      memoryManager.addReference(resource.id);
      memoryManager.addReference(resource.id);

      const trackedResource = memoryManager.getResourceInfo(resource.id);
      expect(trackedResource?.refCount).toBe(3); // Initial 1 + 2 additions
    });

    it('should handle reference removal correctly', () => {
      const resource = createTestResourceInfos(1)[0];
      memoryManager.trackResource(resource);

      memoryManager.addReference(resource.id);
      memoryManager.removeReference(resource.id);

      const trackedResource = memoryManager.getResourceInfo(resource.id);
      expect(trackedResource?.refCount).toBe(1); // Back to initial
    });
  });

  describe('Memory Leak Detection Integration', () => {
    it('should detect old unused resources as leaks', () => {
      // Create resource with old timestamp
      const resource = createTestResourceInfos(1)[0];

      // Mock current time to be in the past when creating the resource
      const currentTime = Date.now();
      const oldTime = currentTime - 10 * 60 * 1000; // 10 minutes ago
      vi.spyOn(Date, 'now').mockReturnValue(oldTime);

      memoryManager.trackResource(resource);

      // Remove reference to make it unused
      memoryManager.removeReference(resource.id);

      // Now mock time to be current (10 minutes later)
      vi.spyOn(Date, 'now').mockReturnValue(currentTime);

      const leaks = memoryManager.detectMemoryLeaks();
      expect(leaks.length).toBeGreaterThan(0);
      expect(leaks[0].cause).toContain('not properly cleaned up');
      expect(leaks[0].suggestion).toContain('cleanup');
    });

    it('should detect high reference count as potential leak', () => {
      const resource = createTestResourceInfos(1)[0];
      memoryManager.trackResource(resource);

      // Add many references
      for (let i = 0; i < 15; i++) {
        memoryManager.addReference(resource.id);
      }

      const leaks = memoryManager.detectMemoryLeaks();
      expect(leaks.length).toBeGreaterThan(0);
      expect(leaks[0].cause).toContain('circular references');
      expect(leaks[0].suggestion).toContain('Review reference management');
    });

    it('should detect inactive resources with references as leaks', () => {
      // Create resource with old timestamp
      const resource = createTestResourceInfos(1)[0];
      resource.isActive = false; // Make inactive

      // Mock time for creation (2 minutes ago)
      const currentTime = Date.now();
      const oldTime = currentTime - 2 * 60 * 1000; // 2 minutes ago
      vi.spyOn(Date, 'now').mockReturnValue(oldTime);

      memoryManager.trackResource(resource);

      // Now mock time to be current (2 minutes later)
      vi.spyOn(Date, 'now').mockReturnValue(currentTime);

      const leaks = memoryManager.detectMemoryLeaks();
      expect(leaks.length).toBeGreaterThan(0);
      expect(leaks[0].cause).toContain(
        'Inactive resource still has references'
      );
      expect(leaks[0].suggestion).toContain('references are removed');
    });
  });

  describe('Cleanup Operations Integration', () => {
    it('should clean up unused resources', () => {
      const resources = createTestResourceInfos(3);

      resources.forEach((resource) => {
        memoryManager.trackResource(resource);
        // Remove reference to make them unused
        memoryManager.removeReference(resource.id);
      });

      const initialStats = memoryManager.getMemoryStats();
      expect(initialStats.totalResources).toBe(3);

      const cleanedCount = memoryManager.forceCleanup();
      expect(cleanedCount).toBe(3);

      const finalStats = memoryManager.getMemoryStats();
      expect(finalStats.totalResources).toBe(0);
    });

    it('should update cleanup statistics', () => {
      const resource = createTestResourceInfos(1)[0];
      memoryManager.trackResource(resource);
      memoryManager.removeReference(resource.id); // Make unused

      const beforeStats = memoryManager.getMemoryStats();
      expect(beforeStats.cleanup.totalCleaned).toBe(0);

      memoryManager.forceCleanup();

      const afterStats = memoryManager.getMemoryStats();
      expect(afterStats.cleanup.totalCleaned).toBe(1);
      expect(afterStats.cleanup.memoryReclaimed).toBe(resource.memorySize);
    });
  });

  describe('Event Integration', () => {
    it('should emit resource tracking events', () => {
      const eventSpy = vi.fn();
      memoryManager.on('resource:tracked', eventSpy);

      const resource = createTestResourceInfos(1)[0];
      memoryManager.trackResource(resource);

      expect(eventSpy).toHaveBeenCalledWith({
        resourceId: resource.id,
        type: resource.type,
      });
    });

    it('should emit cleanup events', () => {
      const eventSpy = vi.fn();
      memoryManager.on('resource:cleaned', eventSpy);

      const resource = createTestResourceInfos(1)[0];
      memoryManager.trackResource(resource);
      memoryManager.removeReference(resource.id); // Make unused

      memoryManager.forceCleanup();

      expect(eventSpy).toHaveBeenCalledWith({
        resourceId: resource.id,
        type: resource.type,
        memoryReclaimed: resource.memorySize,
      });
    });

    it('should listen to animation events for automatic resource management', () => {
      const resource = createTestResourceInfos(1)[0];
      memoryManager.trackResource(resource);

      const initialRefCount = memoryManager.getResourceInfo(
        resource.id
      )?.refCount;

      // Simulate animation start event
      memoryManager.emit(ANIMATION_EVENTS.ANIMATION_STARTED, {
        id: resource.id,
      });

      const afterStartRefCount = memoryManager.getResourceInfo(
        resource.id
      )?.refCount;
      expect(afterStartRefCount).toBe((initialRefCount || 0) + 1);
    });

    it('should handle animation completion for cleanup', () => {
      const resource = createTestResourceInfos(1)[0];
      memoryManager.trackResource(resource);

      // Add extra reference
      memoryManager.addReference(resource.id);

      // Simulate animation completion
      memoryManager.emit(ANIMATION_EVENTS.ANIMATION_COMPLETED, {
        id: resource.id,
      });

      const finalRefCount = memoryManager.getResourceInfo(
        resource.id
      )?.refCount;
      expect(finalRefCount).toBe(1); // Back to initial
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle cleanup errors gracefully', () => {
      const resource = createTestResourceInfos(1)[0];
      // Add problematic metadata that might cause cleanup to fail
      resource.metadata = { problematic: null };

      memoryManager.trackResource(resource);
      memoryManager.removeReference(resource.id);

      expect(() => {
        memoryManager.forceCleanup();
      }).not.toThrow();
    });

    it('should handle invalid resource operations', () => {
      // Try to add reference to non-existent resource
      expect(() => {
        memoryManager.addReference('non-existent-id');
      }).not.toThrow();

      // Try to remove reference from non-existent resource
      expect(() => {
        memoryManager.removeReference('non-existent-id');
      }).not.toThrow();
    });

    it('should handle concurrent operations safely', () => {
      const resources = createTestResourceInfos(10);

      // Simulate concurrent resource operations
      resources.forEach((resource) => {
        memoryManager.trackResource(resource);
        memoryManager.addReference(resource.id);
        memoryManager.removeReference(resource.id);
        memoryManager.removeReference(resource.id); // Should make refCount 0
      });

      const finalStats = memoryManager.getMemoryStats();
      expect(finalStats.totalResources).toBe(10);
    });
  });
});
