/**
 * Internal types used by hooks but needed for component parameters
 */
import type { AnimationConfig, AnimationOptions, AnimationMetrics } from './animation';
import type { GestureConfig, GestureDirection, GestureHandlers } from './gesture';
import type { PerformanceMetrics } from './performance';
import type { ErrorTypes, Slide, SliderGestureEvent, SliderMetrics } from './slider';
import type { FocusTrapOptions } from './keyboard';
import type { gsap } from 'gsap';
import type { UseSliderAccessibilityProps } from './accessibility';
import type { ValidationResult } from './validation';
import type { AnimationEvents } from './animation';
import type { GestureEvent, GestureDelta } from './gesture';
import type { SlideIndex } from './branded';

// Re-export types needed by components
export type {
  AnimationOptions,
  AnimationConfig,
  GestureDirection,
  GestureHandlers,
  GestureConfig,
  UseSliderAccessibilityProps,
};

/**
 * Types for React hook returns and configurations
 */

/**
 * Return type for the useAnimation hook
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
  progress: number;
  metrics: AnimationMetrics;
  events: AnimationEvents;
}

/**
 * Return type for the basic animation hook
 */
export interface BasicAnimationReturn {
  play: () => void;
  pause: () => void;
  reverse: () => void;
  restart: () => void;
}

/**
 * Return type for the enhanced animation hook with GSAP integration
 */
export interface UseAnimationResult extends UseAnimationReturn {
  animation: BasicAnimationReturn;
}

/**
 * Return type for the useKeyboard hook
 */
export interface UseKeyboardReturn {
  focusFirst: () => void;
  focusLast: () => void;
  focusNext: () => void;
  focusPrevious: () => void;
}

/**
 * Return type for the usePerformance hook
 */
export interface UsePerformanceReturn {
  fps: number;
  memory: {
    used: number;
    total: number;
    limit: number;
  };
  metrics: {
    fcp: number;
    lcp: number;
    cls: number;
  };
}

/**
 * Return type for the useKineticSlider hook
 */
export interface UseKineticSliderReturn {
  currentIndex: SlideIndex;
  isAnimating: boolean;
  isDragging: boolean;
  dragDelta: GestureDelta;
  next: () => void;
  previous: () => void;
  goTo: (index: SlideIndex) => void;
  handleGestureStart: (event: GestureEvent) => void;
  handleGestureMove: (event: GestureEvent) => void;
  handleGestureEnd: (event: GestureEvent) => void;
}

/**
 * Return type for the useErrorTracking hook
 */
export interface UseErrorTrackingReturn {
  errors: Error[];
  addError: (error: Error) => void;
  clearErrors: () => void;
  validateForm: () => ValidationResult;
}

// Hook Options Types

/**
 * Options for the usePerformance hook
 */
export interface UsePerformanceOptions {
  sampleSize?: number;
  interval?: number;
  enableMemoryTracking?: boolean;
}

/**
 * Options for the useAnimation hook
 */
export interface UseAnimationConfig {
  duration?: number;
  easing?: string;
  delay?: number;
  onComplete?: () => void;
  onUpdate?: (progress: number) => void;
}

/**
 * Props for the useKineticSlider hook
 */
export interface UseKineticSliderProps {
  initialIndex?: SlideIndex;
  loop?: boolean;
  autoplay?: boolean;
  autoplayDelay?: number;
}

/**
 * Options for form validation hook
 */
export interface FormValidationOptions {
  /** Debounce timeout in milliseconds */
  debounceMs?: number;
  /** Auto-validate on initial render */
  validateOnMount?: boolean;
  /** Auto-validate on field change */
  validateOnChange?: boolean;
}
