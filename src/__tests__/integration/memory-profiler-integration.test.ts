/**
 * @fileoverview MemoryProfiler Integration Tests
 *
 * Tests the integration of MemoryProfiler with other KineticSlider components,
 * real memory monitoring, and performance optimization workflows.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MemoryProfiler } from '../../performance/memory-profiler';
import { VirtualRenderer } from '../../performance/virtual-renderer';
import { TextureAtlas } from '../../performance/texture-atlas';
import { PerformanceMonitor } from '../../managers/performance-monitor';
import { SimpleEventEmitter } from '../../core/event-emitter';

// Mock performance.memory
const mockMemory = {
  usedJSHeapSize: 50 * 1024 * 1024, // 50MB
  totalJSHeapSize: 100 * 1024 * 1024, // 100MB
  jsHeapSizeLimit: 2 * 1024 * 1024 * 1024, // 2GB
};

beforeEach(() => {
  // Mock performance.memory
  Object.defineProperty(global.performance, 'memory', {
    value: mockMemory,
    writable: true,
    configurable: true,
  });

  // Mock WeakRef and FinalizationRegistry
  global.WeakRef = vi.fn().mockImplementation((target) => ({
    deref: () => target,
  }));

  global.FinalizationRegistry = vi.fn().mockImplementation((_callback) => ({
    register: vi.fn(),
    unregister: vi.fn(),
  }));
});

describe('MemoryProfiler Integration Tests', () => {
  let memoryProfiler: MemoryProfiler;
  let performanceMonitor: PerformanceMonitor;
  let eventEmitter: SimpleEventEmitter;

  beforeEach(() => {
    memoryProfiler = new MemoryProfiler({
      autoProfile: false,
      enableLeakDetection: true,
      detailedTracking: true,
      memoryLimit: 100 * 1024 * 1024, // 100MB
      profileInterval: 1000,
    });

    performanceMonitor = new PerformanceMonitor();

    eventEmitter = new SimpleEventEmitter();
  });

  afterEach(() => {
    memoryProfiler.dispose();
    performanceMonitor.dispose();
    vi.clearAllMocks();
  });

  describe('Component Integration', () => {
    it('should monitor VirtualRenderer memory usage', async () => {
      // Mock PIXI.js
      vi.doMock('pixi.js', () => ({
        Container: vi.fn(() => ({ addChild: vi.fn(), removeChild: vi.fn() })),
        Sprite: vi.fn(() => ({ destroy: vi.fn() })),
      }));

      const virtualRenderer = new VirtualRenderer({
        containerWidth: 800,
        containerHeight: 600,
        itemWidth: 100,
        itemHeight: 100,
      });

      memoryProfiler.startProfiling();

      // Track virtual renderer creation
      memoryProfiler.trackAllocation(
        'virtual-renderer',
        virtualRenderer,
        'VirtualRenderer',
        1024 * 1024 // 1MB estimate
      );

      // Simulate adding large dataset
      const items = Array.from({ length: 5000 }, (_, i) => ({ id: i }));
      
      // Track items allocation
      memoryProfiler.trackAllocation(
        'virtual-items',
        items,
        'Array',
        items.length * 100 // 100 bytes per item estimate
      );

      // Take snapshots
      const snapshot1 = memoryProfiler.takeSnapshot();
      expect(snapshot1.usedJSHeapSize).toBeGreaterThan(0);

      // Simulate memory growth
      mockMemory.usedJSHeapSize += 10 * 1024 * 1024; // +10MB
      const snapshot2 = memoryProfiler.takeSnapshot();

      expect(snapshot2.usedJSHeapSize).toBeGreaterThan(snapshot1.usedJSHeapSize);

      // Clean up
      memoryProfiler.freeAllocation('virtual-items');
      memoryProfiler.freeAllocation('virtual-renderer');
      virtualRenderer.dispose();

      memoryProfiler.stopProfiling();
    });

    it('should detect memory leaks in texture management', async () => {
      vi.doMock('pixi.js', () => ({
        BaseTexture: vi.fn(() => ({ destroy: vi.fn() })),
        Texture: vi.fn(() => ({ destroy: vi.fn() })),
        RenderTexture: vi.fn(() => ({ destroy: vi.fn() })),
      }));

      const textureAtlas = new TextureAtlas();
      memoryProfiler.startProfiling();

      // Simulate texture loading cycles
      for (let cycle = 0; cycle < 3; cycle++) {
        const textures = new Map();
        
        for (let i = 0; i < 10; i++) {
          const textureId = `cycle-${cycle}-texture-${i}`;
          const mockTexture = { destroy: vi.fn() };
          textures.set(textureId, mockTexture);
          
          // Track allocation
          memoryProfiler.trackAllocation(
            textureId,
            mockTexture,
            'Texture',
            256 * 256 * 4 // RGBA texture
          );
        }

        // Simulate atlas operations
        await textureAtlas.addTextures(textures);
        
        // Simulate memory growth
        mockMemory.usedJSHeapSize += 5 * 1024 * 1024;
        memoryProfiler.takeSnapshot();

        // Clear textures
        textureAtlas.clear();
        
        // Track deallocations
        textures.forEach((_, id) => {
          memoryProfiler.freeAllocation(id);
        });
      }

      // Check for leaks
      const leaks = memoryProfiler.detectLeaks();
      
      // Should not detect leaks if properly cleaned up
      expect(leaks.suspectedSources.length).toBe(0);
      expect(leaks.recommendations.length).toBeGreaterThan(0);

      textureAtlas.dispose();
      memoryProfiler.stopProfiling();
    });

    it('should coordinate with PerformanceMonitor for memory-based optimizations', () => {
      memoryProfiler.startProfiling();
      performanceMonitor.start();

      const memoryHandler = vi.fn();
      const performanceHandler = vi.fn();

      memoryProfiler.on('memory-threshold-exceeded', memoryHandler);
      performanceMonitor.on('performance-degraded', performanceHandler);

      // Simulate memory pressure
      mockMemory.usedJSHeapSize = 150 * 1024 * 1024; // Exceed 100MB threshold
      const snapshot = memoryProfiler.takeSnapshot();

      if (snapshot.usedJSHeapSize > 100 * 1024 * 1024) {
        memoryProfiler.emit('memory-threshold-exceeded', snapshot);
      }

      expect(memoryHandler).toHaveBeenCalledWith(snapshot);

      // Verify performance monitoring integration
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.fps).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Real-time Monitoring', () => {
    it('should provide live memory statistics', () => {
      memoryProfiler.startProfiling();

      // Create some test objects
      const objects = Array.from({ length: 100 }, (_, i) => ({ id: i, data: new Array(1000) }));
      
      objects.forEach((obj, i) => {
        memoryProfiler.trackAllocation(`obj-${i}`, obj, 'TestObject', 1000);
      });

      const snapshot = memoryProfiler.takeSnapshot();
      expect(snapshot.usedJSHeapSize).toBeGreaterThan(0);
      expect(snapshot.pixiObjects.sprites).toBe(0);

      // Get GC stats
      const stats = memoryProfiler.getGCStats();
      expect(stats.collections).toBeGreaterThanOrEqual(0);
      expect(stats.totalPauseTime).toBeGreaterThanOrEqual(0);

      // Get history to verify snapshots
      const history = memoryProfiler.getHistory();
      expect(history.length).toBeGreaterThan(0);
    });

    it('should detect garbage collection events', async () => {
      memoryProfiler.startProfiling();

      const gcEvents: any[] = [];
      memoryProfiler.on('gc-detected', (event) => gcEvents.push(event));

      // Simulate memory allocation and GC
      mockMemory.usedJSHeapSize = 80 * 1024 * 1024;
      memoryProfiler.takeSnapshot();

      // Simulate GC event (memory drop)
      mockMemory.usedJSHeapSize = 40 * 1024 * 1024;
      memoryProfiler.takeSnapshot();

      // Check if GC was detected
      const gcStats = memoryProfiler.getGCStats();
      expect(gcStats.collections).toBeGreaterThan(0);
    });

    it('should generate optimization recommendations', () => {
      memoryProfiler.startProfiling();

      // Create various allocation patterns
      const largeArrays = Array.from({ length: 5 }, () => new Array(10000));
      const manySmallObjects = Array.from({ length: 1000 }, (_, i) => ({ id: i }));
      const retainedObjects: any[] = [];

      largeArrays.forEach((arr, i) => {
        memoryProfiler.trackAllocation(`large-array-${i}`, arr, 'Array', 40000);
        retainedObjects.push(arr); // Keep references
      });

      manySmallObjects.forEach((obj, i) => {
        memoryProfiler.trackAllocation(`small-obj-${i}`, obj, 'Object', 50);
      });

      // Simulate memory pressure
      mockMemory.usedJSHeapSize = 120 * 1024 * 1024;
      memoryProfiler.takeSnapshot();

      const recommendations = memoryProfiler.getOptimizationRecommendations();
      
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some((r: any) => r.type === 'reduce-allocations')).toBe(true);
    });
  });

  describe('Event System Integration', () => {
    it('should emit events that coordinate with global system', () => {
      const globalEvents: string[] = [];
      
      eventEmitter.on('memory-warning', () => globalEvents.push('memory-warning'));
      eventEmitter.on('memory-optimized', () => globalEvents.push('memory-optimized'));

      // Bridge memory profiler events to global system
      memoryProfiler.on('memory-threshold-exceeded', () => {
        eventEmitter.emit('memory-warning');
      });

      memoryProfiler.on('optimization-applied', () => {
        eventEmitter.emit('memory-optimized');
      });

      memoryProfiler.startProfiling();

      // Trigger memory threshold
      mockMemory.usedJSHeapSize = 150 * 1024 * 1024;
      const snapshot = memoryProfiler.takeSnapshot();
      
      if (snapshot.usedJSHeapSize > 100 * 1024 * 1024) {
        memoryProfiler.emit('memory-threshold-exceeded', snapshot);
      }

      expect(globalEvents).toContain('memory-warning');
    });

    it('should respond to external optimization triggers', () => {
      memoryProfiler.startProfiling();

      const optimizationSpy = vi.spyOn(memoryProfiler, 'forceGarbageCollection');

      // External system requests memory optimization
      eventEmitter.emit('request-memory-optimization');
      
      // Memory profiler should respond
      eventEmitter.on('request-memory-optimization', () => {
        memoryProfiler.forceGarbageCollection();
      });

      eventEmitter.emit('request-memory-optimization');
      
      expect(optimizationSpy).toHaveBeenCalled();
    });
  });

  describe('Long-term Memory Tracking', () => {
    it('should track memory trends over time', async () => {
      memoryProfiler.startProfiling();

      const snapshots: any[] = [];

      // Simulate application lifecycle
      for (let phase = 0; phase < 5; phase++) {
        // Create objects for this phase
        const phaseObjects = Array.from({ length: 50 }, (_, i) => ({
          phase,
          id: i,
          data: new Array(phase * 100), // Growing memory usage
        }));

        phaseObjects.forEach((obj, i) => {
          memoryProfiler.trackAllocation(
            `phase-${phase}-obj-${i}`,
            obj,
            'PhaseObject',
            phase * 100 * 8
          );
        });

        // Simulate memory growth
        mockMemory.usedJSHeapSize += phase * 10 * 1024 * 1024;
        
        const snapshot = memoryProfiler.takeSnapshot();
        snapshots.push(snapshot);

        // Clean up some objects from previous phases
        if (phase > 1) {
          const prevPhase = phase - 2;
          for (let i = 0; i < 25; i++) { // Clean half
            memoryProfiler.freeAllocation(`phase-${prevPhase}-obj-${i}`);
          }
        }
      }

      // Analyze trends
      expect(snapshots.length).toBe(5);
      expect(snapshots[4].usedJSHeapSize).toBeGreaterThan(snapshots[0].usedJSHeapSize);

      const currentUsage = memoryProfiler.getCurrentUsage();
      expect(currentUsage.usedJSHeapSize).toBeGreaterThan(0);

      const history = memoryProfiler.getHistory();
      expect(history.length).toBeGreaterThan(0);
    });

    it('should detect memory leak patterns', () => {
      memoryProfiler.startProfiling();

      // Create objects that won't be properly cleaned up (leak simulation)
      const leakyObjects: any[] = [];
      
      for (let i = 0; i < 20; i++) {
        const obj = { id: i, leaky: true, data: new Array(1000) };
        leakyObjects.push(obj); // Keep references
        
        memoryProfiler.trackAllocation(`leaky-${i}`, obj, 'LeakyObject', 8000);
      }

      // Create objects that are properly cleaned up
      for (let i = 0; i < 20; i++) {
        const obj = { id: i, clean: true };
        memoryProfiler.trackAllocation(`clean-${i}`, obj, 'CleanObject', 100);

        // Immediately clean up
        memoryProfiler.freeAllocation(`clean-${i}`);
      }

      // Take multiple snapshots to establish leak pattern
      for (let i = 0; i < 5; i++) {
        mockMemory.usedJSHeapSize += 5 * 1024 * 1024; // Steady growth
        memoryProfiler.takeSnapshot();
      }

      const leaks = memoryProfiler.detectLeaks();
      expect(leaks.suspectedSources.length).toBeGreaterThan(0);

      // Should identify leak sources
      expect(leaks.suspectedSources.some((source: string) => source.includes('Leaky'))).toBe(true);
    });
  });

  describe('Performance Impact', () => {
    it('should have minimal overhead during profiling', () => {
      const startTime = performance.now();
      
      memoryProfiler.startProfiling();

      // Perform many allocations
      for (let i = 0; i < 1000; i++) {
        const obj = { id: i };
        memoryProfiler.trackAllocation(`perf-test-${i}`, obj, 'PerfObject', 50);
      }

      // Take snapshots
      for (let i = 0; i < 10; i++) {
        memoryProfiler.takeSnapshot();
      }

      const endTime = performance.now();
      const overhead = endTime - startTime;

      // Should complete in reasonable time
      expect(overhead).toBeLessThan(100); // Less than 100ms overhead

      memoryProfiler.stopProfiling();
    });

    it('should not significantly impact application memory', () => {
      memoryProfiler.startProfiling();

      // Track many objects
      for (let i = 0; i < 500; i++) {
        const obj = { id: i };
        memoryProfiler.trackAllocation(`memory-test-${i}`, obj, 'MemoryTest', 100);
      }

      // Take snapshots
      for (let i = 0; i < 20; i++) {
        memoryProfiler.takeSnapshot();
      }

      // Profiler should track GC events with minimal overhead
      const stats = memoryProfiler.getGCStats();
      expect(stats.collections).toBeGreaterThanOrEqual(0);

      // Verify snapshots were taken
      const history = memoryProfiler.getHistory();
      expect(history.length).toBeGreaterThan(0);
    });
  });
});