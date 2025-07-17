/**
 * @fileoverview Unified PIXI.js Slider Renderer
 *
 * Complete PIXI.js rendering system that handles:
 * 1. PIXI Application initialization and management
 * 2. Sprite creation, loading, and lifecycle management
 * 3. GSAP-powered physics-based animations
 * 4. GPU-optimized rendering pipeline
 *
 * This unified renderer eliminates the confusion between "SliderRenderer"
 * and "PixiSliderRenderer" by providing one comprehensive solution.
 *
 * @version 1.0.0
 */

import { Application, Sprite, Texture, Filter, Assets } from 'pixi.js';
import { gsap } from 'gsap';
import type { ISliderRenderer, RenderConfig } from '../core/types';
import type {
  AnimationSequence,
  SwipeAnimation,
  ScaleAnimation,
} from '../physics/engine';
import { GSAP_DEFAULTS } from '../core/constants';
import { safeArrayAssign, safeArrayAccess, isValidArrayIndex } from '../utils/safe-array';

/**
 * Unified PIXI.js Renderer with Complete Pipeline
 *
 * Handles everything from PIXI app initialization to GSAP animations.
 * Eliminates the need for separate "PixiSliderRenderer" animation applier.
 */
export class SliderRenderer implements ISliderRenderer {
  private app: Application | null = null;
  private sprites: Sprite[] = [];
  private container: HTMLElement | null = null;
  private config: RenderConfig | null = null;
  private isInitialized = false;

  // Animation management
  private activeTimelines = new Set<gsap.core.Timeline>();
  private activeTweens = new Set<gsap.core.Tween>();

  // Animation defaults
  private readonly animationDefaults: gsap.TweenVars = {
    ease: 'power2.out',
    overwrite: 'auto' as const,
  };

  // =============================================================================
  // 🎯 PIXI Application Management (implements ISliderRenderer)
  // =============================================================================

  /**
   * Initialize the PIXI application and setup rendering pipeline
   */
  async initialize(
    container: HTMLElement,
    config: RenderConfig
  ): Promise<void> {
    try {
      if (!container) {
        throw new Error(
          'Container element is required for renderer initialization'
        );
      }

      // Store configuration
      this.config = config;
      this.container = container;

      // Create PIXI application with configuration
      this.app = new Application({
        width: config.width,
        height: config.height,
        backgroundColor: config.backgroundColor,
        antialias: config.antialias,
        resolution: config.resolution,
      });

      // Wait for app to initialize
      await this.app.init();

      // Add canvas to container
      this.container.appendChild(this.app.canvas);

      this.isInitialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize PIXI renderer: ${error}`);
    }
  }

  /**
   * Get PIXI application instance
   */
  getApplication(): Application | null {
    return this.app;
  }

  /**
   * Resize renderer and update viewport
   */
  resize(width: number, height: number): void {
    if (!this.app) {
      throw new Error('Renderer not initialized');
    }

    this.app.renderer.resize(width, height);
  }

  // =============================================================================
  // 🎯 Sprite Management (implements ISliderRenderer)
  // =============================================================================

  /**
   * Create and load sprite from texture
   */
  async createSprite(
    texture: string | Texture,
    index: number
  ): Promise<Sprite> {
    if (!this.app) {
      throw new Error('Renderer not initialized');
    }

    let pixiTexture: Texture;

    if (typeof texture === 'string') {
      // Load texture from URL using Assets API
      pixiTexture = await Assets.load(texture);
    } else {
      pixiTexture = texture;
    }

    const sprite = new Sprite(pixiTexture);

    // Configure sprite
    sprite.anchor.set(0.5);
    sprite.position.set(this.app.screen.width / 2, this.app.screen.height / 2);

    // Add GSAP data attributes for targeting
    this.markSpriteForGSAP(sprite, index);

    // Add to stage and track with safe array assignment
    this.app.stage.addChild(sprite);
    
    // Use safe array assignment to prevent object injection
    safeArrayAssign(this.sprites, index, sprite);

    return sprite;
  }

  /**
   * Remove sprite from stage and cleanup
   */
  removeSprite(sprite: Sprite): void {
    if (!this.app) return;

    this.app.stage.removeChild(sprite);

    // Remove from tracking array
    const index = this.sprites.indexOf(sprite);
    if (index !== -1) {
      this.sprites.splice(index, 1);
    }

    // Cleanup texture if needed
    sprite.destroy();
  }

  /**
   * Get all managed sprites
   */
  getSprites(): Sprite[] {
    return [...this.sprites];
  }

  /**
   * Control sprite visibility
   */
  setVisible(sprite: Sprite, visible: boolean): void {
    sprite.visible = visible;
    sprite.alpha = visible ? 1 : 0;
  }

  // =============================================================================
  // 🎯 Filter Management (implements ISliderRenderer)
  // =============================================================================

  /**
   * Apply filter to sprite
   */
  applyFilter(sprite: Sprite, filter: Filter): void {
    if (!sprite.filters) {
      sprite.filters = [];
    }

    // Ensure filters is an array before pushing
    if (Array.isArray(sprite.filters)) {
      sprite.filters.push(filter);
    } else {
      sprite.filters = [filter];
    }
  }

  /**
   * Remove specific filter from sprite
   */
  removeFilter(sprite: Sprite, filter: Filter): void {
    if (!sprite.filters || !Array.isArray(sprite.filters)) return;

    const index = sprite.filters.indexOf(filter);
    if (index !== -1) {
      sprite.filters.splice(index, 1);
    }
  }

  /**
   * Clear all filters from sprite
   */
  clearFilters(sprite: Sprite): void {
    sprite.filters = [];
  }

  // =============================================================================
  // 🎯 GSAP Animation Integration (from PixiSliderRenderer)
  // =============================================================================

  /**
   * Apply transition animation sequence to PIXI sprites
   */
  applyTransition(
    sprites: Sprite[],
    sequence: AnimationSequence
  ): gsap.core.Timeline {
    const timeline = this.createManagedTimeline();

    // Hide sprites that should be hidden
    sequence.hideSprites.forEach((index) => {
      // Use safe array access with type checking
      if (isValidArrayIndex(index, sprites.length)) {
        const sprite = safeArrayAccess(sprites, index);
        if (sprite) {
          timeline.set(sprite, { alpha: 0, visible: false }, 0);
        }
      }
    });

    // Get target sprite with safe array access
    const targetIndex = sequence.targetSprite.index;
    const targetSprite = isValidArrayIndex(targetIndex, sprites.length)
      ? safeArrayAccess(sprites, targetIndex)
      : null;
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
      // Use safe array access with type checking
      const sourceIndex = sequence.sourceSprite.index;
      const sourceSprite = isValidArrayIndex(sourceIndex, sprites.length)
        ? safeArrayAccess(sprites, sourceIndex)
        : null;
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
   * Apply batch animations to multiple sprites efficiently
   */
  applyBatchAnimations(
    sprites: Sprite[],
    animations: Array<{ spriteIndex: number; props: gsap.TweenVars }>
  ): gsap.core.Timeline {
    const timeline = this.createManagedTimeline();

    animations.forEach(({ spriteIndex, props }) => {
      // Use safe array access with type checking to prevent object injection
      if (isValidArrayIndex(spriteIndex, sprites.length)) {
        const sprite = safeArrayAccess(sprites, spriteIndex);
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
      }
    });

    return timeline;
  }

  /**
   * Create optimized GSAP tween with performance settings
   */
  createOptimizedTween(sprite: Sprite, props: gsap.TweenVars): gsap.core.Tween {
    // Safe configuration merge to avoid object injection
    const safeProps = {
      ...this.animationDefaults,
      duration: props.duration || 0.5,
      ease: props.ease || 'power2.out',
      onComplete: props.onComplete,
      onUpdate: props.onUpdate,
      // Add specific animation properties safely
      x: props.x,
      y: props.y,
      scale: props.scale,
      alpha: props.alpha,
      rotation: props.rotation,
    };

    const tween = gsap.to(sprite, safeProps);
    this.activeTweens.add(tween);

    return tween;
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
   * Set sprites data attributes for GSAP targeting
   */
  markSpritesForGSAP(sprites: Sprite[]): void {
    sprites.forEach((sprite, index) => {
      this.markSpriteForGSAP(sprite, index);
    });
  }

  /**
   * Cleanup renderer resources (alias for destroy for backward compatibility)
   */
  cleanup(): void {
    this.killAllAnimations();
  }

  // =============================================================================
  // 🎯 Rendering Control and Cleanup (implements ISliderRenderer)
  // =============================================================================

  /**
   * Force render frame
   */
  render(): void {
    if (this.app) {
      this.app.render();
    }
  }

  /**
   * Complete cleanup and destruction
   */
  destroy(): void {
    // Kill all animations
    this.killAllAnimations();

    // Cleanup sprites
    this.sprites.forEach((sprite) => {
      if (sprite.parent) {
        sprite.parent.removeChild(sprite);
      }
      sprite.destroy();
    });
    this.sprites = [];

    // Destroy PIXI app
    if (this.app) {
      this.app.destroy(true, {
        children: true,
        texture: true,
      });
      this.app = null;
    }

    this.container = null;
  }

  // =============================================================================
  // 🎯 Private Helper Methods
  // =============================================================================

  /**
   * Create managed timeline with automatic cleanup
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
   * Mark sprite with GSAP data attributes for targeting
   */
  private markSpriteForGSAP(sprite: Sprite, index: number): void {
    // Add simple data properties for GSAP targeting with proper typing
    (sprite as Sprite & { 'data-slider-sprite': boolean })[
      'data-slider-sprite'
    ] = true;
    (sprite as Sprite & { 'data-sprite-index': number })['data-sprite-index'] =
      index;
  }
}
