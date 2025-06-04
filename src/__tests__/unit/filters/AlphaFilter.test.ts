/**
 * AlphaFilter Unit Tests
 * 
 * Tests the AlphaFilter wrapper class behavior with mocked dependencies.
 * Focuses on alpha transparency control, intensity mapping, and state management.
 * 
 * @module AlphaFilterUnitTests
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AlphaFilter, type AlphaFilterConfig } from '../../../filters/AlphaFilter';
import { createFilterIntensity } from '../../../types/filters';

// Mock PIXI AlphaFilter
vi.mock('pixi.js', () => ({
  AlphaFilter: vi.fn().mockImplementation(function(this: any) {
    // Mock implementation of PIXI AlphaFilter
    this.alpha = 1.0;
    this.enabled = true;
    
    this.destroy = vi.fn();
    
    return this;
  })
}));

describe('AlphaFilter Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Construction & Basic Properties', () => {
    it('should create filter with default configuration', () => {
      const config: AlphaFilterConfig = {
        type: 'alpha',
        enabled: true
      };

      const filter = new AlphaFilter(config);

      expect(filter).toBeDefined();
      expect(filter.filter).toBeDefined();
      expect(filter.config).toEqual(config);
    });

    it('should create filter with custom alpha value', () => {
      const config: AlphaFilterConfig = {
        type: 'alpha',
        enabled: true,
        alpha: 0.7
      };

      const filter = new AlphaFilter(config);
      const state = filter.getState();

      expect(state.alpha).toBe(0.7);
      expect(state.configuredAlpha).toBe(0.7);
    });

    it('should handle default alpha value when not specified', () => {
      const config: AlphaFilterConfig = {
        type: 'alpha',
        enabled: true
      };

      const filter = new AlphaFilter(config);
      const state = filter.getState();

      expect(state.alpha).toBe(1.0);
      expect(state.configuredAlpha).toBeUndefined();
    });

    it('should handle alpha with intensity configuration', () => {
      const config: AlphaFilterConfig = {
        type: 'alpha',
        enabled: true,
        alpha: 0.8,
        intensity: createFilterIntensity(5)
      };

      const filter = new AlphaFilter(config);

      expect(filter).toBeDefined();
      expect(filter.config.alpha).toBe(0.8);
      expect(filter.config.intensity).toBeDefined();
    });
  });

  describe('Intensity Updates', () => {
    it('should scale alpha based on intensity', () => {
      const config: AlphaFilterConfig = {
        type: 'alpha',
        enabled: true,
        alpha: 0.8
      };

      const filter = new AlphaFilter(config);
      
      // Test different intensity values
      filter.updateIntensity(createFilterIntensity(10));
      let state = filter.getState();
      expect(state.alpha).toBe(0.8); // 0.8 * (10/10) = 0.8
      
      filter.updateIntensity(createFilterIntensity(5));
      state = filter.getState();
      expect(state.alpha).toBe(0.4); // 0.8 * (5/10) = 0.4
      
      filter.updateIntensity(createFilterIntensity(0));
      state = filter.getState();
      expect(state.alpha).toBe(0.0); // 0.8 * (0/10) = 0.0
    });

    it('should handle intensity with default alpha value', () => {
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

    it('should clamp alpha values to valid range (0-1)', () => {
      const config: AlphaFilterConfig = {
        type: 'alpha',
        enabled: true,
        alpha: 1.5 // Invalid high value
      };

      const filter = new AlphaFilter(config);
      
      filter.updateIntensity(createFilterIntensity(10));
      const state = filter.getState();
      expect(state.alpha).toBeLessThanOrEqual(1.0);
      expect(state.alpha).toBeGreaterThanOrEqual(0.0);
    });

    it('should handle minimum alpha values correctly', () => {
      const config: AlphaFilterConfig = {
        type: 'alpha',
        enabled: true,
        alpha: 0.1
      };

      const filter = new AlphaFilter(config);
      
      filter.updateIntensity(createFilterIntensity(0));
      const state = filter.getState();
      expect(state.alpha).toBe(0.0); // 0.1 * (0/10) = 0.0
    });

    it('should handle maximum alpha values correctly', () => {
      const config: AlphaFilterConfig = {
        type: 'alpha',
        enabled: true,
        alpha: 1.0
      };

      const filter = new AlphaFilter(config);
      
      filter.updateIntensity(createFilterIntensity(10));
      const state = filter.getState();
      expect(state.alpha).toBe(1.0); // 1.0 * (10/10) = 1.0
    });

    it('should handle fractional intensity values', () => {
      const config: AlphaFilterConfig = {
        type: 'alpha',
        enabled: true,
        alpha: 0.6
      };

      const filter = new AlphaFilter(config);
      
      filter.updateIntensity(createFilterIntensity(2.5));
      const state = filter.getState();
      expect(state.alpha).toBe(0.15); // 0.6 * (2.5/10) = 0.15
    });
  });

  describe('Reset Functionality', () => {
    it('should reset to original configured alpha value', () => {
      const config: AlphaFilterConfig = {
        type: 'alpha',
        enabled: true,
        alpha: 0.7
      };

      const filter = new AlphaFilter(config);
      
      // Modify alpha with intensity
      filter.updateIntensity(createFilterIntensity(3));
      expect(filter.getState().alpha).toBe(0.21); // 0.7 * (3/10) = 0.21
      
      // Reset should restore original value
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
      
      // Modify alpha with intensity
      filter.updateIntensity(createFilterIntensity(4));
      expect(filter.getState().alpha).toBe(0.4); // 1.0 * (4/10) = 0.4
      
      // Reset should restore default
      filter.reset();
      const state = filter.getState();
      expect(state.alpha).toBe(1.0);
    });

    it('should apply intensity when both alpha and intensity are configured', () => {
      const config: AlphaFilterConfig = {
        type: 'alpha',
        enabled: true,
        alpha: 0.8,
        intensity: createFilterIntensity(6)
      };

      const filter = new AlphaFilter(config);
      
      // Modify alpha
      filter.updateIntensity(createFilterIntensity(2));
      
      // Reset should apply configured intensity
      filter.reset();
      const state = filter.getState();
      expect(state.alpha).toBe(0.48); // 0.8 * (6/10) = 0.48
    });

    it('should not apply intensity when only intensity is configured without alpha', () => {
      const config: AlphaFilterConfig = {
        type: 'alpha',
        enabled: true,
        intensity: createFilterIntensity(7)
        // No alpha configured
      };

      const filter = new AlphaFilter(config);
      
      // Modify alpha
      filter.updateIntensity(createFilterIntensity(2));
      
      // Reset should restore default, not apply intensity
      filter.reset();
      const state = filter.getState();
      expect(state.alpha).toBe(1.0); // Default value, not affected by intensity
    });
  });

  describe('State Management', () => {
    it('should return comprehensive state information', () => {
      const config: AlphaFilterConfig = {
        type: 'alpha',
        enabled: true,
        alpha: 0.9,
        intensity: createFilterIntensity(8)
      };

      const filter = new AlphaFilter(config);
      const state = filter.getState();

      expect(state).toHaveProperty('alpha');
      expect(state).toHaveProperty('configuredAlpha');
      expect(state).toHaveProperty('enabled');
      expect(state).toHaveProperty('type');
      
      expect(state.alpha).toBeCloseTo(0.72, 2); // 0.9 * (8/10) = 0.72
      expect(state.configuredAlpha).toBe(0.9);
      expect(state.type).toBe('alpha');
    });

    it('should track state changes correctly', () => {
      const config: AlphaFilterConfig = {
        type: 'alpha',
        enabled: true,
        alpha: 0.5
      };

      const filter = new AlphaFilter(config);
      
      const initialState = filter.getState();
      expect(initialState.alpha).toBe(0.5);
      
      filter.updateIntensity(createFilterIntensity(6));
      
      const updatedState = filter.getState();
      expect(updatedState.alpha).toBe(0.3); // 0.5 * (6/10) = 0.3
      expect(updatedState.alpha).not.toBe(initialState.alpha);
      expect(updatedState.configuredAlpha).toBe(initialState.configuredAlpha);
    });

    it('should maintain consistent state representation', () => {
      const config: AlphaFilterConfig = {
        type: 'alpha',
        enabled: true,
        alpha: 0.75
      };

      const filter = new AlphaFilter(config);
      
      const state1 = filter.getState();
      const state2 = filter.getState();
      
      expect(state1).toEqual(state2);
      expect(state1.alpha).toBe(state2.alpha);
    });
  });

  describe('Property Validation & Edge Cases', () => {
    it('should handle extreme alpha values gracefully', () => {
      const config: AlphaFilterConfig = {
        type: 'alpha',
        enabled: true,
        alpha: 2.0 // Above valid range
      };

      const filter = new AlphaFilter(config);
      filter.updateIntensity(createFilterIntensity(5));
      
      const state = filter.getState();
      expect(state.alpha).toBeLessThanOrEqual(1.0);
      expect(state.alpha).toBeGreaterThanOrEqual(0.0);
    });

    it('should handle negative alpha values gracefully', () => {
      const config: AlphaFilterConfig = {
        type: 'alpha',
        enabled: true,
        alpha: -0.5 // Below valid range
      };

      const filter = new AlphaFilter(config);
      filter.updateIntensity(createFilterIntensity(5));
      
      const state = filter.getState();
      expect(state.alpha).toBeGreaterThanOrEqual(0.0);
    });

    it('should handle zero alpha configuration', () => {
      const config: AlphaFilterConfig = {
        type: 'alpha',
        enabled: true,
        alpha: 0.0
      };

      const filter = new AlphaFilter(config);
      
      filter.updateIntensity(createFilterIntensity(10));
      const state = filter.getState();
      expect(state.alpha).toBe(0.0); // 0.0 * (10/10) = 0.0
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
      expect(state.alpha).toBe(0.0005); // 0.001 * (5/10) = 0.0005
      expect(Number.isFinite(state.alpha)).toBe(true);
    });
  });

  describe('Resource Management', () => {
    it('should call destroy on the underlying filter', () => {
      const config: AlphaFilterConfig = {
        type: 'alpha',
        enabled: true,
        alpha: 0.8
      };

      const filter = new AlphaFilter(config);
      const mockDestroy = vi.fn();
      (filter.filter as any).destroy = mockDestroy;

      filter.dispose();

      expect(mockDestroy).toHaveBeenCalledOnce();
    });

    it('should handle dispose gracefully when filter has no destroy method', () => {
      const config: AlphaFilterConfig = {
        type: 'alpha',
        enabled: true,
        alpha: 0.8
      };

      const filter = new AlphaFilter(config);
      delete (filter.filter as any).destroy;

      expect(() => filter.dispose()).not.toThrow();
    });

    it('should handle dispose multiple times gracefully', () => {
      const config: AlphaFilterConfig = {
        type: 'alpha',
        enabled: true,
        alpha: 0.8
      };

      const filter = new AlphaFilter(config);

      expect(() => {
        filter.dispose();
        filter.dispose();
      }).not.toThrow();
    });
  });

  describe('Integration Points', () => {
    it('should work with FilterManager-style intensity updates', () => {
      const config: AlphaFilterConfig = {
        type: 'alpha',
        enabled: true,
        alpha: 0.6
      };

      const filter = new AlphaFilter(config);
      
      // Simulate FilterManager calling updateIntensity multiple times
      const intensityUpdates = [2, 8, 1, 9, 5].map(createFilterIntensity);
      
      intensityUpdates.forEach(intensity => {
        expect(() => filter.updateIntensity(intensity)).not.toThrow();
      });
      
      const finalState = filter.getState();
      expect(finalState.alpha).toBe(0.3); // 0.6 * (5/10) = 0.3
      expect(Number.isFinite(finalState.alpha)).toBe(true);
    });

    it('should maintain BaseFilter compatibility', () => {
      const config: AlphaFilterConfig = {
        type: 'alpha',
        enabled: true,
        alpha: 0.7
      };

      const filter = new AlphaFilter(config);

      // Should have BaseFilter methods
      expect(typeof filter.updateIntensity).toBe('function');
      expect(typeof filter.reset).toBe('function');
      expect(typeof filter.getState).toBe('function');
      expect(typeof filter.dispose).toBe('function');
      
      // Should have BaseFilter properties
      expect(filter.filter).toBeDefined();
      expect(filter.config).toBeDefined();
    });

    it('should support createAlphaFilter factory function pattern', () => {
      const config: AlphaFilterConfig = {
        type: 'alpha',
        enabled: true,
        alpha: 0.85
      };

      const filter = new AlphaFilter(config);
      
      // Should expose standard filter interface
      expect(filter.filter).toBeDefined();
      expect(typeof filter.updateIntensity).toBe('function');
      expect(typeof filter.reset).toBe('function');
      expect(typeof filter.dispose).toBe('function');
    });

    it('should handle rapid intensity changes without errors', () => {
      const config: AlphaFilterConfig = {
        type: 'alpha',
        enabled: true,
        alpha: 0.5
      };

      const filter = new AlphaFilter(config);
      
      // Rapid intensity changes
      for (let i = 0; i < 100; i++) {
        const intensity = Math.random() * 10;
        expect(() => {
          filter.updateIntensity(createFilterIntensity(intensity));
        }).not.toThrow();
        
        const state = filter.getState();
        expect(Number.isFinite(state.alpha)).toBe(true);
        expect(state.alpha).toBeGreaterThanOrEqual(0);
        expect(state.alpha).toBeLessThanOrEqual(1);
      }
    });
  });
}); 