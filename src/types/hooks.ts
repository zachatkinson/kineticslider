/**
 * Hook-related type definitions
 *
 * This module contains type definitions for React hooks,
 * including hook return types, options, and hook-specific interfaces.
 *
 * @module Hooks
 * @version 1.0.0
 */

import type {
  AnimationConfig,
  AnimationOptions,
  AnimationMetrics,
} from "./animation";
import type {
  GestureConfig,
  GestureDirection,
  GestureHandlers,
} from "./gesture";
import type { PerformanceMetrics as _PerformanceMetrics } from "./performance";
import type {
  ErrorTypes as _ErrorTypes,
  Slide,
  SliderMetrics as _SliderMetrics,
} from "./slider";
import type { SlideIndex } from "./branded";
import type { FocusTrapOptions as _FocusTrapOptions } from "./keyboard";
import type { gsap as _gsap } from "gsap";
import type { UseSliderAccessibilityProps } from "./accessibility";
import type { ValidationResult } from "./validation";
import type { AnimationEvents } from "./animation";
import type React from "react";

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
 * Return type for the useAnimation hook
 *
 * @example Example usage
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
 *
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
 *
 * @example Example usage
 */
export interface UseAnimationResult extends UseAnimationReturn {
  animation: BasicAnimationReturn;
}

/**
 * Return type for the useKeyboard hook
 *
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
 *
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
 *
 * @interface UseKineticSliderReturn
 * @example
 * ```typescript
 * const {
 *   currentSlide,
 *   isAnimating,
 *   next,
 *   prev,
 *   goToSlide,
 *   handleGesture,
 *   sliderRef,
 *   metrics
 * } = useKineticSlider(props);
 * ```
 */
export interface UseKineticSliderReturn {
  currentSlide: number;
  isAnimating: boolean;
  next: () => void;
  prev: () => void;
  goToSlide: (slideIndex: number) => void;
  handleGesture: (event: SliderGestureEvent) => void;
  sliderRef: React.RefObject<HTMLDivElement>;
  metrics: _SliderMetrics;
}

/**
 * Return type for the useErrorTracking hook
 *
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
 *
 * @example Example usage
 */
export interface UsePerformanceOptions {
  sampleSize?: number;
  interval?: number;
  enableMemoryTracking?: boolean;
}

/**
 * Options for the useAnimation hook
 *
 * @example Example usage
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
 *
 * @example Example usage
 */
export interface KineticSliderHookProps {
  slides: Slide[];
  initialSlide: SlideIndex;
  onSlideChange?: (index: SlideIndex) => void;
  onAnimationComplete?: () => void;
  duration?: number;
  ease?: string;
  infiniteLoop?: boolean;
}

/**
 * Extended GestureEvent for slider interactions
 *
 * @example Example usage
 */
export interface SliderGestureEvent {
  type: string;
  clientX: number;
  clientY: number;
  startX: number;
  startY: number;
  preventDefault?: () => void;
}

/**
 * Options for form validation hook
 *
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

/**
 * Gesture state reference interface
 *
 * @example Basic keyboard navigation setup
 */
export interface GestureStateRef {
  isTracking: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  startTime: number;
  isDragging: boolean;
}

/**
 * Keyboard navigation hook interface
 *
 * @example Basic keyboard navigation setup
 */
export interface KeyboardNavigationHook {
  handleKeyDown: (event: React.KeyboardEvent) => void;
  isEnabled?: boolean;
  enableKeyboard?: () => void;
  disableKeyboard?: () => void;
}

/**
 * Slider animation hook interface
 *
 * @example Animation hook implementation
 */
export interface SliderAnimationHook {
  animateToSlide: (slideIndex: number) => Promise<void>;
  isAnimating: boolean;
  currentSlide: number;
  duration: number;
  easing: string;
}

/**
 * Slide validation options interface
 *
 * @example Validation configuration options
 */
export interface SlideValidationOptions {
  validateOnMount?: boolean;
  validateOnChange?: boolean;
  strictMode?: boolean;
  debounceMs?: number;
  customValidators?: Array<(slide: unknown) => boolean>;
}

/**
 * Kinetic slider hook result interface
 *
 * @example Hook return value structure
 */
export interface KineticSliderHookResult {
  currentSlide: SlideIndex;
  isAnimating: boolean;
  next: () => Promise<void>;
  prev: () => Promise<void>;
  handleGesture: (direction: string) => void;
  sliderRef: React.RefObject<HTMLDivElement | null>;
}

// Touch Gestures Hook Types
export interface UseTouchGesturesOptions {
  threshold?: number;
  enabled?: boolean;
  onInteraction?: (gestureType: string) => void;
  onGestureEvent?: (event: SliderGestureEvent) => void;
  onNext?: () => void;
  onPrev?: () => void;
}

export interface UseTouchGesturesReturn {
  handleTouchStart: (event: React.TouchEvent) => void;
  handleTouchMove: (event: React.TouchEvent) => void;
  handleTouchEnd: (event: React.TouchEvent) => void;
}

// Image Preloading Hook Types
export interface UseImagePreloadingOptions {
  lazyLoad?: boolean;
  onError?: (error: import("../types/image").ImageError) => void;
  onAnalytics?: () => void;
}

export interface UseImagePreloadingReturn {
  preloadedImages: Set<string>;
  loadingStates: Record<string, boolean>;
  preloadImagesForSlide: (currentSlide: number, slides: Array<{ image?: string }>) => void;
}

// Container Resize Hook Types
export interface UseContainerResizeOptions {
  debounceDelay?: number;
  trackWidth?: boolean;
  trackHeight?: boolean;
  initialWidth?: string;
  initialHeight?: string;
}

export interface UseContainerResizeReturn {
  containerWidth: string;
  containerHeight: string;
  recalculateSize: () => void;
}

// Error State Hook Types
export interface UseErrorStateOptions {
  initialError?: Error | null;
  initialIsError?: boolean;
  onParentError?: (error: Error | null) => void;
  onParentIsError?: (isError: boolean) => void;
  onError?: (error: Error) => void;
  enableTracking?: boolean;
}

export interface UseErrorStateReturn {
  error: Error | null;
  isError: boolean;
  setError: (error: Error | null) => void;
  setIsError: (isError: boolean) => void;
  propagateError: (error: Error, errorType?: import("../types/error").ErrorType) => void;
  clearError: () => void;
}

// Focus Restoration Hook Types
export interface UseFocusRestorationOptions {
  enabled?: boolean;
  restoreOnUnmount?: boolean;
  returnFocusTo?: HTMLElement | string | (() => HTMLElement | null) | null;
}

export interface UseFocusRestorationReturn {
  previousFocusRef: React.MutableRefObject<HTMLElement | null>;
  restoreFocus: () => void;
  storeFocus: () => void;
}
