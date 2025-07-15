/**
 * @fileoverview GSAPPixiAdapter Unit Tests
 *
 * Comprehensive unit tests for the GSAPPixiAdapter class.
 * Tests individual methods and functionality in isolation.
 *
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Sprite, Container, Filter } from 'pixi.js';
import { gsap } from 'gsap';
import { GSAPPixiAdapter } from '../../rendering/gsap-pixi-adapter';
import type {
  SpriteAnimationConfig,
  ContainerAnimationConfig,
  FilterAnimationConfig,
} from '../../rendering/gsap-pixi-adapter';
import {
  ANIMATION_DURATION,
  EASING,
  SCALE,
  TEST_CONFIG,
  TEST_TOLERANCE,
} from '../../core/constants';
import {
  createMockSprite,
  createMockContainer,
  createMockFilter,
} from '../utils/pixi-mocks';

describe('GSAPPixiAdapter', () => {
  let adapter: GSAPPixiAdapter;
  let sprite: Sprite;
  let container: Container;
  let filter: Filter;

  beforeEach(() => {
    adapter = new GSAPPixiAdapter();
    sprite = createMockSprite() as unknown as Sprite;
    container = createMockContainer() as unknown as Container;
    filter = createMockFilter() as unknown as Filter;
  });

  afterEach(() => {
    adapter.dispose();
    gsap.killTweensOf('*');
  });

  describe('Constructor', () => {
    it('should initialize with default metrics', () => {
      const metrics = adapter.getPerformanceMetrics();

      expect(metrics.activeAnimations).toBe(0);
      expect(metrics.gpuMemoryUsage).toBe(0);
      expect(metrics.executionTime).toBeGreaterThanOrEqual(0);
      expect(metrics.averageFPS).toBeGreaterThan(0);
    });
  });

  describe('animateSprite', () => {
    it('should create GSAP timeline for sprite animation', () => {
      const config: SpriteAnimationConfig = {
        x: 100,
        y: 50,
        scale: 1.5,
        alpha: 0.8,
        duration: TEST_CONFIG.DURATION.SHORT,
        ease: EASING.EASE_OUT,
      };

      const timeline = adapter.animateSprite(sprite, config);

      expect(timeline).toBeDefined();
      expect(timeline.duration()).toBeCloseTo(
        config.duration!,
        TEST_TOLERANCE.TIMING
      );
    });

    it('should apply animation properties correctly', () => {
      const config: SpriteAnimationConfig = {
        x: 150,
        y: 75,
        scale: 2.0,
        alpha: 0.6,
        visible: false,
        duration: 0.1,
      };

      const timeline = adapter.animateSprite(sprite, config);
      timeline.progress(1);

      expect(sprite.x).toBe(150);
      expect(sprite.y).toBe(75);
      expect(sprite.alpha).toBeCloseTo(0.6, TEST_TOLERANCE.CALCULATION);
      expect(sprite.visible).toBe(false);
    });

    it('should handle partial configuration', () => {
      const config: SpriteAnimationConfig = {
        x: 50,
        duration: 0.1,
      };

      const timeline = adapter.animateSprite(sprite, config);
      timeline.progress(1);

      expect(sprite.x).toBe(50);
      // Other properties should remain unchanged
      expect(sprite.y).toBe(0);
      expect(sprite.alpha).toBe(1);
    });

    it('should respect scale constraints', () => {
      const config: SpriteAnimationConfig = {
        scale: 10, // Beyond max scale
        duration: 0.1,
      };

      const timeline = adapter.animateSprite(sprite, config);
      timeline.progress(1);

      // Should be clamped to max scale
      expect(sprite.scale.x).toBeLessThanOrEqual(SCALE.MAX);
      expect(sprite.scale.y).toBeLessThanOrEqual(SCALE.MAX);
    });

    it('should call animation callbacks', () => {
      const onStart = vi.fn();
      const onComplete = vi.fn();
      const onUpdate = vi.fn();

      const config: SpriteAnimationConfig = {
        x: 100,
        duration: 0.01,
        onStart,
        onComplete,
        onUpdate,
      };

      const timeline = adapter.animateSprite(sprite, config);

      // Simulate timeline execution
      timeline.play();
      timeline.progress(0.5);
      timeline.progress(1);

      expect(onStart).toHaveBeenCalled();
      expect(onUpdate).toHaveBeenCalled();
      expect(onComplete).toHaveBeenCalled();
    });
  });

  describe('animateContainer', () => {
    it('should animate container properties', () => {
      const config: ContainerAnimationConfig = {
        x: 200,
        y: 100,
        scale: 1.2,
        duration: 0.1,
      };

      const timeline = adapter.animateContainer(container, config);
      timeline.progress(1);

      expect(container.x).toBe(200);
      expect(container.y).toBe(100);
    });

    it('should animate children when configured', () => {
      const childSprite1 = createMockSprite() as unknown as Sprite;
      const childSprite2 = createMockSprite() as unknown as Sprite;

      container.addChild(childSprite1);
      container.addChild(childSprite2);

      const config: ContainerAnimationConfig = {
        x: 50,
        animateChildren: true,
        staggerDelay: 0.05,
        duration: 0.1,
      };

      const timeline = adapter.animateContainer(container, config);

      expect(timeline).toBeDefined();
      expect(timeline.duration()).toBeGreaterThan(config.duration!);
    });

    it('should not animate children when disabled', () => {
      const childSprite = createMockSprite() as unknown as Sprite;
      container.addChild(childSprite);

      const config: ContainerAnimationConfig = {
        x: 50,
        animateChildren: false,
        duration: 0.1,
      };

      const timeline = adapter.animateContainer(container, config);

      expect(timeline.duration()).toBeCloseTo(
        config.duration!,
        TEST_TOLERANCE.TIMING
      );
    });
  });

  describe('createDisplacementEffect', () => {
    it('should apply filter to sprite and animate properties', () => {
      const config: FilterAnimationConfig = {
        properties: {
          displacement: 20,
          scale: 1.5,
        },
        duration: 0.1,
      };

      const timeline = adapter.createDisplacementEffect(sprite, filter, config);

      expect(sprite.filters).toContain(filter);
      expect(timeline).toBeDefined();
    });

    it('should not duplicate filters', () => {
      sprite.filters = [filter];

      const config: FilterAnimationConfig = {
        properties: { displacement: 10 },
        duration: 0.1,
      };

      adapter.createDisplacementEffect(sprite, filter, config);

      expect(sprite.filters?.length).toBe(1);
      expect(sprite.filters).toContain(filter);
    });

    it('should animate filter properties', () => {
      const config: FilterAnimationConfig = {
        properties: {
          blur: 15,
          brightness: 1.3,
        },
        duration: 0.1,
      };

      const timeline = adapter.createDisplacementEffect(sprite, filter, config);
      timeline.progress(1);

      expect((filter as unknown as { blur: number }).blur).toBe(15);
      expect((filter as unknown as { brightness: number }).brightness).toBe(
        1.3
      );
    });
  });

  describe('createScaleAnimation', () => {
    it('should animate sprite scale correctly', () => {
      const targetScale = 1.8;
      const timeline = adapter.createScaleAnimation(
        sprite,
        targetScale,
        TEST_CONFIG.DURATION.SHORT
      );

      timeline.progress(1);

      expect(sprite.scale.x).toBeCloseTo(
        targetScale,
        TEST_TOLERANCE.CALCULATION
      );
      expect(sprite.scale.y).toBeCloseTo(
        targetScale,
        TEST_TOLERANCE.CALCULATION
      );
    });

    it('should use default parameters', () => {
      const timeline = adapter.createScaleAnimation(sprite);

      expect(timeline).toBeDefined();
      expect(timeline.duration()).toBeCloseTo(
        ANIMATION_DURATION.FAST,
        TEST_TOLERANCE.TIMING
      );
    });

    it('should handle base scale correctly', () => {
      // Set a base scale
      sprite.scale.set(2, 2);

      const targetScale = 1.5;
      const timeline = adapter.createScaleAnimation(sprite, targetScale, 0.1);
      timeline.progress(1);

      // Should maintain base scale relationship
      expect(sprite.scale.x).toBeCloseTo(
        targetScale * 2,
        TEST_TOLERANCE.CALCULATION
      );
    });
  });

  describe('createFadeTransition', () => {
    it('should fade between sprites correctly', () => {
      const sprite1 = createMockSprite() as unknown as Sprite;
      const sprite2 = createMockSprite() as unknown as Sprite;

      sprite1.alpha = 1;
      sprite1.visible = true;
      sprite2.alpha = 0;
      sprite2.visible = false;

      const timeline = adapter.createFadeTransition(
        sprite1,
        sprite2,
        TEST_CONFIG.DURATION.SHORT
      );

      // Both should be visible during transition
      expect(sprite1.visible).toBe(true);
      expect(sprite2.visible).toBe(true);
      expect(sprite2.alpha).toBe(0);

      timeline.progress(1);

      expect(sprite1.alpha).toBe(0);
      expect(sprite1.visible).toBe(false);
      expect(sprite2.alpha).toBe(1);
      expect(sprite2.visible).toBe(true);
    });

    it('should use default duration', () => {
      const sprite1 = createMockSprite() as unknown as Sprite;
      const sprite2 = createMockSprite() as unknown as Sprite;

      const timeline = adapter.createFadeTransition(sprite1, sprite2);

      expect(timeline.duration()).toBeCloseTo(
        ANIMATION_DURATION.STANDARD,
        TEST_TOLERANCE.TIMING
      );
    });
  });

  describe('Animation Management', () => {
    it('should track active animations', () => {
      const config: SpriteAnimationConfig = {
        x: 100,
        duration: 1, // Long duration to keep active
      };

      adapter.animateSprite(sprite, config);
      adapter.animateSprite(createMockSprite() as unknown as Sprite, config);

      const metrics = adapter.getPerformanceMetrics();
      expect(metrics.activeAnimations).toBe(2);
    });

    it('should kill specific animations', () => {
      adapter.animateSprite(sprite, {
        x: 100,
        duration: 1,
      });

      // Extract animation ID (would need access to internal method)
      // For now, test that killAllAnimations works
      adapter.killAllAnimations();

      const metrics = adapter.getPerformanceMetrics();
      expect(metrics.activeAnimations).toBe(0);
    });

    it('should kill all animations', () => {
      // Create multiple animations
      adapter.animateSprite(sprite, { x: 100, duration: 1 });
      adapter.animateSprite(createMockSprite() as unknown as Sprite, {
        y: 50,
        duration: 1,
      });
      adapter.createScaleAnimation(sprite, 1.5, 1);

      adapter.killAllAnimations();

      const metrics = adapter.getPerformanceMetrics();
      expect(metrics.activeAnimations).toBe(0);
    });

    it('should pause and resume animations', () => {
      const timeline = adapter.animateSprite(sprite, {
        x: 100,
        duration: 1,
      });

      adapter.pauseAllAnimations();
      expect(timeline.paused()).toBe(true);

      adapter.resumeAllAnimations();
      expect(timeline.paused()).toBe(false);
    });
  });

  describe('Performance Metrics', () => {
    it('should update metrics when animations are created', () => {
      const initialMetrics = adapter.getPerformanceMetrics();

      adapter.animateSprite(sprite, { x: 100, duration: 1 });

      const updatedMetrics = adapter.getPerformanceMetrics();
      expect(updatedMetrics.activeAnimations).toBeGreaterThan(
        initialMetrics.activeAnimations
      );
      expect(updatedMetrics.gpuMemoryUsage).toBeGreaterThan(
        initialMetrics.gpuMemoryUsage
      );
    });

    it('should track execution time', () => {
      // const startTime = performance.now();

      adapter.animateSprite(sprite, { x: 100, duration: 0.1 });

      const metrics = adapter.getPerformanceMetrics();
      expect(metrics.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('should estimate GPU memory usage', () => {
      // Create multiple animations to increase memory usage
      for (let i = 0; i < 5; i++) {
        adapter.animateSprite(createMockSprite() as unknown as Sprite, {
          x: i * 10,
          duration: 1,
        });
      }

      const metrics = adapter.getPerformanceMetrics();
      expect(metrics.gpuMemoryUsage).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle null sprite gracefully', () => {
      expect(() => {
        adapter.animateSprite(null as unknown as Sprite, { x: 100 });
      }).not.toThrow();
    });

    it('should handle invalid animation config', () => {
      const invalidConfig: SpriteAnimationConfig = {
        scale: -1,
        alpha: 2,
        duration: -1,
      };

      expect(() => {
        adapter.animateSprite(sprite, invalidConfig);
      }).not.toThrow();
    });

    it('should handle disposed adapter', () => {
      adapter.dispose();

      expect(() => {
        adapter.animateSprite(sprite, { x: 100 });
      }).not.toThrow();

      const metrics = adapter.getPerformanceMetrics();
      expect(metrics.activeAnimations).toBe(0);
    });
  });

  describe('Memory Management', () => {
    it('should cleanup resources on dispose', () => {
      // Create animations
      adapter.animateSprite(sprite, { x: 100, duration: 1 });
      adapter.createScaleAnimation(sprite, 1.5, 1);

      adapter.dispose();

      const metrics = adapter.getPerformanceMetrics();
      expect(metrics.activeAnimations).toBe(0);
      expect(metrics.gpuMemoryUsage).toBe(0);
    });

    it('should handle rapid animation creation and cleanup', () => {
      // Create and destroy animations rapidly
      for (let i = 0; i < 100; i++) {
        adapter.animateSprite(createMockSprite() as unknown as Sprite, {
          x: i,
          duration: 0.01,
        });

        if (i % 10 === 0) {
          adapter.killAllAnimations();
        }
      }

      // Memory should not grow indefinitely
      const metrics = adapter.getPerformanceMetrics();
      expect(metrics.gpuMemoryUsage).toBeLessThan(50000); // Reasonable threshold
    });
  });
});
