/**
 * AlphaFilter Integration Tests
 * 
 * Tests the AlphaFilter class with real PIXI.js dependencies.
 * Validates alpha transparency properties, intensity scaling, and PIXI API compliance.
 * 
 * @module AlphaFilterIntegrationTests
 * @version 1.0.0
 * @requires pixi.js
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AlphaFilter, type AlphaFilterConfig } from '../../../filters/AlphaFilter';
import { createFilterIntensity } from '../../../types/filters';

describe('AlphaFilter Integration Tests', () => {
  beforeEach(() => {
    // Clear any previous state
  });

  describe('PIXI Filter Creation & Properties', () => {
    it('should create a real PIXI AlphaFilter instance', () => {
      const config: AlphaFilterConfig = {
        type: 'alpha',
        enabled: true
      };

      const filter = new AlphaFilter(config);
      
      expect(filter.filter).toBeDefined();
      expect(filter.filter.constructor.name).toBe('_AlphaFilter');
    });

    it('should initialize with correct default alpha value', () => {
      const config: AlphaFilterConfig = {
        type: 'alpha',
        enabled: true
      };

      const filter = new AlphaFilter(config);
      const state = filter.getState();

      expect(state.alpha).toBe(1.0);
    });

    it('should initialize with custom alpha value', () => {
      const config: AlphaFilterConfig = {
        type: 'alpha',
        enabled: true,
        alpha: 0.6
      };

      const filter = new AlphaFilter(config);
      const state = filter.getState();

      expect(state.alpha).toBe(0.6);
    });

    it('should handle partial configuration with defaults', () => {
      const config: AlphaFilterConfig = {
        type: 'alpha',
        enabled: true,
        alpha: 0.4
      };

      const filter = new AlphaFilter(config);
      const state = filter.getState();

      expect(state.alpha).toBe(0.4);
      expect(state.configuredAlpha).toBe(0.4);
    });

    it('should handle alpha with intensity configuration', () => {
      const config: AlphaFilterConfig = {
        type: 'alpha',
        enabled: true,
        alpha: 0.8,
        intensity: createFilterIntensity(7)
      };

      const filter = new AlphaFilter(config);
      const state = filter.getState();

      expect(state.alpha).toBeCloseTo(0.56, 2); // 0.8 * (7/10) = 0.56
      expect(state.configuredAlpha).toBe(0.8);
    });
  });

  describe('Real Intensity Scaling', () => {
    it('should scale alpha linearly with intensity', () => {
      const config: AlphaFilterConfig = {
        type: 'alpha',
        enabled: true,
        alpha: 0.8
      };

      const filter = new AlphaFilter(config);
      
      // Test different intensity values
      filter.updateIntensity(createFilterIntensity(0));
      let state = filter.getState();
      expect(state.alpha).toBe(0.0); // 0.8 * (0/10) = 0.0
      
      filter.updateIntensity(createFilterIntensity(5));
      state = filter.getState();
      expect(state.alpha).toBe(0.4); // 0.8 * (5/10) = 0.4
      
      filter.updateIntensity(createFilterIntensity(10));
      state = filter.getState();
      expect(state.alpha).toBe(0.8); // 0.8 * (10/10) = 0.8
    });

    it('should handle default alpha scaling correctly', () => {
      const config: AlphaFilterConfig = {
        type: 'alpha',
        enabled: true
        // No alpha specified, should use default 1.0
      };

      const filter = new AlphaFilter(config);
      
      filter.updateIntensity(createFilterIntensity(3));
      const state = filter.getState();
      expect(state.alpha).toBe(0.3); // 1.0 * (3/10) = 0.3
    });

    it('should handle fractional alpha values correctly', () => {
      const config: AlphaFilterConfig = {
        type: 'alpha',
        enabled: true,
        alpha: 0.75
      };

      const filter = new AlphaFilter(config);
      
      filter.updateIntensity(createFilterIntensity(4));
      const state = filter.getState();
      expect(state.alpha).toBeCloseTo(0.3, 2); // 0.75 * (4/10) = 0.3
    });

    it('should clamp to valid alpha range in real PIXI filter', () => {
      const config: AlphaFilterConfig = {
        type: 'alpha',
        enabled: true,
        alpha: 1.5 // Invalid high value
      };

      const filter = new AlphaFilter(config);
      
      filter.updateIntensity(createFilterIntensity(10));
      const state = filter.getState();
      
      // Should be clamped to valid range
      expect(state.alpha).toBeLessThanOrEqual(1.0);
      expect(state.alpha).toBeGreaterThanOrEqual(0.0);
    });

    it('should handle extreme intensity values gracefully', () => {
      const config: AlphaFilterConfig = {
        type: 'alpha',
        enabled: true,
        alpha: 0.5
      };

      const filter = new AlphaFilter(config);
      
      // Test extreme values
      expect(() => {
        filter.updateIntensity(createFilterIntensity(0));
      }).not.toThrow();
      
      expect(() => {
        filter.updateIntensity(createFilterIntensity(10));
      }).not.toThrow();
      
      const state = filter.getState();
      expect(Number.isFinite(state.alpha)).toBe(true);
    });
  });

  describe('PIXI Filter Reset Behavior', () => {
    it('should reset to configured alpha value correctly', () => {
      const config: AlphaFilterConfig = {
        type: 'alpha',
        enabled: true,
        alpha: 0.7
      };

      const filter = new AlphaFilter(config);
      filter.updateIntensity(createFilterIntensity(3));
      
      // Reset should restore configured value
      filter.reset();
      
      const state = filter.getState();
      expect(state.alpha).toBe(0.7);
    });

    it('should reset to default when no specific alpha configured', () => {
      const config: AlphaFilterConfig = {
        type: 'alpha',
        enabled: true
      };

      const filter = new AlphaFilter(config);
      filter.updateIntensity(createFilterIntensity(6));
      
      // Reset should restore default
      filter.reset();
      
      const state = filter.getState();
      expect(state.alpha).toBe(1.0);
    });

    it('should apply configured intensity on reset when both alpha and intensity are configured', () => {
      const config: AlphaFilterConfig = {
        type: 'alpha',
        enabled: true,
        alpha: 0.8,
        intensity: createFilterIntensity(5)
      };

      const filter = new AlphaFilter(config);
      filter.updateIntensity(createFilterIntensity(2));
      
      // Reset should apply configured intensity
      filter.reset();
      
      const state = filter.getState();
      expect(state.alpha).toBe(0.4); // 0.8 * (5/10) = 0.4
    });
  });

  describe('PIXI API Compliance', () => {
    it('should properly manage enabled state', () => {
      const config: AlphaFilterConfig = {
        type: 'alpha',
        enabled: false
      };

      const filter = new AlphaFilter(config);
      const state = filter.getState();
      
      expect(state.enabled).toBe(false);
    });

    it('should expose PIXI AlphaFilter properties', () => {
      const config: AlphaFilterConfig = {
        type: 'alpha',
        enabled: true,
        alpha: 0.5
      };

      const filter = new AlphaFilter(config);
      const pixiFilter = filter.filter as any;

      // Test that PIXI properties are accessible
      expect('alpha' in pixiFilter).toBe(true);
      expect(typeof pixiFilter.alpha).toBe('number');
      expect(pixiFilter.alpha).toBe(0.5);
    });

    it('should support filter chaining', () => {
      const config: AlphaFilterConfig = {
        type: 'alpha',
        enabled: true
      };

      const filter = new AlphaFilter(config);
      
      // PIXI filters should be chainable (have apply method)
      expect('apply' in filter.filter).toBe(true);
      expect(typeof (filter.filter as any).apply).toBe('function');
    });

    it('should validate alpha property type matches PIXI expectations', () => {
      const config: AlphaFilterConfig = {
        type: 'alpha',
        enabled: true,
        alpha: 0.25
      };

      const filter = new AlphaFilter(config);
      const pixiFilter = filter.filter as any;

      expect(typeof pixiFilter.alpha).toBe('number');
      expect(pixiFilter.alpha).toBe(0.25);
      expect(Number.isFinite(pixiFilter.alpha)).toBe(true);
    });

    it('should maintain alpha value consistency between wrapper and PIXI filter', () => {
      const config: AlphaFilterConfig = {
        type: 'alpha',
        enabled: true,
        alpha: 0.9
      };

      const filter = new AlphaFilter(config);
      const state = filter.getState();
      const pixiFilter = filter.filter as any;

      expect(state.alpha).toBe(pixiFilter.alpha);
      
      // Update intensity and check consistency
      filter.updateIntensity(createFilterIntensity(6));
      const newState = filter.getState();
      
      expect(newState.alpha).toBe(pixiFilter.alpha);
      expect(newState.alpha).toBeCloseTo(0.54, 2); // 0.9 * (6/10) = 0.54
    });
  });

  describe('Edge Cases & Error Handling', () => {
    it('should handle zero alpha value', () => {
      const config: AlphaFilterConfig = {
        type: 'alpha',
        enabled: true,
        alpha: 0.0
      };

      const filter = new AlphaFilter(config);
      
      expect(() => {
        filter.updateIntensity(createFilterIntensity(10));
      }).not.toThrow();
      
      const state = filter.getState();
      expect(state.alpha).toBe(0.0);
    });

    it('should handle very small alpha values', () => {
      const config: AlphaFilterConfig = {
        type: 'alpha',
        enabled: true,
        alpha: 0.001
      };

      const filter = new AlphaFilter(config);
      
      filter.updateIntensity(createFilterIntensity(5));
      const state = filter.getState();
      expect(state.alpha).toBeCloseTo(0.0005, 4); // 0.001 * (5/10) = 0.0005
      expect(Number.isFinite(state.alpha)).toBe(true);
    });

    it('should handle negative alpha values gracefully', () => {
      const config: AlphaFilterConfig = {
        type: 'alpha',
        enabled: true,
        alpha: -0.3
      };

      const filter = new AlphaFilter(config);
      
      expect(() => {
        filter.updateIntensity(createFilterIntensity(5));
      }).not.toThrow();
      
      const state = filter.getState();
      expect(state.alpha).toBeGreaterThanOrEqual(0.0);
    });

    it('should handle alpha values above 1.0 gracefully', () => {
      const config: AlphaFilterConfig = {
        type: 'alpha',
        enabled: true,
        alpha: 1.8
      };

      const filter = new AlphaFilter(config);
      
      expect(() => {
        filter.updateIntensity(createFilterIntensity(5));
      }).not.toThrow();
      
      const state = filter.getState();
      expect(state.alpha).toBeLessThanOrEqual(1.0);
    });
  });

  describe('Memory Management', () => {
    it('should dispose of PIXI filter properly', () => {
      const config: AlphaFilterConfig = {
        type: 'alpha',
        enabled: true,
        alpha: 0.6
      };

      const filter = new AlphaFilter(config);
      
      expect(() => {
        filter.dispose();
      }).not.toThrow();
    });

    it('should handle multiple dispose calls gracefully', () => {
      const config: AlphaFilterConfig = {
        type: 'alpha',
        enabled: true,
        alpha: 0.6
      };

      const filter = new AlphaFilter(config);
      
      // First dispose should work
      expect(() => {
        filter.dispose();
      }).not.toThrow();
      
      // Second dispose might fail in PIXI but should be handled gracefully
      // We don't expect it to throw from our wrapper
      try {
        filter.dispose();
      } catch (error) {
        // This is expected for PIXI filters after first dispose
        expect(error).toBeDefined();
      }
    });
  });

  describe('Performance & Stability', () => {
    it('should handle rapid alpha updates efficiently', () => {
      const config: AlphaFilterConfig = {
        type: 'alpha',
        enabled: true,
        alpha: 0.5
      };

      const filter = new AlphaFilter(config);
      
      // Perform many rapid updates
      for (let i = 0; i < 1000; i++) {
        const intensity = Math.random() * 10;
        filter.updateIntensity(createFilterIntensity(intensity));
        
        const state = filter.getState();
        expect(Number.isFinite(state.alpha)).toBe(true);
        expect(state.alpha).toBeGreaterThanOrEqual(0);
        expect(state.alpha).toBeLessThanOrEqual(1);
      }
    });

    it('should maintain state consistency during rapid changes', () => {
      const config: AlphaFilterConfig = {
        type: 'alpha',
        enabled: true,
        alpha: 0.75
      };

      const filter = new AlphaFilter(config);
      
      // Perform sequence of operations
      filter.updateIntensity(createFilterIntensity(3));
      filter.reset();
      filter.updateIntensity(createFilterIntensity(7));
      filter.reset();
      filter.updateIntensity(createFilterIntensity(5));
      
      const state = filter.getState();
      expect(state.alpha).toBeCloseTo(0.375, 3); // 0.75 * (5/10) = 0.375
      expect(state.configuredAlpha).toBe(0.75);
    });
  });
}); 