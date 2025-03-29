import type { SliderErrorInfo } from './slider';

/**
 * Direction of a swipe gesture
 */
export type SwipeDirection = 'left' | 'right';

/**
 * Configuration for gesture sensitivity and behavior
 */
export interface GestureConfig {
  /** Minimum distance in pixels required to trigger a swipe */
  threshold: number;
  /** Minimum distance in pixels required to trigger a swipe */
  minDistance: number;
  /** Maximum velocity (px/ms) required to trigger momentum */
  maxVelocity: number;
  /** Minimum velocity (px/ms) required to trigger momentum */
  minVelocity: number;
  /** Maximum time in milliseconds allowed for a gesture */
  maxTime: number;
  /** Minimum time in milliseconds allowed for a gesture */
  minTime: number;
}

/**
 * Options for configuring the useGestures hook
 */
export interface UseGesturesOptions {
  /** Whether gesture detection is enabled */
  enabled?: boolean;
  /** Callback fired when a swipe gesture is detected */
  onSwipe?: (direction: SwipeDirection, distance: number) => void;
  /** Callback fired during drag gesture */
  onDrag?: (distance: number) => void;
  /** Minimum distance in pixels required to trigger a swipe */
  threshold?: number;
  /** Additional configuration for gesture behavior */
  config?: Partial<GestureConfig>;
  /** ARIA label for the swipeable element */
  ariaLabel?: string;
  /** Callback fired when an error occurs */
  onError?: (error: Error, errorInfo: SliderErrorInfo) => void;
}

/**
 * Default configuration values for gestures
 */
export const DEFAULT_GESTURE_CONFIG: GestureConfig = {
  threshold: 50,
  minDistance: 10,
  maxVelocity: 10,
  minVelocity: 0.1,
  maxTime: 1000,
  minTime: 50
};

/**
 * Metrics for gesture performance monitoring
 */
export interface GestureMetrics {
  frameTime: {
    avg: number;
    p95: number;
    max: number;
  } | null;
  velocity: {
    avg: number;
    p95: number;
    max: number;
  } | null;
  gestureDistance: {
    avg: number;
    p95: number;
    max: number;
  } | null;
  finalVelocity: {
    avg: number;
    p95: number;
    max: number;
  } | null;
}

/**
 * Result object returned by the useGestures hook
 */
export interface UseGesturesResult {
  /** Function to attach gesture detection to an element */
  attach: (element: HTMLElement) => () => void;
  /** Function to get performance metrics */
  getMetrics: () => GestureMetrics | null;
}

/**
 * Internal type for tracking pointer coordinates
 */
export interface TouchPoint {
  x: number;
  y: number;
}

/**
 * @deprecated Use native PointerEvent instead
 * Legacy type kept for backward compatibility
 */
export interface GestureEvent extends Event {
  clientX: number;
  clientY: number;
  touches?: Touch[];
}

/**
 * Type guard to check if an event is a valid PointerEvent
 */
export const isValidPointerEvent = (event: Event): event is PointerEvent => {
  return event instanceof PointerEvent &&
    typeof (event as PointerEvent).clientX === 'number' &&
    typeof (event as PointerEvent).clientY === 'number' &&
    typeof (event as PointerEvent).pointerId === 'number';
}; 