/**
 * Gesture-related type definitions and interfaces
 */
import type { GestureDistance, GestureVelocity, GestureThreshold } from './branded';

// Re-export for backward compatibility
export type { GestureDistance, GestureVelocity, GestureThreshold };

/**
 * Gesture direction type
 */
export type GestureDirection = 'horizontal' | 'vertical' | 'both';

/**
 * Gesture state type
 */
export type GestureState = 'idle' | 'start' | 'move' | 'end';

/**
 * Gesture event data
 */
export interface GestureEvent {
  clientX: number;
  clientY: number;
  type: 'touchstart' | 'touchmove' | 'touchend' | 'mousedown' | 'mousemove' | 'mouseup';
  startX?: number;
  startY?: number;
  preventDefault?: () => void;
}

/**
 * Gesture configuration
 */
export interface GestureConfig {
  /** Enable gesture detection */
  enabled: boolean;
  /** Direction of gesture detection */
  direction: GestureDirection;
  /** Threshold for gesture detection */
  threshold: GestureThreshold;
  /** Minimum velocity for gesture detection */
  minVelocity: GestureVelocity;
  /** Maximum distance for gesture detection */
  maxDistance: GestureDistance;
  /** Whether to prevent default browser behavior */
  preventDefault: boolean;
  /** Whether to stop event propagation */
  stopPropagation: boolean;
}

/**
 * Gesture handler return type
 */
export interface UseGestureReturn {
  state: GestureState;
  direction: GestureDirection | null;
  distance: GestureDistance;
  velocity: GestureVelocity;
  handleGesture: (event: GestureEvent) => void;
}

// Gesture delta
export interface GestureDelta {
  x: GestureDistance;
  y: GestureDistance;
}

// Gesture handlers
export interface GestureHandlers {
  onGestureStart?: (event: GestureEvent) => void;
  onGestureMove?: (event: GestureEvent) => void;
  onGestureEnd?: (event: GestureEvent) => void;
} 