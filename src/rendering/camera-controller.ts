/**
 * @fileoverview CameraController - Smooth viewport animations
 *
 * Advanced camera control system for smooth viewport navigation with GSAP.
 * Supports zoom, pan, rotation with viewport constraints and easing physics.
 * Optimized for responsive design and orientation changes.
 *
 * @version 1.0.0
 */

import { gsap } from 'gsap';
import { PixiPlugin } from 'gsap/PixiPlugin';
import type { Container, Rectangle } from 'pixi.js';

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

/**
 * Camera viewport configuration
 */
export interface CameraViewport {
  /** Viewport width */
  width: number;
  /** Viewport height */
  height: number;
  /** Current zoom level */
  zoom: number;
  /** Camera position */
  position: {
    x: number;
    y: number;
  };
  /** Camera rotation in radians */
  rotation: number;
}

/**
 * Camera animation configuration
 */
export interface CameraAnimationConfig extends AnimationConfig {
  /** Target camera position */
  position?: {
    x?: number;
    y?: number;
  };
  /** Target zoom level */
  zoom?: number;
  /** Target rotation in radians */
  rotation?: number;
  /** Animation duration */
  duration?: number;
  /** GSAP easing function */
  ease?: string;
  /** Animation delay */
  delay?: number;
  /** Smooth camera easing physics */
  physics?: {
    /** Momentum damping factor */
    damping: number;
    /** Spring stiffness */
    stiffness: number;
    /** Friction coefficient */
    friction: number;
  };
  /** Callback functions */
  onStart?: () => void;
  onComplete?: () => void;
  onUpdate?: (viewport: CameraViewport) => void;
}

/**
 * Camera constraints configuration
 */
export interface CameraConstraints {
  /** Position boundaries */
  bounds?: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
  /** Zoom level constraints */
  zoom?: {
    min: number;
    max: number;
  };
  /** Rotation constraints */
  rotation?: {
    min: number;
    max: number;
  };
  /** Enable constraint enforcement */
  enforceConstraints: boolean;
}

/**
 * Responsive camera configuration
 */
export interface ResponsiveCameraConfig {
  /** Breakpoint definitions */
  breakpoints: Array<{
    name: string;
    minWidth: number;
    maxWidth?: number;
    camera: Partial<CameraViewport>;
  }>;
  /** Transition duration between breakpoints */
  transitionDuration: number;
  /** Whether to auto-adjust on resize */
  autoAdjust: boolean;
  /** Orientation handling */
  orientation: {
    /** Portrait mode configuration */
    portrait?: Partial<CameraViewport>;
    /** Landscape mode configuration */
    landscape?: Partial<CameraViewport>;
    /** Transition duration for orientation change */
    transitionDuration: number;
  };
}

/**
 * Camera performance metrics
 */
export interface CameraPerformanceMetrics {
  /** Number of active camera animations */
  activeAnimations: number;
  /** Viewport update frequency (Hz) */
  updateFrequency: number;
  /** Average frame time for camera operations */
  averageFrameTime: number;
  /** Current zoom level */
  currentZoom: number;
  /** Camera movement velocity */
  velocity: {
    x: number;
    y: number;
  };
}

/**
 * CameraController - Smooth viewport animations
 *
 * Provides comprehensive camera control with smooth animations, constraints,
 * and responsive design support.
 */
export class CameraController {
  private container: Container;
  private viewport: CameraViewport;
  private constraints: CameraConstraints;
  private responsiveConfig?: ResponsiveCameraConfig;
  private activeAnimations: Map<string, gsap.core.Timeline> = new Map();
  private performanceMetrics: CameraPerformanceMetrics;
  private animationIdCounter = 0;
  private lastUpdateTime = 0;
  private velocityHistory: Array<{ x: number; y: number; time: number }> = [];

  constructor(
    container: Container,
    initialViewport: Partial<CameraViewport> = {},
    constraints: Partial<CameraConstraints> = {}
  ) {
    this.container = container;
    this.viewport = {
      width: 1920,
      height: 1080,
      zoom: 1.0,
      position: { x: 0, y: 0 },
      rotation: 0,
      ...initialViewport,
    };
    this.constraints = {
      enforceConstraints: true,
      zoom: { min: SCALE.MIN, max: SCALE.MAX },
      ...constraints,
    };
    this.performanceMetrics = this.createDefaultMetrics();

    this.applyViewportToContainer();
  }

  /**
   * Animate camera to target position with smooth easing
   *
   * @param config - Camera animation configuration
   * @returns GSAP timeline for the camera animation
   */
  animateTo(config: CameraAnimationConfig): gsap.core.Timeline {
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
      onUpdate: () => {
        this.applyViewportToContainer();
        this.updateVelocityHistory();
        config.onUpdate?.(this.viewport);
      },
    });

    // Build target viewport with constraint validation
    const targetViewport = this.buildTargetViewport(config);

    // Create smooth camera animation
    if (targetViewport.position) {
      timeline.to(
        this.viewport.position,
        {
          x: targetViewport.position.x,
          y: targetViewport.position.y,
          duration: config.duration ?? ANIMATION_DURATION.MEDIUM,
          ease: config.ease ?? EASING.EASE_OUT,
          delay: config.delay ?? 0,
        },
        0
      );
    }

    if (targetViewport.zoom !== undefined) {
      timeline.to(
        this.viewport,
        {
          zoom: targetViewport.zoom,
          duration: config.duration ?? ANIMATION_DURATION.MEDIUM,
          ease: config.ease ?? EASING.EASE_OUT,
          delay: config.delay ?? 0,
        },
        0
      );
    }

    if (targetViewport.rotation !== undefined) {
      timeline.to(
        this.viewport,
        {
          rotation: targetViewport.rotation,
          duration: config.duration ?? ANIMATION_DURATION.MEDIUM,
          ease: config.ease ?? EASING.EASE_OUT,
          delay: config.delay ?? 0,
        },
        0
      );
    }

    // Add physics-based easing if configured
    if (config.physics) {
      this.applyPhysicsEasing(timeline, config.physics);
    }

    this.activeAnimations.set(animationId, timeline);
    this.updatePerformanceMetrics();

    return timeline;
  }

  /**
   * Zoom camera to specific level with smooth animation
   *
   * @param targetZoom - Target zoom level
   * @param duration - Animation duration
   * @param ease - GSAP easing function
   * @returns GSAP timeline for the zoom animation
   */
  zoomTo(
    targetZoom: number,
    duration: number = ANIMATION_DURATION.STANDARD,
    ease: string = EASING.EASE_OUT
  ): gsap.core.Timeline {
    return this.animateTo({
      zoom: targetZoom,
      duration,
      ease,
    });
  }

  /**
   * Pan camera to specific position with smooth animation
   *
   * @param targetPosition - Target camera position
   * @param duration - Animation duration
   * @param ease - GSAP easing function
   * @returns GSAP timeline for the pan animation
   */
  panTo(
    targetPosition: { x: number; y: number },
    duration: number = ANIMATION_DURATION.STANDARD,
    ease: string = EASING.EASE_OUT
  ): gsap.core.Timeline {
    return this.animateTo({
      position: targetPosition,
      duration,
      ease,
    });
  }

  /**
   * Rotate camera to specific angle with smooth animation
   *
   * @param targetRotation - Target rotation in radians
   * @param duration - Animation duration
   * @param ease - GSAP easing function
   * @returns GSAP timeline for the rotation animation
   */
  rotateTo(
    targetRotation: number,
    duration: number = ANIMATION_DURATION.STANDARD,
    ease: string = EASING.EASE_OUT
  ): gsap.core.Timeline {
    return this.animateTo({
      rotation: targetRotation,
      duration,
      ease,
    });
  }

  /**
   * Focus camera on specific point with zoom
   *
   * @param targetPoint - Point to focus on
   * @param zoomLevel - Zoom level for focus
   * @param duration - Animation duration
   * @returns GSAP timeline for the focus animation
   */
  focusOn(
    targetPoint: { x: number; y: number },
    zoomLevel: number = 2.0,
    duration: number = ANIMATION_DURATION.MEDIUM
  ): gsap.core.Timeline {
    // Calculate position to center the target point
    const centerX = this.viewport.width / 2;
    const centerY = this.viewport.height / 2;

    const targetPosition = {
      x: centerX - targetPoint.x * zoomLevel,
      y: centerY - targetPoint.y * zoomLevel,
    };

    return this.animateTo({
      position: targetPosition,
      zoom: zoomLevel,
      duration,
      ease: EASING.EASE_IN_OUT,
    });
  }

  /**
   * Fit content within viewport with padding
   *
   * @param contentBounds - Bounds of content to fit
   * @param padding - Padding around content
   * @param duration - Animation duration
   * @returns GSAP timeline for the fit animation
   */
  fitToContent(
    contentBounds: Rectangle,
    padding: number = 50,
    duration: number = ANIMATION_DURATION.MEDIUM
  ): gsap.core.Timeline {
    // Calculate zoom to fit content with padding
    const availableWidth = this.viewport.width - padding * 2;
    const availableHeight = this.viewport.height - padding * 2;

    const scaleX = availableWidth / contentBounds.width;
    const scaleY = availableHeight / contentBounds.height;
    const targetZoom = Math.min(scaleX, scaleY);

    // Calculate position to center content
    const centerX = this.viewport.width / 2;
    const centerY = this.viewport.height / 2;
    const contentCenterX = contentBounds.x + contentBounds.width / 2;
    const contentCenterY = contentBounds.y + contentBounds.height / 2;

    const targetPosition = {
      x: centerX - contentCenterX * targetZoom,
      y: centerY - contentCenterY * targetZoom,
    };

    return this.animateTo({
      position: targetPosition,
      zoom: targetZoom,
      duration,
      ease: EASING.EASE_IN_OUT,
    });
  }

  /**
   * Configure responsive camera behavior
   *
   * @param config - Responsive camera configuration
   */
  setResponsiveConfig(config: ResponsiveCameraConfig): void {
    this.responsiveConfig = config;

    if (config.autoAdjust) {
      this.updateForCurrentViewport();
    }
  }

  /**
   * Handle viewport resize with smooth transition
   *
   * @param width - New viewport width
   * @param height - New viewport height
   * @param animated - Whether to animate the resize
   * @returns GSAP timeline if animated
   */
  handleResize(
    width: number,
    height: number,
    animated: boolean = true
  ): gsap.core.Timeline | void {
    const newViewport = { ...this.viewport, width, height };

    if (animated) {
      return this.animateTo({
        position: newViewport.position,
        zoom: newViewport.zoom,
        duration:
          this.responsiveConfig?.transitionDuration ?? ANIMATION_DURATION.FAST,
        ease: EASING.EASE_OUT,
      });
    } else {
      this.viewport.width = width;
      this.viewport.height = height;
      this.applyViewportToContainer();
    }
  }

  /**
   * Handle orientation change with smooth transition
   *
   * @param isPortrait - Whether the new orientation is portrait
   * @returns GSAP timeline for the orientation change
   */
  handleOrientationChange(isPortrait: boolean): gsap.core.Timeline | null {
    if (!this.responsiveConfig?.orientation) return null;

    const orientationConfig = isPortrait
      ? this.responsiveConfig.orientation.portrait
      : this.responsiveConfig.orientation.landscape;

    if (!orientationConfig) return null;

    return this.animateTo({
      ...orientationConfig,
      duration: this.responsiveConfig.orientation.transitionDuration,
      ease: EASING.EASE_IN_OUT,
    });
  }

  /**
   * Reset camera to default state
   *
   * @param animated - Whether to animate the reset
   * @param duration - Reset animation duration
   * @returns GSAP timeline if animated
   */
  reset(
    animated: boolean = true,
    duration: number = ANIMATION_DURATION.STANDARD
  ): gsap.core.Timeline | void {
    const defaultViewport = {
      position: { x: 0, y: 0 },
      zoom: 1.0,
      rotation: 0,
    };

    if (animated) {
      return this.animateTo({
        ...defaultViewport,
        duration,
        ease: EASING.EASE_OUT,
      });
    } else {
      Object.assign(this.viewport, defaultViewport);
      this.applyViewportToContainer();
    }
  }

  /**
   * Get current viewport state
   *
   * @returns Current camera viewport
   */
  getViewport(): CameraViewport {
    return { ...this.viewport };
  }

  /**
   * Set camera constraints
   *
   * @param constraints - New camera constraints
   */
  setConstraints(constraints: Partial<CameraConstraints>): void {
    this.constraints = { ...this.constraints, ...constraints };

    if (this.constraints.enforceConstraints) {
      this.enforceConstraints();
    }
  }

  /**
   * Get current performance metrics
   *
   * @returns Current camera performance metrics
   */
  getPerformanceMetrics(): CameraPerformanceMetrics {
    this.updatePerformanceMetrics();
    return { ...this.performanceMetrics };
  }

  /**
   * Kill specific camera animation
   *
   * @param animationId - Animation ID to kill
   */
  killAnimation(animationId: string): void {
    const timeline = this.activeAnimations.get(animationId);
    if (timeline) {
      timeline.kill();
      this.activeAnimations.delete(animationId);
      this.updatePerformanceMetrics();
    }
  }

  /**
   * Kill all active camera animations
   */
  killAllAnimations(): void {
    this.activeAnimations.forEach((timeline) => timeline.kill());
    this.activeAnimations.clear();
    this.updatePerformanceMetrics();
  }

  /**
   * Dispose of camera controller and cleanup resources
   */
  dispose(): void {
    this.killAllAnimations();
    this.velocityHistory.length = 0;
    this.performanceMetrics = this.createDefaultMetrics();
  }

  // =============================================================================
  // Private Helper Methods
  // =============================================================================

  /**
   * Generate unique animation ID
   */
  private generateAnimationId(): string {
    return `camera_${++this.animationIdCounter}_${Date.now()}`;
  }

  /**
   * Apply viewport transformations to container
   */
  private applyViewportToContainer(): void {
    this.container.position.set(
      this.viewport.position.x,
      this.viewport.position.y
    );
    this.container.scale.set(this.viewport.zoom, this.viewport.zoom);
    this.container.rotation = this.viewport.rotation;
  }

  /**
   * Build target viewport with constraint validation
   */
  private buildTargetViewport(
    config: CameraAnimationConfig
  ): Partial<CameraViewport> {
    const target: Partial<CameraViewport> = {};

    // Position
    if (config.position) {
      target.position = { ...this.viewport.position, ...config.position };
    }

    // Zoom
    if (config.zoom !== undefined) {
      target.zoom = config.zoom;
    }

    // Rotation
    if (config.rotation !== undefined) {
      target.rotation = config.rotation;
    }

    // Apply constraints
    if (this.constraints.enforceConstraints) {
      return this.applyConstraintsToTarget(target);
    }

    return target;
  }

  /**
   * Apply constraints to target viewport
   */
  private applyConstraintsToTarget(
    target: Partial<CameraViewport>
  ): Partial<CameraViewport> {
    const constrained = { ...target };

    // Position constraints
    if (constrained.position && this.constraints.bounds) {
      constrained.position.x = Math.max(
        this.constraints.bounds.minX,
        Math.min(this.constraints.bounds.maxX, constrained.position.x)
      );
      constrained.position.y = Math.max(
        this.constraints.bounds.minY,
        Math.min(this.constraints.bounds.maxY, constrained.position.y)
      );
    }

    // Zoom constraints
    if (constrained.zoom !== undefined && this.constraints.zoom) {
      constrained.zoom = Math.max(
        this.constraints.zoom.min,
        Math.min(this.constraints.zoom.max, constrained.zoom)
      );
    }

    // Rotation constraints
    if (constrained.rotation !== undefined && this.constraints.rotation) {
      constrained.rotation = Math.max(
        this.constraints.rotation.min,
        Math.min(this.constraints.rotation.max, constrained.rotation)
      );
    }

    return constrained;
  }

  /**
   * Enforce constraints on current viewport
   */
  private enforceConstraints(): void {
    const constrained = this.applyConstraintsToTarget(this.viewport);
    Object.assign(this.viewport, constrained);
    this.applyViewportToContainer();
  }

  /**
   * Apply physics-based easing to timeline
   */
  private applyPhysicsEasing(
    timeline: gsap.core.Timeline,
    physics: NonNullable<CameraAnimationConfig['physics']>
  ): void {
    // This would implement custom physics easing
    // For now, we'll modify the ease based on physics parameters
    const customEase = `power${Math.round(physics.stiffness * 4)}.out`;
    timeline.vars.ease = customEase;
  }

  /**
   * Update camera for current viewport size
   */
  private updateForCurrentViewport(): void {
    if (!this.responsiveConfig) return;

    const currentWidth = this.viewport.width;
    const matchingBreakpoint = this.responsiveConfig.breakpoints.find(
      (bp) =>
        currentWidth >= bp.minWidth &&
        (!bp.maxWidth || currentWidth <= bp.maxWidth)
    );

    if (matchingBreakpoint?.camera) {
      this.animateTo({
        ...matchingBreakpoint.camera,
        duration: this.responsiveConfig.transitionDuration,
        ease: EASING.EASE_OUT,
      });
    }
  }

  /**
   * Update velocity history for performance tracking
   */
  private updateVelocityHistory(): void {
    const now = performance.now();
    const deltaTime = now - this.lastUpdateTime;

    if (deltaTime > 0 && this.velocityHistory.length > 0) {
      const lastEntry = this.velocityHistory[this.velocityHistory.length - 1];
      const deltaX = this.viewport.position.x - lastEntry.x;
      const deltaY = this.viewport.position.y - lastEntry.y;

      this.performanceMetrics.velocity = {
        x: (deltaX / deltaTime) * 1000, // px/second
        y: (deltaY / deltaTime) * 1000,
      };
    }

    this.velocityHistory.push({
      x: this.viewport.position.x,
      y: this.viewport.position.y,
      time: now,
    });

    // Keep only recent history
    if (this.velocityHistory.length > 10) {
      this.velocityHistory.shift();
    }

    this.lastUpdateTime = now;
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
    this.updatePerformanceMetrics();
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(): void {
    const startTime = performance.now();

    this.performanceMetrics.activeAnimations = this.activeAnimations.size;
    this.performanceMetrics.currentZoom = this.viewport.zoom;
    this.performanceMetrics.averageFrameTime = performance.now() - startTime;

    // Calculate update frequency
    if (this.lastUpdateTime > 0) {
      const deltaTime = performance.now() - this.lastUpdateTime;
      this.performanceMetrics.updateFrequency =
        deltaTime > 0 ? 1000 / deltaTime : 0;
    }
  }

  /**
   * Create default performance metrics
   */
  private createDefaultMetrics(): CameraPerformanceMetrics {
    return {
      activeAnimations: 0,
      updateFrequency: 60,
      averageFrameTime: 0,
      currentZoom: 1.0,
      velocity: { x: 0, y: 0 },
    };
  }
}
