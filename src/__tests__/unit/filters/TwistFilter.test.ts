import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTwistFilter } from '../../../filters/TwistFilter';
import type { TwistFilterConfig, FilterIntensity } from '../../../types/filters';
import { createFilterIntensity } from '../../../types/filters';

// Mock the TwistFilter from pixi-filters
const mockTwistFilter = {
  angle: 4,
  radius: 200,
  offsetX: 0,
  offsetY: 0,
  destroy: vi.fn(),
  enabled: true,
  blendMode: 0,
  resolution: 1,
  multisample: false,
  padding: 0,
  autoFit: true,
  state: null,
  legacy: false,
};

vi.mock('pixi-filters', () => ({
  TwistFilter: vi.fn(() => mockTwistFilter),
}));

describe('TwistFilter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock filter properties to defaults
    mockTwistFilter.angle = 4;
    mockTwistFilter.radius = 200;
    mockTwistFilter.offsetX = 0;
    mockTwistFilter.offsetY = 0;
  });

  describe('Filter Creation', () => {
    it('should create filter with default configuration', () => {
      const config: TwistFilterConfig = {
        type: 'twist',
        enabled: true,
        intensity: createFilterIntensity(5)
      };

      const result = createTwistFilter(config);

      expect(result.filter).toBeDefined();
      expect(result.updateIntensity).toBeInstanceOf(Function);
      expect(result.reset).toBeInstanceOf(Function);
      expect(result.dispose).toBeInstanceOf(Function);

      // Check default values - intensity 5 with angle mapping: (5-5)*2 = 0
      expect(mockTwistFilter.angle).toBe(0);
      expect(mockTwistFilter.radius).toBe(200);
      expect(mockTwistFilter.offsetX).toBe(0);
      expect(mockTwistFilter.offsetY).toBe(0);
    });

    it('should create filter with custom configuration', () => {
      const config: TwistFilterConfig = {
        type: 'twist',
        enabled: true,
        intensity: createFilterIntensity(8),
        angle: 6,
        radius: 300,
        offsetX: 10,
        offsetY: 20,
        primaryProperty: 'angle'
      };

      const result = createTwistFilter(config);

      expect(result.filter).toBe(mockTwistFilter);

      // Should apply intensity mapping: (8-5)*2 = 6
      expect(mockTwistFilter.angle).toBe(6);
    });
  });

  describe('Intensity Mapping - Angle (Primary Property)', () => {
    it('should map intensity to angle when primaryProperty is angle', () => {
      const config: TwistFilterConfig = {
        type: 'twist',
        enabled: true,
        intensity: createFilterIntensity(0),
        primaryProperty: 'angle'
      };

      const result = createTwistFilter(config);

      // Test intensity 0: (0-5)*2 = -10
      result.updateIntensity(createFilterIntensity(0));
      expect(mockTwistFilter.angle).toBe(-10);

      // Test intensity 5: (5-5)*2 = 0
      result.updateIntensity(createFilterIntensity(5));
      expect(mockTwistFilter.angle).toBe(0);

      // Test intensity 10: (10-5)*2 = 10
      result.updateIntensity(createFilterIntensity(10));
      expect(mockTwistFilter.angle).toBe(10);
    });

    it('should default to angle mapping when no primaryProperty specified', () => {
      const config: TwistFilterConfig = {
        type: 'twist',
        enabled: true,
        intensity: createFilterIntensity(7)
      };

      const result = createTwistFilter(config);

      // Should use angle mapping by default: (7-5)*2 = 4
      expect(mockTwistFilter.angle).toBe(4);

      result.updateIntensity(createFilterIntensity(3));
      expect(mockTwistFilter.angle).toBe(-4); // (3-5)*2 = -4
    });
  });

  describe('Intensity Mapping - Radius (Primary Property)', () => {
    it('should map intensity to radius when primaryProperty is radius', () => {
      const config: TwistFilterConfig = {
        type: 'twist',
        enabled: true,
        intensity: createFilterIntensity(0),
        primaryProperty: 'radius'
      };

      const result = createTwistFilter(config);

      // Test intensity 0: 50 + (0 * 45) = 50
      result.updateIntensity(createFilterIntensity(0));
      expect(mockTwistFilter.radius).toBe(50);

      // Test intensity 5: 50 + (5 * 45) = 275
      result.updateIntensity(createFilterIntensity(5));
      expect(mockTwistFilter.radius).toBe(275);

      // Test intensity 10: 50 + (10 * 45) = 500
      result.updateIntensity(createFilterIntensity(10));
      expect(mockTwistFilter.radius).toBe(500);
    });

    it('should apply initial intensity on creation with radius mapping', () => {
      const config: TwistFilterConfig = {
        type: 'twist',
        enabled: true,
        intensity: createFilterIntensity(8),
        radius: 100,
        primaryProperty: 'radius'
      };

      const _result = createTwistFilter(config);
      // intensity 8 with formula: 50 + (8 * 45) = 410
      expect(mockTwistFilter.radius).toBe(410);
    });
  });

  describe('Initial Intensity Application', () => {
    it('should apply initial intensity on creation with angle mapping', () => {
      const config: TwistFilterConfig = {
        type: 'twist',
        enabled: true,
        intensity: createFilterIntensity(5),
        angle: 2,
        primaryProperty: 'angle'
      };

      const _result = createTwistFilter(config);
      // intensity 5 with formula: (5-5)*2 = 0
      expect(mockTwistFilter.angle).toBe(0);
    });

    it('should apply initial intensity on creation with radius mapping', () => {
      const config: TwistFilterConfig = {
        type: 'twist',
        enabled: true,
        intensity: createFilterIntensity(8),
        radius: 100,
        primaryProperty: 'radius'
      };

      const _result = createTwistFilter(config);
      // intensity 8 with formula: 50 + (8 * 45) = 410
      expect(mockTwistFilter.radius).toBe(410);
    });
  });

  describe('Reset Functionality', () => {
    it('should reset to original configuration values', () => {
      const config: TwistFilterConfig = {
        type: 'twist',
        enabled: true,
        intensity: createFilterIntensity(6),
        angle: 3,
        radius: 150,
        offsetX: 5,
        offsetY: 10,
        primaryProperty: 'angle'
      };

      const result = createTwistFilter(config);

      // Modify values
      result.updateIntensity(createFilterIntensity(2));
      expect(mockTwistFilter.angle).toBe(-6); // (2-5)*2 = -6

      // Reset should restore configured values and apply intensity
      result.reset();
      expect(mockTwistFilter.angle).toBe(2); // (6-5)*2 = 2 (intensity applied)
      expect(mockTwistFilter.radius).toBe(150);
      expect(mockTwistFilter.offsetX).toBe(5);
      expect(mockTwistFilter.offsetY).toBe(10);
    });

    it('should reset to defaults when no config values provided', () => {
      const config: TwistFilterConfig = {
        type: 'twist',
        enabled: true,
        intensity: createFilterIntensity(7)
      };

      const result = createTwistFilter(config);

      // Modify values
      result.updateIntensity(createFilterIntensity(1));
      expect(mockTwistFilter.angle).toBe(-8); // (1-5)*2 = -8

      // Reset should restore defaults and apply intensity
      result.reset();
      expect(mockTwistFilter.angle).toBe(4); // (7-5)*2 = 4 (intensity applied)
      expect(mockTwistFilter.radius).toBe(200); // default
      expect(mockTwistFilter.offsetX).toBe(0); // default
      expect(mockTwistFilter.offsetY).toBe(0); // default
    });
  });

  describe('Edge Cases', () => {
    it('should handle intensity values outside 0-10 range', () => {
      const config: TwistFilterConfig = {
        type: 'twist',
        enabled: true,
        intensity: createFilterIntensity(5),
        primaryProperty: 'angle'
      };

      const result = createTwistFilter(config);

      // Test clamping to valid range
      result.updateIntensity(-5 as FilterIntensity); // Should clamp to 0
      expect(mockTwistFilter.angle).toBe(-10); // (0-5)*2 = -10

      result.updateIntensity(15 as FilterIntensity); // Should clamp to 10
      expect(mockTwistFilter.angle).toBe(10); // (10-5)*2 = 10
    });

    it('should throw error for invalid intensity values in createFilterIntensity', () => {
      expect(() => createFilterIntensity(-1)).toThrow();
      expect(() => createFilterIntensity(11)).toThrow();
      expect(() => createFilterIntensity(NaN)).toThrow();
    });
  });

  describe('Resource Management', () => {
    it('should dispose filter resources properly', () => {
      const config: TwistFilterConfig = {
        type: 'twist',
        enabled: true,
        intensity: createFilterIntensity(5)
      };

      const result = createTwistFilter(config);
      const destroySpy = vi.spyOn(mockTwistFilter, 'destroy');

      result.dispose?.();

      expect(destroySpy).toHaveBeenCalledOnce();
    });
  });
}); 