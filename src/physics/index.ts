import type { Sprite } from 'pixi.js';
import { gsap } from 'gsap';
import type { ISliderPhysics, PhysicsConfig } from '../core/types';
import { SliderPhysicsEngine } from './engine';
import { PixiSliderRenderer } from './renderer';
import { ANIMATION_DURATION } from '../core';

// Export all classes for advanced usage
export { SliderPhysicsEngine } from './engine';
export { PixiSliderRenderer } from './renderer';
export type {
  AnimationSequence,
  SwipeAnimation,
  ScaleAnimation,
} from './engine';

/**
 * @fileoverview Physics Facade
 *
 * Facade for physics operations that coordinates between SliderPhysicsEngine and renderer.
 * Provides a simplified API for the main engine to interact with physics calculations.
 */

/**
 * SliderPhysics - Unified facade for slider animations
 *
 * Best practice architecture with separated concerns:
 * - Pure physics calculations (unit testable)
 * - PIXI rendering integration (integration testable)
 * - Same API as before (no breaking changes)
 *
 * Key Features:
 * - Slide transitions with scale and positioning effects
 * - Swipe momentum physics
 * - Interactive scaling during drag
 * - Timeline-based animation control
 * - Memory-efficient animation cleanup
 * - Input validation for robustness
 *
 * @example
 * ```typescript
 * const physics = new SliderPhysics();
 * physics.setPhysicsConfig({ transitionDuration: ANIMATION_DURATION.SLOW });
 * const timeline = physics.animateTransition(0, 1, sprites);
 * ```
 */
export class SliderPhysics implements ISliderPhysics {
  private readonly engine: SliderPhysicsEngine;
  private readonly renderer: PixiSliderRenderer;

  constructor(
    engine: SliderPhysicsEngine = new SliderPhysicsEngine(),
    renderer: PixiSliderRenderer = new PixiSliderRenderer()
  ) {
    this.engine = engine;
    this.renderer = renderer;
  }

  /**
   * Animate transition between slides
   * Uses separated engine for calculations and renderer for execution
   */
  animateTransition(
    fromIndex: number,
    toIndex: number,
    sprites: Sprite[]
  ): gsap.core.Timeline {
    // Input validation - handle null/undefined sprites gracefully
    const validSprites = sprites || [];

    // Calculate animation sequence using pure engine
    const sequence = this.engine.calculateTransition(
      fromIndex,
      toIndex,
      validSprites.length
    );

    // Apply to PIXI sprites using renderer
    return this.renderer.applyTransition(validSprites, sequence);
  }

  /**
   * Animate swipe gesture with momentum
   * Uses separated engine for calculations and renderer for execution
   */
  animateSwipe(
    sprite: Sprite,
    direction: number,
    intensity: number
  ): gsap.core.Timeline {
    // Input validation - handle null/undefined sprite gracefully
    if (!sprite) {
      // Return empty timeline for null sprites
      return gsap.timeline();
    }

    // Calculate swipe animation using pure engine
    const animation = this.engine.calculateSwipe(direction, intensity);

    // Apply to PIXI sprite using renderer
    return this.renderer.applySwipe(sprite, animation);
  }

  /**
   * Animate sprite scaling (used for drag interactions)
   * Uses separated engine for calculations and renderer for execution
   */
  animateScale(
    sprite: Sprite,
    scale: number,
    duration = ANIMATION_DURATION.STANDARD
  ): gsap.core.Timeline {
    // Input validation - handle null/undefined sprite gracefully
    if (!sprite) {
      // Return empty timeline for null sprites
      return gsap.timeline();
    }

    // Calculate scale animation using pure engine
    const animation = this.engine.calculateScale(scale, duration);

    // Apply to PIXI sprite using renderer
    return this.renderer.applyScale(sprite, animation);
  }

  /**
   * Update physics configuration
   * Delegates to engine for pure configuration management
   */
  setPhysicsConfig(config: Partial<PhysicsConfig>): void {
    // Input validation - handle null/undefined config gracefully
    if (!config) return;

    this.engine.setConfig(config);
  }

  /**
   * Get current physics configuration
   * Delegates to engine for pure configuration retrieval
   */
  getPhysicsConfig(): PhysicsConfig {
    return this.engine.getConfig();
  }

  /**
   * Kill all active animations immediately
   * Delegates to renderer for GSAP/PIXI cleanup
   */
  killAllAnimations(): void {
    this.renderer.killAllAnimations();
  }

  /**
   * Cleanup physics engine
   * Delegates to renderer for resource cleanup
   */
  cleanup(): void {
    try {
      this.renderer.cleanup();
    } catch {
      // Silently handle ALL cleanup errors to prevent cascading failures
      // Cleanup operations should be robust and not throw
      // In production, this would be logged to a proper error service
      // For now, we continue gracefully without logging to avoid console violations
    }
  }

  /**
   * Advanced: Check if swipe should trigger slide change
   * Exposes pure engine calculations for advanced use cases
   */
  shouldTriggerSlideChange(distance: number, velocity: number): boolean {
    return this.engine.shouldTriggerSlideChange(distance, velocity);
  }

  /**
   * Advanced: Calculate adaptive timing based on interaction
   * Exposes pure engine calculations for advanced use cases
   */
  calculateAdaptiveTiming(interactionTime: number, intensity: number): number {
    return this.engine.calculateAdaptiveTiming(interactionTime, intensity);
  }

  /**
   * Advanced: Get animation performance statistics
   * Exposes renderer performance data for monitoring
   */
  getPerformanceStats(): {
    activeTimelines: number;
    activeTweens: number;
    totalAnimations: number;
  } {
    return this.renderer.getPerformanceStats();
  }

  /**
   * Advanced: Mark sprites for GSAP targeting
   * Delegates to renderer for GSAP optimization
   */
  markSpritesForGSAP(sprites: Sprite[]): void {
    // Input validation - handle null/undefined sprites gracefully
    const validSprites = sprites || [];
    this.renderer.markSpritesForGSAP(validSprites);
  }

  /**
   * Advanced: Apply batch animations for performance
   * Delegates to renderer for efficient batch processing
   */
  applyBatchAnimations(
    sprites: Sprite[],
    animations: Array<{ spriteIndex: number; props: gsap.TweenVars }>
  ): gsap.core.Timeline {
    // Input validation - handle null/undefined inputs gracefully
    const validSprites = sprites || [];
    const validAnimations = animations || [];

    return this.renderer.applyBatchAnimations(validSprites, validAnimations);
  }
}
