import type { AnimationEase } from './common';
import type { Brand, Duration, Delay, FPS } from './branded';
import gsap from 'gsap';

/**
 * Animation-specific types and interfaces
 */

/**
 * Extended animation configuration that includes our custom properties
 */
export interface ExtendedAnimationConfig extends gsap.TweenVars {
  target: gsap.TweenTarget;
}

/**
 * Base animation configuration type
 */
export type AnimationConfig = ExtendedAnimationConfig;

/**
 * Configuration for GSAP timelines
 */
export type TimelineConfig = gsap.TimelineVars;

/**
 * Animation options for basic animations
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

// Animation events
export interface AnimationEvents {
  onAnimationStart?: () => void;
  onAnimationComplete?: () => void;
  onAnimationCancel?: () => void;
}

// Re-export branded types for backward compatibility
export type { Duration, Delay, FPS };

/**
 * Type for slide transition animations
 */
export enum TransitionType {
  FADE = 'fade',
  SLIDE = 'slide',
  ZOOM = 'zoom'
}

/**
 * Return type for useAnimation hook
 */
export interface BasicAnimationReturn {
  /** Function to start an animation */
  animate: (options: AnimationOptions) => () => void;
}
