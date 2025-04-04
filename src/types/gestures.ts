/**
 * Gesture-related type definitions and interfaces for useGestures hook
 */
import type { GestureDistance as _GestureDistance, GestureVelocity as _GestureVelocity, GestureThreshold as _GestureThreshold } from './branded';
import type { GestureConfig, GestureHandlers } from './gesture';

// Export types from gesture.ts for compatibility
export type { GestureConfig, GestureHandlers };

/**
 * Supported swipe directions
 */
export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

/**
 * Options for the gesture hook attach method
 * @example Example usage
 */
export interface GestureOptions {
  onSwipe?: (_direction: SwipeDirection) => void;
}

/**
 * Return type for the useGestures hook
 * @example Example usage
 */
export interface UseGesturesReturn {
  attach: (_element: HTMLElement, _options: GestureOptions) => (() => void);
}

/**
 * Event type for gesture events
 * @example Example usage
 */
export interface GestureEvent {
  /**
   * Type of gesture event
   */
  type: 'tap' | 'swipe' | 'pinch' | 'rotate' | 'press' | 'pan' | 'hover';
  
  /**
   * Original DOM event that triggered the gesture
   */
  originalEvent: MouseEvent | TouchEvent | PointerEvent;
  
  /**
   * Target _element of the gesture
   */
  target: HTMLElement;
  
  /**
   * Center position of the gesture
   */
  center: {
    x: number;
    y: number;
  };
  
  /**
   * Timestamp when the gesture started
   */
  startTime: number;
  
  /**
   * Timestamp when the gesture ended
   */
  endTime?: number;
  
  /**
   * Calculated velocity of the gesture (pixels per ms)
   */
  velocity?: {
    x: number;
    y: number;
  };
  
  /**
   * Direction of the gesture movement
   */
  _direction?: {
    x: 'left' | 'right' | 'none';
    y: 'up' | 'down' | 'none';
  };
  
  /**
   * Delta movement from the start of the gesture
   */
  delta?: {
    x: number;
    y: number;
  };
} 