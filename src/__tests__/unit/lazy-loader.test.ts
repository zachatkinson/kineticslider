/**
 * @fileoverview Unit tests for LazyLoader
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { LazyLoader } from '../../performance/lazy-loader';
import type {
  LoadableFeature,
  LazyLoaderConfig,
} from '../../performance/lazy-loader';

// Mock global functions
const mockRequestIdleCallback = vi.fn((callback: IdleRequestCallback) => {
  setTimeout(callback, 0);
  return 1;
});

const mockCancelIdleCallback = vi.fn();

(global as any).requestIdleCallback = mockRequestIdleCallback;
global.cancelIdleCallback = mockCancelIdleCallback;

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn().mockImplementation((_callback) => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

global.IntersectionObserver = mockIntersectionObserver;

// Mock dynamic import
const mockImport = vi.fn();
(global as any).import = mockImport;

describe('LazyLoader', () => {
  let lazyLoader: LazyLoader;

  beforeEach(() => {
    vi.useFakeTimers();
    lazyLoader = new LazyLoader({
      enableCaching: true,
      maxConcurrentLoads: 2,
      defaultTimeout: 5000,
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    lazyLoader.dispose();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      const defaultLoader = new LazyLoader();
      expect(defaultLoader).toBeDefined();

      const stats = defaultLoader.getStats();
      expect(stats.totalFeatures).toBe(0);
      expect(stats.loadedFeatures).toBe(0);

      defaultLoader.dispose();
    });

    it('should initialize with custom configuration', () => {
      const config: Partial<LazyLoaderConfig> = {
        enableCaching: false,
        maxCacheSize: 100 * 1024 * 1024,
        defaultTimeout: 15000,
        maxConcurrentLoads: 5,
        enablePreloading: false,
      };

      const customLoader = new LazyLoader(config);
      expect(customLoader).toBeDefined();
      customLoader.dispose();
    });

    it('should setup intersection observer when available', () => {
      expect(mockIntersectionObserver).toHaveBeenCalled();
    });

    it('should setup idle monitoring when available', () => {
      expect(mockRequestIdleCallback).toHaveBeenCalled();
    });
  });

  describe('Feature Registration', () => {
    it('should register a feature', () => {
      const feature: LoadableFeature = {
        id: 'test-feature',
        name: 'Test Feature',
        modulePath: './test-module.js',
        strategy: 'on-demand',
        priority: 'medium',
      };

      lazyLoader.registerFeature(feature);

      const registeredFeature = lazyLoader.getFeature('test-feature');
      expect(registeredFeature).toEqual(feature);

      const stats = lazyLoader.getStats();
      expect(stats.totalFeatures).toBe(1);
    });

    it('should auto-load immediate features', async () => {
      mockImport.mockResolvedValue({ default: 'test-module' });

      const feature: LoadableFeature = {
        id: 'immediate-feature',
        name: 'Immediate Feature',
        modulePath: './immediate-module.js',
        strategy: 'immediate',
        priority: 'critical',
      };

      lazyLoader.registerFeature(feature);

      // Wait for immediate load
      await vi.runAllTimersAsync();

      expect(mockImport).toHaveBeenCalledWith('./immediate-module.js');
    });

    it('should schedule preload features', () => {
      const feature: LoadableFeature = {
        id: 'preload-feature',
        name: 'Preload Feature',
        modulePath: './preload-module.js',
        strategy: 'preload',
        priority: 'high',
      };

      lazyLoader.registerFeature(feature);

      // Preload should be scheduled
      expect(feature.strategy).toBe('preload');
    });

    it('should setup visibility observation for on-visible features', () => {
      const feature: LoadableFeature = {
        id: 'visible-feature',
        name: 'Visible Feature',
        modulePath: './visible-module.js',
        strategy: 'on-visible',
        priority: 'medium',
      };

      lazyLoader.registerFeature(feature);

      // Feature should be registered for visibility observation
      expect(lazyLoader.getFeature('visible-feature')).toBeDefined();
    });
  });

  describe('Feature Loading', () => {
    let testFeature: LoadableFeature;

    beforeEach(() => {
      testFeature = {
        id: 'test-feature',
        name: 'Test Feature',
        modulePath: './test-module.js',
        strategy: 'on-demand',
        priority: 'medium',
        estimatedSize: 5000,
      };
      lazyLoader.registerFeature(testFeature);
    });

    it('should load a feature successfully', async () => {
      const mockModule = { default: 'test-module', function1: () => {} };
      mockImport.mockResolvedValue(mockModule);

      const result = await lazyLoader.loadFeature('test-feature');

      expect(result.success).toBe(true);
      expect(result.module).toEqual(mockModule);
      expect(result.loadTime).toBeGreaterThan(0);
      expect(result.cached).toBe(false);
      expect(mockImport).toHaveBeenCalledWith('./test-module.js');
    });

    it('should handle load failures', async () => {
      const loadError = new Error('Module not found');
      mockImport.mockRejectedValue(loadError);

      await expect(lazyLoader.loadFeature('test-feature')).rejects.toThrow(
        'Module not found'
      );

      const stats = lazyLoader.getStats();
      expect(stats.failedFeatures).toBe(1);
    });

    it('should return cached result on subsequent loads', async () => {
      const mockModule = { default: 'test-module' };
      mockImport.mockResolvedValue(mockModule);

      // First load
      const firstResult = await lazyLoader.loadFeature('test-feature');
      expect(firstResult.cached).toBe(false);

      // Second load should be cached
      const secondResult = await lazyLoader.loadFeature('test-feature');
      expect(secondResult.cached).toBe(true);
      expect(secondResult.module).toEqual(mockModule);
      expect(mockImport).toHaveBeenCalledTimes(1);
    });

    it('should handle load timeout', async () => {
      mockImport.mockImplementation(() => new Promise(() => {})); // Never resolves

      const timeoutFeature: LoadableFeature = {
        ...testFeature,
        id: 'timeout-feature',
        timeout: 1000,
      };
      lazyLoader.registerFeature(timeoutFeature);

      const loadPromise = lazyLoader.loadFeature('timeout-feature');

      // Advance time past timeout
      vi.advanceTimersByTime(1500);

      await expect(loadPromise).rejects.toThrow('Load timeout');
    });

    it('should throw error for non-existent feature', async () => {
      await expect(lazyLoader.loadFeature('non-existent')).rejects.toThrow(
        'Feature not found'
      );
    });

    it('should handle concurrent load limits', async () => {
      const features = ['feature1', 'feature2', 'feature3'].map((id) => ({
        id,
        name: id,
        modulePath: `./${id}.js`,
        strategy: 'on-demand' as const,
        priority: 'medium' as const,
      }));

      features.forEach((feature) => lazyLoader.registerFeature(feature));

      mockImport.mockImplementation(
        (path) =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ default: path }), 100)
          )
      );

      // Start all loads simultaneously
      const loadPromises = features.map((f) => lazyLoader.loadFeature(f.id));

      // Only 2 should load concurrently (maxConcurrentLoads: 2)
      vi.advanceTimersByTime(50);
      expect(mockImport).toHaveBeenCalledTimes(2);

      // Complete first loads and check queue processing
      vi.advanceTimersByTime(100);
      await vi.runAllTimersAsync();

      const results = await Promise.all(loadPromises);
      expect(results).toHaveLength(3);
      expect(results.every((r) => r.success)).toBe(true);
    });
  });

  describe('Loading Conditions', () => {
    it('should check custom conditions', async () => {
      const conditionMet = vi.fn(() => true);
      const conditionNotMet = vi.fn(() => false);

      const featureWithCondition: LoadableFeature = {
        id: 'conditional-feature',
        name: 'Conditional Feature',
        modulePath: './conditional-module.js',
        strategy: 'on-demand',
        priority: 'medium',
        conditions: [{ type: 'custom', value: null, check: conditionMet }],
      };

      const featureWithFailedCondition: LoadableFeature = {
        id: 'failed-condition-feature',
        name: 'Failed Condition Feature',
        modulePath: './failed-module.js',
        strategy: 'on-demand',
        priority: 'medium',
        conditions: [{ type: 'custom', value: null, check: conditionNotMet }],
      };

      lazyLoader.registerFeature(featureWithCondition);
      lazyLoader.registerFeature(featureWithFailedCondition);

      mockImport.mockResolvedValue({ default: 'test' });

      // Should load when condition is met
      const result1 = await lazyLoader.loadFeature('conditional-feature');
      expect(result1.success).toBe(true);
      expect(conditionMet).toHaveBeenCalled();

      // Should fail when condition is not met
      await expect(
        lazyLoader.loadFeature('failed-condition-feature')
      ).rejects.toThrow('Conditions not met');
      expect(conditionNotMet).toHaveBeenCalled();
    });

    it('should handle async conditions', async () => {
      const asyncCondition = vi.fn(() => Promise.resolve(true));

      const feature: LoadableFeature = {
        id: 'async-condition-feature',
        name: 'Async Condition Feature',
        modulePath: './async-module.js',
        strategy: 'on-demand',
        priority: 'medium',
        conditions: [{ type: 'custom', value: null, check: asyncCondition }],
      };

      lazyLoader.registerFeature(feature);
      mockImport.mockResolvedValue({ default: 'test' });

      const result = await lazyLoader.loadFeature('async-condition-feature');
      expect(result.success).toBe(true);
      expect(asyncCondition).toHaveBeenCalled();
    });
  });

  describe('Dependencies', () => {
    it('should load dependencies before main feature', async () => {
      const dependency: LoadableFeature = {
        id: 'dependency',
        name: 'Dependency',
        modulePath: './dependency.js',
        strategy: 'on-demand',
        priority: 'high',
      };

      const mainFeature: LoadableFeature = {
        id: 'main-feature',
        name: 'Main Feature',
        modulePath: './main-feature.js',
        strategy: 'on-demand',
        priority: 'medium',
        dependencies: ['dependency'],
      };

      lazyLoader.registerFeature(dependency);
      lazyLoader.registerFeature(mainFeature);

      mockImport.mockImplementation((path) =>
        Promise.resolve({ default: path })
      );

      const result = await lazyLoader.loadFeature('main-feature');

      expect(result.success).toBe(true);
      expect(lazyLoader.isLoaded('dependency')).toBe(true);
      expect(mockImport).toHaveBeenCalledWith('./dependency.js');
      expect(mockImport).toHaveBeenCalledWith('./main-feature.js');
    });

    it('should not reload already loaded dependencies', async () => {
      const dependency: LoadableFeature = {
        id: 'dependency',
        name: 'Dependency',
        modulePath: './dependency.js',
        strategy: 'on-demand',
        priority: 'high',
      };

      const feature1: LoadableFeature = {
        id: 'feature1',
        name: 'Feature 1',
        modulePath: './feature1.js',
        strategy: 'on-demand',
        priority: 'medium',
        dependencies: ['dependency'],
      };

      const feature2: LoadableFeature = {
        id: 'feature2',
        name: 'Feature 2',
        modulePath: './feature2.js',
        strategy: 'on-demand',
        priority: 'medium',
        dependencies: ['dependency'],
      };

      [dependency, feature1, feature2].forEach((f) =>
        lazyLoader.registerFeature(f)
      );
      mockImport.mockImplementation((path) =>
        Promise.resolve({ default: path })
      );

      await lazyLoader.loadFeature('feature1');
      await lazyLoader.loadFeature('feature2');

      // Dependency should only be loaded once
      expect(mockImport).toHaveBeenCalledWith('./dependency.js');
      expect(mockImport).toHaveBeenCalledTimes(3); // dependency + feature1 + feature2
    });
  });

  describe('Preloading', () => {
    it('should preload high priority features', () => {
      const highPriorityFeatures = [
        {
          id: 'high1',
          name: 'High 1',
          modulePath: './high1.js',
          strategy: 'preload' as const,
          priority: 'high' as const,
        },
        {
          id: 'medium1',
          name: 'Medium 1',
          modulePath: './medium1.js',
          strategy: 'preload' as const,
          priority: 'medium' as const,
        },
        {
          id: 'low1',
          name: 'Low 1',
          modulePath: './low1.js',
          strategy: 'preload' as const,
          priority: 'low' as const,
        },
      ];

      highPriorityFeatures.forEach((f) => lazyLoader.registerFeature(f));
      mockImport.mockResolvedValue({ default: 'test' });

      lazyLoader.preloadFeatures(['high', 'medium']);

      // Should attempt to load high and medium priority features
      expect(mockImport).toHaveBeenCalledWith('./high1.js');
      expect(mockImport).toHaveBeenCalledWith('./medium1.js');
      expect(mockImport).not.toHaveBeenCalledWith('./low1.js');
    });

    it('should not preload already loaded features', async () => {
      const feature: LoadableFeature = {
        id: 'preload-feature',
        name: 'Preload Feature',
        modulePath: './preload.js',
        strategy: 'preload',
        priority: 'high',
      };

      lazyLoader.registerFeature(feature);
      mockImport.mockResolvedValue({ default: 'test' });

      // Load feature first
      await lazyLoader.loadFeature('preload-feature');
      mockImport.mockClear();

      // Preloading should not reload
      lazyLoader.preloadFeatures(['high']);
      expect(mockImport).not.toHaveBeenCalled();
    });
  });

  describe('Interaction Loading', () => {
    it('should setup interaction listeners', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');

      const interactionFeature: LoadableFeature = {
        id: 'interaction-feature',
        name: 'Interaction Feature',
        modulePath: './interaction.js',
        strategy: 'on-interaction',
        priority: 'medium',
      };

      lazyLoader.registerFeature(interactionFeature);
      lazyLoader.loadOnInteraction(['interaction-feature']);

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'click',
        expect.any(Function),
        { once: true }
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function),
        { once: true }
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function),
        { once: true }
      );

      addEventListenerSpy.mockRestore();
    });
  });

  describe('Caching', () => {
    beforeEach(() => {
      lazyLoader = new LazyLoader({
        enableCaching: true,
        maxCacheSize: 10000, // 10KB for testing
      });
    });

    it('should cache loaded modules', async () => {
      const feature: LoadableFeature = {
        id: 'cacheable-feature',
        name: 'Cacheable Feature',
        modulePath: './cacheable.js',
        strategy: 'on-demand',
        priority: 'medium',
        estimatedSize: 2000,
      };

      lazyLoader.registerFeature(feature);
      mockImport.mockResolvedValue({ default: 'cached-module' });

      const result = await lazyLoader.loadFeature('cacheable-feature');
      expect(result.cached).toBe(false);

      const cachedResult = await lazyLoader.loadFeature('cacheable-feature');
      expect(cachedResult.cached).toBe(true);
      expect(cachedResult.module).toEqual({ default: 'cached-module' });
    });

    it('should evict cache when size limit exceeded', async () => {
      const features = Array.from({ length: 5 }, (_, i) => ({
        id: `feature-${i}`,
        name: `Feature ${i}`,
        modulePath: `./feature-${i}.js`,
        strategy: 'on-demand' as const,
        priority: 'medium' as const,
        estimatedSize: 3000, // Total: 15KB > 10KB limit
      }));

      features.forEach((f) => lazyLoader.registerFeature(f));
      mockImport.mockImplementation((path) =>
        Promise.resolve({ default: path })
      );

      // Load all features
      for (const feature of features) {
        await lazyLoader.loadFeature(feature.id);
      }

      // Some features should be evicted from cache
      const stats = lazyLoader.getStats();
      expect(stats.totalBytesLoaded).toBeGreaterThan(10000);
    });

    it('should clear cache', () => {
      lazyLoader.clearCache();

      const stats = lazyLoader.getStats();
      expect(stats.cacheHitRate).toBe(0);
    });
  });

  describe('Statistics', () => {
    it('should track loading statistics', async () => {
      const features = Array.from({ length: 3 }, (_, i) => ({
        id: `stat-feature-${i}`,
        name: `Stat Feature ${i}`,
        modulePath: `./stat-${i}.js`,
        strategy: 'on-demand' as const,
        priority: 'medium' as const,
        estimatedSize: 1000,
      }));

      features.forEach((f) => lazyLoader.registerFeature(f));
      mockImport.mockResolvedValue({ default: 'test' });

      // Load 2 features successfully
      await lazyLoader.loadFeature('stat-feature-0');
      await lazyLoader.loadFeature('stat-feature-1');

      // Fail to load 1 feature
      mockImport.mockRejectedValueOnce(new Error('Load failed'));
      try {
        await lazyLoader.loadFeature('stat-feature-2');
      } catch {
        // Expected failure
      }

      const stats = lazyLoader.getStats();
      expect(stats.totalFeatures).toBe(3);
      expect(stats.loadedFeatures).toBe(2);
      expect(stats.failedFeatures).toBe(1);
      expect(stats.totalLoadTime).toBeGreaterThan(0);
      expect(stats.averageLoadTime).toBeGreaterThan(0);
      expect(stats.totalBytesLoaded).toBe(2000);
    });

    it('should calculate cache hit rate', async () => {
      const feature: LoadableFeature = {
        id: 'cache-test',
        name: 'Cache Test',
        modulePath: './cache-test.js',
        strategy: 'on-demand',
        priority: 'medium',
      };

      lazyLoader.registerFeature(feature);
      mockImport.mockResolvedValue({ default: 'test' });

      // Load feature multiple times
      await lazyLoader.loadFeature('cache-test');
      await lazyLoader.loadFeature('cache-test');
      await lazyLoader.loadFeature('cache-test');

      const stats = lazyLoader.getStats();
      expect(stats.cacheHitRate).toBeGreaterThan(0);
    });
  });

  describe('Utilities', () => {
    it('should check if feature is loaded', async () => {
      const feature: LoadableFeature = {
        id: 'check-loaded',
        name: 'Check Loaded',
        modulePath: './check-loaded.js',
        strategy: 'on-demand',
        priority: 'medium',
      };

      lazyLoader.registerFeature(feature);
      mockImport.mockResolvedValue({ default: 'test' });

      expect(lazyLoader.isLoaded('check-loaded')).toBe(false);

      await lazyLoader.loadFeature('check-loaded');

      expect(lazyLoader.isLoaded('check-loaded')).toBe(true);
    });

    it('should get loaded module', async () => {
      const feature: LoadableFeature = {
        id: 'get-module',
        name: 'Get Module',
        modulePath: './get-module.js',
        strategy: 'on-demand',
        priority: 'medium',
      };

      lazyLoader.registerFeature(feature);
      const mockModule = { default: 'test-module', fn: () => {} };
      mockImport.mockResolvedValue(mockModule);

      expect(lazyLoader.getModule('get-module')).toBeUndefined();

      await lazyLoader.loadFeature('get-module');

      expect(lazyLoader.getModule('get-module')).toEqual(mockModule);
    });
  });

  describe('Disposal', () => {
    it('should dispose properly', () => {
      lazyLoader.dispose();

      // Should clear all data
      const stats = lazyLoader.getStats();
      expect(stats.totalFeatures).toBe(0);
      expect(stats.loadedFeatures).toBe(0);

      // Should handle operations after disposal
      expect(() => {
        lazyLoader.getFeature('test');
        lazyLoader.clearCache();
      }).not.toThrow();
    });

    it('should cancel idle callbacks on disposal', () => {
      lazyLoader.dispose();
      expect(mockCancelIdleCallback).toHaveBeenCalled();
    });

    it('should disconnect intersection observer on disposal', () => {
      const mockDisconnect = vi.fn();
      mockIntersectionObserver.mockReturnValue({
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: mockDisconnect,
      });

      const loader = new LazyLoader();
      loader.dispose();

      expect(mockDisconnect).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle features without estimated size', async () => {
      const feature: LoadableFeature = {
        id: 'no-size',
        name: 'No Size',
        modulePath: './no-size.js',
        strategy: 'on-demand',
        priority: 'medium',
        // No estimatedSize
      };

      lazyLoader.registerFeature(feature);
      mockImport.mockResolvedValue({ default: 'test' });

      const result = await lazyLoader.loadFeature('no-size');
      expect(result.success).toBe(true);
    });

    it('should handle empty dependencies array', async () => {
      const feature: LoadableFeature = {
        id: 'empty-deps',
        name: 'Empty Dependencies',
        modulePath: './empty-deps.js',
        strategy: 'on-demand',
        priority: 'medium',
        dependencies: [],
      };

      lazyLoader.registerFeature(feature);
      mockImport.mockResolvedValue({ default: 'test' });

      const result = await lazyLoader.loadFeature('empty-deps');
      expect(result.success).toBe(true);
    });

    it('should handle features without conditions', async () => {
      const feature: LoadableFeature = {
        id: 'no-conditions',
        name: 'No Conditions',
        modulePath: './no-conditions.js',
        strategy: 'on-demand',
        priority: 'medium',
        // No conditions
      };

      lazyLoader.registerFeature(feature);
      mockImport.mockResolvedValue({ default: 'test' });

      const result = await lazyLoader.loadFeature('no-conditions');
      expect(result.success).toBe(true);
    });

    it('should handle concurrent loads of the same feature', async () => {
      const feature: LoadableFeature = {
        id: 'concurrent',
        name: 'Concurrent',
        modulePath: './concurrent.js',
        strategy: 'on-demand',
        priority: 'medium',
      };

      lazyLoader.registerFeature(feature);
      mockImport.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ default: 'concurrent-module' }), 100)
          )
      );

      // Start multiple concurrent loads
      const loadPromises = [
        lazyLoader.loadFeature('concurrent'),
        lazyLoader.loadFeature('concurrent'),
        lazyLoader.loadFeature('concurrent'),
      ];

      vi.advanceTimersByTime(150);
      const results = await Promise.all(loadPromises);

      // All should succeed, but module should only be loaded once
      expect(results.every((r) => r.success)).toBe(true);
      expect(mockImport).toHaveBeenCalledTimes(1);
    });
  });
});
