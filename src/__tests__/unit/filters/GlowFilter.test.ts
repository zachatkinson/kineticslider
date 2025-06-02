/**
 * GlowFilter Unit Tests
 * 
 * Tests for the GlowFilter implementation including creation,
 * intensity updates, state management, and resource cleanup.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  createFilterIntensity,
  type GlowFilterConfig 
} from '../../../types/filters';

// Mock pixi-filters to avoid WebGL dependencies
vi.mock('pixi-filters', () => ({
  GlowFilter: class MockGlowFilter {
    enabled = true;
    distance = 10;
    innerStrength = 0;
    outerStrength = 4;
    quality = 0.1;
    color = 0xffffff;
    alpha = 1;
    knockout = false;
    
    constructor(options?: any) {
      if (options) {
        Object.assign(this, options);
      }
    }
    
    destroy = vi.fn();
  }
}));

describe('GlowFilter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Filter Creation', () => {
    it('should create a glow filter with default configuration', async () => {
      const { createFilter } = await import('../../../filters/GlowFilter');
      
      const config: GlowFilterConfig = {
        type: 'glow',
        enabled: true,
        intensity: createFilterIntensity(5)
      };

      const result = createFilter(config);
      
      expect(result).toBeDefined();
      expect(result.filter).toBeDefined();
      expect(result.config).toEqual(config);
      expect(result.updateIntensity).toBeInstanceOf(Function);
      expect(result.reset).toBeInstanceOf(Function);
      expect(result.dispose).toBeInstanceOf(Function);
    });

    it('should create a glow filter with custom configuration', async () => {
      const { createFilter } = await import('../../../filters/GlowFilter');
      
      const config: GlowFilterConfig = {
        type: 'glow',
        enabled: true,
        intensity: createFilterIntensity(8),
        distance: 15,
        innerStrength: 2,
        outerStrength: 6,
        quality: 0.2,
        color: 0xff0000,
        alpha: 0.8,
        knockout: true
      };

      const result = createFilter(config);
      
      expect(result).toBeDefined();
      expect(result.filter.enabled).toBe(true);
    });

    it('should handle disabled filter', async () => {
      const { createFilter } = await import('../../../filters/GlowFilter');
      
      const config: GlowFilterConfig = {
        type: 'glow',
        enabled: false,
        intensity: createFilterIntensity(3)
      };

      const result = createFilter(config);
      
      expect(result.filter.enabled).toBe(false);
    });
  });

  describe('Intensity Control', () => {
    it('should have updateIntensity function', async () => {
      const { createFilter } = await import('../../../filters/GlowFilter');
      
      const config: GlowFilterConfig = {
        type: 'glow',
        enabled: true,
        intensity: createFilterIntensity(5)
      };

      const result = createFilter(config);
      
      expect(result.updateIntensity).toBeInstanceOf(Function);
      expect(() => result.updateIntensity(createFilterIntensity(8))).not.toThrow();
    });

    it('should handle intensity range', async () => {
      const { createFilter } = await import('../../../filters/GlowFilter');
      
      const config: GlowFilterConfig = {
        type: 'glow',
        enabled: true,
        intensity: createFilterIntensity(5)
      };

      const result = createFilter(config);
      
      // Test different intensity values
      expect(() => result.updateIntensity(createFilterIntensity(0))).not.toThrow();
      expect(() => result.updateIntensity(createFilterIntensity(5))).not.toThrow();
      expect(() => result.updateIntensity(createFilterIntensity(10))).not.toThrow();
    });
  });

  describe('State Management', () => {
    it('should have reset function', async () => {
      const { createFilter } = await import('../../../filters/GlowFilter');
      
      const config: GlowFilterConfig = {
        type: 'glow',
        enabled: true,
        intensity: createFilterIntensity(7)
      };

      const result = createFilter(config);
      
      expect(result.reset).toBeInstanceOf(Function);
      expect(() => result.reset()).not.toThrow();
    });

    it('should have getState function', async () => {
      const { createFilter } = await import('../../../filters/GlowFilter');
      
      const config: GlowFilterConfig = {
        type: 'glow',
        enabled: true,
        intensity: createFilterIntensity(7)
      };

      const result = createFilter(config);
      
      expect(result.getState).toBeInstanceOf(Function);
      expect(() => result.getState?.()).not.toThrow();
    });
  });

  describe('Resource Management', () => {
    it('should have dispose function', async () => {
      const { createFilter } = await import('../../../filters/GlowFilter');
      
      const config: GlowFilterConfig = {
        type: 'glow',
        enabled: true,
        intensity: createFilterIntensity(5)
      };

      const result = createFilter(config);
      
      expect(result.dispose).toBeInstanceOf(Function);
      expect(() => result.dispose?.()).not.toThrow();
    });
  });

  describe('Configuration Validation', () => {
    it('should handle all glow filter properties', async () => {
      const { createFilter } = await import('../../../filters/GlowFilter');
      
      const config: GlowFilterConfig = {
        type: 'glow',
        enabled: true,
        intensity: createFilterIntensity(6),
        distance: 20,
        innerStrength: 3,
        outerStrength: 7,
        quality: 0.3,
        color: 0x00ff00,
        alpha: 0.9,
        knockout: false,
        primaryProperty: 'outerStrength'
      };

      const result = createFilter(config);
      
      expect(result).toBeDefined();
      expect(result.config).toEqual(config);
    });

    it('should handle primaryProperty variations', async () => {
      const { createFilter } = await import('../../../filters/GlowFilter');
      
      const properties: Array<'innerStrength' | 'outerStrength' | 'distance'> = [
        'innerStrength',
        'outerStrength', 
        'distance'
      ];

      for (const primaryProperty of properties) {
        const config: GlowFilterConfig = {
          type: 'glow',
          enabled: true,
          intensity: createFilterIntensity(5),
          primaryProperty
        };

        const result = createFilter(config);
        expect(result).toBeDefined();
        expect(result.config.primaryProperty).toBe(primaryProperty);
      }
    });
  });
}); 