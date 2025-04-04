/**
 * Analytics-related type definitions and interfaces
 */
import type { SlideIndex, SliderId } from './branded';
import type { ErrorType } from './slider';

/**
 * Types of events that can be tracked
 */
export type SliderEventType =
  | 'slide_change'
  | 'animation_start'
  | 'animation_complete'
  | 'gesture_start'
  | 'gesture_end'
  | 'gesture_detected'
  | 'error'
  | 'view'
  | 'interaction'
  | 'performance_metric'
  | 'accessibility_action';

/**
 * Base event data interface
 * @example Example usage
 */
interface BaseEventData {
  timestamp: number;
  sessionId: string;
  type: SliderEventType;
  componentId?: string;
}

/**
 * Event-specific data interfaces
 * @example Example usage
 */
interface SlideChangeEventData extends BaseEventData {
  type: 'slide_change';
  fromIndex: SlideIndex;
  toIndex: SlideIndex;
  slideId: SliderId;
  isAutoplay: boolean;
}

interface AnimationEventData extends BaseEventData {
  type: 'animation_start' | 'animation_complete';
  duration: number;
  direction: 'forward' | 'backward';
}

interface GestureEventData extends BaseEventData {
  type: 'gesture_start' | 'gesture_end' | 'gesture_detected';
  direction: 'horizontal' | 'vertical';
  distance: number;
  velocity: number;
}

interface ErrorEventData extends BaseEventData {
  type: 'error';
  errorType: ErrorType;
  message: string;
  stack?: string;
}

interface ViewEventData extends BaseEventData {
  type: 'view';
  slideId: SliderId;
  duration: number;
  isVisible: boolean;
}

interface InteractionEventData extends BaseEventData {
  type: 'interaction';
  action: 'click' | 'hover' | 'focus';
  target: string;
  slideId?: SliderId;
}

interface PerformanceEventData extends BaseEventData {
  type: 'performance_metric';
  metricName: string;
  value: number;
  unit: string;
}

interface AccessibilityEventData extends BaseEventData {
  type: 'accessibility_action';
  action: string;
  element: string;
  role: string;
}

/**
 * Union type of all event data
 */
export type SliderEventData =
  | SlideChangeEventData
  | AnimationEventData
  | GestureEventData
  | ErrorEventData
  | ViewEventData
  | InteractionEventData
  | PerformanceEventData
  | AccessibilityEventData;

/**
 * Analytics configuration
 * @example Example usage
 */
interface AnalyticsConfig {
  enabled: boolean;
  debug: boolean;
  batchEvents: boolean;
  batchSize: number;
  batchInterval: number;
  enableErrors: boolean;
  enablePerformance: boolean;
  enableInteractions: boolean;
  trackPerformance: boolean;
  trackInteractions: boolean;
  trackErrors: boolean;
  onEvent?: (_event: SliderAnalyticsData) => void;
  endpoint?: string;
}

/**
 * Analytics provider interface
 * @example Example usage
 */
export interface AnalyticsProvider {
  trackEvent: (_event: SliderEventData) => void;
  getConfig: () => AnalyticsConfig;
  setConfig: (_config: Partial<AnalyticsConfig>) => void;
  flush: () => Promise<void>;
}

/** All possible slider event types for analytics */
export type SliderAnalyticsEventType =
  | 'slide_change'
  | 'animation_complete'
  | 'gesture_detected'
  | 'error'
  | 'interaction'
  | 'performance_metric'
  | 'accessibility_action';

/** Base analytics data interface 
 * @example Example usage
 */
interface BaseAnalyticsData {
  eventType: SliderAnalyticsEventType;
  timestamp: string;
  componentId?: string;
  sessionId?: string;
}

/** Analytics data for slide changes 
 * @example Example usage
 */
interface SlideChangeAnalytics extends BaseAnalyticsData {
  eventType: 'slide_change';
  fromIndex: SlideIndex;
  toIndex: SlideIndex;
  slideId: SliderId;
  isAutoplay: boolean;
}

/** Analytics data for animation completion 
 * @example Example usage
 */
interface AnimationCompleteAnalytics extends BaseAnalyticsData {
  eventType: 'animation_complete';
  duration: number;
  direction: 'forward' | 'backward';
}

/** Analytics data for gesture detection 
 * @example Example usage
 */
interface GestureAnalytics extends BaseAnalyticsData {
  eventType: 'gesture_detected';
  gestureType: string;
  direction: 'horizontal' | 'vertical';
  distance: number;
  velocity: number;
}

/** Analytics data for errors 
 * @example Example usage
 */
interface ErrorAnalytics extends BaseAnalyticsData {
  eventType: 'error';
  error: Error;
  errorType: ErrorType;
  componentInfo?: {
    currentIndex: SlideIndex;
    isAnimating: boolean;
    isDragging: boolean;
  };
}

/** Union type for all slider analytics data */
export type SliderAnalyticsData =
  | SlideChangeAnalytics 
  | AnimationCompleteAnalytics 
  | GestureAnalytics 
  | ErrorAnalytics;

// Export all types
export type {
  BaseEventData,
  SlideChangeEventData,
  AnimationEventData,
  GestureEventData,
  ErrorEventData,
  ViewEventData,
  InteractionEventData,
  PerformanceEventData,
  AccessibilityEventData,
  AnalyticsConfig,
  BaseAnalyticsData,
  SlideChangeAnalytics,
  AnimationCompleteAnalytics,
  GestureAnalytics,
  ErrorAnalytics
};
