/**
 * Types for test fixtures
 */
import type { GestureEvent, SwipeDirection } from '../gestures';
import type { Slide } from '../slider';

/**
 * Mock event interface
 * @example
 * ```typescript
 * const mockEvent: MockEvent = {
 *   type: 'click',
 *   preventDefault: jest.fn(),
 *   stopPropagation: jest.fn()
 * };
 * ```
 */
export interface MockEvent {
  /**
   * Event type
   */
  type: string;
  /**
   * Prevent default behavior
   */
  preventDefault: () => void;
  /**
   * Stop propagation
   */
  stopPropagation: () => void;
}

/**
 * Mock gesture event with direction
 * @example
 * ```typescript
 * const swipeEvent: MockGestureEvent = {
 *   type: 'swipe',
 *   direction: 'left',
 *   deltaX: -120,
 *   deltaY: 5,
 *   velocity: 0.8,
 *   target: document.createElement('div')
 * };
 * ```
 */
export interface MockGestureEvent extends Omit<GestureEvent, 'type'> {
  type: 'swipe';
  direction: SwipeDirection;
}

export { type TouchOptions as TouchInit } from './mocks';

/**
 * Test Data Fixtures
 * @example Example usage
 */
export interface TestSlide extends Slide {
  testId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Test Event Fixtures
 * @example Example usage
 */
export interface TestEvent {
  type: string;
  target: Element;
  preventDefault: () => void;
  stopPropagation: () => void;
  clientX?: number;
  clientY?: number;
  touches?: { clientX: number; clientY: number }[];
} 