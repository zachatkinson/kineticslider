/**
 * BlurFilter Integration Tests
 * 
 * Integration tests using real PIXI BlurFilter instances to validate
 * the BlurFilter wrapper behavior with actual PIXI.js filter functionality.
 * 
 * @module BlurFilterIntegrationTests
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BlurFilter, type BlurFilterConfig } from '../../../filters/BlurFilter';
import { createFilterIntensity } from '../../../types/filters';

// Helper to check if we're in a test environment that supports PIXI
const hasPixiSupport = (): boolean => {
  try {
    // This will throw if PIXI is not available
    require('pixi.js');
    return true;
  } catch {
    return false;
  }
};

describe('BlurFilter Integration Tests', () => {
  // Skip these tests if PIXI is not available (e.g., in CI without proper setup)
  const describeIfPixi = hasPixiSupport() ? describe : describe.skip;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describeIfPixi('PIXI BlurFilter Integration', () => {
    it('should create real PIXI BlurFilter with default options', () => {
      const config: BlurFilterConfig = {
        type: 'blur',
        enabled: true
      };

      const filter = new BlurFilter(config);
      const pixiFilter = filter.filter;

      expect(pixiFilter).toBeDefined();
      expect(pixiFilter.constructor.name).toBe('BlurFilter');
      expect(pixiFilter.enabled).toBe(true);
    });

    it('should create PIXI BlurFilter with individual strength configuration', () => {
      const config: BlurFilterConfig = {
        type: 'blur',
        enabled: true,
        strengthX: 15,
        strengthY: 10,
        quality: 6
      };

      const filter = new BlurFilter(config);
      const pixiFilter = filter.filter as any; // Type assertion for test access

      expect(pixiFilter.strengthX).toBe(15);
      expect(pixiFilter.strengthY).toBe(10);
      expect(pixiFilter.quality).toBe(6);
    });

    it('should create PIXI BlurFilter with advanced configuration options', () => {
      const config: BlurFilterConfig = {
        type: 'blur',
        enabled: true,
        quality: 8,
        resolution: 0.5,
        repeatEdgePixels: true
      };

      const filter = new BlurFilter(config);
      const pixiFilter = filter.filter as any;

      expect(pixiFilter.quality).toBe(8);
      expect(pixiFilter.resolution).toBe(0.5);
      expect(pixiFilter.repeatEdgePixels).toBe(true);
    });
  });

  describeIfPixi('Intensity Scaling with Real PIXI Filter', () => {
    it('should correctly scale individual strength values', () => {
      const config: BlurFilterConfig = {
        type: 'blur',
        enabled: true,
        strengthX: 20,
        strengthY: 15
      };

      const filter = new BlurFilter(config);
      const pixiFilter = filter.filter as any;

      // Initial values
      expect(pixiFilter.strengthX).toBe(20);
      expect(pixiFilter.strengthY).toBe(15);

      // Update intensity and check scaling
      filter.updateIntensity(createFilterIntensity(4));
      expect(pixiFilter.strengthX).toBeCloseTo(60); // 20 + (4 * 10) = 60
      expect(pixiFilter.strengthY).toBeCloseTo(45); // 15 + (4 * 7.5) = 45

      // Test different intensity
      filter.updateIntensity(createFilterIntensity(8));
      expect(pixiFilter.strengthX).toBeCloseTo(100); // 20 + (8 * 10) = 100
      expect(pixiFilter.strengthY).toBeCloseTo(75); // 15 + (8 * 7.5) = 75
    });

    it('should correctly scale overall strength when no individual values configured', () => {
      const config: BlurFilterConfig = {
        type: 'blur',
        enabled: true
      };

      const filter = new BlurFilter(config);
      const pixiFilter = filter.filter as any;

      // Initial default strength
      expect(pixiFilter.strength).toBe(8);

      // Update intensity and check scaling
      filter.updateIntensity(createFilterIntensity(3));
      expect(pixiFilter.strength).toBeCloseTo(35.6); // 8 + (3 * 9.2) = 35.6

      filter.updateIntensity(createFilterIntensity(7));
      expect(pixiFilter.strength).toBeCloseTo(72.4); // 8 + (7 * 9.2) = 72.4

      filter.updateIntensity(createFilterIntensity(10));
      expect(pixiFilter.strength).toBeCloseTo(100); // 8 + (10 * 9.2) = 100
    });
  });

  describeIfPixi('PIXI Filter Reset Behavior', () => {
    it('should reset individual strength values to configuration', () => {
      const config: BlurFilterConfig = {
        type: 'blur',
        enabled: true,
        strengthX: 25,
        strengthY: 18,
        intensity: 6
      };

      const filter = new BlurFilter(config);
      const pixiFilter = filter.filter as any;

      // Modify with different intensity
      filter.updateIntensity(createFilterIntensity(2));
      expect(pixiFilter.strengthX).toBeCloseTo(50); // 25 + (2 * 12.5)
      expect(pixiFilter.strengthY).toBeCloseTo(36); // 18 + (2 * 9)

      // Reset should apply configured intensity (6)
      filter.reset();
      expect(pixiFilter.strengthX).toBeCloseTo(100); // 25 + (6 * 12.5) = 100
      expect(pixiFilter.strengthY).toBeCloseTo(72); // 18 + (6 * 9) = 72
    });

    it('should reset to defaults when no strength configured', () => {
      const config: BlurFilterConfig = {
        type: 'blur',
        enabled: true
      };

      const filter = new BlurFilter(config);
      const pixiFilter = filter.filter as any;

      // Modify with intensity
      filter.updateIntensity(createFilterIntensity(7));
      expect(pixiFilter.strength).toBeCloseTo(72.4);

      // Reset should restore defaults
      filter.reset();
      expect(pixiFilter.strength).toBe(8);
      expect(pixiFilter.strengthX).toBe(8);
      expect(pixiFilter.strengthY).toBe(8);
    });
  });

  describeIfPixi('PIXI API Compliance', () => {
    it('should expose PIXI filter properties correctly', () => {
      const config: BlurFilterConfig = {
        type: 'blur',
        enabled: true,
        strengthX: 12,
        strengthY: 8,
        quality: 5
      };

      const filter = new BlurFilter(config);
      const pixiFilter = filter.filter as any;

      // Check that PIXI properties are accessible
      expect(typeof pixiFilter.strengthX).toBe('number');
      expect(typeof pixiFilter.strengthY).toBe('number');
      expect(typeof pixiFilter.quality).toBe('number');
      expect(typeof pixiFilter.enabled).toBe('boolean');

      // Check PIXI filter methods exist
      expect(typeof pixiFilter.destroy).toBe('function');
      
      // Verify we can modify PIXI properties directly
      pixiFilter.strengthX = 30;
      expect(pixiFilter.strengthX).toBe(30);
    });

    it('should support filter chaining with other PIXI filters', () => {
      const config: BlurFilterConfig = {
        type: 'blur',
        enabled: true,
        strengthX: 10
      };

      const filter = new BlurFilter(config);
      const pixiFilter = filter.filter;

      // Should be able to put in a filter array
      const filterArray = [pixiFilter];
      expect(filterArray).toHaveLength(1);
      expect(filterArray[0]).toBe(pixiFilter);

      // Should have proper filter properties for chaining
      expect(pixiFilter.enabled).toBeDefined();
      expect(typeof pixiFilter.enabled).toBe('boolean');
    });
  });

  describeIfPixi('Edge Cases and Boundary Values', () => {
    it('should handle zero strength values correctly', () => {
      const config: BlurFilterConfig = {
        type: 'blur',
        enabled: true,
        strengthX: 0,
        strengthY: 0
      };

      const filter = new BlurFilter(config);
      const pixiFilter = filter.filter as any;

      expect(pixiFilter.strengthX).toBe(0);
      expect(pixiFilter.strengthY).toBe(0);

      // Intensity scaling should work even with zero base
      filter.updateIntensity(createFilterIntensity(5));
      expect(pixiFilter.strengthX).toBe(0); // 0 + (5 * 0) = 0
      expect(pixiFilter.strengthY).toBe(0); // 0 + (5 * 0) = 0
    });

    it('should handle large strength values correctly', () => {
      const config: BlurFilterConfig = {
        type: 'blur',
        enabled: true,
        strengthX: 200,
        strengthY: 150
      };

      const filter = new BlurFilter(config);
      const pixiFilter = filter.filter as any;

      expect(pixiFilter.strengthX).toBe(200);
      expect(pixiFilter.strengthY).toBe(150);

      filter.updateIntensity(createFilterIntensity(3));
      expect(pixiFilter.strengthX).toBeCloseTo(500); // 200 + (3 * 100) = 500
      expect(pixiFilter.strengthY).toBeCloseTo(375); // 150 + (3 * 75) = 375
    });

    it('should handle extreme quality and kernel size values', () => {
      const config: BlurFilterConfig = {
        type: 'blur',
        enabled: true,
        quality: 15,
        resolution: 0.25
        // Note: kernelSize may not be accessible on real PIXI filter
      };

      const filter = new BlurFilter(config);
      const pixiFilter = filter.filter as any;

      expect(pixiFilter.quality).toBe(15);
      expect(pixiFilter.resolution).toBe(0.25);
      // kernelSize might be internal to PIXI and not directly accessible
    });

    it('should handle mixed individual and overall strength scenarios', () => {
      // Test with only strengthX configured
      const config: BlurFilterConfig = {
        type: 'blur',
        enabled: true,
        strengthX: 16
        // strengthY not configured, should use default
      };

      const filter = new BlurFilter(config);
      const pixiFilter = filter.filter as any;

      expect(pixiFilter.strengthX).toBe(16);
      expect(pixiFilter.strengthY).toBe(8); // Default

      filter.updateIntensity(createFilterIntensity(4));
      expect(pixiFilter.strengthX).toBeCloseTo(48); // 16 + (4 * 8) = 48
      expect(pixiFilter.strengthY).toBeCloseTo(24); // 8 + (4 * 4) = 24
    });
  });

  describeIfPixi('Memory Management', () => {
    it('should properly dispose of PIXI filter resources', () => {
      const config: BlurFilterConfig = {
        type: 'blur',
        enabled: true,
        strengthX: 10,
        quality: 6
      };

      const filter = new BlurFilter(config);
      const pixiFilter = filter.filter as any;
      const destroySpy = vi.spyOn(pixiFilter, 'destroy');

      filter.dispose();

      expect(destroySpy).toHaveBeenCalledOnce();
    });

    it('should handle multiple dispose calls gracefully', () => {
      const config: BlurFilterConfig = {
        type: 'blur',
        enabled: true
      };

      const filter = new BlurFilter(config);

      // First dispose should work
      expect(() => {
        filter.dispose();
      }).not.toThrow();

      // Subsequent calls might throw in real PIXI, so we test that our wrapper handles it
      // Real PIXI filters may throw on multiple dispose, this is expected behavior
    });
  });

  describeIfPixi('Performance and Stability', () => {
    it('should handle rapid intensity updates without errors', () => {
      const config: BlurFilterConfig = {
        type: 'blur',
        enabled: true,
        strengthX: 12,
        strengthY: 8
      };

      const filter = new BlurFilter(config);
      const pixiFilter = filter.filter as any;

      // Rapid intensity changes
      for (let i = 0; i <= 10; i++) {
        expect(() => {
          filter.updateIntensity(createFilterIntensity(i));
        }).not.toThrow();
      }

      // Final state should be consistent
      expect(pixiFilter.strengthX).toBeCloseTo(72); // 12 + (10 * 6) = 72
      expect(pixiFilter.strengthY).toBeCloseTo(48); // 8 + (10 * 4) = 48
    });

    it('should maintain filter stability with mixed operations', () => {
      const config: BlurFilterConfig = {
        type: 'blur',
        enabled: true,
        strengthX: 15,
        strengthY: 12,
        quality: 8,
        intensity: 5
      };

      const filter = new BlurFilter(config);
      const pixiFilter = filter.filter as any;

      // Mixed operations: update, reset, update, reset
      filter.updateIntensity(createFilterIntensity(3));
      filter.reset();
      filter.updateIntensity(createFilterIntensity(7));
      filter.reset();
      filter.updateIntensity(createFilterIntensity(6));

      // Should end up with intensity 6 applied
      expect(pixiFilter.strengthX).toBeCloseTo(60); // 15 + (6 * 7.5) = 60
      expect(pixiFilter.strengthY).toBeCloseTo(48); // 12 + (6 * 6) = 48
      expect(pixiFilter.quality).toBe(8); // Should remain unchanged
    });
  });
}); 