/**
 * Internal types used by hooks but needed for component parameters
 */
import type { AnimationConfig, AnimationOptions, AnimationMetrics } from './animation';
import type { GestureConfig, GestureDirection, GestureHandlers } from './gesture';
import type { PerformanceMetrics as _PerformanceMetrics } from './performance';
import type { ErrorTypes as _ErrorTypes, Slide, SliderMetrics as _SliderMetrics } from './slider';
import type { FocusTrapOptions as _FocusTrapOptions } from './keyboard';
import type { gsap as _gsap } from 'gsap';
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
 * @example Example usage
 */
export interface UseAnimationReturn {
  /** Whether an animation is currently in _progress */
  isAnimating: boolean;
  /** Animate to a specific slide _index with optional _speed? multiplier */
  animateToSlide: (_targetIndex: number, _speed?: number) => void;
  /** Initialize the container element with GSAP settings */
  setupContainer: (container: HTMLElement) => void;
  /** Initialize the _slides with GSAP settings */
  setupSlides: (_slides: HTMLElement[]) => void;
  /** Clean up any ongoing animations */
  cleanupAnimations: () => void;
  /** Handle resize events and update positions */
  handleResize: () => void;
  /** Get the current position of the container */
  getPosition: () => number;
  /** Start drag interaction at the given _x coordinate */
  handleDragStart: (_x: number) => void;
  /** Update drag position to the given _x coordinate */
  handleDragMove: (_x: number) => void;
  /** End drag interaction and trigger momentum animation */
  handleDragEnd: () => void;
  /** Get the current drag velocity */
  getVelocity: () => number;
  _progress: number;
  metrics: AnimationMetrics;
  events: AnimationEvents;
}

/**
 * Return type for the basic animation hook
 * @example Example usage
 */
export interface BasicAnimationReturn {
  play: () => void;
  pause: () => void;
  reverse: () => void;
  restart: () => void;
}

/**
 * Return type for the enhanced animation hook with GSAP integration
 * @example Example usage
 */
export interface UseAnimationResult extends UseAnimationReturn {
  animation: BasicAnimationReturn;
}

/**
 * Return type for the useKeyboard hook
 * @example Example usage
 */
export interface UseKeyboardReturn {
  focusFirst: () => void;
  focusLast: () => void;
  focusNext: () => void;
  focusPrevious: () => void;
}

/**
 * Return type for the usePerformance hook
 * @example Example usage
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
 * @example Example usage
 */
export interface UseKineticSliderReturn {
  currentIndex: SlideIndex;
  isAnimating: boolean;
  isDragging: boolean;
  dragDelta: GestureDelta;
  next: () => void;
  previous: () => void;
  goTo: (_index: SlideIndex) => void;
  handleGestureStart: (_event: GestureEvent) => void;
  handleGestureMove: (_event: GestureEvent) => void;
  handleGestureEnd: (_event: GestureEvent) => void;
}

/**
 * Return type for the useErrorTracking hook
 * @example Example usage
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
 * @example Example usage
 */
export interface UsePerformanceOptions {
  sampleSize?: number;
  interval?: number;
  enableMemoryTracking?: boolean;
}

/**
 * Options for the useAnimation hook
 * @example Example usage
 */
export interface UseAnimationConfig {
  duration?: number;
  easing?: string;
  delay?: number;
  onComplete?: () => void;
  onUpdate?: (_progress: number) => void;
}

/**
 * Props for the useKineticSlider hook
 * @example Example usage
 */
export interface UseKineticSliderProps {
  _slides: Slide[];
  duration: number;
  ease: string;
  onSlideChange?: (_index: number) => void;
  onAnimationComplete?: () => void;
  initialSlide?: number;
  infiniteLoop?: boolean;
}

/**
 * Extended GestureEvent for slider interactions
 * @example Example usage
 */
export interface SliderGestureEvent extends GestureEvent {
  startX: number;
  startY: number;
}

/**
 * Options for form validation hook
 * @example Example usage
 */
export interface FormValidationOptions {
  /** Debounce timeout in milliseconds */
  debounceMs?: number;
  /** Auto-validate on initial render */
  validateOnMount?: boolean;
  /** Auto-validate on field change */
  validateOnChange?: boolean;
}
