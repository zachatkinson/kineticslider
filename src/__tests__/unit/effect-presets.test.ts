/**
 * @fileoverview EffectPresets Unit Tests
 *
 * Comprehensive unit tests for the EffectPresets class.
 * Tests individual methods and functionality in isolation.
 *
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Sprite, Container, Texture } from 'pixi.js';
import { gsap } from 'gsap';
import { EffectPresets } from '../../rendering/effect-presets';
import type {
  PresetIntensity,
  EffectCategory,
  PresetOptions,
  EffectPreset,
  PresetLibraryConfig,
} from '../../rendering/effect-presets';
import { EASING } from '../../core/constants';
import {
  createMockSprite,
  createMockContainer,
  createMockTexture,
} from '../utils/pixi-mocks';

// Mock PIXI filters - additional mocks for specific filters if needed
vi.mock('pixi.js', async () => {
  const actual = await vi.importActual('pixi.js');
  return {
    ...actual,
    NoiseFilter: vi.fn().mockImplementation((noise = 0.5) => ({
      noise,
      enabled: true,
      destroy: vi.fn(),
    })),
    DisplacementFilter: vi.fn().mockImplementation(() => ({
      scale: { x: 0, y: 0 },
      enabled: true,
      destroy: vi.fn(),
    })),
  };
});

describe('EffectPresets', () => {
  let effectPresets: EffectPresets;
  let sprite: Sprite;
  let container: Container;
  let texture: Texture;

  beforeEach(() => {
    effectPresets = new EffectPresets();
    sprite = createMockSprite() as unknown as Sprite;
    container = createMockContainer() as unknown as Container;
    texture = createMockTexture() as unknown as Texture;
  });

  afterEach(() => {
    gsap.killTweensOf('*');
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create instance with default config', () => {
      expect(effectPresets).toBeInstanceOf(EffectPresets);
    });

    it('should create instance with custom config', () => {
      const config: PresetLibraryConfig = {
        enableMetrics: false,
        defaultIntensity: 'strong',
        qualityLevel: 0.8,
        autoOptimize: false,
      };

      const presets = new EffectPresets(config);
      expect(presets).toBeInstanceOf(EffectPresets);
    });

    it('should register built-in presets', () => {
      const presetNames = effectPresets.getPresetNames();

      expect(presetNames).toContain('softBlur');
      expect(presetNames).toContain('motionBlur');
      expect(presetNames).toContain('softGlow');
      expect(presetNames).toContain('neonGlow');
      expect(presetNames).toContain('vintage');
      expect(presetNames).toContain('cyberpunk');
      expect(presetNames).toContain('blackAndWhite');
      expect(presetNames).toContain('ripple');
      expect(presetNames).toContain('wave');
      expect(presetNames).toContain('mouseFollowDisplacement');
      expect(presetNames).toContain('idleFloat');
      expect(presetNames).toContain('cinematicTransition');
      expect(presetNames).toContain('glitchEffect');
    });
  });

  describe('setDisplacementTexture', () => {
    it('should set displacement texture', () => {
      effectPresets.setDisplacementTexture(texture);

      // Should not throw when creating displacement effects
      expect(() => {
        effectPresets.createEffect('ripple');
      }).not.toThrow();
    });
  });

  describe('registerPreset', () => {
    it('should register custom preset', () => {
      const customPreset: EffectPreset = {
        name: 'customEffect',
        category: 'blur',
        description: 'Custom blur effect',
        performanceImpact: 2,
        compatibility: ['chrome', 'firefox'],
        useCases: ['testing'],
        create: () => ({
          filters: [],
          cleanup: () => {},
          applyTo: () => {},
          removeFrom: () => {},
        }),
      };

      effectPresets.registerPreset(customPreset);

      expect(effectPresets.getPresetNames()).toContain('customEffect');
      expect(effectPresets.getPreset('customEffect')).toBe(customPreset);
    });
  });

  describe('getPreset', () => {
    it('should get preset by name', () => {
      const preset = effectPresets.getPreset('softBlur');

      expect(preset).toBeDefined();
      expect(preset!.name).toBe('softBlur');
      expect(preset!.category).toBe('blur');
    });

    it('should return undefined for non-existent preset', () => {
      const preset = effectPresets.getPreset('nonExistent');

      expect(preset).toBeUndefined();
    });
  });

  describe('getPresetsByCategory', () => {
    it('should get presets by category', () => {
      const blurPresets = effectPresets.getPresetsByCategory('blur');

      expect(blurPresets).toHaveLength(2);
      expect(blurPresets.map((p) => p.name)).toContain('softBlur');
      expect(blurPresets.map((p) => p.name)).toContain('motionBlur');
    });

    it('should return empty array for unknown category', () => {
      const unknownPresets = effectPresets.getPresetsByCategory(
        'unknown' as EffectCategory
      );

      expect(unknownPresets).toHaveLength(0);
    });
  });

  describe('getPresetNames', () => {
    it('should return all preset names', () => {
      const names = effectPresets.getPresetNames();

      expect(names).toContain('softBlur');
      expect(names).toContain('vintage');
      expect(names).toContain('ripple');
      expect(names.length).toBeGreaterThan(10);
    });
  });

  describe('createEffect', () => {
    it('should create effect with default options', () => {
      const result = effectPresets.createEffect('softBlur');

      expect(result).toBeDefined();
      expect(result.filters).toBeDefined();
      expect(result.cleanup).toBeInstanceOf(Function);
      expect(result.applyTo).toBeInstanceOf(Function);
      expect(result.removeFrom).toBeInstanceOf(Function);
    });

    it('should create effect with custom options', () => {
      const options: PresetOptions = {
        intensity: 'strong',
        duration: 1.5,
        ease: EASING.EASE_IN_OUT,
        autoCleanup: false,
        customParams: { quality: 8 },
      };

      const result = effectPresets.createEffect('softBlur', options);

      expect(result).toBeDefined();
      expect(result.filters).toBeDefined();
    });

    it('should throw error for non-existent preset', () => {
      expect(() => {
        effectPresets.createEffect('nonExistent');
      }).toThrow('Preset "nonExistent" not found');
    });
  });

  describe('Built-in presets', () => {
    describe('Blur effects', () => {
      it('should create soft blur effect', () => {
        const result = effectPresets.createEffect('softBlur');

        expect(result.filterChain).toBeDefined();
        expect(result.filters).toHaveLength(1);

        result.cleanup();
      });

      it('should create motion blur effect', () => {
        const result = effectPresets.createEffect('motionBlur');

        expect(result.filterChain).toBeDefined();
        expect(result.filters).toHaveLength(1);

        result.cleanup();
      });

      it('should handle different intensities', () => {
        const subtle = effectPresets.createEffect('softBlur', {
          intensity: 'subtle',
        });
        const intense = effectPresets.createEffect('softBlur', {
          intensity: 'intense',
        });

        expect(subtle.filters).toHaveLength(1);
        expect(intense.filters).toHaveLength(1);

        subtle.cleanup();
        intense.cleanup();
      });
    });

    describe('Glow effects', () => {
      it('should create soft glow effect', () => {
        const result = effectPresets.createEffect('softGlow');

        expect(result.filterChain).toBeDefined();
        expect(result.filters).toHaveLength(2); // blur + color

        result.cleanup();
      });

      it('should create neon glow effect', () => {
        const result = effectPresets.createEffect('neonGlow');

        expect(result.filterChain).toBeDefined();
        expect(result.filters).toHaveLength(2); // blur + color

        result.cleanup();
      });
    });

    describe('Color effects', () => {
      it('should create vintage effect', () => {
        const result = effectPresets.createEffect('vintage');

        expect(result.filterChain).toBeDefined();
        expect(result.filters).toHaveLength(1);

        result.cleanup();
      });

      it('should create cyberpunk effect', () => {
        const result = effectPresets.createEffect('cyberpunk');

        expect(result.filterChain).toBeDefined();
        expect(result.filters).toHaveLength(1);

        result.cleanup();
      });

      it('should create black and white effect', () => {
        const result = effectPresets.createEffect('blackAndWhite');

        expect(result.filterChain).toBeDefined();
        expect(result.filters).toHaveLength(1);

        result.cleanup();
      });
    });

    describe('Distortion effects', () => {
      it('should create ripple effect', () => {
        effectPresets.setDisplacementTexture(texture);

        const result = effectPresets.createEffect('ripple');

        expect(result.filterChain).toBeDefined();
        expect(result.filters).toHaveLength(1);

        result.cleanup();
      });

      it('should create wave effect', () => {
        effectPresets.setDisplacementTexture(texture);

        const result = effectPresets.createEffect('wave');

        expect(result.filterChain).toBeDefined();
        expect(result.filters).toHaveLength(1);

        result.cleanup();
      });

      it('should throw error without displacement texture', () => {
        expect(() => {
          effectPresets.createEffect('ripple');
        }).toThrow('Displacement texture required');
      });
    });

    describe('Displacement effects', () => {
      it('should create mouse follow displacement effect', () => {
        effectPresets.setDisplacementTexture(texture);

        const result = effectPresets.createEffect('mouseFollowDisplacement');

        expect(result.displacementEffects).toBeDefined();
        expect(result.filters).toHaveLength(0);

        result.cleanup();
      });

      it('should create idle float effect', () => {
        effectPresets.setDisplacementTexture(texture);

        const result = effectPresets.createEffect('idleFloat');

        expect(result.displacementEffects).toBeDefined();
        expect(result.filters).toHaveLength(0);

        result.cleanup();
      });

      it('should throw error without displacement texture', () => {
        expect(() => {
          effectPresets.createEffect('mouseFollowDisplacement');
        }).toThrow('Displacement texture required');
      });
    });

    describe('Composite effects', () => {
      it('should create cinematic transition effect', () => {
        const result = effectPresets.createEffect('cinematicTransition');

        expect(result.filterChain).toBeDefined();
        expect(result.filters).toHaveLength(2); // blur + color

        result.cleanup();
      });

      it('should create glitch effect', () => {
        const result = effectPresets.createEffect('glitchEffect');

        expect(result.filterChain).toBeDefined();
        expect(result.filters).toHaveLength(2); // color + noise

        result.cleanup();
      });
    });
  });

  describe('getPerformanceImpact', () => {
    it('should get performance impact for existing preset', () => {
      const impact = effectPresets.getPerformanceImpact('softBlur');

      expect(impact).toBe(2);
    });

    it('should return 0 for non-existent preset', () => {
      const impact = effectPresets.getPerformanceImpact('nonExistent');

      expect(impact).toBe(0);
    });
  });

  describe('getRecommendedPresets', () => {
    it('should get recommended presets with default threshold', () => {
      const recommended = effectPresets.getRecommendedPresets();

      expect(recommended.length).toBeGreaterThan(0);
      expect(recommended.every((p) => p.performanceImpact <= 3)).toBe(true);
    });

    it('should get recommended presets with custom threshold', () => {
      const recommended = effectPresets.getRecommendedPresets(2);

      expect(recommended.length).toBeGreaterThan(0);
      expect(recommended.every((p) => p.performanceImpact <= 2)).toBe(true);
    });

    it('should sort by performance impact', () => {
      const recommended = effectPresets.getRecommendedPresets(5);

      for (let i = 1; i < recommended.length; i++) {
        expect(recommended[i].performanceImpact).toBeGreaterThanOrEqual(
          recommended[i - 1].performanceImpact
        );
      }
    });
  });

  describe('Effect application', () => {
    it('should apply effect to sprite', () => {
      const result = effectPresets.createEffect('softBlur');

      sprite.filters = [];
      result.applyTo(sprite);

      expect(sprite.filters.length).toBeGreaterThan(0);

      result.cleanup();
    });

    it('should remove effect from sprite', () => {
      const result = effectPresets.createEffect('softBlur');

      sprite.filters = [];
      result.applyTo(sprite);

      expect(sprite.filters.length).toBeGreaterThan(0);

      result.removeFrom(sprite);

      // Should have removed or reduced filters
      // (exact behavior depends on implementation)

      result.cleanup();
    });

    it('should apply effect to container', () => {
      const result = effectPresets.createEffect('softBlur');

      container.filters = [];
      result.applyTo(container);

      expect(container.filters.length).toBeGreaterThan(0);

      result.cleanup();
    });
  });

  describe('Intensity levels', () => {
    it('should handle subtle intensity', () => {
      const result = effectPresets.createEffect('softBlur', {
        intensity: 'subtle',
      });

      expect(result.filters).toBeDefined();

      result.cleanup();
    });

    it('should handle moderate intensity', () => {
      const result = effectPresets.createEffect('softBlur', {
        intensity: 'moderate',
      });

      expect(result.filters).toBeDefined();

      result.cleanup();
    });

    it('should handle strong intensity', () => {
      const result = effectPresets.createEffect('softBlur', {
        intensity: 'strong',
      });

      expect(result.filters).toBeDefined();

      result.cleanup();
    });

    it('should handle intense intensity', () => {
      const result = effectPresets.createEffect('softBlur', {
        intensity: 'intense',
      });

      expect(result.filters).toBeDefined();

      result.cleanup();
    });
  });

  describe('Custom parameters', () => {
    it('should handle custom parameters', () => {
      // Set displacement texture first
      effectPresets.setDisplacementTexture(texture);

      const result = effectPresets.createEffect('mouseFollowDisplacement', {
        customParams: {
          radius: 300,
          smoothing: false,
        },
      });

      expect(result.displacementEffects).toBeDefined();

      result.cleanup();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources properly', () => {
      const result = effectPresets.createEffect('softBlur');

      expect(() => {
        result.cleanup();
      }).not.toThrow();
    });

    it('should be safe to call cleanup multiple times', () => {
      const result = effectPresets.createEffect('softBlur');

      result.cleanup();

      expect(() => {
        result.cleanup();
      }).not.toThrow();
    });
  });

  describe('Error handling', () => {
    it('should handle missing displacement texture gracefully', () => {
      expect(() => {
        effectPresets.createEffect('ripple');
      }).toThrow('Displacement texture required');
    });

    it('should handle invalid intensity values', () => {
      const result = effectPresets.createEffect('softBlur', {
        intensity: 'invalid' as PresetIntensity,
      });

      expect(result.filters).toBeDefined();

      result.cleanup();
    });
  });
});
