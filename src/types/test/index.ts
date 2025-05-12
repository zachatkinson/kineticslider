/**
 * Test-related type definitions and interfaces
 *
 * @module
 * @version 1.0.0
 * @description This module contains types used only for testing purposes
 */

export type * from "./pixi";
export type * from "./gsap";
export type * from "./vitest";

/**
 * Common test utility types
 *
 * @description */

/**
 * Mock event interface
 *
 * @description * @example Example usage
 * @example
 * ```typescript
 * const event: MockEvent = {
 *   preventDefault: vi.fn(),
 *   stopPropagation: vi.fn(),
 *   type: 'click',
 *   target: document.createElement('button')
 * };
 * ```
 */
export interface MockEvent {
  preventDefault: () => void;
  stopPropagation: () => void;
  type: string;
  target: EventTarget | null;
}

/**
 * Mock touch event interface
 *
 * @description * @example Example usage
 * @example
 * ```typescript
 * const touchEvent: MockTouchEvent = {
 *   preventDefault: vi.fn(),
 *   stopPropagation: vi.fn(),
 *   type: 'touchstart',
 *   target: document.createElement('div'),
 *   touches: [{ clientX: 100, clientY: 200 }],
 *   changedTouches: [{ clientX: 100, clientY: 200 }]
 * };
 * ```
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
 *
 * @description * @example Example usage
 * @example
 * ```typescript
 * const mouseEvent: MockMouseEvent = {
 *   preventDefault: vi.fn(),
 *   stopPropagation: vi.fn(),
 *   type: 'mousedown',
 *   target: document.createElement('div'),
 *   clientX: 150,
 *   clientY: 250,
 *   button: 0
 * };
 * ```
 */
export interface MockMouseEvent extends MockEvent {
  clientX: number;
  clientY: number;
  button: number;
}

/**
 * Mock intersection observer entry
 *
 * @description * @example Example usage
 * @example
 * ```typescript
 * const entry: MockIntersectionObserverEntry = {
 *   isIntersecting: true,
 *   intersectionRatio: 0.85,
 *   boundingClientRect: DOMRectReadOnly.fromRect({ x: 0, y: 0, width: 100, height: 100 }),
 *   intersectionRect: DOMRectReadOnly.fromRect({ x: 0, y: 0, width: 100, height: 85 }),
 *   rootBounds: DOMRectReadOnly.fromRect({ x: 0, y: 0, width: 1024, height: 768 }),
 *   target: document.createElement('div'),
 *   time: performance.now()
 * };
 * ```
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
 *
 * @description * @example Example usage
 * @example
 * ```typescript
 * const entry: MockResizeObserverEntry = {
 *   target: document.createElement('div'),
 *   contentRect: DOMRectReadOnly.fromRect({ x: 0, y: 0, width: 200, height: 150 }),
 *   borderBoxSize: [{ inlineSize: 200, blockSize: 150 }],
 *   contentBoxSize: [{ inlineSize: 180, blockSize: 130 }],
 *   devicePixelContentBoxSize: [{ inlineSize: 360, blockSize: 260 }]
 * };
 * ```
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
 *
 * @description */
export type MockResult<T> = {
  type: "return" | "throw";
  value: T;
};

/**
 * Test configuration interface
 *
 * @description * @example Example usage
 * @example
 * ```typescript
 * const config: TestConfig = {
 *   timeout: 5000,
 *   retries: 3,
 *   mockBehavior: 'strict'
 * };
 * ```
 */
export interface TestConfig {
  timeout?: number;
  retries?: number;
  mockBehavior?: "strict" | "loose";
}

/**
 * Test event configuration interface
 *
 * @description * @example Example usage
 * @example
 * ```typescript
 * const eventConfig: TestEventConfig = {
 *   preventDefault: true,
 *   stopPropagation: true,
 *   bubbles: true,
 *   cancelable: true
 * };
 * ```
 */
export interface TestEventConfig {
  preventDefault?: boolean;
  stopPropagation?: boolean;
  bubbles?: boolean;
  cancelable?: boolean;
}

/**
 * Mock function type
 *
 * @description */
export type Mock = jest.Mock;
