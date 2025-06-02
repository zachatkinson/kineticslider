/**
 * FilterManager Service Tests
 * 
 * Tests for the FilterManager service including filter creation,
 * management, performance monitoring, and resource cleanup.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FilterManager } from '../../services/FilterManager';
import { 
  createFilterIntensity, 
  type DisplacementFilterConfig,
  type GlowFilterConfig 
} from '../../types/filters';

// Mock PIXI.js
vi.mock('pixi.js', () => ({
  DisplacementFilter: vi.fn().mockImplementation(() => ({
    scale: { x: 20, y: 20 },
    enabled: true,
    destroy: vi.fn()
  })),
  Texture: {
    from: vi.fn().mockReturnValue({
      destroy: vi.fn()
    })
  },
  Sprite: vi.fn().mockImplementation(() => ({
    destroy: vi.fn()
  })),
  Point: vi.fn().mockImplementation((x: number, y: number) => ({ x, y }))
}));

// Mock pixi-filters
vi.mock('pixi-filters', () => ({
  GlowFilter: vi.fn().mockImplementation(() => ({
    distance: 10,
    innerStrength: 0,
    outerStrength: 4,
    enabled: true,
    destroy: vi.fn()
  }))
}));

// Mock logger
vi.mock('../../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

// Mock performance monitor
vi.mock('../../utils/performance-monitor', () => ({
  PerformanceMonitor: vi.fn().mockImplementation(() => ({
    recordMetric: vi.fn(),
    trackFPS: vi.fn(),
    trackMemory: vi.fn(),
    getMetrics: vi.fn().mockReturnValue([]),
    cleanup: vi.fn()
  }))
}));

describe('FilterManager', () => {
  let filterManager: FilterManager;

  beforeEach(() => {
    // Reset singleton
    (FilterManager as any).instance = null;
    filterManager = FilterManager.getInstance({
      enableCaching: true,
      enablePerformanceMonitoring: true,
      maxConcurrentFilters: 10,
      cacheSize: 50
    });
  });

  afterEach(() => {
    filterManager.dispose();
    vi.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = FilterManager.getInstance();
      const instance2 = FilterManager.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should create new instance after disposal', () => {
      const instance1 = FilterManager.getInstance();
      instance1.dispose();
      const instance2 = FilterManager.getInstance();
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('Filter Creation', () => {
    it('should create a displacement filter', async () => {
      const config: DisplacementFilterConfig = {
        type: 'displacement',
        enabled: true,
        intensity: createFilterIntensity(5),
        displacementMap: 'test-texture.png',
        scaleX: 30,
        scaleY: 30
      };

      // Mock the loadFilterModule method
      const mockCreateFilter = vi.fn().mockReturnValue({
        filter: {
          scale: { x: 30, y: 30 },
          enabled: true,
          destroy: vi.fn()
        },
        config,
        updateIntensity: vi.fn(),
        reset: vi.fn(),
        dispose: vi.fn(),
        getState: vi.fn().mockReturnValue({ intensity: 5 })
      });

      vi.spyOn(filterManager as any, 'loadFilterModule').mockResolvedValue(mockCreateFilter);

      const result = await filterManager.createFilter(config);
      
      expect(result).toBeDefined();
      expect(result.filter).toBeDefined();
      expect(result.config).toEqual(config);
      expect(result.updateIntensity).toBeInstanceOf(Function);
      expect(result.reset).toBeInstanceOf(Function);
      expect(result.dispose).toBeInstanceOf(Function);
    });

    it('should create a glow filter', async () => {
      const config: GlowFilterConfig = {
        type: 'glow',
        enabled: true,
        intensity: createFilterIntensity(7),
        distance: 10,
        outerStrength: 4
      };

      // Mock the loadFilterModule method
      const mockCreateFilter = vi.fn().mockReturnValue({
        filter: {
          distance: 10,
          innerStrength: 0,
          outerStrength: 4,
          enabled: true,
          destroy: vi.fn()
        },
        config,
        updateIntensity: vi.fn(),
        reset: vi.fn(),
        dispose: vi.fn(),
        getState: vi.fn().mockReturnValue({ intensity: 7 })
      });

      vi.spyOn(filterManager as any, 'loadFilterModule').mockResolvedValue(mockCreateFilter);

      const result = await filterManager.createFilter(config);
      
      expect(result).toBeDefined();
      expect(result.filter).toBeDefined();
      expect(result.config).toEqual(config);
    });

    it('should handle filter creation errors', async () => {
      const config: DisplacementFilterConfig = {
        type: 'displacement',
        enabled: true,
        intensity: createFilterIntensity(5),
        displacementMap: 'invalid-texture.png'
      };

      // Mock the loadFilterModule method to throw an error
      vi.spyOn(filterManager as any, 'loadFilterModule').mockRejectedValue(new Error('Failed to load filter module'));

      await expect(filterManager.createFilter(config)).rejects.toThrow('Failed to load filter module');
    });
  });

  describe('Filter Management', () => {
    it('should track active filters', async () => {
      const config: GlowFilterConfig = {
        type: 'glow',
        enabled: true,
        intensity: createFilterIntensity(5),
        distance: 8
      };

      // Mock the loadFilterModule method
      const mockCreateFilter = vi.fn().mockReturnValue({
        filter: {
          distance: 8,
          enabled: true,
          destroy: vi.fn()
        },
        config,
        updateIntensity: vi.fn(),
        reset: vi.fn(),
        dispose: vi.fn(),
        getState: vi.fn()
      });

      vi.spyOn(filterManager as any, 'loadFilterModule').mockResolvedValue(mockCreateFilter);

      await filterManager.createFilter(config);
      
      const activeFilters = filterManager.getActiveFilters();
      expect(activeFilters).toHaveLength(1);
    });

    it('should update filter intensity', async () => {
      const config: GlowFilterConfig = {
        type: 'glow',
        enabled: true,
        intensity: createFilterIntensity(5),
        distance: 8
      };

      const mockUpdateIntensity = vi.fn();
      const mockCreateFilter = vi.fn().mockReturnValue({
        filter: {
          distance: 8,
          enabled: true,
          destroy: vi.fn(),
          updateIntensity: mockUpdateIntensity
        },
        config,
        updateIntensity: vi.fn(),
        reset: vi.fn(),
        dispose: vi.fn(),
        getState: vi.fn()
      });

      vi.spyOn(filterManager as any, 'loadFilterModule').mockResolvedValue(mockCreateFilter);

      await filterManager.createFilter(config);
      const activeFilters = filterManager.getActiveFilters();
      const filterId = activeFilters[0].id;
      
      const newIntensity = createFilterIntensity(8);
      filterManager.updateFilterIntensity(filterId, newIntensity);
      
      expect(mockUpdateIntensity).toHaveBeenCalledWith(newIntensity);
    });

    it('should dispose filters', async () => {
      const config: GlowFilterConfig = {
        type: 'glow',
        enabled: true,
        intensity: createFilterIntensity(5),
        distance: 8
      };

      const mockDispose = vi.fn();
      const mockCreateFilter = vi.fn().mockReturnValue({
        filter: {
          distance: 8,
          enabled: true,
          destroy: vi.fn(),
          dispose: mockDispose
        },
        config,
        updateIntensity: vi.fn(),
        reset: vi.fn(),
        dispose: vi.fn(),
        getState: vi.fn()
      });

      vi.spyOn(filterManager as any, 'loadFilterModule').mockResolvedValue(mockCreateFilter);

      await filterManager.createFilter(config);
      const activeFilters = filterManager.getActiveFilters();
      const filterId = activeFilters[0].id;
      
      filterManager.disposeFilter(filterId);
      
      const activeFiltersAfter = filterManager.getActiveFilters();
      expect(activeFiltersAfter).toHaveLength(0);
      expect(mockDispose).toHaveBeenCalled();
    });
  });

  describe('Performance Monitoring', () => {
    it('should track performance metrics', () => {
      const metrics = filterManager.getPerformanceMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics.activeFilters).toBe(0);
      expect(metrics.creationTimeMs).toBe(0);
      expect(metrics.averageUpdateTimeMs).toBe(0);
      expect(metrics.memoryUsageMB).toBeGreaterThanOrEqual(0);
      expect(metrics.cacheHitRate).toBe(0);
      expect(metrics.shaderCompilations).toBe(0);
    });

    it('should update metrics after filter creation', async () => {
      const config: GlowFilterConfig = {
        type: 'glow',
        enabled: true,
        intensity: createFilterIntensity(5),
        distance: 8
      };

      const mockCreateFilter = vi.fn().mockReturnValue({
        filter: {
          distance: 8,
          enabled: true,
          destroy: vi.fn()
        },
        config,
        updateIntensity: vi.fn(),
        reset: vi.fn(),
        dispose: vi.fn(),
        getState: vi.fn()
      });

      vi.spyOn(filterManager as any, 'loadFilterModule').mockResolvedValue(mockCreateFilter);

      await filterManager.createFilter(config);
      
      const metrics = filterManager.getPerformanceMetrics();
      expect(metrics.activeFilters).toBe(1);
    });
  });

  describe('Caching', () => {
    it('should cache filter results', async () => {
      const config: GlowFilterConfig = {
        type: 'glow',
        enabled: true,
        intensity: createFilterIntensity(5),
        distance: 8
      };

      const mockCreateFilter = vi.fn().mockReturnValue({
        filter: {
          distance: 8,
          enabled: true,
          destroy: vi.fn()
        },
        config,
        updateIntensity: vi.fn(),
        reset: vi.fn(),
        dispose: vi.fn(),
        getState: vi.fn()
      });

      const loadFilterModuleSpy = vi.spyOn(filterManager as any, 'loadFilterModule').mockResolvedValue(mockCreateFilter);

      // Create the same filter twice
      await filterManager.createFilter(config);
      await filterManager.createFilter(config);
      
      // Should only call loadFilterModule once due to caching
      expect(loadFilterModuleSpy).toHaveBeenCalledTimes(1);
    });

    it('should clear cache', () => {
      filterManager.clearCache();
      // Should not throw and should clear internal cache
      expect(() => filterManager.clearCache()).not.toThrow();
    });
  });

  describe('Event System', () => {
    it('should emit filter events', async () => {
      const config: GlowFilterConfig = {
        type: 'glow',
        enabled: true,
        intensity: createFilterIntensity(5),
        distance: 8
      };

      const eventHandler = vi.fn();
      filterManager.on('created', eventHandler);

      const mockCreateFilter = vi.fn().mockReturnValue({
        filter: {
          distance: 8,
          enabled: true,
          destroy: vi.fn()
        },
        config,
        updateIntensity: vi.fn(),
        reset: vi.fn(),
        dispose: vi.fn(),
        getState: vi.fn()
      });

      vi.spyOn(filterManager as any, 'loadFilterModule').mockResolvedValue(mockCreateFilter);

      await filterManager.createFilter(config);
      
      expect(eventHandler).toHaveBeenCalled();
    });
  });

  describe('Cleanup and Disposal', () => {
    it('should dispose all resources', () => {
      expect(() => filterManager.dispose()).not.toThrow();
    });

    it('should handle multiple disposals gracefully', () => {
      filterManager.dispose();
      expect(() => filterManager.dispose()).not.toThrow();
    });
  });
}); 