/**
 * Test-related type definitions and interfaces
 * @module
 * @version 1.0.0
 */

export type * from './pixi';
export type * from './gsap';

/**
 * Common test utility types
 */

/**
 * Mock event interface
 */
export interface MockEvent {
  preventDefault: () => void;
  stopPropagation: () => void;
  type: string;
  target: EventTarget | null;
}

/**
 * Mock touch event interface
 */
export interface MockTouchEvent extends MockEvent {
  touches: {
    clientX: number;
    clientY: number;
  }[];
  changedTouches: {
    clientX: number;
    clientY: number;
  }[];
}

/**
 * Mock mouse event interface
 */
export interface MockMouseEvent extends MockEvent {
  clientX: number;
  clientY: number;
  button: number;
}

/**
 * Mock intersection observer entry
 */
export interface MockIntersectionObserverEntry {
  isIntersecting: boolean;
  intersectionRatio: number;
  boundingClientRect: DOMRectReadOnly;
  intersectionRect: DOMRectReadOnly;
  rootBounds: DOMRectReadOnly | null;
  target: Element;
  time: number;
}

/**
 * Mock resize observer entry
 */
export interface MockResizeObserverEntry {
  target: Element;
  contentRect: DOMRectReadOnly;
  borderBoxSize: ReadonlyArray<ResizeObserverSize>;
  contentBoxSize: ReadonlyArray<ResizeObserverSize>;
  devicePixelContentBoxSize: ReadonlyArray<ResizeObserverSize>;
}

// Test result types
export type MockResult<T> = {
  type: 'return' | 'throw';
  value: T;
};

// Test configuration types
export interface TestConfig {
  timeout?: number;
  retries?: number;
  mockBehavior?: 'strict' | 'loose';
}

// Test event types
export interface TestEventConfig {
  preventDefault?: boolean;
  stopPropagation?: boolean;
  bubbles?: boolean;
  cancelable?: boolean;
}

// Mock function type
export type Mock = jest.Mock; 