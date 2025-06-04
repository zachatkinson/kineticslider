import { describe, it, expect, beforeEach } from 'vitest';
import { BlurFilter } from '../../../filters/BlurFilter';
import type { BlurFilterConfig } from '../../../types/filters';
import { createFilterIntensity } from '../../../types/filters';
import { BlurFilter as PixiBlurFilter } from 'pixi.js';

/**
 * Integration Tests for BlurFilter
 * 
 * These tests use REAL PIXI.js filters (no mocks) to verify:
 * - Actual PIXI filter creation and behavior
 * - Property setting and getting
 * - Real intensity scaling effects
 * - PIXI API compliance
 */

describe('BlurFilter Integration', () => {
  beforeEach(() => {
    // No mocks - using real PIXI.js
  });

  describe('PIXI Filter Creation & Properties', () => {
    it('should create real PIXI BlurFilter with correct default properties', () => {
      const config: BlurFilterConfig = {
        type: 'blur',
        enabled: true,
        intensity: createFilterIntensity(5),
      };

      const filter = new BlurFilter(config);
      const _pixiFilter = filter.filter as PixiBlurFilter;

      // Verify it's actually a PIXI BlurFilter
      expect(_pixiFilter).toBeInstanceOf(PixiBlurFilter);
      
      // Test real PIXI default values
      expect(_pixiFilter.quality).toBe(4);
      expect(_pixiFilter.repeatEdgePixels).toBe(false);
    });

    it('should set all PIXI properties correctly from configuration', () => {
      const config: BlurFilterConfig = {
        type: 'blur',
        enabled: true,
        intensity: createFilterIntensity(7),
        strengthX: 12,
        strengthY: 8,
        quality: 6,
        resolution: 2,
        repeatEdgePixels: true,
      };

      const filter = new BlurFilter(config);
      const _pixiFilter = filter.filter as PixiBlurFilter;

      // Verify PIXI actually received and set the properties
      expect(_pixiFilter.quality).toBe(6);
      expect(_pixiFilter.resolution).toBe(2);
      expect(_pixiFilter.repeatEdgePixels).toBe(true);
    });

    it('should handle PIXI repeatEdgePixels option', () => {
      const config: BlurFilterConfig = {
        type: 'blur',
        enabled: true,
        intensity: createFilterIntensity(5),
        repeatEdgePixels: true, // Valid PIXI option
      };

      expect(() => new BlurFilter(config)).not.toThrow();
      
      const filter = new BlurFilter(config);
      const _pixiFilter = filter.filter as PixiBlurFilter;
      expect(_pixiFilter.repeatEdgePixels).toBe(true);
    });

    it('should handle PIXI BlurFilter constructor parameters correctly', () => {
      const config: BlurFilterConfig = {
        type: 'blur',
        enabled: true,
        intensity: createFilterIntensity(0),
        strengthX: 15,
        strengthY: 10,
        quality: 8,
      };

      const filter = new BlurFilter(config);
      const _pixiFilter = filter.filter as PixiBlurFilter;

      // PIXI should accept and store the constructor values
      expect(_pixiFilter.strengthX).toBe(15);
      expect(_pixiFilter.strengthY).toBe(10);
      expect(_pixiFilter.quality).toBe(8);
    });
  });

  describe('Real Intensity Scaling', () => {
    it('should actually modify PIXI filter strength properties', () => {
      const config: BlurFilterConfig = {
        type: 'blur',
        enabled: true,
        intensity: createFilterIntensity(0),
        strengthX: 10,
        strengthY: 5,
      };

      const filter = new BlurFilter(config);
      const _pixiFilter = filter.filter as PixiBlurFilter;

      // Record initial values
      const initialStrengthX = _pixiFilter.strengthX;
      const initialStrengthY = _pixiFilter.strengthY;

      // Apply intensity
      filter.updateIntensity(createFilterIntensity(8));

      // Verify real PIXI properties changed
      expect(_pixiFilter.strengthX).toBeGreaterThan(initialStrengthX);
      expect(_pixiFilter.strengthY).toBeGreaterThan(initialStrengthY);
      expect(_pixiFilter.strengthX).toBeGreaterThan(10);
      expect(_pixiFilter.strengthY).toBeGreaterThan(5);
    });

    it('should scale overall strength when no individual strengths configured', () => {
      const config: BlurFilterConfig = {
        type: 'blur',
        enabled: true,
        intensity: createFilterIntensity(0),
      };

      const filter = new BlurFilter(config);
      const _pixiFilter = filter.filter as PixiBlurFilter;

      const initialStrength = _pixiFilter.strength;

      filter.updateIntensity(createFilterIntensity(6));

      expect(_pixiFilter.strength).toBeGreaterThan(initialStrength);
      expect(_pixiFilter.strength).toBeGreaterThan(8); // Base strength
    });

    it('should produce predictable intensity scaling values', () => {
      const config: BlurFilterConfig = {
        type: 'blur',
        enabled: true,
        intensity: createFilterIntensity(0),
        strengthX: 20,
      };

      const filter = new BlurFilter(config);
      const _pixiFilter = filter.filter as PixiBlurFilter;

      // Test specific intensity values
      filter.updateIntensity(createFilterIntensity(0));
      const strength0 = _pixiFilter.strengthX;

      filter.updateIntensity(createFilterIntensity(5));
      const strength5 = _pixiFilter.strengthX;

      filter.updateIntensity(createFilterIntensity(10));
      const strength10 = _pixiFilter.strengthX;

      // Verify scaling behavior
      expect(strength0).toBe(20); // Base value
      expect(strength5).toBeGreaterThan(strength0);
      expect(strength10).toBeGreaterThan(strength5);
      
      // Test mathematical relationship (intensity adds 50% per point)
      const expectedStrength5 = 20 + (5 * (20 * 0.5));
      expect(strength5).toBeCloseTo(expectedStrength5, 1);
    });
  });

  describe('PIXI Filter Reset Behavior', () => {
    it('should restore original PIXI properties on reset', () => {
      const config: BlurFilterConfig = {
        type: 'blur',
        enabled: true,
        intensity: createFilterIntensity(6),
        strengthX: 15,
        strengthY: 12,
      };

      const filter = new BlurFilter(config);
      const _pixiFilter = filter.filter as PixiBlurFilter;

      // Modify values
      filter.updateIntensity(createFilterIntensity(2));
      const modifiedStrengthX = _pixiFilter.strengthX;

      // Reset should restore and reapply original intensity
      filter.reset();

      expect(_pixiFilter.strengthX).not.toBe(modifiedStrengthX);
      expect(_pixiFilter.strengthX).toBeGreaterThan(15); // Should reapply intensity 6
    });

    it('should reset to PIXI defaults when no configuration provided', () => {
      const config: BlurFilterConfig = {
        type: 'blur',
        enabled: true,
        intensity: createFilterIntensity(3),
      };

      const filter = new BlurFilter(config);
      const _pixiFilter = filter.filter as PixiBlurFilter;

      // Modify values
      filter.updateIntensity(createFilterIntensity(9));

      // Reset should restore PIXI defaults
      filter.reset();

      expect(_pixiFilter.strength).toBe(8);
      expect(_pixiFilter.strengthX).toBe(8);
      expect(_pixiFilter.strengthY).toBe(8);
    });
  });

  describe('PIXI API Compliance', () => {
    it('should expose standard PIXI Filter properties', () => {
      const config: BlurFilterConfig = {
        type: 'blur',
        enabled: true,
        intensity: createFilterIntensity(5),
      };

      const filter = new BlurFilter(config);
      const _pixiFilter = filter.filter;

      // Standard PIXI Filter properties should exist
      expect(_pixiFilter).toHaveProperty('enabled');
      expect(_pixiFilter).toHaveProperty('blendMode');
      expect(_pixiFilter).toHaveProperty('padding');
      expect(typeof _pixiFilter.destroy).toBe('function');
    });

    it('should maintain PIXI BlurFilter specific properties', () => {
      const config: BlurFilterConfig = {
        type: 'blur',
        enabled: true,
        intensity: createFilterIntensity(5),
      };

      const filter = new BlurFilter(config);
      const _pixiFilter = filter.filter as PixiBlurFilter;

      // BlurFilter-specific properties
      expect(_pixiFilter).toHaveProperty('strength');
      expect(_pixiFilter).toHaveProperty('strengthX');
      expect(_pixiFilter).toHaveProperty('strengthY');
      expect(_pixiFilter).toHaveProperty('blur');
      expect(_pixiFilter).toHaveProperty('blurX');
      expect(_pixiFilter).toHaveProperty('blurY');
      expect(_pixiFilter).toHaveProperty('quality');
      expect(_pixiFilter).toHaveProperty('repeatEdgePixels');
    });

    it('should support PIXI property modification after creation', () => {
      const config: BlurFilterConfig = {
        type: 'blur',
        enabled: true,
        intensity: createFilterIntensity(5),
      };

      const filter = new BlurFilter(config);
      const _pixiFilter = filter.filter as PixiBlurFilter;

      // Should allow direct PIXI property modification
      _pixiFilter.padding = 10;
      _pixiFilter.enabled = false;

      expect(_pixiFilter.padding).toBe(10);
      expect(_pixiFilter.enabled).toBe(false);
    });

    it('should handle PIXI quality settings', () => {
      const config: BlurFilterConfig = {
        type: 'blur',
        enabled: true,
        intensity: createFilterIntensity(5),
        quality: 8, // Valid PIXI quality value
      };

      expect(() => new BlurFilter(config)).not.toThrow();
      
      const filter = new BlurFilter(config);
      const _pixiFilter = filter.filter as PixiBlurFilter;
      expect(_pixiFilter.quality).toBe(8);
    });

    it('should handle PIXI resolution settings', () => {
      const config: BlurFilterConfig = {
        type: 'blur',
        enabled: true,
        intensity: createFilterIntensity(5),
        resolution: 2, // Valid PIXI resolution value
      };

      expect(() => new BlurFilter(config)).not.toThrow();
      
      const filter = new BlurFilter(config);
      const _pixiFilter = filter.filter as PixiBlurFilter;
      expect(_pixiFilter.resolution).toBe(2);
    });
  });

  describe('Edge Cases & Error Handling', () => {
    it('should handle extreme intensity values without breaking PIXI', () => {
      const config: BlurFilterConfig = {
        type: 'blur',
        enabled: true,
        intensity: createFilterIntensity(0),
        strengthX: 1,
      };

      const filter = new BlurFilter(config);
      const _pixiFilter = filter.filter as PixiBlurFilter;

      // Should not throw errors with extreme values
      expect(() => filter.updateIntensity(createFilterIntensity(0))).not.toThrow();
      expect(() => filter.updateIntensity(createFilterIntensity(10))).not.toThrow();
      
      // Values should remain reasonable
      filter.updateIntensity(createFilterIntensity(10));
      expect(Number.isFinite(_pixiFilter.strengthX)).toBe(true);
      expect(_pixiFilter.strengthX).toBeGreaterThan(0);
    });
  });

  describe('Memory Management', () => {
    it('should properly dispose PIXI filter resources', () => {
      const config: BlurFilterConfig = {
        type: 'blur',
        enabled: true,
        intensity: createFilterIntensity(5),
      };

      const filter = new BlurFilter(config);
      const _pixiFilter = filter.filter;

      // Should not throw when disposing
      expect(() => filter.dispose()).not.toThrow();
      
      // Note: We can't easily test that PIXI actually cleaned up resources
      // without deeper inspection, but we ensure no errors occur
    });
  });
}); 