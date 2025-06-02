/**
 * AdjustmentFilter Unit Tests
 * 
 * Tests for AdjustmentFilter implementation including:
 * - Filter creation and configuration
 * - Intensity control and mapping
 * - Color adjustment properties
 * - State management
 * - Resource cleanup
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createFilter } from '../../../filters/AdjustmentFilter';
import { createFilterIntensity } from '../../../types/filters';
import type { AdjustmentFilterConfig } from '../../../types/filters';

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
  AdjustmentFilter: class MockAdjustmentFilter {
    public gamma: number;
    public contrast: number;
    public saturation: number;
    public brightness: number;
    public red: number;
    public green: number;
    public blue: number;
    public alpha: number;
    public enabled: boolean;
    
    // Base values for intensity calculations
    private baseBrightness: number;
    private baseContrast: number;
    private baseSaturation: number;
    private baseRed: number;
    private baseGreen: number;
    private baseBlue: number;
    private baseAlpha: number;
    
    constructor(options: any = {}) {
      // Initialize with provided options or defaults
      this.gamma = options.gamma ?? 1;
      this.contrast = options.contrast ?? 1;
      this.saturation = options.saturation ?? 1;
      this.brightness = options.brightness ?? 1;
      this.red = options.red ?? 1;
      this.green = options.green ?? 1;
      this.blue = options.blue ?? 1;
      this.alpha = options.alpha ?? 1;
      this.enabled = true;
      
      // Store base values
      this.baseBrightness = this.brightness;
      this.baseContrast = this.contrast;
      this.baseSaturation = this.saturation;
      this.baseRed = this.red;
      this.baseGreen = this.green;
      this.baseBlue = this.blue;
      this.baseAlpha = this.alpha;
    }
    destroy(): void {}
  }
}));

describe('AdjustmentFilter', () => {
  beforeEach((): void => {
    // Setup for each test
  });

  afterEach((): void => {
    vi.restoreAllMocks();
  });

  describe('Filter Creation', () => {
    it('should create an adjustment filter with default configuration', () => {
      const config: AdjustmentFilterConfig = {
        type: 'adjustment',
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

    it('should create an adjustment filter with custom configuration', () => {
      const config: AdjustmentFilterConfig = {
        type: 'adjustment',
        enabled: true,
        intensity: createFilterIntensity(8),
        gamma: 1.2,
        contrast: 1.1,
        saturation: 1.3,
        brightness: 1.1,
        red: 1.05,
        green: 0.95,
        blue: 1.1,
        alpha: 0.9,
        primaryProperty: 'brightness'
      };

      const result = createFilter(config);

      expect((result.filter as any).gamma).toBe(1.2);
      expect((result.filter as any).contrast).toBe(1.1);
      expect((result.filter as any).saturation).toBe(1.3);
      expect((result.filter as any).brightness).toBe(1.1);
      expect((result.filter as any).red).toBe(1.05);
      expect((result.filter as any).green).toBe(0.95);
      expect((result.filter as any).blue).toBe(1.1);
      expect((result.filter as any).alpha).toBe(0.9);
    });

    it('should handle disabled filter', () => {
      const config: AdjustmentFilterConfig = {
        type: 'adjustment',
        enabled: false,
        intensity: createFilterIntensity(3)
      };

      const result = createFilter(config);

      expect((result.filter as any).enabled).toBe(false);
    });
  });

  describe('Intensity Control', () => {
    it('should have updateIntensity function', () => {
      const config: AdjustmentFilterConfig = {
        type: 'adjustment',
        enabled: true,
        intensity: createFilterIntensity(5)
      };

      const result = createFilter(config);
      
      expect(result.updateIntensity).toBeTypeOf('function');
      
      // Test intensity update
      result.updateIntensity(createFilterIntensity(8));
      
      // Should update the primary property (brightness by default)
      expect((result.filter as any).brightness).toBeCloseTo(1.3, 2); // 0.5 + (8/10) * 1.0 = 1.3
    });

    it('should handle intensity range', () => {
      const config: AdjustmentFilterConfig = {
        type: 'adjustment',
        enabled: true,
        intensity: createFilterIntensity(5)
      };

      const result = createFilter(config);

      // Test minimum intensity
      result.updateIntensity(createFilterIntensity(0));
      expect((result.filter as any).brightness).toBeCloseTo(0.5, 2);

      // Test medium intensity
      result.updateIntensity(createFilterIntensity(5));
      expect((result.filter as any).brightness).toBeCloseTo(1.0, 2);

      // Test maximum intensity
      result.updateIntensity(createFilterIntensity(10));
      expect((result.filter as any).brightness).toBeCloseTo(1.5, 2);
    });

    it('should handle different primary properties', () => {
      const configs = [
        { primaryProperty: 'gamma' as const },
        { primaryProperty: 'contrast' as const },
        { primaryProperty: 'saturation' as const },
        { primaryProperty: 'brightness' as const }
      ];

      configs.forEach(({ primaryProperty }) => {
        const config: AdjustmentFilterConfig = {
          type: 'adjustment',
          enabled: true,
          intensity: createFilterIntensity(5),
          primaryProperty
        };

        const result = createFilter(config);
        result.updateIntensity(createFilterIntensity(7));

        // Each property should be updated based on intensity (0.5-1.5 range)
        const expectedValue = 0.5 + (7 / 10) * 1.0; // 1.2
        expect((result.filter as any)[primaryProperty]).toBeCloseTo(expectedValue, 2);
      });
    });
  });

  describe('Color Adjustment Properties', () => {
    it('should handle all color adjustment properties', () => {
      const config: AdjustmentFilterConfig = {
        type: 'adjustment',
        enabled: true,
        intensity: createFilterIntensity(5),
        gamma: 1.1,
        contrast: 1.2,
        saturation: 1.3,
        brightness: 1.4,
        red: 1.05,
        green: 0.95,
        blue: 1.15,
        alpha: 0.85
      };

      const result = createFilter(config);

      expect((result.filter as any).gamma).toBe(1.1);
      expect((result.filter as any).contrast).toBe(1.2);
      expect((result.filter as any).saturation).toBe(1.3);
      expect((result.filter as any).brightness).toBe(1.4);
      expect((result.filter as any).red).toBe(1.05);
      expect((result.filter as any).green).toBe(0.95);
      expect((result.filter as any).blue).toBe(1.15);
      expect((result.filter as any).alpha).toBe(0.85);
    });

    it('should handle intensity mapping to 0.5-1.5 range', () => {
      const config: AdjustmentFilterConfig = {
        type: 'adjustment',
        enabled: true,
        intensity: createFilterIntensity(0),
        primaryProperty: 'brightness'
      };

      const result = createFilter(config);

      // Test intensity 0 maps to 0.5
      result.updateIntensity(createFilterIntensity(0));
      expect((result.filter as any).brightness).toBeCloseTo(0.5, 2);

      // Test intensity 5 maps to 1.0
      result.updateIntensity(createFilterIntensity(5));
      expect((result.filter as any).brightness).toBeCloseTo(1.0, 2);

      // Test intensity 10 maps to 1.5
      result.updateIntensity(createFilterIntensity(10));
      expect((result.filter as any).brightness).toBeCloseTo(1.5, 2);
    });
  });

  describe('State Management', () => {
    it('should have reset function', () => {
      const config: AdjustmentFilterConfig = {
        type: 'adjustment',
        enabled: true,
        intensity: createFilterIntensity(7),
        brightness: 1.2,
        contrast: 1.1,
        saturation: 1.3
      };

      const result = createFilter(config);
      
      expect(result.reset).toBeTypeOf('function');
      
      // Modify the filter
      result.updateIntensity(createFilterIntensity(3));
      
      // Reset should restore original values
      result.reset();
      
      expect((result.filter as any).brightness).toBe(1.2);
      expect((result.filter as any).contrast).toBe(1.1);
      expect((result.filter as any).saturation).toBe(1.3);
    });

    it('should have getState function', () => {
      const config: AdjustmentFilterConfig = {
        type: 'adjustment',
        enabled: true,
        intensity: createFilterIntensity(7)
      };

      const result = createFilter(config);
      
      expect(result.getState).toBeTypeOf('function');
      
      const state = result.getState?.();
      expect(state).toBeDefined();
      expect(state).toHaveProperty('gamma');
      expect(state).toHaveProperty('contrast');
      expect(state).toHaveProperty('saturation');
      expect(state).toHaveProperty('brightness');
      expect(state).toHaveProperty('enabled');
    });
  });

  describe('Resource Management', () => {
    it('should have dispose function', () => {
      const config: AdjustmentFilterConfig = {
        type: 'adjustment',
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
    it('should handle all adjustment filter properties', () => {
      const config: AdjustmentFilterConfig = {
        type: 'adjustment',
        enabled: true,
        intensity: createFilterIntensity(6),
        gamma: 1.1,
        contrast: 1.2,
        saturation: 1.3,
        brightness: 1.4,
        red: 1.05,
        green: 0.95,
        blue: 1.15,
        alpha: 0.85,
        primaryProperty: 'contrast'
      };

      const result = createFilter(config);

      expect((result.filter as any).gamma).toBe(1.1);
      expect((result.filter as any).contrast).toBe(1.2);
      expect((result.filter as any).saturation).toBe(1.3);
      expect((result.filter as any).brightness).toBe(1.4);
      expect((result.filter as any).red).toBe(1.05);
      expect((result.filter as any).green).toBe(0.95);
      expect((result.filter as any).blue).toBe(1.15);
      expect((result.filter as any).alpha).toBe(0.85);
      expect((result.filter as any).enabled).toBe(true);
    });

    it('should handle primaryProperty variations', () => {
      const primaryProperties = ['gamma', 'contrast', 'saturation', 'brightness'] as const;

      primaryProperties.forEach(primaryProperty => {
        const config: AdjustmentFilterConfig = {
          type: 'adjustment',
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
      const config: AdjustmentFilterConfig = {
        type: 'adjustment',
        enabled: true,
        intensity: createFilterIntensity(0)
      };

      const result = createFilter(config);
      expect((result.filter as any).brightness).toBeCloseTo(0.5, 2);
    });

    it('should handle maximum intensity', () => {
      const config: AdjustmentFilterConfig = {
        type: 'adjustment',
        enabled: true,
        intensity: createFilterIntensity(10)
      };

      const result = createFilter(config);
      expect((result.filter as any).brightness).toBeCloseTo(1.5, 2);
    });

    it('should handle missing optional properties', () => {
      const config: AdjustmentFilterConfig = {
        type: 'adjustment',
        enabled: true,
        intensity: createFilterIntensity(5)
      };

      expect(() => createFilter(config)).not.toThrow();
    });

    it('should handle extreme adjustment values', () => {
      const config: AdjustmentFilterConfig = {
        type: 'adjustment',
        enabled: true,
        intensity: createFilterIntensity(5),
        gamma: 0.1,
        contrast: 3.0,
        saturation: 0.0,
        brightness: 2.0,
        red: 0.0,
        green: 2.0,
        blue: 0.5,
        alpha: 0.1
      };

      const result = createFilter(config);

      expect((result.filter as any).gamma).toBe(0.1);
      expect((result.filter as any).contrast).toBe(3.0);
      expect((result.filter as any).saturation).toBe(0.0);
      expect((result.filter as any).brightness).toBe(2.0);
      expect((result.filter as any).red).toBe(0.0);
      expect((result.filter as any).green).toBe(2.0);
      expect((result.filter as any).blue).toBe(0.5);
      expect((result.filter as any).alpha).toBe(0.1);
    });
  });
}); 