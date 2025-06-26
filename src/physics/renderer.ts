/**
 * @fileoverview PIXI-Based Renderer with GSAP Integration
 *
 * This module provides a renderer that integrates PIXI.js for WebGL-accelerated
 * sprite rendering with GSAP for smooth, physics-based animations.
 *
 * Key Features:
 * - Hardware-accelerated PIXI.js rendering
 * - GSAP animation timeline management
 * - Blur and displacement filter effects
 * - Responsive scaling and positioning
 * - Memory-efficient resource management
 */

import { gsap } from 'gsap';
import type { Sprite } from 'pixi.js';
import type {
  AnimationSequence,
  SwipeAnimation,
  ScaleAnimation,
} from './engine';
import { GSAP_DEFAULTS, DOM_PROPERTIES, DATA_ATTRIBUTES } from '../core';

/**
 * PIXI integration renderer for slider animations
 *
 * Takes pure physics calculations and applies them to PIXI sprites using GSAP.
 * Manages timeline lifecycle and GPU optimization.
 */
export class PixiSliderRenderer {
  private activeTimelines: Set<gsap.core.Timeline> = new Set();
  private activeTweens: Set<gsap.core.Tween> = new Set();

  // GPU optimization defaults for smooth 60fps
  private readonly animationDefaults: gsap.TweenVars =
    GSAP_DEFAULTS.GPU_OPTIMIZED;

  /**
   * Apply transition animation sequence to PIXI sprites
   *
   * @param sprites - Array of PIXI sprites
   * @param sequence - Pure animation sequence from physics engine
   * @returns GSAP timeline for the animation
   */
  applyTransition(
    sprites: Sprite[],
    sequence: AnimationSequence
  ): gsap.core.Timeline {
    const timeline = this.createManagedTimeline();

    // Hide sprites that should be hidden
    sequence.hideSprites.forEach((index) => {
      const sprite = sprites.at(index);
      if (sprite) {
        timeline.set(sprite, { alpha: 0, visible: false }, 0);
      }
    });

    // Get target sprite
    const targetSprite = sprites.at(sequence.targetSprite.index);
    if (!targetSprite) return timeline;

    // Set initial state for target sprite
    timeline.set(
      targetSprite,
      {
        visible: sequence.targetSprite.initialState.visible,
        alpha: sequence.targetSprite.initialState.alpha,
        scale: sequence.targetSprite.initialState.scale,
      },
      0
    );

    // Animate target sprite to final state
    timeline.to(
      targetSprite,
      {
        ...this.animationDefaults,
        duration: sequence.targetSprite.duration,
        alpha: sequence.targetSprite.finalState.alpha,
        scale: sequence.targetSprite.finalState.scale,
        ease: sequence.targetSprite.ease,
      },
      0
    );

    // Handle source sprite exit animation if specified
    if (sequence.sourceSprite) {
      const sourceSprite = sprites.at(sequence.sourceSprite.index);
      if (sourceSprite) {
        timeline.to(
          sourceSprite,
          {
            ...this.animationDefaults,
            duration: sequence.sourceSprite.duration,
            alpha: sequence.sourceSprite.finalState.alpha,
            scale: sequence.sourceSprite.finalState.scale,
            ease: sequence.sourceSprite.ease,
            onComplete: () => {
              gsap.set(sourceSprite, {
                visible: sequence.sourceSprite!.finalState.visible,
              });
            },
          },
          0
        );
      }
    }

    return timeline;
  }

  /**
   * Apply swipe animation to PIXI sprite
   *
   * @param sprite - PIXI sprite to animate
   * @param animation - Pure swipe animation from physics engine
   * @returns GSAP timeline for the swipe animation
   */
  applySwipe(sprite: Sprite, animation: SwipeAnimation): gsap.core.Timeline {
    const timeline = this.createManagedTimeline();

    // Initial movement phase
    timeline.to(sprite, {
      ...this.animationDefaults,
      duration: animation.initialPhase.duration,
      x: `+=${animation.initialPhase.movement}`,
      scale: animation.initialPhase.scale,
    });

    // Spring back phase
    timeline.to(sprite, {
      ...this.animationDefaults,
      duration: animation.springPhase.duration,
      x: `+=${animation.springPhase.movement}`,
      scale: animation.springPhase.scale,
      ease: animation.springPhase.ease,
    });

    return timeline;
  }

  /**
   * Apply scale animation to PIXI sprite
   *
   * @param sprite - PIXI sprite to scale
   * @param animation - Pure scale animation from physics engine
   * @returns GSAP timeline for the scale animation
   */
  applyScale(sprite: Sprite, animation: ScaleAnimation): gsap.core.Timeline {
    const timeline = this.createManagedTimeline();

    timeline.to(sprite, {
      ...GSAP_DEFAULTS.PERFORMANCE,
      duration: animation.duration,
      scale: animation.targetScale,
      ease: animation.ease,
    });

    return timeline;
  }

  /**
   * Create optimized tween for GPU acceleration
   *
   * @param target - Animation target
   * @param props - Animation properties
   * @returns Optimized GSAP tween
   */
  createOptimizedTween(
    target: gsap.TweenTarget,
    props: gsap.TweenVars
  ): gsap.core.Tween {
    const tween = gsap.to(target, {
      ...this.animationDefaults,
      ...props,
      // GPU optimization
      onStart: () => {
        // Note: Can't use DOM_PROPERTIES.TYPE_OBJECT here due to TypeScript typeof constraint
        if (
          target &&
          typeof target === 'object' &&
          DOM_PROPERTIES.STYLE in target
        ) {
          (target as HTMLElement).style.willChange =
            DOM_PROPERTIES.WILL_CHANGE_TRANSFORM;
        }
      },
      onComplete: () => {
        // Note: Can't use DOM_PROPERTIES.TYPE_OBJECT here due to TypeScript typeof constraint
        if (
          target &&
          typeof target === 'object' &&
          DOM_PROPERTIES.STYLE in target
        ) {
          (target as HTMLElement).style.willChange =
            DOM_PROPERTIES.WILL_CHANGE_AUTO;
        }
        this.activeTweens.delete(tween);
        props.onComplete?.();
      },
    });

    this.activeTweens.add(tween);
    return tween;
  }

  /**
   * Apply batch animations to multiple sprites efficiently
   *
   * @param sprites - Array of sprites
   * @param animations - Array of animation properties
   * @returns GSAP timeline containing all animations
   */
  applyBatchAnimations(
    sprites: Sprite[],
    animations: Array<{ spriteIndex: number; props: gsap.TweenVars }>
  ): gsap.core.Timeline {
    const timeline = this.createManagedTimeline();

    animations.forEach(({ spriteIndex, props }) => {
      const sprite = sprites.at(spriteIndex);
      if (sprite) {
        timeline.to(
          sprite,
          {
            ...this.animationDefaults,
            ...props,
          },
          0
        ); // Start all animations at the same time
      }
    });

    return timeline;
  }

  /**
   * Kill all active animations immediately
   */
  killAllAnimations(): void {
    // Kill all managed timelines
    this.activeTimelines.forEach((timeline) => {
      timeline.kill();
    });
    this.activeTimelines.clear();

    // Kill all managed tweens
    this.activeTweens.forEach((tween) => {
      tween.kill();
    });
    this.activeTweens.clear();

    // Note: No DOM selector needed for PIXI sprites - they're handled by managed timelines/tweens
  }

  /**
   * Cleanup renderer resources
   */
  cleanup(): void {
    this.killAllAnimations();

    // Note: No DOM selector cleanup needed for PIXI sprites - they're JavaScript objects
  }

  /**
   * Get animation performance stats
   */
  getPerformanceStats(): {
    activeTimelines: number;
    activeTweens: number;
    totalAnimations: number;
  } {
    return {
      activeTimelines: this.activeTimelines.size,
      activeTweens: this.activeTweens.size,
      totalAnimations: this.activeTimelines.size + this.activeTweens.size,
    };
  }

  /**
   * Set sprites data attribute for GSAP targeting
   *
   * @param sprites - Array of sprites to mark
   */
  markSpritesForGSAP(sprites: Sprite[]): void {
    sprites.forEach((sprite, index) => {
      // Add data attribute for GSAP selector targeting
      // Note: Can't use DOM_PROPERTIES.TYPE_OBJECT here due to TypeScript typeof constraint
      if (sprite && typeof sprite === 'object') {
        (sprite as unknown as { [DATA_ATTRIBUTES.SLIDER_SPRITE]: boolean })[
          DATA_ATTRIBUTES.SLIDER_SPRITE
        ] = true;
        (sprite as unknown as { [DATA_ATTRIBUTES.SPRITE_INDEX]: number })[
          DATA_ATTRIBUTES.SPRITE_INDEX
        ] = index;
      }
    });
  }

  /**
   * Create managed timeline with automatic cleanup
   *
   * @returns GSAP timeline with cleanup management
   */
  private createManagedTimeline(): gsap.core.Timeline {
    const timeline = gsap.timeline({
      onComplete: () => {
        this.activeTimelines.delete(timeline);
      },
    });

    this.activeTimelines.add(timeline);
    return timeline;
  }

  /**
   * Validate sprite array for safety
   *
   * @param sprites - Sprites to validate
   * @returns True if sprites array is valid
   */
  private validateSprites(sprites: Sprite[]): boolean {
    return (
      Array.isArray(sprites) &&
      sprites.every(
        (sprite) =>
          // Note: Can't use DOM_PROPERTIES.TYPE_OBJECT here due to TypeScript typeof constraint
          sprite &&
          typeof sprite === 'object' &&
          DOM_PROPERTIES.X_COORDINATE in sprite &&
          DOM_PROPERTIES.Y_COORDINATE in sprite
      )
    );
  }
}
