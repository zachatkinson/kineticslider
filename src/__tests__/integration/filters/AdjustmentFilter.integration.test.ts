/**
 * AdjustmentFilter Integration Tests
 * 
 * Tests AdjustmentFilter with real PIXI.js filters to ensure proper integration.
 * Validates actual PIXI filter behavior, property setting, and API compliance.
 * 
 * @module AdjustmentFilterIntegrationTests
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach as _beforeEach } from 'vitest';
import { AdjustmentFilter } from 'pixi-filters';
import { createFilter } from '../../../filters/AdjustmentFilter';
import type { AdjustmentFilterConfig } from '../../../types/filters';
import { createFilterIntensity } from '../../../types/filters';

describe('AdjustmentFilter Integration Tests', () => {
  describe('PIXI Filter Creation & Properties', () => {
    it('should create actual PIXI AdjustmentFilter instance', () => {
      const config: AdjustmentFilterConfig = {
        type: 'adjustment',
        enabled: true,
        intensity: createFilterIntensity(5)
      };

      const result = createFilter(config);
      const pixiFilter = result.filter as AdjustmentFilter;

      expect(pixiFilter).toBeInstanceOf(AdjustmentFilter);
      expect(pixiFilter.enabled).toBe(true);
    });

    it('should initialize PIXI filter with configured adjustment properties', () => {
      const config: AdjustmentFilterConfig = {
        type: 'adjustment',
        enabled: true,
        intensity: createFilterIntensity(6),
        gamma: 1.2,
        saturation: 1.4,
        contrast: 1.1,
        brightness: 0.9,
        red: 1.1,
        green: 0.8,
        blue: 1.0,
        alpha: 0.85
      };

      const result = createFilter(config);
      const pixiFilter = result.filter as AdjustmentFilter;

      expect(pixiFilter.gamma).toBe(1.2);
      expect(pixiFilter.saturation).toBe(1.4);
      expect(pixiFilter.contrast).toBe(1.1);
      expect(pixiFilter.brightness).toBe(0.9);
      expect(pixiFilter.red).toBe(1.1);
      expect(pixiFilter.green).toBe(0.8);
      expect(pixiFilter.blue).toBe(1.0);
      expect(pixiFilter.alpha).toBe(0.85);
    });

    it('should use default values when properties not specified', () => {
      const config: AdjustmentFilterConfig = {
        type: 'adjustment',
        enabled: true,
        intensity: createFilterIntensity(5)
      };

      const result = createFilter(config);
      const pixiFilter = result.filter as AdjustmentFilter;

      // Should use PIXI default values
      expect(pixiFilter.gamma).toBe(1);
      expect(pixiFilter.saturation).toBe(1);
      expect(pixiFilter.contrast).toBe(1);
      expect(pixiFilter.brightness).toBe(1);
      expect(pixiFilter.red).toBe(1);
      expect(pixiFilter.green).toBe(1);
      expect(pixiFilter.blue).toBe(1);
      expect(pixiFilter.alpha).toBe(1);
    });

    it('should handle partial property configuration correctly', () => {
      const config: AdjustmentFilterConfig = {
        type: 'adjustment',
        enabled: true,
        intensity: createFilterIntensity(5),
        gamma: 1.3,
        saturation: 1.2
        // Other properties should use defaults
      };

      const result = createFilter(config);
      const pixiFilter = result.filter as AdjustmentFilter;

      expect(pixiFilter.gamma).toBe(1.3);
      expect(pixiFilter.saturation).toBe(1.2);
      expect(pixiFilter.contrast).toBe(1); // Default
      expect(pixiFilter.brightness).toBe(1); // Default
      expect(pixiFilter.red).toBe(1); // Default
    });
  });

  describe('Real Intensity Scaling', () => {
    it('should apply default intensity scaling to brightness and contrast', () => {
      const config: AdjustmentFilterConfig = {
        type: 'adjustment',
        enabled: true,
        intensity: createFilterIntensity(0)
      };

      const result = createFilter(config);
      const pixiFilter = result.filter as AdjustmentFilter;

      // Test different intensity levels
      result.updateIntensity(createFilterIntensity(0));
      expect(pixiFilter.brightness).toBe(0.5); // 0.5 + (0/10)
      expect(pixiFilter.contrast).toBe(0.5);

      result.updateIntensity(createFilterIntensity(5));
      expect(pixiFilter.brightness).toBe(1.0); // 0.5 + (5/10)
      expect(pixiFilter.contrast).toBe(1.0);

      result.updateIntensity(createFilterIntensity(10));
      expect(pixiFilter.brightness).toBe(1.5); // 0.5 + (10/10)
      expect(pixiFilter.contrast).toBe(1.5);
    });

    it('should apply intensity scaling to primary property when specified', () => {
      const config: AdjustmentFilterConfig = {
        type: 'adjustment',
        enabled: true,
        intensity: createFilterIntensity(0),
        primaryProperty: 'gamma'
      };

      const result = createFilter(config);
      const pixiFilter = result.filter as AdjustmentFilter;

      // Test gamma-specific intensity scaling
      result.updateIntensity(createFilterIntensity(0));
      expect(pixiFilter.gamma).toBe(0.5);

      result.updateIntensity(createFilterIntensity(4));
      expect(pixiFilter.gamma).toBe(0.9); // 0.5 + (4/10)

      result.updateIntensity(createFilterIntensity(8));
      expect(pixiFilter.gamma).toBe(1.3); // 0.5 + (8/10)
    });

    it('should handle all primary property types correctly', () => {
      const primaryProperties = ['gamma', 'saturation', 'contrast', 'brightness'] as const;
      
      primaryProperties.forEach(primaryProperty => {
        const config: AdjustmentFilterConfig = {
          type: 'adjustment',
          enabled: true,
          intensity: createFilterIntensity(0),
          primaryProperty
        };

        const result = createFilter(config);
        const pixiFilter = result.filter as AdjustmentFilter;

        result.updateIntensity(createFilterIntensity(6));
        expect(pixiFilter[primaryProperty]).toBe(1.1); // 0.5 + (6/10)
      });
    });
  });

  describe('PIXI Filter Reset Behavior', () => {
    it('should reset PIXI filter properties to configured values', () => {
      const config: AdjustmentFilterConfig = {
        type: 'adjustment',
        enabled: true,
        intensity: createFilterIntensity(5),
        gamma: 1.2,
        saturation: 1.3,
        contrast: 1.1,
        brightness: 0.9
      };

      const result = createFilter(config);
      const pixiFilter = result.filter as AdjustmentFilter;

      // Modify with intensity (affects brightness/contrast by default)
      result.updateIntensity(createFilterIntensity(8));
      
      // Reset should restore configured values
      result.reset();
      
      expect(pixiFilter.gamma).toBe(1.2);
      expect(pixiFilter.saturation).toBe(1.3);
      expect(pixiFilter.contrast).toBe(1.1);
      expect(pixiFilter.brightness).toBe(0.9);
    });

    it('should reset to defaults when no configuration provided', () => {
      const config: AdjustmentFilterConfig = {
        type: 'adjustment',
        enabled: true,
        intensity: createFilterIntensity(5)
      };

      const result = createFilter(config);
      const pixiFilter = result.filter as AdjustmentFilter;

      // Modify with intensity
      result.updateIntensity(createFilterIntensity(7));
      
      // Reset should restore defaults
      result.reset();
      
      expect(pixiFilter.gamma).toBe(1);
      expect(pixiFilter.saturation).toBe(1);
      expect(pixiFilter.contrast).toBe(1);
      expect(pixiFilter.brightness).toBe(1);
      expect(pixiFilter.red).toBe(1);
      expect(pixiFilter.green).toBe(1);
      expect(pixiFilter.blue).toBe(1);
      expect(pixiFilter.alpha).toBe(1);
    });
  });

  describe('PIXI API Compliance', () => {
    it('should maintain enabled state correctly', () => {
      const config: AdjustmentFilterConfig = {
        type: 'adjustment',
        enabled: true,
        intensity: createFilterIntensity(5)
      };

      const result = createFilter(config);
      const pixiFilter = result.filter as AdjustmentFilter;

      expect(pixiFilter.enabled).toBe(true);

      // Ensure enabled state persists through operations
      result.updateIntensity(createFilterIntensity(8));
      expect(pixiFilter.enabled).toBe(true);

      result.reset();
      expect(pixiFilter.enabled).toBe(true);
    });

    it('should have correct PIXI filter properties', () => {
      const config: AdjustmentFilterConfig = {
        type: 'adjustment',
        enabled: true,
        intensity: createFilterIntensity(5)
      };

      const result = createFilter(config);
      const pixiFilter = result.filter as AdjustmentFilter;

      // Check that essential PIXI filter properties exist
      expect(pixiFilter).toHaveProperty('gamma');
      expect(pixiFilter).toHaveProperty('saturation');
      expect(pixiFilter).toHaveProperty('contrast');
      expect(pixiFilter).toHaveProperty('brightness');
      expect(pixiFilter).toHaveProperty('red');
      expect(pixiFilter).toHaveProperty('green');
      expect(pixiFilter).toHaveProperty('blue');
      expect(pixiFilter).toHaveProperty('alpha');
      expect(pixiFilter).toHaveProperty('enabled');
    });

    it('should support PIXI filter chaining', () => {
      const config: AdjustmentFilterConfig = {
        type: 'adjustment',
        enabled: true,
        intensity: createFilterIntensity(5),
        gamma: 1.1
      };

      const result = createFilter(config);
      const pixiFilter = result.filter as AdjustmentFilter;

      // PIXI filters should be chainable (have required properties for filter system)
      expect(pixiFilter).toHaveProperty('apply');
      expect(typeof pixiFilter.apply).toBe('function');
    });

    it('should handle property validation within PIXI acceptable ranges', () => {
      const config: AdjustmentFilterConfig = {
        type: 'adjustment',
        enabled: true,
        intensity: createFilterIntensity(5),
        primaryProperty: 'gamma'
      };

      const result = createFilter(config);
      const pixiFilter = result.filter as AdjustmentFilter;

      // Test extreme values
      result.updateIntensity(createFilterIntensity(0));
      expect(pixiFilter.gamma).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(pixiFilter.gamma)).toBe(true);

      result.updateIntensity(createFilterIntensity(10));
      expect(pixiFilter.gamma).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(pixiFilter.gamma)).toBe(true);
    });
  });

  describe('Edge Cases & Error Handling', () => {
    it('should handle extreme intensity values without breaking PIXI', () => {
      const config: AdjustmentFilterConfig = {
        type: 'adjustment',
        enabled: true,
        intensity: createFilterIntensity(0),
        primaryProperty: 'saturation'
      };

      const result = createFilter(config);
      const pixiFilter = result.filter as AdjustmentFilter;

      // Should not throw errors with extreme values
      expect(() => result.updateIntensity(createFilterIntensity(0))).not.toThrow();
      expect(() => result.updateIntensity(createFilterIntensity(10))).not.toThrow();
      
      // Values should remain reasonable and finite
      result.updateIntensity(createFilterIntensity(10));
      expect(Number.isFinite(pixiFilter.saturation)).toBe(true);
      expect(pixiFilter.saturation).toBeGreaterThanOrEqual(0);
    });

    it('should handle unknown primary property gracefully', () => {
      const config: AdjustmentFilterConfig = {
        type: 'adjustment',
        enabled: true,
        intensity: createFilterIntensity(5),
        primaryProperty: 'nonexistent' as any
      };

      const result = createFilter(config);
      const pixiFilter = result.filter as AdjustmentFilter;

      // Should not throw and should fall back to default behavior (brightness)
      expect(() => result.updateIntensity(createFilterIntensity(6))).not.toThrow();
      expect(pixiFilter.brightness).toBe(1.1); // 0.5 + (6/10)
    });
  });

  describe('Memory Management', () => {
    it('should properly dispose of PIXI filter resources', () => {
      const config: AdjustmentFilterConfig = {
        type: 'adjustment',
        enabled: true,
        intensity: createFilterIntensity(5),
        gamma: 1.2
      };

      const result = createFilter(config);
      const pixiFilter = result.filter as AdjustmentFilter;

      // Should have destroy method for cleanup
      expect(pixiFilter).toHaveProperty('destroy');
      expect(typeof pixiFilter.destroy).toBe('function');

      // Dispose should not throw
      expect(() => result.dispose()).not.toThrow();
    });
  });
}); 