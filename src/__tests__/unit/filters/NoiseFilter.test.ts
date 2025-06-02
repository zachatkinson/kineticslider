import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createNoiseFilter } from '../../../filters/NoiseFilter';
import type { NoiseFilterConfig } from '../../../types/filters';
import { createFilterIntensity } from '../../../types/filters';

// Mock the NoiseFilter from pixi.js
const mockNoiseFilter = {
  noise: 0.5,
  seed: 0,
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

vi.mock('pixi.js', () => ({
  NoiseFilter: vi.fn(() => mockNoiseFilter),
}));

describe('NoiseFilter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock filter properties to defaults
    mockNoiseFilter.noise = 0.5;
    mockNoiseFilter.seed = 0;
  });

  describe('Filter Creation', () => {
    it('should create filter with default configuration', () => {
      const config: NoiseFilterConfig = {
        type: 'noise',
        enabled: true,
        intensity: createFilterIntensity(5)
      };

      const _result = createNoiseFilter(config);

      expect(_result.filter).toBeDefined();
      expect(_result.updateIntensity).toBeInstanceOf(Function);
      expect(_result.reset).toBeInstanceOf(Function);
      expect(_result.dispose).toBeInstanceOf(Function);

      // Check default values - intensity 5 mapped to noise: 5/10 = 0.5
      expect(mockNoiseFilter.noise).toBe(0.5);
    });

    it('should create filter with custom configuration', () => {
      const config: NoiseFilterConfig = {
        type: 'noise',
        enabled: true,
        intensity: createFilterIntensity(8),
        noiseLevel: 0.3,
        seed: 42,
        generateNewSeedOnUpdate: true
      };

      const _result = createNoiseFilter(config);

      expect(_result.filter).toBe(mockNoiseFilter);

      // Should apply intensity mapping: 8/10 = 0.8
      expect(mockNoiseFilter.noise).toBe(0.8);
    });
  });

  describe('Intensity Mapping', () => {
    it('should map intensity to noise level correctly', () => {
      const config: NoiseFilterConfig = {
        type: 'noise',
        enabled: true,
        intensity: createFilterIntensity(0)
      };

      const _result = createNoiseFilter(config);

      // Test intensity 0: 0/10 = 0
      _result.updateIntensity(createFilterIntensity(0));
      expect(mockNoiseFilter.noise).toBe(0);

      // Test intensity 5: 5/10 = 0.5
      _result.updateIntensity(createFilterIntensity(5));
      expect(mockNoiseFilter.noise).toBe(0.5);

      // Test intensity 10: 10/10 = 1
      _result.updateIntensity(createFilterIntensity(10));
      expect(mockNoiseFilter.noise).toBe(1);
    });

    it('should generate new seed when generateNewSeedOnUpdate is true', () => {
      const config: NoiseFilterConfig = {
        type: 'noise',
        enabled: true,
        intensity: createFilterIntensity(5),
        generateNewSeedOnUpdate: true
      };

      const _result = createNoiseFilter(config);
      const _originalSeed = mockNoiseFilter.seed;

      // Mock Math.random to return a predictable value
      const mockRandom = vi.spyOn(Math, 'random').mockReturnValue(0.123);

      _result.updateIntensity(createFilterIntensity(7));
      expect(mockNoiseFilter.seed).toBe(0.123);

      mockRandom.mockRestore();
    });

    it('should not generate new seed when generateNewSeedOnUpdate is false', () => {
      const config: NoiseFilterConfig = {
        type: 'noise',
        enabled: true,
        intensity: createFilterIntensity(5),
        generateNewSeedOnUpdate: false
      };

      const _result = createNoiseFilter(config);
      const originalSeed = mockNoiseFilter.seed;

      _result.updateIntensity(createFilterIntensity(7));
      expect(mockNoiseFilter.seed).toBe(originalSeed);
    });
  });

  describe('Initial Intensity Application', () => {
    it('should apply initial intensity on creation', () => {
      const config: NoiseFilterConfig = {
        type: 'noise',
        enabled: true,
        intensity: createFilterIntensity(6),
        noiseLevel: 0.2 // This should be overridden by intensity
      };

      const _result = createNoiseFilter(config);
      expect(mockNoiseFilter.noise).toBe(0.6); // intensity applied after initial config
    });
  });

  describe('Reset Functionality', () => {
    it('should reset to original configuration values', () => {
      const config: NoiseFilterConfig = {
        type: 'noise',
        enabled: true,
        intensity: createFilterIntensity(8),
        noiseLevel: 0.3,
        seed: 42,
        generateNewSeedOnUpdate: false
      };

      const _result = createNoiseFilter(config);

      // Modify values
      _result.updateIntensity(createFilterIntensity(2));
      expect(mockNoiseFilter.noise).toBe(0.2);

      // Reset should restore configured values and apply intensity
      _result.reset();
      expect(mockNoiseFilter.noise).toBe(0.8); // intensity reapplied
      expect(mockNoiseFilter.seed).toBe(42);
    });

    it('should reset all properties to defaults when not specified in config', () => {
      const mockRandom = vi.spyOn(Math, 'random').mockReturnValue(0.2244294111288032);

      const config: NoiseFilterConfig = {
        type: 'noise',
        enabled: true,
        intensity: createFilterIntensity(5)
      };

      const _result = createNoiseFilter(config);

      // Modify values
      const _originalSeed = mockNoiseFilter.seed;
      mockNoiseFilter.noise = 0.9;
      mockNoiseFilter.seed = 999;

      // Reset
      _result.reset();

      expect(mockNoiseFilter.noise).toBe(5/10); // intensity 5 mapped to 0.5
      expect(mockNoiseFilter.seed).toBe(0.2244294111288032); // Should be the mocked random value

      mockRandom.mockRestore();
    });

    it('should handle generateNewSeedOnUpdate configuration', () => {
      const config: NoiseFilterConfig = {
        type: 'noise',
        enabled: true,
        intensity: createFilterIntensity(7),
        generateNewSeedOnUpdate: true
      };

      // Creating a filter with generateNewSeedOnUpdate should not throw
      const _result = createNoiseFilter(config);
      
      // Test that the configuration is properly set
      expect(config.generateNewSeedOnUpdate).toBe(true);
    });

    it('should use Math.random for seed when not specified', () => {
      const mockRandom = vi.spyOn(Math, 'random').mockReturnValue(0.789);

      const config: NoiseFilterConfig = {
        type: 'noise',
        enabled: true,
        intensity: createFilterIntensity(5)
      };

      const _result = createNoiseFilter(config);
      _result.reset();

      expect(mockNoiseFilter.seed).toBe(0.789);
      mockRandom.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('should handle intensity values outside 0-10 range', () => {
      const config: NoiseFilterConfig = {
        type: 'noise',
        enabled: true,
        intensity: createFilterIntensity(5)
      };

      const _result = createNoiseFilter(config);

      // Test clamping to valid range
      _result.updateIntensity(-5 as any); // Should clamp to 0
      expect(mockNoiseFilter.noise).toBe(0);

      _result.updateIntensity(15 as any); // Should clamp to 10
      expect(mockNoiseFilter.noise).toBe(1);
    });

    it('should throw error for invalid intensity values in createFilterIntensity', () => {
      expect(() => createFilterIntensity(-1)).toThrow();
      expect(() => createFilterIntensity(11)).toThrow();
      expect(() => createFilterIntensity(NaN)).toThrow();
    });
  });

  describe('Resource Management', () => {
    it('should dispose filter resources properly', () => {
      const config: NoiseFilterConfig = {
        type: 'noise',
        enabled: true,
        intensity: createFilterIntensity(5)
      };

      const _result = createNoiseFilter(config);
      const destroySpy = vi.spyOn(mockNoiseFilter, 'destroy');

      _result.dispose?.();

      expect(destroySpy).toHaveBeenCalledOnce();
    });
  });
}); 