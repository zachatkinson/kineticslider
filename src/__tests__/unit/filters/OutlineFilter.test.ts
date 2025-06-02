import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createOutlineFilter } from '../../../filters/OutlineFilter';
import type { OutlineFilterConfig } from '../../../types/filters';
import { createFilterIntensity } from '../../../types/filters';
import { 
  createMockOutlineFilter, 
  resetMockFilter,
  assertFilterResult 
} from '../../mocks/filter-mocks';

// Create the mock filter instance
const mockOutlineFilter = createMockOutlineFilter();

// Mock the OutlineFilter from pixi-filters
vi.mock('pixi-filters', () => ({
  OutlineFilter: vi.fn(() => mockOutlineFilter),
}));

describe('OutlineFilter', () => {
  beforeEach(() => {
    resetMockFilter(mockOutlineFilter, {
      thickness: 2,
      color: 0x000000,
      quality: 0.1,
      alpha: 1.0,
      knockout: false,
    });
  });

  describe('Filter Creation', () => {
    it('should create filter with default configuration', () => {
      const config: OutlineFilterConfig = {
        type: 'outline',
        enabled: true,
        intensity: createFilterIntensity(5)
      };

      const result = createOutlineFilter(config);

      assertFilterResult(result, 'outline');

      // Check default values - intensity 5 mapped to thickness: 5
      expect(mockOutlineFilter.thickness).toBe(5);
    });

    it('should create filter with custom configuration', () => {
      const config: OutlineFilterConfig = {
        type: 'outline',
        enabled: true,
        intensity: createFilterIntensity(7),
        thickness: 3,
        color: 0xff0000,
        quality: 0.5,
        alpha: 0.8,
        knockout: true,
        primaryProperty: 'alpha'
      };

      const result = createOutlineFilter(config);
      
      expect(result.filter).toBe(mockOutlineFilter);

      // Should apply intensity mapping to alpha: 7/10 = 0.7
      expect(mockOutlineFilter.alpha).toBe(0.7);
    });
  });

  describe('Intensity Updates - Thickness Primary Property', () => {
    it('should map intensity to thickness when primaryProperty is thickness', () => {
      const config: OutlineFilterConfig = {
        type: 'outline',
        enabled: true,
        intensity: createFilterIntensity(0),
        primaryProperty: 'thickness'
      };

      const result = createOutlineFilter(config);

      // Test different intensity values
      result.updateIntensity(createFilterIntensity(0));
      expect(mockOutlineFilter.thickness).toBe(0);

      result.updateIntensity(createFilterIntensity(5));
      expect(mockOutlineFilter.thickness).toBe(5);

      result.updateIntensity(createFilterIntensity(10));
      expect(mockOutlineFilter.thickness).toBe(10);
    });

    it('should default to thickness mapping when no primaryProperty specified', () => {
      const config: OutlineFilterConfig = {
        type: 'outline',
        enabled: true,
        intensity: createFilterIntensity(0)
      };

      const result = createOutlineFilter(config);

      // Test different intensity values
      result.updateIntensity(createFilterIntensity(3));
      expect(mockOutlineFilter.thickness).toBe(3);

      result.updateIntensity(createFilterIntensity(8));
      expect(mockOutlineFilter.thickness).toBe(8);
    });
  });

  describe('Intensity Updates - Alpha Primary Property', () => {
    it('should map intensity to alpha when primaryProperty is alpha', () => {
      const config: OutlineFilterConfig = {
        type: 'outline',
        enabled: true,
        intensity: createFilterIntensity(0),
        primaryProperty: 'alpha'
      };

      const result = createOutlineFilter(config);

      // Test different intensity values
      result.updateIntensity(createFilterIntensity(0));
      expect(mockOutlineFilter.alpha).toBe(0);

      result.updateIntensity(createFilterIntensity(5));
      expect(mockOutlineFilter.alpha).toBe(0.5);

      result.updateIntensity(createFilterIntensity(10));
      expect(mockOutlineFilter.alpha).toBe(1);
    });
  });

  describe('Initial Intensity Application', () => {
    it('should apply initial intensity on creation with thickness mapping', () => {
      const config: OutlineFilterConfig = {
        type: 'outline',
        enabled: true,
        intensity: createFilterIntensity(6),
        thickness: 3, // This should be overridden by intensity
        primaryProperty: 'thickness'
      };

      const _result = createOutlineFilter(config);
      expect(mockOutlineFilter.thickness).toBe(6); // intensity applied after initial config
    });

    it('should apply initial intensity on creation with alpha mapping', () => {
      const config: OutlineFilterConfig = {
        type: 'outline',
        enabled: true,
        intensity: createFilterIntensity(4),
        alpha: 0.9, // This should be overridden by intensity
        primaryProperty: 'alpha'
      };

      const _result = createOutlineFilter(config);
      expect(mockOutlineFilter.alpha).toBe(0.4); // intensity applied after initial config
    });
  });

  describe('Reset Functionality', () => {
    it('should reset to original configuration values', () => {
      const config: OutlineFilterConfig = {
        type: 'outline',
        enabled: true,
        intensity: createFilterIntensity(8),
        thickness: 4,
        color: 0x00ff00,
        quality: 0.3,
        alpha: 0.7,
        knockout: true,
        primaryProperty: 'thickness'
      };

      const result = createOutlineFilter(config);

      // Modify values
      result.updateIntensity(createFilterIntensity(2));
      mockOutlineFilter.color = 0xff0000;

      // Reset
      result.reset();

      expect(mockOutlineFilter.thickness).toBe(8); // intensity reapplied
      expect(mockOutlineFilter.color).toBe(0x00ff00);
      expect(mockOutlineFilter.quality).toBe(0.3);
      expect(mockOutlineFilter.alpha).toBe(0.7);
      expect(mockOutlineFilter.knockout).toBe(true);
    });

    it('should reset to defaults when no config values provided', () => {
      const config: OutlineFilterConfig = {
        type: 'outline',
        enabled: true,
        intensity: createFilterIntensity(5)
      };

      const result = createOutlineFilter(config);

      // Modify values
      result.updateIntensity(createFilterIntensity(2));
      mockOutlineFilter.color = 0xff0000;

      // Reset
      result.reset();

      expect(mockOutlineFilter.thickness).toBe(5); // intensity reapplied
      expect(mockOutlineFilter.color).toBe(0x000000); // default
      expect(mockOutlineFilter.quality).toBe(0.1); // default
      expect(mockOutlineFilter.alpha).toBe(1.0); // default
      expect(mockOutlineFilter.knockout).toBe(false); // default
    });
  });

  describe('Resource Management', () => {
    it('should dispose filter resources', () => {
      const config: OutlineFilterConfig = {
        type: 'outline',
        enabled: true,
        intensity: createFilterIntensity(5)
      };

      const result = createOutlineFilter(config);
      
      // Ensure dispose exists and is callable
      expect(typeof result.dispose).toBe('function');
      if (result.dispose) {
        result.dispose();
      }

      expect(mockOutlineFilter.destroy).toHaveBeenCalledOnce();
    });
  });

  describe('Filter Result Interface', () => {
    it('should provide all required interface methods', () => {
      const config: OutlineFilterConfig = {
        type: 'outline',
        enabled: true,
        intensity: createFilterIntensity(5)
      };

      const result = createOutlineFilter(config);

      assertFilterResult(result, 'outline');
      expect(result.filter).toBe(mockOutlineFilter);
    });
  });
}); 