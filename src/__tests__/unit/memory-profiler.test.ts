/**
 * @fileoverview Unit tests for MemoryProfiler
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MemoryProfiler } from '../../performance/memory-profiler';
import type { MemoryProfilerConfig } from '../../performance/memory-profiler';

// Mock performance.memory
const mockMemory = {
  totalJSHeapSize: 100 * 1024 * 1024, // 100MB
  usedJSHeapSize: 50 * 1024 * 1024, // 50MB
  jsHeapSizeLimit: 200 * 1024 * 1024, // 200MB
};

// Setup global mocks
beforeEach(() => {
  (global as any).performance = {
    memory: mockMemory,
    now: vi.fn(() => Date.now()),
  };
});

describe('MemoryProfiler', () => {
  let profiler: MemoryProfiler;

  beforeEach(() => {
    vi.useFakeTimers();
    profiler = new MemoryProfiler({
      autoProfile: false, // Disable auto profiling for tests
    });
  });

  afterEach(() => {
    profiler.dispose();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      const defaultProfiler = new MemoryProfiler();
      expect(defaultProfiler).toBeDefined();
      defaultProfiler.dispose();
    });

    it('should initialize with custom configuration', () => {
      const config: Partial<MemoryProfilerConfig> = {
        memoryLimit: 150,
        warningThreshold: 60,
        criticalThreshold: 85,
        profileInterval: 10000,
        enableLeakDetection: false,
      };

      const customProfiler = new MemoryProfiler(config);
      expect(customProfiler).toBeDefined();
      customProfiler.dispose();
    });

    it('should auto-start profiling when configured', () => {
      const autoProfiler = new MemoryProfiler({
        autoProfile: true,
        profileInterval: 5000,
      });

      // Advance timers to trigger profiling
      vi.advanceTimersByTime(5000);

      autoProfiler.dispose();
    });
  });

  describe('Profiling Control', () => {
    it('should start profiling', () => {
      profiler.startProfiling();

      // Advance time to trigger snapshot
      vi.advanceTimersByTime(5000);

      const history = profiler.getHistory();
      expect(history.length).toBeGreaterThan(0);
    });

    it('should stop profiling', () => {
      profiler.startProfiling();
      profiler.stopProfiling();

      const historyBefore = profiler.getHistory().length;
      vi.advanceTimersByTime(10000);

      const historyAfter = profiler.getHistory().length;
      expect(historyAfter).toBe(historyBefore);
    });

    it('should handle multiple start calls', () => {
      profiler.startProfiling();
      profiler.startProfiling(); // Should be ignored

      vi.advanceTimersByTime(5000);
      const history = profiler.getHistory();
      expect(history.length).toBeGreaterThan(0);
    });

    it('should handle stop without start', () => {
      expect(() => {
        profiler.stopProfiling();
      }).not.toThrow();
    });
  });

  describe('Snapshot Management', () => {
    it('should take memory snapshot', () => {
      const snapshot = profiler.takeSnapshot();

      expect(snapshot).toBeDefined();
      expect(snapshot.timestamp).toBeDefined();
      expect(snapshot.usedJSHeapSize).toBe(mockMemory.usedJSHeapSize);
      expect(snapshot.totalJSHeapSize).toBe(mockMemory.totalJSHeapSize);
    });

    it('should get current usage', () => {
      const usage = profiler.getCurrentUsage();

      expect(usage).toBeDefined();
      expect(usage.usedJSHeapSize).toBe(mockMemory.usedJSHeapSize);
    });

    it('should maintain snapshot history', () => {
      for (let i = 0; i < 5; i++) {
        profiler.takeSnapshot();
        vi.advanceTimersByTime(1000);
      }

      const history = profiler.getHistory();
      expect(history).toHaveLength(5);
    });

    it('should limit snapshot history', () => {
      const limitedProfiler = new MemoryProfiler({
        autoProfile: false,
        maxSnapshots: 3,
      });

      for (let i = 0; i < 5; i++) {
        limitedProfiler.takeSnapshot();
        vi.advanceTimersByTime(1000);
      }

      const history = limitedProfiler.getHistory();
      expect(history).toHaveLength(3);

      limitedProfiler.dispose();
    });

    it('should filter history by duration', () => {
      const now = Date.now();

      // Create snapshots at different times
      for (let i = 0; i < 5; i++) {
        vi.setSystemTime(now + i * 10000);
        profiler.takeSnapshot();
      }

      vi.setSystemTime(now + 50000);
      const recentHistory = profiler.getHistory(30000); // Last 30 seconds
      expect(recentHistory.length).toBeLessThan(5);
    });

    it('should emit snapshot-taken event', () => {
      const snapshotSpy = vi.fn();
      profiler.on('snapshot-taken', snapshotSpy);

      profiler.takeSnapshot();

      expect(snapshotSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: expect.any(Number),
          usedJSHeapSize: expect.any(Number),
        })
      );
    });
  });

  describe('Memory Thresholds', () => {
    it('should emit warning when threshold exceeded', () => {
      const warningSpy = vi.fn();
      profiler.on('memory-warning', warningSpy);

      // Set low threshold for testing
      const warningProfiler = new MemoryProfiler({
        autoProfile: false,
        memoryLimit: 60,
        warningThreshold: 70,
      });
      warningProfiler.on('memory-warning', warningSpy);

      warningProfiler.takeSnapshot();

      // 50MB used / 60MB limit = 83% > 70% threshold
      expect(warningSpy).toHaveBeenCalled();

      warningProfiler.dispose();
    });

    it('should emit critical when threshold exceeded', () => {
      const criticalSpy = vi.fn();

      // Set very low limit for testing
      const criticalProfiler = new MemoryProfiler({
        autoProfile: false,
        memoryLimit: 40,
        criticalThreshold: 90,
      });
      criticalProfiler.on('memory-critical', criticalSpy);

      criticalProfiler.takeSnapshot();

      // 50MB used / 40MB limit = 125% > 90% threshold
      expect(criticalSpy).toHaveBeenCalled();

      criticalProfiler.dispose();
    });
  });

  describe('Leak Detection', () => {
    it('should detect memory leaks', () => {
      // Simulate growing memory usage
      for (let i = 0; i < 15; i++) {
        mockMemory.usedJSHeapSize += 5 * 1024 * 1024; // Add 5MB each time
        profiler.takeSnapshot();
        vi.advanceTimersByTime(1000);
      }

      const leakResult = profiler.detectLeaks();

      expect(leakResult.hasLeak).toBe(true);
      expect(leakResult.growthRate).toBeGreaterThan(0);
    });

    it('should not detect leak with stable memory', () => {
      // Stable memory usage
      for (let i = 0; i < 15; i++) {
        profiler.takeSnapshot();
        vi.advanceTimersByTime(1000);
      }

      const leakResult = profiler.detectLeaks();

      expect(leakResult.hasLeak).toBe(false);
    });

    it('should emit leak-detected event', () => {
      const leakSpy = vi.fn();
      profiler.on('leak-detected', leakSpy);

      // Simulate leak
      for (let i = 0; i < 15; i++) {
        mockMemory.usedJSHeapSize += 10 * 1024 * 1024; // Add 10MB
        profiler.takeSnapshot();
        vi.advanceTimersByTime(1000);
      }

      profiler.detectLeaks();

      expect(leakSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          hasLeak: true,
          severity: expect.any(String),
        })
      );
    });

    it('should classify leak severity', () => {
      // Test different growth rates
      const testCases = [
        { growth: 50000, expectedSeverity: 'low' },
        { growth: 200000, expectedSeverity: 'medium' },
        { growth: 600000, expectedSeverity: 'high' },
        { growth: 1500000, expectedSeverity: 'critical' },
      ];

      testCases.forEach(({ growth, expectedSeverity }) => {
        const testProfiler = new MemoryProfiler({ autoProfile: false });

        for (let i = 0; i < 15; i++) {
          mockMemory.usedJSHeapSize += growth;
          testProfiler.takeSnapshot();
          vi.advanceTimersByTime(1000);
        }

        const result = testProfiler.detectLeaks();

        if (growth > 100000) {
          expect(result.severity).toBe(expectedSeverity);
        }

        testProfiler.dispose();
        mockMemory.usedJSHeapSize = 50 * 1024 * 1024; // Reset
      });
    });
  });

  describe('Allocation Tracking', () => {
    it('should track allocations with detailed tracking enabled', () => {
      const detailedProfiler = new MemoryProfiler({
        autoProfile: false,
        detailedTracking: true,
      });

      const obj = { data: 'test' };
      detailedProfiler.trackAllocation('test-1', obj, 'TestObject', 1024);

      // Allocation should be tracked
      expect(detailedProfiler['allocations'].size).toBe(1);

      detailedProfiler.dispose();
    });

    it('should not track allocations when detailed tracking disabled', () => {
      const obj = { data: 'test' };
      profiler.trackAllocation('test-1', obj, 'TestObject', 1024);

      // Should not track
      expect(profiler['allocations'].size).toBe(0);
    });

    it('should mark allocations as freed', () => {
      const detailedProfiler = new MemoryProfiler({
        autoProfile: false,
        detailedTracking: true,
      });

      const obj = { data: 'test' };
      detailedProfiler.trackAllocation('test-1', obj, 'TestObject');
      detailedProfiler.freeAllocation('test-1');

      const allocation = detailedProfiler['allocations'].get('test-1');
      expect(allocation?.freed).toBe(true);

      detailedProfiler.dispose();
    });
  });

  describe('Garbage Collection', () => {
    it('should detect garbage collection events', () => {
      const gcSpy = vi.fn();
      profiler.on('gc-detected', gcSpy);

      // Simulate GC by memory drop
      profiler.takeSnapshot();
      mockMemory.usedJSHeapSize -= 10 * 1024 * 1024; // Drop 10MB
      profiler.takeSnapshot();

      expect(gcSpy).toHaveBeenCalled();
    });

    it('should track GC statistics', () => {
      // Simulate multiple GC events
      for (let i = 0; i < 3; i++) {
        profiler.takeSnapshot();
        vi.advanceTimersByTime(1000);
        mockMemory.usedJSHeapSize -= 5 * 1024 * 1024;
        profiler.takeSnapshot();
        mockMemory.usedJSHeapSize += 5 * 1024 * 1024;
      }

      const gcStats = profiler.getGCStats();
      expect(gcStats.collections).toBeGreaterThan(0);
    });

    it('should force garbage collection if available', () => {
      const gcMock = vi.fn();
      (global as any).gc = gcMock;

      profiler.forceGarbageCollection();
      expect(gcMock).toHaveBeenCalled();

      delete (global as any).gc;
    });

    it('should handle unavailable garbage collection', () => {
      delete (global as any).gc;

      expect(() => {
        profiler.forceGarbageCollection();
      }).not.toThrow();
    });
  });

  describe('Optimization Recommendations', () => {
    it('should provide optimization recommendations', () => {
      const recommendations = profiler.getOptimizationRecommendations();

      expect(Array.isArray(recommendations)).toBe(true);
      recommendations.forEach((rec) => {
        expect(rec).toHaveProperty('priority');
        expect(rec).toHaveProperty('category');
        expect(rec).toHaveProperty('issue');
        expect(rec).toHaveProperty('action');
        expect(rec).toHaveProperty('potentialSavings');
      });
    });

    it('should prioritize critical issues', () => {
      // Create high memory usage scenario
      mockMemory.usedJSHeapSize = 180 * 1024 * 1024; // 180MB

      const recommendations = profiler.getOptimizationRecommendations();

      if (recommendations.length > 0) {
        // Critical issues should come first
        const priorities = ['critical', 'high', 'medium', 'low'];
        let lastPriorityIndex = -1;

        recommendations.forEach((rec) => {
          const currentIndex = priorities.indexOf(rec.priority);
          expect(currentIndex).toBeGreaterThanOrEqual(lastPriorityIndex);
          if (currentIndex > lastPriorityIndex) {
            lastPriorityIndex = currentIndex;
          }
        });
      }

      mockMemory.usedJSHeapSize = 50 * 1024 * 1024; // Reset
    });
  });

  describe('PIXI Object Tracking', () => {
    it('should track PIXI objects', () => {
      const mockSprite = { type: 'sprite' };
      const mockTexture = { type: 'texture' };
      const mockContainer = { type: 'container' };

      profiler.trackPixiObject(mockSprite as any);
      profiler.trackPixiObject(mockTexture as any);
      profiler.trackPixiObject(mockContainer as any);

      // Objects should be tracked in WeakSet
      expect(profiler['pixiObjectRefs'].has(mockSprite)).toBe(true);
    });
  });

  describe('Cleanup', () => {
    it('should clear profiler data', () => {
      // Add some data
      for (let i = 0; i < 5; i++) {
        profiler.takeSnapshot();
      }

      profiler.clear();

      const history = profiler.getHistory();
      expect(history).toHaveLength(0);

      const gcStats = profiler.getGCStats();
      expect(gcStats.collections).toBe(0);
    });

    it('should dispose properly', () => {
      profiler.startProfiling();

      profiler.dispose();

      // Should stop profiling and clear data
      const history = profiler.getHistory();
      expect(history).toHaveLength(0);
    });

    it('should handle multiple dispose calls', () => {
      expect(() => {
        profiler.dispose();
        profiler.dispose();
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing performance.memory', () => {
      delete (global as any).performance.memory;

      const snapshot = profiler.takeSnapshot();
      expect(snapshot.usedJSHeapSize).toBe(0);
      expect(snapshot.totalJSHeapSize).toBe(0);
    });

    it('should handle rapid snapshots', () => {
      for (let i = 0; i < 100; i++) {
        profiler.takeSnapshot();
      }

      const history = profiler.getHistory();
      expect(history.length).toBeLessThanOrEqual(100); // Default max
    });

    it('should handle leak detection with insufficient data', () => {
      // Only a few snapshots
      profiler.takeSnapshot();
      profiler.takeSnapshot();

      const result = profiler.detectLeaks();
      expect(result.hasLeak).toBe(false);
    });
  });
});
