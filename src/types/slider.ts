/**
 * Core slider types and interfaces
 */
import { SlideId } from './branded';

export interface SliderMetrics {
  currentIndex: number;
  totalSlides: number;
  progress: number;
  direction: 'forward' | 'backward';
  isAnimating: boolean;
}

export interface Slide {
  id: SlideId;
  title: string;
  description?: string;
  image: string;
  alt: string;
}

export interface KineticSliderProps {
  slides: Slide[];
  onSlideChange?: (currentIndex: number) => void;
  onAnimationComplete?: () => void;
  onError?: (error: Error) => void;
  className?: string;
  style?: React.CSSProperties;
  enableKeyboard?: boolean;
  enableGestures?: boolean;
  initialSlide?: number;
  duration?: number;
  ease?: string;
  lazyLoad?: boolean;
  infiniteLoop?: boolean;
}

/**
 * Props for the useKineticSlider hook
 */
export interface UseKineticSliderProps {
  slides: Slide[];
  duration?: number;
  ease?: string;
  onSlideChange?: ((index: number) => void) | undefined;
  onAnimationComplete?: (() => void) | undefined;
  initialSlide?: number;
  infiniteLoop?: boolean;
}

/**
 * Extended gesture event for slider interaction
 */
export interface SliderGestureEvent {
  clientX: number;
  clientY: number;
  type: string;
  startX?: number;
  startY?: number;
  preventDefault?: () => void;
}

/**
 * Return type for the useKineticSlider hook
 */
export interface UseKineticSliderReturn {
  currentSlide: number;
  isAnimating: boolean;
  next: () => void;
  prev: () => void;
  handleGesture: (event: SliderGestureEvent) => void;
  sliderRef: React.RefObject<HTMLDivElement>;
}

/**
 * Extended error information for better error handling
 */
export interface SliderErrorInfo {
  componentStack: string;
  message: string;
  name: string;
  stack?: string | null;
  code: string;
  timestamp: string;
  details?: unknown;
}

/**
 * Analytics data structure for slider events
 */
export type SliderAnalyticsEvent =
  | 'slide_change'
  | 'animation_complete'
  | 'error'
  | 'gesture_detected';

export interface SliderAnalyticsData {
  eventType: SliderAnalyticsEvent;
  timestamp: string;
  gestureType?: string;
  error?: Error;
  index?: number;
}
