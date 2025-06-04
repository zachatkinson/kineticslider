/**
 * BlurFilter Unit Tests
 * 
 * Tests the BlurFilter wrapper class behavior with mocked dependencies.
 * Focuses on blur effect properties, strength scaling, and intensity mapping.
 * 
 * @module BlurFilterUnitTests
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock PIXI BlurFilter before imports
vi.mock('pixi.js', () => ({
  BlurFilter: vi.fn().mockImplementation(function(this: any, options?: any) {
    // Mock implementation of PIXI BlurFilter
    this.strength = options?.strengthX || options?.strengthY ? undefined : 8;
    this.strengthX = options?.strengthX ?? 8;
    this.strengthY = options?.strengthY ?? 8;
    this.quality = options?.quality ?? 4;
    this.kernelSize = options?.kernelSize ?? 5;
    this.resolution = options?.resolution ?? 1;
    this.repeatEdgePixels = false;
    this.enabled = true;
    
    this.destroy = vi.fn();
    return this;
  }),
  // Mock other exports that might be needed
  Filter: vi.fn().mockImplementation(function(this: any) {
    this.enabled = true;
    this.destroy = vi.fn();
    return this;
  })
}));

import { BlurFilter, type BlurFilterConfig } from '../../../filters/BlurFilter';
import { createFilterIntensity } from '../../../types/filters';

describe('BlurFilter Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Construction & Basic Properties', () => {
    it('should create filter with default configuration', () => {
      const config: BlurFilterConfig = {
        type: 'blur',
        enabled: true
      };

      const filter = new BlurFilter(config);
      const state = filter.getState();

      expect(state.enabled).toBe(true);
      expect(state.strengthX).toBe(8); // Default strength
      expect(state.strengthY).toBe(8); // Default strength
      expect(state.quality).toBe(4); // Default quality
    });

    it('should create filter with individual strength components', () => {
      const config: BlurFilterConfig = {
        type: 'blur',
        enabled: true,
        strengthX: 12,
        strengthY: 8
      };

      const filter = new BlurFilter(config);
      const state = filter.getState();

      expect(state.configuredStrengthX).toBe(12);
      expect(state.configuredStrengthY).toBe(8);
      expect(state.strengthX).toBe(12);
      expect(state.strengthY).toBe(8);
    });

    it('should create filter with quality and kernel options', () => {
      const config: BlurFilterConfig = {
        type: 'blur',
        enabled: true,
        quality: 8,
        kernelSize: 9,
        resolution: 2
      };

      const filter = new BlurFilter(config);
      const state = filter.getState();

      expect(state.quality).toBe(8);
    });

    it('should handle partial configuration with defaults', () => {
      const config: BlurFilterConfig = {
        type: 'blur',
        enabled: true,
        strengthX: 15
      };

      const filter = new BlurFilter(config);
      const state = filter.getState();

      expect(state.configuredStrengthX).toBe(15);
      expect(state.configuredStrengthY).toBeUndefined();
      expect(state.strengthX).toBe(15);
      expect(state.strengthY).toBe(8); // Default value
    });

    it('should handle intensity with individual strength configuration', () => {
      const config: BlurFilterConfig = {
        type: 'blur',
        enabled: true,
        strengthX: 10,
        strengthY: 6,
        intensity: 4
      };

      const filter = new BlurFilter(config);
      const state = filter.getState();

      expect(state.configuredStrengthX).toBe(10);
      expect(state.configuredStrengthY).toBe(6);
      // StrengthX should be: 10 + (4 * (10 * 0.5)) = 10 + 20 = 30
      expect(state.strengthX).toBeCloseTo(30);
      // StrengthY should be: 6 + (4 * (6 * 0.5)) = 6 + 12 = 18
      expect(state.strengthY).toBeCloseTo(18);
    });
  });

  describe('Intensity Updates - Individual Axis Logic', () => {
    it('should scale individual strength components correctly', () => {
      const config: BlurFilterConfig = {
        type: 'blur',
        enabled: true,
        strengthX: 10,
        strengthY: 8
      };

      const filter = new BlurFilter(config);

      // Test various intensity levels
      filter.updateIntensity(createFilterIntensity(0));
      let state = filter.getState();
      expect(state.strengthX).toBeCloseTo(10); // 10 + (0 * 5) = 10
      expect(state.strengthY).toBeCloseTo(8);  // 8 + (0 * 4) = 8

      filter.updateIntensity(createFilterIntensity(2));
      state = filter.getState();
      expect(state.strengthX).toBeCloseTo(20); // 10 + (2 * 5) = 20
      expect(state.strengthY).toBeCloseTo(16); // 8 + (2 * 4) = 16

      filter.updateIntensity(createFilterIntensity(6));
      state = filter.getState();
      expect(state.strengthX).toBeCloseTo(40); // 10 + (6 * 5) = 40
      expect(state.strengthY).toBeCloseTo(32); // 8 + (6 * 4) = 32

      filter.updateIntensity(createFilterIntensity(10));
      state = filter.getState();
      expect(state.strengthX).toBeCloseTo(60); // 10 + (10 * 5) = 60
      expect(state.strengthY).toBeCloseTo(48); // 8 + (10 * 4) = 48
    });

    it('should use default values when only one axis is configured', () => {
      const config: BlurFilterConfig = {
        type: 'blur',
        enabled: true,
        strengthX: 16
      };

      const filter = new BlurFilter(config);

      filter.updateIntensity(createFilterIntensity(3));
      const state = filter.getState();

      expect(state.strengthX).toBeCloseTo(40); // 16 + (3 * 8) = 40
      expect(state.strengthY).toBeCloseTo(20); // 8 + (3 * 4) = 20 (using default 8)
    });

    it('should handle zero intensity gracefully', () => {
      const config: BlurFilterConfig = {
        type: 'blur',
        enabled: true,
        strengthX: 12,
        strengthY: 10
      };

      const filter = new BlurFilter(config);

      filter.updateIntensity(createFilterIntensity(0));
      const state = filter.getState();

      expect(state.strengthX).toBeCloseTo(12); // No change
      expect(state.strengthY).toBeCloseTo(10); // No change
    });
  });

  describe('Intensity Updates - Overall Strength Logic', () => {
    it('should scale overall strength when no individual components configured', () => {
      const config: BlurFilterConfig = {
        type: 'blur',
        enabled: true
      };

      const filter = new BlurFilter(config);

      // Test various intensity levels
      filter.updateIntensity(createFilterIntensity(0));
      let state = filter.getState();
      expect(state.strength).toBeCloseTo(8); // 8 + (0 * 9.2) = 8

      filter.updateIntensity(createFilterIntensity(3));
      state = filter.getState();
      expect(state.strength).toBeCloseTo(35.6); // 8 + (3 * 9.2) = 35.6

      filter.updateIntensity(createFilterIntensity(5));
      state = filter.getState();
      expect(state.strength).toBeCloseTo(54); // 8 + (5 * 9.2) = 54

      filter.updateIntensity(createFilterIntensity(10));
      state = filter.getState();
      expect(state.strength).toBeCloseTo(100); // 8 + (10 * 9.2) = 100
    });

    it('should maintain other properties during overall strength updates', () => {
      const config: BlurFilterConfig = {
        type: 'blur',
        enabled: true,
        quality: 6
      };

      const filter = new BlurFilter(config);

      filter.updateIntensity(createFilterIntensity(7));
      const state = filter.getState();

      expect(state.strength).toBeCloseTo(72.4); // 8 + (7 * 9.2) = 72.4
      expect(state.quality).toBe(6); // Should remain unchanged
    });
  });

  describe('Reset Functionality', () => {
    it('should reset to individual strength configurations', () => {
      const config: BlurFilterConfig = {
        type: 'blur',
        enabled: true,
        strengthX: 14,
        strengthY: 10,
        intensity: 5
      };

      const filter = new BlurFilter(config);

      // Modify with intensity
      filter.updateIntensity(createFilterIntensity(8));

      // Reset should apply configured intensity
      filter.reset();
      const state = filter.getState();

      expect(state.strengthX).toBeCloseTo(49); // 14 + (5 * 7) = 49
      expect(state.strengthY).toBeCloseTo(35); // 10 + (5 * 5) = 35
    });

    it('should reset to defaults when no strength configured', () => {
      const config: BlurFilterConfig = {
        type: 'blur',
        enabled: true
      };

      const filter = new BlurFilter(config);

      // Modify with intensity
      filter.updateIntensity(createFilterIntensity(6));

      // Reset
      filter.reset();
      const state = filter.getState();

      expect(state.strength).toBe(8); // Default
      expect(state.strengthX).toBe(8); // Default
      expect(state.strengthY).toBe(8); // Default
    });

    it('should not apply intensity when no strength properties configured', () => {
      const config: BlurFilterConfig = {
        type: 'blur',
        enabled: true,
        intensity: 7 // This should be ignored for reset
      };

      const filter = new BlurFilter(config);

      filter.updateIntensity(createFilterIntensity(3));
      filter.reset();
      const state = filter.getState();

      // Should reset to defaults, not apply intensity
      expect(state.strength).toBe(8);
      expect(state.strengthX).toBe(8);
      expect(state.strengthY).toBe(8);
    });

    it('should handle reset with partial strength configuration', () => {
      const config: BlurFilterConfig = {
        type: 'blur',
        enabled: true,
        strengthY: 12,
        intensity: 3
      };

      const filter = new BlurFilter(config);

      filter.updateIntensity(createFilterIntensity(7));
      filter.reset();

      const state = filter.getState();
      expect(state.strengthX).toBeCloseTo(20); // 8 + (3 * 4) = 20 (default base)
      expect(state.strengthY).toBeCloseTo(30); // 12 + (3 * 6) = 30
    });
  });

  describe('State Management', () => {
    it('should provide comprehensive state information', () => {
      const config: BlurFilterConfig = {
        type: 'blur',
        enabled: true,
        strengthX: 15,
        strengthY: 12,
        quality: 6,
        intensity: 4
      };

      const filter = new BlurFilter(config);
      const state = filter.getState();

      expect(state).toEqual(expect.objectContaining({
        enabled: true,
        type: 'blur',
        strengthX: expect.any(Number),
        strengthY: expect.any(Number),
        quality: 6,
        configuredStrengthX: 15,
        configuredStrengthY: 12
      }));
    });

    it('should track state changes correctly', () => {
      const config: BlurFilterConfig = {
        type: 'blur',
        enabled: true,
        strengthX: 8,
        strengthY: 6
      };

      const filter = new BlurFilter(config);

      filter.updateIntensity(createFilterIntensity(4));
      const state = filter.getState();

      expect(state.configuredStrengthX).toBe(8);
      expect(state.configuredStrengthY).toBe(6);
      expect(state.strengthX).toBeCloseTo(24); // 8 + (4 * 4) = 24
      expect(state.strengthY).toBeCloseTo(18); // 6 + (4 * 3) = 18
    });

    it('should handle state with overall strength configuration', () => {
      const config: BlurFilterConfig = {
        type: 'blur',
        enabled: true,
        quality: 8
      };

      const filter = new BlurFilter(config);
      filter.updateIntensity(createFilterIntensity(6));
      const state = filter.getState();

      expect(state.strength).toBeCloseTo(63.2); // 8 + (6 * 9.2) = 63.2
      expect(state.quality).toBe(8);
    });
  });

  describe('Property Validation & Edge Cases', () => {
    it('should handle zero strength values', () => {
      const config: BlurFilterConfig = {
        type: 'blur',
        enabled: true,
        strengthX: 0,
        strengthY: 0
      };

      const filter = new BlurFilter(config);
      const state = filter.getState();

      expect(state.configuredStrengthX).toBe(0);
      expect(state.configuredStrengthY).toBe(0);
      expect(state.strengthX).toBe(0);
      expect(state.strengthY).toBe(0);
    });

    it('should handle undefined strength configurations', () => {
      const config: BlurFilterConfig = {
        type: 'blur',
        enabled: true
      };

      const filter = new BlurFilter(config);
      const state = filter.getState();

      expect(state.configuredStrengthX).toBeUndefined();
      expect(state.configuredStrengthY).toBeUndefined();
    });

    it('should handle large strength values', () => {
      const config: BlurFilterConfig = {
        type: 'blur',
        enabled: true,
        strengthX: 100,
        strengthY: 200
      };

      const filter = new BlurFilter(config);

      filter.updateIntensity(createFilterIntensity(5));
      const state = filter.getState();

      expect(state.configuredStrengthX).toBe(100);
      expect(state.configuredStrengthY).toBe(200);
      expect(state.strengthX).toBeCloseTo(350); // 100 + (5 * 50) = 350
      expect(state.strengthY).toBeCloseTo(700); // 200 + (5 * 100) = 700
    });

    it('should handle advanced blur configuration options', () => {
      const config: BlurFilterConfig = {
        type: 'blur',
        enabled: true,
        quality: 12,
        kernelSize: 13,
        resolution: 0.5,
        repeatEdgePixels: true
      };

      const filter = new BlurFilter(config);
      const state = filter.getState();

      expect(state.quality).toBe(12);
      // Note: kernelSize, resolution, and repeatEdgePixels are set during construction
      // and may not be directly accessible in state, but should be configured
    });
  });

  describe('Resource Management', () => {
    it('should dispose of PIXI filter properly', () => {
      const config: BlurFilterConfig = {
        type: 'blur',
        enabled: true
      };

      const filter = new BlurFilter(config);

      expect(() => {
        filter.dispose();
      }).not.toThrow();
    });

    it('should handle dispose with complex configurations', () => {
      const config: BlurFilterConfig = {
        type: 'blur',
        enabled: true,
        strengthX: 25,
        strengthY: 18,
        quality: 8,
        kernelSize: 11
      };

      const filter = new BlurFilter(config);

      expect(() => {
        filter.dispose();
      }).not.toThrow();
    });
  });

  describe('Integration Points', () => {
    it('should support FilterManager-style updates', () => {
      const config: BlurFilterConfig = {
        type: 'blur',
        enabled: true,
        strengthX: 10,
        strengthY: 8
      };

      const filter = new BlurFilter(config);

      // Simulate multiple rapid updates
      for (let i = 0; i < 5; i++) {
        filter.updateIntensity(createFilterIntensity(i * 2));
      }

      const state = filter.getState();
      // Last update: intensity 8
      expect(state.strengthX).toBeCloseTo(50); // 10 + (8 * 5) = 50
      expect(state.strengthY).toBeCloseTo(40); // 8 + (8 * 4) = 40
    });

    it('should maintain consistency during rapid state changes', () => {
      const config: BlurFilterConfig = {
        type: 'blur',
        enabled: true,
        strengthX: 12,
        strengthY: 9,
        quality: 6
      };

      const filter = new BlurFilter(config);

      // Rapid changes
      filter.updateIntensity(createFilterIntensity(3));
      filter.updateIntensity(createFilterIntensity(7));
      filter.reset();
      filter.updateIntensity(createFilterIntensity(5));

      const state = filter.getState();
      expect(state.configuredStrengthX).toBe(12);
      expect(state.configuredStrengthY).toBe(9);
      expect(state.quality).toBe(6);
      // Since strengthX and strengthY are configured, it remains in individual axis mode
      // Final intensity 5: strengthX = 12 + (5 * 6) = 42, strengthY = 9 + (5 * 4.5) = 31.5
      expect(state.strengthX).toBeCloseTo(42); // 12 + (5 * 6) = 42
      expect(state.strengthY).toBeCloseTo(31.5); // 9 + (5 * 4.5) = 31.5
    });

    it('should handle mixed configuration types', () => {
      const config: BlurFilterConfig = {
        type: 'blur',
        enabled: true,
        strengthY: 14, // Only Y configured
        quality: 10,
        kernelSize: 7
      };

      const filter = new BlurFilter(config);

      filter.updateIntensity(createFilterIntensity(4));
      const state = filter.getState();

      expect(state.configuredStrengthX).toBeUndefined(); // Not configured
      expect(state.configuredStrengthY).toBe(14); // Configured
      expect(state.strengthX).toBeCloseTo(24); // 8 + (4 * 4) = 24 (default base)
      expect(state.strengthY).toBeCloseTo(42); // 14 + (4 * 7) = 42
    });
  });
}); 