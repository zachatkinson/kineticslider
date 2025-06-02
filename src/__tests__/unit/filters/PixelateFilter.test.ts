import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPixelateFilter } from '../../../filters/PixelateFilter';
import type { PixelateFilterConfig } from '../../../types/filters';
import { createFilterIntensity } from '../../../types/filters';

// Mock the PixelateFilter from pixi-filters
const mockPixelateFilter = {
  size: 10,
  sizeX: 10,
  sizeY: 10,
  destroy: vi.fn(),
  enabled: true,
  alpha: 1,
  blendMode: 0,
  resolution: 1,
  multisample: false,
  padding: 0,
  autoFit: true,
  state: null,
  legacy: false,
};

vi.mock('pixi-filters', () => ({
  PixelateFilter: vi.fn(() => mockPixelateFilter),
}));

describe('PixelateFilter', () => {
  beforeEach(() => {
    // Reset mock filter to default state
    mockPixelateFilter.size = 10;
    mockPixelateFilter.sizeX = 10;
    mockPixelateFilter.sizeY = 10;
    vi.clearAllMocks();
  });

  describe('Filter Creation', () => {
    it('should create filter with default configuration', () => {
      const config: PixelateFilterConfig = {
        type: 'pixelate',
        enabled: true,
        intensity: createFilterIntensity(5)
      };

      const result = createPixelateFilter(config);

      expect(result.filter).toBeDefined();
      expect(result.updateIntensity).toBeInstanceOf(Function);
      expect(result.reset).toBeInstanceOf(Function);
      expect(result.dispose).toBeInstanceOf(Function);

      // Check default values - intensity 5 mapped to size: 1 + (5 * 2.9) = 15.5
      expect(mockPixelateFilter.size).toBe(15.5);
    });

    it('should create filter with custom size configuration', () => {
      const config: PixelateFilterConfig = {
        type: 'pixelate',
        enabled: true,
        intensity: createFilterIntensity(3),
        size: 8,
        primaryProperty: 'size'
      };

      const result = createPixelateFilter(config);

      expect(result.filter).toBe(mockPixelateFilter);

      // Should apply intensity mapping: 1 + (3 * 2.9) = 9.7
      expect(mockPixelateFilter.size).toBe(9.7);
    });

    it('should create filter with separate sizeX and sizeY configuration', () => {
      const config: PixelateFilterConfig = {
        type: 'pixelate',
        enabled: true,
        intensity: createFilterIntensity(4),
        sizeX: 12,
        sizeY: 8,
        primaryProperty: 'sizeX'
      };

      const result = createPixelateFilter(config);

      expect(result.filter).toBe(mockPixelateFilter);
      
      // Should apply intensity to sizeX only: 1 + (4 * 2.9) = 12.6
      expect(mockPixelateFilter.sizeX).toBe(12.6);
      // sizeY should remain at default since primaryProperty is sizeX
    });
  });

  describe('Intensity Mapping - Size (Primary Property)', () => {
    it('should map intensity to size when primaryProperty is size or default', () => {
      const config: PixelateFilterConfig = {
        type: 'pixelate',
        enabled: true,
        intensity: createFilterIntensity(0),
        primaryProperty: 'size'
      };

      const result = createPixelateFilter(config);

      // Test intensity 0: 1 + (0 * 2.9) = 1
      result.updateIntensity(createFilterIntensity(0));
      expect(mockPixelateFilter.size).toBe(1);

      // Test intensity 5: 1 + (5 * 2.9) = 15.5
      result.updateIntensity(createFilterIntensity(5));
      expect(mockPixelateFilter.size).toBe(15.5);

      // Test intensity 10: 1 + (10 * 2.9) = 30
      result.updateIntensity(createFilterIntensity(10));
      expect(mockPixelateFilter.size).toBe(30);
    });

    it('should default to size mapping when no primaryProperty specified', () => {
      const config: PixelateFilterConfig = {
        type: 'pixelate',
        enabled: true,
        intensity: createFilterIntensity(7)
      };

      const result = createPixelateFilter(config);

      // Should use size mapping by default: 1 + (7 * 2.9) = 21.3
      expect(mockPixelateFilter.size).toBe(21.3);

      result.updateIntensity(createFilterIntensity(2));
      expect(mockPixelateFilter.size).toBe(6.8); // 1 + (2 * 2.9) = 6.8
    });
  });

  describe('Intensity Mapping - SizeX Primary Property', () => {
    it('should map intensity to sizeX when primaryProperty is sizeX', () => {
      const config: PixelateFilterConfig = {
        type: 'pixelate',
        enabled: true,
        intensity: createFilterIntensity(6),
        primaryProperty: 'sizeX'
      };

      const result = createPixelateFilter(config);

      // Test intensity 6: 1 + (6 * 2.9) = 18.4
      expect(mockPixelateFilter.sizeX).toBe(18.4);
      // sizeY should remain unchanged when primaryProperty is sizeX

      result.updateIntensity(createFilterIntensity(8));
      expect(mockPixelateFilter.sizeX).toBe(24.2); // 1 + (8 * 2.9) = 24.2
      // sizeY should remain unchanged
    });
  });

  describe('Intensity Mapping - SizeY Primary Property', () => {
    it('should map intensity to sizeY when primaryProperty is sizeY', () => {
      const config: PixelateFilterConfig = {
        type: 'pixelate',
        enabled: true,
        intensity: createFilterIntensity(4),
        primaryProperty: 'sizeY'
      };

      const result = createPixelateFilter(config);

      // Test intensity 4: 1 + (4 * 2.9) = 12.6
      expect(mockPixelateFilter.sizeY).toBe(12.6);

      result.updateIntensity(createFilterIntensity(9));
      expect(mockPixelateFilter.sizeY).toBeCloseTo(27.1, 1); // 1 + (9 * 2.9) = 27.1
    });
  });

  describe('Initial Intensity Application', () => {
    it('should apply initial intensity on creation', () => {
      const config: PixelateFilterConfig = {
        type: 'pixelate',
        enabled: true,
        intensity: createFilterIntensity(7),
        size: 5 // This should be overridden by intensity
      };

      const _result = createPixelateFilter(config);
      expect(mockPixelateFilter.size).toBe(21.3); // intensity applied using formula: 1 + (7 * 2.9) = 21.3
    });

    it('should apply sizeX when primaryProperty is sizeX', () => {
      const config: PixelateFilterConfig = {
        type: 'pixelate',
        enabled: true,
        intensity: createFilterIntensity(6),
        primaryProperty: 'sizeX'
      };

      const _result = createPixelateFilter(config);
      expect(mockPixelateFilter.sizeX).toBe(18.4); // intensity applied using formula: 1 + (6 * 2.9) = 18.4
      // sizeY should remain unchanged when primaryProperty is sizeX
    });
  });

  describe('Reset Functionality', () => {
    it('should reset to original configuration values with size', () => {
      const config: PixelateFilterConfig = {
        type: 'pixelate',
        enabled: true,
        intensity: createFilterIntensity(6),
        size: 12,
        primaryProperty: 'size'
      };

      const result = createPixelateFilter(config);

      // Modify values
      result.updateIntensity(createFilterIntensity(2));
      expect(mockPixelateFilter.size).toBe(6.8);

      // Reset should restore configured values and apply intensity
      result.reset();
      expect(mockPixelateFilter.size).toBe(18.4); // intensity reapplied: 1 + (6 * 2.9) = 18.4
    });

    it('should reset to original configuration values with sizeX and sizeY', () => {
      const config: PixelateFilterConfig = {
        type: 'pixelate',
        enabled: true,
        intensity: createFilterIntensity(5),
        sizeX: 15,
        sizeY: 10,
        primaryProperty: 'sizeX'
      };

      const result = createPixelateFilter(config);

      // Modify values
      result.updateIntensity(createFilterIntensity(1));
      expect(mockPixelateFilter.sizeX).toBe(3.9);

      // Reset should restore configured values and apply intensity
      result.reset();
      expect(mockPixelateFilter.sizeX).toBe(15.5); // intensity reapplied: 1 + (5 * 2.9) = 15.5
      expect(mockPixelateFilter.sizeY).toBe(10); // restored to config value
    });

    it('should reset to defaults when no config values provided', () => {
      const config: PixelateFilterConfig = {
        type: 'pixelate',
        enabled: true,
        intensity: createFilterIntensity(4)
      };

      const result = createPixelateFilter(config);

      // Reset should restore minimal pixelation and apply intensity
      result.reset();
      expect(mockPixelateFilter.size).toBe(1); // defaults to minimal pixelation (1)
    });
  });

  describe('Edge Cases', () => {
    it('should handle intensity values outside 0-10 range', () => {
      const config: PixelateFilterConfig = {
        type: 'pixelate',
        enabled: true,
        intensity: createFilterIntensity(5),
        primaryProperty: 'size'
      };

      const result = createPixelateFilter(config);

      // Test clamping to valid range
      result.updateIntensity(-5 as any); // Should clamp to 0
      expect(mockPixelateFilter.size).toBe(1); // 1 + (0 * 2.9) = 1

      result.updateIntensity(15 as any); // Should clamp to 10
      expect(mockPixelateFilter.size).toBe(30); // 1 + (10 * 2.9) = 30
    });

    it('should throw error for invalid intensity values in createFilterIntensity', () => {
      expect(() => createFilterIntensity(-1)).toThrow();
      expect(() => createFilterIntensity(11)).toThrow();
      expect(() => createFilterIntensity(NaN)).toThrow();
    });
  });

  describe('Resource Management', () => {
    it('should dispose filter resources properly', () => {
      const config: PixelateFilterConfig = {
        type: 'pixelate',
        enabled: true,
        intensity: createFilterIntensity(5)
      };

      const result = createPixelateFilter(config);
      const destroySpy = vi.spyOn(mockPixelateFilter, 'destroy');

      result.dispose?.();

      expect(destroySpy).toHaveBeenCalledOnce();
    });
  });
}); 