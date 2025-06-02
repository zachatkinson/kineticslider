/**
 * ShockwaveFilter Unit Tests
 * 
 * Tests for ShockwaveFilter implementation including:
 * - Filter creation and configuration
 * - Intensity control and mapping
 * - Animation functionality
 * - State management
 * - Resource cleanup
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createFilter } from '../../../filters/ShockwaveFilter';
import { createFilterIntensity } from '../../../types/filters';
import type { ShockwaveFilterConfig } from '../../../types/filters';

// Mock PIXI.js
vi.mock('pixi.js', () => ({
  Filter: class MockFilter {
    public enabled: boolean;
    
    constructor() {
      this.enabled = true;
    }
    destroy(): void {}
  }
}));

// Mock pixi-filters
vi.mock('pixi-filters', () => ({
  ShockwaveFilter: class MockShockwaveFilter {
    public center: [number, number];
    public amplitude: number;
    public wavelength: number;
    public speed: number;
    public time: number;
    public radius: number;
    public brightness: number;
    public enabled: boolean;
    
    // Base values for intensity calculations
    private baseRadius: number;
    private baseAmplitude: number;
    private baseWavelength: number;
    private baseBrightness: number;
    private baseSpeed: number;
    private animationInterval?: NodeJS.Timeout;
    
    constructor(options: any = {}) {
      // Initialize with provided options or defaults
      this.center = options.center || [0.5, 0.5];
      this.amplitude = options.amplitude ?? 30;
      this.wavelength = options.wavelength ?? 160;
      this.speed = options.speed ?? 500;
      this.time = options.time ?? 0;
      this.radius = options.radius ?? 100;
      this.brightness = options.brightness ?? 1;
      this.enabled = true;
      
      // Store base values
      this.baseRadius = this.radius;
      this.baseAmplitude = this.amplitude;
      this.baseWavelength = this.wavelength;
      this.baseBrightness = this.brightness;
      this.baseSpeed = this.speed;
    }
    destroy(): void {
      if (this.animationInterval) {
        clearInterval(this.animationInterval);
        this.animationInterval = undefined;
      }
    }
  }
}));

describe('ShockwaveFilter', () => {
  beforeEach((): void => {
    vi.useFakeTimers();
  });

  afterEach((): void => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Filter Creation', () => {
    it('should create a shockwave filter with default configuration', () => {
      const config: ShockwaveFilterConfig = {
        type: 'shockwave',
        enabled: true,
        intensity: createFilterIntensity(5)
      };

      const result = createFilter(config);

      expect(result).toBeDefined();
      expect(result.filter).toBeDefined();
      expect(result.config).toEqual(config);
      expect(result.updateIntensity).toBeTypeOf('function');
      expect(result.reset).toBeTypeOf('function');
      expect(result.dispose).toBeTypeOf('function');
      expect(result.getState).toBeTypeOf('function');
    });

    it('should create a shockwave filter with custom configuration', () => {
      const config: ShockwaveFilterConfig = {
        type: 'shockwave',
        enabled: true,
        intensity: createFilterIntensity(8),
        center: { x: 0.3, y: 0.7 },
        amplitude: 50,
        wavelength: 200,
        speed: 800,
        time: 0.5,
        radius: 150,
        brightness: 1.2,
        animate: true,
        animationSpeed: 0.02,
        primaryProperty: 'amplitude'
      };

      const result = createFilter(config);

      expect((result.filter as any).center).toEqual([0.3, 0.7]);
      expect((result.filter as any).amplitude).toBe(50);
      expect((result.filter as any).wavelength).toBe(200);
      expect((result.filter as any).speed).toBe(800);
      expect((result.filter as any).time).toBe(0.5);
      expect((result.filter as any).radius).toBe(150);
      expect((result.filter as any).brightness).toBe(1.2);
    });

    it('should handle disabled filter', () => {
      const config: ShockwaveFilterConfig = {
        type: 'shockwave',
        enabled: false,
        intensity: createFilterIntensity(3)
      };

      const result = createFilter(config);

      expect((result.filter as any).enabled).toBe(false);
    });
  });

  describe('Intensity Control', () => {
    it('should have updateIntensity function', () => {
      const config: ShockwaveFilterConfig = {
        type: 'shockwave',
        enabled: true,
        intensity: createFilterIntensity(5)
      };

      const result = createFilter(config);
      
      expect(result.updateIntensity).toBeTypeOf('function');
      
      // Test intensity update
      result.updateIntensity(createFilterIntensity(8));
      
      // Should update the primary property (amplitude by default)
      expect((result.filter as any).amplitude).toBe(24); // 30 * (8/10) = 24
    });

    it('should handle intensity range', () => {
      const config: ShockwaveFilterConfig = {
        type: 'shockwave',
        enabled: true,
        intensity: createFilterIntensity(5)
      };

      const result = createFilter(config);

      // Test minimum intensity
      result.updateIntensity(createFilterIntensity(0));
      expect((result.filter as any).amplitude).toBe(0);

      // Test medium intensity
      result.updateIntensity(createFilterIntensity(5));
      expect((result.filter as any).amplitude).toBe(15); // 30 * 0.5

      // Test maximum intensity
      result.updateIntensity(createFilterIntensity(10));
      expect((result.filter as any).amplitude).toBe(30); // 30 * 1.0
    });

    it('should handle different primary properties', () => {
      const configs = [
        { primaryProperty: 'amplitude' as const, baseValue: 30 },
        { primaryProperty: 'wavelength' as const, baseValue: 160 },
        { primaryProperty: 'speed' as const, baseValue: 500 }
      ];

      configs.forEach(({ primaryProperty, baseValue }) => {
        const config: ShockwaveFilterConfig = {
          type: 'shockwave',
          enabled: true,
          intensity: createFilterIntensity(5),
          primaryProperty
        };

        const result = createFilter(config);
        result.updateIntensity(createFilterIntensity(7));

        // Each property should be updated based on its base value and intensity
        const expectedValue = baseValue * (7 / 10);
        expect((result.filter as any)[primaryProperty]).toBe(expectedValue);
      });
    });
  });

  describe('Center Point Control', () => {
    it('should handle center point configuration', () => {
      const config: ShockwaveFilterConfig = {
        type: 'shockwave',
        enabled: true,
        intensity: createFilterIntensity(5),
        center: { x: 0.25, y: 0.75 }
      };

      const result = createFilter(config);

      expect((result.filter as any).center).toEqual([0.25, 0.75]);
    });

    it('should handle individual centerX and centerY properties', () => {
      const config: ShockwaveFilterConfig = {
        type: 'shockwave',
        enabled: true,
        intensity: createFilterIntensity(5),
        centerX: 0.8,
        centerY: 0.2
      };

      const result = createFilter(config);

      expect((result.filter as any).center).toEqual([0.8, 0.2]);
    });

    it('should prioritize center object over individual X/Y properties', () => {
      const config: ShockwaveFilterConfig = {
        type: 'shockwave',
        enabled: true,
        intensity: createFilterIntensity(5),
        center: { x: 0.3, y: 0.7 },
        centerX: 0.8, // Should be ignored
        centerY: 0.2  // Should be ignored
      };

      const result = createFilter(config);

      expect((result.filter as any).center).toEqual([0.3, 0.7]);
    });
  });

  describe('Animation Support', () => {
    it('should start animation when animate is true', () => {
      const config: ShockwaveFilterConfig = {
        type: 'shockwave',
        enabled: true,
        intensity: createFilterIntensity(5),
        animate: true,
        animationSpeed: 0.02
      };

      const result = createFilter(config);

      // Check that the filter has an animation interval set
      expect((result.filter as any).animationInterval).toBeDefined();
    });

    it('should not start animation when animate is false', () => {
      const config: ShockwaveFilterConfig = {
        type: 'shockwave',
        enabled: true,
        intensity: createFilterIntensity(5),
        animate: false
      };

      const result = createFilter(config);

      // Check that no animation interval is set
      expect((result.filter as any).animationInterval).toBeUndefined();
    });

    it('should use default animation speed when not specified', () => {
      const config: ShockwaveFilterConfig = {
        type: 'shockwave',
        enabled: true,
        intensity: createFilterIntensity(5),
        animate: true
      };

      const result = createFilter(config);

      // Check that the filter has an animation interval set
      expect((result.filter as any).animationInterval).toBeDefined();
    });

    it('should clear animation interval on dispose', () => {
      const config: ShockwaveFilterConfig = {
        type: 'shockwave',
        enabled: true,
        intensity: createFilterIntensity(5),
        animate: true
      };

      const result = createFilter(config);
      
      // Verify animation is running
      expect((result.filter as any).animationInterval).toBeDefined();
      
      result.dispose?.();
      
      // Check that animation interval is cleared
      expect((result.filter as any).animationInterval).toBeUndefined();
    });
  });

  describe('State Management', () => {
    it('should have reset function', () => {
      const config: ShockwaveFilterConfig = {
        type: 'shockwave',
        enabled: true,
        intensity: createFilterIntensity(7),
        amplitude: 50,
        wavelength: 200,
        center: { x: 0.3, y: 0.7 }
      };

      const result = createFilter(config);
      
      expect(result.reset).toBeTypeOf('function');
      
      // Modify the filter
      result.updateIntensity(createFilterIntensity(3));
      
      // Reset should restore original values
      result.reset();
      
      expect((result.filter as any).amplitude).toBe(50);
      expect((result.filter as any).wavelength).toBe(200);
      expect((result.filter as any).center).toEqual([0.3, 0.7]);
    });

    it('should have getState function', () => {
      const config: ShockwaveFilterConfig = {
        type: 'shockwave',
        enabled: true,
        intensity: createFilterIntensity(7)
      };

      const result = createFilter(config);
      
      expect(result.getState).toBeTypeOf('function');
      
      const state = result.getState?.();
      expect(state).toBeDefined();
      expect(state).toHaveProperty('center');
      expect(state).toHaveProperty('amplitude');
      expect(state).toHaveProperty('wavelength');
      expect(state).toHaveProperty('time');
      expect(state).toHaveProperty('enabled');
    });
  });

  describe('Resource Management', () => {
    it('should have dispose function', () => {
      const config: ShockwaveFilterConfig = {
        type: 'shockwave',
        enabled: true,
        intensity: createFilterIntensity(5)
      };

      const result = createFilter(config);
      
      expect(result.dispose).toBeTypeOf('function');
      
      // Should not throw when disposing
      expect(() => result.dispose?.()).not.toThrow();
    });

    it('should clear animation on dispose', () => {
      const config: ShockwaveFilterConfig = {
        type: 'shockwave',
        enabled: true,
        intensity: createFilterIntensity(5),
        animate: true
      };

      const result = createFilter(config);
      
      // Verify animation is running
      expect((result.filter as any).animationInterval).toBeDefined();
      
      result.dispose?.();
      
      // Check that animation interval is cleared
      expect((result.filter as any).animationInterval).toBeUndefined();
    });
  });

  describe('Configuration Validation', () => {
    it('should handle all shockwave filter properties', () => {
      const config: ShockwaveFilterConfig = {
        type: 'shockwave',
        enabled: true,
        intensity: createFilterIntensity(6),
        center: { x: 0.4, y: 0.6 },
        centerX: 0.8, // Should be ignored
        centerY: 0.2, // Should be ignored
        amplitude: 40,
        wavelength: 180,
        speed: 600,
        time: 0.3,
        radius: 120,
        brightness: 1.1,
        animate: true,
        animationSpeed: 0.03,
        primaryProperty: 'wavelength'
      };

      const result = createFilter(config);

      expect((result.filter as any).center).toEqual([0.4, 0.6]);
      expect((result.filter as any).amplitude).toBe(40);
      expect((result.filter as any).wavelength).toBe(180);
      expect((result.filter as any).speed).toBe(600);
      expect((result.filter as any).time).toBe(0.3);
      expect((result.filter as any).radius).toBe(120);
      expect((result.filter as any).brightness).toBe(1.1);
      expect((result.filter as any).enabled).toBe(true);
    });

    it('should handle primaryProperty variations', () => {
      const primaryProperties = ['amplitude', 'wavelength', 'speed'] as const;

      primaryProperties.forEach(primaryProperty => {
        const config: ShockwaveFilterConfig = {
          type: 'shockwave',
          enabled: true,
          intensity: createFilterIntensity(5),
          primaryProperty
        };

        const result = createFilter(config);
        expect(result).toBeDefined();
        expect(result.filter).toBeDefined();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero intensity', () => {
      const config: ShockwaveFilterConfig = {
        type: 'shockwave',
        enabled: true,
        intensity: createFilterIntensity(0)
      };

      const result = createFilter(config);
      expect((result.filter as any).amplitude).toBe(0);
    });

    it('should handle maximum intensity', () => {
      const config: ShockwaveFilterConfig = {
        type: 'shockwave',
        enabled: true,
        intensity: createFilterIntensity(10)
      };

      const result = createFilter(config);
      expect((result.filter as any).amplitude).toBe(30); // Full amplitude
    });

    it('should handle missing optional properties', () => {
      const config: ShockwaveFilterConfig = {
        type: 'shockwave',
        enabled: true,
        intensity: createFilterIntensity(5)
      };

      expect(() => createFilter(config)).not.toThrow();
    });

    it('should handle extreme property values', () => {
      const config: ShockwaveFilterConfig = {
        type: 'shockwave',
        enabled: true,
        intensity: createFilterIntensity(5),
        center: { x: 0, y: 1 },
        amplitude: 1000,
        wavelength: 10,
        speed: 10000,
        time: 100,
        radius: 1000,
        brightness: 5.0
      };

      const result = createFilter(config);

      expect((result.filter as any).center).toEqual([0, 1]);
      expect((result.filter as any).amplitude).toBe(1000);
      expect((result.filter as any).wavelength).toBe(10);
      expect((result.filter as any).speed).toBe(10000);
      expect((result.filter as any).time).toBe(100);
      expect((result.filter as any).radius).toBe(1000);
      expect((result.filter as any).brightness).toBe(5.0);
    });
  });
}); 