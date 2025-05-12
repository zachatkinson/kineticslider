import type { AnimationEase as _AnimationEase } from "./common";
import type { Brand as _Brand, Duration, Delay, FPS } from "./branded";
import gsap from "gsap";

/**
 * Animation-specific types and interfaces
 *
 * This module contains type definitions for animations used throughout the application.
 * It includes configuration types, metrics, events, and other animation-related interfaces.
 *
 * @module Animation
 * @group Types
 */

/**
 * Extended animation configuration that includes custom properties
 *
 * This interface extends GSAP's TweenVars to include our application-specific
 * animation requirements.
 *
 * @interface ExtendedAnimationConfig
 * @augments {gsap.TweenVars}
 *
 * @example
 * ```ts
 * const animConfig: ExtendedAnimationConfig = {
 *   target: element,
 *   duration: 0.5,
 *   ease: "power2.out",
 *   x: 100,
 *   opacity: 1
 * };
 * ```
 */
export interface ExtendedAnimationConfig extends gsap.TweenVars {
  /** The target element to animate */
  target: gsap.TweenTarget;
}

/**
 * Base animation configuration type
 *
 * This is the primary animation configuration type used throughout the application.
 *
 * @typedef {ExtendedAnimationConfig} AnimationConfig
 */
export type AnimationConfig = ExtendedAnimationConfig;

/**
 * Configuration for GSAP timelines
 *
 * Used to configure animation sequences using GSAP's Timeline feature.
 *
 * @typedef {gsap.TimelineVars} TimelineConfig
 */
export type TimelineConfig = gsap.TimelineVars;

/**
 * Animation options for basic animations
 *
 * Contains the necessary configuration to create and execute animations.
 *
 * @interface AnimationOptions
 *
 * @example
 * ```ts
 * const options: AnimationOptions = {
 *   target: document.querySelector('.my-element'),
 *   config: {
 *     duration: 0.8,
 *     ease: "back.out(1.7)"
 *   },
 *   onComplete: () => console.log('Animation complete')
 * };
 * ```
 */
export interface AnimationOptions {
  /** Target element to animate */
  target: gsap.TweenTarget;
  /** Animation configuration */
  config: {
    /** Animation duration in seconds */
    duration: number;
    /** Animation easing function */
    ease: string;
  };
  /** Callback when animation completes */
  onComplete?: () => void;
}

/**
 * Animation metrics for performance tracking
 *
 * Contains performance measurements collected during animation playback.
 * Used for performance monitoring and optimization.
 *
 * @interface AnimationMetrics
 *
 * @example
 * ```ts
 * function logMetrics(metrics: AnimationMetrics) {
 *   console.log(`Average FPS: ${metrics.fps}`);
 *   console.log(`Duration: ${metrics.duration}ms`);
 *   console.log(`Frames: ${metrics.frames}`);
 *
 *   if (metrics.memory) {
 *     console.log(`Memory usage: ${metrics.memory.usedJSHeapSize / 1024 / 1024}MB`);
 *   }
 * }
 * ```
 */
export interface AnimationMetrics {
  /** Average frame rate during animation */
  fps: number;
  /** Duration of the animation in milliseconds */
  duration: number;
  /** Number of frames rendered */
  frames: number;
  /** Memory usage during animation (if available) */
  memory?: {
    jsHeapSizeLimit: number;
    totalJSHeapSize: number;
    usedJSHeapSize: number;
  };
}

/**
 * Animation lifecycle event handlers
 *
 * Defines callbacks for animation lifecycle events.
 *
 * @interface AnimationEvents
 *
 * @example
 * ```ts
 * const events: AnimationEvents = {
 *   onAnimationStart: () => console.log('Animation started'),
 *   onAnimationComplete: () => console.log('Animation completed'),
 *   onAnimationCancel: () => console.log('Animation cancelled')
 * };
 * ```
 */
export interface AnimationEvents {
  /** Called when the animation starts */
  onAnimationStart?: () => void;
  /** Called when the animation completes */
  onAnimationComplete?: () => void;
  /** Called when the animation is cancelled */
  onAnimationCancel?: () => void;
}

// Re-export branded types for backward compatibility
export type { Duration, Delay, FPS };

/**
 * Available slide transition animation types
 *
 * Enum defining the supported transition effects between slides.
 *
 * @enum {string}
 *
 * @example
 * ```ts
 * function transition(slide: Slide, type: TransitionType) {
 *   switch (type) {
 *     case TransitionType.FADE:
 *       fadeTransition(slide);
 *       break;
 *     case TransitionType.SLIDE:
 *       slideTransition(slide);
 *       break;
 *     case TransitionType.ZOOM:
 *       zoomTransition(slide);
 *       break;
 *   }
 * }
 * ```
 */
export enum TransitionType {
  /** Fade transition (opacity-based) */
  FADE = "fade",
  /** Slide transition (position-based) */
  SLIDE = "slide",
  /** Zoom transition (scale-based) */
  ZOOM = "zoom",
}

/**
 * Return type for useAnimation hook
 *
 * Defines the API returned by the useAnimation hook for creating and
 * controlling animations.
 *
 * @interface BasicAnimationReturn
 *
 * @example
 * ```ts
 * const { animate } = useAnimation();
 *
 * const startAnimation = () => {
 *   const cleanup = animate({
 *     target: elementRef.current,
 *     config: { duration: 0.5, ease: 'power2.out' },
 *     onComplete: () => console.log('Animation finished')
 *   });
 *
 *   // Later, if needed
 *   // cleanup(); // Stop animation
 * };
 * ```
 */
export interface BasicAnimationReturn {
  /**
   * Function to start an animation
   *
   * @param options - Animation options object
   *
   * @returns A cleanup function that can be called to stop the animation
   *
   */
  animate: (options: AnimationOptions) => () => void;
}
