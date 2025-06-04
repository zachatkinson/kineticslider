/**
 * BloomFilter Unit Tests
 * 
 * Tests the BloomFilter wrapper class behavior with mocked dependencies.
 * Focuses on bloom effect properties, strength scaling, and intensity mapping.
 * 
 * @module BloomFilterUnitTests
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock PIXI BloomFilter before imports
vi.mock('pixi-filters', () => ({
  BloomFilter: vi.fn().mockImplementation(function(this: any) {
    // Mock implementation of PIXI BloomFilter
    this.strength = { x: 2, y: 2 }; // Default strength as PointData
    this.strengthX = 2; // Default X strength
    this.strengthY = 2; // Default Y strength
    this.enabled = true;
    
    this.destroy = vi.fn();
    return this;
  })
}));

import { BloomFilter, type BloomFilterConfig } from '../../../filters/BloomFilter';
import { createFilterIntensity } from '../../../types/filters';

describe('BloomFilter Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Debug - Basic Constructor', () => {
    it('should be able to import BloomFilter class', () => {
      expect(BloomFilter).toBeDefined();
      expect(typeof BloomFilter).toBe('function');
    });

    it('should create filter with minimal config', () => {
      const config = {
        type: 'bloom' as const,
        enabled: true
      };

      const filter = new BloomFilter(config);
      
      expect(filter).toBeDefined();
      expect(filter.getState).toBeDefined();
    });
  });

  describe('Construction & Basic Properties', () => {
    it('should create filter with default configuration', () => {
      const config: BloomFilterConfig = {
        type: 'bloom',
        enabled: true
      };

      const filter = new BloomFilter(config);
      const state = filter.getState();

      expect(state.enabled).toBe(true);
      expect(state.strengthX).toBe(2); // Default strength
      expect(state.strengthY).toBe(2); // Default strength
    });

    it('should create filter with strength PointData configuration', () => {
      const config: BloomFilterConfig = {
        type: 'bloom',
        enabled: true,
        strength: { x: 5, y: 3 }
      };

      const filter = new BloomFilter(config);
      const state = filter.getState();

      expect(state.configuredStrength).toEqual({ x: 5, y: 3 });
      expect(state.strength).toEqual({ x: 5, y: 3 });
    });

    it('should create filter with individual strength components', () => {
      const config: BloomFilterConfig = {
        type: 'bloom',
        enabled: true,
        strengthX: 4,
        strengthY: 6
      };

      const filter = new BloomFilter(config);
      const state = filter.getState();

      expect(state.configuredStrengthX).toBe(4);
      expect(state.configuredStrengthY).toBe(6);
      expect(state.strengthX).toBe(4);
      expect(state.strengthY).toBe(6);
    });

    it('should handle partial configuration with defaults', () => {
      const config: BloomFilterConfig = {
        type: 'bloom',
        enabled: true,
        strengthX: 8
      };

      const filter = new BloomFilter(config);
      const state = filter.getState();

      expect(state.configuredStrengthX).toBe(8);
      expect(state.configuredStrengthY).toBeUndefined();
      expect(state.strengthX).toBe(8);
      expect(state.strengthY).toBe(2); // Default value
    });

    it('should handle intensity with strength configuration', () => {
      const config: BloomFilterConfig = {
        type: 'bloom',
        enabled: true,
        strengthX: 3,
        intensity: 4,
        primaryProperty: 'strengthX'
      };

      const filter = new BloomFilter(config);
      const state = filter.getState();

      expect(state.configuredStrengthX).toBe(3);
      // StrengthX should be: 4 * 2 = 8 (intensity overrides config)
      expect(state.strengthX).toBe(8);
    });
  });

  describe('Intensity Updates - Primary Property Logic', () => {
    it('should scale overall strength when primaryProperty is strength', () => {
      const config: BloomFilterConfig = {
        type: 'bloom',
        enabled: true,
        primaryProperty: 'strength'
      };

      const filter = new BloomFilter(config);

      // Test various intensity levels
      filter.updateIntensity(createFilterIntensity(0));
      let state = filter.getState();
      expect(state.strength).toBe(0); // 0 * 2 = 0

      filter.updateIntensity(createFilterIntensity(3));
      state = filter.getState();
      expect(state.strength).toBe(6); // 3 * 2 = 6

      filter.updateIntensity(createFilterIntensity(5));
      state = filter.getState();
      expect(state.strength).toBe(10); // 5 * 2 = 10

      filter.updateIntensity(createFilterIntensity(10));
      state = filter.getState();
      expect(state.strength).toBe(20); // 10 * 2 = 20
    });

    it('should scale strengthX when primaryProperty is strengthX', () => {
      const config: BloomFilterConfig = {
        type: 'bloom',
        enabled: true,
        primaryProperty: 'strengthX'
      };

      const filter = new BloomFilter(config);

      // Test various intensity levels
      filter.updateIntensity(createFilterIntensity(2));
      let state = filter.getState();
      expect(state.strengthX).toBe(4); // 2 * 2 = 4

      filter.updateIntensity(createFilterIntensity(6));
      state = filter.getState();
      expect(state.strengthX).toBe(12); // 6 * 2 = 12

      filter.updateIntensity(createFilterIntensity(10));
      state = filter.getState();
      expect(state.strengthX).toBe(20); // 10 * 2 = 20
    });

    it('should scale strengthY when primaryProperty is strengthY', () => {
      const config: BloomFilterConfig = {
        type: 'bloom',
        enabled: true,
        primaryProperty: 'strengthY'
      };

      const filter = new BloomFilter(config);

      filter.updateIntensity(createFilterIntensity(1));
      let state = filter.getState();
      expect(state.strengthY).toBe(2); // 1 * 2 = 2

      filter.updateIntensity(createFilterIntensity(7));
      state = filter.getState();
      expect(state.strengthY).toBe(14); // 7 * 2 = 14
    });

    it('should use default behavior when no primaryProperty specified', () => {
      const config: BloomFilterConfig = {
        type: 'bloom',
        enabled: true
      };

      const filter = new BloomFilter(config);

      filter.updateIntensity(createFilterIntensity(5));
      const state = filter.getState();

      // Default behavior: adjust overall strength
      expect(state.strength).toBe(10); // 5 * 2 = 10
    });

    it('should maintain other properties during intensity updates', () => {
      const config: BloomFilterConfig = {
        type: 'bloom',
        enabled: true,
        strengthX: 4,
        strengthY: 6,
        primaryProperty: 'strengthX'
      };

      const filter = new BloomFilter(config);

      filter.updateIntensity(createFilterIntensity(3));
      const state = filter.getState();

      // Primary property should change
      expect(state.strengthX).toBe(6); // 3 * 2 = 6
      // Other configured properties should remain from initial setup
      expect(state.configuredStrengthX).toBe(4);
      expect(state.configuredStrengthY).toBe(6);
    });

    it('should handle zero intensity gracefully', () => {
      const config: BloomFilterConfig = {
        type: 'bloom',
        enabled: true,
        primaryProperty: 'strength'
      };

      const filter = new BloomFilter(config);

      filter.updateIntensity(createFilterIntensity(0));
      const state = filter.getState();

      expect(state.strength).toBe(0); // 0 * 2 = 0
    });

    it('should handle maximum intensity values', () => {
      const config: BloomFilterConfig = {
        type: 'bloom',
        enabled: true,
        primaryProperty: 'strengthY'
      };

      const filter = new BloomFilter(config);

      filter.updateIntensity(createFilterIntensity(10));
      const state = filter.getState();

      expect(state.strengthY).toBe(20); // 10 * 2 = 20
    });
  });

  describe('Reset Functionality', () => {
    it('should reset to strength PointData configuration', () => {
      const config: BloomFilterConfig = {
        type: 'bloom',
        enabled: true,
        strength: { x: 7, y: 5 }
      };

      const filter = new BloomFilter(config);

      // Modify with intensity
      filter.updateIntensity(createFilterIntensity(8));

      // Reset
      filter.reset();
      const state = filter.getState();

      expect(state.strength).toEqual({ x: 7, y: 5 });
    });

    it('should reset individual strength components', () => {
      const config: BloomFilterConfig = {
        type: 'bloom',
        enabled: true,
        strengthX: 6,
        strengthY: 4
      };

      const filter = new BloomFilter(config);

      // Modify with intensity
      filter.updateIntensity(createFilterIntensity(3));

      // Reset
      filter.reset();
      const state = filter.getState();

      expect(state.strengthX).toBe(6);
      expect(state.strengthY).toBe(4);
    });

    it('should reset to defaults when not configured', () => {
      const config: BloomFilterConfig = {
        type: 'bloom',
        enabled: true
      };

      const filter = new BloomFilter(config);

      // Modify with intensity
      filter.updateIntensity(createFilterIntensity(6));

      // Reset
      filter.reset();
      const state = filter.getState();

      expect(state.strengthX).toBe(2); // Default
      expect(state.strengthY).toBe(2); // Default
    });

    it('should apply configured intensity on reset', () => {
      const config: BloomFilterConfig = {
        type: 'bloom',
        enabled: true,
        strengthX: 3,
        intensity: 4,
        primaryProperty: 'strengthX'
      };

      const filter = new BloomFilter(config);

      // Modify state
      filter.updateIntensity(createFilterIntensity(1));

      // Reset should apply the configured intensity
      filter.reset();

      const state = filter.getState();
      expect(state.strengthX).toBe(8); // 4 * 2 = 8 (configured intensity)
    });

    it('should handle reset with strength and individual components', () => {
      const config: BloomFilterConfig = {
        type: 'bloom',
        enabled: true,
        strengthY: 8,
        intensity: 3,
        primaryProperty: 'strengthY'
      };

      const filter = new BloomFilter(config);

      filter.updateIntensity(createFilterIntensity(7));
      filter.reset();

      const state = filter.getState();
      expect(state.strengthX).toBe(2); // Default (not configured)
      expect(state.strengthY).toBe(6); // 3 * 2 = 6 (configured intensity)
    });
  });

  describe('State Management', () => {
    it('should provide comprehensive state information', () => {
      const config: BloomFilterConfig = {
        type: 'bloom',
        enabled: true,
        strengthX: 5,
        strengthY: 3,
        intensity: 4
      };

      const filter = new BloomFilter(config);
      const state = filter.getState();

      expect(state).toEqual(expect.objectContaining({
        enabled: true,
        type: 'bloom',
        strengthX: expect.any(Number),
        strengthY: expect.any(Number),
        configuredStrengthX: 5,
        configuredStrengthY: 3
      }));
    });

    it('should track state changes correctly', () => {
      const config: BloomFilterConfig = {
        type: 'bloom',
        enabled: true,
        strengthX: 4,
        primaryProperty: 'strengthX'
      };

      const filter = new BloomFilter(config);

      filter.updateIntensity(createFilterIntensity(6));
      const state = filter.getState();

      expect(state.configuredStrengthX).toBe(4);
      expect(state.strengthX).toBe(12); // 6 * 2 = 12
    });

    it('should handle state with PointData strength', () => {
      const config: BloomFilterConfig = {
        type: 'bloom',
        enabled: true,
        strength: { x: 8, y: 6 }
      };

      const filter = new BloomFilter(config);
      const state = filter.getState();

      expect(state.configuredStrength).toEqual({ x: 8, y: 6 });
      expect(state.strength).toEqual({ x: 8, y: 6 });
    });
  });

  describe('Property Validation & Edge Cases', () => {
    it('should handle zero strength values', () => {
      const config: BloomFilterConfig = {
        type: 'bloom',
        enabled: true,
        strengthX: 0,
        strengthY: 0
      };

      const filter = new BloomFilter(config);
      const state = filter.getState();

      expect(state.configuredStrengthX).toBe(0);
      expect(state.configuredStrengthY).toBe(0);
      expect(state.strengthX).toBe(0);
      expect(state.strengthY).toBe(0);
    });

    it('should handle undefined strength configurations', () => {
      const config: BloomFilterConfig = {
        type: 'bloom',
        enabled: true
      };

      const filter = new BloomFilter(config);
      const state = filter.getState();

      expect(state.configuredStrength).toBeUndefined();
      expect(state.configuredStrengthX).toBeUndefined();
      expect(state.configuredStrengthY).toBeUndefined();
    });

    it('should handle large strength values', () => {
      const config: BloomFilterConfig = {
        type: 'bloom',
        enabled: true,
        strengthX: 100,
        strengthY: 200,
        primaryProperty: 'strengthX'
      };

      const filter = new BloomFilter(config);

      filter.updateIntensity(createFilterIntensity(5));
      const state = filter.getState();

      expect(state.configuredStrengthX).toBe(100);
      expect(state.configuredStrengthY).toBe(200);
      expect(state.strengthX).toBe(10); // 5 * 2 = 10 (overridden by intensity)
    });

    it('should handle mixed PointData and individual configuration', () => {
      const config: BloomFilterConfig = {
        type: 'bloom',
        enabled: true,
        strength: { x: 10, y: 15 },
        strengthX: 20 // This should be ignored in favor of strength
      };

      const filter = new BloomFilter(config);
      const state = filter.getState();

      expect(state.configuredStrength).toEqual({ x: 10, y: 15 });
      expect(state.configuredStrengthX).toBe(20);
      expect(state.strength).toEqual({ x: 10, y: 15 }); // PointData takes precedence
    });
  });

  describe('Resource Management', () => {
    it('should dispose of PIXI filter properly', () => {
      const config: BloomFilterConfig = {
        type: 'bloom',
        enabled: true
      };

      const filter = new BloomFilter(config);

      expect(() => {
        filter.dispose();
      }).not.toThrow();
    });

    it('should handle dispose with complex configurations', () => {
      const config: BloomFilterConfig = {
        type: 'bloom',
        enabled: true,
        strengthX: 15,
        strengthY: 8,
        primaryProperty: 'strengthY'
      };

      const filter = new BloomFilter(config);

      expect(() => {
        filter.dispose();
      }).not.toThrow();
    });
  });

  describe('Integration Points', () => {
    it('should support FilterManager-style updates', () => {
      const config: BloomFilterConfig = {
        type: 'bloom',
        enabled: true,
        primaryProperty: 'strength'
      };

      const filter = new BloomFilter(config);

      // Simulate multiple rapid updates
      for (let i = 0; i < 5; i++) {
        filter.updateIntensity(createFilterIntensity(i * 2));
      }

      const state = filter.getState();
      expect(state.strength).toBe(16); // Last update: intensity 8: 8 * 2 = 16
    });

    it('should maintain consistency during rapid state changes', () => {
      const config: BloomFilterConfig = {
        type: 'bloom',
        enabled: true,
        strengthX: 6,
        strengthY: 4,
        primaryProperty: 'strengthX'
      };

      const filter = new BloomFilter(config);

      // Rapid changes
      filter.updateIntensity(createFilterIntensity(2));
      filter.updateIntensity(createFilterIntensity(8));
      filter.reset();
      filter.updateIntensity(createFilterIntensity(5));

      const state = filter.getState();
      expect(state.configuredStrengthX).toBe(6);
      expect(state.configuredStrengthY).toBe(4);
      expect(state.strengthX).toBe(10); // 5 * 2 = 10
    });

    it('should handle mixed property type updates', () => {
      const config: BloomFilterConfig = {
        type: 'bloom',
        enabled: true,
        strengthX: 5,
        strengthY: 8,
        primaryProperty: 'strengthY'
      };

      const filter = new BloomFilter(config);

      filter.updateIntensity(createFilterIntensity(3));
      filter.updateIntensity(createFilterIntensity(7));
      filter.updateIntensity(createFilterIntensity(1));

      const state = filter.getState();
      expect(state.configuredStrengthX).toBe(5); // Should remain unchanged
      expect(state.strengthY).toBe(2); // 1 * 2 = 2 (only primary property changes)
    });

    it('should support default and primary property switching', () => {
      const config: BloomFilterConfig = {
        type: 'bloom',
        enabled: true,
        strengthX: 10,
        strengthY: 12
      };

      const filter = new BloomFilter(config);

      // No primary property, should default to strength
      filter.updateIntensity(createFilterIntensity(4));
      const state = filter.getState();

      expect(state.strength).toBe(8); // 4 * 2 = 8 (default behavior)
    });
  });
}); 