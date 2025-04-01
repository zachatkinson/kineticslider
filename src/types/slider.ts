/**
 * Core slider types and interfaces
 */
import type { GestureConfig, GestureEvent, GestureDelta, GestureDirection } from './gesture';
import type { AnimationConfig, AnimationEvents, AnimationMetrics } from './animation';
import type { ErrorType, SliderError, SliderErrorInfo } from './error';
import type { 
  SlideIndex, 
  GestureDistance, 
  GestureVelocity, 
  GestureThreshold,
  SliderId 
} from './branded';
import type { SliderEventHandler } from './events';

// Re-export branded types for backward compatibility
export type { 
  SlideIndex, 
  GestureDistance, 
  GestureVelocity, 
  GestureThreshold,
  SliderId,
  ErrorType,
  SliderErrorInfo
};

// Export error types from errors.ts
export { ErrorType as ErrorTypes };

// Core slide types
export interface Slide {
  /** Unique identifier for the slide */
  id: SliderId;
  /** Title of the slide */
  title: string;
  /** Optional description */
  description?: string;
  /** Image URL */
  image: string;
  /** Alt text for the image */
  alt: string;
  /** Optional custom content */
  content?: React.ReactNode;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

export interface SlideItem {
  id: SliderId;
  content: React.ReactNode;
  metadata?: Record<string, unknown>;
}

// Accessibility types
export interface AccessibilityConfig {
  ariaLabel?: string;
  keyboardNavigation?: boolean;
}

// Autoplay types
export interface AutoplayConfig {
  enabled: boolean;
  interval: number;
  pauseOnHover: boolean;
}

// Slider configuration
export interface SliderConfig {
  initialSlide?: SlideIndex;
  loop?: boolean;
  autoplay?: boolean;
  autoplayDelay?: number;
  gestureThreshold?: number;
  gestureDirection?: GestureDirection;
}

// State types
export interface SliderState {
  currentIndex: SlideIndex;
  isDragging: boolean;
  dragDelta: GestureDelta;
  isAnimating: boolean;
}

// Context value type
export interface SliderContextValue {
  state: SliderState;
  config: SliderConfig;
  items: SlideItem[];
  actions: {
    next: () => void;
    previous: () => void;
    goTo: (index: SlideIndex) => void;
    startAutoplay: () => void;
    stopAutoplay: () => void;
    updateDragDelta: (delta: GestureDelta) => void;
  };
}

/**
 * Action types for slider state management
 */
export type SliderAction =
  | { type: 'NEXT' }
  | { type: 'PREVIOUS' }
  | { type: 'GO_TO'; index: SlideIndex }
  | { type: 'START_ANIMATION' }
  | { type: 'END_ANIMATION' }
  | { type: 'START_DRAG' }
  | { type: 'UPDATE_DRAG'; delta: GestureDelta }
  | { type: 'END_DRAG' };

export interface SliderMetrics {
  currentIndex: number;
  totalSlides: number;
  progress: number;
  direction: 'forward' | 'backward';
  isAnimating: boolean;
}

// Animation configuration types
export interface SlideAnimation {
  duration: number;
  easing: string;
  delay?: number;
}

/** Props for the KineticSlider component */
export interface KineticSliderProps {
  /** Array of slides to render */
  slides: Slide[];
  /** Initial slide index */
  initialSlide?: SlideIndex;
  /** Callback when slide changes */
  onSlideChange?: (index: SlideIndex) => void;
  /** Callback when animation completes */
  onAnimationComplete?: () => void;
  /** Callback when error occurs */
  onError?: (error: Error) => void;
  /** Additional class name */
  className?: string;
  /** Additional inline styles */
  style?: React.CSSProperties;
  /** Enable keyboard navigation */
  enableKeyboard?: boolean;
  /** Enable gesture support */
  enableGestures?: boolean;
  /** Animation duration in seconds */
  duration?: number;
  /** Animation easing function */
  ease?: string;
  /** Enable infinite loop */
  infiniteLoop?: boolean;
  /** Enable lazy loading of slides */
  lazyLoad?: boolean;
}

/**
 * Default configuration for the slider
 */
export const defaultConfig: SliderConfig = {
  initialSlide: 0 as SlideIndex,
  loop: true,
  autoplay: false,
  autoplayDelay: 3000,
  gestureThreshold: 50,
};

/**
 * Initial state for the slider reducer
 */
export const initialState: SliderState = {
  currentIndex: 0 as SlideIndex,
  isAnimating: false,
  isDragging: false,
  dragDelta: { 
    x: 0 as GestureDistance, 
    y: 0 as GestureDistance 
  },
};
