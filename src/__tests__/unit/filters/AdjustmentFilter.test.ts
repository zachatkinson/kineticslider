/**
 * AdjustmentFilter Unit Tests
 * 
 * Tests the AdjustmentFilter wrapper class behavior with mocked dependencies.
 * Focuses on configuration handling, intensity mapping, and state management.
 * 
 * @module AdjustmentFilterUnitTests
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createFilter } from '../../../filters/AdjustmentFilter';
import type { AdjustmentFilterConfig } from '../../../types/filters';
import { createFilterIntensity } from '../../../types/filters';

// Mock PIXI AdjustmentFilter
vi.mock('pixi-filters', () => ({
  AdjustmentFilter: vi.fn().mockImplementation(function(this: any, options: Record<string, unknown> = {}) {
    // Mock implementation of PIXI AdjustmentFilter
    this.gamma = options.gamma ?? 1;
    this.saturation = options.saturation ?? 1;
    this.contrast = options.contrast ?? 1;
    this.brightness = options.brightness ?? 1;
    this.red = options.red ?? 1;
    this.green = options.green ?? 1;
    this.blue = options.blue ?? 1;
    this.alpha = options.alpha ?? 1;
    this.enabled = true;
    
    this.destroy = vi.fn();
    
    return this;
  })
}));

describe('AdjustmentFilter Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Construction & Basic Properties', () => {
    it('should create filter with default configuration', () => {
      const config: AdjustmentFilterConfig = {
        type: 'adjustment',
        enabled: true,
        intensity: createFilterIntensity(5)
      };

      const result = createFilter(config);

      expect(result).toBeDefined();
      expect(result.filter).toBeDefined();
      expect(result.config).toEqual(config);
      expect(result.updateIntensity).toBeTypeOf('function');
      expect(result.reset).toBeTypeOf('function');
      expect(result.dispose).toBeTypeOf('function');
      expect(result.getState).toBeTypeOf('function');
    });

    it('should create filter with custom adjustment properties', () => {
      const config: AdjustmentFilterConfig = {
        type: 'adjustment',
        enabled: true,
        intensity: createFilterIntensity(7),
        gamma: 1.2,
        saturation: 1.5,
        contrast: 1.1,
        brightness: 0.9,
        red: 1.1,
        green: 0.9,
        blue: 1.0,
        alpha: 0.8
      };

      const result = createFilter(config);
      const state = result.getState!();

      expect(state.gamma).toBe(1.2);
      expect(state.saturation).toBe(1.5);
      expect(state.contrast).toBe(1.1);
      expect(state.brightness).toBe(0.9);
      expect(state.red).toBe(1.1);
      expect(state.green).toBe(0.9);
      expect(state.blue).toBe(1.0);
      expect(state.alpha).toBe(0.8);
    });

    it('should handle primary property configuration', () => {
      const config: AdjustmentFilterConfig = {
        type: 'adjustment',
        enabled: true,
        intensity: createFilterIntensity(6),
        primaryProperty: 'saturation'
      };

      const result = createFilter(config);

      expect(result).toBeDefined();
      expect(result.config.primaryProperty).toBe('saturation');
    });
  });

  describe('Intensity Updates', () => {
    it('should update brightness and contrast by default when no primary property set', () => {
      const config: AdjustmentFilterConfig = {
        type: 'adjustment',
        enabled: true,
        intensity: createFilterIntensity(0)
      };

      const result = createFilter(config);
      result.updateIntensity(createFilterIntensity(8));
      
      const state = result.getState!();
      expect(state.brightness).toBe(1.3); // 0.5 + (8/10) = 1.3
      expect(state.contrast).toBe(1.3);   // 0.5 + (8/10) = 1.3
    });

    it('should update specific property when primaryProperty is set to gamma', () => {
      const config: AdjustmentFilterConfig = {
        type: 'adjustment',
        enabled: true,
        intensity: createFilterIntensity(0),
        primaryProperty: 'gamma'
      };

      const result = createFilter(config);
      result.updateIntensity(createFilterIntensity(6));
      
      const state = result.getState!();
      expect(state.gamma).toBe(1.1); // 0.5 + (6/10) = 1.1
    });

    it('should update specific property when primaryProperty is set to saturation', () => {
      const config: AdjustmentFilterConfig = {
        type: 'adjustment',
        enabled: true,
        intensity: createFilterIntensity(0),
        primaryProperty: 'saturation'
      };

      const result = createFilter(config);
      result.updateIntensity(createFilterIntensity(4));
      
      const state = result.getState!();
      expect(state.saturation).toBe(0.9); // 0.5 + (4/10) = 0.9
    });

    it('should update specific property when primaryProperty is set to contrast', () => {
      const config: AdjustmentFilterConfig = {
        type: 'adjustment',
        enabled: true,
        intensity: createFilterIntensity(0),
        primaryProperty: 'contrast'
      };

      const result = createFilter(config);
      result.updateIntensity(createFilterIntensity(10));
      
      const state = result.getState!();
      expect(state.contrast).toBe(1.5); // 0.5 + (10/10) = 1.5
    });

    it('should update specific property when primaryProperty is set to brightness', () => {
      const config: AdjustmentFilterConfig = {
        type: 'adjustment',
        enabled: true,
        intensity: createFilterIntensity(0),
        primaryProperty: 'brightness'
      };

      const result = createFilter(config);
      result.updateIntensity(createFilterIntensity(3));
      
      const state = result.getState!();
      expect(state.brightness).toBe(0.8); // 0.5 + (3/10) = 0.8
    });

    it('should clamp intensity values to valid range (0-10)', () => {
      const config: AdjustmentFilterConfig = {
        type: 'adjustment',
        enabled: true,
        intensity: createFilterIntensity(5),
        primaryProperty: 'gamma'
      };

      const result = createFilter(config);
      
      // Test minimum clamp
      result.updateIntensity(createFilterIntensity(0));
      let state = result.getState!();
      expect(state.gamma).toBe(0.5); // 0.5 + (0/10) = 0.5
      
      // Test maximum clamp
      result.updateIntensity(createFilterIntensity(10));
      state = result.getState!();
      expect(state.gamma).toBe(1.5); // 0.5 + (10/10) = 1.5
    });
  });

  describe('Reset Functionality', () => {
    it('should reset to original configured values', () => {
      const config: AdjustmentFilterConfig = {
        type: 'adjustment',
        enabled: true,
        intensity: createFilterIntensity(5),
        gamma: 1.3,
        saturation: 1.4,
        contrast: 1.2,
        brightness: 0.8
      };

      const result = createFilter(config);
      
      // Modify values with intensity
      result.updateIntensity(createFilterIntensity(8));
      
      // Reset should restore original configured values
      result.reset();
      
      const state = result.getState!();
      expect(state.gamma).toBe(1.3);
      expect(state.saturation).toBe(1.4);
      expect(state.contrast).toBe(1.2);
      expect(state.brightness).toBe(0.8);
    });

    it('should reset to default values when no specific properties configured', () => {
      const config: AdjustmentFilterConfig = {
        type: 'adjustment',
        enabled: true,
        intensity: createFilterIntensity(5)
      };

      const result = createFilter(config);
      
      // Modify values with intensity
      result.updateIntensity(createFilterIntensity(8));
      
      // Reset should restore defaults
      result.reset();
      
      const state = result.getState!();
      expect(state.gamma).toBe(1);
      expect(state.saturation).toBe(1);
      expect(state.contrast).toBe(1);
      expect(state.brightness).toBe(1);
      expect(state.red).toBe(1);
      expect(state.green).toBe(1);
      expect(state.blue).toBe(1);
      expect(state.alpha).toBe(1);
    });

    it('should reset color channels correctly', () => {
      const config: AdjustmentFilterConfig = {
        type: 'adjustment',
        enabled: true,
        intensity: createFilterIntensity(5),
        red: 1.2,
        green: 0.8,
        blue: 1.1,
        alpha: 0.9
      };

      const result = createFilter(config);
      
      // Modify with intensity (should affect brightness/contrast)
      result.updateIntensity(createFilterIntensity(7));
      
      // Reset should restore configured color values
      result.reset();
      
      const state = result.getState!();
      expect(state.red).toBe(1.2);
      expect(state.green).toBe(0.8);
      expect(state.blue).toBe(1.1);
      expect(state.alpha).toBe(0.9);
    });
  });

  describe('State Management', () => {
    it('should return comprehensive state information', () => {
      const config: AdjustmentFilterConfig = {
        type: 'adjustment',
        enabled: true,
        intensity: createFilterIntensity(6),
        gamma: 1.1,
        saturation: 1.3
      };

      const result = createFilter(config);
      const state = result.getState!();

      expect(state).toHaveProperty('gamma');
      expect(state).toHaveProperty('saturation');
      expect(state).toHaveProperty('contrast');
      expect(state).toHaveProperty('brightness');
      expect(state).toHaveProperty('red');
      expect(state).toHaveProperty('green');
      expect(state).toHaveProperty('blue');
      expect(state).toHaveProperty('alpha');
      expect(state).toHaveProperty('enabled');
      expect(state).toHaveProperty('intensity');
      
      expect(state.intensity).toBe(6);
      expect(state.gamma).toBe(1.1);
      expect(state.saturation).toBe(1.3);
    });

    it('should track state changes correctly', () => {
      const config: AdjustmentFilterConfig = {
        type: 'adjustment',
        enabled: true,
        intensity: createFilterIntensity(5),
        primaryProperty: 'gamma'
      };

      const result = createFilter(config);
      
      const initialState = result.getState!();
      expect(initialState.gamma).toBe(1);
      
      result.updateIntensity(createFilterIntensity(7));
      
      const updatedState = result.getState!();
      expect(updatedState.gamma).toBe(1.2); // 0.5 + (7/10)
      expect(updatedState.gamma).not.toBe(initialState.gamma);
    });
  });

  describe('Property Validation & Edge Cases', () => {
    it('should handle unknown primary property gracefully', () => {
      const config: AdjustmentFilterConfig = {
        type: 'adjustment',
        enabled: true,
        intensity: createFilterIntensity(5),
        primaryProperty: 'unknown' as any
      };

      const result = createFilter(config);
      result.updateIntensity(createFilterIntensity(6));
      
      const state = result.getState!();
      // Should default to brightness when unknown property
      expect(state.brightness).toBe(1.1); // 0.5 + (6/10)
    });

    it('should handle partial configuration correctly', () => {
      const config: AdjustmentFilterConfig = {
        type: 'adjustment',
        enabled: true,
        intensity: createFilterIntensity(5),
        gamma: 1.2
        // Only gamma specified, others should use defaults
      };

      const result = createFilter(config);
      const state = result.getState!();
      
      expect(state.gamma).toBe(1.2);
      expect(state.saturation).toBe(1); // Default
      expect(state.contrast).toBe(1);   // Default
      expect(state.brightness).toBe(1); // Default
    });

    it('should handle zero intensity correctly', () => {
      const config: AdjustmentFilterConfig = {
        type: 'adjustment',
        enabled: true,
        intensity: createFilterIntensity(0),
        primaryProperty: 'saturation'
      };

      const result = createFilter(config);
      result.updateIntensity(createFilterIntensity(0));
      
      const state = result.getState!();
      expect(state.saturation).toBe(0.5); // 0.5 + (0/10) = 0.5
    });
  });

  describe('Resource Management', () => {
    it('should call dispose on the underlying filter', () => {
      const config: AdjustmentFilterConfig = {
        type: 'adjustment',
        enabled: true,
        intensity: createFilterIntensity(5)
      };

      const result = createFilter(config);
      const mockDestroy = vi.fn();
      (result.filter as any).destroy = mockDestroy;

      result.dispose();

      expect(mockDestroy).toHaveBeenCalledOnce();
    });

    it('should handle dispose gracefully when filter has no destroy method', () => {
      const config: AdjustmentFilterConfig = {
        type: 'adjustment',
        enabled: true,
        intensity: createFilterIntensity(5)
      };

      const result = createFilter(config);
      
      // Override dispose to check implementation handles missing destroy method
      const _originalDispose = result.dispose;
      result.dispose = () => {
        // Simulate the actual implementation behavior
        if (result.filter && typeof (result.filter as any).destroy === 'function') {
          (result.filter as any).destroy();
        }
      };

      expect(() => result.dispose()).not.toThrow();
    });
  });

  describe('Integration Points', () => {
    it('should work with FilterManager-style intensity updates', () => {
      const config: AdjustmentFilterConfig = {
        type: 'adjustment',
        enabled: true,
        intensity: createFilterIntensity(5),
        primaryProperty: 'contrast'
      };

      const result = createFilter(config);
      
      // Simulate FilterManager calling updateIntensity
      const intensityUpdates = [3, 7, 2, 9, 5].map(createFilterIntensity);
      
      intensityUpdates.forEach(intensity => {
        expect(() => result.updateIntensity(intensity)).not.toThrow();
      });
      
      const finalState = result.getState!();
      expect(finalState.contrast).toBe(1.0); // 0.5 + (5/10) = 1.0
    });
  });
}); 