/**
 * Centralized Test Setup Mocks
 * 
 * Consolidates browser API mocks and test setup utilities that are commonly
 * used across multiple test files to reduce duplication and ensure consistency.
 * 
 * @module TestSetupMocks
 * @version 1.0.0
 */

import { vi } from 'vitest';

/**
 * Browser API mocks for consistent testing environment
 */
export const browserApiMocks = {
  /**
   * Setup ResizeObserver mock
   */
  setupResizeObserver(): void {
    global.ResizeObserver = vi.fn().mockImplementation((callback: ResizeObserverCallback) => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
      callback,
    }));
  },

  /**
   * Setup IntersectionObserver mock
   */
  setupIntersectionObserver(): void {
    global.IntersectionObserver = vi.fn().mockImplementation((callback: IntersectionObserverCallback) => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
      root: null,
      rootMargin: '',
      thresholds: [],
      callback,
    }));
  },

  /**
   * Setup matchMedia mock
   */
  setupMatchMedia(): void {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  },

  /**
   * Setup requestAnimationFrame mock
   */
  setupRequestAnimationFrame(): void {
    let rafId = 0;
    global.requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
      rafId++;
      setTimeout(() => callback(performance.now()), 0);
      return rafId;
    });

    global.cancelAnimationFrame = vi.fn((_id: number) => {
      // No-op for tests
    });
  },

  /**
   * Setup performance.now mock
   */
  setupPerformanceNow(): void {
    let mockTime = 0;
    performance.now = vi.fn(() => {
      mockTime += 16.67; // Simulate ~60fps
      return mockTime;
    });
  },

  /**
   * Setup all browser API mocks at once
   */
  setupAll(): void {
    this.setupResizeObserver();
    this.setupIntersectionObserver();
    this.setupMatchMedia();
    this.setupRequestAnimationFrame();
    this.setupPerformanceNow();
  },

  /**
   * Reset mock time for performance.now
   */
  resetMockTime(): void {
    let mockTime = 0;
    performance.now = vi.fn(() => {
      mockTime += 16.67;
      return mockTime;
    });
  }
};

/**
 * Common test data factories
 */
export const testDataFactories = {
  /**
   * Create mock slides for testing
   *
   * @param count - Number of slides to create
   *
   * @param options - Additional options for slide creation
   *
   * @param options.prefix - Prefix for slide titles
   *
   * @param options.includeImages - Whether to include image properties
   *
   * @returns Array of mock slides
   *
   */
  createMockSlides(count: number, options: { prefix?: string; includeImages?: boolean } = {}): Array<{
    id: string;
    title: string;
    content: string;
    image?: string;
    alt?: string;
  }> {
    const { prefix = 'Slide', includeImages = true } = options;
    
    return Array.from({ length: count }, (_, index) => ({
      id: `slide-${index + 1}`,
      title: `${prefix} ${index + 1}`,
      content: `Content for ${prefix} ${index + 1}`,
      ...(includeImages && { 
        image: `/slide${index + 1}.jpg`,
        alt: `${prefix} ${index + 1} image`
      })
    }));
  },

  /**
   * Create mock element for testing
   *
   * @param id - Element ID
   *
   * @param tagName - HTML tag name
   *
   * @returns Mock HTML element
   *
   */
  createMockElement(id: string = 'test', tagName: string = 'div'): HTMLElement {
    const element = document.createElement(tagName);
    element.id = id;
    element.getBoundingClientRect = vi.fn().mockReturnValue({
      width: 800,
      height: 600,
      top: 0,
      left: 0,
      bottom: 600,
      right: 800,
      x: 0,
      y: 0,
      toJSON: vi.fn(),
    });
    return element;
  },

  /**
   * Create mock worker for testing
   *
   * @returns Mock Worker instance
   *
   */
  createMockWorker(): Worker {
    const worker = {
      postMessage: vi.fn(),
      terminate: vi.fn(),
      onmessage: null,
      onerror: null,
      onmessageerror: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as unknown as Worker;

    return worker;
  }
};

/**
 * Test environment setup utilities
 */
export const testEnvironment = {
  /**
   * Setup JSDOM environment for component testing
   */
  setupJSDOM(): void {
    // Ensure document.body exists
    if (!document.body) {
      document.body = document.createElement('body');
    }

    // Setup basic DOM structure if head doesn't exist
    if (!document.head) {
      const head = document.createElement('head');
      document.documentElement.appendChild(head);
    }
    
    // Mock window properties that might be missing in JSDOM
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
   * Setup worker environment for worker testing
   */
  setupWorkerEnvironment(): void {
    // Mock Worker constructor
    global.Worker = vi.fn().mockImplementation(() => testDataFactories.createMockWorker());
    
    // Mock URL.createObjectURL for worker scripts
    global.URL = global.URL || {};
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  },

  /**
   * Cleanup test environment
   */
  cleanup(): void {
    vi.clearAllMocks();
    vi.resetAllMocks();
    
    // Reset mock time
    browserApiMocks.resetMockTime();
    
    // Clear any remaining timers
    vi.clearAllTimers();
  }
};

/**
 * Convenience function to setup complete test environment
 */
export function setupTestEnvironment(): void {
  browserApiMocks.setupAll();
  testEnvironment.setupJSDOM();
  testEnvironment.setupWorkerEnvironment();
}

/**
 * Convenience function to cleanup test environment
 */
export function cleanupTestEnvironment(): void {
  testEnvironment.cleanup();
} 