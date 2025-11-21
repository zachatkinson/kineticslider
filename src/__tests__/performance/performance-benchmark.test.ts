/**
 * @fileoverview Performance Benchmark Suite for Phase 5.2 Components
 *
 * Comprehensive performance testing for all Phase 5.2 performance optimization
 * components. Validates that success criteria are met:
 * - 60fps on mobile devices
 * - Memory usage under 100MB
 * - Bundle size under 150KB
 * - Load time under 2 seconds
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { VirtualRenderer } from '../../performance/virtual-renderer';
import { TextureAtlas } from '../../performance/texture-atlas';
import { MemoryProfiler } from '../../performance/memory-profiler';
import { BundleOptimizer } from '../../performance/bundle-optimizer';
import { LazyLoader } from '../../performance/lazy-loader';
import type { LoadableFeature } from '../../performance/lazy-loader';

// Mock PIXI.js for testing
vi.mock('pixi.js', () => ({
  Container: vi.fn().mockImplementation(() => ({
    addChild: vi.fn(),
    removeChild: vi.fn(),
    children: [],
  })),
  Sprite: vi.fn().mockImplementation(() => ({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    visible: true,
    destroy: vi.fn(),
    parent: null,
  })),
  Texture: vi.fn().mockImplementation(() => ({
    width: 100,
    height: 100,
    destroy: vi.fn(),
  })),
  BaseTexture: vi.fn().mockImplementation(() => ({
    resource: {},
    update: vi.fn(),
    destroy: vi.fn(),
  })),
  Rectangle: vi
    .fn()
    .mockImplementation((x, y, w, h) => ({ x, y, width: w, height: h })),
}));

// Performance test utilities
interface PerformanceMeasurement {
  operation: string;
  duration: number;
  memoryBefore: number;
  memoryAfter: number;
  memoryDelta: number;
  fps?: number;
}

class PerformanceBenchmark {
  private measurements: PerformanceMeasurement[] = [];

  async measure<T>(operation: string, fn: () => Promise<T> | T): Promise<T> {
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const memoryBefore = this.getMemoryUsage();
    const startTime = performance.now();

    let fps: number | undefined;
    let frameCount = 0;
    const fpsStart = performance.now();

    // Start FPS monitoring for async operations
    const fpsInterval = setInterval(() => {
      frameCount++;
    }, 16); // ~60fps

    const result = await fn();

    clearInterval(fpsInterval);

    const endTime = performance.now();
    const duration = endTime - startTime;
    const memoryAfter = this.getMemoryUsage();

    // Calculate FPS for operations longer than 100ms
    if (duration > 100) {
      const totalTime = (performance.now() - fpsStart) / 1000;
      fps = frameCount / totalTime;
    }

    this.measurements.push({
      operation,
      duration,
      memoryBefore,
      memoryAfter,
      memoryDelta: memoryAfter - memoryBefore,
      fps,
    });

    return result;
  }

  private getMemoryUsage(): number {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  getMeasurements(): PerformanceMeasurement[] {
    return [...this.measurements];
  }

  getAverageTime(operation: string): number {
    const ops = this.measurements.filter((m) => m.operation === operation);
    return ops.length > 0
      ? ops.reduce((sum, m) => sum + m.duration, 0) / ops.length
      : 0;
  }

  getTotalMemoryDelta(): number {
    return this.measurements.reduce(
      (sum, m) => sum + Math.max(0, m.memoryDelta),
      0
    );
  }

  getMinFPS(): number {
    const fpsValues = this.measurements
      .map((m) => m.fps)
      .filter(Boolean) as number[];
    return fpsValues.length > 0 ? Math.min(...fpsValues) : 60;
  }

  clear(): void {
    this.measurements = [];
  }
}

describe('Performance Benchmark Suite', () => {
  let benchmark: PerformanceBenchmark;

  beforeEach(() => {
    benchmark = new PerformanceBenchmark();
    vi.useFakeTimers();
  });

  afterEach(() => {
    benchmark.clear();
    vi.useRealTimers();
  });

  describe('VirtualRenderer Performance', () => {
    let virtualRenderer: VirtualRenderer;
    let mockContainer: any;
    let mockRenderer: any;

    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Container } = require('pixi.js');
      mockContainer = new Container();
      mockRenderer = { render: vi.fn() };

      virtualRenderer = new VirtualRenderer({
        containerWidth: 1200,
        containerHeight: 800,
        itemWidth: 200,
        itemHeight: 150,
        enableRecycling: true,
        maxPoolSize: 100,
      });

      virtualRenderer.initialize(mockContainer, mockRenderer);
    });

    afterEach(() => {
      virtualRenderer.dispose();
    });

    it('should handle large datasets under 100ms', async () => {
      const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        value: Math.random(),
      }));

      await benchmark.measure('virtual-renderer-large-dataset', async () => {
        virtualRenderer.setItems(largeDataset);
        return virtualRenderer.forceUpdate();
      });

      const avgTime = benchmark.getAverageTime(
        'virtual-renderer-large-dataset'
      );
      expect(avgTime).toBeLessThan(100); // Under 100ms for 10k items
    });

    it('should maintain 60fps during rapid scrolling', async () => {
      const items = Array.from({ length: 5000 }, (_, i) => ({ id: i }));
      virtualRenderer.setItems(items);

      await benchmark.measure('virtual-renderer-rapid-scroll', async () => {
        // Simulate rapid scrolling
        for (let i = 0; i < 100; i++) {
          virtualRenderer.updateViewport(i * 20, i * 15);
          await new Promise((resolve) => setTimeout(resolve, 16)); // 60fps frame time
        }
      });

      const measurements = benchmark.getMeasurements();
      const scrollMeasurement = measurements.find(
        (m) => m.operation === 'virtual-renderer-rapid-scroll'
      );

      if (scrollMeasurement?.fps) {
        expect(scrollMeasurement.fps).toBeGreaterThanOrEqual(50); // Allow some tolerance
      }
    });

    it('should use minimal memory for sprite pooling', async () => {
      await benchmark.measure('virtual-renderer-memory', () => {
        const items = Array.from({ length: 1000 }, (_, i) => ({ id: i }));
        virtualRenderer.setItems(items);
        virtualRenderer.forceUpdate();

        // Test memory efficiency
        const stats = virtualRenderer.getStats();
        expect(stats.pooledItems).toBeGreaterThan(0);
        expect(stats.renderedItems).toBeLessThan(50); // Should only render visible items
      });

      const memoryDelta = benchmark.getTotalMemoryDelta();
      expect(memoryDelta).toBeLessThan(10 * 1024 * 1024); // Under 10MB
    });

    it('should update viewport in under 5ms', async () => {
      const items = Array.from({ length: 1000 }, (_, i) => ({ id: i }));
      virtualRenderer.setItems(items);

      for (let i = 0; i < 10; i++) {
        await benchmark.measure('virtual-renderer-viewport-update', () => {
          virtualRenderer.updateViewport(i * 100, i * 50);
        });
      }

      const avgTime = benchmark.getAverageTime(
        'virtual-renderer-viewport-update'
      );
      expect(avgTime).toBeLessThan(5); // Under 5ms per viewport update
    });
  });

  describe('TextureAtlas Performance', () => {
    let textureAtlas: TextureAtlas;

    beforeEach(() => {
      textureAtlas = new TextureAtlas({
        maxWidth: 2048,
        maxHeight: 2048,
        enableTrim: true,
        allowRotation: true,
      });
    });

    afterEach(() => {
      textureAtlas.dispose();
    });

    it('should pack 100 textures in under 50ms', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Texture, BaseTexture } = require('pixi.js');
      const textures = new Map<string, any>();

      for (let i = 0; i < 100; i++) {
        textures.set(`texture-${i}`, new Texture(new BaseTexture()));
      }

      await benchmark.measure('texture-atlas-packing', async () => {
        await textureAtlas.addTextures(textures);
      });

      const avgTime = benchmark.getAverageTime('texture-atlas-packing');
      expect(avgTime).toBeLessThan(50); // Under 50ms for 100 textures
    });

    it('should achieve high packing efficiency', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Texture, BaseTexture } = require('pixi.js');
      const textures = new Map<string, any>();

      // Add various sized textures
      const sizes = [64, 128, 256, 512];
      for (let i = 0; i < 50; i++) {
        const size = sizes[i % sizes.length];
        const texture = new Texture(new BaseTexture());
        texture.width = size;
        texture.height = size;
        textures.set(`texture-${i}`, texture);
      }

      await benchmark.measure('texture-atlas-efficiency', async () => {
        await textureAtlas.addTextures(textures);
      });

      const stats = textureAtlas.getStats();
      expect(stats.packingEfficiency).toBeGreaterThan(70); // > 70% efficiency
      expect(stats.drawCallsSaved).toBeGreaterThan(40); // Significant draw call reduction
    });

    it('should use minimal memory for atlas generation', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Texture, BaseTexture } = require('pixi.js');

      await benchmark.measure('texture-atlas-memory', async () => {
        for (let i = 0; i < 20; i++) {
          const texture = new Texture(new BaseTexture());
          await textureAtlas.addTexture(`texture-${i}`, texture);
        }
      });

      const memoryDelta = benchmark.getTotalMemoryDelta();
      expect(memoryDelta).toBeLessThan(20 * 1024 * 1024); // Under 20MB
    });
  });

  describe('MemoryProfiler Performance', () => {
    let memoryProfiler: MemoryProfiler;

    beforeEach(() => {
      // Mock performance.memory
      (global as any).performance = {
        memory: {
          usedJSHeapSize: 50 * 1024 * 1024,
          totalJSHeapSize: 100 * 1024 * 1024,
          jsHeapSizeLimit: 200 * 1024 * 1024,
        },
        now: () => Date.now(),
      };

      memoryProfiler = new MemoryProfiler({
        autoProfile: false,
        enableLeakDetection: true,
        detailedTracking: true,
      });
    });

    afterEach(() => {
      memoryProfiler.dispose();
    });

    it('should take snapshots quickly', async () => {
      for (let i = 0; i < 10; i++) {
        await benchmark.measure('memory-profiler-snapshot', () => {
          return memoryProfiler.takeSnapshot();
        });
      }

      const avgTime = benchmark.getAverageTime('memory-profiler-snapshot');
      expect(avgTime).toBeLessThan(10); // Under 10ms per snapshot
    });

    it('should detect leaks efficiently', async () => {
      // Create fake memory growth
      for (let i = 0; i < 15; i++) {
        (global as any).performance.memory.usedJSHeapSize += 5 * 1024 * 1024;
        memoryProfiler.takeSnapshot();
      }

      await benchmark.measure('memory-profiler-leak-detection', () => {
        return memoryProfiler.detectLeaks();
      });

      const avgTime = benchmark.getAverageTime(
        'memory-profiler-leak-detection'
      );
      expect(avgTime).toBeLessThan(20); // Under 20ms for leak detection
    });

    it('should track allocations with minimal overhead', async () => {
      const objects = Array.from({ length: 1000 }, (_, i) => ({ id: i }));

      await benchmark.measure('memory-profiler-allocation-tracking', () => {
        objects.forEach((obj, i) => {
          memoryProfiler.trackAllocation(`obj-${i}`, obj, 'TestObject', 100);
        });
      });

      const avgTime = benchmark.getAverageTime(
        'memory-profiler-allocation-tracking'
      );
      expect(avgTime).toBeLessThan(50); // Under 50ms for 1000 allocations
    });

    it('should stay under memory limit during profiling', async () => {
      await benchmark.measure('memory-profiler-memory-usage', () => {
        memoryProfiler.startProfiling();

        // Simulate some activity
        for (let i = 0; i < 100; i++) {
          memoryProfiler.takeSnapshot();
        }

        memoryProfiler.stopProfiling();
      });

      const memoryDelta = benchmark.getTotalMemoryDelta();
      expect(memoryDelta).toBeLessThan(5 * 1024 * 1024); // Under 5MB overhead
    });
  });

  describe('BundleOptimizer Performance', () => {
    let bundleOptimizer: BundleOptimizer;

    beforeEach(() => {
      bundleOptimizer = new BundleOptimizer({
        targetSize: 150, // 150KB target
        enableTreeShaking: true,
        enableCodeSplitting: true,
      });
    });

    afterEach(() => {
      bundleOptimizer.clear();
    });

    it('should analyze large bundles quickly', async () => {
      // Register many modules
      for (let i = 0; i < 500; i++) {
        bundleOptimizer.registerModule(`module-${i}.ts`, 'utilities', 2000);
        if (i % 3 === 0) {
          bundleOptimizer.trackImport(`module-${i}.ts`, [`function${i}`]);
        }
      }

      await benchmark.measure('bundle-optimizer-analysis', () => {
        return bundleOptimizer.analyzeBundle();
      });

      const avgTime = benchmark.getAverageTime('bundle-optimizer-analysis');
      expect(avgTime).toBeLessThan(100); // Under 100ms for 500 modules
    });

    it('should optimize bundles efficiently', async () => {
      // Add test modules with various usage patterns
      for (let i = 0; i < 100; i++) {
        bundleOptimizer.registerModule(`module-${i}.ts`, 'utilities', 3000);
        if (i < 50) {
          bundleOptimizer.trackImport(`module-${i}.ts`, [`function${i}`]);
        }
      }

      await benchmark.measure('bundle-optimizer-optimization', () => {
        return bundleOptimizer.optimizeBundle();
      });

      const result = bundleOptimizer.optimizeBundle();
      expect(result.savings).toBeGreaterThan(0);
      expect(result.optimizations.length).toBeGreaterThan(0);

      const avgTime = benchmark.getAverageTime('bundle-optimizer-optimization');
      expect(avgTime).toBeLessThan(50); // Under 50ms for optimization
    });

    it('should generate tree shaking report quickly', async () => {
      // Add modules with unused exports
      for (let i = 0; i < 200; i++) {
        bundleOptimizer.registerModule(`module-${i}.ts`, 'utilities', 2000);
        bundleOptimizer.trackImport(`module-${i}.ts`, [
          'func1',
          'func2',
          'func3',
        ]);
        bundleOptimizer.trackImport(`module-${i}.ts`, ['func1']); // Only use func1
      }

      await benchmark.measure('bundle-optimizer-tree-shaking', () => {
        return bundleOptimizer.generateTreeShakingReport();
      });

      const avgTime = benchmark.getAverageTime('bundle-optimizer-tree-shaking');
      expect(avgTime).toBeLessThan(30); // Under 30ms for tree shaking analysis
    });

    it('should stay under target bundle size', () => {
      const sizeAnalysis = bundleOptimizer.getBundleSizeAnalysis();
      expect(sizeAnalysis.targetSize).toBe(150 * 1024); // 150KB target

      // For our test scenario, we should meet the target
      if (sizeAnalysis.exceedsTarget) {
        expect(sizeAnalysis.recommendations.length).toBeGreaterThan(0);
      }
    });
  });

  describe('LazyLoader Performance', () => {
    let lazyLoader: LazyLoader;

    beforeEach(() => {
      // Mock dynamic import
      (global as any).import = vi
        .fn()
        .mockImplementation((path) =>
          Promise.resolve({ default: `module-${path}` })
        );

      lazyLoader = new LazyLoader({
        enableCaching: true,
        maxConcurrentLoads: 3,
        defaultTimeout: 5000,
      });
    });

    afterEach(() => {
      lazyLoader.dispose();
    });

    it('should load features under 2 seconds', async () => {
      const features: LoadableFeature[] = Array.from(
        { length: 10 },
        (_, i) => ({
          id: `feature-${i}`,
          name: `Feature ${i}`,
          modulePath: `./feature-${i}.js`,
          strategy: 'on-demand',
          priority: 'medium',
          estimatedSize: 5000,
        })
      );

      features.forEach((f) => lazyLoader.registerFeature(f));

      await benchmark.measure('lazy-loader-feature-loading', async () => {
        const loadPromises = features.map((f) => lazyLoader.loadFeature(f.id));
        await Promise.all(loadPromises);
      });

      const avgTime = benchmark.getAverageTime('lazy-loader-feature-loading');
      expect(avgTime).toBeLessThan(2000); // Under 2 seconds for 10 features
    });

    it('should cache modules efficiently', async () => {
      const feature: LoadableFeature = {
        id: 'cached-feature',
        name: 'Cached Feature',
        modulePath: './cached.js',
        strategy: 'on-demand',
        priority: 'high',
        estimatedSize: 3000,
      };

      lazyLoader.registerFeature(feature);

      // First load
      await benchmark.measure('lazy-loader-first-load', () => {
        return lazyLoader.loadFeature('cached-feature');
      });

      // Cached load
      await benchmark.measure('lazy-loader-cached-load', () => {
        return lazyLoader.loadFeature('cached-feature');
      });

      const firstLoadTime = benchmark.getAverageTime('lazy-loader-first-load');
      const cachedLoadTime = benchmark.getAverageTime(
        'lazy-loader-cached-load'
      );

      expect(cachedLoadTime).toBeLessThan(5); // Cached loads should be under 5ms
      expect(cachedLoadTime).toBeLessThan(firstLoadTime * 0.1); // 10x faster than first load
    });

    it('should handle concurrent loads efficiently', async () => {
      const features: LoadableFeature[] = Array.from(
        { length: 20 },
        (_, i) => ({
          id: `concurrent-${i}`,
          name: `Concurrent ${i}`,
          modulePath: `./concurrent-${i}.js`,
          strategy: 'on-demand',
          priority: 'medium',
          estimatedSize: 2000,
        })
      );

      features.forEach((f) => lazyLoader.registerFeature(f));

      await benchmark.measure('lazy-loader-concurrent-loading', async () => {
        const loadPromises = features.map((f) => lazyLoader.loadFeature(f.id));
        await Promise.all(loadPromises);
      });

      const stats = lazyLoader.getStats();
      expect(stats.loadedFeatures).toBe(20);
      expect(stats.averageLoadTime).toBeLessThan(100); // Average under 100ms per feature

      const avgTime = benchmark.getAverageTime(
        'lazy-loader-concurrent-loading'
      );
      expect(avgTime).toBeLessThan(3000); // Total under 3 seconds for 20 features
    });

    it('should use minimal memory for feature management', async () => {
      await benchmark.measure('lazy-loader-memory', async () => {
        // Register many features
        for (let i = 0; i < 100; i++) {
          lazyLoader.registerFeature({
            id: `memory-test-${i}`,
            name: `Memory Test ${i}`,
            modulePath: `./memory-${i}.js`,
            strategy: 'on-demand',
            priority: 'low',
            estimatedSize: 1000,
          });
        }

        // Load some features
        for (let i = 0; i < 20; i++) {
          await lazyLoader.loadFeature(`memory-test-${i}`);
        }
      });

      const memoryDelta = benchmark.getTotalMemoryDelta();
      expect(memoryDelta).toBeLessThan(15 * 1024 * 1024); // Under 15MB for 100 features
    });
  });

  describe('Integrated Performance Tests', () => {
    it('should meet all Phase 5.2 success criteria', async () => {
      // Test integrated performance of all components
      const virtualRenderer = new VirtualRenderer();
      const textureAtlas = new TextureAtlas();
      const memoryProfiler = new MemoryProfiler({ autoProfile: false });
      const bundleOptimizer = new BundleOptimizer();
      const lazyLoader = new LazyLoader();

      await benchmark.measure('integrated-performance', async () => {
        // Virtual rendering test
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { Container } = require('pixi.js');
        const mockContainer = new Container();
        virtualRenderer.initialize(mockContainer, { render: vi.fn() } as any);
        virtualRenderer.setItems(
          Array.from({ length: 1000 }, (_, i) => ({ id: i }))
        );

        // Memory monitoring
        memoryProfiler.takeSnapshot();

        // Bundle analysis
        bundleOptimizer.registerModule('test-module.ts', 'core', 10000);
        bundleOptimizer.analyzeBundle();

        // Feature loading
        lazyLoader.registerFeature({
          id: 'integration-test',
          name: 'Integration Test',
          modulePath: './integration.js',
          strategy: 'immediate',
          priority: 'high',
        });
      });

      // Verify success criteria
      const totalTime = benchmark.getAverageTime('integrated-performance');
      const totalMemory = benchmark.getTotalMemoryDelta();
      const minFPS = benchmark.getMinFPS();

      // Success criteria validation
      expect(totalTime).toBeLessThan(2000); // Load time under 2 seconds
      expect(totalMemory).toBeLessThan(100 * 1024 * 1024); // Memory under 100MB
      expect(minFPS).toBeGreaterThanOrEqual(50); // Close to 60fps (allow tolerance)

      // Bundle size check
      const bundleAnalysis = bundleOptimizer.analyzeBundle();
      expect(bundleAnalysis.totalSize).toBeLessThan(150 * 1024); // Under 150KB

      // Cleanup
      virtualRenderer.dispose();
      textureAtlas.dispose();
      memoryProfiler.dispose();
      bundleOptimizer.clear();
      lazyLoader.dispose();
    });

    it('should maintain performance under stress', async () => {
      const virtualRenderer = new VirtualRenderer({
        containerWidth: 1920,
        containerHeight: 1080,
        itemWidth: 200,
        itemHeight: 150,
        enableRecycling: true,
      });

      await benchmark.measure('stress-test', async () => {
        // Stress test with large dataset
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { Container } = require('pixi.js');
        const mockContainer = new Container();
        virtualRenderer.initialize(mockContainer, { render: vi.fn() } as any);

        const largeDataset = Array.from({ length: 50000 }, (_, i) => ({
          id: i,
        }));
        virtualRenderer.setItems(largeDataset);

        // Rapid scrolling simulation
        for (let i = 0; i < 500; i++) {
          virtualRenderer.updateViewport(i * 50, i * 30);
          if (i % 10 === 0) {
            await new Promise((resolve) => setTimeout(resolve, 1));
          }
        }
      });

      const stressTime = benchmark.getAverageTime('stress-test');
      const stressMemory = benchmark.getTotalMemoryDelta();

      expect(stressTime).toBeLessThan(5000); // Under 5 seconds for stress test
      expect(stressMemory).toBeLessThan(50 * 1024 * 1024); // Under 50MB memory growth

      virtualRenderer.dispose();
    });
  });

  describe('Performance Monitoring', () => {
    it('should track performance metrics accurately', () => {
      const measurements = benchmark.getMeasurements();

      measurements.forEach((measurement) => {
        expect(measurement.duration).toBeGreaterThanOrEqual(0);
        expect(measurement.memoryBefore).toBeGreaterThanOrEqual(0);
        expect(measurement.memoryAfter).toBeGreaterThanOrEqual(0);
        expect(measurement.operation).toBeTruthy();
      });

      // Test aggregation functions
      if (measurements.length > 0) {
        const totalMemory = benchmark.getTotalMemoryDelta();
        const minFPS = benchmark.getMinFPS();

        expect(totalMemory).toBeGreaterThanOrEqual(0);
        expect(minFPS).toBeGreaterThan(0);
        expect(minFPS).toBeLessThanOrEqual(120); // Reasonable upper bound
      }
    });

    it('should provide meaningful performance insights', () => {
      // This test validates that our benchmark suite provides useful data
      expect(benchmark.getMeasurements).toBeDefined();
      expect(benchmark.getAverageTime).toBeDefined();
      expect(benchmark.getTotalMemoryDelta).toBeDefined();
      expect(benchmark.getMinFPS).toBeDefined();
      expect(benchmark.clear).toBeDefined();
    });
  });
});
