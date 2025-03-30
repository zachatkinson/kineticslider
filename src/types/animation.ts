import type { SliderErrorInfo } from './slider';

/**
 * Animation-specific types and interfaces
 */

/**
 * Basic animation configuration
 */
export interface AnimationConfig {
  duration: number;
  ease: string;
}

/**
 * Animation options for basic animations
 */
export interface AnimationOptions {
  target: HTMLElement;
  config: AnimationConfig;
  onComplete?: () => void;
}

/**
 * Return type for the basic useAnimation hook
 */
export interface BasicAnimationReturn {
  animate: (options: AnimationOptions) => () => void;
}

/**
 * Configuration options for the useAnimation hook
 */
export interface UseAnimationConfig {
  /** Duration of the animation in seconds. Defaults to 0.8 */
  duration?: number;
  /** GSAP easing function to use. Defaults to 'power3.out' */
  ease?: string;
  /** Whether to enable infinite looping. Defaults to false */
  infinite?: boolean;
  /** Callback fired when animation starts */
  onAnimationStart?: () => void;
  /** Callback fired when animation completes with the new index */
  onAnimationComplete?: (index: number) => void;
  /** Callback fired when an error occurs during animation */
  onError?: (error: Error) => void;
}

/**
 * Return type for the useAnimation hook containing all animation controls
 */
export interface UseAnimationReturn {
  /** Whether an animation is currently in progress */
  isAnimating: boolean;
  /** Animate to a specific slide index with optional speed multiplier */
  animateToSlide: (targetIndex: number, speed?: number) => void;
  /** Initialize the container element with GSAP settings */
  setupContainer: (container: HTMLElement) => void;
  /** Initialize the slides with GSAP settings */
  setupSlides: (slides: HTMLElement[]) => void;
  /** Clean up any ongoing animations */
  cleanupAnimations: () => void;
  /** Handle resize events and update positions */
  handleResize: () => void;
  /** Get the current position of the container */
  getPosition: () => number;
  /** Start drag interaction at the given x coordinate */
  handleDragStart: (x: number) => void;
  /** Update drag position to the given x coordinate */
  handleDragMove: (x: number) => void;
  /** End drag interaction and trigger momentum animation */
  handleDragEnd: () => void;
  /** Get the current drag velocity */
  getVelocity: () => number;
}

/**
 * Internal state for tracking drag interactions
 */
export interface DragState {
  /** Starting X coordinate of the drag */
  startX: number;
  /** Current X coordinate of the drag */
  currentX: number;
  /** Last recorded X coordinate for velocity calculation */
  lastX: number;
  /** Timestamp of the last drag event */
  lastTime: number;
  /** Current velocity in pixels per millisecond */
  velocity: number;
}

/**
 * Animation metrics for performance monitoring
 */
export interface AnimationMetrics {
  /** Duration of the animation in milliseconds */
  duration: number;
  /** Frame rate during animation */
  fps: number;
  /** Number of frames dropped */
  droppedFrames: number;
  /** Memory usage during animation */
  memoryUsage: number;
  /** Time spent in JavaScript */
  scriptTime: number;
  /** Time spent in rendering */
  renderTime: number;
  /** Animation start time (optional) */
  startTime?: number;
  /** Animation end time (optional) */
  endTime?: number;
}

export interface UseAnimationOptions {
  duration?: number;
  ease?: string;
  onComplete?: () => void;
  onError?: (error: Error, errorInfo: SliderErrorInfo) => void;
}

export type GSAPTimeline = gsap.core.Timeline;
export type GSAPTween = gsap.core.Tween;

export type AnimationDirection = 'forward' | 'backward' | 'none';

export interface AnimationState {
  isAnimating: boolean;
  direction: AnimationDirection;
  progress: number;
  timeline?: GSAPTimeline;
  metrics: AnimationMetrics;
}

export interface UseAnimationResult {
  animate: (
    target: HTMLElement,
    props: gsap.TweenVars,
    options?: { duration?: number; ease?: string }
  ) => gsap.core.Timeline | null;
  cleanupAnimations: () => void;
  containerRef: React.RefObject<HTMLElement>;
  isAnimating: boolean;
  metrics: AnimationMetrics;
}

// Extend Performance interface to include memory property
declare global {
  interface Performance {
    readonly memory: {
      readonly jsHeapSizeLimit: number;
      readonly totalJSHeapSize: number;
      readonly usedJSHeapSize: number;
    };
  }
}
