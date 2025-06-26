/**
 * @fileoverview SpringPhysics - GSAP spring-based interactions
 *
 * Extracted from main branch useDisplacementEffects.ts and useMouseDrag.ts patterns.
 * Handles spring-based animations, displacement effects, and elastic interactions.
 * Provides natural physics-based motion with GSAP integration.
 *
 * @version 1.0.0
 */

import { gsap } from 'gsap';
import type { Sprite, DisplacementFilter } from 'pixi.js';
import {
  ANIMATION_DURATION,
  EASING,
  PHYSICS,
  SCALE,
  GSAP_DEFAULTS,
} from '../core/constants';
import {
  getBaseScale,
  calculateFinalScale,
} from '../core/sprite-helpers';

/**
 * Configuration for spring animations
 * Pattern from main branch spring reset animations
 */
export interface SpringConfig {
  /** Spring constant (0-1, higher = stiffer) */
  springConstant: number;
  /** Damping factor (0-1, higher = more damping) */
  damping: number;
  /** Animation duration */
  duration: number;
  /** Spring easing curve */
  ease: string;
}

/**
 * Configuration for displacement effects
 * Pattern from main branch useDisplacementEffects.ts
 */
export interface DisplacementConfig {
  /** Background filter scale */
  backgroundScale: number;
  /** Cursor filter scale */
  cursorScale: number;
  /** Effect intensity */
  intensity: number;
  /** Animation duration */
  duration: number;
}

/**
 * Result of spring calculation
 */
export interface SpringResult {
  /** Target position */
  targetPosition: number;
  /** Spring force */
  force: number;
  /** Animation duration */
  duration: number;
  /** Recommended easing */
  ease: string;
}

/**
 * GSAP spring-based physics interactions
 * 
 * Based on patterns from:
 * - useDisplacementEffects.ts: filter scale animations and spring effects
 * - useMouseDrag.ts: spring reset animations and elastic behavior
 * - AnimationCoordinator.ts: spring-based animation coordination
 */
export class SpringPhysics {
  private config: SpringConfig;

  constructor(config: Partial<SpringConfig> = {}) {
    this.config = {
      springConstant: PHYSICS.SPRING_CONSTANT,
      damping: PHYSICS.MOMENTUM_DAMPING,
      duration: ANIMATION_DURATION.STANDARD,
      ease: EASING.ELASTIC,
      ...config,
    };
  }

  /**
   * Calculate spring force for elastic motion
   * Pattern from main branch spring physics calculations
   */
  static calculateSpringForce(
    displacement: number,
    springConstant: number = PHYSICS.SPRING_CONSTANT
  ): number {
    return -displacement * springConstant;
  }

  /**
   * Calculate elastic motion parameters
   * Pattern from main branch elastic animations
   */
  calculateElasticMotion(
    currentPosition: number,
    targetPosition: number,
    velocity: number = 0
  ): SpringResult {
    const displacement = currentPosition - targetPosition;
    const force = SpringPhysics.calculateSpringForce(displacement, this.config.springConstant);
    
    // Calculate duration based on displacement and spring constant
    const distanceFactor = Math.min(
      Math.abs(displacement) / PHYSICS.DISTANCE_NORMALIZATION, 
      1
    );
    const springFactor = 1 / Math.max(this.config.springConstant, PHYSICS.SPRING_MIN_CONSTANT);
    const duration = this.config.duration * distanceFactor * springFactor;

    return {
      targetPosition,
      force,
      duration: Math.min(duration, ANIMATION_DURATION.VERY_SLOW),
      ease: this.config.ease,
    };
  }

  /**
   * Create a spring animation timeline
   * Pattern from main branch elastic reset animations
   */
  createSpringAnimation(
    sprite: Sprite,
    targetX: number,
    targetY: number,
    options: Partial<SpringConfig> = {}
  ): gsap.core.Timeline {
    const timeline = gsap.timeline(GSAP_DEFAULTS.PERFORMANCE);

    const springConfig = { ...this.config, ...options };
    
    // Calculate spring motion for both axes
    const springX = this.calculateElasticMotion(sprite.x, targetX);
    const springY = this.calculateElasticMotion(sprite.y, targetY);

    // Use the longer duration for consistent motion
    const duration = Math.max(springX.duration, springY.duration);

    timeline.to(sprite, {
      x: targetX,
      y: targetY,
      duration,
      ease: springConfig.ease,
    });

    return timeline;
  }

  /**
   * Create a scale spring animation
   * Pattern from main branch scale reset with elastic behavior
   */
  createScaleSpring(
    sprite: Sprite,
    targetScale: number = SCALE.DEFAULT,
    options: Partial<SpringConfig> = {}
  ): gsap.core.Timeline {
    const timeline = gsap.timeline(GSAP_DEFAULTS.PERFORMANCE);

    const springConfig = { ...this.config, ...options };
    const finalScale = calculateFinalScale(sprite, targetScale);

    // Calculate spring parameters
    const currentScale = sprite.scale.x;
    const spring = this.calculateElasticMotion(currentScale, finalScale);

    timeline.to(sprite.scale, {
      x: finalScale,
      y: finalScale,
      duration: spring.duration,
      ease: springConfig.ease,
    });

    return timeline;
  }

  /**
   * Create displacement filter animation
   * Pattern from main branch useDisplacementEffects.ts
   */
  createDisplacementAnimation(
    filter: DisplacementFilter,
    config: DisplacementConfig
  ): gsap.core.Timeline {
    const timeline = gsap.timeline(GSAP_DEFAULTS.TIMELINE);

    // Animate filter scale with spring behavior
    timeline.to(filter.scale, {
      x: config.backgroundScale * config.intensity,
      y: config.backgroundScale * config.intensity,
      duration: config.duration,
      ease: EASING.ELASTIC,
    });

    return timeline;
  }

  /**
   * Create cursor follow effect with spring physics
   * Pattern from main branch cursor displacement effects
   */
  createCursorFollowEffect(
    sprite: Sprite,
    targetX: number,
    targetY: number,
    intensity: number = 1
  ): gsap.core.Timeline {
    const timeline = gsap.timeline(GSAP_DEFAULTS.PERFORMANCE);

    // Apply spring damping based on intensity
    const dampedIntensity = intensity * this.config.damping;
    const springDuration = this.config.duration * (
      1 - dampedIntensity * PHYSICS.DURATION_FACTORS.SPRING_DAMPING_FACTOR
    );

    timeline.to(sprite, {
      x: targetX,
      y: targetY,
      duration: springDuration,
      ease: EASING.CIRC,
    });

    return timeline;
  }

  /**
   * Create bouncy scale effect
   * Enhanced pattern for dramatic spring effects
   */
  createBouncyScale(
    sprite: Sprite,
    peakScale: number,
    finalScale: number = SCALE.DEFAULT,
    bounceCount: number = 2
  ): gsap.core.Timeline {
    const timeline = gsap.timeline(GSAP_DEFAULTS.TIMELINE);

    const baseScale = getBaseScale(sprite);
    const peakValue = baseScale * peakScale;
    const finalValue = baseScale * finalScale;

    // Create bouncing effect
    for (let i = 0; i < bounceCount; i++) {
      const bounceIntensity = 1 - (i / bounceCount);
      const bounceScale = finalValue + (peakValue - finalValue) * bounceIntensity;
      
      timeline.to(sprite.scale, {
        x: bounceScale,
        y: bounceScale,
        duration: this.config.duration / (bounceCount * 2),
        ease: EASING.BOUNCE,
      });
    }

    // Final settle
    timeline.to(sprite.scale, {
      x: finalValue,
      y: finalValue,
      duration: this.config.duration / 4,
      ease: EASING.EASE_OUT,
    });

    return timeline;
  }

  /**
   * Create wobble effect with spring physics
   * Pattern for organic, natural motion
   */
  createWobbleEffect(
    sprite: Sprite,
    amplitude: number = 5,
    frequency: number = 3
  ): gsap.core.Timeline {
    const timeline = gsap.timeline(GSAP_DEFAULTS.PERFORMANCE);

    const originalX = sprite.x;
    const originalY = sprite.y;

    // Create wobble motion
    for (let i = 0; i < frequency; i++) {
      const wobbleX = originalX + amplitude * Math.sin(i * Math.PI);
      const wobbleY = originalY + amplitude * Math.cos(i * Math.PI);
      
      timeline.to(sprite, {
        x: wobbleX,
        y: wobbleY,
        duration: this.config.duration / frequency,
        ease: EASING.EASE_IN_OUT,
      });
    }

    // Return to original position
    timeline.to(sprite, {
      x: originalX,
      y: originalY,
      duration: this.config.duration / 4,
      ease: this.config.ease,
    });

    return timeline;
  }

  /**
   * Create magnetic attraction effect
   * Enhanced pattern for interactive elements
   */
  createMagneticAttraction(
    sprite: Sprite,
    attractorX: number,
    attractorY: number,
    magneticForce: number = 0.5
  ): gsap.core.Timeline {
    const timeline = gsap.timeline(GSAP_DEFAULTS.PERFORMANCE);

    // Calculate magnetic force based on distance
    const deltaX = attractorX - sprite.x;
    const deltaY = attractorY - sprite.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Magnetic force decreases with distance
    const normalizedForce = magneticForce / Math.max(distance / PHYSICS.DISTANCE_NORMALIZATION, 1);
    
    // Apply spring physics to the attraction
    const attractionX = sprite.x + deltaX * normalizedForce;
    const attractionY = sprite.y + deltaY * normalizedForce;

    timeline.to(sprite, {
      x: attractionX,
      y: attractionY,
      duration: this.config.duration,
      ease: this.config.ease,
    });

    return timeline;
  }

  /**
   * Create ripple effect with spring physics
   * Pattern for impact and interaction feedback
   */
  createRippleEffect(
    sprites: Sprite[],
    centerX: number,
    centerY: number,
    maxRadius: number = 200
  ): gsap.core.Timeline {
    const timeline = gsap.timeline(GSAP_DEFAULTS.TIMELINE);

    sprites.forEach((sprite, index) => {
      // Calculate distance from center
      const deltaX = sprite.x - centerX;
      const deltaY = sprite.y - centerY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (distance <= maxRadius) {
        // Calculate ripple delay based on distance
        const delay = (distance / maxRadius) * this.config.duration;
        
        // Calculate ripple intensity (closer = stronger)
        const intensity = 1 - (distance / maxRadius);
        const pushDistance = 20 * intensity;

        // Normalize direction
        const directionX = deltaX / distance;
        const directionY = deltaY / distance;

        // Create push and return animation
        const pushX = sprite.x + directionX * pushDistance;
        const pushY = sprite.y + directionY * pushDistance;

        timeline.to(sprite, {
          x: pushX,
          y: pushY,
          duration: this.config.duration / 3,
          ease: EASING.EASE_OUT,
        }, delay);

        timeline.to(sprite, {
          x: sprite.x,
          y: sprite.y,
          duration: this.config.duration * 2 / 3,
          ease: this.config.ease,
        }, delay + this.config.duration / 3);
      }
    });

    return timeline;
  }

  /**
   * Update spring configuration
   */
  updateConfig(config: Partial<SpringConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current spring configuration
   */
  getConfig(): SpringConfig {
    return { ...this.config };
  }
} 