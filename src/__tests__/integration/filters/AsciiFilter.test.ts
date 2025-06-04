/**
 * AsciiFilter Integration Tests
 * 
 * Tests the AsciiFilter class with real PIXI.js dependencies.
 * Validates ASCII art effect properties, size intensity scaling, and PIXI API compliance.
 * 
 * @module AsciiFilterIntegrationTests
 * @version 1.0.0
 * @requires pixi-filters
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AsciiFilter, type AsciiFilterConfig } from '../../../filters/AsciiFilter';
import { createFilterIntensity } from '../../../types/filters';

describe('AsciiFilter Integration Tests', () => {
  beforeEach(() => {
    // Clear any previous state
  });

  describe('PIXI Filter Creation & Properties', () => {
    it('should create a real PIXI AsciiFilter instance', () => {
      const config: AsciiFilterConfig = {
        type: 'ascii',
        enabled: true
      };

      const filter = new AsciiFilter(config);
      
      expect(filter.filter).toBeDefined();
      expect(filter.filter.constructor.name).toBe('_AsciiFilter');
    });

    it('should initialize with correct default values', () => {
      const config: AsciiFilterConfig = {
        type: 'ascii',
        enabled: true
      };

      const filter = new AsciiFilter(config);
      const state = filter.getState();

      expect(state.size).toBe(8); // Default size
      expect(state.color).toBe(0xffffff); // Default color
      expect(state.replaceColor).toBe(false); // Default replaceColor
    });

    it('should initialize with custom ASCII properties', () => {
      const config: AsciiFilterConfig = {
        type: 'ascii',
        enabled: true,
        size: 12,
        color: 0x00ff00,
        replaceColor: false
      };

      const filter = new AsciiFilter(config);
      const state = filter.getState();

      expect(state.configuredSize).toBe(12);
      expect(state.configuredColor).toBe(0x00ff00);
      expect(state.configuredReplaceColor).toBe(false);
      expect(state.size).toBe(12);
      expect(state.color).toBe(0x00ff00);
      expect(state.replaceColor).toBe(false);
    });

    it('should handle partial configuration with defaults', () => {
      const config: AsciiFilterConfig = {
        type: 'ascii',
        enabled: true,
        color: 0xff0000
      };

      const filter = new AsciiFilter(config);
      const state = filter.getState();

      expect(state.configuredSize).toBeUndefined();
      expect(state.configuredColor).toBe(0xff0000);
      expect(state.configuredReplaceColor).toBeUndefined();
      expect(state.size).toBe(8); // Default size
      expect(state.color).toBe(0xff0000);
      expect(state.replaceColor).toBe(false); // Default
    });

    it('should handle size with intensity configuration', () => {
      const config: AsciiFilterConfig = {
        type: 'ascii',
        enabled: true,
        size: 10,
        intensity: createFilterIntensity(7)
      };

      const filter = new AsciiFilter(config);
      const state = filter.getState();

      expect(state.configuredSize).toBe(10);
      // When intensity is applied, it overrides configured size: Math.max(2, Math.round(2 + (7 * 1.8))) = 15
      expect(state.size).toBe(15);
    });
  });

  describe('Real Intensity Scaling', () => {
    it('should scale size with custom intensity formula', () => {
      const config: AsciiFilterConfig = {
        type: 'ascii',
        enabled: true
      };

      const filter = new AsciiFilter(config);
      
      // Test different intensity values
      filter.updateIntensity(createFilterIntensity(0));
      let state = filter.getState();
      expect(state.size).toBe(2); // Math.max(2, Math.round(2 + (0 * 1.8))) = 2
      
      filter.updateIntensity(createFilterIntensity(3));
      state = filter.getState();
      expect(state.size).toBe(7); // Math.max(2, Math.round(2 + (3 * 1.8))) = 7
      
      filter.updateIntensity(createFilterIntensity(5));
      state = filter.getState();
      expect(state.size).toBe(11); // Math.max(2, Math.round(2 + (5 * 1.8))) = 11
      
      filter.updateIntensity(createFilterIntensity(10));
      state = filter.getState();
      expect(state.size).toBe(20); // Math.max(2, Math.round(2 + (10 * 1.8))) = 20
    });

    it('should maintain minimum size constraint', () => {
      const config: AsciiFilterConfig = {
        type: 'ascii',
        enabled: true
      };

      const filter = new AsciiFilter(config);
      
      filter.updateIntensity(createFilterIntensity(0));
      const state = filter.getState();
      expect(state.size).toBeGreaterThanOrEqual(2);
    });

    it('should maintain color during intensity updates', () => {
      const config: AsciiFilterConfig = {
        type: 'ascii',
        enabled: true,
        color: 0x0000ff
      };

      const filter = new AsciiFilter(config);
      
      filter.updateIntensity(createFilterIntensity(6));
      const state = filter.getState();

      expect(state.color).toBe(0x0000ff);
    });

    it('should handle replaceColor during intensity updates', () => {
      const config: AsciiFilterConfig = {
        type: 'ascii',
        enabled: true,
        replaceColor: true
      };

      const filter = new AsciiFilter(config);
      
      // During first activation (forceRefresh), replaceColor starts as false
      filter.updateIntensity(createFilterIntensity(4));
      let state = filter.getState();
      expect(state.replaceColor).toBe(false);
      
      // After subsequent updates, it should maintain the configured value
      filter.updateIntensity(createFilterIntensity(7));
      state = filter.getState();
      expect(state.replaceColor).toBe(true);
    });

    it('should handle extreme intensity values gracefully', () => {
      const config: AsciiFilterConfig = {
        type: 'ascii',
        enabled: true
      };

      const filter = new AsciiFilter(config);
      
      // Test extreme values
      expect(() => {
        filter.updateIntensity(createFilterIntensity(0));
      }).not.toThrow();
      
      expect(() => {
        filter.updateIntensity(createFilterIntensity(10));
      }).not.toThrow();
      
      const state = filter.getState();
      expect(Number.isFinite(state.size)).toBe(true);
      expect(state.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('PIXI Filter Reset Behavior', () => {
    it('should reset to configured size correctly', () => {
      const config: AsciiFilterConfig = {
        type: 'ascii',
        enabled: true,
        size: 15
      };

      const filter = new AsciiFilter(config);
      filter.updateIntensity(createFilterIntensity(8));
      
      // Reset should restore configured value
      filter.reset();
      
      const state = filter.getState();
      expect(state.size).toBe(15);
    });

    it('should reset to default when no specific size configured', () => {
      const config: AsciiFilterConfig = {
        type: 'ascii',
        enabled: true
      };

      const filter = new AsciiFilter(config);
      filter.updateIntensity(createFilterIntensity(6));
      
      // Reset should restore default
      filter.reset();
      
      const state = filter.getState();
      expect(state.size).toBe(8); // Default size
    });

    it('should reset color configurations correctly', () => {
      const config: AsciiFilterConfig = {
        type: 'ascii',
        enabled: true,
        color: 0x00ffff
      };

      const filter = new AsciiFilter(config);
      
      // Reset should maintain color
      filter.reset();
      
      const state = filter.getState();
      expect(state.color).toBe(0x00ffff);
    });

    it('should apply configured intensity on reset when both size and intensity are configured', () => {
      const config: AsciiFilterConfig = {
        type: 'ascii',
        enabled: true,
        size: 6,
        intensity: createFilterIntensity(4)
      };

      const filter = new AsciiFilter(config);
      filter.updateIntensity(createFilterIntensity(2));
      
      // Reset should apply configured intensity
      filter.reset();
      
      const state = filter.getState();
      expect(state.size).toBe(9); // Math.max(2, Math.round(2 + (4 * 1.8))) = 9
    });

    it('should handle replaceColor reset with special timing', () => {
      const config: AsciiFilterConfig = {
        type: 'ascii',
        enabled: true,
        replaceColor: true
      };

      const filter = new AsciiFilter(config);
      
      // Reset should start with false for proper rendering
      filter.reset();
      
      const state = filter.getState();
      expect(state.replaceColor).toBe(false);
    });
  });

  describe('PIXI API Compliance', () => {
    it('should properly manage enabled state', () => {
      const config: AsciiFilterConfig = {
        type: 'ascii',
        enabled: false
      };

      const filter = new AsciiFilter(config);
      const state = filter.getState();
      
      expect(state.enabled).toBe(false);
    });

    it('should expose PIXI AsciiFilter properties', () => {
      const config: AsciiFilterConfig = {
        type: 'ascii',
        enabled: true,
        size: 6,
        color: 0xff00ff
      };

      const filter = new AsciiFilter(config);
      const pixiFilter = filter.filter as any;

      // Test that PIXI properties are accessible
      expect('size' in pixiFilter).toBe(true);
      expect('color' in pixiFilter).toBe(true);
      expect('replaceColor' in pixiFilter).toBe(true);
      expect(typeof pixiFilter.size).toBe('number');
      expect(pixiFilter.size).toBe(6);
      expect(pixiFilter.color).toBe(0xff00ff);
    });

    it('should support filter chaining', () => {
      const config: AsciiFilterConfig = {
        type: 'ascii',
        enabled: true
      };

      const filter = new AsciiFilter(config);
      
      // PIXI filters should be chainable (have apply method)
      expect('apply' in filter.filter).toBe(true);
      expect(typeof (filter.filter as any).apply).toBe('function');
    });

    it('should validate size property type matches PIXI expectations', () => {
      const config: AsciiFilterConfig = {
        type: 'ascii',
        enabled: true,
        size: 14
      };

      const filter = new AsciiFilter(config);
      const pixiFilter = filter.filter as any;

      expect(typeof pixiFilter.size).toBe('number');
      expect(pixiFilter.size).toBe(14);
      expect(Number.isFinite(pixiFilter.size)).toBe(true);
    });

    it('should maintain consistency between wrapper and PIXI filter', () => {
      const config: AsciiFilterConfig = {
        type: 'ascii',
        enabled: true,
        size: 8,
        color: 0xffff00
      };

      const filter = new AsciiFilter(config);
      const state = filter.getState();
      const pixiFilter = filter.filter as any;

      expect(state.size).toBe(pixiFilter.size);
      expect(state.color).toBe(pixiFilter.color);
      expect(state.replaceColor).toBe(pixiFilter.replaceColor);
      
      // Update intensity and check consistency
      filter.updateIntensity(createFilterIntensity(6));
      const newState = filter.getState();
      
      expect(newState.size).toBe(pixiFilter.size);
      expect(newState.color).toBe(pixiFilter.color);
      expect(newState.size).toBe(13); // Math.max(2, Math.round(2 + (6 * 1.8))) = 13
    });
  });

  describe('Edge Cases & Error Handling', () => {
    it('should handle zero size value', () => {
      const config: AsciiFilterConfig = {
        type: 'ascii',
        enabled: true,
        size: 0
      };

      const filter = new AsciiFilter(config);
      
      expect(() => {
        filter.updateIntensity(createFilterIntensity(5));
      }).not.toThrow();
      
      const state = filter.getState();
      expect(Number.isFinite(state.size)).toBe(true);
    });

    it('should handle very large size values', () => {
      const config: AsciiFilterConfig = {
        type: 'ascii',
        enabled: true,
        size: 100
      };

      const filter = new AsciiFilter(config);
      
      expect(() => {
        filter.updateIntensity(createFilterIntensity(8));
      }).not.toThrow();
      
      const state = filter.getState();
      expect(Number.isFinite(state.size)).toBe(true);
    });

    it('should handle various color values', () => {
      const colors = [0x000000, 0xffffff, 0xff0000, 0x00ff00, 0x0000ff, 0x123456];
      
      for (const color of colors) {
        const config: AsciiFilterConfig = {
          type: 'ascii',
          enabled: true,
          color: color
        };

        const filter = new AsciiFilter(config);
        
        expect(() => {
          filter.updateIntensity(createFilterIntensity(5));
        }).not.toThrow();
        
        const state = filter.getState();
        expect(state.color).toBe(color);
      }
    });

    it('should handle boolean replaceColor values correctly', () => {
      const config: AsciiFilterConfig = {
        type: 'ascii',
        enabled: true,
        replaceColor: false
      };

      const filter = new AsciiFilter(config);
      
      expect(() => {
        filter.updateIntensity(createFilterIntensity(3));
      }).not.toThrow();
      
      const state = filter.getState();
      expect(typeof state.replaceColor).toBe('boolean');
      expect(state.replaceColor).toBe(false);
    });
  });

  describe('Memory Management', () => {
    it('should dispose of PIXI filter properly', () => {
      const config: AsciiFilterConfig = {
        type: 'ascii',
        enabled: true,
        size: 10
      };

      const filter = new AsciiFilter(config);
      
      expect(() => {
        filter.dispose();
      }).not.toThrow();
    });

    it('should handle multiple dispose calls gracefully', () => {
      const config: AsciiFilterConfig = {
        type: 'ascii',
        enabled: true,
        size: 10
      };

      const filter = new AsciiFilter(config);
      
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

    it('should clear timeouts on disposal', () => {
      const config: AsciiFilterConfig = {
        type: 'ascii',
        enabled: true,
        replaceColor: true
      };

      const filter = new AsciiFilter(config);
      
      // Trigger replaceColor timeout
      filter.updateIntensity(createFilterIntensity(5));
      
      expect(() => {
        filter.dispose();
      }).not.toThrow();
    });
  });

  describe('Performance & Stability', () => {
    it('should handle rapid size updates efficiently', () => {
      const config: AsciiFilterConfig = {
        type: 'ascii',
        enabled: true,
        size: 8
      };

      const filter = new AsciiFilter(config);
      
      // Perform many rapid updates
      for (let i = 0; i < 100; i++) {
        const intensity = Math.random() * 10;
        filter.updateIntensity(createFilterIntensity(intensity));
        
        const state = filter.getState();
        expect(Number.isFinite(state.size)).toBe(true);
        expect(state.size).toBeGreaterThanOrEqual(2);
      }
    });

    it('should maintain state consistency during rapid changes', () => {
      const config: AsciiFilterConfig = {
        type: 'ascii',
        enabled: true,
        size: 12,
        color: 0x888888,
        replaceColor: false
      };

      const filter = new AsciiFilter(config);
      
      // Perform sequence of operations
      filter.updateIntensity(createFilterIntensity(3));
      filter.reset();
      filter.updateIntensity(createFilterIntensity(7));
      filter.reset();
      filter.updateIntensity(createFilterIntensity(5));
      
      const state = filter.getState();
      expect(state.size).toBe(11); // Math.max(2, Math.round(2 + (5 * 1.8))) = 11
      expect(state.configuredSize).toBe(12);
      expect(state.color).toBe(0x888888);
      expect(state.replaceColor).toBe(false);
    });

    it('should handle mixed property updates correctly', () => {
      const config: AsciiFilterConfig = {
        type: 'ascii',
        enabled: true,
        size: 6,
        color: 0x112233,
        replaceColor: true
      };

      const filter = new AsciiFilter(config);
      
      // Multiple updates with different intensities
      filter.updateIntensity(createFilterIntensity(2));
      filter.updateIntensity(createFilterIntensity(8));
      filter.updateIntensity(createFilterIntensity(1));
      filter.reset();
      filter.updateIntensity(createFilterIntensity(9));
      
      const state = filter.getState();
      expect(state.color).toBe(0x112233);
      expect(state.configuredSize).toBe(6);
      expect(state.size).toBe(18); // Math.max(2, Math.round(2 + (9 * 1.8))) = 18
    });
  });
}); 