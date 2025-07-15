/**
 * @fileoverview GSAPPixiAdapter - Seamless GSAP + PIXI Coordination
 *
 * Core adapter class providing unified interface for animating PIXI objects with GSAP.
 * Implements clean architecture with proper dependency injection and separation of concerns.
 * Optimized for 60fps performance with GPU acceleration and memory efficiency.
 *
 * @version 1.0.0
 */

import { gsap } from 'gsap';
import { PixiPlugin } from 'gsap/PixiPlugin';
import { Sprite, Container, Filter } from 'pixi.js';

// Register GSAP PixiPlugin for PIXI.js object animation
// Only register in non-test environments to avoid mock issues
if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
  gsap.registerPlugin(PixiPlugin);
}
import type { AnimationConfig } from '../core/types';
import {
  GSAP_DEFAULTS,
  ANIMATION_DURATION,
  EASING,
  SCALE,
  RENDERING_PERFORMANCE,
} from '../core/constants';
import { getBaseScale } from '../core/sprite-helpers';

/**
 * Configuration for sprite animations
 */
export interface SpriteAnimationConfig extends AnimationConfig {
  /** Target position */
  x?: number;
  y?: number;
  /** Target scale */
  scale?: number;
  /** Target rotation in radians */
  rotation?: number;
  /** Target alpha opacity (0-1) */
  alpha?: number;
  /** Target visibility */
  visible?: boolean;
  /** Animation duration in seconds */
  duration?: number;
  /** GSAP easing function */
  ease?: string;
  /** Animation delay in seconds */
  delay?: number;
  /** Callback when animation starts */
  onStart?: () => void;
  /** Callback when animation completes */
  onComplete?: () => void;
  /** Callback when animation updates */
  onUpdate?: () => void;
}

/**
 * Configuration for container animations
 */
export interface ContainerAnimationConfig extends SpriteAnimationConfig {
  /** Whether to animate children recursively */
  animateChildren?: boolean;
  /** Stagger delay between child animations */
  staggerDelay?: number;
}

/**
 * Configuration for filter animations
 */
export interface FilterAnimationConfig extends AnimationConfig {
  /** Filter properties to animate */
  properties: Record<string, number>;
  /** Animation duration in seconds */
  duration?: number;
  /** GSAP easing function */
  ease?: string;
  /** Animation delay in seconds */
  delay?: number;
  /** Callback when animation starts */
  onStart?: () => void;
  /** Callback when animation completes */
  onComplete?: () => void;
}

/**
 * Performance metrics for monitoring animation efficiency
 */
export interface AnimationPerformanceMetrics {
  /** Total number of active animations */
  activeAnimations: number;
  /** GPU memory usage in bytes */
  gpuMemoryUsage: number;
  /** Average FPS during animations */
  averageFPS: number;
  /** Timeline execution time in milliseconds */
  executionTime: number;
}

/**
 * GSAPPixiAdapter - Seamless GSAP + PIXI coordination
 *
 * Provides unified interface for animating PIXI objects with GSAP while maintaining
 * clean architecture principles and optimal performance.
 */
export class GSAPPixiAdapter {
  private activeTimelines: Map<string, gsap.core.Timeline> = new Map();
  private performanceMetrics: AnimationPerformanceMetrics;
  private animationIdCounter = 0;
  private disposed = false;

  constructor() {
    this.performanceMetrics = this.createDefaultMetrics();
  }

  /**
   * Animate PIXI sprite with optimized GSAP configuration
   *
   * @param sprite - PIXI sprite to animate
   * @param config - Animation configuration
   * @returns GSAP timeline for the animation
   */
  animateSprite(
    sprite: Sprite,
    config: SpriteAnimationConfig
  ): gsap.core.Timeline {
    const animationId = this.generateAnimationId();
    const timeline = gsap.timeline({
      ...GSAP_DEFAULTS.PERFORMANCE,
      onStart: () => {
        this.onAnimationStart(animationId);
        config.onStart?.();
      },
      onComplete: () => {
        this.onAnimationComplete(animationId);
        config.onComplete?.();
      },
      onUpdate: config.onUpdate,
    });

    // Build animation properties with proper defaults
    const animationProps = this.buildSpriteAnimationProps(sprite, config);

    // Create optimized animation with GPU acceleration
    timeline.to(sprite, {
      ...animationProps,
      duration: config.duration ?? ANIMATION_DURATION.STANDARD,
      ease: config.ease ?? EASING.EASE_OUT,
      delay: config.delay ?? 0,
      force3D: true,
      transformOrigin: 'center center',
    });

    // Track timeline for cleanup (only if not disposed)
    if (!this.disposed) {
      this.activeTimelines.set(animationId, timeline);
    }

    return timeline;
  }

  /**
   * Animate PIXI container with optional children animation
   *
   * @param container - PIXI container to animate
   * @param config - Container animation configuration
   * @returns GSAP timeline for the animation
   */
  animateContainer(
    container: Container,
    config: ContainerAnimationConfig
  ): gsap.core.Timeline {
    const animationId = this.generateAnimationId();
    const masterTimeline = gsap.timeline({
      ...GSAP_DEFAULTS.TIMELINE,
      onStart: () => {
        this.onAnimationStart(animationId);
        config.onStart?.();
      },
      onComplete: () => {
        this.onAnimationComplete(animationId);
        config.onComplete?.();
      },
    });

    // Animate container itself
    const containerProps = this.buildContainerAnimationProps(container, config);
    masterTimeline.to(container, {
      ...containerProps,
      duration: config.duration ?? ANIMATION_DURATION.STANDARD,
      ease: config.ease ?? EASING.EASE_OUT,
      delay: config.delay ?? 0,
      force3D: true,
    });

    // Animate children if requested
    if (config.animateChildren && container.children.length > 0) {
      const staggerDelay = config.staggerDelay ?? 0.1;

      container.children.forEach((child, index) => {
        if (child instanceof Sprite) {
          const childTimeline = this.animateSprite(child, {
            ...config,
            delay: (config.delay ?? 0) + index * staggerDelay,
            onStart: undefined, // Prevent duplicate callbacks
            onComplete: undefined,
          });

          masterTimeline.add(childTimeline, 0);
        }
      });
    }

    // Track timeline for cleanup
    this.activeTimelines.set(animationId, masterTimeline);

    return masterTimeline;
  }

  /**
   * Create displacement effect animation with GSAP
   *
   * @param sprite - PIXI sprite to apply displacement to
   * @param filter - PIXI filter to animate
   * @param config - Filter animation configuration
   * @returns GSAP timeline for the displacement effect
   */
  createDisplacementEffect(
    sprite: Sprite,
    filter: Filter,
    config: FilterAnimationConfig
  ): gsap.core.Timeline {
    const animationId = this.generateAnimationId();
    const timeline = gsap.timeline({
      ...GSAP_DEFAULTS.PERFORMANCE,
      onStart: () => {
        this.onAnimationStart(animationId);
        config.onStart?.();
      },
      onComplete: () => {
        this.onAnimationComplete(animationId);
        config.onComplete?.();
      },
    });

    // Apply filter to sprite if not already applied
    const filters = Array.isArray(sprite.filters)
      ? sprite.filters
      : sprite.filters
        ? [sprite.filters]
        : [];
    if (!filters.includes(filter)) {
      sprite.filters = [...filters, filter];
    }

    // Animate filter properties
    timeline.to(filter, {
      ...config.properties,
      duration: config.duration ?? ANIMATION_DURATION.MEDIUM,
      ease: config.ease ?? EASING.EASE_OUT,
      delay: config.delay ?? 0,
    });

    // Track timeline for cleanup (only if not disposed)
    if (!this.disposed) {
      this.activeTimelines.set(animationId, timeline);
    }

    return timeline;
  }

  /**
   * Create scale animation with proper base scale handling
   *
   * @param sprite - PIXI sprite to scale
   * @param targetScale - Target scale value
   * @param duration - Animation duration
   * @param ease - GSAP easing function
   * @returns GSAP timeline for the scale animation
   */
  createScaleAnimation(
    sprite: Sprite,
    targetScale: number = SCALE.DEFAULT,
    duration: number = ANIMATION_DURATION.FAST,
    ease: string = EASING.EASE_OUT
  ): gsap.core.Timeline {
    const animationId = this.generateAnimationId();
    const timeline = gsap.timeline({
      ...GSAP_DEFAULTS.PERFORMANCE,
      onStart: () => this.onAnimationStart(animationId),
      onComplete: () => this.onAnimationComplete(animationId),
    });

    const baseScale = getBaseScale(sprite);
    const finalScale = baseScale * targetScale;

    timeline.to(sprite.scale, {
      x: finalScale,
      y: finalScale,
      duration,
      ease,
      force3D: true,
    });

    this.activeTimelines.set(animationId, timeline);
    return timeline;
  }

  /**
   * Create fade transition between two sprites
   *
   * @param fromSprite - Source sprite to fade out
   * @param toSprite - Target sprite to fade in
   * @param duration - Transition duration
   * @returns GSAP timeline for the fade transition
   */
  createFadeTransition(
    fromSprite: Sprite,
    toSprite: Sprite,
    duration: number = ANIMATION_DURATION.STANDARD
  ): gsap.core.Timeline {
    const animationId = this.generateAnimationId();
    const timeline = gsap.timeline({
      ...GSAP_DEFAULTS.TIMELINE,
      onStart: () => this.onAnimationStart(animationId),
      onComplete: () => this.onAnimationComplete(animationId),
    });

    // Ensure both sprites are visible
    fromSprite.visible = true;
    toSprite.visible = true;
    toSprite.alpha = 0;

    // Fade out source, fade in target
    timeline.to(
      fromSprite,
      {
        alpha: 0,
        duration,
        ease: EASING.EASE_OUT,
        onComplete: () => {
          fromSprite.visible = false;
        },
      },
      0
    );

    timeline.to(
      toSprite,
      {
        alpha: 1,
        duration,
        ease: EASING.EASE_OUT,
      },
      0
    );

    this.activeTimelines.set(animationId, timeline);
    return timeline;
  }

  /**
   * Kill specific animation by ID
   *
   * @param animationId - Animation ID to kill
   */
  killAnimation(animationId: string): void {
    const timeline = this.activeTimelines.get(animationId);
    if (timeline) {
      timeline.kill();
      this.activeTimelines.delete(animationId);
      this.updatePerformanceMetrics();
    }
  }

  /**
   * Kill all active animations
   */
  killAllAnimations(): void {
    this.activeTimelines.forEach((timeline) => {
      timeline.kill();
    });
    this.activeTimelines.clear();
    this.updatePerformanceMetrics();
  }

  /**
   * Pause all active animations
   */
  pauseAllAnimations(): void {
    this.activeTimelines.forEach((timeline) => {
      timeline.pause();
    });
  }

  /**
   * Resume all paused animations
   */
  resumeAllAnimations(): void {
    this.activeTimelines.forEach((timeline) => {
      timeline.resume();
    });
  }

  /**
   * Get current performance metrics
   *
   * @returns Current animation performance metrics
   */
  getPerformanceMetrics(): AnimationPerformanceMetrics {
    this.updatePerformanceMetrics();
    return { ...this.performanceMetrics };
  }

  /**
   * Dispose of adapter and cleanup all resources
   */
  dispose(): void {
    this.disposed = true;
    this.killAllAnimations();
    this.performanceMetrics = this.createDefaultMetrics();
  }

  // =============================================================================
  // Private Helper Methods
  // =============================================================================

  /**
   * Generate unique animation ID
   */
  private generateAnimationId(): string {
    return `anim_${++this.animationIdCounter}_${Date.now()}`;
  }

  /**
   * Build sprite animation properties with proper validation
   */
  private buildSpriteAnimationProps(
    sprite: Sprite,
    config: SpriteAnimationConfig
  ): Record<string, unknown> {
    const props: Record<string, unknown> = {};

    // Position properties
    if (config.x !== undefined) props.x = config.x;
    if (config.y !== undefined) props.y = config.y;

    // Scale properties with base scale handling
    if (config.scale !== undefined) {
      const baseScale = getBaseScale(sprite);
      const targetScale = Math.max(
        SCALE.MIN,
        Math.min(SCALE.MAX, config.scale)
      );
      const finalScale = baseScale * targetScale;

      props.scaleX = finalScale;
      props.scaleY = finalScale;
    }

    // Rotation properties
    if (config.rotation !== undefined) {
      props.rotation = config.rotation;
    }

    // Alpha properties
    if (config.alpha !== undefined) {
      props.alpha = Math.max(0, Math.min(1, config.alpha));
    }

    // Visibility properties
    if (config.visible !== undefined) {
      props.visible = config.visible;
    }

    return props;
  }

  /**
   * Build container animation properties
   */
  private buildContainerAnimationProps(
    container: Container,
    config: ContainerAnimationConfig
  ): Record<string, unknown> {
    // Containers have same animatable properties as sprites
    return this.buildSpriteAnimationProps(
      container as unknown as Sprite,
      config
    );
  }

  /**
   * Handle animation start event
   */
  private onAnimationStart(_animationId: string): void {
    this.updatePerformanceMetrics();
  }

  /**
   * Handle animation complete event
   */
  private onAnimationComplete(animationId: string): void {
    this.activeTimelines.delete(animationId);
    this.updatePerformanceMetrics();
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(): void {
    const startTime = performance.now();

    this.performanceMetrics.activeAnimations = this.activeTimelines.size;

    // Estimate GPU memory usage (simplified calculation)
    this.performanceMetrics.gpuMemoryUsage = this.activeTimelines.size * 512; // 512B per animation

    // Calculate execution time
    this.performanceMetrics.executionTime = performance.now() - startTime;

    // FPS would be updated by external performance monitor
    // This is a placeholder for integration with existing performance monitoring
  }

  /**
   * Create default performance metrics
   */
  private createDefaultMetrics(): AnimationPerformanceMetrics {
    return {
      activeAnimations: 0,
      gpuMemoryUsage: 0,
      averageFPS: RENDERING_PERFORMANCE.WARNING_THRESHOLDS.FPS_LOW,
      executionTime: 0,
    };
  }
}
