/**
 * Filter Type System Unit Tests
 * 
 * Tests for filter types, branded types, helper functions, and type guards.
 * Ensures type safety and proper validation of filter configurations.
 */

import { describe, it, expect } from 'vitest';
import {
  createFilterIntensity,
  createFilterId,
  createFilterCacheKey,
  isDisplacementFilter,
  isBlurFilter,
  isGlowFilter,
  isGlitchFilter,
  isRGBSplitFilter,
  isAdjustmentFilter,
  isShockwaveFilter,
  type FilterIntensity,
  type FilterId,
  type FilterCacheKey,
  type DisplacementFilterConfig,
  type BlurFilterConfig,
  type GlowFilterConfig
} from '../../../types/filters';

describe('Filter Type System', () => {
  describe('Branded Type Creation', () => {
    describe('createFilterIntensity', () => {
      it('should create valid intensity within range', () => {
        const intensity = createFilterIntensity(5);
        expect(intensity).toBe(5);
        expect(typeof intensity).toBe('number');
      });

      it('should throw error for intensity below minimum (0)', () => {
        expect(() => createFilterIntensity(-5)).toThrow('FilterIntensity must be between 0 and 10');
      });

      it('should throw error for intensity above maximum (10)', () => {
        expect(() => createFilterIntensity(15)).toThrow('FilterIntensity must be between 0 and 10');
      });

      it('should handle edge cases', (): void => {
        expect(createFilterIntensity(0)).toBe(0);
        expect(createFilterIntensity(10)).toBe(10);
        expect(createFilterIntensity(5.5)).toBe(5.5);
      });

      it('should throw error for invalid inputs', () => {
        expect(() => createFilterIntensity(NaN)).toThrow('FilterIntensity must be a finite number');
        expect(() => createFilterIntensity(Infinity)).toThrow('FilterIntensity must be a finite number');
        expect(() => createFilterIntensity(-Infinity)).toThrow('FilterIntensity must be a finite number');
      });
    });

    describe('createFilterId', () => {
      it('should create filter ID from string', () => {
        const id = createFilterId('test-filter-123');
        expect(id).toBe('test-filter-123');
        expect(typeof id).toBe('string');
      });

      it('should handle empty string', () => {
        const id = createFilterId('');
        expect(id).toBe('');
      });

      it('should handle special characters', () => {
        const id = createFilterId('filter-123_test@domain.com');
        expect(id).toBe('filter-123_test@domain.com');
      });
    });

    describe('createFilterCacheKey', () => {
      it('should create consistent cache key for same config', () => {
        const config: BlurFilterConfig = {
          type: 'blur',
          enabled: true,
          intensity: createFilterIntensity(5),
          strength: 8
        };

        const key1 = createFilterCacheKey(config);
        const key2 = createFilterCacheKey(config);
        
        expect(key1).toBe(key2);
        expect(typeof key1).toBe('string');
        expect(key1).toContain('blur');
        expect(key1).toContain('5');
      });

      it('should create different keys for different configs', () => {
        const config1: BlurFilterConfig = {
          type: 'blur',
          enabled: true,
          intensity: createFilterIntensity(5),
          strength: 8
        };

        const config2: BlurFilterConfig = {
          type: 'blur',
          enabled: true,
          intensity: createFilterIntensity(7),
          strength: 8
        };

        const key1 = createFilterCacheKey(config1);
        const key2 = createFilterCacheKey(config2);
        
        expect(key1).not.toBe(key2);
      });

      it('should handle complex configurations', () => {
        const config: DisplacementFilterConfig = {
          type: 'displacement',
          enabled: true,
          intensity: createFilterIntensity(8),
          displacementMap: 'texture.png',
          scaleX: 30,
          scaleY: 25,
          primaryProperty: 'scaleX'
        };

        const key = createFilterCacheKey(config);
        expect(key).toContain('displacement');
        expect(key).toContain('8');
        expect(typeof key).toBe('string');
        expect(key.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Type Guards', () => {
    const createBaseConfig = (type: string): { type: string; enabled: boolean; intensity: FilterIntensity } => ({
      type,
      enabled: true,
      intensity: createFilterIntensity(5)
    });

    describe('isDisplacementFilter', () => {
      it('should identify displacement filter correctly', () => {
        const config: DisplacementFilterConfig = {
          ...createBaseConfig('displacement'),
          type: 'displacement',
          displacementMap: 'texture.png'
        };

        expect(isDisplacementFilter(config)).toBe(true);
      });

      it('should reject non-displacement filters', () => {
        const config: BlurFilterConfig = {
          ...createBaseConfig('blur'),
          type: 'blur',
          strength: 8
        };

        expect(isDisplacementFilter(config)).toBe(false);
      });
    });

    describe('isBlurFilter', () => {
      it('should identify blur filter correctly', () => {
        const config: BlurFilterConfig = {
          ...createBaseConfig('blur'),
          type: 'blur',
          strength: 8
        };

        expect(isBlurFilter(config)).toBe(true);
      });

      it('should reject non-blur filters', () => {
        const config: DisplacementFilterConfig = {
          ...createBaseConfig('displacement'),
          type: 'displacement',
          displacementMap: 'texture.png'
        };

        expect(isBlurFilter(config)).toBe(false);
      });
    });

    describe('isGlowFilter', () => {
      it('should identify glow filter correctly', () => {
        const config: GlowFilterConfig = {
          ...createBaseConfig('glow'),
          type: 'glow',
          distance: 10
        };

        expect(isGlowFilter(config)).toBe(true);
      });

      it('should reject non-glow filters', () => {
        const config: BlurFilterConfig = {
          ...createBaseConfig('blur'),
          type: 'blur',
          strength: 8
        };

        expect(isGlowFilter(config)).toBe(false);
      });
    });

    describe('Type Guard Completeness', () => {
      it('should have type guards for all implemented filter types', () => {
        // Test that we have type guards for the main filter types
        expect(typeof isDisplacementFilter).toBe('function');
        expect(typeof isBlurFilter).toBe('function');
        expect(typeof isGlowFilter).toBe('function');
        expect(typeof isGlitchFilter).toBe('function');
        expect(typeof isRGBSplitFilter).toBe('function');
        expect(typeof isAdjustmentFilter).toBe('function');
        expect(typeof isShockwaveFilter).toBe('function');
      });
    });
  });

  describe('Filter Configuration Validation', () => {
    describe('DisplacementFilterConfig', () => {
      it('should accept valid displacement configuration', () => {
        const config: DisplacementFilterConfig = {
          type: 'displacement',
          enabled: true,
          intensity: createFilterIntensity(5),
          displacementMap: 'texture.png',
          scaleX: 20,
          scaleY: 20
        };

        expect(config.type).toBe('displacement');
        expect(config.enabled).toBe(true);
        expect(config.intensity).toBe(5);
        expect(config.displacementMap).toBe('texture.png');
      });

      it('should accept texture object as displacement map', () => {
        const mockTexture = { width: 256, height: 256 } as any;
        
        const config: DisplacementFilterConfig = {
          type: 'displacement',
          enabled: true,
          intensity: createFilterIntensity(5),
          displacementMap: mockTexture
        };

        expect(config.displacementMap).toBe(mockTexture);
      });
    });

    describe('BlurFilterConfig', () => {
      it('should accept valid blur configuration', () => {
        const config: BlurFilterConfig = {
          type: 'blur',
          enabled: true,
          intensity: createFilterIntensity(7),
          strength: 10,
          quality: 6,
          strengthX: 8,
          strengthY: 12,
          repeatEdgePixels: true
        };

        expect(config.type).toBe('blur');
        expect(config.strength).toBe(10);
        expect(config.quality).toBe(6);
        expect(config.strengthX).toBe(8);
        expect(config.strengthY).toBe(12);
        expect(config.repeatEdgePixels).toBe(true);
      });

      it('should work with minimal configuration', () => {
        const config: BlurFilterConfig = {
          type: 'blur',
          enabled: true,
          intensity: createFilterIntensity(5)
        };

        expect(config.type).toBe('blur');
        expect(config.enabled).toBe(true);
        expect(config.intensity).toBe(5);
      });
    });
  });

  describe('Type Safety', () => {
    it('should prevent mixing branded types', () => {
      const intensity: FilterIntensity = createFilterIntensity(5);
      const id: FilterId = createFilterId('test');
      const cacheKey: FilterCacheKey = createFilterCacheKey({
        type: 'blur',
        enabled: true,
        intensity
      } as BlurFilterConfig);

      // These should be different branded types
      expect(typeof intensity).toBe('number');
      expect(typeof id).toBe('string');
      expect(typeof cacheKey).toBe('string');
      
      // TypeScript should prevent assignment between branded types
      // (This is compile-time validation, but we can test the values)
      expect(intensity).not.toBe(id);
      expect(intensity.toString()).not.toBe(cacheKey);
    });

    it('should maintain type information through operations', () => {
      const intensity1 = createFilterIntensity(3);
      const intensity2 = createFilterIntensity(7);
      
      // Mathematical operations should preserve the underlying number type
      const sum = (intensity1 + intensity2) as FilterIntensity;
      expect(sum).toBe(10);
      
      const average = ((intensity1 + intensity2) / 2) as FilterIntensity;
      expect(average).toBe(5);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should throw error for undefined and null values', () => {
      // These should be handled by TypeScript, but test runtime behavior
      expect(() => createFilterIntensity(undefined as any)).toThrow('FilterIntensity must be a finite number');
      expect(() => createFilterId(undefined as any)).not.toThrow();
    });

    it('should throw error for extreme values', () => {
      expect(() => createFilterIntensity(Number.MAX_VALUE)).toThrow('FilterIntensity must be between 0 and 10');
      expect(createFilterIntensity(Number.MIN_VALUE)).toBeCloseTo(0, 10);
      expect(() => createFilterIntensity(-Number.MAX_VALUE)).toThrow('FilterIntensity must be between 0 and 10');
    });

    it('should throw error for special number values', () => {
      expect(() => createFilterIntensity(NaN)).toThrow('FilterIntensity must be a finite number');
      expect(() => createFilterIntensity(Infinity)).toThrow('FilterIntensity must be a finite number');
      expect(() => createFilterIntensity(-Infinity)).toThrow('FilterIntensity must be a finite number');
    });
  });
}); 