/**
 * AdvancedBloomFilter Unit Tests
 * 
 * Tests the AdvancedBloomFilter wrapper class behavior with mocked dependencies.
 * Focuses on bloom-specific properties, intensity mapping, and state management.
 * 
 * @module AdvancedBloomFilterUnitTests
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AdvancedBloomFilter, type AdvancedBloomFilterConfig } from '../../../filters/AdvancedBloomFilter';
import { createFilterIntensity } from '../../../types/filters';

// Mock PIXI AdvancedBloomFilter
vi.mock('pixi-filters', () => ({
  AdvancedBloomFilter: vi.fn().mockImplementation(function(this: any, options: Record<string, unknown> = {}) {
    // Mock implementation of PIXI AdvancedBloomFilter
    this.bloomScale = options.bloomScale ?? 1;
    this.brightness = options.brightness ?? 1;
    this.blur = options.blur ?? 2;
    this.threshold = options.threshold ?? 0.5;
    this.quality = options.quality ?? 4;
    this.pixelSize = options.pixelSize ?? { x: 1, y: 1 };
    this.enabled = true;
    
    this.destroy = vi.fn();
    
    return this;
  })
}));

describe('AdvancedBloomFilter Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Construction & Basic Properties', () => {
    it('should create filter with default configuration', () => {
      const config: AdvancedBloomFilterConfig = {
        type: 'advancedBloom',
        enabled: true,
        intensity: createFilterIntensity(5)
      };

      const filter = new AdvancedBloomFilter(config);

      expect(filter).toBeDefined();
      expect(filter.filter).toBeDefined();
      expect(filter.config).toEqual(config);
    });

    it('should create filter with custom bloom properties', () => {
      const config: AdvancedBloomFilterConfig = {
        type: 'advancedBloom',
        enabled: true,
        // No intensity to avoid auto-scaling
        bloomScale: 1.5,
        brightness: 1.2,
        blur: 3,
        threshold: 0.3,
        quality: 6,
        pixelSizeX: 2,
        pixelSizeY: 2
      };

      const filter = new AdvancedBloomFilter(config);
      const state = filter.getState();

      expect(state.bloomScale).toBe(1.5);
      expect(state.brightness).toBe(1.2);
      expect(state.blur).toBe(3);
      expect(state.threshold).toBe(0.3);
      expect(state.quality).toBe(6);
    });

    it('should handle PointData pixelSize configuration', () => {
      const config: AdvancedBloomFilterConfig = {
        type: 'advancedBloom',
        enabled: true,
        intensity: createFilterIntensity(5),
        pixelSize: { x: 3, y: 4 }
      };

      const filter = new AdvancedBloomFilter(config);
      const state = filter.getState();

      expect(state.pixelSize).toEqual({ x: 3, y: 4 });
    });

    it('should handle primary property configuration', () => {
      const config: AdvancedBloomFilterConfig = {
        type: 'advancedBloom',
        enabled: true,
        intensity: createFilterIntensity(6),
        primaryProperty: 'threshold'
      };

      const filter = new AdvancedBloomFilter(config);

      expect(filter).toBeDefined();
      expect(filter.config.primaryProperty).toBe('threshold');
    });
  });

  describe('Intensity Updates', () => {
    it('should update bloomScale and brightness by default when no primary property set', () => {
      const config: AdvancedBloomFilterConfig = {
        type: 'advancedBloom',
        enabled: true,
        intensity: createFilterIntensity(0)
      };

      const filter = new AdvancedBloomFilter(config);
      filter.updateIntensity(createFilterIntensity(10));
      
      const state = filter.getState();
      expect(state.bloomScale).toBe(2); // 10/5 = 2
      expect(state.brightness).toBe(1); // 0.5 + (10/20) = 1.0
    });

    it('should update specific property when primaryProperty is set to bloomScale', () => {
      const config: AdvancedBloomFilterConfig = {
        type: 'advancedBloom',
        enabled: true,
        intensity: createFilterIntensity(0),
        primaryProperty: 'bloomScale'
      };

      const filter = new AdvancedBloomFilter(config);
      filter.updateIntensity(createFilterIntensity(5));
      
      const state = filter.getState();
      expect(state.bloomScale).toBe(1); // 5/5 = 1
    });

    it('should update specific property when primaryProperty is set to brightness', () => {
      const config: AdvancedBloomFilterConfig = {
        type: 'advancedBloom',
        enabled: true,
        intensity: createFilterIntensity(0),
        primaryProperty: 'brightness'
      };

      const filter = new AdvancedBloomFilter(config);
      filter.updateIntensity(createFilterIntensity(10));
      
      const state = filter.getState();
      expect(state.brightness).toBe(2); // 10/5 = 2
    });

    it('should update specific property when primaryProperty is set to blur', () => {
      const config: AdvancedBloomFilterConfig = {
        type: 'advancedBloom',
        enabled: true,
        intensity: createFilterIntensity(0),
        primaryProperty: 'blur'
      };

      const filter = new AdvancedBloomFilter(config);
      filter.updateIntensity(createFilterIntensity(8));
      
      const state = filter.getState();
      expect(state.blur).toBe(4); // max(1, 8/2) = 4
    });

    it('should update specific property when primaryProperty is set to threshold', () => {
      const config: AdvancedBloomFilterConfig = {
        type: 'advancedBloom',
        enabled: true,
        intensity: createFilterIntensity(0),
        primaryProperty: 'threshold'
      };

      const filter = new AdvancedBloomFilter(config);
      filter.updateIntensity(createFilterIntensity(7));
      
      const state = filter.getState();
      expect(state.threshold).toBe(0.7); // 7/10 = 0.7
    });

    it('should handle blur minimum value constraint', () => {
      const config: AdvancedBloomFilterConfig = {
        type: 'advancedBloom',
        enabled: true,
        intensity: createFilterIntensity(0),
        primaryProperty: 'blur'
      };

      const filter = new AdvancedBloomFilter(config);
      
      // Test minimum blur value (should be at least 1)
      filter.updateIntensity(createFilterIntensity(0));
      let state = filter.getState();
      expect(state.blur).toBe(1); // max(1, 0/2) = 1
      
      filter.updateIntensity(createFilterIntensity(1));
      state = filter.getState();
      expect(state.blur).toBe(1); // max(1, 1/2) = 1
    });

    it('should clamp threshold values to valid range (0-1)', () => {
      const config: AdvancedBloomFilterConfig = {
        type: 'advancedBloom',
        enabled: true,
        intensity: createFilterIntensity(0),
        primaryProperty: 'threshold'
      };

      const filter = new AdvancedBloomFilter(config);
      
      // Test minimum
      filter.updateIntensity(createFilterIntensity(0));
      let state = filter.getState();
      expect(state.threshold).toBe(0); // 0/10 = 0
      
      // Test maximum
      filter.updateIntensity(createFilterIntensity(10));
      state = filter.getState();
      expect(state.threshold).toBe(1); // 10/10 = 1
    });
  });

  describe('Reset Functionality', () => {
    it('should reset to original configured values', () => {
      const config: AdvancedBloomFilterConfig = {
        type: 'advancedBloom',
        enabled: true,
        // intensity: createFilterIntensity(5), // Remove intensity to test pure config values
        bloomScale: 1.5,
        brightness: 1.3,
        blur: 4,
        threshold: 0.2,
        quality: 8
      };

      const filter = new AdvancedBloomFilter(config);
      
      // Modify values with intensity
      filter.updateIntensity(createFilterIntensity(8));
      
      // Reset should restore original configured values
      filter.reset();
      
      const state = filter.getState();
      expect(state.bloomScale).toBe(1.5);
      expect(state.brightness).toBe(1.3);
      expect(state.blur).toBe(4);
      expect(state.threshold).toBe(0.2);
      expect(state.quality).toBe(8);
    });

    it('should reset to default values when no specific properties configured', () => {
      const config: AdvancedBloomFilterConfig = {
        type: 'advancedBloom',
        enabled: true
        // No intensity configured
      };

      const filter = new AdvancedBloomFilter(config);
      
      // Modify values with intensity
      filter.updateIntensity(createFilterIntensity(8));
      
      // Reset should restore defaults
      filter.reset();
      
      const state = filter.getState();
      expect(state.bloomScale).toBe(1);
      expect(state.brightness).toBe(1);
      expect(state.blur).toBe(2);
      expect(state.threshold).toBe(0.5);
      expect(state.quality).toBe(4);
    });

    it('should reset pixelSize correctly', () => {
      const config: AdvancedBloomFilterConfig = {
        type: 'advancedBloom',
        enabled: true,
        intensity: createFilterIntensity(5),
        pixelSize: { x: 3, y: 5 }
      };

      const filter = new AdvancedBloomFilter(config);
      
      // Modify with intensity
      filter.updateIntensity(createFilterIntensity(7));
      
      // Reset should restore configured pixelSize
      filter.reset();
      
      const state = filter.getState();
      expect(state.pixelSize).toEqual({ x: 3, y: 5 });
    });

    it('should reset pixelSizeX/Y to pixelSize object', () => {
      const config: AdvancedBloomFilterConfig = {
        type: 'advancedBloom',
        enabled: true,
        intensity: createFilterIntensity(5),
        pixelSizeX: 4,
        pixelSizeY: 6
      };

      const filter = new AdvancedBloomFilter(config);
      
      // Reset should convert individual X/Y to pixelSize object
      filter.reset();
      
      const state = filter.getState();
      expect(state.pixelSize).toEqual({ x: 4, y: 6 });
    });
  });

  describe('State Management', () => {
    it('should return comprehensive state information', () => {
      const config: AdvancedBloomFilterConfig = {
        type: 'advancedBloom',
        enabled: true,
        intensity: createFilterIntensity(6),
        bloomScale: 1.2,
        threshold: 0.4
      };

      const filter = new AdvancedBloomFilter(config);
      const state = filter.getState();

      expect(state).toHaveProperty('bloomScale');
      expect(state).toHaveProperty('brightness');
      expect(state).toHaveProperty('blur');
      expect(state).toHaveProperty('threshold');
      expect(state).toHaveProperty('quality');
      expect(state).toHaveProperty('pixelSize');
      expect(state).toHaveProperty('configuredBloomScale');
      expect(state).toHaveProperty('configuredBrightness');
      expect(state).toHaveProperty('configuredThreshold');
      
      expect(state.bloomScale).toBe(1.2);
      expect(state.threshold).toBe(0.4);
    });

    it('should track state changes correctly', () => {
      const config: AdvancedBloomFilterConfig = {
        type: 'advancedBloom',
        enabled: true,
        intensity: createFilterIntensity(5),
        primaryProperty: 'bloomScale'
      };

      const filter = new AdvancedBloomFilter(config);
      
      const initialState = filter.getState();
      expect(initialState.bloomScale).toBe(1);
      
      filter.updateIntensity(createFilterIntensity(6));
      
      const updatedState = filter.getState();
      expect(updatedState.bloomScale).toBe(1.2); // 6/5 = 1.2
      expect(updatedState.bloomScale).not.toBe(initialState.bloomScale);
    });
  });

  describe('Property Validation & Edge Cases', () => {
    it('should handle unknown primary property gracefully', () => {
      const config: AdvancedBloomFilterConfig = {
        type: 'advancedBloom',
        enabled: true,
        intensity: createFilterIntensity(5),
        primaryProperty: 'nonexistent' as any
      };

      const filter = new AdvancedBloomFilter(config);
      filter.updateIntensity(createFilterIntensity(6));
      
      const state = filter.getState();
      // Should default to bloomScale when unknown property
      expect(state.bloomScale).toBe(1.2); // 6/5 = 1.2
    });

    it('should handle partial configuration correctly', () => {
      const config: AdvancedBloomFilterConfig = {
        type: 'advancedBloom',
        enabled: true,
        // No intensity to avoid auto-scaling
        bloomScale: 1.8
        // Only bloomScale specified, others should use defaults
      };

      const filter = new AdvancedBloomFilter(config);
      const state = filter.getState();
      
      expect(state.bloomScale).toBe(1.8);
      expect(state.brightness).toBe(1); // Default
      expect(state.blur).toBe(2);       // Default
      expect(state.threshold).toBe(0.5); // Default
    });

    it('should handle zero intensity correctly', () => {
      const config: AdvancedBloomFilterConfig = {
        type: 'advancedBloom',
        enabled: true,
        intensity: createFilterIntensity(0),
        primaryProperty: 'threshold'
      };

      const filter = new AdvancedBloomFilter(config);
      filter.updateIntensity(createFilterIntensity(0));
      
      const state = filter.getState();
      expect(state.threshold).toBe(0); // 0/10 = 0
    });

    it('should handle maximum intensity values correctly', () => {
      const config: AdvancedBloomFilterConfig = {
        type: 'advancedBloom',
        enabled: true,
        intensity: createFilterIntensity(0),
        primaryProperty: 'bloomScale'
      };

      const filter = new AdvancedBloomFilter(config);
      filter.updateIntensity(createFilterIntensity(10));
      
      const state = filter.getState();
      expect(state.bloomScale).toBe(2); // 10/5 = 2
    });
  });

  describe('Resource Management', () => {
    it('should call dispose on the underlying filter', () => {
      const config: AdvancedBloomFilterConfig = {
        type: 'advancedBloom',
        enabled: true,
        intensity: createFilterIntensity(5)
      };

      const filter = new AdvancedBloomFilter(config);
      const mockDestroy = vi.fn();
      (filter.filter as any).destroy = mockDestroy;

      filter.dispose();

      expect(mockDestroy).toHaveBeenCalledOnce();
    });

    it('should handle dispose gracefully when filter has no destroy method', () => {
      const config: AdvancedBloomFilterConfig = {
        type: 'advancedBloom',
        enabled: true,
        intensity: createFilterIntensity(5)
      };

      const filter = new AdvancedBloomFilter(config);
      delete (filter.filter as any).destroy;

      expect(() => filter.dispose()).not.toThrow();
    });
  });

  describe('Integration Points', () => {
    it('should work with FilterManager-style intensity updates', () => {
      const config: AdvancedBloomFilterConfig = {
        type: 'advancedBloom',
        enabled: true,
        intensity: createFilterIntensity(5),
        primaryProperty: 'brightness'
      };

      const filter = new AdvancedBloomFilter(config);
      
      // Simulate FilterManager calling updateIntensity
      const intensityUpdates = [2, 8, 3, 9, 5].map(createFilterIntensity);
      
      intensityUpdates.forEach(intensity => {
        expect(() => filter.updateIntensity(intensity)).not.toThrow();
      });
      
      const finalState = filter.getState();
      expect(finalState.brightness).toBe(1); // 5/5 = 1
    });

    it('should maintain BaseFilter compatibility', () => {
      const config: AdvancedBloomFilterConfig = {
        type: 'advancedBloom',
        enabled: true,
        intensity: createFilterIntensity(5)
      };

      const filter = new AdvancedBloomFilter(config);

      // Should have BaseFilter methods
      expect(typeof filter.updateIntensity).toBe('function');
      expect(typeof filter.reset).toBe('function');
      expect(typeof filter.getState).toBe('function');
      expect(typeof filter.dispose).toBe('function');
      
      // Should have BaseFilter properties
      expect(filter.filter).toBeDefined();
      expect(filter.config).toBeDefined();
    });
  });
}); 