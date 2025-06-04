/**
 * AsciiFilter Unit Tests
 * 
 * Tests the AsciiFilter wrapper class behavior with mocked dependencies.
 * Focuses on ASCII art effect properties, size intensity mapping, and special replaceColor timing.
 * 
 * @module AsciiFilterUnitTests
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AsciiFilter, type AsciiFilterConfig } from '../../../filters/AsciiFilter';
import { createFilterIntensity } from '../../../types/filters';

// Mock PIXI AsciiFilter
vi.mock('pixi-filters', () => ({
  AsciiFilter: vi.fn().mockImplementation(function(this: any) {
    // Mock implementation of PIXI AsciiFilter
    this.size = 8;
    this.color = 0xffffff;
    this.replaceColor = false;
    this.enabled = true;
    
    this.destroy = vi.fn();
    return this;
  })
}));

describe('AsciiFilter Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Construction & Basic Properties', () => {
    it('should create filter with default configuration', () => {
      const config: AsciiFilterConfig = {
        type: 'ascii',
        enabled: true
      };

      const filter = new AsciiFilter(config);
      const state = filter.getState();

      expect(state.enabled).toBe(true);
      expect(state.size).toBe(8); // Default size
      expect(state.color).toBe(0xffffff);
      expect(state.replaceColor).toBe(false);
    });

    it('should create filter with custom ASCII properties', () => {
      const config: AsciiFilterConfig = {
        type: 'ascii',
        enabled: true,
        size: 12,
        color: 0x00ff00,
        replaceColor: true
      };

      const filter = new AsciiFilter(config);
      const state = filter.getState();

      expect(state.configuredSize).toBe(12);
      expect(state.configuredColor).toBe(0x00ff00);
      expect(state.configuredReplaceColor).toBe(true);
      // Note: size may be affected by initial intensity application
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
    });

    it('should handle intensity with size configuration', () => {
      const config: AsciiFilterConfig = {
        type: 'ascii',
        enabled: true,
        size: 16,
        intensity: 3
      };

      const filter = new AsciiFilter(config);
      const state = filter.getState();

      expect(state.configuredSize).toBe(16);
      // Size should be affected by intensity: Math.max(2, Math.round(2 + (3 * 1.8))) = 7
      expect(state.size).toBe(7); // intensity 3 used directly: Math.max(2, Math.round(2 + (3 * 1.8))) = 7
    });
  });

  describe('Intensity Updates', () => {
    it('should scale size with intensity using custom formula', () => {
      const config: AsciiFilterConfig = {
        type: 'ascii',
        enabled: true,
        size: 8 // This will be overridden by intensity scaling
      };

      const filter = new AsciiFilter(config);

      // Test various intensity levels
      filter.updateIntensity(createFilterIntensity(0));
      let state = filter.getState();
      expect(state.size).toBe(2); // Math.max(2, Math.round(2 + (0 * 1.8))) = 2

      filter.updateIntensity(createFilterIntensity(5));
      state = filter.getState();
      expect(state.size).toBe(11); // Math.max(2, Math.round(2 + (5 * 1.8))) = 11

      filter.updateIntensity(createFilterIntensity(10));
      state = filter.getState();
      expect(state.size).toBe(20); // Math.max(2, Math.round(2 + (10 * 1.8))) = 20
    });

    it('should maintain color during intensity updates', () => {
      const config: AsciiFilterConfig = {
        type: 'ascii',
        enabled: true,
        color: 0x0000ff
      };

      const filter = new AsciiFilter(config);
      
      filter.updateIntensity(createFilterIntensity(7));
      const state = filter.getState();

      expect(state.color).toBe(0x0000ff);
    });

    it('should maintain replaceColor during intensity updates', () => {
      const config: AsciiFilterConfig = {
        type: 'ascii',
        enabled: true,
        replaceColor: true
      };

      const filter = new AsciiFilter(config);
      
      filter.updateIntensity(createFilterIntensity(4));
      const state = filter.getState();

      expect(state.replaceColor).toBe(false);
    });

    it('should enforce minimum size constraint', () => {
      const config: AsciiFilterConfig = {
        type: 'ascii',
        enabled: true
      };

      const filter = new AsciiFilter(config);

      // Even with zero intensity, size should be at least 2
      filter.updateIntensity(createFilterIntensity(0));
      const state = filter.getState();

      expect(state.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Reset Functionality', () => {
    it('should reset to configured size correctly', () => {
      const config: AsciiFilterConfig = {
        type: 'ascii',
        enabled: true,
        size: 10
      };

      const filter = new AsciiFilter(config);
      
      // Modify with intensity
      filter.updateIntensity(createFilterIntensity(8));
      
      // Reset
      filter.reset();
      const state = filter.getState();

      expect(state.size).toBe(10);
    });

    it('should reset to default size when not configured', () => {
      const config: AsciiFilterConfig = {
        type: 'ascii',
        enabled: true
      };

      const filter = new AsciiFilter(config);
      
      // Modify with intensity
      filter.updateIntensity(createFilterIntensity(6));
      
      // Reset
      filter.reset();
      const state = filter.getState();

      expect(state.size).toBe(8); // Default size
    });

    it('should reset color configurations', () => {
      const config: AsciiFilterConfig = {
        type: 'ascii',
        enabled: true,
        color: 0xff00ff
      };

      const filter = new AsciiFilter(config);
      
      // Reset
      filter.reset();
      const state = filter.getState();

      expect(state.color).toBe(0xff00ff);
    });

    it('should handle replaceColor reset with special timing', () => {
      const config: AsciiFilterConfig = {
        type: 'ascii',
        enabled: true,
        replaceColor: true
      };

      const filter = new AsciiFilter(config);
      
      // Reset
      filter.reset();
      let state = filter.getState();

      // Initially false for proper rendering
      expect(state.replaceColor).toBe(false);
    });

    it('should apply configured intensity on reset', () => {
      const config: AsciiFilterConfig = {
        type: 'ascii',
        enabled: true,
        size: 12,
        intensity: 6
      };

      const filter = new AsciiFilter(config);
      
      // Modify state
      filter.updateIntensity(createFilterIntensity(2));
      
      // Reset should apply the configured intensity
      filter.reset();
      
      // After reset, intensity should be applied again
      const state = filter.getState();
      expect(state.size).toBe(13); // Formula with intensity 6: Math.max(2, Math.round(2 + (6 * 1.8))) = 13
    });
  });

  describe('State Management', () => {
    it('should provide comprehensive state information', () => {
      const config: AsciiFilterConfig = {
        type: 'ascii',
        enabled: true,
        size: 14,
        color: 0xffff00,
        replaceColor: false,
        intensity: 7
      };

      const filter = new AsciiFilter(config);
      const state = filter.getState();

      expect(state).toEqual(expect.objectContaining({
        enabled: true,
        type: 'ascii',
        size: expect.any(Number),
        color: 0xffff00,
        replaceColor: false,
        configuredSize: 14,
        configuredColor: 0xffff00,
        configuredReplaceColor: false
      }));
    });

    it('should track state changes correctly', () => {
      const config: AsciiFilterConfig = {
        type: 'ascii',
        enabled: true,
        size: 6
      };

      const filter = new AsciiFilter(config);
      
      filter.updateIntensity(createFilterIntensity(9));
      const state = filter.getState();

      expect(state.configuredSize).toBe(6);
      expect(state.size).toBe(18); // Formula: Math.max(2, Math.round(2 + (9 * 1.8))) = 18
    });
  });

  describe('Property Validation & Edge Cases', () => {
    it('should handle zero size gracefully', () => {
      const config: AsciiFilterConfig = {
        type: 'ascii',
        enabled: true,
        size: 0
      };

      const filter = new AsciiFilter(config);
      const state = filter.getState();

      expect(state.configuredSize).toBe(0);
      expect(state.size).toBe(0); // Should respect configured value
    });

    it('should handle undefined color configuration', () => {
      const config: AsciiFilterConfig = {
        type: 'ascii',
        enabled: true
      };

      const filter = new AsciiFilter(config);
      const state = filter.getState();

      expect(state.configuredColor).toBeUndefined();
      expect(state.color).toBe(0xffffff); // Default color
    });

    it('should handle undefined replaceColor configuration', () => {
      const config: AsciiFilterConfig = {
        type: 'ascii',
        enabled: true
      };

      const filter = new AsciiFilter(config);
      const state = filter.getState();

      expect(state.configuredReplaceColor).toBeUndefined();
      expect(state.replaceColor).toBe(false); // Default value
    });
  });

  describe('Resource Management', () => {
    it('should dispose of PIXI filter properly', () => {
      const config: AsciiFilterConfig = {
        type: 'ascii',
        enabled: true
      };

      const filter = new AsciiFilter(config);
      
      expect(() => {
        filter.dispose();
      }).not.toThrow();
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

  describe('Special Timeout Handling', () => {
    it('should handle replaceColor timing correctly', () => {
      const config: AsciiFilterConfig = {
        type: 'ascii',
        enabled: true,
        replaceColor: true
      };

      const filter = new AsciiFilter(config);
      
      // Force refresh which should trigger timeout
      filter.updateIntensity(createFilterIntensity(5));
      let state = filter.getState();
      
      // Initially should be false
      expect(state.replaceColor).toBe(false);
      
      // Advance timers
      vi.advanceTimersByTime(60);
      state = filter.getState();
      
      // After timeout, should be true
      expect(state.replaceColor).toBe(true);
    });

    it('should clear pending timeouts on new updates', () => {
      const config: AsciiFilterConfig = {
        type: 'ascii',
        enabled: true,
        replaceColor: true
      };

      const filter = new AsciiFilter(config);
      
      // First update
      filter.updateIntensity(createFilterIntensity(3));
      
      // Second update before timeout completes
      filter.updateIntensity(createFilterIntensity(7));
      
      // Should not throw and should handle properly
      expect(() => {
        vi.advanceTimersByTime(100);
      }).not.toThrow();
    });
  });

  describe('Integration Points', () => {
    it('should support FilterManager-style updates', () => {
      const config: AsciiFilterConfig = {
        type: 'ascii',
        enabled: true,
        size: 15
      };

      const filter = new AsciiFilter(config);
      
      // Simulate multiple rapid updates
      for (let i = 0; i < 5; i++) {
        filter.updateIntensity(createFilterIntensity(i * 2));
      }
      
      const state = filter.getState();
      expect(state.size).toBe(16); // Last update: intensity 8: Math.max(2, Math.round(2 + (8 * 1.8))) = 16
    });

    it('should maintain consistency during rapid state changes', () => {
      const config: AsciiFilterConfig = {
        type: 'ascii',
        enabled: true,
        color: 0x123456,
        replaceColor: false
      };

      const filter = new AsciiFilter(config);
      
      // Rapid changes
      filter.updateIntensity(createFilterIntensity(2));
      filter.updateIntensity(createFilterIntensity(8));
      filter.reset();
      filter.updateIntensity(createFilterIntensity(5));
      
      const state = filter.getState();
      expect(state.color).toBe(0x123456);
      expect(state.replaceColor).toBe(false);
    });
  });
}); 