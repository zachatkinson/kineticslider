/**
 * Common Mock Utilities
 * 
 * Centralized mock implementations that are used across multiple test files.
 * This reduces duplication and ensures consistent mocking patterns.
 */

import { vi } from 'vitest';

/**
 * Mock GSAP implementation for testing
 *
 * @returns Object with mocked GSAP and ScrollTrigger APIs
 *
 */
export const createGSAPMock = (): {
  gsap: {
    to: any;
    set: any;
    timeline: any;
    config: any;
  };
  ScrollTrigger: {
    to: any;
    set: any;
    timeline: any;
    config: any;
  };
} => {
  const mockTo = vi.fn().mockImplementation((target: any, config: any) => {
    // Simulate immediate completion for testing
    if (config.onComplete) {
      setTimeout(config.onComplete, 0);
    }
    return Promise.resolve({});
  });

  const mockTimeline = vi.fn().mockReturnValue({
    to: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    play: vi.fn().mockReturnThis(),
    pause: vi.fn().mockReturnThis(),
    kill: vi.fn().mockReturnThis()
  });

  return {
    gsap: {
      to: mockTo,
      set: vi.fn(),
      timeline: mockTimeline,
      config: vi.fn()
    },
    ScrollTrigger: {
      to: mockTo,
      set: vi.fn(),
      timeline: mockTimeline,
      config: vi.fn()
    }
  };
};

/**
 * Mock PIXI.js implementation for testing
 *
 * @returns Object with mocked PIXI.js classes and methods
 *
 */
export const createPixiMock = (): {
  Application: any;
  Container: any;
  Sprite: any;
  Texture: any;
  Loader: any;
} => {
  return {
    Application: vi.fn().mockImplementation(() => ({
      stage: { 
        addChild: vi.fn(), 
        removeChild: vi.fn(),
        children: [],
        width: 800,
        height: 600
      },
      renderer: { 
        resize: vi.fn(),
        width: 800,
        height: 600,
        type: 1,
        gl: {}
      },
      destroy: vi.fn(),
      ticker: {
        add: vi.fn(),
        remove: vi.fn(),
        start: vi.fn(),
        stop: vi.fn()
      },
      screen: { width: 800, height: 600 }
    })),
    Container: vi.fn().mockImplementation(() => ({
      addChild: vi.fn(),
      removeChild: vi.fn(),
      children: [],
      x: 0,
      y: 0,
      width: 0,
      height: 0
    })),
    Sprite: vi.fn().mockImplementation(() => ({
      anchor: { set: vi.fn() },
      scale: { set: vi.fn() },
      position: { set: vi.fn() },
      x: 0,
      y: 0,
      width: 0,
      height: 0
    })),
    Texture: {
      from: vi.fn().mockReturnValue({
        width: 100,
        height: 100,
        baseTexture: {}
      })
    },
    Loader: vi.fn().mockImplementation(() => ({
      add: vi.fn().mockReturnThis(),
      load: vi.fn((callback?: () => void) => {
        if (callback) setTimeout(callback, 0);
        return this;
      }),
      resources: {}
    }))
  };
};

/**
 * Mock WebGL optimization utilities
 *
 * @returns Object with mocked WebGL optimization functions
 *
 */
export const createWebGLOptimizationMock = (): {
  createOptimizedPixiOptions: any;
  initializeWebGLOptimizations: any;
} => {
  return {
    createOptimizedPixiOptions: vi.fn().mockReturnValue({
      antialias: true,
      resolution: 1,
      backgroundColor: 0x000000
    }),
    initializeWebGLOptimizations: vi.fn().mockReturnValue({
      isOptimized: true,
      textureManager: { cacheTexture: vi.fn() },
      batchOptimizer: { getStats: vi.fn() },
      performanceMonitor: { startMonitoring: vi.fn() }
    })
  };
};

/**
 * Mock browser APIs for testing
 *
 * @returns Object with mocked browser API constructors and methods
 *
 */
export const createBrowserAPIMocks = (): {
  ResizeObserver: any;
  IntersectionObserver: any;
  requestAnimationFrame: any;
  cancelAnimationFrame: any;
} => {
  const mockResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  }));

  const mockIntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    root: null,
    rootMargin: '',
    thresholds: []
  }));

  const mockRequestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
    setTimeout(callback, 16.67); // ~60fps
    return Date.now();
  });

  const mockCancelAnimationFrame = vi.fn();

  return {
    ResizeObserver: mockResizeObserver,
    IntersectionObserver: mockIntersectionObserver,
    requestAnimationFrame: mockRequestAnimationFrame,
    cancelAnimationFrame: mockCancelAnimationFrame
  };
};

/**
 * Mock performance API for testing
 *
 * @returns Object with mocked performance API and utilities
 *
 */
export const createPerformanceMock = (): {
  performance: Partial<Performance>;
  resetMockTime: () => void;
} => {
  let mockTime = 0;

  return {
    performance: {
      now: vi.fn(() => {
        mockTime += 16.67;
        return mockTime;
      }),
      mark: vi.fn(),
      measure: vi.fn(),
      getEntriesByName: vi.fn(() => []),
      getEntriesByType: vi.fn(() => [])
    } as Partial<Performance>,
    resetMockTime: (): void => {
      mockTime = 0;
    }
  };
};

/**
 * Mock console implementation for testing
 *
 * @returns Mocked console object
 *
 */
export const createConsoleMock = (): Partial<Console> => {
  return {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    group: vi.fn(),
    groupEnd: vi.fn(),
    time: vi.fn(),
    timeEnd: vi.fn()
  } as Partial<Console>;
};

/**
 * Setup common global mocks for testing environment
 *
 * @returns Object containing all the created mocks
 *
 */
export const setupGlobalMocks = (): {
  browserMocks: {
    ResizeObserver: any;
    IntersectionObserver: any;
    requestAnimationFrame: any;
    cancelAnimationFrame: any;
  };
  performanceMock: {
    performance: Partial<Performance>;
    resetMockTime: () => void;
  };
  consoleMock: Partial<Console>;
} => {
  const browserMocks = createBrowserAPIMocks();
  const performanceMock = createPerformanceMock();
  const consoleMock = createConsoleMock();

  // Setup browser APIs
  global.ResizeObserver = browserMocks.ResizeObserver;
  global.IntersectionObserver = browserMocks.IntersectionObserver;
  global.requestAnimationFrame = browserMocks.requestAnimationFrame;
  global.cancelAnimationFrame = browserMocks.cancelAnimationFrame;

  // Setup performance API
  global.performance = performanceMock.performance as Performance;

  // Setup console (silent by default)
  global.console = consoleMock as Console;

  return {
    browserMocks,
    performanceMock,
    consoleMock
  };
};

/**
 * Mock event listeners for testing
 *
 * @returns Object with event listener mock utilities
 *
 */
export const createEventListenerMock = (): {
  addEventListener: any;
  removeEventListener: any;
  dispatchEvent: any;
  getEventListeners: (event?: string) => Function[] | Record<string, Function[]>;
  clearEventListeners: () => void;
} => {
  const eventListeners: Record<string, Function[]> = {};

  const addEventListener = vi.fn((event: string, handler: Function): void => {
    if (!eventListeners[event]) {
      eventListeners[event] = [];
    }
    eventListeners[event].push(handler);
  });

  const removeEventListener = vi.fn((event: string, handler: Function): void => {
    if (eventListeners[event]) {
      const index = eventListeners[event].indexOf(handler);
      if (index > -1) {
        eventListeners[event].splice(index, 1);
      }
    }
  });

  const dispatchEvent = vi.fn((event: Event): void => {
    const handlers = eventListeners[event.type] || [];
    handlers.forEach(handler => handler(event));
  });

  const getEventListeners = (event?: string): Function[] | Record<string, Function[]> => {
    return event ? eventListeners[event] || [] : eventListeners;
  };

  const clearEventListeners = (): void => {
    Object.keys(eventListeners).forEach(key => {
      eventListeners[key] = [];
    });
  };

  return {
    addEventListener,
    removeEventListener,
    dispatchEvent,
    getEventListeners,
    clearEventListeners
  };
}; 