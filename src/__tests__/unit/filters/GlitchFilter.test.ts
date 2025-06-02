/**
 * GlitchFilter Unit Tests
 * 
 * Tests for GlitchFilter implementation including:
 * - Filter creation and configuration
 * - Intensity control and mapping
 * - Animation functionality
 * - State management
 * - Resource cleanup
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock global timer functions before any imports
const mockSetInterval = vi.fn().mockImplementation((_fn: () => void, _delay: number) => {
  return 123 as any; // Return a mock timer ID
});
const mockClearInterval = vi.fn().mockImplementation((): void => {});

// Set up global mocks
global.setInterval = mockSetInterval;
global.clearInterval = mockClearInterval;

import { createFilter } from '../../../filters/GlitchFilter';
import { createFilterIntensity } from '../../../types/filters';
import type { GlitchFilterConfig } from '../../../types/filters';

// Mock PIXI.js
vi.mock('pixi.js', () => ({
  Filter: class MockFilter {
    public enabled: boolean;
    
    constructor() {
      this.enabled = true;
    }
    destroy(): void {}
  }
}));

// Mock pixi-filters with proper GlitchFilter simulation
vi.mock('pixi-filters', () => ({
  GlitchFilter: class MockGlitchFilter {
    public slices: number;
    public offset: number;
    public direction: number;
    public red: { x: number; y: number };
    public green: { x: number; y: number };
    public blue: { x: number; y: number };
    public seed: number;
    public enabled: boolean;
    
    constructor(options: any = {}) {
      // Properly initialize with provided options
      this.slices = options.slices ?? 5;
      this.offset = options.offset ?? 100;
      this.direction = options.direction ?? 0;
      this.red = options.red ?? { x: 0, y: 0 };
      this.green = options.green ?? { x: 0, y: 0 };
      this.blue = options.blue ?? { x: 0, y: 0 };
      this.seed = options.seed ?? 0;
      this.enabled = true;
    }
    destroy(): void {}
  }
}));

describe('GlitchFilter', () => {
  beforeEach((): void => {
    // Clear mock call history
    mockSetInterval.mockClear();
    mockClearInterval.mockClear();
    
    vi.useFakeTimers();
  });

  afterEach((): void => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Filter Creation', () => {
    it('should create a glitch filter with default configuration', () => {
      const config: GlitchFilterConfig = {
        type: 'glitch',
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

    it('should create a glitch filter with custom configuration', () => {
      const config: GlitchFilterConfig = {
        type: 'glitch',
        enabled: true,
        intensity: createFilterIntensity(8),
        slices: 10,
        offset: 200,
        direction: 45,
        red: { x: 10, y: 5 },
        green: { x: -5, y: 10 },
        blue: { x: 0, y: -10 },
        seed: 123,
        animated: true,
        refreshFrequency: 100,
        primaryProperty: 'slices'
      };

      const result = createFilter(config);

      // Check that the filter was initialized with custom values
      expect((result.filter as any).slices).toBe(10);
      expect((result.filter as any).offset).toBe(200);
      expect((result.filter as any).direction).toBe(45);
      expect((result.filter as any).red).toEqual({ x: 10, y: 5 });
      expect((result.filter as any).green).toEqual({ x: -5, y: 10 });
      expect((result.filter as any).blue).toEqual({ x: 0, y: -10 });
      expect((result.filter as any).seed).toBe(123);
    });

    it('should handle disabled filter', () => {
      const config: GlitchFilterConfig = {
        type: 'glitch',
        enabled: false,
        intensity: createFilterIntensity(3)
      };

      const result = createFilter(config);

      expect((result.filter as any).enabled).toBe(false);
    });
  });

  describe('Intensity Control', () => {
    it('should have updateIntensity function', () => {
      const config: GlitchFilterConfig = {
        type: 'glitch',
        enabled: true,
        intensity: createFilterIntensity(5)
      };

      const result = createFilter(config);
      
      expect(result.updateIntensity).toBeTypeOf('function');
      
      // Test intensity update
      result.updateIntensity(createFilterIntensity(8));
      
      // Should update the primary property (slices by default)
      expect((result.filter as any).slices).toBe(8); // 8 * 1.0 = 8
    });

    it('should handle intensity range', () => {
      const config: GlitchFilterConfig = {
        type: 'glitch',
        enabled: true,
        intensity: createFilterIntensity(5)
      };

      const result = createFilter(config);

      // Test minimum intensity
      result.updateIntensity(createFilterIntensity(0));
      expect((result.filter as any).slices).toBe(1); // Math.max(1, Math.round(5 * 0)) = 1

      // Test medium intensity
      result.updateIntensity(createFilterIntensity(5));
      expect((result.filter as any).slices).toBe(5);

      // Test maximum intensity
      result.updateIntensity(createFilterIntensity(10));
      expect((result.filter as any).slices).toBe(10);
    });

    it('should handle different primary properties', () => {
      // Note: The actual implementation doesn't use primaryProperty for different behavior
      // It always updates all properties based on intensity
      const config: GlitchFilterConfig = {
        type: 'glitch',
        enabled: true,
        intensity: createFilterIntensity(5),
        primaryProperty: 'slices'
      };

      const result = createFilter(config);
      result.updateIntensity(createFilterIntensity(7));

      // The implementation always updates slices based on intensity
      expect((result.filter as any).slices).toBe(7);
      expect((result.filter as any).offset).toBe(140); // 100 * (7/5) = 140
    });
  });

  describe('Animation Support', () => {
    it('should handle animation configuration when animated is true', () => {
      const config: GlitchFilterConfig = {
        type: 'glitch',
        enabled: true,
        intensity: createFilterIntensity(5),
        animated: true,
        refreshFrequency: 100
      };

      // Should not throw when creating animated filter
      expect(() => createFilter(config)).not.toThrow();
      
      const result = createFilter(config);
      expect(result).toBeDefined();
      expect(result.filter).toBeDefined();
    });

    it('should handle animation configuration when animated is false', () => {
      const config: GlitchFilterConfig = {
        type: 'glitch',
        enabled: true,
        intensity: createFilterIntensity(5),
        animated: false
      };

      // Should not throw when creating non-animated filter
      expect(() => createFilter(config)).not.toThrow();
      
      const result = createFilter(config);
      expect(result).toBeDefined();
      expect(result.filter).toBeDefined();
    });

    it('should handle default refresh frequency when not specified', () => {
      const config: GlitchFilterConfig = {
        type: 'glitch',
        enabled: true,
        intensity: createFilterIntensity(5),
        animated: true
      };

      // Should not throw when creating animated filter with default frequency
      expect(() => createFilter(config)).not.toThrow();
      
      const result = createFilter(config);
      expect(result).toBeDefined();
      expect(result.filter).toBeDefined();
    });

    it('should handle dispose with animation enabled', () => {
      const config: GlitchFilterConfig = {
        type: 'glitch',
        enabled: true,
        intensity: createFilterIntensity(5),
        animated: true
      };

      const result = createFilter(config);
      
      // Should not throw when disposing animated filter
      expect(() => {
        if (result.dispose) {
          result.dispose();
        }
      }).not.toThrow();
    });
  });

  describe('State Management', () => {
    it('should have reset function', () => {
      const config: GlitchFilterConfig = {
        type: 'glitch',
        enabled: true,
        intensity: createFilterIntensity(7),
        slices: 10,
        offset: 200
      };

      const result = createFilter(config);
      
      // Change intensity
      result.updateIntensity(createFilterIntensity(3));
      
      // Reset should restore to base values
      result.reset();
      
      expect((result.filter as any).slices).toBe(10); // Base slices
      expect((result.filter as any).offset).toBe(200); // Base offset
    });

    it('should have getState function', () => {
      const config: GlitchFilterConfig = {
        type: 'glitch',
        enabled: true,
        intensity: createFilterIntensity(7)
      };

      const result = createFilter(config);
      
      expect(result.getState).toBeTypeOf('function');
      
      if (result.getState) {
        const state = result.getState();

        expect(state).toHaveProperty('intensity');
        expect(state).toHaveProperty('slices');
        expect(state).toHaveProperty('offset');
        expect(state).toHaveProperty('direction');
        expect(state).toHaveProperty('red');
        expect(state).toHaveProperty('green');
        expect(state).toHaveProperty('blue');
        expect(state).toHaveProperty('seed');
      }
    });
  });

  describe('Resource Management', () => {
    it('should have dispose function', () => {
      const config: GlitchFilterConfig = {
        type: 'glitch',
        enabled: true,
        intensity: createFilterIntensity(5)
      };

      const result = createFilter(config);
      
      expect(result.dispose).toBeTypeOf('function');
      
      // Should not throw when called
      expect(() => {
        if (result.dispose) {
          result.dispose();
        }
      }).not.toThrow();
    });

    it('should handle dispose with animation', () => {
      const config: GlitchFilterConfig = {
        type: 'glitch',
        enabled: true,
        intensity: createFilterIntensity(5),
        animated: true
      };

      const result = createFilter(config);
      
      // Should not throw when disposing
      expect(() => {
        if (result.dispose) {
          result.dispose();
        }
      }).not.toThrow();
    });
  });

  describe('Configuration Validation', () => {
    it('should handle all glitch filter properties', () => {
      const config: GlitchFilterConfig = {
        type: 'glitch',
        enabled: true,
        intensity: createFilterIntensity(6),
        slices: 8,
        offset: 150,
        direction: 90,
        red: { x: 5, y: -5 },
        green: { x: -3, y: 7 },
        blue: { x: 2, y: -2 },
        seed: 456,
        animated: true,
        refreshFrequency: 150,
        primaryProperty: 'offset'
      };

      const result = createFilter(config);

      expect((result.filter as any).slices).toBe(8);
      expect((result.filter as any).offset).toBe(150);
      expect((result.filter as any).direction).toBe(90);
      expect((result.filter as any).red).toEqual({ x: 5, y: -5 });
      expect((result.filter as any).green).toEqual({ x: -3, y: 7 });
      expect((result.filter as any).blue).toEqual({ x: 2, y: -2 });
      expect((result.filter as any).seed).toBe(456);
    });

    it('should handle primaryProperty variations', () => {
      const primaryProperties = ['slices', 'offset', 'direction'] as const;
      
      primaryProperties.forEach(primaryProperty => {
        const config: GlitchFilterConfig = {
          type: 'glitch',
          enabled: true,
          intensity: createFilterIntensity(5),
          primaryProperty
        };

        const result = createFilter(config);
        
        // All should create successfully regardless of primaryProperty
        expect(result).toBeDefined();
        expect(result.filter).toBeDefined();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero intensity', () => {
      const config: GlitchFilterConfig = {
        type: 'glitch',
        enabled: true,
        intensity: createFilterIntensity(0)
      };

      const result = createFilter(config);
      
      // Apply zero intensity
      result.updateIntensity(createFilterIntensity(0));
      expect((result.filter as any).slices).toBe(1); // Math.max(1, Math.round(5 * 0)) = 1
    });

    it('should handle maximum intensity', () => {
      const config: GlitchFilterConfig = {
        type: 'glitch',
        enabled: true,
        intensity: createFilterIntensity(10)
      };

      const result = createFilter(config);
      
      // Apply maximum intensity
      result.updateIntensity(createFilterIntensity(10));
      expect((result.filter as any).slices).toBe(10); // Math.round(5 * 2) = 10
    });

    it('should handle missing optional properties', () => {
      const config: GlitchFilterConfig = {
        type: 'glitch',
        enabled: true,
        intensity: createFilterIntensity(5)
      };

      const result = createFilter(config);
      
      // Should use defaults
      expect((result.filter as any).slices).toBe(5);
      expect((result.filter as any).offset).toBe(100);
      expect((result.filter as any).direction).toBe(0);
    });
  });
}); 