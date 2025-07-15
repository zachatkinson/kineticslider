/**
 * @fileoverview TransformAnimator - Optimized transform animations
 *
 * Specialized class for high-performance transform animations with GSAP.
 * Supports complex transform chains, matrix operations, and GPU acceleration.
 * Optimized for memory efficiency and 60fps performance.
 *
 * @version 1.0.0
 */

import { gsap } from 'gsap';
import { PixiPlugin } from 'gsap/PixiPlugin';
import { Sprite, Container, Matrix } from 'pixi.js';

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
} from '../core/constants';
import { getBaseScale } from '../core/sprite-helpers';

/**
 * Transform animation configuration
 */
export interface TransformAnimationConfig extends AnimationConfig {
  /** Position transforms */
  position?: {
    x?: number;
    y?: number;
    z?: number; // For 3D transforms
  };
  /** Scale transforms */
  scale?: {
    x?: number;
    y?: number;
    uniform?: number; // Uniform scaling
  };
  /** Rotation transforms (in radians) */
  rotation?: {
    x?: number;
    y?: number;
    z?: number;
  };
  /** Skew transforms (in radians) */
  skew?: {
    x?: number;
    y?: number;
  };
  /** Transform origin (0-1 normalized coordinates) */
  transformOrigin?: {
    x: number;
    y: number;
  };
  /** Animation duration */
  duration?: number;
  /** GSAP easing function */
  ease?: string;
  /** Animation delay */
  delay?: number;
  /** Whether to use GPU acceleration */
  force3D?: boolean;
  /** Custom transform matrix */
  matrix?: Matrix;
  /** Callback functions */
  onStart?: () => void;
  onComplete?: () => void;
  onUpdate?: () => void;
}

/**
 * Transform chain configuration for complex animations
 */
export interface TransformChainConfig {
  /** Array of transform steps */
  transforms: TransformAnimationConfig[];
  /** Execution mode */
  mode: 'sequential' | 'parallel' | 'staggered';
  /** Stagger delay for staggered mode */
  staggerDelay?: number;
  /** Whether to loop the chain */
  loop?: boolean;
  /** Number of loop iterations (-1 for infinite) */
  loopCount?: number;
  /** Master chain configuration */
  masterConfig?: {
    duration?: number;
    ease?: string;
    onStart?: () => void;
    onComplete?: () => void;
  };
}

/**
 * Performance optimization configuration
 */
export interface TransformPerformanceConfig {
  /** Use matrix operations where possible */
  useMatrixOperations: boolean;
  /** Batch transform updates */
  batchUpdates: boolean;
  /** Batch size for updates */
  batchSize: number;
  /** Throttle update frequency (ms) */
  updateThrottle: number;
  /** Use object pooling for temporary objects */
  useObjectPooling: boolean;
}

/**
 * Transform performance metrics
 */
export interface TransformPerformanceMetrics {
  /** Number of active transform animations */
  activeAnimations: number;
  /** Matrix operations per second */
  matrixOpsPerSecond: number;
  /** Transform batches processed */
  batchesProcessed: number;
  /** Average execution time per transform */
  averageExecutionTime: number;
  /** GPU memory usage for transforms */
  gpuMemoryUsage: number;
  /** Transform cache hit rate */
  cacheHitRate: number;
}

/**
 * TransformAnimator - Optimized transform animations
 *
 * Provides high-performance transform animations with advanced features
 * like matrix operations, transform chaining, and GPU acceleration.
 */
export class TransformAnimator {
  private activeAnimations: Map<string, gsap.core.Timeline> = new Map();
  private transformChains: Map<string, TransformAnimationConfig[]> = new Map();
  private performanceConfig: TransformPerformanceConfig;
  private performanceMetrics: TransformPerformanceMetrics;
  private animationIdCounter = 0;
  private transformCache: Map<string, Matrix> = new Map();
  private batchQueue: Array<{
    target: Sprite | Container;
    config: TransformAnimationConfig;
  }> = [];
  private lastBatchTime = 0;

  constructor(performanceConfig: Partial<TransformPerformanceConfig> = {}) {
    this.performanceConfig = {
      useMatrixOperations: true,
      batchUpdates: true,
      batchSize: 10,
      updateThrottle: 16, // ~60fps
      useObjectPooling: true,
      ...performanceConfig,
    };
    this.performanceMetrics = this.createDefaultMetrics();
  }

  /**
   * Animate transform properties with GPU optimization
   *
   * @param target - PIXI object to animate
   * @param config - Transform animation configuration
   * @returns GSAP timeline for the transform animation
   */
  animateTransform(
    target: Sprite | Container,
    config: TransformAnimationConfig
  ): gsap.core.Timeline {
    const animationId = this.generateAnimationId();

    if (this.performanceConfig.batchUpdates) {
      return this.addToBatch(target, config, animationId);
    }

    return this.createTransformAnimation(target, config, animationId);
  }

  /**
   * Animate complex transform chain
   *
   * @param target - PIXI object to animate
   * @param chainConfig - Transform chain configuration
   * @returns GSAP timeline for the entire transform chain
   */
  animateTransformChain(
    target: Sprite | Container,
    chainConfig: TransformChainConfig
  ): gsap.core.Timeline {
    const animationId = this.generateAnimationId();
    const masterTimeline = gsap.timeline({
      ...GSAP_DEFAULTS.TIMELINE,
      repeat: chainConfig.loop ? (chainConfig.loopCount ?? -1) : 0,
      onStart: () => {
        this.onAnimationStart(animationId);
        chainConfig.masterConfig?.onStart?.();
      },
      onComplete: () => {
        this.onAnimationComplete(animationId);
        chainConfig.masterConfig?.onComplete?.();
      },
    });

    // Store chain for tracking
    this.transformChains.set(animationId, chainConfig.transforms);

    switch (chainConfig.mode) {
      case 'sequential':
        this.createSequentialChain(masterTimeline, target, chainConfig);
        break;
      case 'parallel':
        this.createParallelChain(masterTimeline, target, chainConfig);
        break;
      case 'staggered':
        this.createStaggeredChain(masterTimeline, target, chainConfig);
        break;
    }

    this.activeAnimations.set(animationId, masterTimeline);
    this.updatePerformanceMetrics();

    return masterTimeline;
  }

  /**
   * Create optimized scale animation with base scale handling
   *
   * @param target - PIXI object to scale
   * @param targetScale - Target scale value or scale object
   * @param duration - Animation duration
   * @param ease - GSAP easing function
   * @returns GSAP timeline for the scale animation
   */
  animateScale(
    target: Sprite | Container,
    targetScale: number | { x: number; y: number },
    duration: number = ANIMATION_DURATION.FAST,
    ease: string = EASING.EASE_OUT
  ): gsap.core.Timeline {
    const config: TransformAnimationConfig = {
      scale:
        typeof targetScale === 'number'
          ? { uniform: targetScale }
          : targetScale,
      duration,
      ease,
      force3D: true,
    };

    return this.animateTransform(target, config);
  }

  /**
   * Create rotation animation with proper origin handling
   *
   * @param target - PIXI object to rotate
   * @param rotation - Target rotation in radians
   * @param duration - Animation duration
   * @param transformOrigin - Rotation origin point
   * @returns GSAP timeline for the rotation animation
   */
  animateRotation(
    target: Sprite | Container,
    rotation: number,
    duration: number = ANIMATION_DURATION.STANDARD,
    transformOrigin?: { x: number; y: number }
  ): gsap.core.Timeline {
    const config: TransformAnimationConfig = {
      rotation: { z: rotation },
      transformOrigin: transformOrigin || { x: 0.5, y: 0.5 },
      duration,
      ease: EASING.EASE_OUT,
      force3D: true,
    };

    return this.animateTransform(target, config);
  }

  /**
   * Create position animation with smooth interpolation
   *
   * @param target - PIXI object to move
   * @param position - Target position
   * @param duration - Animation duration
   * @param ease - GSAP easing function
   * @returns GSAP timeline for the position animation
   */
  animatePosition(
    target: Sprite | Container,
    position: { x: number; y: number },
    duration: number = ANIMATION_DURATION.STANDARD,
    ease: string = EASING.EASE_OUT
  ): gsap.core.Timeline {
    const config: TransformAnimationConfig = {
      position,
      duration,
      ease,
      force3D: true,
    };

    return this.animateTransform(target, config);
  }

  /**
   * Create matrix-based transform animation for complex operations
   *
   * @param target - PIXI object to transform
   * @param targetMatrix - Target transformation matrix
   * @param duration - Animation duration
   * @returns GSAP timeline for the matrix animation
   */
  animateMatrix(
    target: Sprite | Container,
    targetMatrix: Matrix,
    duration: number = ANIMATION_DURATION.STANDARD
  ): gsap.core.Timeline {
    const animationId = this.generateAnimationId();
    const timeline = gsap.timeline({
      ...GSAP_DEFAULTS.PERFORMANCE,
      onStart: () => this.onAnimationStart(animationId),
      onComplete: () => this.onAnimationComplete(animationId),
    });

    if (this.performanceConfig.useMatrixOperations) {
      // Use optimized matrix interpolation
      const startMatrix =
        (
          target as unknown as { transform?: { localTransform?: Matrix } }
        ).transform?.localTransform?.clone() || new Matrix();

      timeline.to(
        { progress: 0 },
        {
          progress: 1,
          duration,
          ease: EASING.EASE_OUT,
          onUpdate: () => {
            const progress = timeline.progress();
            const interpolatedMatrix = this.interpolateMatrix(
              startMatrix,
              targetMatrix,
              progress
            );
            const transformTarget = target as unknown as {
              transform?: { setFromMatrix?: (matrix: Matrix) => void };
            };
            if (transformTarget.transform?.setFromMatrix) {
              transformTarget.transform.setFromMatrix(interpolatedMatrix);
            }
          },
        }
      );
    } else {
      // Fallback to individual property animation
      const transformTarget = target as unknown as { transform?: object };
      if (transformTarget.transform) {
        timeline.to(transformTarget.transform, {
          a: targetMatrix.a,
          b: targetMatrix.b,
          c: targetMatrix.c,
          d: targetMatrix.d,
          tx: targetMatrix.tx,
          ty: targetMatrix.ty,
          duration,
          ease: EASING.EASE_OUT,
        });
      }
    }

    this.activeAnimations.set(animationId, timeline);
    return timeline;
  }

  /**
   * Reset all transforms to default state
   *
   * @param target - PIXI object to reset
   * @param animated - Whether to animate the reset
   * @param duration - Reset animation duration
   * @returns GSAP timeline or void
   */
  resetTransforms(
    target: Sprite | Container,
    animated: boolean = true,
    duration: number = ANIMATION_DURATION.FAST
  ): gsap.core.Timeline | void {
    const resetConfig: TransformAnimationConfig = {
      position: { x: 0, y: 0 },
      scale: { uniform: 1 },
      rotation: { z: 0 },
      skew: { x: 0, y: 0 },
      duration: animated ? duration : 0,
      ease: EASING.EASE_OUT,
    };

    if (animated) {
      return this.animateTransform(target, resetConfig);
    } else {
      // Reset immediately
      target.position.set(0, 0);
      target.scale.set(1, 1);
      target.rotation = 0;
      target.skew.set(0, 0);
    }
  }

  /**
   * Process batched transform updates
   */
  processBatch(): void {
    if (this.batchQueue.length === 0) return;

    const now = performance.now();
    if (now - this.lastBatchTime < this.performanceConfig.updateThrottle) {
      return;
    }

    const batchSize = Math.min(
      this.performanceConfig.batchSize,
      this.batchQueue.length
    );

    const batch = this.batchQueue.splice(0, batchSize);
    const batchTimeline = gsap.timeline({
      ...GSAP_DEFAULTS.PERFORMANCE,
      onComplete: () => {
        this.performanceMetrics.batchesProcessed++;
        this.updatePerformanceMetrics();
      },
    });

    batch.forEach(({ target, config }) => {
      const transformTimeline = this.createTransformAnimation(
        target,
        config,
        this.generateAnimationId()
      );
      batchTimeline.add(transformTimeline, 0);
    });

    this.lastBatchTime = now;
  }

  /**
   * Get current performance metrics
   *
   * @returns Current transform performance metrics
   */
  getPerformanceMetrics(): TransformPerformanceMetrics {
    this.updatePerformanceMetrics();
    return { ...this.performanceMetrics };
  }

  /**
   * Kill specific transform animation
   *
   * @param animationId - Animation ID to kill
   */
  killAnimation(animationId: string): void {
    const timeline = this.activeAnimations.get(animationId);
    if (timeline) {
      timeline.kill();
      this.activeAnimations.delete(animationId);
      this.transformChains.delete(animationId);
      this.updatePerformanceMetrics();
    }
  }

  /**
   * Kill all active transform animations
   */
  killAllAnimations(): void {
    this.activeAnimations.forEach((timeline) => timeline.kill());
    this.activeAnimations.clear();
    this.transformChains.clear();
    this.batchQueue.length = 0;
    this.updatePerformanceMetrics();
  }

  /**
   * Dispose of transform animator and cleanup resources
   */
  dispose(): void {
    this.killAllAnimations();
    this.transformCache.clear();
    this.performanceMetrics = this.createDefaultMetrics();
  }

  // =============================================================================
  // Private Helper Methods
  // =============================================================================

  /**
   * Generate unique animation ID
   */
  private generateAnimationId(): string {
    return `transform_${++this.animationIdCounter}_${Date.now()}`;
  }

  /**
   * Add transform to batch queue
   */
  private addToBatch(
    target: Sprite | Container,
    config: TransformAnimationConfig,
    animationId: string
  ): gsap.core.Timeline {
    this.batchQueue.push({ target, config });

    // Process batch if queue is full
    if (this.batchQueue.length >= this.performanceConfig.batchSize) {
      this.processBatch();
    }

    // Return placeholder timeline for immediate use
    const timeline = gsap.timeline({
      ...GSAP_DEFAULTS.PERFORMANCE,
      onStart: () => this.onAnimationStart(animationId),
      onComplete: () => this.onAnimationComplete(animationId),
    });

    this.activeAnimations.set(animationId, timeline);
    return timeline;
  }

  /**
   * Create single transform animation
   */
  private createTransformAnimation(
    target: Sprite | Container,
    config: TransformAnimationConfig,
    animationId: string
  ): gsap.core.Timeline {
    const timeline = gsap.timeline({
      ...GSAP_DEFAULTS.PERFORMANCE,
      onStart: () => this.onAnimationStart(animationId),
      onComplete: () => this.onAnimationComplete(animationId),
      onUpdate: config.onUpdate,
    });

    const animationProps = this.buildTransformProps(target, config);

    timeline.to(target, {
      ...animationProps,
      duration: config.duration ?? ANIMATION_DURATION.STANDARD,
      ease: config.ease ?? EASING.EASE_OUT,
      delay: config.delay ?? 0,
      force3D: config.force3D ?? true,
      transformOrigin: config.transformOrigin
        ? `${config.transformOrigin.x * 100}% ${config.transformOrigin.y * 100}%`
        : 'center center',
    });

    return timeline;
  }

  /**
   * Build transform animation properties
   */
  private buildTransformProps(
    target: Sprite | Container,
    config: TransformAnimationConfig
  ): Record<string, unknown> {
    const props: Record<string, unknown> = {};

    // Position properties
    if (config.position) {
      if (config.position.x !== undefined) props.x = config.position.x;
      if (config.position.y !== undefined) props.y = config.position.y;
    }

    // Scale properties
    if (config.scale) {
      if (config.scale.uniform !== undefined) {
        const baseScale = getBaseScale(target as Sprite);
        const targetScale = Math.max(
          SCALE.MIN,
          Math.min(SCALE.MAX, config.scale.uniform)
        );
        const finalScale = baseScale * targetScale;

        props.scaleX = finalScale;
        props.scaleY = finalScale;
      } else {
        if (config.scale.x !== undefined) props.scaleX = config.scale.x;
        if (config.scale.y !== undefined) props.scaleY = config.scale.y;
      }
    }

    // Rotation properties
    if (config.rotation) {
      if (config.rotation.z !== undefined) props.rotation = config.rotation.z;
      // 3D rotations would require additional setup
    }

    // Skew properties
    if (config.skew) {
      if (config.skew.x !== undefined) props.skewX = config.skew.x;
      if (config.skew.y !== undefined) props.skewY = config.skew.y;
    }

    return props;
  }

  /**
   * Create sequential transform chain
   */
  private createSequentialChain(
    masterTimeline: gsap.core.Timeline,
    target: Sprite | Container,
    chainConfig: TransformChainConfig
  ): void {
    let currentTime = 0;

    chainConfig.transforms.forEach((config) => {
      const transformTimeline = this.createTransformAnimation(
        target,
        config,
        this.generateAnimationId()
      );

      masterTimeline.add(transformTimeline, currentTime);
      currentTime += config.duration ?? ANIMATION_DURATION.STANDARD;
    });
  }

  /**
   * Create parallel transform chain
   */
  private createParallelChain(
    masterTimeline: gsap.core.Timeline,
    target: Sprite | Container,
    chainConfig: TransformChainConfig
  ): void {
    chainConfig.transforms.forEach((config) => {
      const transformTimeline = this.createTransformAnimation(
        target,
        config,
        this.generateAnimationId()
      );

      masterTimeline.add(transformTimeline, 0);
    });
  }

  /**
   * Create staggered transform chain
   */
  private createStaggeredChain(
    masterTimeline: gsap.core.Timeline,
    target: Sprite | Container,
    chainConfig: TransformChainConfig
  ): void {
    const staggerDelay = chainConfig.staggerDelay ?? 0.1;

    chainConfig.transforms.forEach((config, index) => {
      const transformTimeline = this.createTransformAnimation(
        target,
        config,
        this.generateAnimationId()
      );

      masterTimeline.add(transformTimeline, index * staggerDelay);
    });
  }

  /**
   * Interpolate between two matrices
   */
  private interpolateMatrix(
    startMatrix: Matrix,
    endMatrix: Matrix,
    progress: number
  ): Matrix {
    const result = new Matrix();

    result.a = startMatrix.a + (endMatrix.a - startMatrix.a) * progress;
    result.b = startMatrix.b + (endMatrix.b - startMatrix.b) * progress;
    result.c = startMatrix.c + (endMatrix.c - startMatrix.c) * progress;
    result.d = startMatrix.d + (endMatrix.d - startMatrix.d) * progress;
    result.tx = startMatrix.tx + (endMatrix.tx - startMatrix.tx) * progress;
    result.ty = startMatrix.ty + (endMatrix.ty - startMatrix.ty) * progress;

    return result;
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
    this.transformChains.delete(animationId);
    this.updatePerformanceMetrics();
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(): void {
    const startTime = performance.now();

    this.performanceMetrics.activeAnimations = this.activeAnimations.size;
    this.performanceMetrics.gpuMemoryUsage = this.calculateGPUMemoryUsage();
    this.performanceMetrics.averageExecutionTime =
      performance.now() - startTime;

    // Calculate cache hit rate
    const totalCacheAccess = this.transformCache.size;
    this.performanceMetrics.cacheHitRate = totalCacheAccess > 0 ? 0.85 : 0; // Placeholder
  }

  /**
   * Calculate estimated GPU memory usage
   */
  private calculateGPUMemoryUsage(): number {
    // Simplified calculation - each active animation uses ~1KB
    return this.activeAnimations.size * 1024;
  }

  /**
   * Create default performance metrics
   */
  private createDefaultMetrics(): TransformPerformanceMetrics {
    return {
      activeAnimations: 0,
      matrixOpsPerSecond: 0,
      batchesProcessed: 0,
      averageExecutionTime: 0,
      gpuMemoryUsage: 0,
      cacheHitRate: 0,
    };
  }
}
