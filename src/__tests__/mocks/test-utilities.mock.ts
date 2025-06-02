/**
 * Comprehensive Test Utilities Mock
 * 
 * Centralized test utilities and mock functions to eliminate duplication
 * across test files and provide consistent testing patterns.
 * 
 * @module TestUtilitiesMock
 * @version 1.0.0
 */

import { vi } from 'vitest';
import type { 
  MockWorker, 
  MockHTMLElement, 
  MockTimers, 
  TestDataFactory,
  MockFormData,
  MockGestureEvent,
  MockPerformanceMetrics 
} from '../../types/test-mocks';

/**
 * Test data factories for creating mock objects
 */
export const testDataFactories = {
  /**
   * Create mock worker instance
   * 
   * @returns Mock worker object
   *
   */
  createMockWorker(): MockWorker {
    return {
      postMessage: vi.fn(),
      terminate: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      onmessage: null,
      onerror: null,
    };
  },

  /**
   * Create mock HTML element
   * 
   * @param overrides - Property overrides
   *
   * @returns Mock HTML element
   *
   */
  createMockHTMLElement(overrides: Partial<MockHTMLElement> = {}): MockHTMLElement {
    return {
      focus: vi.fn(),
      blur: vi.fn(),
      click: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      getBoundingClientRect: vi.fn().mockReturnValue({
        top: 0,
        left: 0,
        bottom: 100,
        right: 100,
        width: 100,
        height: 100,
        x: 0,
        y: 0,
        toJSON: vi.fn(),
      }),
      offsetWidth: 100,
      offsetHeight: 100,
      clientWidth: 100,
      clientHeight: 100,
      scrollWidth: 100,
      scrollHeight: 100,
      ...overrides,
    };
  },

  /**
   * Create mock form data
   * 
   * @param overrides - Data overrides
   *
   * @returns Mock form data
   *
   */
  createMockFormData(overrides: Partial<MockFormData> = {}): MockFormData {
    return {
      name: 'Test Name',
      email: 'test@example.com',
      age: 25,
      isActive: true,
      description: null,
      ...overrides,
    };
  },

  /**
   * Create mock gesture event
   * 
   * @param overrides - Event overrides
   *
   * @returns Mock gesture event
   *
   */
  createMockGestureEvent(overrides: Partial<MockGestureEvent> = {}): MockGestureEvent {
    return {
      type: 'swipe',
      direction: 'left',
      distance: 100,
      velocity: 0.5,
      deltaX: -100,
      deltaY: 0,
      startX: 200,
      startY: 150,
      endX: 100,
      endY: 150,
      ...overrides,
    };
  },

  /**
   * Create mock performance metrics
   * 
   * @param overrides - Metrics overrides
   *
   * @returns Mock performance metrics
   *
   */
  createMockPerformanceMetrics(overrides: Partial<MockPerformanceMetrics> = {}): MockPerformanceMetrics {
    return {
      fps: 60,
      memoryUsage: 50 * 1024 * 1024, // 50MB
      renderTime: 16.67, // ~60fps
      interactionLatency: 5,
      ...overrides,
    };
  },
};

/**
 * Mock timer utilities for testing time-dependent code
 */
export const mockTimerUtilities = {
  /**
   * Create mock timers with control functions
   * 
   * @returns Mock timers object
   *
   */
  createMockTimers(): MockTimers {
    const timeouts = new Map<number, () => void>();
    let timeoutId = 0;
    
    const mockSetTimeout = vi.fn((callback: () => void, _delay: number): number => {
      const id = ++timeoutId;
      timeouts.set(id, callback);
      return id;
    });
    
    const mockClearTimeout = vi.fn((id: number): void => {
      timeouts.delete(id);
    });
    
    return {
      setTimeout: mockSetTimeout,
      clearTimeout: mockClearTimeout,
      triggerTimeout: (id: number): void => {
        const callback = timeouts.get(id);
        if (callback) {
          callback();
          timeouts.delete(id);
        }
      },
      triggerAllTimeouts: (): void => {
        timeouts.forEach((callback, id) => {
          callback();
          timeouts.delete(id);
        });
      },
    };
  },

  /**
   * Setup fake timers for testing
   */
  setupFakeTimers(): void {
    vi.useFakeTimers();
  },

  /**
   * Restore real timers
   */
  restoreTimers(): void {
    vi.useRealTimers();
  },

  /**
   * Advance timers by specified time
   * 
   * @param ms - Milliseconds to advance
   *
   */
  advanceTimers(ms: number): void {
    vi.advanceTimersByTime(ms);
  },

  /**
   * Run all pending timers
   */
  runAllTimers(): void {
    vi.runAllTimers();
  },
};

/**
 * Test assertion utilities
 */
export const testAssertions = {
  /**
   * Assert that a function was called with specific direction
   * 
   * @param mockFn - Mock function to check
   *
   * @param direction - Expected direction
   *
   */
  expectCalledWithDirection(mockFn: ReturnType<typeof vi.fn>, direction: string): void {
    expect(mockFn).toHaveBeenCalledWith(
      expect.objectContaining({ direction })
    );
  },

  /**
   * Assert that an element has specific accessibility attributes
   * 
   * @param element - Element to check
   *
   * @param attributes - Expected attributes
   *
   */
  expectAccessibilityAttributes(element: Element, attributes: Record<string, string>): void {
    Object.entries(attributes).forEach(([attr, value]) => {
      expect(element.getAttribute(attr)).toBe(value);
    });
  },

  /**
   * Assert that performance metrics are within acceptable ranges
   * 
   * @param metrics - Performance metrics to check
   *
   */
  expectPerformanceMetrics(metrics: MockPerformanceMetrics): void {
    expect(metrics.fps).toBeGreaterThan(30);
    expect(metrics.renderTime).toBeLessThan(33.33); // 30fps threshold
    expect(metrics.interactionLatency).toBeLessThan(100);
  },
};

/**
 * Test environment setup utilities
 */
export const testEnvironmentSetup = {
  /**
   * Setup DOM environment for testing
   */
  setupDOMEnvironment(): void {
    // Ensure document.body exists
    if (!document.body) {
      document.body = document.createElement('body');
    }

    // Setup basic DOM structure
    if (!document.head) {
      const head = document.createElement('head');
      document.documentElement.appendChild(head);
    }
    
    // Mock window properties
    Object.defineProperty(window, 'scrollTo', {
      value: vi.fn(),
      writable: true,
    });

    Object.defineProperty(window, 'getComputedStyle', {
      value: vi.fn().mockReturnValue({
        getPropertyValue: vi.fn().mockReturnValue(''),
        transform: 'none',
      }),
      writable: true,
    });
  },

  /**
   * Setup canvas environment for testing
   */
  setupCanvasEnvironment(): void {
    // Mock HTMLCanvasElement
    const mockCanvas = {
      getContext: vi.fn().mockReturnValue({
        fillRect: vi.fn(),
        clearRect: vi.fn(),
        drawImage: vi.fn(),
        scale: vi.fn(),
        translate: vi.fn(),
        rotate: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
      }),
      width: 800,
      height: 600,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    global.HTMLCanvasElement = vi.fn().mockImplementation(() => mockCanvas);
  },

  /**
   * Setup worker environment for testing
   */
  setupWorkerEnvironment(): void {
    // Mock Worker constructor
    global.Worker = vi.fn().mockImplementation(() => testDataFactories.createMockWorker());
    
    // Mock URL methods for worker scripts
    global.URL = global.URL || {};
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  },

  /**
   * Setup complete test environment
   */
  setupCompleteEnvironment(): void {
    this.setupDOMEnvironment();
    this.setupCanvasEnvironment();
    this.setupWorkerEnvironment();
  },

  /**
   * Cleanup test environment
   */
  cleanup(): void {
    vi.clearAllMocks();
    vi.resetAllMocks();
    mockTimerUtilities.restoreTimers();
  },
};

/**
 * Mock event utilities
 */
export const mockEventUtilities = {
  /**
   * Create mock keyboard event
   * 
   * @param key - Key name
   *
   * @param options - Event options
   *
   * @returns Mock keyboard event
   *
   */
  createMockKeyboardEvent(key: string, options: Partial<KeyboardEvent> = {}): KeyboardEvent {
    return new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
      ...options,
    });
  },

  /**
   * Create mock mouse event
   * 
   * @param type - Event type
   *
   * @param options - Event options
   *
   * @returns Mock mouse event
   *
   */
  createMockMouseEvent(type: string, options: Partial<MouseEvent> = {}): MouseEvent {
    return new MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      clientX: 100,
      clientY: 100,
      ...options,
    });
  },

  /**
   * Create mock touch event
   * 
   * @param type - Event type
   *
   * @param touches - Touch points
   *
   * @returns Mock touch event
   *
   */
  createMockTouchEvent(type: string, touches: Partial<Touch>[] = []): TouchEvent {
    const mockTouches = touches.map((touch, index) => ({
      identifier: index,
      target: document.body,
      clientX: 100,
      clientY: 100,
      pageX: 100,
      pageY: 100,
      screenX: 100,
      screenY: 100,
      radiusX: 10,
      radiusY: 10,
      rotationAngle: 0,
      force: 1,
      ...touch,
    })) as Touch[];

    return new TouchEvent(type, {
      bubbles: true,
      cancelable: true,
      touches: mockTouches,
      targetTouches: mockTouches,
      changedTouches: mockTouches,
    });
  },
};

/**
 * Generic test data factory
 * 
 * @param defaults - Default values
 *
 * @returns Test data factory
 *
 */
export function createTestDataFactory<T>(defaults: T): TestDataFactory<T> {
  return {
    create: (overrides?: Partial<T>): T => ({
      ...defaults,
      ...overrides,
    }),
    createMany: (count: number, overrides?: Partial<T>): T[] => 
      Array.from({ length: count }, () => ({
        ...defaults,
        ...overrides,
      })),
    createWithDefaults: (): T => ({ ...defaults }),
  };
} 