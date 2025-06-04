/**
 * BevelFilter Unit Tests
 * 
 * Tests the BevelFilter wrapper class behavior with mocked dependencies.
 * Focuses on 3D bevel effect properties, conditional intensity mapping, and lighting effects.
 * 
 * @module BevelFilterUnitTests
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BevelFilter, type BevelFilterConfig } from '../../../filters/BevelFilter';
import { createFilterIntensity } from '../../../types/filters';

// Mock PIXI BevelFilter
vi.mock('pixi-filters', () => ({
  BevelFilter: vi.fn().mockImplementation(function(this: any, options: any = {}) {
    // Mock implementation of PIXI BevelFilter
    this.rotation = options.rotation ?? 45;
    this.thickness = options.thickness ?? 2;
    this.lightColor = options.lightColor ?? 0xffffff;
    this.lightAlpha = options.lightAlpha ?? 0.7;
    this.shadowColor = options.shadowColor ?? 0x000000;
    this.shadowAlpha = options.shadowAlpha ?? 0.7;
    this.enabled = true;
    
    this.destroy = vi.fn();
    return this;
  })
}));

describe('BevelFilter Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Construction & Basic Properties', () => {
    it('should create filter with default configuration', () => {
      const config: BevelFilterConfig = {
        type: 'bevel',
        enabled: true
      };

      const filter = new BevelFilter(config);
      const state = filter.getState();

      expect(state.enabled).toBe(true);
      expect(state.rotation).toBe(45); // Default rotation
      expect(state.thickness).toBe(2); // Default thickness
      expect(state.lightColor).toBe(0xffffff); // Default light color
      expect(state.lightAlpha).toBe(0.7); // Default light alpha
      expect(state.shadowColor).toBe(0x000000); // Default shadow color
      expect(state.shadowAlpha).toBe(0.7); // Default shadow alpha
    });

    it('should create filter with custom bevel properties', () => {
      const config: BevelFilterConfig = {
        type: 'bevel',
        enabled: true,
        rotation: 30,
        thickness: 5,
        lightColor: 0xff0000,
        lightAlpha: 0.8,
        shadowColor: 0x0000ff,
        shadowAlpha: 0.6
      };

      const filter = new BevelFilter(config);
      const state = filter.getState();

      expect(state.configuredRotation).toBe(30);
      expect(state.configuredThickness).toBe(5);
      expect(state.configuredLightColor).toBe(0xff0000);
      expect(state.configuredShadowColor).toBe(0x0000ff);
      expect(state.rotation).toBe(30);
      expect(state.thickness).toBe(5);
      expect(state.lightColor).toBe(0xff0000);
      expect(state.lightAlpha).toBe(0.8);
      expect(state.shadowColor).toBe(0x0000ff);
      expect(state.shadowAlpha).toBe(0.6);
    });

    it('should handle partial configuration with defaults', () => {
      const config: BevelFilterConfig = {
        type: 'bevel',
        enabled: true,
        thickness: 8,
        lightColor: 0x00ff00
      };

      const filter = new BevelFilter(config);
      const state = filter.getState();

      expect(state.configuredThickness).toBe(8);
      expect(state.configuredLightColor).toBe(0x00ff00);
      expect(state.configuredRotation).toBeUndefined();
      expect(state.configuredShadowColor).toBeUndefined();
      expect(state.thickness).toBe(8);
      expect(state.lightColor).toBe(0x00ff00);
      expect(state.rotation).toBe(45); // Default
      expect(state.shadowColor).toBe(0x000000); // Default
    });

    it('should handle intensity with thickness configuration', () => {
      const config: BevelFilterConfig = {
        type: 'bevel',
        enabled: true,
        thickness: 3,
        intensity: 4,
        primaryProperty: 'thickness'
      };

      const filter = new BevelFilter(config);
      const state = filter.getState();

      expect(state.configuredThickness).toBe(3);
      // Thickness should be: 3 + (4 * 1.8) = 10.2
      expect(state.thickness).toBe(10.2);
    });
  });

  describe('Intensity Updates - Primary Property Logic', () => {
    it('should scale thickness when primaryProperty is thickness', () => {
      const config: BevelFilterConfig = {
        type: 'bevel',
        enabled: true,
        thickness: 2,
        primaryProperty: 'thickness'
      };

      const filter = new BevelFilter(config);

      // Test various intensity levels
      filter.updateIntensity(createFilterIntensity(0));
      let state = filter.getState();
      expect(state.thickness).toBe(2); // 2 + (0 * 1.8) = 2

      filter.updateIntensity(createFilterIntensity(5));
      state = filter.getState();
      expect(state.thickness).toBe(11); // 2 + (5 * 1.8) = 11

      filter.updateIntensity(createFilterIntensity(10));
      state = filter.getState();
      expect(state.thickness).toBe(20); // 2 + (10 * 1.8) = 20
    });

    it('should scale lightAlpha when primaryProperty is lightAlpha', () => {
      const config: BevelFilterConfig = {
        type: 'bevel',
        enabled: true,
        primaryProperty: 'lightAlpha'
      };

      const filter = new BevelFilter(config);

      // Test various intensity levels
      filter.updateIntensity(createFilterIntensity(0));
      let state = filter.getState();
      expect(state.lightAlpha).toBe(0); // 0 / 10 = 0

      filter.updateIntensity(createFilterIntensity(5));
      state = filter.getState();
      expect(state.lightAlpha).toBe(0.5); // 5 / 10 = 0.5

      filter.updateIntensity(createFilterIntensity(10));
      state = filter.getState();
      expect(state.lightAlpha).toBe(1); // 10 / 10 = 1
    });

    it('should scale shadowAlpha when primaryProperty is shadowAlpha', () => {
      const config: BevelFilterConfig = {
        type: 'bevel',
        enabled: true,
        primaryProperty: 'shadowAlpha'
      };

      const filter = new BevelFilter(config);

      filter.updateIntensity(createFilterIntensity(3));
      let state = filter.getState();
      expect(state.shadowAlpha).toBe(0.3); // 3 / 10 = 0.3

      filter.updateIntensity(createFilterIntensity(7));
      state = filter.getState();
      expect(state.shadowAlpha).toBe(0.7); // 7 / 10 = 0.7
    });

    it('should scale rotation when primaryProperty is rotation', () => {
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

      filter.updateIntensity(createFilterIntensity(10));
      state = filter.getState();
      expect(state.rotation).toBe(360); // (10 / 10) * 360 = 360
    });

    it('should use default behavior when no primaryProperty specified', () => {
      const config: BevelFilterConfig = {
        type: 'bevel',
        enabled: true,
        thickness: 4,
        lightAlpha: 0.5,
        shadowAlpha: 0.6
      };

      const filter = new BevelFilter(config);

      filter.updateIntensity(createFilterIntensity(6));
      const state = filter.getState();

      // Default behavior: thickness + alpha adjustments
      expect(state.thickness).toBe(14.8); // 4 + (6 * 1.8) = 14.8
      expect(state.lightAlpha).toBeCloseTo(0.68, 2); // 0.5 + (6 * 0.03) = 0.68
      expect(state.shadowAlpha).toBeCloseTo(0.78, 2); // 0.6 + (6 * 0.03) = 0.78
    });

    it('should maintain other properties during intensity updates', () => {
      const config: BevelFilterConfig = {
        type: 'bevel',
        enabled: true,
        rotation: 60,
        lightColor: 0xff0000,
        shadowColor: 0x0000ff,
        primaryProperty: 'thickness'
      };

      const filter = new BevelFilter(config);

      filter.updateIntensity(createFilterIntensity(7));
      const state = filter.getState();

      // Non-primary properties should remain unchanged
      expect(state.rotation).toBe(60);
      expect(state.lightColor).toBe(0xff0000);
      expect(state.shadowColor).toBe(0x0000ff);
    });

    it('should cap alpha values at 1.0 in default behavior', () => {
      const config: BevelFilterConfig = {
        type: 'bevel',
        enabled: true,
        lightAlpha: 0.9,
        shadowAlpha: 0.95
      };

      const filter = new BevelFilter(config);

      filter.updateIntensity(createFilterIntensity(10));
      const state = filter.getState();

      // Should be capped at 1.0
      expect(state.lightAlpha).toBe(1); // Math.min(1, 0.9 + (10 * 0.03)) = 1
      expect(state.shadowAlpha).toBe(1); // Math.min(1, 0.95 + (10 * 0.03)) = 1
    });
  });

  describe('Reset Functionality', () => {
    it('should reset to configured values correctly', () => {
      const config: BevelFilterConfig = {
        type: 'bevel',
        enabled: true,
        rotation: 90,
        thickness: 6,
        lightColor: 0x00ff00,
        lightAlpha: 0.9,
        shadowColor: 0xff0000,
        shadowAlpha: 0.4
      };

      const filter = new BevelFilter(config);

      // Modify with intensity
      filter.updateIntensity(createFilterIntensity(8));

      // Reset
      filter.reset();
      const state = filter.getState();

      expect(state.rotation).toBe(90);
      expect(state.thickness).toBe(6);
      expect(state.lightColor).toBe(0x00ff00);
      expect(state.lightAlpha).toBe(0.9);
      expect(state.shadowColor).toBe(0xff0000);
      expect(state.shadowAlpha).toBe(0.4);
    });

    it('should reset to defaults when not configured', () => {
      const config: BevelFilterConfig = {
        type: 'bevel',
        enabled: true
      };

      const filter = new BevelFilter(config);

      // Modify with intensity
      filter.updateIntensity(createFilterIntensity(6));

      // Reset
      filter.reset();
      const state = filter.getState();

      expect(state.rotation).toBe(45);
      expect(state.thickness).toBe(2);
      expect(state.lightColor).toBe(0xffffff);
      expect(state.lightAlpha).toBe(0.7);
      expect(state.shadowColor).toBe(0x000000);
      expect(state.shadowAlpha).toBe(0.7);
    });

    it('should apply configured intensity on reset', () => {
      const config: BevelFilterConfig = {
        type: 'bevel',
        enabled: true,
        thickness: 3,
        intensity: 5,
        primaryProperty: 'thickness'
      };

      const filter = new BevelFilter(config);

      // Modify state
      filter.updateIntensity(createFilterIntensity(2));

      // Reset should apply the configured intensity
      filter.reset();

      const state = filter.getState();
      expect(state.thickness).toBe(12); // 3 + (5 * 1.8) = 12
    });

    it('should handle reset with different primary properties', () => {
      const config: BevelFilterConfig = {
        type: 'bevel',
        enabled: true,
        intensity: 8,
        primaryProperty: 'rotation'
      };

      const filter = new BevelFilter(config);

      filter.updateIntensity(createFilterIntensity(3));
      filter.reset();

      const state = filter.getState();
      expect(state.rotation).toBe(288); // (8 / 10) * 360 = 288
    });
  });

  describe('State Management', () => {
    it('should provide comprehensive state information', () => {
      const config: BevelFilterConfig = {
        type: 'bevel',
        enabled: true,
        rotation: 120,
        thickness: 4,
        lightColor: 0xffff00,
        lightAlpha: 0.8,
        shadowColor: 0xff00ff,
        shadowAlpha: 0.5,
        intensity: 6
      };

      const filter = new BevelFilter(config);
      const state = filter.getState();

      expect(state).toEqual(expect.objectContaining({
        enabled: true,
        type: 'bevel',
        rotation: expect.any(Number),
        thickness: expect.any(Number),
        lightColor: 0xffff00,
        lightAlpha: expect.any(Number),
        shadowColor: 0xff00ff,
        shadowAlpha: expect.any(Number),
        configuredRotation: 120,
        configuredThickness: 4,
        configuredLightColor: 0xffff00,
        configuredShadowColor: 0xff00ff
      }));
    });

    it('should track state changes correctly', () => {
      const config: BevelFilterConfig = {
        type: 'bevel',
        enabled: true,
        thickness: 3,
        lightAlpha: 0.6,
        primaryProperty: 'lightAlpha'
      };

      const filter = new BevelFilter(config);

      filter.updateIntensity(createFilterIntensity(4));
      const state = filter.getState();

      expect(state.configuredThickness).toBe(3);
      expect(state.thickness).toBe(3); // Should remain unchanged
      expect(state.lightAlpha).toBe(0.4); // 4 / 10 = 0.4
    });
  });

  describe('Property Validation & Edge Cases', () => {
    it('should handle zero thickness gracefully', () => {
      const config: BevelFilterConfig = {
        type: 'bevel',
        enabled: true,
        thickness: 0,
        primaryProperty: 'thickness'
      };

      const filter = new BevelFilter(config);

      filter.updateIntensity(createFilterIntensity(5));
      const state = filter.getState();

      expect(state.configuredThickness).toBe(0);
      expect(state.thickness).toBe(9); // 0 + (5 * 1.8) = 9
    });

    it('should handle undefined color configurations', () => {
      const config: BevelFilterConfig = {
        type: 'bevel',
        enabled: true
      };

      const filter = new BevelFilter(config);
      const state = filter.getState();

      expect(state.configuredLightColor).toBeUndefined();
      expect(state.configuredShadowColor).toBeUndefined();
      expect(state.lightColor).toBe(0xffffff); // Default
      expect(state.shadowColor).toBe(0x000000); // Default
    });

    it('should handle extreme rotation values', () => {
      const config: BevelFilterConfig = {
        type: 'bevel',
        enabled: true,
        rotation: 720, // Multiple rotations
        primaryProperty: 'rotation'
      };

      const filter = new BevelFilter(config);

      filter.updateIntensity(createFilterIntensity(2.5));
      const state = filter.getState();

      expect(state.configuredRotation).toBe(720);
      expect(state.rotation).toBe(90); // (2.5 / 10) * 360 = 90
    });

    it('should handle alpha edge cases', () => {
      const config: BevelFilterConfig = {
        type: 'bevel',
        enabled: true,
        lightAlpha: 0,
        shadowAlpha: 1,
        primaryProperty: 'lightAlpha'
      };

      const filter = new BevelFilter(config);

      filter.updateIntensity(createFilterIntensity(10));
      const state = filter.getState();

      expect(state.lightAlpha).toBe(1); // 10 / 10 = 1
      expect(state.shadowAlpha).toBe(1); // Should remain at configured value
    });
  });

  describe('Resource Management', () => {
    it('should dispose of PIXI filter properly', () => {
      const config: BevelFilterConfig = {
        type: 'bevel',
        enabled: true
      };

      const filter = new BevelFilter(config);

      expect(() => {
        filter.dispose();
      }).not.toThrow();
    });

    it('should handle dispose with complex configurations', () => {
      const config: BevelFilterConfig = {
        type: 'bevel',
        enabled: true,
        rotation: 135,
        thickness: 8,
        lightColor: 0x123456,
        shadowColor: 0xfedcba
      };

      const filter = new BevelFilter(config);

      expect(() => {
        filter.dispose();
      }).not.toThrow();
    });
  });

  describe('Integration Points', () => {
    it('should support FilterManager-style updates', () => {
      const config: BevelFilterConfig = {
        type: 'bevel',
        enabled: true,
        thickness: 2,
        primaryProperty: 'thickness'
      };

      const filter = new BevelFilter(config);

      // Simulate multiple rapid updates
      for (let i = 0; i < 5; i++) {
        filter.updateIntensity(createFilterIntensity(i * 2));
      }

      const state = filter.getState();
      expect(state.thickness).toBe(16.4); // Last update: intensity 8: 2 + (8 * 1.8) = 16.4
    });

    it('should maintain consistency during rapid state changes', () => {
      const config: BevelFilterConfig = {
        type: 'bevel',
        enabled: true,
        rotation: 180,
        lightColor: 0x123456,
        shadowColor: 0xabcdef,
        primaryProperty: 'rotation'
      };

      const filter = new BevelFilter(config);

      // Rapid changes
      filter.updateIntensity(createFilterIntensity(2));
      filter.updateIntensity(createFilterIntensity(8));
      filter.reset();
      filter.updateIntensity(createFilterIntensity(5));

      const state = filter.getState();
      expect(state.lightColor).toBe(0x123456);
      expect(state.shadowColor).toBe(0xabcdef);
      expect(state.configuredRotation).toBe(180);
      expect(state.rotation).toBe(180); // (5 / 10) * 360 = 180
    });

    it('should handle mixed property type updates', () => {
      const config: BevelFilterConfig = {
        type: 'bevel',
        enabled: true,
        thickness: 5,
        lightAlpha: 0.3,
        shadowAlpha: 0.8,
        primaryProperty: 'lightAlpha'
      };

      const filter = new BevelFilter(config);

      filter.updateIntensity(createFilterIntensity(6));
      filter.updateIntensity(createFilterIntensity(3));
      filter.updateIntensity(createFilterIntensity(9));

      const state = filter.getState();
      expect(state.thickness).toBe(5); // Should remain unchanged
      expect(state.lightAlpha).toBe(0.9); // 9 / 10 = 0.9
      expect(state.shadowAlpha).toBe(0.8); // Should remain unchanged
    });
  });
}); 