import { BackdropBlurFilter, createBackdropBlurFilter, type BackdropBlurFilterConfig } from '../../../filters/BackdropBlurFilter';
import { createFilterIntensity } from '../../../types/filters';

describe('BackdropBlurFilter', () => {
  describe('Class Implementation', () => {
    let filter: BackdropBlurFilter;
    let config: BackdropBlurFilterConfig;

    beforeEach(() => {
      config = {
        type: 'backdropBlur',
        strengthX: 10,
        strengthY: 8,
        intensity: 5
      };
      filter = new BackdropBlurFilter(config);
    });

    it('should create filter with correct type', () => {
      expect(filter).toBeInstanceOf(BackdropBlurFilter);
      expect(filter.filter).toBeDefined();
    });

    it('should initialize with correct configuration', () => {
      const state = filter.getState();
      expect(state.type).toBe('backdropBlur');
      expect(state.configuredStrengthX).toBe(10);
      expect(state.configuredStrengthY).toBe(8);
    });

    it('should apply initial intensity correctly', () => {
      const state = filter.getState();
      // Base strength (10, 8) + intensity(5) * 50% = (35, 28)
      expect(state.strengthX).toBeCloseTo(35);
      expect(state.strengthY).toBeCloseTo(28);
    });

    it('should update intensity correctly', () => {
      filter.updateIntensity(createFilterIntensity(8));
      const state = filter.getState();
      // Base strength (10, 8) + intensity(8) * 50% = (50, 40)
      expect(state.strengthX).toBeCloseTo(50);
      expect(state.strengthY).toBeCloseTo(40);
    });

    it('should reset to original configuration', () => {
      filter.updateIntensity(createFilterIntensity(10));
      filter.reset();
      const state = filter.getState();
      // Should return to initial intensity of 5
      expect(state.strengthX).toBeCloseTo(35);
      expect(state.strengthY).toBeCloseTo(28);
    });

    it('should handle overall strength when individual strengths not specified', () => {
      const generalConfig: BackdropBlurFilterConfig = {
        type: 'backdropBlur',
        strength: 15,
        intensity: 3
      };
      const generalFilter = new BackdropBlurFilter(generalConfig);
      
      const state = generalFilter.getState();
      // Base strength (8) + intensity(3) * 9.2 = 35.6
      expect(state.strength).toBeCloseTo(35.6);
    });

    it('should handle repeatEdgePixels configuration', () => {
      const configWithEdges: BackdropBlurFilterConfig = {
        type: 'backdropBlur',
        repeatEdgePixels: true,
        intensity: 2
      };
      const filterWithEdges = new BackdropBlurFilter(configWithEdges);
      
      expect(filterWithEdges.filter).toBeDefined();
      expect(filterWithEdges.getState().type).toBe('backdropBlur');
    });

    it('should clamp intensity values properly', () => {
      const filter = new BackdropBlurFilter({
        type: 'backdropBlur',
        strengthX: 10,
        strengthY: 10,
        intensity: 5
      });

      // Test maximum boundary - should work fine
      filter.updateIntensity(createFilterIntensity(10));
      const maxState = filter.getState();
      expect(maxState.strengthX).toBeGreaterThan(10);
      expect(maxState.strengthY).toBeGreaterThan(10);

      // Test minimum boundary
      filter.updateIntensity(createFilterIntensity(0));
      const minState = filter.getState();
      expect(minState.strengthX).toBe(10); // Should be base strength
      expect(minState.strengthY).toBe(10); // Should be base strength

      // Test that intensity values outside the valid range would throw in createFilterIntensity
      expect(() => createFilterIntensity(15)).toThrow('FilterIntensity must be between 0 and 10, got 15');
      expect(() => createFilterIntensity(-1)).toThrow('FilterIntensity must be between 0 and 10, got -1');
    });

    it('should properly dispose resources', () => {
      expect(() => filter.dispose()).not.toThrow();
    });
  });

  describe('Factory Function', () => {
    it('should create filter with factory function', () => {
      const config: BackdropBlurFilterConfig = {
        type: 'backdropBlur',
        strengthX: 12,
        strengthY: 12,
        intensity: 4
      };
      
      const filterResult = createBackdropBlurFilter(config);
      
      expect(filterResult.filter).toBeDefined();
      expect(filterResult.updateIntensity).toBeInstanceOf(Function);
      expect(filterResult.reset).toBeInstanceOf(Function);
      expect(filterResult.dispose).toBeInstanceOf(Function);
    });

    it('should update intensity through factory function', () => {
      const config: BackdropBlurFilterConfig = {
        type: 'backdropBlur',
        strengthX: 20,
        strengthY: 16,
        intensity: 2
      };
      
      const filterResult = createBackdropBlurFilter(config);
      
      expect(() => filterResult.updateIntensity(7)).not.toThrow();
      expect(() => filterResult.reset()).not.toThrow();
      expect(() => filterResult.dispose()).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero intensity', () => {
      const config: BackdropBlurFilterConfig = {
        type: 'backdropBlur',
        strengthX: 10,
        strengthY: 10,
        intensity: 0
      };
      
      const filter = new BackdropBlurFilter(config);
      const state = filter.getState();
      
      expect(state.strengthX).toBe(10);
      expect(state.strengthY).toBe(10);
    });

    it('should handle missing optional parameters', () => {
      const minimalConfig: BackdropBlurFilterConfig = {
        type: 'backdropBlur'
      };
      
      const filter = new BackdropBlurFilter(minimalConfig);
      expect(filter.filter).toBeDefined();
      
      const state = filter.getState();
      expect(state.type).toBe('backdropBlur');
    });

    it('should handle quality and kernelSize parameters', () => {
      const config: BackdropBlurFilterConfig = {
        type: 'backdropBlur',
        quality: 8,
        kernelSize: 15,
        resolution: 2,
        intensity: 3
      };
      
      const filter = new BackdropBlurFilter(config);
      const state = filter.getState();
      
      expect(state.quality).toBe(8);
      expect(state.type).toBe('backdropBlur');
    });
  });

  describe('Performance', () => {
    it('should handle rapid intensity updates', () => {
      const config: BackdropBlurFilterConfig = {
        type: 'backdropBlur',
        strengthX: 5,
        strengthY: 5,
        intensity: 1
      };
      
      const filter = new BackdropBlurFilter(config);
      
      // Rapid updates shouldn't throw errors
      for (let i = 0; i <= 10; i++) {
        expect(() => filter.updateIntensity(createFilterIntensity(i))).not.toThrow();
      }
      
      const finalState = filter.getState();
      expect(finalState.strengthX).toBeCloseTo(30); // 5 + 10 * 2.5
      expect(finalState.strengthY).toBeCloseTo(30);
    });
  });
}); 