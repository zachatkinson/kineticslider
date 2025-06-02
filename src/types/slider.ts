/**
 * Core slider types and interfaces
 */
import type {
  GestureConfig as _GestureConfig,
  GestureEvent as _GestureEvent,
  GestureDelta,
  GestureDirection,
} from "./gesture";
import type {
  AnimationConfig as _AnimationConfig,
  AnimationEvents as _AnimationEvents,
  AnimationMetrics as _AnimationMetrics,
} from "./animation";
import type {
  ErrorType,
  SliderError as _SliderError,
  SliderErrorInfo,
} from "./error";
import type {
  SlideIndex,
  GestureDistance,
  GestureVelocity,
  GestureThreshold,
  SliderId,
} from "./branded";
import type { SliderEventHandler as _SliderEventHandler } from "./events";
import type { CanvasConfig } from "./pixi";

// Re-export branded types for backward compatibility
export type {
  SlideIndex,
  GestureDistance,
  GestureVelocity,
  GestureThreshold,
  SliderId,
  ErrorType,
  SliderErrorInfo,
};

// Export _error types from errors.ts
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
  /** Optional className for the slide */
  className?: string;
  /** Optional inline styles for the slide */
  style?: React.CSSProperties;
  /** Optional style for the content container */
  contentStyle?: React.CSSProperties;
  /** Optional style for the image */
  imageStyle?: React.CSSProperties;
  /** Optional alt text for the image (alternative to alt) */
  imageAlt?: string;
  /** Optional render function for custom content */
  render?: () => React.ReactNode;
}

export interface SlideItem {
  id: SliderId;
  content: React.ReactNode;
  metadata?: Record<string, unknown>;
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
  infiniteLoop: boolean;
  items: SlideItem[];
}

// Context value type
export interface SliderContextValue {
  state: SliderState;
  config: SliderConfig;
  items: SlideItem[];
  actions: {
    next: () => void;
    previous: () => void;
    goTo: (_index: SlideIndex) => void;
    startAutoplay: () => void;
    stopAutoplay: () => void;
    updateDragDelta: (_delta: GestureDelta) => void;
  };
}

/**
 * Action types for slider state management
 */
export type SliderAction =
  | { type: "NEXT" }
  | { type: "PREVIOUS" }
  | { type: "GO_TO"; _index: SlideIndex }
  | { type: "START_ANIMATION" }
  | { type: "END_ANIMATION" }
  | { type: "START_DRAG" }
  | { type: "UPDATE_DRAG"; _delta: GestureDelta }
  | { type: "END_DRAG" };

export interface SliderMetrics {
  currentIndex: number;
  totalSlides: number;
  progress: number;
  direction: "forward" | "backward";
  isAnimating: boolean;
}

// Animation configuration types
export interface SlideAnimation {
  duration: number;
  easing: string;
  delay?: number;
}

/**
 * Props for the KineticSlider component
 *
 * @example Example usage
 */
export interface KineticSliderProps {
  /** Array of slides to display */
  slides: Slide[];
  
  /** Initial slide index (default: 0) */
  initialSlide?: SlideIndex;
  
  /** Callback fired when active slide changes */
  onSlideChange?: (index: SlideIndex) => void;
  
  /** Callback fired when slide animation completes */
  onAnimationComplete?: () => void;
  
  /** Callback fired when an error occurs */
  onError?: (error: Error) => void;
  
  /** Additional CSS class name */
  className?: string;
  
  /** Inline styles */
  style?: React.CSSProperties;
  
  /** Enable keyboard navigation (default: true) */
  enableKeyboard?: boolean;
  
  /** Enable touch/mouse gestures (default: true) */
  enableGestures?: boolean;
  
  /** Animation duration in seconds (default: 0.5) */
  duration?: number;
  
  /** Animation easing function (default: "power2.out") */
  ease?: string;
  
  /** Enable infinite loop (default: false) */
  infiniteLoop?: boolean;
  
  /** Enable lazy loading of slides (default: true) */
  lazyLoad?: boolean;
  
  /** Canvas configuration for PIXI.js rendering */
  canvas?: CanvasConfig;
}

/** Alias for backward compatibility */
export type SliderProps = KineticSliderProps;

/**
 * Default configuration for the slider
 */
export const _defaultConfig: SliderConfig = {
  initialSlide: 0 as SlideIndex,
  loop: true,
  autoplay: false,
  autoplayDelay: 3000,
  gestureThreshold: 50,
};

/**
 * Initial state for the slider reducer
 */
export const _initialState: SliderState = {
  currentIndex: 0 as SlideIndex,
  isAnimating: false,
  isDragging: false,
  dragDelta: {
    x: 0 as GestureDistance,
    y: 0 as GestureDistance,
  },
  infiniteLoop: true,
  items: [],
};
