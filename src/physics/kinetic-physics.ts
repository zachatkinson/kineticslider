/**
 * @fileoverview KineticPhysics - Pure momentum and kinetic calculations
 *
 * Extracted from main branch useSlides.ts and useMouseDrag.ts patterns.
 * Pure mathematical functions for momentum, velocity, and kinetic physics.
 * No side effects - easy to test and reason about.
 *
 * @version 1.0.0
 */

import {
  PHYSICS,
  ANIMATION_DURATION,
  SCALE,
  INTENSITY,
  INPUT,
  EASING,
} from '../core/constants';

/**
 * Configuration for kinetic physics calculations
 */
export interface KineticPhysicsConfig {
  /** Friction coefficient for momentum decay */
  friction: number;
  /** Scale intensity multiplier */
  scaleIntensity: number;
  /** Velocity threshold for motion detection */
  velocityThreshold: number;
  /** Maximum allowed velocity */
  maxVelocity: number;
  /** Swipe distance threshold */
  swipeThreshold: number;
}

/**
 * Result of momentum calculation
 */
export interface MomentumResult {
  /** Final velocity after applying physics */
  velocity: number;
  /** Distance traveled */
  distance: number;
  /** Duration of the motion */
  duration: number;
  /** Scale factor to apply */
  scaleFactor: number;
}

/**
 * Result of snap position calculation
 */
export interface SnapResult {
  /** Target position to snap to */
  targetPosition: number;
  /** Distance to travel */
  snapDistance: number;
  /** Recommended animation duration */
  duration: number;
}

/**
 * Pure kinetic physics calculations extracted from main branch
 * 
 * Based on patterns from:
 * - useMouseDrag.ts: drag momentum and scale calculations
 * - useSlides.ts: transition scale intensity and velocity
 * - Physics constants: friction, damping, velocity thresholds
 */
export class KineticPhysics {
  private config: KineticPhysicsConfig;

  constructor(config: Partial<KineticPhysicsConfig> = {}) {
    this.config = {
      friction: PHYSICS.FRICTION,
      scaleIntensity: INTENSITY.VERY_LOW,
      velocityThreshold: PHYSICS.VELOCITY_THRESHOLD,
      maxVelocity: PHYSICS.MAX_VELOCITY,
      swipeThreshold: INPUT.SWIPE_THRESHOLD,
      ...config,
    };
  }

  /**
   * Calculate velocity based on distance and time
   * Pattern from main branch useMouseDrag.ts throttling
   */
  static calculateVelocity(distance: number, time: number): number {
    if (time <= 0) return 0;
    return Math.abs(distance / time);
  }

  /**
   * Apply friction to reduce velocity over time
   * Pattern from main branch momentum calculations
   */
  static applyFriction(velocity: number, friction: number): number {
    return velocity * (1 - friction);
  }

  /**
   * Calculate snap position for slide alignment
   * Pattern from main branch slide positioning logic
   */
  static calculateSnapPosition(
    position: number,
    slideWidth: number
  ): SnapResult {
    // Find the nearest slide position
    const slideIndex = Math.round(position / slideWidth);
    const targetPosition = slideIndex * slideWidth;
    const snapDistance = Math.abs(targetPosition - position);
    
    // Calculate duration based on distance (further = longer)
    const baseDuration = ANIMATION_DURATION.STANDARD;
    const distanceFactor = Math.min(snapDistance / slideWidth, 1);
    const duration = baseDuration * (
      PHYSICS.DURATION_FACTORS.MIN_OFFSET + 
      distanceFactor * PHYSICS.DURATION_FACTORS.MAX_OFFSET
    );

    return {
      targetPosition,
      snapDistance,
      duration,
    };
  }

  /**
   * Calculate momentum physics for drag interactions
   * Pattern from main branch useMouseDrag.ts drag effects
   */
  calculateMomentum(
    initialVelocity: number,
    dragDistance: number,
    timeDelta: number
  ): MomentumResult {
    // Clamp velocity to maximum
    const clampedVelocity = Math.min(
      Math.abs(initialVelocity),
      this.config.maxVelocity
    );

    // Apply friction over time
    const friction = this.config.friction * (timeDelta / 1000);
    const finalVelocity = KineticPhysics.applyFriction(clampedVelocity, friction);

    // Calculate distance traveled
    const distance = finalVelocity * timeDelta;

    // Calculate scale factor based on momentum
    const normalizedDistance = Math.min(
      Math.abs(dragDistance) / this.config.swipeThreshold,
      1
    );
    const scaleFactor = 1 + normalizedDistance * this.config.scaleIntensity;

    // Duration based on velocity (faster = shorter)
    const velocityFactor = Math.max(0.1, finalVelocity / this.config.maxVelocity);
    const duration = ANIMATION_DURATION.FAST / velocityFactor;

    return {
      velocity: finalVelocity,
      distance,
      duration: Math.min(duration, ANIMATION_DURATION.SLOW),
      scaleFactor,
    };
  }

  /**
   * Calculate scale intensity for drag interactions
   * Pattern from main branch useMouseDrag.ts handleDragEffect
   */
  calculateDragScale(
    dragDistance: number,
    baseScale: number = SCALE.DEFAULT
  ): number {
    // Normalize drag distance to 0-1 range
    const normalizedFactor = Math.min(
      Math.abs(dragDistance) / this.config.swipeThreshold,
      1
    );

    // Apply scale intensity
    const scaleMultiplier = 1 + normalizedFactor * this.config.scaleIntensity;
    
    return baseScale * scaleMultiplier;
  }

  /**
   * Determine if swipe meets threshold for slide change
   * Pattern from main branch swipe detection logic
   */
  shouldTriggerSlideChange(
    distance: number,
    velocity: number
  ): boolean {
    const meetsDistanceThreshold = Math.abs(distance) >= this.config.swipeThreshold;
    const meetsVelocityThreshold = velocity >= this.config.velocityThreshold;
    
    return meetsDistanceThreshold || meetsVelocityThreshold;
  }

  /**
   * Calculate spring physics for reset animations
   * Pattern from main branch scale reset animations
   */
  calculateSpringReset(
    currentScale: number,
    targetScale: number = SCALE.DEFAULT
  ): { scaleDelta: number; duration: number; ease: string } {
    const scaleDelta = Math.abs(currentScale - targetScale);
    
    // Longer duration for larger scale differences
    const durationMultiplier = Math.min(scaleDelta / SCALE.EMPHASIS, 1);
    const duration = ANIMATION_DURATION.FAST + 
                    (durationMultiplier * ANIMATION_DURATION.FAST);

    return {
      scaleDelta,
      duration: Math.min(duration, ANIMATION_DURATION.MEDIUM),
      ease: EASING.EASE_OUT, // Use constant instead of hardcoded string
    };
  }

  /**
   * Update physics configuration
   */
  updateConfig(config: Partial<KineticPhysicsConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current physics configuration
   */
  getConfig(): KineticPhysicsConfig {
    return { ...this.config };
  }

  /**
   * Reset physics configuration to defaults
   */
  resetConfig(): void {
    this.config = {
      friction: PHYSICS.FRICTION,
      scaleIntensity: INTENSITY.VERY_LOW,
      velocityThreshold: PHYSICS.VELOCITY_THRESHOLD,
      maxVelocity: PHYSICS.MAX_VELOCITY,
      swipeThreshold: INPUT.SWIPE_THRESHOLD,
    };
  }
} 