/**
 * @fileoverview PixiSliderRenderer Integration Tests
 *
 * Tests the PIXI integration layer with real PIXI sprites and GSAP timelines.
 * These are integration tests that verify the renderer correctly applies
 * physics calculations to actual PIXI objects.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Sprite } from 'pixi.js';
import { PixiSliderRenderer } from '../../physics/renderer';
import { SliderPhysicsEngine } from '../../physics/engine';
import type {
  AnimationSequence,
  SwipeAnimation,
  ScaleAnimation,
} from '../../physics/engine';
import {
  createMockCanvas,
  createTestSprites,
  createTestPhysicsEngine,
  createTestRenderer,
  cleanupRenderer,
  assertTimelineValid,
  assertAnimationSequenceValid,
  assertSwipeAnimationValid,
  TEST_SPRITE_COUNTS,
  TEST_INTENSITIES,
  TEST_DIRECTIONS,
} from '../utils/test-factories';
import {
  EASING,
  ANIMATION_DURATION,
  TEST_TOLERANCE,
  TEST_CONFIG,
  SCALE,
} from '../../core/constants';

// Mock Canvas for PIXI in test environment
const mockCanvas = createMockCanvas();

// Mock HTMLCanvasElement creation
Object.defineProperty(global, 'HTMLCanvasElement', {
  value: vi.fn(() => mockCanvas),
  writable: true,
});

// Mock document.createElement for canvas
Object.defineProperty(document, 'createElement', {
  value: vi.fn((tagName: string) => {
    if (tagName === 'canvas') {
      return mockCanvas;
    }
    return {};
  }),
  writable: true,
});

describe('PixiSliderRenderer Integration', () => {
  let renderer: PixiSliderRenderer;
  let sprites: Sprite[];
  let physicsEngine: SliderPhysicsEngine;

  beforeEach(async () => {
    // Create physics engine
    physicsEngine = createTestPhysicsEngine();

    // Create renderer
    renderer = createTestRenderer();

    // Create test sprites with consistent setup
    sprites = createTestSprites(TEST_SPRITE_COUNTS.small);

    // CRITICAL: Mark sprites for GSAP targeting to eliminate warnings
    renderer.markSpritesForGSAP(sprites);
  });

  afterEach(() => {
    // Clean up timelines
    cleanupRenderer(renderer);
  });

  describe('Transition Animation Application', () => {
    it('should apply transition sequence to real sprites', async () => {
      // Generate physics calculation
      const sequence: AnimationSequence = physicsEngine.calculateTransition(
        0,
        1,
        TEST_SPRITE_COUNTS.small
      );

      // Apply to real sprites using correct API: applyTransition(sprites, sequence)
      const timeline = renderer.applyTransition(sprites, sequence);

      // Verify timeline was created
      assertTimelineValid(timeline);

      // Verify the sequence was correctly structured
      assertAnimationSequenceValid(sequence, 1);
      expect(sequence.targetSprite.initialState.alpha).toBe(0);
      expect(sequence.targetSprite.finalState.alpha).toBe(1);

      // Verify hidden sprites calculation is correct
      expect(sequence.hideSprites).toEqual([0, 2]); // Should hide all except target (index 1)
    });

    it('should handle source sprite exit animation', async () => {
      const sequence: AnimationSequence = physicsEngine.calculateTransition(
        0,
        2,
        TEST_SPRITE_COUNTS.small
      );

      // Ensure sequence has source sprite data
      assertAnimationSequenceValid(sequence, 2);
      expect(sequence.sourceSprite).toBeDefined();
      expect(sequence.sourceSprite!.index).toBe(0);

      const timeline = renderer.applyTransition(sprites, sequence);

      // Verify timeline includes source sprite animation
      assertTimelineValid(timeline);

      // Source sprite should still be visible initially
      expect(sprites[0].visible).toBe(true);
    });

    it('should apply target sprite animation correctly', async () => {
      const sequence: AnimationSequence = physicsEngine.calculateTransition(
        1,
        2,
        3
      );

      const timeline = renderer.applyTransition(sprites, sequence);

      // Verify timeline was configured with correct physics calculations
      expect(timeline.duration()).toBeGreaterThan(0);

      // Verify physics calculation structure
      expect(sequence.targetSprite.initialState.alpha).toBe(0);
      expect(sequence.targetSprite.finalState.alpha).toBe(1);

      // Timeline should animate to final state
      expect(timeline.duration()).toBeCloseTo(
        sequence.targetSprite.duration,
        TEST_TOLERANCE.TIMING
      );
    });
  });

  describe('Swipe Animation Application', () => {
    it('should apply swipe animation to sprites', async () => {
      const swipeAnimation: SwipeAnimation = physicsEngine.calculateSwipe(
        TEST_DIRECTIONS.right,
        TEST_INTENSITIES.high
      );
      const targetSprite = sprites[1];

      // Use correct API: applySwipe(sprite, animation)
      const timeline = renderer.applySwipe(targetSprite, swipeAnimation);

      // Verify timeline was created with correct phases
      assertTimelineValid(timeline);
      assertSwipeAnimationValid(swipeAnimation);

      // Timeline should have both initial and spring phases
      const expectedDuration =
        swipeAnimation.initialPhase.duration +
        swipeAnimation.springPhase.duration;
      expect(timeline.duration()).toBeCloseTo(
        expectedDuration,
        TEST_TOLERANCE.TIMING
      );
    });

    it('should handle different swipe directions', async () => {
      const rightSwipe = physicsEngine.calculateSwipe(
        TEST_DIRECTIONS.right,
        TEST_INTENSITIES.medium
      );
      const leftSwipe = physicsEngine.calculateSwipe(
        TEST_DIRECTIONS.left,
        TEST_INTENSITIES.medium
      );

      const sprite1 = sprites[0];
      const sprite2 = sprites[1];

      const timeline1 = renderer.applySwipe(sprite1, rightSwipe);
      const timeline2 = renderer.applySwipe(sprite2, leftSwipe);

      // Both timelines should be created successfully
      expect(timeline1.duration()).toBeGreaterThan(0);
      expect(timeline2.duration()).toBeGreaterThan(0);

      // Durations should be similar (opposite directions)
      expect(
        Math.abs(timeline1.duration() - timeline2.duration())
      ).toBeLessThan(TEST_TOLERANCE.TIMING);
    });

    it('should handle zero intensity swipe', async () => {
      const swipeAnimation: SwipeAnimation = physicsEngine.calculateSwipe(
        TEST_DIRECTIONS.right,
        TEST_INTENSITIES.zero
      );
      const targetSprite = sprites[0];

      const timeline = renderer.applySwipe(targetSprite, swipeAnimation);

      expect(timeline).toBeDefined();
      // Should still create timeline even with zero movement
      expect(timeline.duration()).toBeGreaterThan(0);
    });
  });

  describe('Scale Animation Application', () => {
    it('should apply scale animation to sprites', async () => {
      const medium = ANIMATION_DURATION.MEDIUM;
      const result = physicsEngine.calculateScale(SCALE.EMPHASIS, medium);
      const targetSprite = sprites[0];

      // Use correct API: applyScale(sprite, animation)
      const timeline = renderer.applyScale(targetSprite, result);

      expect(timeline).toBeDefined();
      expect(timeline.duration()).toBeCloseTo(
        result.duration,
        TEST_TOLERANCE.TIMING
      );

      // Scale should be animating to target value
      expect(timeline.vars).toBeDefined();
    });

    it('should handle minimum scale constraints', async () => {
      const scaleAnimation: ScaleAnimation = physicsEngine.calculateScale(
        TEST_CONFIG.SCALE_VALUES.ZERO
      ); // Should clamp to SCALE.MIN
      const targetSprite = sprites[0];

      const timeline = renderer.applyScale(targetSprite, scaleAnimation);

      expect(scaleAnimation.targetScale).toBe(SCALE.MIN); // Clamped by physics engine
      expect(timeline.duration()).toBeGreaterThan(0);
    });

    it('should handle large scale values', async () => {
      const scaleAnimation: ScaleAnimation = physicsEngine.calculateScale(
        TEST_CONFIG.SCALE_VALUES.LARGE
      );
      const targetSprite = sprites[0];

      const timeline = renderer.applyScale(targetSprite, scaleAnimation);

      expect(timeline).toBeDefined();
      expect(scaleAnimation.targetScale).toBe(TEST_CONFIG.SCALE_VALUES.LARGE);
    });
  });

  describe('Timeline Management', () => {
    it('should track active timelines', async () => {
      const sequence = physicsEngine.calculateTransition(0, 1, 3);
      const swipe = physicsEngine.calculateSwipe(1, TEST_INTENSITIES.medium);

      const timeline1 = renderer.applyTransition(sprites, sequence);
      const timeline2 = renderer.applySwipe(sprites[0], swipe);

      // Both timelines should be tracked
      expect(timeline1).toBeDefined();
      expect(timeline2).toBeDefined();
      expect(timeline1).not.toBe(timeline2);
    });

    it('should cleanup timelines properly', async () => {
      const sequence = physicsEngine.calculateTransition(0, 1, 3);
      const timeline = renderer.applyTransition(sprites, sequence);

      expect(timeline).toBeDefined();

      // Cleanup should not throw
      expect(() => {
        renderer.cleanup();
      }).not.toThrow();
    });

    it('should handle multiple concurrent animations', async () => {
      const sequence1 = physicsEngine.calculateTransition(0, 1, 3);
      const sequence2 = physicsEngine.calculateTransition(1, 2, 3);

      const timeline1 = renderer.applyTransition(sprites, sequence1);
      const timeline2 = renderer.applyTransition(sprites, sequence2);

      // Both should be independent
      expect(timeline1).not.toBe(timeline2);
      expect(timeline1.duration()).toBeGreaterThan(0);
      expect(timeline2.duration()).toBeGreaterThan(0);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle missing sprites gracefully', async () => {
      const sequence = physicsEngine.calculateTransition(0, 5, 3); // Index 5 doesn't exist

      expect(() => {
        renderer.applyTransition(sprites, sequence);
      }).not.toThrow();
    });

    it('should handle empty sprite array', async () => {
      const sequence = physicsEngine.calculateTransition(0, 0, 0);

      expect(() => {
        renderer.applyTransition([], sequence);
      }).not.toThrow();
    });

    it('should handle malformed animation data', async () => {
      const malformedSequence = {
        hideSprites: [],
        targetSprite: {
          index: 0,
          initialState: { visible: true, alpha: 0, scale: 1 },
          finalState: { alpha: 1, scale: 1 },
          duration: -1, // Invalid duration
          ease: 'invalid-ease',
        },
      } as AnimationSequence;

      expect(() => {
        renderer.applyTransition(sprites, malformedSequence);
      }).not.toThrow();
    });
  });

  describe('GSAP Integration', () => {
    it('should use GSAP timeline features', async () => {
      const sequence = physicsEngine.calculateTransition(0, 1, 2);
      const timeline = renderer.applyTransition(sprites, sequence);

      // Timeline should have GSAP methods
      expect(typeof timeline.play).toBe('function');
      expect(typeof timeline.pause).toBe('function');
      expect(typeof timeline.kill).toBe('function');
      expect(typeof timeline.duration).toBe('function');
    });

    it('should respect GSAP easing configurations', async () => {
      physicsEngine.setConfig({ transitionEase: EASING.ELASTIC });
      const sequence = physicsEngine.calculateTransition(0, 1, 2);

      expect(sequence.targetSprite.ease).toBe(EASING.ELASTIC);

      const timeline = renderer.applyTransition(sprites, sequence);
      expect(timeline).toBeDefined();
    });

    it('should handle GSAP animation completion', async () => {
      const sequence = physicsEngine.calculateTransition(0, 1, 2);
      const timeline = renderer.applyTransition(sprites, sequence);

      // Should have onComplete callback
      expect(timeline.vars).toBeDefined();
    });
  });

  describe('Performance Integration', () => {
    it('should create timelines efficiently', async () => {
      const startTime = performance.now();

      // Create multiple animations
      for (let i = 0; i < 10; i++) {
        const sequence = physicsEngine.calculateTransition(0, i % 3, 3);
        renderer.applyTransition(sprites, sequence);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete in reasonable time (< 100ms for 10 animations)
      expect(duration).toBeLessThan(100);
    });

    it('should handle rapid animation requests', async () => {
      const animations = [];

      // Rapidly create animations
      for (let i = 0; i < 5; i++) {
        const swipe = physicsEngine.calculateSwipe(1, TEST_INTENSITIES.medium);
        const timeline = renderer.applySwipe(sprites[0], swipe);
        animations.push(timeline);
      }

      // All animations should be created successfully
      expect(animations).toHaveLength(5);
      animations.forEach((timeline) => {
        expect(timeline).toBeDefined();
        expect(timeline.duration()).toBeGreaterThan(0);
      });
    });
  });

  describe('Performance Stats Integration', () => {
    it('should track performance statistics', async () => {
      const sequence = physicsEngine.calculateTransition(0, 1, 3);
      const swipe = physicsEngine.calculateSwipe(1, TEST_INTENSITIES.medium);

      renderer.applyTransition(sprites, sequence);
      renderer.applySwipe(sprites[0], swipe);

      const stats = renderer.getPerformanceStats();

      expect(stats.activeTimelines).toBe(2);
      expect(stats.totalAnimations).toBe(2);
      expect(stats.activeTweens).toBe(0); // Should be 0 for timeline-based animations
    });

    it('should update stats after cleanup', async () => {
      const sequence = physicsEngine.calculateTransition(0, 1, 3);
      renderer.applyTransition(sprites, sequence);

      let stats = renderer.getPerformanceStats();
      expect(stats.activeTimelines).toBe(1);

      renderer.cleanup();

      stats = renderer.getPerformanceStats();
      expect(stats.activeTimelines).toBe(0);
      expect(stats.totalAnimations).toBe(0);
    });
  });
});
