/**
 * ColorReplaceFilter Unit Tests
 * 
 * Tests the ColorReplaceFilter wrapper class behavior with mocked dependencies.
 * Focuses on color replacement properties, tolerance scaling, and intensity mapping.
 * 
 * @module ColorReplaceFilterUnitTests
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock pixi-filters ColorReplaceFilter before imports
vi.mock('pixi-filters', () => ({
  ColorReplaceFilter: vi.fn().mockImplementation(function(this: any, options?: any) {
    // Mock implementation of PIXI ColorReplaceFilter
    this.originalColor = options?.originalColor ?? 0xff0000;
    this.targetColor = options?.targetColor ?? 0x000000;
    this.tolerance = options?.tolerance ?? 0.4;
    this.enabled = true;
    
    this.destroy = vi.fn();
    return this;
  })
}));

// Mock pixi.js Filter
vi.mock('pixi.js', () => ({
  Filter: vi.fn().mockImplementation(function(this: any) {
    this.enabled = true;
    this.destroy = vi.fn();
    return this;
  })
}));

import { ColorReplaceFilter, type ColorReplaceFilterConfig } from '../../../filters/ColorReplaceFilter';
import { createFilterIntensity } from '../../../types/filters';

describe('ColorReplaceFilter Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Construction & Basic Properties', () => {
    it('should create filter with default configuration', () => {
      const config: ColorReplaceFilterConfig = {
        type: 'colorReplace',
        enabled: true
      };

      const filter = new ColorReplaceFilter(config);
      const state = filter.getState();

      expect(state.enabled).toBe(true);
      expect(state.originalColor).toBe(0xff0000); // Default red
      expect(state.targetColor).toBe(0x000000);   // Default black
      expect(state.tolerance).toBe(0.4);          // Default tolerance
    });

    it('should create filter with custom colors and tolerance', () => {
      const config: ColorReplaceFilterConfig = {
        type: 'colorReplace',
        enabled: true,
        originalColor: 0x00ff00,  // Green
        targetColor: 0x0000ff,   // Blue
        tolerance: 0.2
      };

      const filter = new ColorReplaceFilter(config);
      const state = filter.getState();

      expect(state.configuredOriginalColor).toBe(0x00ff00);
      expect(state.configuredTargetColor).toBe(0x0000ff);
      expect(state.configuredTolerance).toBe(0.2);
      expect(state.originalColor).toBe(0x00ff00);
      expect(state.targetColor).toBe(0x0000ff);
      expect(state.tolerance).toBe(0.2);
    });

    it('should handle partial configuration with defaults', () => {
      const config: ColorReplaceFilterConfig = {
        type: 'colorReplace',
        enabled: true,
        originalColor: 0xffff00  // Yellow
      };

      const filter = new ColorReplaceFilter(config);
      const state = filter.getState();

      expect(state.configuredOriginalColor).toBe(0xffff00);
      expect(state.configuredTargetColor).toBeUndefined();
      expect(state.configuredTolerance).toBeUndefined();
      expect(state.originalColor).toBe(0xffff00);
      expect(state.targetColor).toBe(0x000000);   // Default
      expect(state.tolerance).toBe(0.4);          // Default
    });

    it('should handle intensity with tolerance configuration', () => {
      const config: ColorReplaceFilterConfig = {
        type: 'colorReplace',
        enabled: true,
        tolerance: 0.5,
        intensity: 6
      };

      const filter = new ColorReplaceFilter(config);
      const state = filter.getState();

      expect(state.configuredTolerance).toBe(0.5);
      // Intensity 6: toleranceScale = 1 - (6/10) = 0.4
      // Expected tolerance = 0.5 * (0.1 + 0.4 * 0.9) = 0.5 * 0.46 = 0.23
      expect(state.tolerance).toBeCloseTo(0.23, 2);
    });
  });

  describe('Intensity Updates - Tolerance Scaling', () => {
    it('should scale tolerance correctly with intensity (default primaryProperty)', () => {
      const config: ColorReplaceFilterConfig = {
        type: 'colorReplace',
        enabled: true,
        tolerance: 0.4
      };

      const filter = new ColorReplaceFilter(config);

      // Test various intensity levels
      filter.updateIntensity(createFilterIntensity(0));
      let state = filter.getState();
      // toleranceScale = 1 - (0/10) = 1
      // Expected = 0.4 * (0.1 + 1 * 0.9) = 0.4 * 1.0 = 0.4
      expect(state.tolerance).toBeCloseTo(0.4, 3);

      filter.updateIntensity(createFilterIntensity(5));
      state = filter.getState();
      // toleranceScale = 1 - (5/10) = 0.5
      // Expected = 0.4 * (0.1 + 0.5 * 0.9) = 0.4 * 0.55 = 0.22
      expect(state.tolerance).toBeCloseTo(0.22, 3);

      filter.updateIntensity(createFilterIntensity(10));
      state = filter.getState();
      // toleranceScale = 1 - (10/10) = 0
      // Expected = 0.4 * (0.1 + 0 * 0.9) = 0.4 * 0.1 = 0.04
      expect(state.tolerance).toBeCloseTo(0.04, 3);
    });

    it('should use tolerance as primaryProperty when explicitly set', () => {
      const config: ColorReplaceFilterConfig = {
        type: 'colorReplace',
        enabled: true,
        tolerance: 0.6,
        primaryProperty: 'tolerance'
      };

      const filter = new ColorReplaceFilter(config);

      filter.updateIntensity(createFilterIntensity(3));
      const state = filter.getState();

      // toleranceScale = 1 - (3/10) = 0.7
      // Expected = 0.6 * (0.1 + 0.7 * 0.9) = 0.6 * 0.73 = 0.438
      expect(state.tolerance).toBeCloseTo(0.438, 3);
    });

    it('should fall back to tolerance when primaryProperty is color-based', () => {
      const config: ColorReplaceFilterConfig = {
        type: 'colorReplace',
        enabled: true,
        tolerance: 0.3,
        primaryProperty: 'originalColor'
      };

      const filter = new ColorReplaceFilter(config);

      filter.updateIntensity(createFilterIntensity(7));
      const state = filter.getState();

      // Should fall back to tolerance scaling since color intensity is complex
      // toleranceScale = 1 - (7/10) = 0.3
      // Expected = 0.3 * (0.1 + 0.3 * 0.9) = 0.3 * 0.37 = 0.111
      expect(state.tolerance).toBeCloseTo(0.111, 3);
    });

    it('should handle zero intensity gracefully', () => {
      const config: ColorReplaceFilterConfig = {
        type: 'colorReplace',
        enabled: true,
        tolerance: 0.5
      };

      const filter = new ColorReplaceFilter(config);

      filter.updateIntensity(createFilterIntensity(0));
      const state = filter.getState();

      // Should maintain configured tolerance when intensity is 0
      expect(state.tolerance).toBeCloseTo(0.5, 3);
    });

    it('should respect minimum tolerance threshold', () => {
      const config: ColorReplaceFilterConfig = {
        type: 'colorReplace',
        enabled: true,
        tolerance: 0.1  // Very low tolerance
      };

      const filter = new ColorReplaceFilter(config);

      filter.updateIntensity(createFilterIntensity(10));
      const state = filter.getState();

      // Even at max intensity, should maintain minimum 10% of original
      // Expected = 0.1 * (0.1 + 0 * 0.9) = 0.1 * 0.1 = 0.01
      expect(state.tolerance).toBeCloseTo(0.01, 3);
      expect(state.tolerance).toBeGreaterThan(0);
    });
  });

  describe('Filter Reset Functionality', () => {
    it('should reset to original configuration values', () => {
      const config: ColorReplaceFilterConfig = {
        type: 'colorReplace',
        enabled: true,
        originalColor: 0xff00ff,  // Magenta
        targetColor: 0x00ffff,   // Cyan
        tolerance: 0.3
      };

      const filter = new ColorReplaceFilter(config);

      // Modify the filter
      filter.updateIntensity(createFilterIntensity(8));
      let state = filter.getState();
      expect(state.tolerance).not.toBeCloseTo(0.3, 3);

      // Reset should restore original values
      filter.reset();
      state = filter.getState();

      expect(state.originalColor).toBe(0xff00ff);
      expect(state.targetColor).toBe(0x00ffff);
      expect(state.tolerance).toBe(0.3);
    });

    it('should reset to defaults when no values configured', () => {
      const config: ColorReplaceFilterConfig = {
        type: 'colorReplace',
        enabled: true
      };

      const filter = new ColorReplaceFilter(config);

      // Modify the filter
      filter.updateIntensity(createFilterIntensity(5));

      // Reset should restore defaults
      filter.reset();
      const state = filter.getState();

      expect(state.originalColor).toBe(0xff0000);  // Default red
      expect(state.targetColor).toBe(0x000000);   // Default black
      expect(state.tolerance).toBe(0.4);          // Default tolerance
    });

    it('should reapply intensity after reset if configured', () => {
      const config: ColorReplaceFilterConfig = {
        type: 'colorReplace',
        enabled: true,
        tolerance: 0.5,
        intensity: 4
      };

      const filter = new ColorReplaceFilter(config);

      // Change intensity
      filter.updateIntensity(createFilterIntensity(8));

      // Reset should restore original config including intensity
      filter.reset();
      const state = filter.getState();

      // Should have original tolerance with original intensity applied
      // toleranceScale = 1 - (4/10) = 0.6
      // Expected = 0.5 * (0.1 + 0.6 * 0.9) = 0.5 * 0.64 = 0.32
      expect(state.tolerance).toBeCloseTo(0.32, 3);
    });
  });

  describe('State Management', () => {
    it('should return comprehensive state information', () => {
      const config: ColorReplaceFilterConfig = {
        type: 'colorReplace',
        enabled: true,
        originalColor: 0x123456,
        targetColor: 0x789abc,
        tolerance: 0.25,
        intensity: 3
      };

      const filter = new ColorReplaceFilter(config);
      const state = filter.getState();

      // Should include base filter state
      expect(state.type).toBe('colorReplace');
      expect(state.enabled).toBe(true);

      // Should include current filter values
      expect(state.originalColor).toBe(0x123456);
      expect(state.targetColor).toBe(0x789abc);

      // Should include configured values for comparison
      expect(state.configuredOriginalColor).toBe(0x123456);
      expect(state.configuredTargetColor).toBe(0x789abc);
      expect(state.configuredTolerance).toBe(0.25);
    });

    it('should show difference between configured and current values', () => {
      const config: ColorReplaceFilterConfig = {
        type: 'colorReplace',
        enabled: true,
        tolerance: 0.6
      };

      const filter = new ColorReplaceFilter(config);

      // Apply intensity to change current values
      filter.updateIntensity(createFilterIntensity(7));
      const state = filter.getState();

      expect(state.configuredTolerance).toBe(0.6);
      expect(state.tolerance).not.toBe(0.6);  // Should be modified by intensity
      expect(state.tolerance).toBeCloseTo(0.222, 3);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid intensity values', () => {
      const config: ColorReplaceFilterConfig = {
        type: 'colorReplace',
        enabled: true
      };

      const _filter = new ColorReplaceFilter(config);

      // createFilterIntensity should throw for invalid values
      expect(() => createFilterIntensity(-1)).toThrow();
      expect(() => createFilterIntensity(11)).toThrow();
      expect(() => createFilterIntensity(NaN)).toThrow();
      expect(() => createFilterIntensity(Infinity)).toThrow();
    });

    it('should handle edge case tolerance values', () => {
      const config: ColorReplaceFilterConfig = {
        type: 'colorReplace',
        enabled: true,
        tolerance: 0
      };

      const filter = new ColorReplaceFilter(config);

      // Even with 0 tolerance, intensity scaling should work
      filter.updateIntensity(createFilterIntensity(5));
      const state = filter.getState();

      expect(state.tolerance).toBe(0);  // 0 * anything = 0
    });
  });

  describe('Performance & Resource Management', () => {
    it('should dispose of resources properly', () => {
      const config: ColorReplaceFilterConfig = {
        type: 'colorReplace',
        enabled: true
      };

      const filter = new ColorReplaceFilter(config);
      
      // Dispose should not throw
      expect(() => filter.dispose()).not.toThrow();
    });

    it('should handle multiple intensity updates efficiently', () => {
      const config: ColorReplaceFilterConfig = {
        type: 'colorReplace',
        enabled: true,
        tolerance: 0.5
      };

      const filter = new ColorReplaceFilter(config);
      const startTime = performance.now();

      // Multiple rapid updates should be fast
      for (let i = 0; i <= 10; i++) {
        filter.updateIntensity(createFilterIntensity(i));
      }

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(10); // Should be very fast

      // Final state should be correct
      const state = filter.getState();
      expect(state.tolerance).toBeCloseTo(0.05, 3); // Max intensity applied
    });
  });

  describe('Configuration Validation', () => {
    it('should work with minimal configuration', () => {
      const config: ColorReplaceFilterConfig = {
        type: 'colorReplace',
        enabled: false
      };

      expect(() => new ColorReplaceFilter(config)).not.toThrow();
      
      const filter = new ColorReplaceFilter(config);
      const state = filter.getState();
      
      expect(state.enabled).toBe(false);
      expect(state.originalColor).toBe(0xff0000);  // Default
      expect(state.targetColor).toBe(0x000000);   // Default
      expect(state.tolerance).toBe(0.4);          // Default
    });

    it('should handle different primaryProperty values', () => {
      const configs = [
        { primaryProperty: 'tolerance' as const },
        { primaryProperty: 'originalColor' as const },
        { primaryProperty: 'targetColor' as const }
      ];

      configs.forEach(({ primaryProperty }) => {
        const config: ColorReplaceFilterConfig = {
          type: 'colorReplace',
          enabled: true,
          tolerance: 0.3,
          primaryProperty
        };

        expect(() => new ColorReplaceFilter(config)).not.toThrow();
      });
    });
  });
}); 