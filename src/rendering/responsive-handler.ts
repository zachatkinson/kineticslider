/**
 * @fileoverview ResponsiveHandler - Dynamic resize with GSAP transitions
 *
 * Advanced responsive design handler with fluid GSAP transitions.
 * Manages breakpoints, orientation changes, and dynamic layout adjustments.
 * Optimized for performance with throttled resize handling.
 *
 * @version 1.0.0
 */

import { gsap } from 'gsap';
import { PixiPlugin } from 'gsap/PixiPlugin';
import type { Container, Application } from 'pixi.js';

// Register GSAP PixiPlugin for PIXI.js object animation
// Only register in non-test environments to avoid mock issues
if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
  gsap.registerPlugin(PixiPlugin);
}
import {
  GSAP_DEFAULTS,
  ANIMATION_DURATION,
  EASING,
  INTERACTION,
} from '../core/constants';

/**
 * Responsive breakpoint configuration
 */
export interface ResponsiveBreakpoint {
  /** Breakpoint name */
  name: string;
  /** Minimum width for this breakpoint */
  minWidth: number;
  /** Maximum width for this breakpoint (optional) */
  maxWidth?: number;
  /** Container configuration for this breakpoint */
  container: {
    /** Scale factor */
    scale?: number;
    /** Position adjustments */
    position?: { x: number; y: number };
    /** Layout-specific properties */
    layout?: Record<string, unknown>;
  };
  /** Animation configuration for transitions */
  animation?: {
    duration?: number;
    ease?: string;
    delay?: number;
  };
}

/**
 * Orientation-specific configuration
 */
export interface OrientationConfig {
  /** Portrait mode settings */
  portrait: {
    /** Container adjustments */
    container: {
      scale?: number;
      position?: { x: number; y: number };
      layout?: Record<string, unknown>;
    };
    /** Animation settings */
    animation?: {
      duration?: number;
      ease?: string;
    };
  };
  /** Landscape mode settings */
  landscape: {
    /** Container adjustments */
    container: {
      scale?: number;
      position?: { x: number; y: number };
      layout?: Record<string, unknown>;
    };
    /** Animation settings */
    animation?: {
      duration?: number;
      ease?: string;
    };
  };
}

/**
 * Responsive handler configuration
 */
export interface ResponsiveConfig {
  /** Breakpoint definitions */
  breakpoints: ResponsiveBreakpoint[];
  /** Orientation-specific configurations */
  orientation?: OrientationConfig;
  /** Resize debounce delay in milliseconds */
  debounceDelay: number;
  /** Whether to handle orientation changes */
  handleOrientation: boolean;
  /** Whether to handle device pixel ratio changes */
  handlePixelRatio: boolean;
  /** Performance optimization settings */
  performance: {
    /** Use throttling for resize events */
    useThrottling: boolean;
    /** Throttle interval in milliseconds */
    throttleInterval: number;
    /** Batch layout updates */
    batchUpdates: boolean;
  };
}

/**
 * Current responsive state
 */
export interface ResponsiveState {
  /** Current viewport dimensions */
  viewport: {
    width: number;
    height: number;
  };
  /** Current breakpoint */
  breakpoint: ResponsiveBreakpoint | null;
  /** Current orientation */
  orientation: 'portrait' | 'landscape';
  /** Device pixel ratio */
  devicePixelRatio: number;
  /** Whether currently transitioning */
  isTransitioning: boolean;
}

/**
 * Responsive performance metrics
 */
export interface ResponsivePerformanceMetrics {
  /** Number of resize events processed */
  resizeEventsProcessed: number;
  /** Number of orientation changes handled */
  orientationChanges: number;
  /** Average transition duration */
  averageTransitionTime: number;
  /** Current layout update frequency */
  updateFrequency: number;
  /** Number of active responsive animations */
  activeAnimations: number;
}

/**
 * ResponsiveHandler - Dynamic resize with GSAP transitions
 *
 * Provides comprehensive responsive design handling with smooth GSAP transitions
 * between breakpoints and orientations.
 */
export class ResponsiveHandler {
  private app: Application;
  private container: Container;
  private config: ResponsiveConfig;
  private state: ResponsiveState;
  private performanceMetrics: ResponsivePerformanceMetrics;
  private activeAnimations: Map<string, gsap.core.Timeline> = new Map();
  private animationIdCounter = 0;

  // Event handling
  private resizeObserver?: ResizeObserver;
  private mediaQueryLists: Map<string, MediaQueryList> = new Map();
  private orientationMediaQuery?: MediaQueryList;

  // Performance optimization
  private resizeTimeoutId?: number;
  private throttleTimeoutId?: number;
  private updateQueue: Array<() => void> = [];
  private lastUpdateTime = 0;

  constructor(
    app: Application,
    container: Container,
    config: Partial<ResponsiveConfig> = {}
  ) {
    this.app = app;
    this.container = container;
    this.config = {
      breakpoints: [
        {
          name: 'mobile',
          minWidth: 0,
          maxWidth: 767,
          container: { scale: 0.8, position: { x: 0, y: 0 } },
        },
        {
          name: 'tablet',
          minWidth: 768,
          maxWidth: 1023,
          container: { scale: 0.9, position: { x: 0, y: 0 } },
        },
        {
          name: 'desktop',
          minWidth: 1024,
          container: { scale: 1.0, position: { x: 0, y: 0 } },
        },
      ],
      debounceDelay: INTERACTION.DEBOUNCE_DELAY,
      handleOrientation: true,
      handlePixelRatio: true,
      performance: {
        useThrottling: true,
        throttleInterval: INTERACTION.THROTTLE_DELAY,
        batchUpdates: true,
      },
      ...config,
    };

    this.state = this.createInitialState();
    this.performanceMetrics = this.createDefaultMetrics();

    this.initialize();
  }

  /**
   * Initialize responsive handler and setup event listeners
   */
  initialize(): void {
    this.setupEventListeners();
    this.updateCurrentState();
    this.applyCurrentBreakpoint(false); // Don't animate initial setup
  }

  /**
   * Handle window resize with debouncing and smooth transitions
   *
   * @param width - New window width
   * @param height - New window height
   * @param animated - Whether to animate the transition
   */
  handleResize(width: number, height: number, animated: boolean = true): void {
    if (this.config.performance.useThrottling) {
      this.throttledResize(width, height, animated);
    } else {
      this.debouncedResize(width, height, animated);
    }
  }

  /**
   * Handle orientation change with smooth animation
   *
   * @param orientation - New orientation
   * @returns Promise that resolves when transition completes
   */
  async handleOrientationChange(
    orientation: 'portrait' | 'landscape'
  ): Promise<void> {
    if (
      !this.config.handleOrientation ||
      this.state.orientation === orientation
    ) {
      return;
    }

    this.state.orientation = orientation;
    this.performanceMetrics.orientationChanges++;

    const orientationConfig = this.config.orientation?.[orientation as keyof typeof this.config.orientation];
    if (!orientationConfig) return;

    const animationId = this.generateAnimationId();
    const timeline = gsap.timeline({
      ...GSAP_DEFAULTS.TIMELINE,
      onStart: () => {
        this.state.isTransitioning = true;
        this.onAnimationStart(animationId);
      },
      onComplete: () => {
        this.state.isTransitioning = false;
        this.onAnimationComplete(animationId);
      },
    });

    // Apply orientation-specific container changes
    const containerConfig = orientationConfig.container;
    const animationConfig = orientationConfig.animation || {};

    if (containerConfig.scale !== undefined) {
      timeline.to(
        this.container.scale,
        {
          x: containerConfig.scale,
          y: containerConfig.scale,
          duration: animationConfig.duration ?? ANIMATION_DURATION.STANDARD,
          ease: animationConfig.ease ?? EASING.EASE_OUT,
        },
        0
      );
    }

    if (containerConfig.position) {
      timeline.to(
        this.container.position,
        {
          x: containerConfig.position.x,
          y: containerConfig.position.y,
          duration: animationConfig.duration ?? ANIMATION_DURATION.STANDARD,
          ease: animationConfig.ease ?? EASING.EASE_OUT,
        },
        0
      );
    }

    this.activeAnimations.set(animationId, timeline);

    return new Promise((resolve) => {
      timeline.then(() => resolve());
    });
  }

  /**
   * Get current responsive state
   *
   * @returns Current responsive state
   */
  getState(): ResponsiveState {
    return { ...this.state };
  }

  /**
   * Get current breakpoint
   *
   * @returns Current active breakpoint
   */
  getCurrentBreakpoint(): ResponsiveBreakpoint | null {
    return this.state.breakpoint;
  }

  /**
   * Manually trigger breakpoint change
   *
   * @param breakpointName - Name of breakpoint to activate
   * @param animated - Whether to animate the transition
   * @returns Promise that resolves when transition completes
   */
  async setBreakpoint(
    breakpointName: string,
    animated: boolean = true
  ): Promise<void> {
    const breakpoint = this.config.breakpoints.find(
      (bp) => bp.name === breakpointName
    );
    if (!breakpoint || breakpoint === this.state.breakpoint) {
      return;
    }

    this.state.breakpoint = breakpoint;
    return this.applyCurrentBreakpoint(animated);
  }

  /**
   * Add custom breakpoint
   *
   * @param breakpoint - Breakpoint configuration to add
   */
  addBreakpoint(breakpoint: ResponsiveBreakpoint): void {
    this.config.breakpoints.push(breakpoint);
    this.config.breakpoints.sort((a, b) => a.minWidth - b.minWidth);
    this.updateCurrentState();
  }

  /**
   * Remove breakpoint by name
   *
   * @param breakpointName - Name of breakpoint to remove
   */
  removeBreakpoint(breakpointName: string): void {
    this.config.breakpoints = this.config.breakpoints.filter(
      (bp) => bp.name !== breakpointName
    );
    this.updateCurrentState();
  }

  /**
   * Update configuration
   *
   * @param newConfig - Partial configuration to merge
   */
  updateConfig(newConfig: Partial<ResponsiveConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.updateCurrentState();
  }

  /**
   * Get current performance metrics
   *
   * @returns Current responsive performance metrics
   */
  getPerformanceMetrics(): ResponsivePerformanceMetrics {
    this.updatePerformanceMetrics();
    return { ...this.performanceMetrics };
  }

  /**
   * Force layout update
   *
   * @param animated - Whether to animate the update
   */
  forceUpdate(animated: boolean = true): void {
    this.updateCurrentState();
    this.applyCurrentBreakpoint(animated);
  }

  /**
   * Kill all active responsive animations
   */
  killAllAnimations(): void {
    this.activeAnimations.forEach((timeline) => timeline.kill());
    this.activeAnimations.clear();
    this.state.isTransitioning = false;
    this.updatePerformanceMetrics();
  }

  /**
   * Dispose of responsive handler and cleanup resources
   */
  dispose(): void {
    this.killAllAnimations();
    this.cleanupEventListeners();
    this.clearTimeouts();
    this.performanceMetrics = this.createDefaultMetrics();
  }

  // =============================================================================
  // Private Helper Methods
  // =============================================================================

  /**
   * Generate unique animation ID
   */
  private generateAnimationId(): string {
    return `responsive_${++this.animationIdCounter}_${Date.now()}`;
  }

  /**
   * Create initial responsive state
   */
  private createInitialState(): ResponsiveState {
    return {
      viewport: {
        width: this.app.screen.width,
        height: this.app.screen.height,
      },
      breakpoint: null,
      orientation:
        window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
      devicePixelRatio: window.devicePixelRatio || 1,
      isTransitioning: false,
    };
  }

  /**
   * Setup event listeners for responsive handling
   */
  private setupEventListeners(): void {
    // Resize observer for container changes
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          this.handleResize(width, height);
        }
      });

      // Observe the app canvas
      if (this.app.canvas.parentElement) {
        this.resizeObserver.observe(this.app.canvas.parentElement);
      }
    }

    // Media queries for breakpoints
    this.config.breakpoints.forEach((breakpoint) => {
      let query = `(min-width: ${breakpoint.minWidth}px)`;
      if (breakpoint.maxWidth) {
        query += ` and (max-width: ${breakpoint.maxWidth}px)`;
      }

      const mediaQuery = window.matchMedia(query);
      mediaQuery.addEventListener('change', () => {
        this.updateCurrentState();
        this.applyCurrentBreakpoint(true);
      });

      this.mediaQueryLists.set(breakpoint.name, mediaQuery);
    });

    // Orientation change
    if (this.config.handleOrientation) {
      this.orientationMediaQuery = window.matchMedia('(orientation: portrait)');
      this.orientationMediaQuery.addEventListener('change', (e) => {
        const orientation = e.matches ? 'portrait' : 'landscape';
        this.handleOrientationChange(orientation);
      });
    }

    // Device pixel ratio changes
    if (this.config.handlePixelRatio) {
      const pixelRatioQuery = window.matchMedia(
        `(resolution: ${window.devicePixelRatio}dppx)`
      );
      pixelRatioQuery.addEventListener('change', () => {
        this.state.devicePixelRatio = window.devicePixelRatio || 1;
        this.app.renderer.resolution = this.state.devicePixelRatio;
        this.app.renderer.resize(
          this.state.viewport.width,
          this.state.viewport.height
        );
      });
    }
  }

  /**
   * Cleanup event listeners
   */
  private cleanupEventListeners(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = undefined;
    }

    this.mediaQueryLists.clear();

    if (this.orientationMediaQuery) {
      this.orientationMediaQuery = undefined;
    }
  }

  /**
   * Clear all timeouts
   */
  private clearTimeouts(): void {
    if (this.resizeTimeoutId) {
      clearTimeout(this.resizeTimeoutId);
      this.resizeTimeoutId = undefined;
    }

    if (this.throttleTimeoutId) {
      clearTimeout(this.throttleTimeoutId);
      this.throttleTimeoutId = undefined;
    }
  }

  /**
   * Debounced resize handling
   */
  private debouncedResize(
    width: number,
    height: number,
    animated: boolean
  ): void {
    if (this.resizeTimeoutId) {
      clearTimeout(this.resizeTimeoutId);
    }

    this.resizeTimeoutId = setTimeout(() => {
      this.processResize(width, height, animated);
    }, this.config.debounceDelay) as unknown as number;
  }

  /**
   * Throttled resize handling
   */
  private throttledResize(
    width: number,
    height: number,
    animated: boolean
  ): void {
    const now = performance.now();

    if (now - this.lastUpdateTime >= this.config.performance.throttleInterval) {
      this.processResize(width, height, animated);
      this.lastUpdateTime = now;
    } else if (!this.throttleTimeoutId) {
      this.throttleTimeoutId = setTimeout(() => {
        this.processResize(width, height, animated);
        this.throttleTimeoutId = undefined;
      }, this.config.performance.throttleInterval) as unknown as number;
    }
  }

  /**
   * Process resize event
   */
  private processResize(
    width: number,
    height: number,
    animated: boolean
  ): void {
    this.state.viewport = { width, height };
    this.app.renderer.resize(width, height);

    this.updateCurrentState();
    this.applyCurrentBreakpoint(animated);

    this.performanceMetrics.resizeEventsProcessed++;
    this.updatePerformanceMetrics();
  }

  /**
   * Update current responsive state
   */
  private updateCurrentState(): void {
    // Find current breakpoint - prefer more specific breakpoints (with maxWidth)
    const matchingBreakpoints = this.config.breakpoints.filter((breakpoint) => {
      const matches =
        this.state.viewport.width >= breakpoint.minWidth &&
        (!breakpoint.maxWidth ||
          this.state.viewport.width <= breakpoint.maxWidth);
      return matches;
    });

    // Sort by specificity: prefer breakpoints with maxWidth (more specific)
    matchingBreakpoints.sort((a, b) => {
      // Prefer breakpoints with maxWidth defined
      if (a.maxWidth && !b.maxWidth) return -1;
      if (!a.maxWidth && b.maxWidth) return 1;
      // If both have maxWidth or neither has maxWidth, prefer narrower ranges
      if (a.maxWidth && b.maxWidth) {
        const aRange = a.maxWidth - a.minWidth;
        const bRange = b.maxWidth - b.minWidth;
        return aRange - bRange;
      }
      return 0;
    });

    this.state.breakpoint = matchingBreakpoints[0] || null;

    // Update orientation
    this.state.orientation =
      this.state.viewport.width > this.state.viewport.height
        ? 'landscape'
        : 'portrait';
  }

  /**
   * Apply current breakpoint configuration
   */
  private async applyCurrentBreakpoint(animated: boolean): Promise<void> {
    if (!this.state.breakpoint || this.state.isTransitioning) {
      return;
    }

    const { container: containerConfig, animation: animationConfig } =
      this.state.breakpoint;

    if (!animated) {
      // Apply changes immediately
      if (containerConfig.scale !== undefined) {
        this.container.scale.set(containerConfig.scale, containerConfig.scale);
      }

      if (containerConfig.position) {
        this.container.position.set(
          containerConfig.position.x,
          containerConfig.position.y
        );
      }

      return;
    }

    // Create animated transition
    const animationId = this.generateAnimationId();
    const timeline = gsap.timeline({
      ...GSAP_DEFAULTS.TIMELINE,
      onStart: () => {
        this.state.isTransitioning = true;
        this.onAnimationStart(animationId);
      },
      onComplete: () => {
        this.state.isTransitioning = false;
        this.onAnimationComplete(animationId);
      },
    });

    const duration = animationConfig?.duration ?? ANIMATION_DURATION.STANDARD;
    const ease = animationConfig?.ease ?? EASING.EASE_OUT;
    const delay = animationConfig?.delay ?? 0;

    if (containerConfig.scale !== undefined) {
      timeline.to(
        this.container.scale,
        {
          x: containerConfig.scale,
          y: containerConfig.scale,
          duration,
          ease,
          delay,
        },
        0
      );
    }

    if (containerConfig.position) {
      timeline.to(
        this.container.position,
        {
          x: containerConfig.position.x,
          y: containerConfig.position.y,
          duration,
          ease,
          delay,
        },
        0
      );
    }

    this.activeAnimations.set(animationId, timeline);

    return new Promise((resolve) => {
      timeline.then(() => resolve());
    });
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
    const now = performance.now();

    this.performanceMetrics.activeAnimations = this.activeAnimations.size;

    if (this.lastUpdateTime > 0) {
      const deltaTime = now - this.lastUpdateTime;
      this.performanceMetrics.updateFrequency =
        deltaTime > 0 ? 1000 / deltaTime : 0;
    }

    // Calculate average transition time (simplified)
    if (this.performanceMetrics.resizeEventsProcessed > 0) {
      this.performanceMetrics.averageTransitionTime =
        ANIMATION_DURATION.STANDARD * 1000; // Convert to ms
    }
  }

  /**
   * Create default performance metrics
   */
  private createDefaultMetrics(): ResponsivePerformanceMetrics {
    return {
      resizeEventsProcessed: 0,
      orientationChanges: 0,
      averageTransitionTime: 0,
      updateFrequency: 60,
      activeAnimations: 0,
    };
  }
}
