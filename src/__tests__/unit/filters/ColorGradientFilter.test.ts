/**
 * ColorGradientFilter Unit Tests
 * 
 * Comprehensive test suite for the ColorGradientFilter implementation.
 * Tests filter creation, configuration, intensity updates, and edge cases.
 * 
 * @module ColorGradientFilterTests
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ColorGradientFilter, createColorGradientFilter, type ColorGradientFilterConfig } from '../../../filters/ColorGradientFilter';
import { createFilterIntensity } from '../../../types/filters';

// Mock pixi-filters
vi.mock('pixi-filters', () => ({
  ColorGradientFilter: vi.fn().mockImplementation((config: any) => ({
    type: config?.type ?? 0,
    stops: config?.stops ?? [],
    alpha: config?.alpha ?? 1,
    angle: config?.angle ?? 90,
    maxColors: config?.maxColors ?? 0,
    replace: config?.replace ?? false,
    destroy: vi.fn(),
    enabled: true
  }))
}));

// Mock pixi.js Filter
vi.mock('pixi.js', () => ({
  Filter: vi.fn().mockImplementation(() => ({
    enabled: true,
    destroy: vi.fn()
  }))
}));

describe('ColorGradientFilter', () => {
  let basicConfig: ColorGradientFilterConfig;
  let advancedConfig: ColorGradientFilterConfig;

  beforeEach(() => {
    basicConfig = {
      type: 'colorGradient',
      stops: [
        { offset: 0, color: 0xff0000, alpha: 1 },
        { offset: 1, color: 0x0000ff, alpha: 1 }
      ]
    };

    advancedConfig = {
      type: 'colorGradient',
      stops: [
        { offset: 0, color: 0xff0000, alpha: 1 },
        { offset: 0.5, color: 0x00ff00, alpha: 0.8 },
        { offset: 1, color: 0x0000ff, alpha: 1 }
      ],
      alpha: 0.8,
      angle: 45,
      maxColors: 3,
      replace: true,
      gradientType: ColorGradientFilter.RADIAL,
      intensity: 3
    };
  });

  describe('Class Implementation', () => {
    it('should create filter with correct type', () => {
      const filter = new ColorGradientFilter(basicConfig);
      expect(filter).toBeInstanceOf(ColorGradientFilter);
      expect(filter.config.type).toBe('colorGradient');
    });

    it('should initialize with correct configuration', () => {
      const filter = new ColorGradientFilter(advancedConfig);
      const state = filter.getState();
      
      // The alpha will be scaled by intensity during initialization
      // With intensity 3 and base alpha 0.8: 0.8 + (3 * (1 - 0.8) * 0.1) = 0.86
      expect(state.alpha).toBeCloseTo(0.86, 2);
      expect(state.angle).toBe(45);
      expect(state.maxColors).toBe(3);
      expect(state.replace).toBe(true);
      expect(state.gradientType).toBe(ColorGradientFilter.RADIAL);
      expect(state.stops).toEqual(advancedConfig.stops);
    });

    it('should apply initial intensity correctly', () => {
      const filter = new ColorGradientFilter(advancedConfig);
      
      // With intensity 3 and base alpha 0.8
      // Expected: 0.8 + (3 * (1 - 0.8) * 0.1) = 0.8 + (3 * 0.02) = 0.86
      const state = filter.getState();
      expect(state.alpha).toBeCloseTo(0.86, 2);
    });

    it('should update intensity correctly', () => {
      const filter = new ColorGradientFilter({
        ...basicConfig,
        alpha: 0.5
      });
      
      filter.updateIntensity(createFilterIntensity(5));
      
      // With intensity 5 and base alpha 0.5
      // Expected: 0.5 + (5 * (1 - 0.5) * 0.1) = 0.5 + (5 * 0.05) = 0.75
      const state = filter.getState();
      expect(state.alpha).toBeCloseTo(0.75, 2);
    });

    it('should reset to original configuration', () => {
      const filter = new ColorGradientFilter(advancedConfig);
      
      // Modify the filter
      filter.updateIntensity(createFilterIntensity(8));
      
      // Reset
      filter.reset();
      
      const state = filter.getState();
      expect(state.alpha).toBe(0.8);
      expect(state.angle).toBe(45);
      expect(state.maxColors).toBe(3);
      expect(state.replace).toBe(true);
      expect(state.gradientType).toBe(ColorGradientFilter.RADIAL);
      expect(state.stops).toEqual(advancedConfig.stops);
    });

    it('should handle default values when options not specified', () => {
      const filter = new ColorGradientFilter(basicConfig);
      const state = filter.getState();
      
      expect(state.alpha).toBe(1);
      expect(state.angle).toBe(90);
      expect(state.maxColors).toBe(0);
      expect(state.replace).toBe(false);
      expect(state.gradientType).toBe(ColorGradientFilter.LINEAR);
    });

    it('should handle multiple color stops correctly', () => {
      const multiStopConfig: ColorGradientFilterConfig = {
        type: 'colorGradient',
        stops: [
          { offset: 0, color: 0xff0000, alpha: 1 },
          { offset: 0.25, color: 0xff8000, alpha: 0.9 },
          { offset: 0.5, color: 0xffff00, alpha: 0.8 },
          { offset: 0.75, color: 0x80ff00, alpha: 0.9 },
          { offset: 1, color: 0x00ff00, alpha: 1 }
        ]
      };
      
      const filter = new ColorGradientFilter(multiStopConfig);
      const state = filter.getState();
      
      expect(state.stops).toEqual(multiStopConfig.stops);
      expect((state.stops as any[]).length).toBe(5);
    });

    it('should clamp alpha values properly', () => {
      const filter = new ColorGradientFilter({
        ...basicConfig,
        alpha: 0.9
      });
      
      // Test maximum intensity doesn't exceed 1.0
      filter.updateIntensity(createFilterIntensity(10));
      
      const state = filter.getState();
      expect(state.alpha).toBeLessThanOrEqual(1.0);
      expect(state.alpha).toBeCloseTo(1.0, 2);
    });

    it('should properly dispose resources', () => {
      const filter = new ColorGradientFilter(basicConfig);
      
      expect(() => filter.dispose()).not.toThrow();
      expect(filter.filter.destroy).toHaveBeenCalled();
    });
  });

  describe('Factory Function', () => {
    it('should create filter with factory function', () => {
      const filterWrapper = createColorGradientFilter(basicConfig);
      
      expect(filterWrapper).toHaveProperty('filter');
      expect(filterWrapper).toHaveProperty('updateIntensity');
      expect(filterWrapper).toHaveProperty('reset');
      expect(filterWrapper).toHaveProperty('dispose');
    });

    it('should update intensity through factory function', () => {
      const filterWrapper = createColorGradientFilter({
        ...basicConfig,
        alpha: 0.6
      });
      
      filterWrapper.updateIntensity(4);
      
      // Should update the underlying filter
      expect(filterWrapper.filter).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero intensity', () => {
      const filter = new ColorGradientFilter({
        ...basicConfig,
        alpha: 0.7
      });
      
      filter.updateIntensity(createFilterIntensity(0));
      
      const state = filter.getState();
      expect(state.alpha).toBe(0.7); // Should remain at base alpha
    });

    it('should handle minimum color stops requirement', () => {
      const minimalConfig: ColorGradientFilterConfig = {
        type: 'colorGradient',
        stops: [
          { offset: 0, color: 0x000000, alpha: 1 },
          { offset: 1, color: 0xffffff, alpha: 1 }
        ]
      };
      
      expect(() => new ColorGradientFilter(minimalConfig)).not.toThrow();
    });

    it('should handle different gradient types', () => {
      const linearFilter = new ColorGradientFilter({
        ...basicConfig,
        gradientType: ColorGradientFilter.LINEAR
      });
      
      const radialFilter = new ColorGradientFilter({
        ...basicConfig,
        gradientType: ColorGradientFilter.RADIAL
      });
      
      const conicFilter = new ColorGradientFilter({
        ...basicConfig,
        gradientType: ColorGradientFilter.CONIC
      });
      
      expect(linearFilter.getState().gradientType).toBe(ColorGradientFilter.LINEAR);
      expect(radialFilter.getState().gradientType).toBe(ColorGradientFilter.RADIAL);
      expect(conicFilter.getState().gradientType).toBe(ColorGradientFilter.CONIC);
    });

    it('should handle extreme angle values', () => {
      const filter = new ColorGradientFilter({
        ...basicConfig,
        angle: 720 // Multiple rotations
      });
      
      const state = filter.getState();
      expect(state.angle).toBe(720);
    });

    it('should handle maxColors parameter', () => {
      const limitedColorsFilter = new ColorGradientFilter({
        ...basicConfig,
        maxColors: 2
      });
      
      const unlimitedColorsFilter = new ColorGradientFilter({
        ...basicConfig,
        maxColors: 0
      });
      
      expect(limitedColorsFilter.getState().maxColors).toBe(2);
      expect(unlimitedColorsFilter.getState().maxColors).toBe(0);
    });
  });

  describe('Performance', () => {
    it('should handle rapid intensity updates', () => {
      const filter = new ColorGradientFilter(basicConfig);
      
      const startTime = performance.now();
      
      // Perform 100 rapid updates
      for (let i = 0; i < 100; i++) {
        filter.updateIntensity(createFilterIntensity(i % 11));
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (< 50ms)
      expect(duration).toBeLessThan(50);
    });
  });

  describe('Constants', () => {
    it('should have correct gradient type constants', () => {
      expect(ColorGradientFilter.LINEAR).toBe(0);
      expect(ColorGradientFilter.RADIAL).toBe(1);
      expect(ColorGradientFilter.CONIC).toBe(2);
    });
  });
}); 