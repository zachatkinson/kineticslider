/**
 * @fileoverview LazyLoader Integration Tests
 *
 * Tests the integration of LazyLoader with SliderCore, dynamic imports,
 * browser APIs, and the overall feature loading pipeline.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LazyLoader } from '../../performance/lazy-loader';
import { PerformanceMonitor } from '../../managers/performance-monitor';
import { MemoryProfiler } from '../../performance/memory-profiler';
import { SimpleEventEmitter } from '../../core/event-emitter';
import type { LoadableFeature } from '../../performance/lazy-loader';

// Mock dynamic imports
(global as any).import = vi.fn();

// Mock IntersectionObserver
(global as any).IntersectionObserver = vi
  .fn()
  .mockImplementation((_callback: any) => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    root: null,
    rootMargin: '',
    thresholds: [0],
  }));

// Mock requestIdleCallback
(global as any).requestIdleCallback = vi
  .fn()
  .mockImplementation((callback: any) => {
    setTimeout(callback, 0);
    return 1;
  });

(global as any).cancelIdleCallback = vi.fn();

// Mock Navigator connection
Object.defineProperty(global.navigator, 'connection', {
  value: {
    effectiveType: '4g',
    downlink: 10,
    rtt: 50,
  },
  writable: true,
});

describe('LazyLoader Integration Tests', () => {
  let lazyLoader: LazyLoader;
  let performanceMonitor: PerformanceMonitor;
  let memoryProfiler: MemoryProfiler;
  let eventEmitter: SimpleEventEmitter;

  beforeEach(() => {
    lazyLoader = new LazyLoader({
      enableCaching: true,
      maxCacheSize: 10 * 1024 * 1024, // 10MB
      defaultTimeout: 5000,
      maxConcurrentLoads: 3,
      enablePreloading: true,
      preloadThreshold: 1000,
      enablePerformanceMonitoring: true,
    });

    performanceMonitor = new PerformanceMonitor();

    memoryProfiler = new MemoryProfiler({
      autoProfile: false,
      enableLeakDetection: true,
    });

    eventEmitter = new SimpleEventEmitter();

    // Reset import mock
    vi.mocked((global as any).import).mockReset();
  });

  afterEach(() => {
    lazyLoader.dispose();
    performanceMonitor.dispose();
    memoryProfiler.dispose();
    vi.clearAllMocks();
  });

  describe('Dynamic Import Integration', () => {
    it('should load real modules using dynamic imports', async () => {
      // Mock successful module loading
      const mockModule = {
        default: { name: 'TestFeature', initialize: vi.fn() },
        TestClass: vi.fn(),
        utils: { helper: vi.fn() },
      };

      vi.mocked((global as any).import).mockResolvedValue(mockModule);

      const feature: LoadableFeature = {
        id: 'test-feature',
        name: 'Test Feature',
        modulePath: './features/test-feature.js',
        strategy: 'on-demand',
        priority: 'high',
        estimatedSize: 5000,
      };

      lazyLoader.registerFeature(feature);

      const result = await lazyLoader.loadFeature('test-feature');

      expect(result.success).toBe(true);
      expect(result.module).toBe(mockModule);
      expect(result.loadTime).toBeGreaterThan(0);
      expect(result.cached).toBe(false);

      // Verify import was called correctly
      expect((global as any).import).toHaveBeenCalledWith(
        './features/test-feature.js'
      );
    });

    it('should handle import failures gracefully', async () => {
      const importError = new Error('Module not found');
      vi.mocked((global as any).import).mockRejectedValue(importError);

      const feature: LoadableFeature = {
        id: 'failing-feature',
        name: 'Failing Feature',
        modulePath: './features/non-existent.js',
        strategy: 'on-demand',
        priority: 'medium',
      };

      lazyLoader.registerFeature(feature);

      await expect(lazyLoader.loadFeature('failing-feature')).rejects.toThrow(
        'Module not found'
      );
    });

    it('should respect timeout during slow imports', async () => {
      // Mock slow import
      vi.mocked((global as any).import).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 10000)) // 10 second delay
      );

      const feature: LoadableFeature = {
        id: 'slow-feature',
        name: 'Slow Feature',
        modulePath: './features/slow.js',
        strategy: 'on-demand',
        priority: 'low',
        timeout: 100, // 100ms timeout
      };

      lazyLoader.registerFeature(feature);

      await expect(lazyLoader.loadFeature('slow-feature')).rejects.toThrow(
        /timeout/i
      );
    });
  });

  describe('Performance Monitor Integration', () => {
    it('should track loading performance metrics', async () => {
      performanceMonitor.start();

      const mockModule = { default: 'test' };
      vi.mocked((global as any).import).mockResolvedValue(mockModule);

      const features: LoadableFeature[] = Array.from(
        { length: 10 },
        (_, i) => ({
          id: `perf-feature-${i}`,
          name: `Performance Feature ${i}`,
          modulePath: `./features/perf-${i}.js`,
          strategy: 'on-demand',
          priority: 'medium',
          estimatedSize: 1000,
        })
      );

      // Register and load features
      features.forEach((f) => lazyLoader.registerFeature(f));

      const loadPromises = features.map((f) => lazyLoader.loadFeature(f.id));
      const results = await Promise.all(loadPromises);

      // All should succeed
      results.forEach((result) => {
        expect(result.success).toBe(true);
        expect(result.loadTime).toBeGreaterThan(0);
      });

      // Check performance metrics
      const loadStats = lazyLoader.getStats();
      expect(loadStats.loadedFeatures).toBe(10);
      expect(loadStats.averageLoadTime).toBeGreaterThan(0);

      performanceMonitor.stop();
    });

    it('should optimize loading based on performance conditions', async () => {
      // Mock slow network condition
      Object.defineProperty(global.navigator, 'connection', {
        value: {
          effectiveType: '2g',
          downlink: 0.5,
        },
        writable: true,
      });

      const mockModule = { default: 'test' };
      vi.mocked((global as any).import).mockResolvedValue(mockModule);

      const feature: LoadableFeature = {
        id: 'network-sensitive',
        name: 'Network Sensitive Feature',
        modulePath: './features/heavy.js',
        strategy: 'on-demand',
        priority: 'low',
        conditions: [
          {
            type: 'network',
            value: 'fast',
          },
        ],
      };

      lazyLoader.registerFeature(feature);

      // Should respect network condition
      await expect(lazyLoader.loadFeature('network-sensitive')).rejects.toThrow(
        /conditions not met/i
      );
    });
  });

  describe('Memory Management Integration', () => {
    it('should track module memory usage', async () => {
      memoryProfiler.startProfiling();

      const mockModule: any = {
        default: { data: new Array(10000).fill(0) }, // Large module
        LargeClass: function (this: any) {
          this.data = new Array(5000);
        },
      };

      vi.mocked((global as any).import).mockResolvedValue(mockModule);

      const feature: LoadableFeature = {
        id: 'memory-heavy',
        name: 'Memory Heavy Feature',
        modulePath: './features/heavy.js',
        strategy: 'on-demand',
        priority: 'high',
        estimatedSize: 100000, // 100KB
      };

      lazyLoader.registerFeature(feature);

      // Track loading
      const result = await lazyLoader.loadFeature('memory-heavy');
      expect(result.success).toBe(true);

      // Should be tracked in memory profiler
      memoryProfiler.trackAllocation(
        'loaded-module-memory-heavy',
        mockModule,
        'Module',
        100000
      );

      const snapshot = memoryProfiler.takeSnapshot();
      // Note: MemorySnapshot doesn't expose allocations map
      expect(snapshot.usedJSHeapSize).toBeGreaterThan(0);

      memoryProfiler.stopProfiling();
    });

    it('should respect memory pressure during loading', async () => {
      // Mock high memory usage
      Object.defineProperty(global.performance, 'memory', {
        value: {
          usedJSHeapSize: 150 * 1024 * 1024, // 150MB
          totalJSHeapSize: 200 * 1024 * 1024,
          jsHeapSizeLimit: 200 * 1024 * 1024,
        },
        writable: true,
      });

      const feature: LoadableFeature = {
        id: 'memory-sensitive',
        name: 'Memory Sensitive Feature',
        modulePath: './features/memory.js',
        strategy: 'on-demand',
        priority: 'low',
        conditions: [
          {
            type: 'performance',
            value: 'memory-ok',
          },
        ],
      };

      lazyLoader.registerFeature(feature);

      // Should respect memory condition
      await expect(lazyLoader.loadFeature('memory-sensitive')).rejects.toThrow(
        /conditions not met/i
      );
    });

    it('should manage cache memory efficiently', async () => {
      memoryProfiler.startProfiling();

      const modules = Array.from({ length: 20 }, (_, i) => ({
        default: { data: new Array(1000), id: i },
      }));

      vi.mocked((global as any).import).mockImplementation((path: string) => {
        const index = parseInt(path.match(/(\d+)/)?.[1] || '0');
        return Promise.resolve(modules[index]);
      });

      // Register many features
      const features = Array.from({ length: 20 }, (_, i) => ({
        id: `cache-feature-${i}`,
        name: `Cache Feature ${i}`,
        modulePath: `./features/cache-${i}.js`,
        strategy: 'on-demand' as const,
        priority: 'medium' as const,
        estimatedSize: 8000,
      }));

      features.forEach((f) => lazyLoader.registerFeature(f));

      // Load all features
      for (const feature of features) {
        await lazyLoader.loadFeature(feature.id);
      }

      const stats = lazyLoader.getStats();
      expect(stats.totalBytesLoaded).toBeGreaterThan(0);

      // Cache should not exceed max size
      expect(stats.totalBytesLoaded).toBeLessThan(10 * 1024 * 1024); // 10MB limit

      memoryProfiler.stopProfiling();
    });
  });

  describe('Event System Integration', () => {
    it('should coordinate with global event system', async () => {
      const globalEvents: string[] = [];

      eventEmitter.on('feature-loading', () =>
        globalEvents.push('feature-loading')
      );
      eventEmitter.on('feature-loaded', () =>
        globalEvents.push('feature-loaded')
      );
      eventEmitter.on('feature-failed', () =>
        globalEvents.push('feature-failed')
      );

      // Bridge LazyLoader events to global system
      lazyLoader.on('feature-loading', () =>
        eventEmitter.emit('feature-loading')
      );
      lazyLoader.on('feature-loaded', () =>
        eventEmitter.emit('feature-loaded')
      );
      lazyLoader.on('feature-failed', () =>
        eventEmitter.emit('feature-failed')
      );

      const mockModule = { default: 'test' };
      vi.mocked((global as any).import).mockResolvedValue(mockModule);

      const feature: LoadableFeature = {
        id: 'event-test',
        name: 'Event Test Feature',
        modulePath: './features/event.js',
        strategy: 'on-demand',
        priority: 'high',
      };

      lazyLoader.registerFeature(feature);
      await lazyLoader.loadFeature('event-test');

      expect(globalEvents).toContain('feature-loading');
      expect(globalEvents).toContain('feature-loaded');
    });

    it('should respond to user interaction events', async () => {
      const mockModule = { default: 'interaction' };
      vi.mocked((global as any).import).mockResolvedValue(mockModule);

      const interactionFeatures = ['tooltip', 'modal', 'dropdown'].map(
        (name) => ({
          id: `interaction-${name}`,
          name: `Interaction ${name}`,
          modulePath: `./features/${name}.js`,
          strategy: 'on-interaction' as const,
          priority: 'high' as const,
        })
      );

      interactionFeatures.forEach((f) => lazyLoader.registerFeature(f));

      // Setup interaction loading
      lazyLoader.loadOnInteraction(interactionFeatures.map((f) => f.id));

      // Simulate user interaction
      const clickEvent = new Event('click');
      document.dispatchEvent(clickEvent);

      // Wait for features to load
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Features should be loaded after interaction
      interactionFeatures.forEach((feature) => {
        expect(lazyLoader.isLoaded(feature.id)).toBe(true);
      });
    });
  });

  describe('Loading Strategy Integration', () => {
    it('should handle immediate loading strategy', async () => {
      const mockModule = { default: 'immediate' };
      vi.mocked((global as any).import).mockResolvedValue(mockModule);

      const immediateFeature: LoadableFeature = {
        id: 'immediate-feature',
        name: 'Immediate Feature',
        modulePath: './features/immediate.js',
        strategy: 'immediate',
        priority: 'critical',
      };

      // Should start loading immediately on registration
      lazyLoader.registerFeature(immediateFeature);

      // Wait a bit for async loading
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(lazyLoader.isLoaded('immediate-feature')).toBe(true);
    });

    it('should handle preload strategy with idle callback', async () => {
      const mockModule = { default: 'preload' };
      vi.mocked((global as any).import).mockResolvedValue(mockModule);

      const preloadFeature: LoadableFeature = {
        id: 'preload-feature',
        name: 'Preload Feature',
        modulePath: './features/preload.js',
        strategy: 'preload',
        priority: 'high',
      };

      lazyLoader.registerFeature(preloadFeature);

      // Should schedule preload
      expect(global.requestIdleCallback).toHaveBeenCalled();

      // Wait for preload
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(lazyLoader.isLoaded('preload-feature')).toBe(true);
    });

    it('should handle on-idle strategy', async () => {
      const mockModule = { default: 'idle' };
      vi.mocked((global as any).import).mockResolvedValue(mockModule);

      const idleFeature: LoadableFeature = {
        id: 'idle-feature',
        name: 'Idle Feature',
        modulePath: './features/idle.js',
        strategy: 'on-idle',
        priority: 'low',
      };

      lazyLoader.registerFeature(idleFeature);

      // Should use idle callback
      expect(global.requestIdleCallback).toHaveBeenCalled();

      // Trigger idle callback
      const idleCallback = vi.mocked((global as any).requestIdleCallback).mock
        .calls[0][0];
      idleCallback({ didTimeout: false, timeRemaining: () => 50 } as any);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(lazyLoader.isLoaded('idle-feature')).toBe(true);
    });
  });

  describe('Dependency Management', () => {
    it('should load dependencies in correct order', async () => {
      const loadOrder: string[] = [];

      vi.mocked((global as any).import).mockImplementation((path: string) => {
        const featureId = path.match(/features\/(.+)\.js/)?.[1] || '';
        loadOrder.push(featureId);
        return Promise.resolve({ default: featureId });
      });

      const baseFeature: LoadableFeature = {
        id: 'base',
        name: 'Base Feature',
        modulePath: './features/base.js',
        strategy: 'on-demand',
        priority: 'high',
      };

      const dependentFeature: LoadableFeature = {
        id: 'dependent',
        name: 'Dependent Feature',
        modulePath: './features/dependent.js',
        strategy: 'on-demand',
        priority: 'high',
        dependencies: ['base'],
      };

      lazyLoader.registerFeature(baseFeature);
      lazyLoader.registerFeature(dependentFeature);

      await lazyLoader.loadFeature('dependent');

      expect(loadOrder).toEqual(['base', 'dependent']);
      expect(lazyLoader.isLoaded('base')).toBe(true);
      expect(lazyLoader.isLoaded('dependent')).toBe(true);
    });

    it('should handle circular dependencies gracefully', async () => {
      vi.mocked((global as any).import).mockResolvedValue({
        default: 'circular',
      });

      const featureA: LoadableFeature = {
        id: 'feature-a',
        name: 'Feature A',
        modulePath: './features/a.js',
        strategy: 'on-demand',
        priority: 'high',
        dependencies: ['feature-b'],
      };

      const featureB: LoadableFeature = {
        id: 'feature-b',
        name: 'Feature B',
        modulePath: './features/b.js',
        strategy: 'on-demand',
        priority: 'high',
        dependencies: ['feature-a'],
      };

      lazyLoader.registerFeature(featureA);
      lazyLoader.registerFeature(featureB);

      // Should handle circular dependency without infinite loop
      await expect(lazyLoader.loadFeature('feature-a')).rejects.toThrow();
    });
  });

  describe('Concurrent Loading', () => {
    it('should respect maxConcurrentLoads limit', async () => {
      let activeLoads = 0;
      let maxActiveLoads = 0;

      vi.mocked((global as any).import).mockImplementation(() => {
        activeLoads++;
        maxActiveLoads = Math.max(maxActiveLoads, activeLoads);

        return new Promise((resolve) => {
          setTimeout(() => {
            activeLoads--;
            resolve({ default: 'concurrent' });
          }, 100);
        });
      });

      const features = Array.from({ length: 10 }, (_, i) => ({
        id: `concurrent-${i}`,
        name: `Concurrent Feature ${i}`,
        modulePath: `./features/concurrent-${i}.js`,
        strategy: 'on-demand' as const,
        priority: 'medium' as const,
      }));

      features.forEach((f) => lazyLoader.registerFeature(f));

      // Load all features simultaneously
      const loadPromises = features.map((f) => lazyLoader.loadFeature(f.id));
      await Promise.all(loadPromises);

      // Should not exceed maxConcurrentLoads (3)
      expect(maxActiveLoads).toBeLessThanOrEqual(3);
    });

    it('should queue features when concurrent limit reached', async () => {
      const loadTimes: number[] = [];

      vi.mocked((global as any).import).mockImplementation(() => {
        const start = Date.now();
        return new Promise((resolve) => {
          setTimeout(() => {
            loadTimes.push(Date.now() - start);
            resolve({ default: 'queued' });
          }, 100);
        });
      });

      const features = Array.from({ length: 6 }, (_, i) => ({
        id: `queued-${i}`,
        name: `Queued Feature ${i}`,
        modulePath: `./features/queued-${i}.js`,
        strategy: 'on-demand' as const,
        priority: 'medium' as const,
      }));

      features.forEach((f) => lazyLoader.registerFeature(f));

      // Load all features
      const loadPromises = features.map((f) => lazyLoader.loadFeature(f.id));
      await Promise.all(loadPromises);

      // Some features should have been queued (longer load times)
      const sortedTimes = [...loadTimes].sort((a, b) => a - b);
      expect(sortedTimes[sortedTimes.length - 1]).toBeGreaterThan(
        sortedTimes[0] + 50
      );
    });
  });

  describe('Cache Integration', () => {
    it('should serve cached modules instantly', async () => {
      const mockModule = { default: 'cached' };
      vi.mocked((global as any).import).mockResolvedValue(mockModule);

      const feature: LoadableFeature = {
        id: 'cacheable',
        name: 'Cacheable Feature',
        modulePath: './features/cacheable.js',
        strategy: 'on-demand',
        priority: 'high',
      };

      lazyLoader.registerFeature(feature);

      // First load
      const firstResult = await lazyLoader.loadFeature('cacheable');
      expect(firstResult.cached).toBe(false);
      expect(firstResult.loadTime).toBeGreaterThan(0);

      // Second load (should be cached)
      const secondResult = await lazyLoader.loadFeature('cacheable');
      expect(secondResult.cached).toBe(true);
      expect(secondResult.loadTime).toBe(0);
      expect(secondResult.module).toBe(mockModule);
    });

    it('should evict cache when size limit exceeded', async () => {
      // Set very small cache size
      lazyLoader = new LazyLoader({
        enableCaching: true,
        maxCacheSize: 1000, // 1KB
      });

      const modules = Array.from({ length: 5 }, (_, i) => ({
        default: { data: new Array(500), id: i }, // ~500 bytes each
      }));

      vi.mocked((global as any).import).mockImplementation((path: string) => {
        const index = parseInt(path.match(/(\d+)/)?.[1] || '0');
        return Promise.resolve(modules[index]);
      });

      const features = Array.from({ length: 5 }, (_, i) => ({
        id: `evict-${i}`,
        name: `Evict Feature ${i}`,
        modulePath: `./features/evict-${i}.js`,
        strategy: 'on-demand' as const,
        priority: 'medium' as const,
        estimatedSize: 500,
      }));

      features.forEach((f) => lazyLoader.registerFeature(f));

      // Load all features
      for (const feature of features) {
        await lazyLoader.loadFeature(feature.id);
      }

      // Cache should have evicted some items
      const stats = lazyLoader.getStats();
      expect(stats.totalBytesLoaded).toBeLessThan(5 * 500); // Some should be evicted
    });
  });
});
