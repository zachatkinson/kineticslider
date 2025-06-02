/**
 * RGBSplitFilter Unit Tests
 * 
 * Tests for RGBSplitFilter implementation including:
 * - Filter creation and configuration
 * - Intensity control and mapping
 * - RGB channel offset control
 * - State management
 * - Resource cleanup
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createFilter } from '../../../filters/RGBSplitFilter';
import { createFilterIntensity } from '../../../types/filters';
import type { RGBSplitFilterConfig } from '../../../types/filters';

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

// Mock pixi-filters
vi.mock('pixi-filters', () => ({
  RGBSplitFilter: class MockRGBSplitFilter {
    public red: { x: number; y: number };
    public green: { x: number; y: number };
    public blue: { x: number; y: number };
    public enabled: boolean;
    
    // Base values for intensity calculations
    private baseRedX: number;
    private baseRedY: number;
    private baseGreenX: number;
    private baseGreenY: number;
    private baseBlueX: number;
    private baseBlueY: number;
    
    constructor(options: any = {}) {
      // Initialize with provided options or defaults (matching PIXI defaults)
      this.red = options.red || { x: -10, y: 0 };
      this.green = options.green || { x: 0, y: 10 };
      this.blue = options.blue || { x: 0, y: 0 };
      this.enabled = true;
      
      // Store base values for intensity calculations
      this.baseRedX = this.red.x;
      this.baseRedY = this.red.y;
      this.baseGreenX = this.green.x;
      this.baseGreenY = this.green.y;
      this.baseBlueX = this.blue.x;
      this.baseBlueY = this.blue.y;
    }
    destroy(): void {}
  }
}));

describe('RGBSplitFilter', () => {
  beforeEach((): void => {
    // Setup for each test
  });

  afterEach((): void => {
    vi.restoreAllMocks();
  });

  describe('Filter Creation', () => {
    it('should create an RGB split filter with default configuration', () => {
      const config: RGBSplitFilterConfig = {
        type: 'rgbSplit',
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

    it('should create an RGB split filter with custom configuration', () => {
      const config: RGBSplitFilterConfig = {
        type: 'rgbSplit',
        enabled: true,
        intensity: createFilterIntensity(8),
        red: { x: 10, y: 5 },
        green: { x: -5, y: 10 },
        blue: { x: 0, y: -10 },
        primaryProperty: 'red'
      };

      const result = createFilter(config);

      expect((result.filter as any).red).toEqual({ x: 10, y: 5 });
      expect((result.filter as any).green).toEqual({ x: -5, y: 10 });
      expect((result.filter as any).blue).toEqual({ x: 0, y: -10 });
    });

    it('should handle disabled filter', () => {
      const config: RGBSplitFilterConfig = {
        type: 'rgbSplit',
        enabled: false,
        intensity: createFilterIntensity(3)
      };

      const result = createFilter(config);

      expect((result.filter as any).enabled).toBe(false);
    });
  });

  describe('Intensity Control', () => {
    it('should have updateIntensity function', () => {
      const config: RGBSplitFilterConfig = {
        type: 'rgbSplit',
        enabled: true,
        intensity: createFilterIntensity(5)
      };

      const result = createFilter(config);
      
      expect(result.updateIntensity).toBeTypeOf('function');
      
      // Test intensity update
      result.updateIntensity(createFilterIntensity(8));
      
      // Should update the primary property (red by default)
      expect((result.filter as any).red.x).toBe(8); // 8 * 1.0 = 8
    });

    it('should handle intensity range', () => {
      const config: RGBSplitFilterConfig = {
        type: 'rgbSplit',
        enabled: true,
        intensity: createFilterIntensity(5)
      };

      const result = createFilter(config);

      // Test minimum intensity
      result.updateIntensity(createFilterIntensity(0));
      expect((result.filter as any).red.x).toBe(0);

      // Test medium intensity
      result.updateIntensity(createFilterIntensity(5));
      expect((result.filter as any).red.x).toBe(5);

      // Test maximum intensity
      result.updateIntensity(createFilterIntensity(10));
      expect((result.filter as any).red.x).toBe(10);
    });

    it('should handle different primary properties', () => {
      const configs = [
        { primaryProperty: 'red' as const },
        { primaryProperty: 'green' as const },
        { primaryProperty: 'blue' as const }
      ];

      configs.forEach(({ primaryProperty }) => {
        const config: RGBSplitFilterConfig = {
          type: 'rgbSplit',
          enabled: true,
          intensity: createFilterIntensity(5),
          primaryProperty
        };

        const result = createFilter(config);
        result.updateIntensity(createFilterIntensity(7));

        // Each property should be updated based on intensity
        if (primaryProperty === 'red') {
          expect((result.filter as any).red.x).toBe(7);
        } else if (primaryProperty === 'green') {
          expect((result.filter as any).green.x).toBe(7);
        } else if (primaryProperty === 'blue') {
          expect((result.filter as any).blue.x).toBe(7);
        }
      });
    });
  });

  describe('RGB Channel Control', () => {
    it('should handle individual channel offsets', () => {
      const config: RGBSplitFilterConfig = {
        type: 'rgbSplit',
        enabled: true,
        intensity: createFilterIntensity(5),
        red: { x: 15, y: 10 },
        green: { x: -10, y: 15 },
        blue: { x: 5, y: -5 }
      };

      const result = createFilter(config);

      expect((result.filter as any).red).toEqual({ x: 15, y: 10 });
      expect((result.filter as any).green).toEqual({ x: -10, y: 15 });
      expect((result.filter as any).blue).toEqual({ x: 5, y: -5 });
    });

    it('should handle combined offset objects', () => {
      const config: RGBSplitFilterConfig = {
        type: 'rgbSplit',
        enabled: true,
        intensity: createFilterIntensity(6),
        redX: 8,
        redY: 4,
        greenX: -4,
        greenY: 8,
        blueX: 0,
        blueY: -8
      };

      const result = createFilter(config);

      expect((result.filter as any).red).toEqual({ x: 8, y: 4 });
      expect((result.filter as any).green).toEqual({ x: -4, y: 8 });
      expect((result.filter as any).blue).toEqual({ x: 0, y: -8 });
    });

    it('should prioritize individual channel properties over individual X/Y properties', () => {
      const config: RGBSplitFilterConfig = {
        type: 'rgbSplit',
        enabled: true,
        intensity: createFilterIntensity(5),
        red: { x: 10, y: 5 },
        redX: 20, // Should be ignored
        redY: 10  // Should be ignored
      };

      const result = createFilter(config);

      expect((result.filter as any).red).toEqual({ x: 10, y: 5 });
    });
  });

  describe('State Management', () => {
    it('should have reset function', () => {
      const config: RGBSplitFilterConfig = {
        type: 'rgbSplit',
        enabled: true,
        intensity: createFilterIntensity(7),
        red: { x: 10, y: 5 },
        green: { x: -5, y: 10 }
      };

      const result = createFilter(config);
      
      expect(result.reset).toBeTypeOf('function');
      
      // Modify the filter
      result.updateIntensity(createFilterIntensity(3));
      
      // Reset should restore original values
      result.reset();
      
      expect((result.filter as any).red).toEqual({ x: 10, y: 5 });
      expect((result.filter as any).green).toEqual({ x: -5, y: 10 });
    });

    it('should have getState function', () => {
      const config: RGBSplitFilterConfig = {
        type: 'rgbSplit',
        enabled: true,
        intensity: createFilterIntensity(7)
      };

      const result = createFilter(config);
      
      expect(result.getState).toBeTypeOf('function');
      
      const state = result.getState?.();
      expect(state).toBeDefined();
      expect(state).toHaveProperty('red');
      expect(state).toHaveProperty('green');
      expect(state).toHaveProperty('blue');
      expect(state).toHaveProperty('enabled');
    });
  });

  describe('Resource Management', () => {
    it('should have dispose function', () => {
      const config: RGBSplitFilterConfig = {
        type: 'rgbSplit',
        enabled: true,
        intensity: createFilterIntensity(5)
      };

      const result = createFilter(config);
      
      expect(result.dispose).toBeTypeOf('function');
      
      // Should not throw when disposing
      expect(() => result.dispose?.()).not.toThrow();
    });
  });

  describe('Configuration Validation', () => {
    it('should handle all RGB split filter properties', () => {
      const config: RGBSplitFilterConfig = {
        type: 'rgbSplit',
        enabled: true,
        intensity: createFilterIntensity(6),
        red: { x: 8, y: 4 },
        green: { x: -4, y: 8 },
        blue: { x: 2, y: -2 },
        redX: 10,
        redY: 5,
        greenX: -5,
        greenY: 10,
        blueX: 0,
        blueY: -5,
        primaryProperty: 'green'
      };

      const result = createFilter(config);

      // Individual properties should take precedence over X/Y properties
      expect((result.filter as any).red).toEqual({ x: 8, y: 4 });
      expect((result.filter as any).green).toEqual({ x: -4, y: 8 });
      expect((result.filter as any).blue).toEqual({ x: 2, y: -2 });
      expect((result.filter as any).enabled).toBe(true);
    });

    it('should handle primaryProperty variations', () => {
      const primaryProperties = ['red', 'green', 'blue'] as const;

      primaryProperties.forEach(primaryProperty => {
        const config: RGBSplitFilterConfig = {
          type: 'rgbSplit',
          enabled: true,
          intensity: createFilterIntensity(5),
          primaryProperty
        };

        const result = createFilter(config);
        expect(result).toBeDefined();
        expect(result.filter).toBeDefined();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero intensity', () => {
      const config: RGBSplitFilterConfig = {
        type: 'rgbSplit',
        enabled: true,
        intensity: createFilterIntensity(0)
      };

      const result = createFilter(config);
      expect((result.filter as any).red.x).toBe(0);
    });

    it('should handle maximum intensity', () => {
      const config: RGBSplitFilterConfig = {
        type: 'rgbSplit',
        enabled: true,
        intensity: createFilterIntensity(10)
      };

      const result = createFilter(config);
      expect((result.filter as any).red.x).toBe(10);
    });

    it('should handle missing optional properties', () => {
      const config: RGBSplitFilterConfig = {
        type: 'rgbSplit',
        enabled: true,
        intensity: createFilterIntensity(5)
      };

      expect(() => createFilter(config)).not.toThrow();
    });

    it('should handle negative offset values', () => {
      const config: RGBSplitFilterConfig = {
        type: 'rgbSplit',
        enabled: true,
        intensity: createFilterIntensity(5),
        red: { x: -10, y: -5 },
        green: { x: 5, y: -10 },
        blue: { x: -5, y: 5 }
      };

      const result = createFilter(config);

      expect((result.filter as any).red).toEqual({ x: -10, y: -5 });
      expect((result.filter as any).green).toEqual({ x: 5, y: -10 });
      expect((result.filter as any).blue).toEqual({ x: -5, y: 5 });
    });
  });
}); 