/**
 * @fileoverview DisplacementEffects - Modern displacement effect management
 *
 * Specialized class for creating and managing displacement map effects with PIXI.js.
 * Supports mouse following, transitions between slides, and idle animations.
 * Optimized for 60fps performance with efficient memory management.
 *
 * @version 1.0.0
 */

import { gsap } from 'gsap';
import type { DisplacementFilter, Texture } from 'pixi.js';
import { Sprite, DisplacementFilter as PIXIDisplacementFilter } from 'pixi.js';
// import type { AnimationConfig } from '../core/types';
import { GSAP_DEFAULTS, ANIMATION_DURATION, EASING } from '../core/constants';

/**
 * Configuration options for mouse follow effect
 */
export interface MouseFollowOptions {
  /** Effect intensity (0-1) */
  intensity?: number;
  /** Effect radius in pixels */
  radius?: number;
  /** Whether to enable easing on mouse movement */
  smoothing?: boolean;
  /** Smoothing factor (0-1) */
  smoothingFactor?: number;
  /** Animation duration for mouse movement */
  duration?: number;
  /** GSAP easing function */
  ease?: string;
  /** Whether the effect is enabled */
  enabled?: boolean;
  /** Displacement scale X */
  scaleX?: number;
  /** Displacement scale Y */
  scaleY?: number;
}

/**
 * Configuration options for transition effect
 */
export interface TransitionOptions {
  /** Transition type */
  type?: 'wave' | 'ripple' | 'distortion' | 'swirl';
  /** Effect intensity (0-1) */
  intensity?: number;
  /** Transition duration in seconds */
  duration?: number;
  /** GSAP easing function */
  ease?: string;
  /** Wave frequency for wave/ripple effects */
  waveFrequency?: number;
  /** Wave amplitude for wave/ripple effects */
  waveAmplitude?: number;
  /** Rotation amount for swirl effect */
  rotation?: number;
  /** Whether to reverse the effect direction */
  reverse?: boolean;
}

/**
 * Configuration options for idle effect
 */
export interface IdleEffectOptions {
  /** Idle animation type */
  type?: 'float' | 'breathe' | 'wave' | 'subtle';
  /** Effect intensity (0-1) */
  intensity?: number;
  /** Animation duration in seconds */
  duration?: number;
  /** Whether to loop the animation */
  loop?: boolean;
  /** Delay between loops */
  loopDelay?: number;
  /** GSAP easing function */
  ease?: string;
  /** Whether the effect is enabled */
  enabled?: boolean;
}

/**
 * Displacement effect state tracking
 */
interface DisplacementState {
  /** Current mouse position */
  mousePosition: { x: number; y: number };
  /** Target mouse position for smoothing */
  targetMousePosition: { x: number; y: number };
  /** Whether mouse follow is active */
  isMouseFollowActive: boolean;
  /** Whether idle animation is active */
  isIdleActive: boolean;
  /** Active displacement filters */
  activeFilters: Map<string, DisplacementFilter>;
  /** Active timelines */
  activeTimelines: Map<string, gsap.core.Timeline>;
}

/**
 * DisplacementEffects - Modern displacement effect management
 *
 * Provides comprehensive displacement effect capabilities for creating
 * immersive visual experiences with optimal performance.
 */
export class DisplacementEffects {
  private state: DisplacementState;
  private effectIdCounter = 0;
  private mouseFollowRAF: number | null = null;
  private displacementTexture: Texture | null = null;

  constructor(displacementTexture?: Texture) {
    this.state = {
      mousePosition: { x: 0, y: 0 },
      targetMousePosition: { x: 0, y: 0 },
      isMouseFollowActive: false,
      isIdleActive: false,
      activeFilters: new Map(),
      activeTimelines: new Map(),
    };

    if (displacementTexture) {
      this.displacementTexture = displacementTexture;
    }
  }

  /**
   * Set displacement texture for effects
   *
   * @param texture - Displacement map texture
   */
  setDisplacementTexture(texture: Texture): void {
    this.displacementTexture = texture;
  }

  /**
   * Creates a displacement effect that follows mouse/touch input
   *
   * @param sprite - The sprite to apply the effect to
   * @param options - Configuration options for the effect
   * @returns GSAP timeline for the effect
   */
  createMouseFollowEffect(
    sprite: Sprite,
    options: MouseFollowOptions = {}
  ): gsap.core.Timeline {
    const {
      intensity = 0.5,
      radius = 150,
      smoothing = true,
      smoothingFactor = 0.1,
      duration = 0.3,
      ease = EASING.EASE_OUT,
      enabled = true,
      scaleX = 50,
      scaleY = 50,
    } = options;

    if (!this.displacementTexture) {
      throw new Error(
        'Displacement texture not set. Call setDisplacementTexture first.'
      );
    }

    const effectId = this.generateEffectId();
    // Create a sprite from the displacement texture for the filter
    const displacementSprite = new Sprite(this.displacementTexture);
    const filter = new PIXIDisplacementFilter(displacementSprite, 0);

    // Apply filter to sprite
    this.applyFilterToSprite(sprite, filter);
    this.state.activeFilters.set(effectId, filter);

    // Create timeline for enabling/disabling effect
    const timeline = gsap.timeline({
      ...GSAP_DEFAULTS.PERFORMANCE,
      paused: !enabled,
    });

    if (enabled) {
      this.state.isMouseFollowActive = true;
      this.startMouseTracking(sprite, filter, {
        intensity,
        radius,
        smoothing,
        smoothingFactor,
        scaleX,
        scaleY,
      });
    }

    // Animate filter scale based on intensity
    timeline.to(filter.scale, {
      x: scaleX * intensity,
      y: scaleY * intensity,
      duration,
      ease,
    });

    this.state.activeTimelines.set(effectId, timeline);
    return timeline;
  }

  /**
   * Creates a transition effect between two sprites
   *
   * @param from - The source sprite
   * @param to - The target sprite
   * @param options - Configuration options for the transition
   * @returns GSAP timeline for the transition
   */
  createTransitionEffect(
    from: Sprite,
    to: Sprite,
    options: TransitionOptions = {}
  ): gsap.core.Timeline {
    const {
      type = 'wave',
      intensity = 0.7,
      duration = ANIMATION_DURATION.STANDARD,
      ease = EASING.EASE_IN_OUT,
      waveFrequency = 10,
      waveAmplitude = 30,
      rotation = Math.PI * 2,
      reverse = false,
    } = options;

    if (!this.displacementTexture) {
      throw new Error(
        'Displacement texture not set. Call setDisplacementTexture first.'
      );
    }

    const effectId = this.generateEffectId();
    const masterTimeline = gsap.timeline({
      ...GSAP_DEFAULTS.TIMELINE,
    });

    // Create displacement filters for both sprites
    const displacementSpriteFrom = new Sprite(this.displacementTexture);
    const fromFilter = new PIXIDisplacementFilter(displacementSpriteFrom, 0);

    const displacementSpriteTo = new Sprite(this.displacementTexture);
    const toFilter = new PIXIDisplacementFilter(displacementSpriteTo, 0);

    // Apply filters
    this.applyFilterToSprite(from, fromFilter);
    this.applyFilterToSprite(to, toFilter);

    // Store filters
    this.state.activeFilters.set(`${effectId}_from`, fromFilter);
    this.state.activeFilters.set(`${effectId}_to`, toFilter);

    // Create transition based on type
    switch (type) {
      case 'wave':
        this.createWaveTransition(masterTimeline, fromFilter, toFilter, {
          intensity,
          duration,
          ease,
          waveFrequency,
          waveAmplitude,
          reverse,
        });
        break;

      case 'ripple':
        this.createRippleTransition(masterTimeline, fromFilter, toFilter, {
          intensity,
          duration,
          ease,
          waveFrequency,
          waveAmplitude,
        });
        break;

      case 'distortion':
        this.createDistortionTransition(masterTimeline, fromFilter, toFilter, {
          intensity,
          duration,
          ease,
        });
        break;

      case 'swirl':
        this.createSwirlTransition(masterTimeline, fromFilter, toFilter, {
          intensity,
          duration,
          ease,
          rotation,
          reverse,
        });
        break;
    }

    // Set cleanup callback for end of animation
    const originalConfig = masterTimeline.vars || {};
    masterTimeline.vars = {
      ...originalConfig,
      onComplete: (): void => {
        this.removeFilterFromSprite(from, fromFilter);
        this.removeFilterFromSprite(to, toFilter);
        this.state.activeFilters.delete(`${effectId}_from`);
        this.state.activeFilters.delete(`${effectId}_to`);
        if (originalConfig.onComplete) {
          originalConfig.onComplete();
        }
      },
    };

    this.state.activeTimelines.set(effectId, masterTimeline);
    return masterTimeline;
  }

  /**
   * Creates an idle animation effect for a sprite
   *
   * @param sprite - The sprite to apply the effect to
   * @param options - Configuration options for the idle animation
   * @returns GSAP timeline for the idle animation
   */
  createIdleEffect(
    sprite: Sprite,
    options: IdleEffectOptions = {}
  ): gsap.core.Timeline {
    const {
      type = 'float',
      intensity = 0.3,
      duration = 4,
      loop = true,
      loopDelay = 0,
      ease = EASING.EASE_IN_OUT,
      enabled = true,
    } = options;

    if (!this.displacementTexture) {
      throw new Error(
        'Displacement texture not set. Call setDisplacementTexture first.'
      );
    }

    const effectId = this.generateEffectId();
    // Create a sprite from the displacement texture for the filter
    const displacementSprite = new Sprite(this.displacementTexture);
    const filter = new PIXIDisplacementFilter(displacementSprite, 0);

    // Apply filter
    this.applyFilterToSprite(sprite, filter);
    this.state.activeFilters.set(effectId, filter);

    // Create timeline
    const timeline = gsap.timeline({
      ...GSAP_DEFAULTS.TIMELINE,
      repeat: loop ? -1 : 0,
      repeatDelay: loopDelay,
      paused: !enabled,
    });

    // Create idle animation based on type
    switch (type) {
      case 'float':
        this.createFloatAnimation(timeline, filter, {
          intensity,
          duration,
          ease,
        });
        break;

      case 'breathe':
        this.createBreatheAnimation(timeline, filter, {
          intensity,
          duration,
          ease,
        });
        break;

      case 'wave':
        this.createWaveAnimation(timeline, filter, {
          intensity,
          duration,
          ease,
        });
        break;

      case 'subtle':
        this.createSubtleAnimation(timeline, filter, {
          intensity,
          duration,
          ease,
        });
        break;
    }

    if (enabled) {
      this.state.isIdleActive = true;
      timeline.play();
    }

    this.state.activeTimelines.set(effectId, timeline);
    return timeline;
  }

  /**
   * Stop all active displacement effects
   */
  stopAllEffects(): void {
    // Stop mouse tracking
    if (this.mouseFollowRAF !== null) {
      cancelAnimationFrame(this.mouseFollowRAF);
      this.mouseFollowRAF = null;
    }

    // Kill all timelines
    this.state.activeTimelines.forEach((timeline) => {
      timeline.kill();
    });

    // Clear state
    this.state.activeTimelines.clear();
    this.state.activeFilters.clear();
    this.state.isMouseFollowActive = false;
    this.state.isIdleActive = false;
  }

  /**
   * Get performance metrics for displacement effects
   *
   * @returns Performance metrics object
   */
  getPerformanceMetrics(): {
    activeEffects: number;
    activeFilters: number;
    isMouseFollowActive: boolean;
    isIdleActive: boolean;
  } {
    return {
      activeEffects: this.state.activeTimelines.size,
      activeFilters: this.state.activeFilters.size,
      isMouseFollowActive: this.state.isMouseFollowActive,
      isIdleActive: this.state.isIdleActive,
    };
  }

  /**
   * Dispose of displacement effects and cleanup resources
   */
  dispose(): void {
    this.stopAllEffects();
    this.displacementTexture = null;
  }

  // =============================================================================
  // Private Helper Methods
  // =============================================================================

  /**
   * Generate unique effect ID
   */
  private generateEffectId(): string {
    return `displacement_${++this.effectIdCounter}_${Date.now()}`;
  }

  /**
   * Apply filter to sprite safely
   */
  private applyFilterToSprite(
    sprite: Sprite,
    filter: DisplacementFilter
  ): void {
    const filters = Array.isArray(sprite.filters)
      ? sprite.filters
      : sprite.filters
        ? [sprite.filters]
        : [];

    if (!filters.includes(filter)) {
      sprite.filters = [...filters, filter];
    }
  }

  /**
   * Remove filter from sprite safely
   */
  private removeFilterFromSprite(
    sprite: Sprite,
    filter: DisplacementFilter
  ): void {
    const filters = Array.isArray(sprite.filters)
      ? sprite.filters
      : sprite.filters
        ? [sprite.filters]
        : [];

    if (filters.length > 0) {
      const newFilters = filters.filter((f) => f !== filter);
      sprite.filters = newFilters.length > 0 ? newFilters : [];
    }
  }

  /**
   * Start mouse tracking for displacement effect
   */
  private startMouseTracking(
    sprite: Sprite,
    filter: DisplacementFilter,
    options: {
      intensity: number;
      radius: number;
      smoothing: boolean;
      smoothingFactor: number;
      scaleX: number;
      scaleY: number;
    }
  ): void {
    const container = sprite.parent;
    if (!container) return;

    // Mouse move handler
    const handleMouseMove = (event: MouseEvent): void => {
      const bounds = container.getBounds();
      this.state.targetMousePosition = {
        x: (event.clientX - bounds.x) / bounds.width,
        y: (event.clientY - bounds.y) / bounds.height,
      };
    };

    // Add event listener
    window.addEventListener('mousemove', handleMouseMove);

    // Animation loop for smooth following
    const animate = (): void => {
      if (!this.state.isMouseFollowActive) return;

      // Smooth interpolation
      if (options.smoothing) {
        this.state.mousePosition.x +=
          (this.state.targetMousePosition.x - this.state.mousePosition.x) *
          options.smoothingFactor;
        this.state.mousePosition.y +=
          (this.state.targetMousePosition.y - this.state.mousePosition.y) *
          options.smoothingFactor;
      } else {
        this.state.mousePosition = { ...this.state.targetMousePosition };
      }

      // Update filter based on mouse position
      const dx = this.state.mousePosition.x - 0.5;
      const dy = this.state.mousePosition.y - 0.5;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const normalizedDistance = Math.min(distance * 2, 1);

      filter.scale.x =
        dx * options.scaleX * options.intensity * normalizedDistance;
      filter.scale.y =
        dy * options.scaleY * options.intensity * normalizedDistance;

      this.mouseFollowRAF = requestAnimationFrame(animate);
    };

    // Start animation loop
    animate();

    // Store cleanup function
    const cleanup = (): void => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (this.mouseFollowRAF !== null) {
        cancelAnimationFrame(this.mouseFollowRAF);
        this.mouseFollowRAF = null;
      }
    };

    // Attach cleanup to sprite destruction (if sprite supports events)
    if (sprite && typeof sprite.once === 'function') {
      sprite.once('destroyed', cleanup);
    }
  }

  /**
   * Create wave transition effect
   */
  private createWaveTransition(
    timeline: gsap.core.Timeline,
    fromFilter: DisplacementFilter,
    toFilter: DisplacementFilter,
    options: {
      intensity: number;
      duration: number;
      ease: string;
      waveFrequency: number;
      waveAmplitude: number;
      reverse: boolean;
    }
  ): void {
    const { intensity, duration, ease, waveAmplitude, reverse } = options;

    // Animate from sprite with wave out
    timeline.to(
      fromFilter.scale,
      {
        x: reverse ? -waveAmplitude * intensity : waveAmplitude * intensity,
        y: waveAmplitude * intensity * 0.5,
        duration: duration * 0.6,
        ease,
      },
      0
    );

    // Animate to sprite with wave in
    timeline.set(toFilter.scale, {
      x: reverse ? waveAmplitude * intensity : -waveAmplitude * intensity,
      y: -waveAmplitude * intensity * 0.5,
    });

    timeline.to(
      toFilter.scale,
      {
        x: 0,
        y: 0,
        duration: duration * 0.6,
        ease,
      },
      duration * 0.4
    );

    // Fade out from filter
    timeline.to(
      fromFilter.scale,
      {
        x: 0,
        y: 0,
        duration: duration * 0.2,
        ease: EASING.EASE_IN,
      },
      duration * 0.6
    );
  }

  /**
   * Create ripple transition effect
   */
  private createRippleTransition(
    timeline: gsap.core.Timeline,
    fromFilter: DisplacementFilter,
    toFilter: DisplacementFilter,
    options: {
      intensity: number;
      duration: number;
      ease: string;
      waveFrequency: number;
      waveAmplitude: number;
    }
  ): void {
    const { intensity, duration, ease, waveAmplitude } = options;

    // Create ripple effect on both sprites
    const rippleScale = waveAmplitude * intensity;

    // Ripple out from center
    timeline.to(
      fromFilter.scale,
      {
        x: rippleScale,
        y: rippleScale,
        duration: duration * 0.5,
        ease: EASING.EASE_OUT,
      },
      0
    );

    timeline.to(
      toFilter.scale,
      {
        x: rippleScale * 0.5,
        y: rippleScale * 0.5,
        duration: duration * 0.5,
        ease: EASING.EASE_OUT,
      },
      0
    );

    // Settle back
    timeline.to(
      [fromFilter.scale, toFilter.scale],
      {
        x: 0,
        y: 0,
        duration: duration * 0.5,
        ease,
      },
      duration * 0.5
    );
  }

  /**
   * Create distortion transition effect
   */
  private createDistortionTransition(
    timeline: gsap.core.Timeline,
    fromFilter: DisplacementFilter,
    toFilter: DisplacementFilter,
    options: {
      intensity: number;
      duration: number;
      ease: string;
    }
  ): void {
    const { intensity, duration, ease } = options;
    const maxDistortion = 100 * intensity;

    // Distort both sprites
    timeline.to(
      fromFilter.scale,
      {
        x: maxDistortion,
        y: -maxDistortion * 0.7,
        duration: duration * 0.4,
        ease: EASING.EASE_IN,
      },
      0
    );

    timeline.to(
      toFilter.scale,
      {
        x: -maxDistortion * 0.7,
        y: maxDistortion,
        duration: duration * 0.4,
        ease: EASING.EASE_IN,
      },
      0
    );

    // Resolve distortion
    timeline.to(
      [fromFilter.scale, toFilter.scale],
      {
        x: 0,
        y: 0,
        duration: duration * 0.6,
        ease,
      },
      duration * 0.4
    );
  }

  /**
   * Create swirl transition effect
   */
  private createSwirlTransition(
    timeline: gsap.core.Timeline,
    fromFilter: DisplacementFilter,
    toFilter: DisplacementFilter,
    options: {
      intensity: number;
      duration: number;
      ease: string;
      rotation: number;
      reverse: boolean;
    }
  ): void {
    const { intensity, duration, ease, rotation, reverse } = options;
    const swirlIntensity = 80 * intensity;

    // Create swirl motion
    const direction = reverse ? -1 : 1;

    timeline.to(
      fromFilter,
      {
        rotation: rotation * direction,
        duration: duration,
        ease,
      },
      0
    );

    timeline.to(
      fromFilter.scale,
      {
        x: swirlIntensity * Math.cos(rotation),
        y: swirlIntensity * Math.sin(rotation),
        duration: duration * 0.7,
        ease: EASING.EASE_IN_OUT,
      },
      0
    );

    timeline.set(toFilter.scale, {
      x: -swirlIntensity * Math.cos(rotation),
      y: -swirlIntensity * Math.sin(rotation),
    });

    timeline.to(
      toFilter.scale,
      {
        x: 0,
        y: 0,
        duration: duration * 0.7,
        ease: EASING.EASE_IN_OUT,
      },
      duration * 0.3
    );
  }

  /**
   * Create float idle animation
   */
  private createFloatAnimation(
    timeline: gsap.core.Timeline,
    filter: DisplacementFilter,
    options: { intensity: number; duration: number; ease: string }
  ): void {
    const { intensity, duration, ease } = options;
    const floatScale = 20 * intensity;

    timeline.to(filter.scale, {
      x: floatScale,
      y: floatScale * 0.5,
      duration: duration * 0.5,
      ease,
    });

    timeline.to(filter.scale, {
      x: -floatScale * 0.5,
      y: floatScale,
      duration: duration * 0.5,
      ease,
    });

    timeline.to(filter.scale, {
      x: 0,
      y: 0,
      duration: duration * 0.5,
      ease,
    });
  }

  /**
   * Create breathe idle animation
   */
  private createBreatheAnimation(
    timeline: gsap.core.Timeline,
    filter: DisplacementFilter,
    options: { intensity: number; duration: number; ease: string }
  ): void {
    const { intensity, duration, ease } = options;
    const breatheScale = 15 * intensity;

    timeline.to(filter.scale, {
      x: breatheScale,
      y: breatheScale,
      duration: duration * 0.5,
      ease,
    });

    timeline.to(filter.scale, {
      x: 0,
      y: 0,
      duration: duration * 0.5,
      ease,
    });
  }

  /**
   * Create wave idle animation
   */
  private createWaveAnimation(
    timeline: gsap.core.Timeline,
    filter: DisplacementFilter,
    options: { intensity: number; duration: number; ease: string }
  ): void {
    const { intensity, duration, ease } = options;
    const waveScale = 25 * intensity;

    timeline.to(filter.scale, {
      x: waveScale,
      duration: duration * 0.25,
      ease,
    });

    timeline.to(filter.scale, {
      x: -waveScale,
      duration: duration * 0.5,
      ease,
    });

    timeline.to(filter.scale, {
      x: 0,
      duration: duration * 0.25,
      ease,
    });
  }

  /**
   * Create subtle idle animation
   */
  private createSubtleAnimation(
    timeline: gsap.core.Timeline,
    filter: DisplacementFilter,
    options: { intensity: number; duration: number; ease: string }
  ): void {
    const { intensity, duration, ease } = options;
    const subtleScale = 8 * intensity;

    timeline.to(filter.scale, {
      x: subtleScale * 0.7,
      y: subtleScale,
      duration: duration,
      ease,
    });

    timeline.to(filter.scale, {
      x: 0,
      y: 0,
      duration: duration * 0.5,
      ease,
    });
  }
}
