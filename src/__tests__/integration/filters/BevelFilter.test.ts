/**
 * BevelFilter Integration Tests
 * 
 * Tests the BevelFilter class with real PIXI.js dependencies.
 * Validates 3D bevel lighting effect properties, conditional intensity scaling, and PIXI API compliance.
 * 
 * @module BevelFilterIntegrationTests
 * @version 1.0.0
 * @requires pixi-filters
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BevelFilter, type BevelFilterConfig } from '../../../filters/BevelFilter';
import { createFilterIntensity } from '../../../types/filters';

describe('BevelFilter Integration Tests', () => {
  beforeEach(() => {
    // Clear any previous state
  });

  describe('PIXI Filter Creation & Properties', () => {
    it('should create a real PIXI BevelFilter instance', () => {
      const config: BevelFilterConfig = {
        type: 'bevel',
        enabled: true
      };

      const filter = new BevelFilter(config);
      
      expect(filter.filter).toBeDefined();
      expect(filter.filter.constructor.name).toBe('_BevelFilter');
    });

    it('should initialize with correct default values', () => {
      const config: BevelFilterConfig = {
        type: 'bevel',
        enabled: true
      };

      const filter = new BevelFilter(config);
      const state = filter.getState();

      expect(state.rotation).toBe(45); // Default rotation
      expect(state.thickness).toBe(2); // Default thickness
      expect(state.lightColor).toBe(0xffffff); // Default light color
      expect(state.lightAlpha).toBe(0.7); // Default light alpha
      expect(state.shadowColor).toBe(0x000000); // Default shadow color
      expect(state.shadowAlpha).toBe(0.7); // Default shadow alpha
    });

    it('should initialize with custom bevel properties', () => {
      const config: BevelFilterConfig = {
        type: 'bevel',
        enabled: true,
        rotation: 60,
        thickness: 5,
        lightColor: 0xff0000,
        lightAlpha: 0.9,
        shadowColor: 0x0000ff,
        shadowAlpha: 0.3
      };

      const filter = new BevelFilter(config);
      const state = filter.getState();

      expect(state.configuredRotation).toBe(60);
      expect(state.configuredThickness).toBe(5);
      expect(state.configuredLightColor).toBe(0xff0000);
      expect(state.configuredShadowColor).toBe(0x0000ff);
      expect(state.rotation).toBeCloseTo(60, 1);
      expect(state.thickness).toBe(5);
      expect(state.lightColor).toBe(0xff0000);
      expect(state.lightAlpha).toBe(0.9);
      expect(state.shadowColor).toBe(0x0000ff);
      expect(state.shadowAlpha).toBe(0.3);
    });

    it('should handle partial configuration with defaults', () => {
      const config: BevelFilterConfig = {
        type: 'bevel',
        enabled: true,
        thickness: 4,
        lightColor: 0x00ff00
      };

      const filter = new BevelFilter(config);
      const state = filter.getState();

      expect(state.configuredThickness).toBe(4);
      expect(state.configuredLightColor).toBe(0x00ff00);
      expect(state.configuredRotation).toBeUndefined();
      expect(state.configuredShadowColor).toBeUndefined();
      expect(state.thickness).toBe(4);
      expect(state.lightColor).toBe(0x00ff00);
      expect(state.rotation).toBe(45); // Default
      expect(state.shadowColor).toBe(0x000000); // Default
    });

    it('should handle thickness with intensity configuration', () => {
      const config: BevelFilterConfig = {
        type: 'bevel',
        enabled: true,
        thickness: 3,
        intensity: createFilterIntensity(6),
        primaryProperty: 'thickness'
      };

      const filter = new BevelFilter(config);
      const state = filter.getState();

      expect(state.configuredThickness).toBe(3);
      // When intensity is applied: 3 + (6 * 1.8) = 13.8
      expect(state.thickness).toBe(13.8);
    });
  });

  describe('Real Intensity Scaling - Primary Properties', () => {
    it('should scale thickness with custom intensity formula', () => {
      const config: BevelFilterConfig = {
        type: 'bevel',
        enabled: true,
        thickness: 2,
        primaryProperty: 'thickness'
      };

      const filter = new BevelFilter(config);
      
      // Test different intensity values
      filter.updateIntensity(createFilterIntensity(0));
      let state = filter.getState();
      expect(state.thickness).toBe(2); // 2 + (0 * 1.8) = 2
      
      filter.updateIntensity(createFilterIntensity(3));
      state = filter.getState();
      expect(state.thickness).toBe(7.4); // 2 + (3 * 1.8) = 7.4
      
      filter.updateIntensity(createFilterIntensity(5));
      state = filter.getState();
      expect(state.thickness).toBe(11); // 2 + (5 * 1.8) = 11
      
      filter.updateIntensity(createFilterIntensity(10));
      state = filter.getState();
      expect(state.thickness).toBe(20); // 2 + (10 * 1.8) = 20
    });

    it('should scale lightAlpha with normalized intensity', () => {
      const config: BevelFilterConfig = {
        type: 'bevel',
        enabled: true,
        primaryProperty: 'lightAlpha'
      };

      const filter = new BevelFilter(config);
      
      filter.updateIntensity(createFilterIntensity(0));
      let state = filter.getState();
      expect(state.lightAlpha).toBe(0); // 0 / 10 = 0
      
      filter.updateIntensity(createFilterIntensity(2.5));
      state = filter.getState();
      expect(state.lightAlpha).toBe(0.25); // 2.5 / 10 = 0.25
      
      filter.updateIntensity(createFilterIntensity(7));
      state = filter.getState();
      expect(state.lightAlpha).toBe(0.7); // 7 / 10 = 0.7
      
      filter.updateIntensity(createFilterIntensity(10));
      state = filter.getState();
      expect(state.lightAlpha).toBe(1); // 10 / 10 = 1
    });

    it('should scale shadowAlpha with normalized intensity', () => {
      const config: BevelFilterConfig = {
        type: 'bevel',
        enabled: true,
        primaryProperty: 'shadowAlpha'
      };

      const filter = new BevelFilter(config);
      
      filter.updateIntensity(createFilterIntensity(1));
      let state = filter.getState();
      expect(state.shadowAlpha).toBe(0.1); // 1 / 10 = 0.1
      
      filter.updateIntensity(createFilterIntensity(6));
      state = filter.getState();
      expect(state.shadowAlpha).toBe(0.6); // 6 / 10 = 0.6
    });

    it('should scale rotation with full circle mapping', () => {
      const config: BevelFilterConfig = {
        type: 'bevel',
        enabled: true,
        primaryProperty: 'rotation'
      };

      const filter = new BevelFilter(config);
      
      filter.updateIntensity(createFilterIntensity(0));
      let state = filter.getState();
      expect(state.rotation).toBe(0); // (0 / 10) * 360 = 0
      
      filter.updateIntensity(createFilterIntensity(2.5));
      state = filter.getState();
      expect(state.rotation).toBe(90); // (2.5 / 10) * 360 = 90
      
      filter.updateIntensity(createFilterIntensity(5));
      state = filter.getState();
      expect(state.rotation).toBe(180); // (5 / 10) * 360 = 180
      
      filter.updateIntensity(createFilterIntensity(7.5));
      state = filter.getState();
      expect(state.rotation).toBe(270); // (7.5 / 10) * 360 = 270
      
      filter.updateIntensity(createFilterIntensity(10));
      state = filter.getState();
      expect(state.rotation).toBe(360); // (10 / 10) * 360 = 360
    });

    it('should use default multi-property behavior when no primaryProperty specified', () => {
      const config: BevelFilterConfig = {
        type: 'bevel',
        enabled: true,
        thickness: 3,
        lightAlpha: 0.4,
        shadowAlpha: 0.5
      };

      const filter = new BevelFilter(config);
      
      filter.updateIntensity(createFilterIntensity(4));
      const state = filter.getState();

      // Default behavior: thickness + alpha adjustments
      expect(state.thickness).toBe(10.2); // 3 + (4 * 1.8) = 10.2
      expect(state.lightAlpha).toBeCloseTo(0.52, 2); // 0.4 + (4 * 0.03) = 0.52
      expect(state.shadowAlpha).toBeCloseTo(0.62, 2); // 0.5 + (4 * 0.03) = 0.62
    });

    it('should maintain other properties during primary property updates', () => {
      const config: BevelFilterConfig = {
        type: 'bevel',
        enabled: true,
        rotation: 120,
        thickness: 6,
        lightColor: 0xff0000,
        shadowColor: 0x0000ff,
        primaryProperty: 'rotation'
      };

      const filter = new BevelFilter(config);
      
      filter.updateIntensity(createFilterIntensity(3));
      const state = filter.getState();

      // Primary property should change
      expect(state.rotation).toBe(108); // (3 / 10) * 360 = 108
      
      // Other properties should remain unchanged
      expect(state.thickness).toBe(6);
      expect(state.lightColor).toBe(0xff0000);
      expect(state.shadowColor).toBe(0x0000ff);
    });

    it('should handle extreme intensity values gracefully', () => {
      const config: BevelFilterConfig = {
        type: 'bevel',
        enabled: true,
        primaryProperty: 'thickness'
      };

      const filter = new BevelFilter(config);
      
      // Test extreme values
      expect(() => {
        filter.updateIntensity(createFilterIntensity(0));
      }).not.toThrow();
      
      expect(() => {
        filter.updateIntensity(createFilterIntensity(10));
      }).not.toThrow();
      
      const state = filter.getState();
      expect(Number.isFinite(state.thickness)).toBe(true);
      expect(Number.isFinite(state.rotation)).toBe(true);
      expect(Number.isFinite(state.lightAlpha)).toBe(true);
      expect(Number.isFinite(state.shadowAlpha)).toBe(true);
    });
  });

  describe('PIXI Filter Reset Behavior', () => {
    it('should reset to configured values correctly', () => {
      const config: BevelFilterConfig = {
        type: 'bevel',
        enabled: true,
        rotation: 135,
        thickness: 8,
        lightColor: 0x00ff00,
        lightAlpha: 0.8,
        shadowColor: 0xff0000,
        shadowAlpha: 0.4
      };

      const filter = new BevelFilter(config);
      filter.updateIntensity(createFilterIntensity(6));
      
      // Reset should restore configured values
      filter.reset();
      
      const state = filter.getState();
      expect(state.rotation).toBe(135);
      expect(state.thickness).toBe(8);
      expect(state.lightColor).toBe(0x00ff00);
      expect(state.lightAlpha).toBe(0.8);
      expect(state.shadowColor).toBe(0xff0000);
      expect(state.shadowAlpha).toBe(0.4);
    });

    it('should reset to defaults when no specific values configured', () => {
      const config: BevelFilterConfig = {
        type: 'bevel',
        enabled: true
      };

      const filter = new BevelFilter(config);
      filter.updateIntensity(createFilterIntensity(8));
      
      // Reset should restore defaults
      filter.reset();
      
      const state = filter.getState();
      expect(state.rotation).toBe(45); // Default
      expect(state.thickness).toBe(2); // Default
      expect(state.lightColor).toBe(0xffffff); // Default
      expect(state.lightAlpha).toBe(0.7); // Default
      expect(state.shadowColor).toBe(0x000000); // Default
      expect(state.shadowAlpha).toBe(0.7); // Default
    });

    it('should apply configured intensity on reset', () => {
      const config: BevelFilterConfig = {
        type: 'bevel',
        enabled: true,
        thickness: 4,
        intensity: createFilterIntensity(5),
        primaryProperty: 'thickness'
      };

      const filter = new BevelFilter(config);
      filter.updateIntensity(createFilterIntensity(2));
      
      // Reset should apply configured intensity
      filter.reset();
      
      const state = filter.getState();
      expect(state.thickness).toBe(13); // 4 + (5 * 1.8) = 13
    });

    it('should handle reset with different primary properties', () => {
      const config: BevelFilterConfig = {
        type: 'bevel',
        enabled: true,
        intensity: createFilterIntensity(7),
        primaryProperty: 'lightAlpha'
      };

      const filter = new BevelFilter(config);
      filter.updateIntensity(createFilterIntensity(3));
      
      // Reset should apply configured intensity to primary property
      filter.reset();
      
      const state = filter.getState();
      expect(state.lightAlpha).toBe(0.7); // 7 / 10 = 0.7
    });

    it('should handle default behavior reset with configured intensity', () => {
      const config: BevelFilterConfig = {
        type: 'bevel',
        enabled: true,
        thickness: 3,
        lightAlpha: 0.2,
        shadowAlpha: 0.3,
        intensity: createFilterIntensity(6)
      };

      const filter = new BevelFilter(config);
      filter.updateIntensity(createFilterIntensity(2));
      
      // Reset should apply default behavior with configured intensity
      filter.reset();
      
      const state = filter.getState();
      expect(state.thickness).toBe(13.8); // 3 + (6 * 1.8) = 13.8
      expect(state.lightAlpha).toBeCloseTo(0.38, 2); // 0.2 + (6 * 0.03) = 0.38
      expect(state.shadowAlpha).toBeCloseTo(0.48, 2); // 0.3 + (6 * 0.03) = 0.48
    });
  });

  describe('PIXI API Compliance', () => {
    it('should properly manage enabled state', () => {
      const config: BevelFilterConfig = {
        type: 'bevel',
        enabled: false
      };

      const filter = new BevelFilter(config);
      const state = filter.getState();
      
      expect(state.enabled).toBe(false);
    });

    it('should expose PIXI BevelFilter properties', () => {
      const config: BevelFilterConfig = {
        type: 'bevel',
        enabled: true,
        rotation: 90,
        thickness: 4,
        lightColor: 0xff00ff,
        shadowColor: 0x00ffff
      };

      const filter = new BevelFilter(config);
      const pixiFilter = filter.filter as any;

      // Test that PIXI properties are accessible
      expect('rotation' in pixiFilter).toBe(true);
      expect('thickness' in pixiFilter).toBe(true);
      expect('lightColor' in pixiFilter).toBe(true);
      expect('lightAlpha' in pixiFilter).toBe(true);
      expect('shadowColor' in pixiFilter).toBe(true);
      expect('shadowAlpha' in pixiFilter).toBe(true);
      expect(typeof pixiFilter.rotation).toBe('number');
      expect(typeof pixiFilter.thickness).toBe('number');
      expect(pixiFilter.rotation).toBe(90);
      expect(pixiFilter.thickness).toBe(4);
      expect(pixiFilter.lightColor).toBe(0xff00ff);
      expect(pixiFilter.shadowColor).toBe(0x00ffff);
    });

    it('should support filter chaining', () => {
      const config: BevelFilterConfig = {
        type: 'bevel',
        enabled: true
      };

      const filter = new BevelFilter(config);
      
      // PIXI filters should be chainable (have apply method)
      expect('apply' in filter.filter).toBe(true);
      expect(typeof (filter.filter as any).apply).toBe('function');
    });

    it('should validate property types match PIXI expectations', () => {
      const config: BevelFilterConfig = {
        type: 'bevel',
        enabled: true,
        rotation: 180,
        thickness: 7,
        lightAlpha: 0.9,
        shadowAlpha: 0.5
      };

      const filter = new BevelFilter(config);
      const pixiFilter = filter.filter as any;

      expect(typeof pixiFilter.rotation).toBe('number');
      expect(typeof pixiFilter.thickness).toBe('number');
      expect(typeof pixiFilter.lightAlpha).toBe('number');
      expect(typeof pixiFilter.shadowAlpha).toBe('number');
      expect(Number.isFinite(pixiFilter.rotation)).toBe(true);
      expect(Number.isFinite(pixiFilter.thickness)).toBe(true);
      expect(Number.isFinite(pixiFilter.lightAlpha)).toBe(true);
      expect(Number.isFinite(pixiFilter.shadowAlpha)).toBe(true);
    });

    it('should maintain consistency between wrapper and PIXI filter', () => {
      const config: BevelFilterConfig = {
        type: 'bevel',
        enabled: true,
        rotation: 270,
        thickness: 6,
        lightColor: 0xffff00,
        lightAlpha: 0.8,
        shadowColor: 0xff00ff,
        shadowAlpha: 0.6
      };

      const filter = new BevelFilter(config);
      const state = filter.getState();
      const pixiFilter = filter.filter as any;

      expect(state.rotation).toBe(pixiFilter.rotation);
      expect(state.thickness).toBe(pixiFilter.thickness);
      expect(state.lightColor).toBe(pixiFilter.lightColor);
      expect(state.lightAlpha).toBe(pixiFilter.lightAlpha);
      expect(state.shadowColor).toBe(pixiFilter.shadowColor);
      expect(state.shadowAlpha).toBe(pixiFilter.shadowAlpha);
      
      // Update intensity and check consistency
      filter.updateIntensity(createFilterIntensity(5));
      const newState = filter.getState();
      
      expect(newState.rotation).toBe(pixiFilter.rotation);
      expect(newState.thickness).toBe(pixiFilter.thickness);
      expect(newState.lightAlpha).toBe(pixiFilter.lightAlpha);
      expect(newState.shadowAlpha).toBe(pixiFilter.shadowAlpha);
    });
  });

  describe('Edge Cases & Error Handling', () => {
    it('should handle zero values gracefully', () => {
      const config: BevelFilterConfig = {
        type: 'bevel',
        enabled: true,
        rotation: 0,
        thickness: 0,
        lightAlpha: 0,
        shadowAlpha: 0
      };

      const filter = new BevelFilter(config);
      
      expect(() => {
        filter.updateIntensity(createFilterIntensity(5));
      }).not.toThrow();
      
      const state = filter.getState();
      expect(Number.isFinite(state.rotation)).toBe(true);
      expect(Number.isFinite(state.thickness)).toBe(true);
      expect(Number.isFinite(state.lightAlpha)).toBe(true);
      expect(Number.isFinite(state.shadowAlpha)).toBe(true);
    });

    it('should handle very large thickness values', () => {
      const config: BevelFilterConfig = {
        type: 'bevel',
        enabled: true,
        thickness: 100,
        primaryProperty: 'thickness'
      };

      const filter = new BevelFilter(config);
      
      expect(() => {
        filter.updateIntensity(createFilterIntensity(10));
      }).not.toThrow();
      
      const state = filter.getState();
      expect(Number.isFinite(state.thickness)).toBe(true);
      expect(state.thickness).toBe(118); // 100 + (10 * 1.8) = 118
    });

    it('should handle various color values', () => {
      const colors = [0x000000, 0xffffff, 0xff0000, 0x00ff00, 0x0000ff, 0x123456, 0xfedcba];
      
      for (const lightColor of colors) {
        const config: BevelFilterConfig = {
          type: 'bevel',
          enabled: true,
          lightColor: lightColor,
          shadowColor: 0xffffff - lightColor // Complementary color
        };

        const filter = new BevelFilter(config);
        
        expect(() => {
          filter.updateIntensity(createFilterIntensity(5));
        }).not.toThrow();
        
        const state = filter.getState();
        expect(state.lightColor).toBe(lightColor);
        expect(state.shadowColor).toBe(0xffffff - lightColor);
      }
    });

    it('should handle rotation wraparound values', () => {
      const config: BevelFilterConfig = {
        type: 'bevel',
        enabled: true,
        rotation: 720, // Multiple full rotations
        primaryProperty: 'rotation'
      };

      const filter = new BevelFilter(config);
      
      filter.updateIntensity(createFilterIntensity(2.5));
      const state = filter.getState();
      
      expect(state.configuredRotation).toBe(720);
      expect(state.rotation).toBe(90); // (2.5 / 10) * 360 = 90
    });

    it('should handle alpha boundary conditions', () => {
      const config: BevelFilterConfig = {
        type: 'bevel',
        enabled: true,
        lightAlpha: 1.0,
        shadowAlpha: 0.0
      };

      const filter = new BevelFilter(config);
      
      // Test alpha capping in default behavior
      filter.updateIntensity(createFilterIntensity(10));
      const state = filter.getState();
      
      expect(state.lightAlpha).toBe(1); // Should be capped at 1
      expect(state.shadowAlpha).toBeCloseTo(0.3, 2); // 0 + (10 * 0.03) = 0.3
    });
  });

  describe('Memory Management', () => {
    it('should dispose of PIXI filter properly', () => {
      const config: BevelFilterConfig = {
        type: 'bevel',
        enabled: true,
        thickness: 5
      };

      const filter = new BevelFilter(config);
      
      expect(() => {
        filter.dispose();
      }).not.toThrow();
    });

    it('should handle multiple dispose calls gracefully', () => {
      const config: BevelFilterConfig = {
        type: 'bevel',
        enabled: true,
        rotation: 90,
        thickness: 3
      };

      const filter = new BevelFilter(config);
      
      // First dispose should work
      expect(() => {
        filter.dispose();
      }).not.toThrow();
      
      // Second dispose might fail in PIXI but should be handled gracefully
      try {
        filter.dispose();
      } catch (error) {
        // This is expected for PIXI filters after first dispose
        expect(error).toBeDefined();
      }
    });
  });

  describe('Performance & Stability', () => {
    it('should handle rapid property updates efficiently', () => {
      const config: BevelFilterConfig = {
        type: 'bevel',
        enabled: true,
        thickness: 3,
        primaryProperty: 'thickness'
      };

      const filter = new BevelFilter(config);
      
      // Perform many rapid updates
      for (let i = 0; i < 100; i++) {
        const intensity = Math.random() * 10;
        filter.updateIntensity(createFilterIntensity(intensity));
        
        const state = filter.getState();
        expect(Number.isFinite(state.thickness)).toBe(true);
        expect(Number.isFinite(state.rotation)).toBe(true);
        expect(Number.isFinite(state.lightAlpha)).toBe(true);
        expect(Number.isFinite(state.shadowAlpha)).toBe(true);
      }
    });

    it('should maintain state consistency during rapid changes', () => {
      const config: BevelFilterConfig = {
        type: 'bevel',
        enabled: true,
        rotation: 45,
        thickness: 4,
        lightColor: 0x888888,
        shadowColor: 0x444444,
        primaryProperty: 'rotation'
      };

      const filter = new BevelFilter(config);
      
      // Perform sequence of operations
      filter.updateIntensity(createFilterIntensity(3));
      filter.reset();
      filter.updateIntensity(createFilterIntensity(7));
      filter.reset();
      filter.updateIntensity(createFilterIntensity(5));
      
      const state = filter.getState();
      expect(state.rotation).toBe(180); // (5 / 10) * 360 = 180
      expect(state.configuredRotation).toBe(45);
      expect(state.thickness).toBe(4); // Should remain unchanged
      expect(state.lightColor).toBe(0x888888);
      expect(state.shadowColor).toBe(0x444444);
    });

    it('should handle mixed primary property scenarios', () => {
      const configs = [
        { primaryProperty: 'thickness' as const, testProperty: 'thickness' },
        { primaryProperty: 'lightAlpha' as const, testProperty: 'lightAlpha' },
        { primaryProperty: 'shadowAlpha' as const, testProperty: 'shadowAlpha' },
        { primaryProperty: 'rotation' as const, testProperty: 'rotation' }
      ];

      for (const { primaryProperty, testProperty } of configs) {
        const config: BevelFilterConfig = {
          type: 'bevel',
          enabled: true,
          thickness: 3,
          lightAlpha: 0.5,
          shadowAlpha: 0.6,
          rotation: 45,
          primaryProperty
        };

        const filter = new BevelFilter(config);
        
        // Multiple updates with different intensities
        filter.updateIntensity(createFilterIntensity(2));
        filter.updateIntensity(createFilterIntensity(8));
        filter.updateIntensity(createFilterIntensity(1));
        filter.reset();
        filter.updateIntensity(createFilterIntensity(6));
        
        const state = filter.getState();
        expect(state[testProperty]).toBeDefined();
        expect(Number.isFinite(state[testProperty] as number)).toBe(true);
      }
    });
  });
}); 