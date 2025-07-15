/**
 * @fileoverview FilterAnimator - GSAP-powered filter animations
 *
 * Specialized class for animating PIXI filters with GSAP coordination.
 * Supports filter chaining, composition, and dynamic quality adjustment.
 * Optimized for 60fps performance with efficient memory management.
 *
 * @version 1.0.0
 */

import { gsap } from 'gsap';
import { PixiPlugin } from 'gsap/PixiPlugin';
import type { Sprite, Container, Filter } from 'pixi.js';

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
  RENDERING_PERFORMANCE,
} from '../core/constants';

/**
 * Configuration for filter animations
 */
export interface FilterAnimationConfig extends AnimationConfig {
  /** Filter properties to animate with their target values */
  properties: Record<string, number>;
  /** Animation duration in seconds */
  duration?: number;
  /** GSAP easing function */
  ease?: string;
  /** Animation delay in seconds */
  delay?: number;
  /** Whether to use keyframe-based animation */
  useKeyframes?: boolean;
  /** Keyframe definitions for complex animations */
  keyframes?: Array<{
    time: number; // 0-1
    properties: Record<string, number>;
  }>;
  /** Callback when animation starts */
  onStart?: () => void;
  /** Callback when animation completes */
  onComplete?: () => void;
  /** Callback for each frame update */
  onUpdate?: () => void;
}

/**
 * Filter chain configuration for multiple filter effects
 */
export interface FilterChainConfig {
  /** Array of filter animation configurations */
  filters: Array<{
    filter: Filter;
    config: FilterAnimationConfig;
  }>;
  /** Whether filters should animate sequentially or in parallel */
  mode: 'sequential' | 'parallel';
  /** Stagger delay for sequential mode */
  staggerDelay?: number;
  /** Master animation configuration */
  masterConfig?: {
    duration?: number;
    ease?: string;
    onStart?: () => void;
    onComplete?: () => void;
  };
}

/**
 * Quality adjustment configuration for performance optimization
 */
export interface QualityConfig {
  /** Current quality level (0-1) */
  level: number;
  /** Automatic quality adjustment based on FPS */
  autoAdjust: boolean;
  /** FPS threshold for quality reduction */
  fpsThreshold: number;
  /** Minimum quality level */
  minQuality: number;
  /** Maximum quality level */
  maxQuality: number;
}

/**
 * Filter performance metrics
 */
export interface FilterPerformanceMetrics {
  /** Number of active filter animations */
  activeAnimations: number;
  /** GPU memory usage for filters */
  filterMemoryUsage: number;
  /** Average execution time per frame */
  executionTime: number;
  /** Current quality level */
  qualityLevel: number;
  /** Filter chain depth */
  chainDepth: number;
}

/**
 * FilterAnimator - GSAP-powered filter animations
 *
 * Provides comprehensive filter animation capabilities with performance optimization
 * and seamless GSAP integration.
 */
export class FilterAnimator {
  private activeAnimations: Map<string, gsap.core.Timeline> = new Map();
  private filterChains: Map<string, Filter[]> = new Map();
  private qualityConfig: QualityConfig;
  private performanceMetrics: FilterPerformanceMetrics;
  private animationIdCounter = 0;

  constructor(initialQuality: QualityConfig = this.createDefaultQuality()) {
    this.qualityConfig = initialQuality;
    this.performanceMetrics = this.createDefaultMetrics();
  }

  /**
   * Animate single filter with GSAP optimization
   *
   * @param target - PIXI object to apply filter to
   * @param filter - Filter to animate
   * @param config - Animation configuration
   * @returns GSAP timeline for the filter animation
   */
  animateFilter(
    target: Sprite | Container,
    filter: Filter,
    config: FilterAnimationConfig
  ): gsap.core.Timeline {
    const animationId = this.generateAnimationId();

    // Apply filter to target if not already applied
    this.ensureFilterApplied(target, filter);

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

    if (config.useKeyframes && config.keyframes) {
      // Create keyframe-based animation
      this.createKeyframeAnimation(timeline, filter, config);
    } else {
      // Create simple property animation
      timeline.to(filter, {
        ...config.properties,
        duration: config.duration ?? ANIMATION_DURATION.STANDARD,
        ease: config.ease ?? EASING.EASE_OUT,
        delay: config.delay ?? 0,
      });
    }

    this.activeAnimations.set(animationId, timeline);
    this.updatePerformanceMetrics();

    return timeline;
  }

  /**
   * Animate multiple filters in a coordinated chain
   *
   * @param target - PIXI object to apply filters to
   * @param chainConfig - Filter chain configuration
   * @returns GSAP timeline for the entire filter chain
   */
  animateFilterChain(
    target: Sprite | Container,
    chainConfig: FilterChainConfig
  ): gsap.core.Timeline {
    const animationId = this.generateAnimationId();
    const masterTimeline = gsap.timeline({
      ...GSAP_DEFAULTS.TIMELINE,
      onStart: () => {
        this.onAnimationStart(animationId);
        chainConfig.masterConfig?.onStart?.();
      },
      onComplete: () => {
        this.onAnimationComplete(animationId);
        chainConfig.masterConfig?.onComplete?.();
      },
    });

    // Store filter chain for tracking
    const filters = chainConfig.filters.map(({ filter }) => filter);
    this.filterChains.set(animationId, filters);

    // Ensure all filters are applied to target
    filters.forEach((filter) => this.ensureFilterApplied(target, filter));

    if (chainConfig.mode === 'sequential') {
      // Animate filters sequentially
      this.createSequentialFilterAnimation(masterTimeline, chainConfig);
    } else {
      // Animate filters in parallel
      this.createParallelFilterAnimation(masterTimeline, chainConfig);
    }

    this.activeAnimations.set(animationId, masterTimeline);
    this.updatePerformanceMetrics();

    return masterTimeline;
  }

  /**
   * Create reusable filter animation pattern
   *
   * @param filterType - Type of filter effect to create
   * @param intensity - Effect intensity (0-1)
   * @param duration - Animation duration
   * @returns Filter animation configuration
   */
  createFilterPattern(
    filterType: 'blur' | 'glow' | 'displacement' | 'color' | 'distortion',
    intensity: number = 0.5,
    duration: number = ANIMATION_DURATION.STANDARD
  ): FilterAnimationConfig {
    const clampedIntensity = Math.max(0, Math.min(1, intensity));

    switch (filterType) {
      case 'blur':
        return {
          properties: {
            blur: clampedIntensity * 10, // Max blur of 10
          },
          duration,
          ease: EASING.EASE_OUT,
        };

      case 'glow':
        return {
          properties: {
            outerStrength: clampedIntensity * 3,
            innerStrength: clampedIntensity * 2,
            color: 0xffffff,
          },
          duration,
          ease: EASING.EASE_OUT,
        };

      case 'displacement':
        return {
          properties: {
            scaleX: clampedIntensity * 50,
            scaleY: clampedIntensity * 50,
          },
          duration,
          ease: EASING.ELASTIC,
        };

      case 'color':
        return {
          properties: {
            brightness: 1 + clampedIntensity * 0.5,
            contrast: 1 + clampedIntensity * 0.3,
          },
          duration,
          ease: EASING.EASE_IN_OUT,
        };

      case 'distortion':
        return {
          properties: {
            amplitude: clampedIntensity * 20,
            wavelength: clampedIntensity * 100,
          },
          duration,
          ease: EASING.BOUNCE,
        };

      default:
        return {
          properties: {},
          duration,
          ease: EASING.EASE_OUT,
        };
    }
  }

  /**
   * Remove filter from target with optional fade-out animation
   *
   * @param target - PIXI object to remove filter from
   * @param filter - Filter to remove
   * @param fadeOut - Whether to animate filter removal
   * @param duration - Fade out duration
   * @returns Promise that resolves when filter is removed
   */
  async removeFilter(
    target: Sprite | Container,
    filter: Filter,
    fadeOut: boolean = true,
    duration: number = ANIMATION_DURATION.FAST
  ): Promise<void> {
    const filters = Array.isArray(target.filters)
      ? target.filters
      : target.filters
        ? [target.filters]
        : [];
    if (!filters.includes(filter)) {
      return Promise.resolve();
    }

    if (fadeOut) {
      // Animate filter properties to neutral values before removal
      const neutralProps = this.getNeutralFilterProperties(filter);

      const timeline = gsap.timeline({
        ...GSAP_DEFAULTS.PERFORMANCE,
        onComplete: () => {
          this.removeFilterFromTarget(target, filter);
        },
      });

      timeline.to(filter, {
        ...neutralProps,
        duration,
        ease: EASING.EASE_IN,
      });

      return new Promise((resolve) => {
        timeline.then(() => resolve());
      });
    } else {
      // Remove filter immediately
      this.removeFilterFromTarget(target, filter);
      return Promise.resolve();
    }
  }

  /**
   * Clear all filters from target
   *
   * @param target - PIXI object to clear filters from
   * @param animated - Whether to animate filter removal
   */
  async clearFilters(
    target: Sprite | Container,
    animated: boolean = true
  ): Promise<void> {
    const filters = Array.isArray(target.filters)
      ? target.filters
      : target.filters
        ? [target.filters]
        : [];
    if (filters.length === 0) {
      return Promise.resolve();
    }

    if (animated) {
      const removePromises = filters.map((filter) =>
        this.removeFilter(target, filter, true, ANIMATION_DURATION.FAST)
      );

      await Promise.all(removePromises);
    } else {
      target.filters = [];
    }
  }

  /**
   * Adjust quality based on performance metrics
   *
   * @param currentFPS - Current frames per second
   */
  adjustQuality(currentFPS: number): void {
    if (!this.qualityConfig.autoAdjust) return;

    const { fpsThreshold, minQuality, maxQuality } = this.qualityConfig;

    if (currentFPS < fpsThreshold && this.qualityConfig.level > minQuality) {
      // Reduce quality
      this.qualityConfig.level = Math.max(
        minQuality,
        this.qualityConfig.level - 0.1
      );
      this.applyQualityAdjustment();
    } else if (
      currentFPS > fpsThreshold + 10 &&
      this.qualityConfig.level < maxQuality
    ) {
      // Increase quality
      this.qualityConfig.level = Math.min(
        maxQuality,
        this.qualityConfig.level + 0.05
      );
      this.applyQualityAdjustment();
    }

    this.performanceMetrics.qualityLevel = this.qualityConfig.level;
  }

  /**
   * Get current performance metrics
   *
   * @returns Current filter performance metrics
   */
  getPerformanceMetrics(): FilterPerformanceMetrics {
    this.updatePerformanceMetrics();
    return { ...this.performanceMetrics };
  }

  /**
   * Kill specific filter animation
   *
   * @param animationId - Animation ID to kill
   */
  killAnimation(animationId: string): void {
    const timeline = this.activeAnimations.get(animationId);
    if (timeline) {
      timeline.kill();
      this.activeAnimations.delete(animationId);
      this.filterChains.delete(animationId);
      this.updatePerformanceMetrics();
    }
  }

  /**
   * Kill all active filter animations
   */
  killAllAnimations(): void {
    this.activeAnimations.forEach((timeline) => timeline.kill());
    this.activeAnimations.clear();
    this.filterChains.clear();
    this.updatePerformanceMetrics();
  }

  /**
   * Dispose of filter animator and cleanup resources
   */
  dispose(): void {
    this.killAllAnimations();
    this.qualityConfig = this.createDefaultQuality();
    this.performanceMetrics = this.createDefaultMetrics();
  }

  // =============================================================================
  // Private Helper Methods
  // =============================================================================

  /**
   * Generate unique animation ID
   */
  private generateAnimationId(): string {
    return `filter_${++this.animationIdCounter}_${Date.now()}`;
  }

  /**
   * Ensure filter is applied to target
   */
  private ensureFilterApplied(
    target: Sprite | Container,
    filter: Filter
  ): void {
    const filters = Array.isArray(target.filters)
      ? target.filters
      : target.filters
        ? [target.filters]
        : [];
    if (!filters.includes(filter)) {
      target.filters = [...filters, filter];
    }
  }

  /**
   * Remove filter from target
   */
  private removeFilterFromTarget(
    target: Sprite | Container,
    filter: Filter
  ): void {
    const filters = Array.isArray(target.filters)
      ? target.filters
      : target.filters
        ? [target.filters]
        : [];
    if (filters.length > 0) {
      const newFilters = filters.filter((f) => f !== filter);
      target.filters = newFilters.length > 0 ? newFilters : [];
    }
  }

  /**
   * Create keyframe-based animation
   */
  private createKeyframeAnimation(
    timeline: gsap.core.Timeline,
    filter: Filter,
    config: FilterAnimationConfig
  ): void {
    if (!config.keyframes) return;

    const duration = config.duration ?? ANIMATION_DURATION.STANDARD;

    config.keyframes.forEach((keyframe) => {
      timeline.to(
        filter,
        {
          ...keyframe.properties,
          duration: duration * keyframe.time,
          ease: config.ease ?? EASING.EASE_OUT,
        },
        keyframe.time * duration
      );
    });
  }

  /**
   * Create sequential filter animation
   */
  private createSequentialFilterAnimation(
    masterTimeline: gsap.core.Timeline,
    chainConfig: FilterChainConfig
  ): void {
    const staggerDelay = chainConfig.staggerDelay ?? 0.1;

    chainConfig.filters.forEach(({ filter, config }, index) => {
      const filterTimeline = gsap.timeline();

      if (config.useKeyframes && config.keyframes) {
        this.createKeyframeAnimation(filterTimeline, filter, config);
      } else {
        filterTimeline.to(filter, {
          ...config.properties,
          duration: config.duration ?? ANIMATION_DURATION.STANDARD,
          ease: config.ease ?? EASING.EASE_OUT,
        });
      }

      masterTimeline.add(filterTimeline, index * staggerDelay);
    });
  }

  /**
   * Create parallel filter animation
   */
  private createParallelFilterAnimation(
    masterTimeline: gsap.core.Timeline,
    chainConfig: FilterChainConfig
  ): void {
    chainConfig.filters.forEach(({ filter, config }) => {
      const filterTimeline = gsap.timeline();

      if (config.useKeyframes && config.keyframes) {
        this.createKeyframeAnimation(filterTimeline, filter, config);
      } else {
        filterTimeline.to(filter, {
          ...config.properties,
          duration: config.duration ?? ANIMATION_DURATION.STANDARD,
          ease: config.ease ?? EASING.EASE_OUT,
        });
      }

      masterTimeline.add(filterTimeline, 0);
    });
  }

  /**
   * Get neutral properties for filter removal
   */
  private getNeutralFilterProperties(_filter: Filter): Record<string, number> {
    // This would need to be implemented based on specific filter types
    // For now, return empty object as placeholder
    return {};
  }

  /**
   * Apply quality adjustment to active animations
   */
  private applyQualityAdjustment(): void {
    // Implementation would adjust filter quality based on current level
    // This is a placeholder for actual quality adjustment logic
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
    this.activeAnimations.delete(animationId);
    this.filterChains.delete(animationId);
    this.updatePerformanceMetrics();
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(): void {
    const startTime = performance.now();

    this.performanceMetrics.activeAnimations = this.activeAnimations.size;
    this.performanceMetrics.filterMemoryUsage =
      this.calculateFilterMemoryUsage();
    this.performanceMetrics.executionTime = performance.now() - startTime;
    this.performanceMetrics.qualityLevel = this.qualityConfig.level;
    this.performanceMetrics.chainDepth = Math.max(
      ...Array.from(this.filterChains.values()).map((chain) => chain.length),
      0
    );
  }

  /**
   * Calculate estimated filter memory usage
   */
  private calculateFilterMemoryUsage(): number {
    // Simplified calculation - each filter chain uses approximately 2KB
    return this.filterChains.size * 2048;
  }

  /**
   * Create default quality configuration
   */
  private createDefaultQuality(): QualityConfig {
    return {
      level: 1.0,
      autoAdjust: true,
      fpsThreshold: RENDERING_PERFORMANCE.WARNING_THRESHOLDS.FPS_LOW,
      minQuality: 0.3,
      maxQuality: 1.0,
    };
  }

  /**
   * Create default performance metrics
   */
  private createDefaultMetrics(): FilterPerformanceMetrics {
    return {
      activeAnimations: 0,
      filterMemoryUsage: 0,
      executionTime: 0,
      qualityLevel: 1.0,
      chainDepth: 0,
    };
  }
}
