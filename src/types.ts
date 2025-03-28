import { gsap } from 'gsap';

import { CSSProperties, ErrorInfo, ReactNode } from 'react';

// Component Props Types
export interface KineticSliderProps {
  /**
   * The slides to be rendered in the slider
   */
  children: ReactNode;

  /**
   * Custom class name for the slider container
   */
  className?: string;

  /**
   * Custom inline styles for the slider container
   */
  style?: CSSProperties;

  /**
   * Animation duration in seconds
   * @default 0.5
   */
  duration?: number;

  /**
   * Animation easing function
   * @default "power2.out"
   */
  ease?: string;

  /**
   * Whether to enable touch/swipe gestures
   * @default true
   */
  enableGestures?: boolean;

  /**
   * Whether to enable keyboard navigation
   * @default true
   */
  enableKeyboard?: boolean;

  /**
   * Callback fired when the active slide changes
   */
  onChange?: (index: number) => void;

  /**
   * Initial active slide index
   * @default 0
   */
  initialIndex?: number;

  /**
   * Whether to enable infinite looping
   * @default true
   */
  infinite?: boolean;

  /**
   * Enable lazy loading of slides
   */
  lazyLoad?: boolean;

  /**
   * Optional callback for performance metrics
   */
  onMetrics?: (metrics: PerformanceMetrics) => void;
}

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
  VALIDATION = 'validation',
  ANIMATION = 'animation',
  GESTURE = 'gesture',
  RENDER = 'render',
  MEMORY = 'memory',
}

/**
 * Extended error information for better error handling
 */
export interface SliderErrorInfo extends Omit<ErrorInfo, 'componentStack'> {
  errorType?: SliderErrorType;
  componentStack?: string | undefined;
  additionalData?: Record<string, unknown>;
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
  /** Time to First Contentful Paint */
  FCP?: number;
  /** Largest Contentful Paint */
  LCP?: number;
  /** First Input Delay */
  FID?: number;
  /** Cumulative Layout Shift */
  CLS?: number;
  /** Time to Interactive */
  TTI?: number;
  /** Total Blocking Time */
  TBT?: number;
}

// Analytics Types
/**
 * Analytics event types for slider interactions
 */
export enum SliderAnalyticsEvent {
  SLIDE_CHANGE = 'slide_change',
  GESTURE_START = 'gesture_start',
  GESTURE_END = 'gesture_end',
  ERROR = 'error',
  PERFORMANCE = 'performance',
}

/**
 * Analytics data structure for slider events
 */
export interface SliderAnalyticsData {
  eventType: SliderAnalyticsEvent;
  timestamp: string;
  slideIndex?: number;
  gestureType?: 'touch' | 'mouse' | 'keyboard';
  error?: {
    type: SliderErrorType;
    message: string;
    stack?: string | undefined;
  };
  performance?: PerformanceMetrics;
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

export interface GsapTimeline {
  to: (
    target: HTMLElement | string,
    vars: Record<string, unknown>
  ) => GsapTimeline;
  fromTo: (
    target: HTMLElement | string,
    fromVars: Record<string, unknown>,
    toVars: Record<string, unknown>
  ) => GsapTimeline;
  kill: () => void;
  progress: (value: number) => GsapTimeline;
  pause: () => GsapTimeline;
  resume: () => GsapTimeline;
  eventCallback: GsapEventCallback;
  defaults: GsapTimelineDefaults;
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
  analytics: {
    track: (event: string, data: unknown) => void;
  };
  errorTracker: {
    captureError: (error: Error, context: unknown) => void;
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
