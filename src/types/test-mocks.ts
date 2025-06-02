/**
 * Test Mock Type Definitions
 * 
 * Centralized type definitions for test mocks and testing utilities.
 * Consolidates interfaces used across mock files to eliminate duplication.
 * 
 * @module TestMockTypes
 * @version 1.0.0
 */

/**
 * Mock PIXI Application options interface
 * 
 * @example
 * ```ts
 * const options: MockApplicationOptions = {
 *   width: 800,
 *   height: 600,
 *   backgroundColor: 0x000000
 * };
 * ```
 */
export interface MockApplicationOptions {
  width?: number;
  height?: number;
  view?: HTMLCanvasElement;
  backgroundColor?: number;
  resolution?: number;
}

/**
 * Mock PIXI Texture interface
 * 
 * @example
 * ```ts
 * const texture: MockTexture = {
 *   destroy: () => {},
 *   width: 800,
 *   height: 600,
 *   valid: true
 * };
 * ```
 */
export interface MockTexture {
  destroy: () => void;
  width: number;
  height: number;
  valid: boolean;
}

/**
 * Mock PIXI Container interface
 *
 * @example
 * Creating a mock PIXI container
 * ```typescript
 * const container: MockPixiContainer = {
 *   addChild: vi.fn(),
 *   removeChild: vi.fn(),
 *   children: [],
 *   x: 0, y: 0, width: 100, height: 100,
 *   scale: { x: 1, y: 1 }
 * };
 * ```
 */
export interface MockPixiContainer {
  addChild: (...args: unknown[]) => unknown;
  removeChild: (...args: unknown[]) => unknown;
  children: unknown[];
  x: number;
  y: number;
  width: number;
  height: number;
  scale: {
    x: number;
    y: number;
  };
}

/**
 * Mock Worker interface for testing
 *
 * @example
 * Creating a mock worker
 * ```typescript
 * const worker: MockWorker = {
 *   postMessage: vi.fn(),
 *   terminate: vi.fn(),
 *   addEventListener: vi.fn(),
 *   removeEventListener: vi.fn(),
 *   onmessage: null,
 *   onerror: null
 * };
 * ```
 */
export interface MockWorker {
  postMessage: (...args: unknown[]) => unknown;
  terminate: (...args: unknown[]) => unknown;
  addEventListener: (...args: unknown[]) => unknown;
  removeEventListener: (...args: unknown[]) => unknown;
  onmessage: ((event: MessageEvent) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
}

/**
 * Mock HTMLElement interface for testing
 *
 * @example
 * Creating a mock HTML element
 * ```typescript
 * const element: MockHTMLElement = {
 *   focus: vi.fn(),
 *   blur: vi.fn(),
 *   click: vi.fn(),
 *   addEventListener: vi.fn(),
 *   removeEventListener: vi.fn(),
 *   getBoundingClientRect: vi.fn().mockReturnValue({
 *     top: 0, left: 0, bottom: 100, right: 100,
 *     width: 100, height: 100, x: 0, y: 0
 *   }),
 *   offsetWidth: 100,
 *   offsetHeight: 100
 * };
 * ```
 */
export interface MockHTMLElement {
  focus: (...args: unknown[]) => unknown;
  blur: (...args: unknown[]) => unknown;
  click: (...args: unknown[]) => unknown;
  addEventListener: (...args: unknown[]) => unknown;
  removeEventListener: (...args: unknown[]) => unknown;
  getBoundingClientRect: (...args: unknown[]) => unknown;
  offsetWidth: number;
  offsetHeight: number;
  clientWidth: number;
  clientHeight: number;
  scrollWidth: number;
  scrollHeight: number;
}

/**
 * Mock Canvas Context interface
 *
 * @example
 * Creating a mock canvas context
 * ```typescript
 * const context: MockCanvasContext = {
 *   fillRect: vi.fn(),
 *   clearRect: vi.fn(),
 *   drawImage: vi.fn(),
 *   scale: vi.fn(),
 *   translate: vi.fn(),
 *   rotate: vi.fn(),
 *   save: vi.fn(),
 *   restore: vi.fn(),
 *   canvas: document.createElement('canvas')
 * };
 * ```
 */
export interface MockCanvasContext {
  fillRect: (...args: unknown[]) => unknown;
  clearRect: (...args: unknown[]) => unknown;
  drawImage: (...args: unknown[]) => unknown;
  scale: (...args: unknown[]) => unknown;
  translate: (...args: unknown[]) => unknown;
  rotate: (...args: unknown[]) => unknown;
  save: (...args: unknown[]) => unknown;
  restore: (...args: unknown[]) => unknown;
  canvas: HTMLCanvasElement;
}

/**
 * Mock ResizeObserver interface
 *
 * @example
 * Creating a mock ResizeObserver
 * ```typescript
 * const observer: MockResizeObserver = {
 *   observe: vi.fn(),
 *   unobserve: vi.fn(),
 *   disconnect: vi.fn(),
 *   callback: vi.fn()
 * };
 * ```
 */
export interface MockResizeObserver {
  observe: (...args: unknown[]) => unknown;
  unobserve: (...args: unknown[]) => unknown;
  disconnect: (...args: unknown[]) => unknown;
  callback: ResizeObserverCallback;
}

/**
 * Mock IntersectionObserver interface
 *
 * @example
 * Creating a mock IntersectionObserver
 * ```typescript
 * const observer: MockIntersectionObserver = {
 *   observe: vi.fn(),
 *   unobserve: vi.fn(),
 *   disconnect: vi.fn(),
 *   root: null,
 *   rootMargin: '0px',
 *   thresholds: [0],
 *   callback: vi.fn()
 * };
 * ```
 */
export interface MockIntersectionObserver {
  observe: (...args: unknown[]) => unknown;
  unobserve: (...args: unknown[]) => unknown;
  disconnect: (...args: unknown[]) => unknown;
  root: Element | null;
  rootMargin: string;
  thresholds: readonly number[];
  callback: IntersectionObserverCallback;
}

/**
 * Test timer utilities interface
 *
 * @example
 * Creating mock timers
 * ```typescript
 * const timers: MockTimers = {
 *   setTimeout: vi.fn(),
 *   clearTimeout: vi.fn(),
 *   triggerTimeout: (id) => {},
 *   triggerAllTimeouts: () => {}
 * };
 * ```
 */
export interface MockTimers {
  setTimeout: (...args: unknown[]) => unknown;
  clearTimeout: (...args: unknown[]) => unknown;
  triggerTimeout: (id: number) => void;
  triggerAllTimeouts: () => void;
}

/**
 * Test data factory interface
 *
 * @example
 * Creating a test data factory
 * ```typescript
 * const factory: TestDataFactory<User> = {
 *   create: (overrides) => ({ id: 1, name: 'Test', ...overrides }),
 *   createMany: (count, overrides) => Array(count).fill(null).map(() => factory.create(overrides)),
 *   createWithDefaults: () => ({ id: 1, name: 'Test' })
 * };
 * ```
 */
export interface TestDataFactory<T> {
  create: (overrides?: Partial<T>) => T;
  createMany: (count: number, overrides?: Partial<T>) => T[];
  createWithDefaults: () => T;
}

/**
 * Mock validation error for testing
 *
 * @example
 * Creating a mock validation error
 * ```typescript
 * const error: MockValidationError = {
 *   type: 'validation',
 *   code: 'REQUIRED_FIELD',
 *   message: 'Field is required',
 *   severity: 'error',
 *   field: 'email'
 * };
 * ```
 */
export interface MockValidationError {
  type: string;
  code: string;
  message: string;
  severity: string;
  field?: string;
  context?: Record<string, unknown>;
}

/**
 * Mock form data for testing
 *
 * @example
 * Creating mock form data
 * ```typescript
 * const formData: MockFormData = {
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   age: 30,
 *   isActive: true
 * };
 * ```
 */
export interface MockFormData {
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Mock gesture event data
 *
 * @example
 * Creating a mock gesture event
 * ```typescript
 * const gesture: MockGestureEvent = {
 *   type: 'swipe',
 *   direction: 'left',
 *   distance: 100,
 *   velocity: 0.5,
 *   deltaX: -100,
 *   deltaY: 0,
 *   startX: 200,
 *   startY: 150,
 *   endX: 100,
 *   endY: 150
 * };
 * ```
 */
export interface MockGestureEvent {
  type: string;
  direction: string;
  distance: number;
  velocity: number;
  deltaX: number;
  deltaY: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

/**
 * Mock animation options for testing
 *
 * @example
 * Creating mock animation options
 * ```typescript
 * const options: MockAnimationOptions = {
 *   duration: 1000,
 *   delay: 0,
 *   easing: 'ease-in-out',
 *   onComplete: () => console.log('Animation complete'),
 *   onUpdate: (progress) => console.log(`Progress: ${progress}`)
 * };
 * ```
 */
export interface MockAnimationOptions {
  duration?: number;
  delay?: number;
  easing?: string;
  onComplete?: () => void;
  onUpdate?: (progress: number) => void;
}

/**
 * Mock performance metrics for testing
 *
 * @example
 * Creating mock performance metrics
 * ```typescript
 * const metrics: MockPerformanceMetrics = {
 *   fps: 60,
 *   memoryUsage: 50 * 1024 * 1024, // 50MB
 *   renderTime: 16.67, // ~60fps
 *   interactionLatency: 5
 * };
 * ```
 */
export interface MockPerformanceMetrics {
  fps: number;
  memoryUsage: number;
  renderTime: number;
  interactionLatency: number;
}

/**
 * Mock worker message event interface for E2E testing
 * 
 * @example
 * Basic usage of mock worker message event
 * ```typescript
 * const event: MockWorkerMessageEvent = {
 *   data: {
 *     task: 'processData',
 *     id: 'task-123',
 *     type: 'execute'
 *   }
 * };
 * ```
 */
export interface MockWorkerMessageEvent {
  data: {
    task?: string | (() => unknown);
    id?: string;
    type?: string;
    payload?: unknown;
    success?: boolean;
    result?: unknown;
    error?: string;
  };
}

/**
 * Mock worker error event interface for E2E testing
 * 
 * @example
 * Basic usage of mock worker error event
 * ```typescript
 * const errorEvent: MockWorkerErrorEvent = {
 *   message: 'Worker execution failed',
 *   filename: 'worker.js',
 *   lineno: 42,
 *   error: new Error('Task failed')
 * };
 * ```
 */
export interface MockWorkerErrorEvent {
  message: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  error?: Error;
} 