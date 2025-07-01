/**
 * @fileoverview SliderPhysics Facade - High-Level Physics Coordination
 *
 * Facade pattern coordinating between SliderPhysicsEngine (pure math) and 
 * SliderRenderer (GSAP + PIXI integration). Provides unified interface
 * for physics-driven animations with world-class performance.
 *
 * @version 1.0.0
 */

import { SliderPhysicsEngine } from './engine';
import { SliderRenderer } from '../rendering';
import { KineticPhysics } from './kinetic-physics';
import { SpringPhysics } from './spring-physics';
import { VelocityTracker } from './velocity-tracker';
import { GSAPTimelineFactory } from './gsap-timeline-factory';
import type { PhysicsConfig } from '../core/types';
import type { Sprite } from 'pixi.js';
import type { AnimationSequence, SwipeAnimation } from './engine';
import type { SpringResult } from './spring-physics';
import type { MomentumResult } from './kinetic-physics';

export interface SliderPhysicsConfig {
  slideCount: number;
  slideWidth: number;
  container: HTMLElement;
  sprites?: Sprite[];
  physicsConfig?: Partial<PhysicsConfig>;
  enableGPU?: boolean;
  enableSpring?: boolean;
}

/**
 * SliderPhysics Facade
 * 
 * High-level coordinator that manages the interaction between:
 * - Pure physics calculations (SliderPhysicsEngine)
 * - Visual rendering (SliderRenderer + GSAP)
 * - User interactions and animations
 */
export class SliderPhysics {
  private engine: SliderPhysicsEngine;
  private renderer: SliderRenderer;
  private kinetics: KineticPhysics;
  private spring: SpringPhysics;
  private velocity: VelocityTracker;
  private timeline: GSAPTimelineFactory;
  private config: SliderPhysicsConfig;
  private sprites: Sprite[];

  constructor(
    config: SliderPhysicsConfig,
    engine?: SliderPhysicsEngine,
    renderer?: SliderRenderer
  ) {
    this.config = config;
    this.sprites = config.sprites || [];
    
    // Support dependency injection for testing while maintaining production convenience
    this.engine = engine ?? new SliderPhysicsEngine();
    if (config.physicsConfig && !engine) {
      // Only set config if we created the engine (not injected)
      this.engine.setConfig(config.physicsConfig);
    }
    
    // Support dependency injection for testing
    this.renderer = renderer ?? new SliderRenderer();
    
    // Initialize physics components with proper configs
    this.kinetics = new KineticPhysics({
      friction: 0.85,
      scaleIntensity: 0.1,
      velocityThreshold: 0.5,
      maxVelocity: 20,
      swipeThreshold: 50,
    });
    
    this.spring = new SpringPhysics({
      springConstant: 0.3,
      damping: 0.6,
    });
    
    this.velocity = new VelocityTracker({
      bufferSize: 5,
      throttleInterval: 100,
      smoothingFactor: 0.3,
    });
    
    this.timeline = new GSAPTimelineFactory();
  }

  /**
   * Calculate physics for transition
   */
  calculateTransition(fromIndex: number, toIndex: number): AnimationSequence {
    return this.engine.calculateTransition(fromIndex, toIndex, this.config.slideCount);
  }

  /**
   * Calculate physics for swipe
   */
  calculateSwipe(direction: number, intensity: number): SwipeAnimation {
    return this.engine.calculateSwipe(direction, intensity);
  }

  /**
   * Calculate physics for momentum
   */
  calculateMomentum(velocity: number, distance: number, time: number): MomentumResult {
    return this.kinetics.calculateMomentum(velocity, distance, time);
  }

  /**
   * Calculate spring physics
   */
  calculateSpring(current: number, target: number, velocity: number): SpringResult {
    return this.spring.calculateElasticMotion(current, target, velocity);
  }

  /**
   * Apply transition animation to sprites
   */
  applyTransition(fromIndex: number, toIndex: number): gsap.core.Timeline {
    const sequence = this.calculateTransition(fromIndex, toIndex);
    return this.renderer.applyTransition(this.sprites, sequence);
  }

  /**
   * Apply swipe animation to sprite
   */
  applySwipe(spriteIndex: number, direction: number, intensity: number): gsap.core.Timeline {
    // Safe array access with bounds checking
    if (spriteIndex < 0 || spriteIndex >= this.sprites.length) {
      throw new Error(`Sprite index ${spriteIndex} out of bounds. Available sprites: ${this.sprites.length}`);
    }
    
    const sprite = this.sprites.at(spriteIndex);
    if (!sprite) {
      throw new Error(`Sprite at index ${spriteIndex} not found`);
    }
    
    const swipeAnimation = this.calculateSwipe(direction, intensity);
    return this.renderer.applySwipe(sprite, swipeAnimation);
  }

  /**
   * Handle drag interaction with physics
   */
  onDrag(distance: number, _timeDelta?: number): void {
    // Track velocity for physics calculations
    this.velocity.addSample(distance, Date.now());
    
    // Calculate drag scale effect
    const dragScale = this.kinetics.calculateDragScale(distance);
    
    // Apply scale to active sprite (assuming index 0 for simplicity)
    if (this.sprites.length > 0) {
      const scaleAnimation = this.engine.calculateScale(dragScale);
      this.renderer.applyScale(this.sprites[0], scaleAnimation);
    }
  }

  /**
   * Handle drag end with momentum
   */
  async onDragEnd(finalDistance: number): Promise<void> {
    const velocityResult = this.velocity.getVelocity();
    const currentVelocity = velocityResult.velocity;
    
    // Check if should trigger slide change
    if (this.kinetics.shouldTriggerSlideChange(finalDistance, currentVelocity)) {
      // Calculate direction and apply swipe
      const direction = finalDistance > 0 ? 1 : -1;
      const intensity = Math.min(Math.abs(currentVelocity) / 10, 1);
      
      this.applySwipe(0, direction, intensity);
    } else {
      // Reset scale to default
      if (this.sprites.length > 0) {
        const resetAnimation = this.kinetics.calculateSpringReset(this.sprites[0].scale.x);
        this.renderer.createOptimizedTween(this.sprites[0], {
          scale: 1,
          duration: resetAnimation.duration,
          ease: resetAnimation.ease,
        });
      }
    }
  }

  /**
   * Set sprites for the facade to manage
   */
  setSprites(sprites: Sprite[]): void {
    this.sprites = sprites;
    this.renderer.markSpritesForGSAP(sprites);
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): { activeTimelines: number; activeTweens: number; totalAnimations: number } {
    return this.renderer.getPerformanceStats();
  }

  /**
   * Update physics configuration
   */
  updatePhysicsConfig(config: Partial<PhysicsConfig>): void {
    this.engine.setConfig(config);
  }

  /**
   * Kill all animations
   */
  killAllAnimations(): void {
    this.renderer.killAllAnimations();
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.renderer.cleanup();
  }

  /**
   * Get current physics configuration
   */
  getPhysicsConfig(): PhysicsConfig {
    return this.engine.getConfig();
  }

  /**
   * Set physics configuration
   */
  setPhysicsConfig(config: Partial<PhysicsConfig>): void {
    this.engine.setConfig(config);
  }

  /**
   * Animation methods (aliases for consistency with tests)
   */
  animateTransition(fromIndex: number, toIndex: number, sprites: Sprite[]): gsap.core.Timeline {
    if (sprites) {
      this.setSprites(sprites);
    }
    return this.applyTransition(fromIndex, toIndex);
  }

  animateSwipe(sprite: Sprite, direction: number, intensity: number): gsap.core.Timeline {
    // Find existing sprite or add it
    let spriteIndex = this.sprites.indexOf(sprite);
    if (spriteIndex === -1) {
      // Add the sprite to our managed array
      this.sprites.push(sprite);
      spriteIndex = this.sprites.length - 1;
      this.renderer.markSpritesForGSAP([sprite]);
    }
    
    // Use the index-based method
    return this.applySwipe(spriteIndex, direction, intensity);
  }

  animateScale(sprite: Sprite, scale: number, duration?: number): gsap.core.Timeline {
    const scaleAnimation = this.engine.calculateScale(scale, duration);
    return this.renderer.applyScale(sprite, scaleAnimation);
  }

  /**
   * Advanced engine methods that delegate to appropriate components
   */
  shouldTriggerSlideChange(distance: number, velocity: number): boolean {
    return this.kinetics.shouldTriggerSlideChange(distance, velocity);
  }

  calculateAdaptiveTiming(interactionTime: number, intensity: number): number {
    return this.engine.calculateAdaptiveTiming(interactionTime, intensity);
  }

  /**
   * Performance and batch operations
   */
  markSpritesForGSAP(sprites: Sprite[]): void {
    this.renderer.markSpritesForGSAP(sprites);
    this.setSprites(sprites);
  }

  applyBatchAnimations(
    sprites: Sprite[], 
    animations: Array<{ spriteIndex: number; props: gsap.TweenVars }>
  ): gsap.core.Timeline {
    return this.renderer.applyBatchAnimations(sprites, animations);
  }

  /**
   * Clean up resources (alias for destroy)
   */
  cleanup(): void {
    this.destroy();
  }
} 