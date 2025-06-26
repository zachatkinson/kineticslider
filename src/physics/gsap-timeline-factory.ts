/**
 * @fileoverview GSAPTimelineFactory - Reusable GSAP timeline patterns
 *
 * Extracted from main branch AnimationCoordinator.ts and useSlides.ts patterns.
 * DRY principle implementation for common GSAP timeline creation patterns.
 * Provides consistent animation configuration and behavior.
 *
 * @version 1.0.0
 */

import { gsap } from 'gsap';
import type { Sprite } from 'pixi.js';
import {
  ANIMATION_DURATION,
  EASING,
  SCALE,
  PHYSICS,
  GSAP_DEFAULTS,
} from '../core/constants';
import {
  getBaseScale,
  applyUniformScale,
  calculateDragScaleFactor,
} from '../core/sprite-helpers';

/**
 * Configuration for slide transitions
 * Pattern from main branch useSlides.ts performTransition
 */
export interface TransitionConfig {
  /** Source slide index */
  fromIndex: number;
  /** Target slide index */
  toIndex: number;
  /** Scale intensity for transition */
  scaleIntensity: number;
  /** Animation duration */
  duration: number;
  /** Animation easing */
  ease: string;
  /** Callback when transition starts */
  onStart?: () => void;
  /** Callback when transition completes */
  onComplete?: () => void;
}

/**
 * Configuration for momentum animations
 * Pattern from main branch useMouseDrag.ts momentum handling
 */
export interface MomentumConfig {
  /** Initial velocity */
  velocity: number;
  /** Momentum direction */
  direction: number;
  /** Animation duration */
  duration: number;
  /** Damping factor */
  damping: number;
  /** Callback when animation completes */
  onComplete?: () => void;
}

/**
 * Configuration for snap animations
 * Pattern from main branch slide positioning
 */
export interface SnapConfig {
  /** Target position */
  targetPosition: number;
  /** Snap duration */
  duration: number;
  /** Animation easing */
  ease: string;
  /** Callback when snap completes */
  onComplete?: () => void;
}

/**
 * Configuration for scale animations
 * Pattern from main branch drag scale effects
 */
export interface ScaleConfig {
  /** Target scale value */
  targetScale: number;
  /** Base scale reference */
  baseScale: number;
  /** Animation duration */
  duration: number;
  /** Animation easing */
  ease: string;
  /** Callback when animation completes */
  onComplete?: () => void;
}

/**
 * Factory for creating reusable GSAP timeline patterns
 * 
 * Based on patterns from:
 * - AnimationCoordinator.ts: timeline grouping and coordination
 * - useSlides.ts: slide transition animations
 * - useMouseDrag.ts: drag and reset animations
 */
export class GSAPTimelineFactory {
  /**
   * Create a slide transition timeline
   * Pattern from main branch useSlides.ts performTransition
   */
  static createSlideTransition(
    currentSlide: Sprite,
    nextSlide: Sprite,
    config: TransitionConfig
  ): gsap.core.Timeline {
    const timeline = gsap.timeline({
      ...GSAP_DEFAULTS.TIMELINE,
      onStart: config.onStart,
      onComplete: config.onComplete,
    });

    // Calculate scale multiplier from main branch pattern
    const scaleMultiplier = 1 + config.scaleIntensity / 100;

    // Ensure both sprites are visible during transition
    currentSlide.visible = true;
    nextSlide.visible = true;

    // Set initial states using sprite helpers
    nextSlide.alpha = 0;
    const currentBaseScale = getBaseScale(currentSlide);
    const nextBaseScale = getBaseScale(nextSlide);
    
    // Set initial scale for next slide using helper
    applyUniformScale(nextSlide, nextBaseScale * scaleMultiplier);

    // Create slide out animations
    timeline.to(currentSlide.scale, {
      x: currentBaseScale * scaleMultiplier,
      y: currentBaseScale * scaleMultiplier,
      duration: config.duration,
      ease: config.ease,
    }, 0);

    timeline.to(currentSlide, {
      alpha: 0,
      duration: config.duration,
      ease: config.ease,
      onComplete: () => {
        // Hide after transition completes
        currentSlide.visible = false;
      },
    }, 0);

    // Create slide in animations
    timeline.to(nextSlide.scale, {
      x: nextBaseScale,
      y: nextBaseScale,
      duration: config.duration,
      ease: config.ease,
    }, 0);

    timeline.to(nextSlide, {
      alpha: 1,
      duration: config.duration,
      ease: config.ease,
    }, 0);

    return timeline;
  }

  /**
   * Create a momentum animation timeline
   * Pattern from main branch momentum calculations
   */
  static createMomentumAnimation(
    sprite: Sprite,
    config: MomentumConfig
  ): gsap.core.Timeline {
    const timeline = gsap.timeline({
      ...GSAP_DEFAULTS.PERFORMANCE,
      onComplete: config.onComplete,
    });

    // Calculate momentum distance
    const momentumDistance = config.velocity * config.direction * config.duration;
    
    // Apply momentum decay over time
    const decayFactor = Math.pow(config.damping, config.duration);
    const finalDistance = momentumDistance * decayFactor;

    timeline.to(sprite, {
      x: `+=${finalDistance}`,
      duration: config.duration,
      ease: EASING.EASE_OUT,
    });

    return timeline;
  }

  /**
   * Create a snap animation timeline
   * Pattern from main branch slide snapping
   */
  static createSnapAnimation(
    sprite: Sprite,
    config: SnapConfig
  ): gsap.core.Timeline {
    const timeline = gsap.timeline({
      ...GSAP_DEFAULTS.TIMELINE,
      onComplete: config.onComplete,
    });

    timeline.to(sprite, {
      x: config.targetPosition,
      duration: config.duration,
      ease: config.ease,
    });

    return timeline;
  }

  /**
   * Create a scale animation timeline
   * Pattern from main branch drag scale effects
   */
  static createScaleAnimation(
    sprite: Sprite,
    config: ScaleConfig
  ): gsap.core.Timeline {
    const timeline = gsap.timeline({
      ...GSAP_DEFAULTS.PERFORMANCE,
      onComplete: config.onComplete,
    });

    const targetScale = config.targetScale * config.baseScale;

    timeline.to(sprite.scale, {
      x: targetScale,
      y: targetScale,
      duration: config.duration,
      ease: config.ease,
    });

    return timeline;
  }

  /**
   * Create a drag effect timeline
   * Pattern from main branch useMouseDrag.ts handleDragEffect
   */
  static createDragEffect(
    sprite: Sprite,
    dragDistance: number,
    scaleIntensity: number = PHYSICS.MOMENTUM_DAMPING
  ): gsap.core.Timeline {
    const timeline = gsap.timeline(GSAP_DEFAULTS.PERFORMANCE);

    const baseScale = getBaseScale(sprite);
    const scaleFactor = calculateDragScaleFactor(
      dragDistance, 
      PHYSICS.DISTANCE_NORMALIZATION, 
      scaleIntensity
    );
    const newScale = baseScale * scaleFactor;

    timeline.to(sprite.scale, {
      x: newScale,
      y: newScale,
      duration: ANIMATION_DURATION.QUICK,
      ease: EASING.EASE_OUT,
    });

    return timeline;
  }

  /**
   * Create a scale reset timeline
   * Pattern from main branch useMouseDrag.ts resetSlideScale
   */
  static createScaleReset(
    sprite: Sprite,
    targetScale: number = SCALE.DEFAULT
  ): gsap.core.Timeline {
    const timeline = gsap.timeline(GSAP_DEFAULTS.PERFORMANCE);

    const baseScale = getBaseScale(sprite);
    const finalScale = baseScale * targetScale;

    timeline.to(sprite.scale, {
      x: finalScale,
      y: finalScale,
      duration: ANIMATION_DURATION.FAST,
      ease: EASING.EASE_OUT,
    });

    return timeline;
  }

  /**
   * Create a coordinated animation group
   * Pattern from main branch AnimationCoordinator.ts
   */
  static createAnimationGroup(
    animations: gsap.core.Tween[],
    options: {
      onStart?: () => void;
      onComplete?: () => void;
      delay?: number;
    } = {}
  ): gsap.core.Timeline {
    const timeline = gsap.timeline({
      ...GSAP_DEFAULTS.TIMELINE,
      delay: options.delay || 0,
      onStart: options.onStart,
      onComplete: options.onComplete,
    });

    // Add all animations to start simultaneously
    animations.forEach((animation) => {
      timeline.add(animation, 0);
    });

    return timeline;
  }

  /**
   * Create a staggered animation timeline
   * Enhanced pattern for sequential animations
   */
  static createStaggeredAnimation(
    sprites: Sprite[],
    animationConfig: (sprite: Sprite, index: number) => gsap.core.Tween,
    staggerDelay: number = 0.1
  ): gsap.core.Timeline {
    const timeline = gsap.timeline(GSAP_DEFAULTS.TIMELINE);

    sprites.forEach((sprite, index) => {
      const animation = animationConfig(sprite, index);
      timeline.add(animation, index * staggerDelay);
    });

    return timeline;
  }

  /**
   * Create a fade transition timeline
   * Simple fade pattern for lightweight transitions
   */
  static createFadeTransition(
    fromSprite: Sprite,
    toSprite: Sprite,
    duration: number = ANIMATION_DURATION.STANDARD
  ): gsap.core.Timeline {
    const timeline = gsap.timeline(GSAP_DEFAULTS.TIMELINE);

    // Ensure both sprites are visible
    fromSprite.visible = true;
    toSprite.visible = true;
    toSprite.alpha = 0;

    // Fade out current, fade in next
    timeline.to(fromSprite, {
      alpha: 0,
      duration,
      ease: EASING.EASE_OUT,
      onComplete: () => {
        fromSprite.visible = false;
      },
    }, 0);

    timeline.to(toSprite, {
      alpha: 1,
      duration,
      ease: EASING.EASE_OUT,
    }, 0);

    return timeline;
  }

  /**
   * Create a master timeline with cleanup
   * Pattern from main branch resource management
   */
  static createManagedTimeline(
    childTimelines: gsap.core.Timeline[],
    onComplete?: () => void
  ): gsap.core.Timeline {
    const masterTimeline = gsap.timeline({
      ...GSAP_DEFAULTS.TIMELINE,
      onComplete: () => {
        // Cleanup child timelines
        childTimelines.forEach((timeline) => {
          if (timeline && timeline.isActive()) {
            timeline.kill();
          }
        });
        
        if (onComplete) {
          onComplete();
        }
      },
    });

    // Add all child timelines
    childTimelines.forEach((timeline) => {
      masterTimeline.add(timeline, 0);
    });

    return masterTimeline;
  }
} 