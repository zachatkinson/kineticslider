/**
 * @fileoverview Pure Physics Engine
 *
 * Pure calculation engine for slider physics - no external dependencies.
 * Handles all mathematical calculations for transitions, swipes, and scaling.
 *
 * This follows best practices by separating business logic from rendering concerns.
 * Unit testable with simple inputs and outputs.
 */

import type { PhysicsConfig } from '../core/types';
import {
  ANIMATION_DURATION,
  EASING,
  PHYSICS,
  SCALE,
  INTENSITY,
  DEFAULT_PHYSICS_CONFIG,
  TEST_CONFIG,
} from '../core';

/**
 * Animation sequence data structure
 */
export interface AnimationSequence {
  /** Sprites to hide */
  hideSprites: number[];
  /** Target sprite configuration */
  targetSprite: {
    index: number;
    initialState: {
      visible: boolean;
      alpha: number;
      scale: number;
    };
    finalState: {
      alpha: number;
      scale: number;
    };
    duration: number;
    ease: string;
  };
  /** Source sprite exit animation (if applicable) */
  sourceSprite?: {
    index: number;
    finalState: {
      alpha: number;
      scale: number;
      visible: boolean;
    };
    duration: number;
    ease: string;
  };
}

/**
 * Swipe animation data structure
 */
export interface SwipeAnimation {
  /** Initial movement phase */
  initialPhase: {
    movement: number;
    scale: number;
    duration: number;
  };
  /** Spring back phase */
  springPhase: {
    movement: number;
    scale: number;
    duration: number;
    ease: string;
  };
}

/**
 * Scale animation data structure
 */
export interface ScaleAnimation {
  targetScale: number;
  duration: number;
  ease: string;
}

/**
 * Pure physics calculation engine
 *
 * Handles all mathematical computations for slider animations.
 * No external dependencies - pure functions that can be easily unit tested.
 */
export class SliderPhysicsEngine {
  private config: PhysicsConfig = DEFAULT_PHYSICS_CONFIG;

  /**
   * Calculate transition animation sequence
   *
   * @param fromIndex - Source slide index
   * @param toIndex - Target slide index
   * @param totalSprites - Total number of sprites
   * @returns Animation sequence configuration
   */
  calculateTransition(
    fromIndex: number,
    toIndex: number,
    totalSprites: number
  ): AnimationSequence {
    // Calculate which sprites to hide (all except target)
    const hideSprites = Array.from(
      { length: totalSprites },
      (_, i) => i
    ).filter((i) => i !== toIndex);

    const sequence: AnimationSequence = {
      hideSprites,
      targetSprite: {
        index: toIndex,
        initialState: {
          visible: true,
          alpha: 0,
          scale: SCALE.HIGHLIGHT, // Start slightly larger for smooth scale-in effect
        },
        finalState: {
          alpha: 1,
          scale: SCALE.DEFAULT,
        },
        duration: this.config.transitionDuration,
        ease: this.config.transitionEase,
      },
    };

    // Add source sprite exit animation if different from target
    if (fromIndex !== toIndex && fromIndex >= 0 && fromIndex < totalSprites) {
      sequence.sourceSprite = {
        index: fromIndex,
        finalState: {
          alpha: 0,
          scale: SCALE.EXIT, // Scale down for smooth exit
          visible: false,
        },
        duration: this.config.transitionDuration * PHYSICS.EXIT_SPEED_FACTOR, // Slightly faster fade out
        ease: EASING.EASE_IN,
      };
    }

    return sequence;
  }

  /**
   * Calculate swipe animation parameters
   *
   * @param direction - Swipe direction (-1 or 1)
   * @param intensity - Swipe intensity (0-1)
   * @returns Swipe animation configuration
   */
  calculateSwipe(direction: number, intensity: number): SwipeAnimation {
    // Clamp intensity to valid range
    const clampedIntensity = Math.max(0, Math.min(1, intensity));

    // Calculate movement based on direction and intensity
    const moveDistance =
      direction * clampedIntensity * TEST_CONFIG.CALCULATION.MOVEMENT_BASE;
    const scaleFactor = 1 + clampedIntensity * this.config.scaleIntensity;

    return {
      initialPhase: {
        movement: moveDistance,
        scale: scaleFactor,
        duration: ANIMATION_DURATION.FAST,
      },
      springPhase: {
        movement: -moveDistance * this.config.momentumDamping,
        scale: SCALE.DEFAULT,
        duration: this.config.transitionDuration,
        ease: EASING.ELASTIC,
      },
    };
  }

  /**
   * Calculate scale animation parameters
   *
   * @param targetScale - Target scale value
   * @param duration - Animation duration (optional)
   * @returns Scale animation configuration
   */
  calculateScale(
    targetScale: number,
    duration = ANIMATION_DURATION.STANDARD
  ): ScaleAnimation {
    return {
      targetScale: Math.max(SCALE.MIN, targetScale), // Prevent negative or zero scale
      duration: Math.max(PHYSICS.MIN_DURATION, duration), // Minimum duration for smooth animation
      ease: EASING.EASE_OUT,
    };
  }

  /**
   * Calculate if swipe exceeds threshold for slide change
   *
   * @param distance - Swipe distance in pixels
   * @param velocity - Swipe velocity
   * @returns Whether swipe should trigger slide change
   */
  shouldTriggerSlideChange(distance: number, velocity: number): boolean {
    const distanceThreshold = this.config.swipeThreshold;
    const velocityThreshold = PHYSICS.VELOCITY_THRESHOLD; // pixels per millisecond

    return (
      Math.abs(distance) > distanceThreshold ||
      Math.abs(velocity) > velocityThreshold
    );
  }

  /**
   * Calculate optimal animation timing based on user interaction
   *
   * @param interactionTime - Time user spent interacting (ms)
   * @param intensity - Interaction intensity (0-1)
   * @returns Optimized animation duration
   */
  calculateAdaptiveTiming(interactionTime: number, intensity: number): number {
    // Faster animations for quick interactions, slower for deliberate ones
    const baseTime = this.config.transitionDuration;
    const timeFactor = Math.max(
      PHYSICS.TIME_FACTOR.MIN,
      Math.min(PHYSICS.TIME_FACTOR.MAX, interactionTime / 1000)
    );
    const intensityFactor = SCALE.DEFAULT + intensity * INTENSITY.VERY_LOW;

    return baseTime * timeFactor * intensityFactor;
  }

  /**
   * Update physics configuration
   */
  setConfig(config: Partial<PhysicsConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current physics configuration
   */
  getConfig(): PhysicsConfig {
    return { ...this.config };
  }

  /**
   * Calculate momentum decay for natural motion
   *
   * @param initialVelocity - Starting velocity
   * @param timeStep - Time step for calculation
   * @returns Velocity after decay
   */
  calculateMomentumDecay(initialVelocity: number, timeStep: number): number {
    return initialVelocity * Math.pow(this.config.momentumDamping, timeStep);
  }

  /**
   * Calculate spring force for elastic animations
   *
   * @param displacement - Current displacement from rest position
   * @param springConstant - Spring strength (0-1)
   * @returns Spring force value
   */
  calculateSpringForce(
    displacement: number,
    springConstant = PHYSICS.SPRING_CONSTANT
  ): number {
    return -displacement * springConstant;
  }
}
