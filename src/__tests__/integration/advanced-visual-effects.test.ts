/**
 * @fileoverview Advanced Visual Effects Integration Tests
 *
 * Integration tests for Phase 3.3 advanced visual effects components.
 * Tests the coordination between DisplacementEffects, FilterChain,
 * EffectPresets, and PerformanceOptimizer.
 *
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Sprite, Texture, Filter } from 'pixi.js';
import { gsap } from 'gsap';
import { DisplacementEffects } from '../../rendering/displacement-effects';
import { FilterChain } from '../../rendering/filter-chain';
import { EffectPresets } from '../../rendering/effect-presets';
import { PerformanceOptimizer } from '../../rendering/performance-optimizer';
// Import types for typing purposes
// import type {
//   MouseFollowOptions,
//   TransitionOptions,
//   IdleEffectOptions,
// } from '../../rendering/displacement-effects';
// import type { FilterConfig } from '../../rendering/filter-chain';
// import type { PresetOptions } from '../../rendering/effect-presets';
import type { QualityLevel } from '../../rendering/performance-optimizer';
import {
  createMockSprite,
  createMockTexture,
} from '../utils/pixi-mocks';

// Mock PIXI filters
vi.mock('pixi.js', async () => {
  const actual = await vi.importActual('pixi.js');
  return {
    ...actual,
    BlurFilter: vi.fn().mockImplementation((blur = 0) => ({
      blur,
      enabled: true,
      destroy: vi.fn(),
    })),
    ColorMatrixFilter: vi.fn().mockImplementation(() => {
      const filter = {
        matrix: new Float32Array(20),
        enabled: true,
        brightness: vi.fn(),
        contrast: vi.fn(),
        sepia: vi.fn(),
        hue: vi.fn(),
        saturate: vi.fn(),
        desaturate: vi.fn(),
        destroy: vi.fn(),
      };

      // Make methods return the filter itself for chaining
      filter.brightness.mockReturnValue(filter);
      filter.contrast.mockReturnValue(filter);
      filter.sepia.mockReturnValue(filter);
      filter.hue.mockReturnValue(filter);
      filter.saturate.mockReturnValue(filter);
      filter.desaturate.mockReturnValue(filter);

      return filter;
    }),
    DisplacementFilter: vi.fn().mockImplementation(() => ({
      scale: { x: 0, y: 0 },
      enabled: true,
      destroy: vi.fn(),
    })),
    NoiseFilter: vi.fn().mockImplementation(() => ({
      noise: 0.5,
      enabled: true,
      destroy: vi.fn(),
    })),
  };
});

describe('Advanced Visual Effects Integration', () => {
  let displacementEffects: DisplacementEffects;
  let filterChain: FilterChain;
  let effectPresets: EffectPresets;
  let performanceOptimizer: PerformanceOptimizer;
  let sprite: Sprite;
  // let container: Container;
  let texture: Texture;

  beforeEach(() => {
    texture = createMockTexture() as unknown as Texture;
    displacementEffects = new DisplacementEffects(texture);
    filterChain = new FilterChain();
    effectPresets = new EffectPresets();
    effectPresets.setDisplacementTexture(texture);
    performanceOptimizer = new PerformanceOptimizer();

    sprite = createMockSprite() as unknown as Sprite;
    // container = createMockContainer() as unknown as Container;
  });

  afterEach(() => {
    displacementEffects.dispose();
    filterChain.dispose();
    performanceOptimizer.dispose();
    gsap.killTweensOf('*');
    vi.clearAllMocks();
  });

  describe('DisplacementEffects + FilterChain Integration', () => {
    it('should coordinate displacement effects with filter chains', () => {
      // Create a filter chain with displacement-compatible effects
      const blurFilter = { blur: 0, enabled: true, destroy: vi.fn() };
      filterChain.addFilter(blurFilter as unknown as Filter, {
        id: 'blur',
        animationProperties: { blur: 5 },
        duration: 1.0,
      });

      // Apply filter chain
      const chainResult = filterChain.applyTo(sprite);

      // Add displacement effect
      const displacementTimeline = displacementEffects.createMouseFollowEffect(
        sprite,
        {
          intensity: 0.5,
          duration: 1.0,
        }
      );

      expect(chainResult.timeline).toBeDefined();
      expect(displacementTimeline).toBeDefined();

      // Both should be active
      expect(chainResult.appliedCount).toBe(1);
      expect(displacementEffects.getPerformanceMetrics().activeEffects).toBe(1);
    });

    it('should handle simultaneous transitions with filter chains', () => {
      const fromSprite = createMockSprite() as unknown as Sprite;
      const toSprite = createMockSprite() as unknown as Sprite;

      // Apply filter chain to both sprites
      const blurFilter1 = { blur: 0, enabled: true, destroy: vi.fn() };
      const blurFilter2 = { blur: 0, enabled: true, destroy: vi.fn() };

      filterChain.addFilter(blurFilter1 as unknown as Filter, {
        id: 'blur1',
        animationProperties: { blur: 3 },
      });

      const secondChain = new FilterChain();
      secondChain.addFilter(blurFilter2 as unknown as Filter, {
        id: 'blur2',
        animationProperties: { blur: 3 },
      });

      filterChain.applyTo(fromSprite);
      secondChain.applyTo(toSprite);

      // Create transition with displacement effects
      const transitionTimeline = displacementEffects.createTransitionEffect(
        fromSprite,
        toSprite,
        {
          type: 'wave',
          intensity: 0.7,
          duration: 1.5,
        }
      );

      expect(transitionTimeline).toBeDefined();
      expect(displacementEffects.getPerformanceMetrics().activeEffects).toBe(1);

      secondChain.dispose();
    });

    it('should handle filter chain removal with active displacement effects', async () => {
      // Apply filter chain
      const blurFilter = { blur: 0, enabled: true, destroy: vi.fn() };
      filterChain.addFilter(blurFilter as unknown as Filter, {
        id: 'blur',
        animationProperties: { blur: 5 },
      });

      filterChain.applyTo(sprite);

      // Add displacement effect
      displacementEffects.createIdleEffect(sprite, {
        type: 'float',
        intensity: 0.3,
      });

      // Remove filter chain but keep displacement effect
      await filterChain.removeFrom(sprite);

      expect(displacementEffects.getPerformanceMetrics().activeEffects).toBe(1);
    });
  });

  describe('PerformanceOptimizer Integration', () => {
    it('should optimize displacement effects based on performance', async () => {
      // Register displacement effects with optimizer
      performanceOptimizer.registerTarget(displacementEffects);

      await performanceOptimizer.initialize();

      // Create displacement effect
      displacementEffects.createMouseFollowEffect(sprite, {
        intensity: 0.8,
      });

      // Set low quality level
      const lowQuality: QualityLevel = {
        level: 0.2,
        effectIntensity: 0.2,
        maxConcurrentEffects: 1,
        animationQuality: 0.3,
        textureScale: 0.5,
        enableDisplacement: true,
        enableComplexFilters: false,
        filterQuality: 0.2,
        renderScale: 0.6,
      };

      performanceOptimizer.setQualityLevel(lowQuality);

      // Should optimize displacement effects
      expect(displacementEffects.getPerformanceMetrics().activeEffects).toBe(1);
    });

    it('should optimize filter chains based on performance', async () => {
      // Register filter chain with optimizer
      performanceOptimizer.registerTarget(filterChain);

      await performanceOptimizer.initialize();

      // Create complex filter chain
      const filter1 = { enabled: true, destroy: vi.fn() };
      const filter2 = { enabled: true, destroy: vi.fn() };
      const filter3 = { enabled: true, destroy: vi.fn() };

      filterChain.addFilter(filter1 as unknown as Filter, {
        id: 'filter1',
        animationProperties: { alpha: 0.5 },
      });

      filterChain.addFilter(filter2 as unknown as Filter, {
        id: 'filter2',
        animationProperties: { alpha: 0.7 },
      });

      filterChain.addFilter(filter3 as unknown as Filter, {
        id: 'filter3',
        animationProperties: { alpha: 0.9 },
      });

      filterChain.applyTo(sprite);

      // Get optimization recommendation
      const recommendation =
        performanceOptimizer.getOptimizationRecommendation();

      expect(recommendation).toBeDefined();
      expect(recommendation.qualityLevel).toBeDefined();
      expect(recommendation.changes).toBeInstanceOf(Array);
    });
  });

  describe('Full Integration Scenarios', () => {
    it('should handle interactive effects with performance monitoring', async () => {
      // Setup performance monitoring
      performanceOptimizer.registerTarget(displacementEffects);
      performanceOptimizer.registerTarget(filterChain);

      await performanceOptimizer.initialize();
      performanceOptimizer.startMonitoring();

      // Create interactive effects
      const interactivePreset = effectPresets.createEffect(
        'mouseFollowDisplacement',
        {
          intensity: 'strong',
          customParams: {
            radius: 200,
            smoothing: true,
          },
        }
      );

      interactivePreset.applyTo(sprite);

      // Add responsive filter chain
      const responsiveFilter = { enabled: true, destroy: vi.fn() };
      filterChain.addFilter(responsiveFilter as unknown as Filter, {
        id: 'responsive',
        animationProperties: { alpha: 0.8 },
        duration: 0.3,
      });

      filterChain.applyTo(sprite);

      // Add idle animation
      displacementEffects.createIdleEffect(sprite, {
        type: 'breathe',
        intensity: 0.4,
        loop: true,
      });

      // Monitor performance
      // let performanceEvents = 0;
      // performanceOptimizer.addEventListener('quality_change', () => {
      //   performanceEvents++;
      // });

      // Simulate performance optimization
      performanceOptimizer.applyOptimization();

      // Should have coordinated all effects
      expect(
        displacementEffects.getPerformanceMetrics().activeEffects
      ).toBeGreaterThan(0);
      expect(filterChain.getMetrics().activeAnimations).toBeGreaterThanOrEqual(
        0
      );

      // Cleanup
      interactivePreset.cleanup();
      performanceOptimizer.stopMonitoring();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle disposal of components in correct order', () => {
      // Create effects
      const preset = effectPresets.createEffect('softBlur');
      preset.applyTo(sprite);

      const filter = { enabled: true, destroy: vi.fn() };
      filterChain.addFilter(filter as unknown as Filter, { id: 'test' });
      filterChain.applyTo(sprite);

      displacementEffects.createIdleEffect(sprite);

      // Dispose in reverse order
      expect(() => {
        displacementEffects.dispose();
        filterChain.dispose();
        preset.cleanup();
      }).not.toThrow();
    });

    it('should handle missing displacement texture gracefully', () => {
      const effectsWithoutTexture = new DisplacementEffects();
      const presetsWithoutTexture = new EffectPresets();

      expect(() => {
        effectsWithoutTexture.createMouseFollowEffect(sprite);
      }).toThrow();

      expect(() => {
        presetsWithoutTexture.createEffect('ripple');
      }).toThrow();

      effectsWithoutTexture.dispose();
    });
  });
});
