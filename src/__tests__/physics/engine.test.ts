/**
 * @fileoverview SliderPhysicsEngine Tests
 *
 * Unit tests for the pure physics calculation engine.
 * No external dependencies - pure math testing.
 *
 * This demonstrates best practice: pure functions are easy to unit test.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SliderPhysicsEngine } from '../../physics/engine';
import type { PhysicsConfig } from '../../core/types';
import {
  createTestPhysicsEngine,
  testPhysicsCalculation,
  assertAnimationSequenceValid,
  assertSwipeAnimationValid,
  TEST_PHYSICS_CONFIGS,
  TEST_INTENSITIES,
  TEST_DIRECTIONS,
  TEST_SPRITE_COUNTS,
} from '../utils/test-factories';
import {
  ANIMATION_DURATION,
  EASING,
  PHYSICS,
  SCALE,
  INTENSITY,
  TEST_CONFIG,
  TEST_TOLERANCE,
} from '../../core';

describe('SliderPhysicsEngine', () => {
  let engine: SliderPhysicsEngine;

  beforeEach(() => {
    engine = createTestPhysicsEngine();
  });

  describe('Configuration Management', () => {
    it('should have default configuration', () => {
      const config = engine.getConfig();

      expect(config).toEqual(TEST_PHYSICS_CONFIGS.default);
    });

    it('should update configuration partially', () => {
      engine.setConfig({ transitionDuration: TEST_CONFIG.DURATION.SHORT });

      const config = engine.getConfig();
      expect(config.transitionDuration).toBe(TEST_CONFIG.DURATION.SHORT);
      expect(config.transitionEase).toBe(
        TEST_PHYSICS_CONFIGS.default.transitionEase
      ); // Unchanged
    });

    it('should update multiple configuration properties', () => {
      const updates: Partial<PhysicsConfig> = {
        transitionDuration: TEST_CONFIG.DURATION.MEDIUM,
        swipeThreshold: TEST_CONFIG.SWIPE.THRESHOLD,
        momentumDamping: TEST_CONFIG.DAMPING.HEAVY,
      };

      engine.setConfig(updates);

      const config = engine.getConfig();
      expect(config.transitionDuration).toBe(TEST_CONFIG.DURATION.MEDIUM);
      expect(config.swipeThreshold).toBe(TEST_CONFIG.SWIPE.THRESHOLD);
      expect(config.momentumDamping).toBe(TEST_CONFIG.DAMPING.HEAVY);
    });
  });

  describe('Transition Calculations', () => {
    it('should calculate basic transition sequence', () => {
      const { result, isValid } = testPhysicsCalculation(
        engine,
        (e) => e.calculateTransition(0, 2, TEST_SPRITE_COUNTS.medium),
        (sequence) => sequence.targetSprite.index === 2
      );

      expect(isValid).toBe(true);
      assertAnimationSequenceValid(result, 2);
      expect(result.hideSprites).toEqual([0, 1, 3, 4]); // All except target (2)
      expect(result.targetSprite.initialState).toEqual({
        visible: true,
        alpha: 0,
        scale: TEST_CONFIG.EXPECTED.SCALE_11,
      });
      expect(result.targetSprite.finalState).toEqual({
        alpha: 1,
        scale: 1,
      });
    });

    it('should include source sprite exit when different from target', () => {
      const sequence = engine.calculateTransition(
        1,
        3,
        TEST_SPRITE_COUNTS.medium
      );

      assertAnimationSequenceValid(sequence, 3);
      expect(sequence.sourceSprite).toBeDefined();
      expect(sequence.sourceSprite!.index).toBe(1);
      expect(sequence.sourceSprite!.finalState).toEqual({
        alpha: 0,
        scale: TEST_CONFIG.EXPECTED.SCALE_09,
        visible: false,
      });
    });

    it('should not include source sprite when same as target', () => {
      const sequence = engine.calculateTransition(
        2,
        2,
        TEST_SPRITE_COUNTS.medium
      );

      assertAnimationSequenceValid(sequence, 2);
      expect(sequence.sourceSprite).toBeUndefined();
    });

    it('should handle invalid indices gracefully', () => {
      const sequence = engine.calculateTransition(
        -1,
        2,
        TEST_SPRITE_COUNTS.small
      );

      expect(sequence.sourceSprite).toBeUndefined(); // Invalid source index
      assertAnimationSequenceValid(sequence, 2); // Valid target
    });

    it('should use configuration values in calculations', () => {
      engine.setConfig(TEST_PHYSICS_CONFIGS.slow);

      const sequence = engine.calculateTransition(
        0,
        1,
        TEST_SPRITE_COUNTS.small
      );

      assertAnimationSequenceValid(sequence, 1);
      expect(sequence.targetSprite.duration).toBe(
        TEST_PHYSICS_CONFIGS.slow.transitionDuration
      );
      expect(sequence.targetSprite.ease).toBe(
        TEST_PHYSICS_CONFIGS.slow.transitionEase
      );
    });
  });

  describe('Swipe Calculations', () => {
    it('should calculate swipe animation with positive direction', () => {
      const { result, isValid } = testPhysicsCalculation(
        engine,
        (e) => e.calculateSwipe(TEST_DIRECTIONS.right, TEST_INTENSITIES.medium),
        (animation) => animation.initialPhase.movement > 0
      );

      expect(isValid).toBe(true);
      assertSwipeAnimationValid(result);
      expect(result.initialPhase.movement).toBe(
        TEST_CONFIG.EXPECTED.MOVEMENT_50
      ); // 1 * 0.5 * 100
      expect(result.initialPhase.scale).toBe(TEST_CONFIG.EXPECTED.SCALE_105); // 1 + (0.5 * 0.1)
      expect(result.initialPhase.duration).toBe(ANIMATION_DURATION.FAST);

      expect(result.springPhase.movement).toBe(
        TEST_CONFIG.EXPECTED.MOVEMENT_NEG_425
      ); // -50 * 0.85
      expect(result.springPhase.scale).toBe(1);
      expect(result.springPhase.ease).toBe(EASING.ELASTIC);
    });

    it('should calculate swipe animation with negative direction', () => {
      const animation = engine.calculateSwipe(
        TEST_DIRECTIONS.left,
        TEST_INTENSITIES.low
      );

      assertSwipeAnimationValid(animation);
      expect(animation.initialPhase.movement).toBe(
        TEST_CONFIG.EXPECTED.MOVEMENT_NEG_30
      ); // -1 * 0.3 * 100
      expect(animation.initialPhase.scale).toBe(TEST_CONFIG.EXPECTED.SCALE_103); // 1 + (0.3 * 0.1)

      expect(animation.springPhase.movement).toBe(
        TEST_CONFIG.EXPECTED.MOVEMENT_255
      ); // -(-30) * 0.85
    });

    it('should clamp intensity to valid range', () => {
      const highIntensity = engine.calculateSwipe(
        TEST_DIRECTIONS.right,
        TEST_CONFIG.CALCULATION.INTENSITY_EDGE_HIGH
      ); // > 1
      const lowIntensity = engine.calculateSwipe(
        TEST_DIRECTIONS.right,
        TEST_CONFIG.CALCULATION.INTENSITY_EDGE_LOW
      ); // < 0

      assertSwipeAnimationValid(highIntensity);
      assertSwipeAnimationValid(lowIntensity);
      expect(highIntensity.initialPhase.movement).toBe(100); // Clamped to 1
      expect(lowIntensity.initialPhase.movement).toBe(0); // Clamped to 0
    });

    it('should use configuration values', () => {
      engine.setConfig({
        scaleIntensity: INTENSITY.VERY_LOW as number,
        momentumDamping: TEST_CONFIG.DAMPING.LIGHT as number,
        transitionDuration: TEST_CONFIG.DURATION.STANDARD as number,
      });

      const animation = engine.calculateSwipe(
        TEST_DIRECTIONS.right,
        TEST_INTENSITIES.medium
      );

      assertSwipeAnimationValid(animation);
      expect(animation.initialPhase.scale).toBe(TEST_CONFIG.EXPECTED.SCALE_105); // 1 + (0.5 * 0.1)
      expect(animation.springPhase.movement).toBe(
        TEST_CONFIG.EXPECTED.MOVEMENT_NEG_35
      ); // -50 * 0.7
      expect(animation.springPhase.duration).toBe(
        TEST_CONFIG.DURATION.STANDARD
      );
    });
  });

  describe('Scale Calculations', () => {
    it('should calculate basic scale animation', () => {
      const { result, isValid } = testPhysicsCalculation(
        engine,
        (e) => e.calculateScale(TEST_CONFIG.SCALE_VALUES.SMALL),
        (animation) => animation.targetScale === TEST_CONFIG.SCALE_VALUES.SMALL
      );

      expect(isValid).toBe(true);
      expect(result.targetScale).toBe(TEST_CONFIG.SCALE_VALUES.SMALL);
      expect(result.duration).toBe(INTENSITY.LOW);
      expect(result.ease).toBe(TEST_PHYSICS_CONFIGS.default.transitionEase);
    });

    it('should use custom duration', () => {
      const animation = engine.calculateScale(
        TEST_CONFIG.SCALE_VALUES.LARGE,
        ANIMATION_DURATION.SLOW
      );

      expect(animation.duration).toBe(ANIMATION_DURATION.SLOW);
      expect(animation.targetScale).toBe(TEST_CONFIG.SCALE_VALUES.LARGE);
    });

    it('should prevent zero or negative scale', () => {
      const zeroScale = engine.calculateScale(TEST_INTENSITIES.zero);
      const negativeScale = engine.calculateScale(
        TEST_CONFIG.CALCULATION.SCALE_NEG_05
      );

      expect(zeroScale.targetScale).toBe(SCALE.MIN); // Minimum scale
      expect(negativeScale.targetScale).toBe(SCALE.MIN); // Minimum scale
    });

    it('should enforce minimum duration', () => {
      const shortDuration = engine.calculateScale(
        TEST_CONFIG.SCALE_VALUES.SMALL,
        PHYSICS.MIN_DURATION / 2
      );

      expect(shortDuration.duration).toBe(PHYSICS.MIN_DURATION); // Minimum duration
      expect(shortDuration.targetScale).toBe(TEST_CONFIG.SCALE_VALUES.SMALL);
    });
  });

  describe('Advanced Calculations', () => {
    it('should determine slide change threshold', () => {
      engine.setConfig({ swipeThreshold: 100 });

      // Distance threshold
      expect(engine.shouldTriggerSlideChange(150, INTENSITY.LOW)).toBe(true);
      expect(engine.shouldTriggerSlideChange(50, INTENSITY.LOW)).toBe(false);

      // Velocity threshold
      expect(engine.shouldTriggerSlideChange(30, INTENSITY.HIGH)).toBe(true);
      expect(engine.shouldTriggerSlideChange(30, INTENSITY.LOW)).toBe(false);
    });

    it('should calculate adaptive timing', () => {
      engine.setConfig({ transitionDuration: TEST_CONFIG.DURATION.STANDARD });

      // Quick interaction (500ms, high intensity)
      const quickTiming = engine.calculateAdaptiveTiming(500, INTENSITY.HIGH);
      expect(quickTiming).toBeCloseTo(
        TEST_CONFIG.EXPECTED.TIMING_065,
        TEST_TOLERANCE.TIMING
      ); // More tolerance for calculation variance

      // Slow interaction (2000ms, low intensity)
      const slowTiming = engine.calculateAdaptiveTiming(2000, INTENSITY.LOW);
      expect(slowTiming).toBeCloseTo(
        TEST_CONFIG.EXPECTED.TIMING_18,
        TEST_TOLERANCE.PERFORMANCE
      ); // More tolerance for calculation variance
    });

    it('should calculate momentum decay', () => {
      engine.setConfig({ momentumDamping: TEST_CONFIG.DAMPING.MEDIUM });

      const velocity1 = engine.calculateMomentumDecay(100, 1);
      const velocity2 = engine.calculateMomentumDecay(100, 2);

      expect(velocity1).toBeCloseTo(TEST_CONFIG.EXPECTED.VELOCITY_80); // 100 * 0.8^1
      expect(velocity2).toBeCloseTo(TEST_CONFIG.EXPECTED.VELOCITY_64); // 100 * 0.8^2
    });

    it('should calculate spring force', () => {
      const force1 = engine.calculateSpringForce(10, INTENSITY.VERY_LOW);
      const force2 = engine.calculateSpringForce(
        -5,
        INTENSITY.VERY_LOW
      );

      expect(force1).toBe(TEST_CONFIG.EXPECTED.FORCE_NEG_1); // -10 * 0.1
      expect(force2).toBe(TEST_CONFIG.EXPECTED.FORCE_05); // -(-5) * 0.1
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty sprite array transition', () => {
      const sequence = engine.calculateTransition(0, 0, 0);

      expect(sequence.hideSprites).toEqual([]);
      assertAnimationSequenceValid(sequence, 0);
    });

    it('should handle single sprite transition', () => {
      const sequence = engine.calculateTransition(
        0,
        0,
        TEST_SPRITE_COUNTS.minimal
      );

      expect(sequence.hideSprites).toEqual([]);
      expect(sequence.sourceSprite).toBeUndefined();
      assertAnimationSequenceValid(sequence, 0);
    });

    it('should handle zero intensity swipe', () => {
      const animation = engine.calculateSwipe(
        TEST_DIRECTIONS.right,
        TEST_INTENSITIES.zero
      );

      assertSwipeAnimationValid(animation);
      expect(animation.initialPhase.movement).toBe(0);
      expect(animation.initialPhase.scale).toBe(1);
      expect(Math.abs(animation.springPhase.movement)).toBe(0); // Handle -0 vs 0
    });

    it('should handle maximum intensity swipe', () => {
      const animation = engine.calculateSwipe(
        TEST_DIRECTIONS.right,
        TEST_INTENSITIES.max
      );

      assertSwipeAnimationValid(animation);
      expect(animation.initialPhase.movement).toBe(100);
      expect(animation.springPhase.movement).toBe(-85);
    });
  });
});
