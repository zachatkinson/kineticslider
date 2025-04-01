/**
 * Test-related type definitions and interfaces
 * @module
 * @version 1.0.0
 * @internal This module contains types used only for testing purposes
 */

export type * from './pixi';
export type * from './gsap';
export type * from './vitest';

/**
 * Common test utility types
 * @internal
 */

/**
 * Mock event interface
 * @internal
 */
export interface MockEvent {
  preventDefault: () => void;
  stopPropagation: () => void;
  type: string;
  target: EventTarget | null;
}

/**
 * Mock touch event interface
 * @internal
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
 * @internal
 */
export interface MockMouseEvent extends MockEvent {
  clientX: number;
  clientY: number;
  button: number;
}

/**
 * Mock intersection observer entry
 * @internal
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
 * @internal
 */
export interface MockResizeObserverEntry {
  target: Element;
  contentRect: DOMRectReadOnly;
  borderBoxSize: ReadonlyArray<ResizeObserverSize>;
  contentBoxSize: ReadonlyArray<ResizeObserverSize>;
  devicePixelContentBoxSize: ReadonlyArray<ResizeObserverSize>;
}

/**
 * Test result type
 * @internal
 */
export type MockResult<T> = {
  type: 'return' | 'throw';
  value: T;
};

/**
 * Test configuration interface
 * @internal
 */
export interface TestConfig {
  timeout?: number;
  retries?: number;
  mockBehavior?: 'strict' | 'loose';
}

/**
 * Test event configuration interface
 * @internal
 */
export interface TestEventConfig {
  preventDefault?: boolean;
  stopPropagation?: boolean;
  bubbles?: boolean;
  cancelable?: boolean;
}

/**
 * Mock function type
 * @internal
 */
export type Mock = jest.Mock; 