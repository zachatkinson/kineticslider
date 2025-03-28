import type { CSSProperties, ReactNode, ErrorInfo } from 'react';
import type { gsap } from 'gsap';

// Component Props Types
export interface SlideProps {
  id: string;
  content: ReactNode;
  style?: CSSProperties;
  image?: string;
  title?: string;
}

export interface SliderMetrics {
  currentIndex: number;
  totalSlides: number;
  progress: number;
  direction: 'forward' | 'backward';
  isAnimating: boolean;
}

export interface Slide {
  id: string;
  content: string;
}

export interface KineticSliderProps {
  slides: SlideProps[];
  onSlideChange?: (currentIndex: number) => void;
  onAnimationComplete?: () => void;
  onError?: (error: Error) => void;
  className?: string;
  style?: CSSProperties;
  enableKeyboard?: boolean;
  enableGestures?: boolean;
  initialSlide?: number;
  duration?: number;
  ease?: string;
  lazyLoad?: boolean;
}

// GSAP Types
export type GsapTimeline = ReturnType<typeof gsap.timeline>;

// Error Types
/**
 * Custom error for slider-specific validation
 */
export class SliderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SliderError';
  }
}

/**
 * Error types that can occur in the slider
 */
export enum SliderErrorType {
  RENDER = 'render',
  ANIMATION = 'animation',
  VALIDATION = 'validation',
}

/**
 * Extended error information for better error handling
 */
export interface SliderErrorInfo {
  componentStack: string;
  message: string;
  name: string;
  stack?: string | null;
}

// Performance Types
/**
 * Performance metrics for monitoring slider behavior
 */
export interface PerformanceMetrics {
  /** Time taken for initial render */
  initialRenderTime: number;
  /** Average frame time during animations */
  averageFrameTime: number;
  /** Number of frames dropped during animations */
  droppedFrames: number;
  /** Memory usage during animations */
  memoryUsage: number;
  /** Time taken for gesture processing */
  gestureProcessingTime: number;
}

/**
 * Extended performance metrics including web vitals
 */
export interface ExtendedPerformanceMetrics extends PerformanceMetrics {
  initialRenderTime: number;
  averageFrameTime: number;
  droppedFrames: number;
  memoryUsage: number;
  gestureProcessingTime: number;
  FCP?: number;  // First Contentful Paint
  LCP?: number;  // Largest Contentful Paint
  FID?: number;  // First Input Delay
  CLS?: number;  // Cumulative Layout Shift
  TTI?: number;  // Time to Interactive
  TBT?: number;  // Total Blocking Time
}

// Analytics Types
/**
 * Analytics event types for slider interactions
 */
export enum SliderAnalyticsEvent {
  SLIDE_CHANGE = 'slide_change',
  ANIMATION_COMPLETE = 'animation_complete',
  ERROR = 'error',
  GESTURE_START = 'gesture_start',
  GESTURE_END = 'gesture_end'
}

/**
 * Analytics data structure for slider events
 */
export interface SliderAnalyticsData {
  eventType: SliderAnalyticsEvent;
  timestamp: string;
  gestureType?: string;
  error?: Error;
  index?: number;
}

// GSAP Animation Types
export type GsapQuickSetter = ReturnType<typeof gsap.quickSetter>;

export interface GsapEventCallback {
  (type: string, callback: () => void): GsapTimeline;
}

export interface GsapTimelineDefaults {
  duration?: number;
  ease?: string;
  force3D?: boolean;
  lazy?: boolean;
  clearProps?: string;
  overwrite?: boolean | 'auto';
  immediateRender?: boolean;
  onComplete?: () => void;
}

export interface GsapInstance {
  globalTimeline?: {
    clear: () => void;
  };
  ticker?: {
    remove: (fn: () => void) => void;
  };
  updateRoot?: () => void;
}

// Browser Support Types
export type AddEventListenerOptions = {
  passive?: boolean;
  capture?: boolean;
  once?: boolean;
};

export type FrameRequestCallback = (time: number) => void;

export type ResizeObserverCallback = (
  entries: ResizeObserverEntry[],
  observer: ResizeObserver
) => void;

export interface NormalizedPointerEvent {
  clientX: number;
  clientY: number;
  type: string;
  target: EventTarget | null;
  preventDefault: () => void;
}

// Window Extensions
export interface WindowWithAnalytics extends Window {
  analytics?: {
    track: (event: string, data: unknown) => void;
  };
  errorTracker?: {
    captureError: (error: Error | null, context: unknown) => void;
  };
  webVitals: {
    getFCP: (cb: (metric: { value: number }) => void) => void;
    getLCP: (cb: (metric: { value: number }) => void) => void;
    getFID: (cb: (metric: { value: number }) => void) => void;
    getCLS: (cb: (metric: { value: number }) => void) => void;
    getTTI: (cb: (metric: { value: number }) => void) => void;
    getTBT: (cb: (metric: { value: number }) => void) => void;
  };
}

// Add type declaration for performance.memory
declare global {
  interface Performance {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  }
}

// Drag Types
export interface DragState {
  startX: number;
  currentX: number;
  quickSetter: GsapQuickSetter;
  timeline: GsapTimeline | null;
}

export type DragEventType = TouchEvent | MouseEvent;
export type DragEventHandler = (event: DragEventType) => void;

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}
