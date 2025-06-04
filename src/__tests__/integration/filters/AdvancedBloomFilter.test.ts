/**
 * AdvancedBloomFilter Integration Tests
 * 
 * Tests the AdvancedBloomFilter class with real PIXI.js dependencies.
 * Validates bloom-specific properties, intensity scaling, and PIXI API compliance.
 * 
 * @module AdvancedBloomFilterIntegrationTests
 * @version 1.0.0
 * @requires @pixi/filter-advanced-bloom
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AdvancedBloomFilter, type AdvancedBloomFilterConfig } from '../../../filters/AdvancedBloomFilter';
import { createFilterIntensity } from '../../../types/filters';

describe('AdvancedBloomFilter Integration Tests', () => {
  beforeEach(() => {
    // Clear any previous state
  });

  describe('PIXI Filter Creation & Properties', () => {
    it('should create a real PIXI AdvancedBloomFilter instance', () => {
      const config: AdvancedBloomFilterConfig = {
        type: 'advancedBloom',
        enabled: true
      };

      const filter = new AdvancedBloomFilter(config);
      
      expect(filter.filter).toBeDefined();
      expect(filter.filter.constructor.name).toBe('_AdvancedBloomFilter');
    });

    it('should initialize with correct default properties', () => {
      const config: AdvancedBloomFilterConfig = {
        type: 'advancedBloom',
        enabled: true
      };

      const filter = new AdvancedBloomFilter(config);
      const state = filter.getState();

      expect(state.bloomScale).toBe(1);
      expect(state.brightness).toBe(1);
      expect(state.blur).toBe(2);
      expect(state.threshold).toBe(0.5);
      expect(state.quality).toBe(4);
    });

    it('should initialize with custom property values', () => {
      const config: AdvancedBloomFilterConfig = {
        type: 'advancedBloom',
        enabled: true,
        bloomScale: 1.8,
        brightness: 1.5,
        blur: 3,
        threshold: 0.2,
        quality: 6
      };

      const filter = new AdvancedBloomFilter(config);
      const state = filter.getState();

      expect(state.bloomScale).toBe(1.8);
      expect(state.brightness).toBe(1.5);
      expect(state.blur).toBe(3);
      expect(state.threshold).toBe(0.2);
      expect(state.quality).toBe(6);
    });

    it('should handle partial configuration with defaults', () => {
      const config: AdvancedBloomFilterConfig = {
        type: 'advancedBloom',
        enabled: true,
        bloomScale: 2.0,
        threshold: 0.1
        // Other properties should use defaults
      };

      const filter = new AdvancedBloomFilter(config);
      const state = filter.getState();

      expect(state.bloomScale).toBe(2.0);
      expect(state.threshold).toBe(0.1);
      expect(state.brightness).toBe(1); // Default
      expect(state.blur).toBe(2);       // Default
      expect(state.quality).toBe(4);    // Default
    });

    it('should handle pixelSize configurations correctly', () => {
      const config: AdvancedBloomFilterConfig = {
        type: 'advancedBloom',
        enabled: true,
        pixelSize: { x: 5, y: 3 }
      };

      const filter = new AdvancedBloomFilter(config);
      const state = filter.getState();

      expect(state.pixelSize).toEqual({ x: 5, y: 3 });
    });
  });

  describe('Real Intensity Scaling', () => {
    it('should scale bloomScale and brightness by default', () => {
      const config: AdvancedBloomFilterConfig = {
        type: 'advancedBloom',
        enabled: true
      };

      const filter = new AdvancedBloomFilter(config);
      filter.updateIntensity(createFilterIntensity(10));
      
      const state = filter.getState();
      expect(state.bloomScale).toBe(2);   // 10/5 = 2
      expect(state.brightness).toBe(1);   // 0.5 + (10/20) = 1.0
    });

    it('should scale bloomScale when primaryProperty is bloomScale', () => {
      const config: AdvancedBloomFilterConfig = {
        type: 'advancedBloom',
        enabled: true,
        primaryProperty: 'bloomScale'
      };

      const filter = new AdvancedBloomFilter(config);
      
      filter.updateIntensity(createFilterIntensity(5));
      let state = filter.getState();
      expect(state.bloomScale).toBe(1); // 5/5 = 1
      
      filter.updateIntensity(createFilterIntensity(10));
      state = filter.getState();
      expect(state.bloomScale).toBe(2); // 10/5 = 2
    });

    it('should scale brightness when primaryProperty is brightness', () => {
      const config: AdvancedBloomFilterConfig = {
        type: 'advancedBloom',
        enabled: true,
        primaryProperty: 'brightness'
      };

      const filter = new AdvancedBloomFilter(config);
      
      filter.updateIntensity(createFilterIntensity(5));
      let state = filter.getState();
      expect(state.brightness).toBe(1); // 5/5 = 1
      
      filter.updateIntensity(createFilterIntensity(0));
      state = filter.getState();
      expect(state.brightness).toBe(0); // 0/5 = 0
    });

    it('should scale blur with minimum constraint when primaryProperty is blur', () => {
      const config: AdvancedBloomFilterConfig = {
        type: 'advancedBloom',
        enabled: true,
        primaryProperty: 'blur'
      };

      const filter = new AdvancedBloomFilter(config);
      
      // Test minimum constraint
      filter.updateIntensity(createFilterIntensity(0));
      let state = filter.getState();
      expect(state.blur).toBe(1); // max(1, 0/2) = 1
      
      filter.updateIntensity(createFilterIntensity(8));
      state = filter.getState();
      expect(state.blur).toBe(4); // max(1, 8/2) = 4
    });

    it('should scale threshold with 0-1 range when primaryProperty is threshold', () => {
      const config: AdvancedBloomFilterConfig = {
        type: 'advancedBloom',
        enabled: true,
        primaryProperty: 'threshold'
      };

      const filter = new AdvancedBloomFilter(config);
      
      filter.updateIntensity(createFilterIntensity(0));
      let state = filter.getState();
      expect(state.threshold).toBe(0); // 0/10 = 0
      
      filter.updateIntensity(createFilterIntensity(5));
      state = filter.getState();
      expect(state.threshold).toBe(0.5); // 5/10 = 0.5
      
      filter.updateIntensity(createFilterIntensity(10));
      state = filter.getState();
      expect(state.threshold).toBe(1); // 10/10 = 1
    });

    it('should handle all intensity property types correctly', () => {
      const properties: Array<AdvancedBloomFilterConfig['primaryProperty']> = [
        'bloomScale', 'brightness', 'blur', 'threshold'
      ];

      properties.forEach(property => {
        const config: AdvancedBloomFilterConfig = {
          type: 'advancedBloom',
          enabled: true,
          primaryProperty: property
        };

        const filter = new AdvancedBloomFilter(config);
        
        expect(() => {
          filter.updateIntensity(createFilterIntensity(5));
        }).not.toThrow();
        
        const state = filter.getState();
        if (property) {
          expect(Number.isFinite(state[property] as number)).toBe(true);
        }
      });
    });
  });

  describe('PIXI Filter Reset Behavior', () => {
    it('should reset to configured values correctly', () => {
      const config: AdvancedBloomFilterConfig = {
        type: 'advancedBloom',
        enabled: true,
        bloomScale: 1.6,
        brightness: 1.4,
        blur: 5,
        threshold: 0.3,
        quality: 8
      };

      const filter = new AdvancedBloomFilter(config);
      filter.updateIntensity(createFilterIntensity(9));
      
      // Reset should restore configured values
      filter.reset();
      
      const state = filter.getState();
      expect(state.bloomScale).toBe(1.6);
      expect(state.brightness).toBe(1.4);
      expect(state.blur).toBe(5);
      expect(state.threshold).toBe(0.3);
      expect(state.quality).toBe(8);
    });

    it('should reset to defaults when no specific values configured', () => {
      const config: AdvancedBloomFilterConfig = {
        type: 'advancedBloom',
        enabled: true
      };

      const filter = new AdvancedBloomFilter(config);
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
  });

  describe('PIXI API Compliance', () => {
    it('should properly manage enabled state', () => {
      const config: AdvancedBloomFilterConfig = {
        type: 'advancedBloom',
        enabled: false
      };

      const filter = new AdvancedBloomFilter(config);
      const state = filter.getState();
      
      // Note: PIXI filters may not have enabled property directly
      expect(state.enabled).toBe(false);
    });

    it('should expose all expected PIXI AdvancedBloomFilter properties', () => {
      const config: AdvancedBloomFilterConfig = {
        type: 'advancedBloom',
        enabled: true
      };

      const filter = new AdvancedBloomFilter(config);
      const pixiFilter = filter.filter as any;

      // Test that PIXI properties are accessible
      expect('bloomScale' in pixiFilter).toBe(true);
      expect('brightness' in pixiFilter).toBe(true);
      expect('blur' in pixiFilter).toBe(true);
      expect('threshold' in pixiFilter).toBe(true);
      expect('quality' in pixiFilter).toBe(true);
      expect('pixelSize' in pixiFilter).toBe(true);
    });

    it('should support filter chaining', () => {
      const config: AdvancedBloomFilterConfig = {
        type: 'advancedBloom',
        enabled: true
      };

      const filter = new AdvancedBloomFilter(config);
      
      // PIXI filters should be chainable (have apply method)
      expect('apply' in filter.filter).toBe(true);
      expect(typeof (filter.filter as any).apply).toBe('function');
    });

    it('should validate property types match PIXI expectations', () => {
      const config: AdvancedBloomFilterConfig = {
        type: 'advancedBloom',
        enabled: true,
        bloomScale: 1.5,
        brightness: 1.2,
        blur: 3,
        threshold: 0.4,
        quality: 6
      };

      const filter = new AdvancedBloomFilter(config);
      const pixiFilter = filter.filter as any;

      expect(typeof pixiFilter.bloomScale).toBe('number');
      expect(typeof pixiFilter.brightness).toBe('number');
      expect(typeof pixiFilter.blur).toBe('number');
      expect(typeof pixiFilter.threshold).toBe('number');
      expect(typeof pixiFilter.quality).toBe('number');
      expect(typeof pixiFilter.pixelSize).toBe('object');
    });
  });

  describe('Edge Cases & Error Handling', () => {
    it('should handle extreme intensity values gracefully', () => {
      const config: AdvancedBloomFilterConfig = {
        type: 'advancedBloom',
        enabled: true,
        primaryProperty: 'threshold'
      };

      const filter = new AdvancedBloomFilter(config);
      
      // Test extreme values
      expect(() => {
        filter.updateIntensity(createFilterIntensity(0));
      }).not.toThrow();
      
      expect(() => {
        filter.updateIntensity(createFilterIntensity(10));
      }).not.toThrow();
    });

    it('should handle unknown properties gracefully', () => {
      const config: AdvancedBloomFilterConfig = {
        type: 'advancedBloom',
        enabled: true,
        primaryProperty: 'unknown' as any
      };

      const filter = new AdvancedBloomFilter(config);
      
      expect(() => {
        filter.updateIntensity(createFilterIntensity(5));
      }).not.toThrow();
    });
  });

  describe('Memory Management', () => {
    it('should dispose of PIXI filter properly', () => {
      const config: AdvancedBloomFilterConfig = {
        type: 'advancedBloom',
        enabled: true
      };

      const filter = new AdvancedBloomFilter(config);
      
      expect(() => {
        filter.dispose();
      }).not.toThrow();
    });
  });
}); 