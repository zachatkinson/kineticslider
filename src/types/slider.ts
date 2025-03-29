/**
 * Core slider types and interfaces
 */

export interface SliderMetrics {
  currentIndex: number;
  totalSlides: number;
  progress: number;
  direction: 'forward' | 'backward';
  isAnimating: boolean;
}

export interface Slide {
  id: string;
  title: string;
  description: string;
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