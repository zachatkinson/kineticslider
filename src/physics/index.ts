/**
 * @fileoverview Physics Module Index - Phase 2.1 GSAP Physics Engine Extraction
 *
 * Exported classes:
 * - KineticPhysics: Pure momentum and kinetic calculations
 * - GSAPTimelineFactory: Reusable GSAP timeline patterns
 * - SpringPhysics: GSAP spring-based interactions
 * - VelocityTracker: Optimized velocity calculation
 *
 * @version 1.0.0
 */

// Core physics classes
export { KineticPhysics } from './kinetic-physics';
export type {
  KineticPhysicsConfig,
  MomentumResult,
  SnapResult,
} from './kinetic-physics';

export { GSAPTimelineFactory } from './gsap-timeline-factory';
export type {
  TransitionConfig,
  MomentumConfig,
  SnapConfig,
  ScaleConfig,
} from './gsap-timeline-factory';

export { SpringPhysics } from './spring-physics';
export type {
  SpringConfig,
  DisplacementConfig,
  SpringResult,
} from './spring-physics';

export { VelocityTracker } from './velocity-tracker';
export type {
  VelocitySample,
  VelocityConfig,
  VelocityResult,
} from './velocity-tracker';

// Legacy exports for compatibility during transition
export { SliderPhysicsEngine } from './engine';
export { PixiSliderRenderer } from './renderer';

// Phase 2.1 Compatibility Facade
// This provides the same API as before but uses our new modular components
import type { Sprite } from 'pixi.js';
import { gsap } from 'gsap';
import type { ISliderPhysics, PhysicsConfig } from '../core/types';
import { SliderPhysicsEngine } from './engine';
import { PixiSliderRenderer } from './renderer';
import { ANIMATION_DURATION } from '../core/constants';

/**
 * SliderPhysics - Compatibility facade for Phase 2.1 transition
 *
 * This maintains the same API as before while using our new modular components.
 * Future phases will gradually migrate consumers to the new component APIs.
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

  animateTransition(
    fromIndex: number,
    toIndex: number,
    sprites: Sprite[]
  ): gsap.core.Timeline {
    const validSprites = sprites || [];
    const sequence = this.engine.calculateTransition(
      fromIndex,
      toIndex,
      validSprites.length
    );
    return this.renderer.applyTransition(validSprites, sequence);
  }

  animateSwipe(
    sprite: Sprite,
    direction: number,
    intensity: number
  ): gsap.core.Timeline {
    if (!sprite) {
      return gsap.timeline();
    }
    const animation = this.engine.calculateSwipe(direction, intensity);
    return this.renderer.applySwipe(sprite, animation);
  }

  animateScale(
    sprite: Sprite,
    scale: number,
    duration = ANIMATION_DURATION.STANDARD
  ): gsap.core.Timeline {
    if (!sprite) {
      return gsap.timeline();
    }
    const animation = this.engine.calculateScale(scale, duration);
    return this.renderer.applyScale(sprite, animation);
  }

  setPhysicsConfig(config: Partial<PhysicsConfig>): void {
    if (!config) return;
    this.engine.setConfig(config);
  }

  getPhysicsConfig(): PhysicsConfig {
    return this.engine.getConfig();
  }

  killAllAnimations(): void {
    this.renderer.killAllAnimations();
  }

  cleanup(): void {
    try {
      this.renderer.cleanup();
    } catch {
      // Silently handle cleanup errors to prevent cascading failures
    }
  }

  shouldTriggerSlideChange(distance: number, velocity: number): boolean {
    return this.engine.shouldTriggerSlideChange(distance, velocity);
  }

  calculateAdaptiveTiming(interactionTime: number, intensity: number): number {
    return this.engine.calculateAdaptiveTiming(interactionTime, intensity);
  }

  getPerformanceStats(): {
    activeTimelines: number;
    activeTweens: number;
    totalAnimations: number;
  } {
    return this.renderer.getPerformanceStats();
  }

  markSpritesForGSAP(sprites: Sprite[]): void {
    const validSprites = sprites || [];
    this.renderer.markSpritesForGSAP(validSprites);
  }

  applyBatchAnimations(
    sprites: Sprite[],
    animations: Array<{ spriteIndex: number; props: gsap.TweenVars }>
  ): gsap.core.Timeline {
    const validSprites = sprites || [];
    const validAnimations = animations || [];
    return this.renderer.applyBatchAnimations(validSprites, validAnimations);
  }
}
