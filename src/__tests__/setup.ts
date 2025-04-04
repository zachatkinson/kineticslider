/* eslint-env vitest */
import '@testing-library/jest-dom';
import { afterEach, vi, beforeAll } from 'vitest';
import type { TouchOptions, MockResizeObserver, MockIntersectionObserver } from '../types/test/mocks';
import './mocks/resource-management.mock'; // Import the resource management mocks

// Declare custom properties on Window interface for our test helpers
declare global {
  interface Window {
    asyncErrorBoundaryTest: (callback: () => Promise<void>) => Promise<void>;
    __IMMEDIATE_TIMEOUT_EXECUTION__?: boolean;
    __WORKER_REGISTRY__: Set<any>;
    registerWorker: (worker: any) => void;
  }
}

// Global worker registry to track all workers created during tests
window.__WORKER_REGISTRY__ = new Set();

// Helper function to register workers for cleanup
window.registerWorker = function(worker) {
  window.__WORKER_REGISTRY__.add(worker);
  return worker;
};

// Set testing environment flag globally for all tests
beforeAll(() => {
  // Ensure process.env.NODE_ENV is properly set for testing
  if(process.env.NODE_ENV !== 'test') {
    process.env.NODE_ENV = 'test';
  }
  
  // Configure for React error boundary testing
  const originalError = console.error;
  console.error = (...args) => {
    // Suppress React error boundary warnings
    if (args[0]?.includes && args[0].includes('Error boundaries should implement getDerivedStateFromError')) {
      return;
    }
    originalError(...args);
  };
});

// Define Touch class for touch event simulations
// Ensuring it's properly added to the global scope for all test files
if(typeof global.Touch === 'undefined') {
  global.Touch = class Touch {
    identifier;
    target;
    clientX;
    clientY;
    screenX;
    screenY;
    pageX;
    pageY;
    radiusX;
    radiusY;
    rotationAngle;
    force;

    constructor(options: TouchOptions) {
      this.identifier = options.identifier ?? 0;
      this.target = options.target ?? (document.body as unknown as EventTarget);
      this.clientX = options.clientX ?? 0;
      this.clientY = options.clientY ?? 0;
      this.screenX = options.screenX ?? 0;
      this.screenY = options.screenY ?? 0;
      this.pageX = options.pageX ?? 0;
      this.pageY = options.pageY ?? 0;
      this.radiusX = options.radiusX ?? 0;
      this.radiusY = options.radiusY ?? 0;
      this.rotationAngle = options.rotationAngle ?? 0;
      this.force = options.force ?? 0;
    }
  };
}

// Ensure global.window exists before referencing it
const _win = typeof window !== 'undefined' ? window : global;

// Mock setTimeout and clearTimeout properly
global.setTimeout = vi.fn((fn: TimerHandler, _delay?: number) => {
  // Only execute immediately if explicitly testing timeouts
  // This prevents infinite recursion in normal test cases
  if (typeof fn === 'function' && (window as any).__IMMEDIATE_TIMEOUT_EXECUTION__ === true) {
    fn();
  }
  return 1; // Return a mock timer ID
}) as unknown as typeof setTimeout;

global.clearTimeout = vi.fn(() => { return; }) as unknown as typeof clearTimeout;

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
  return setTimeout(() => callback(Date.now()), 0);
});

global.cancelAnimationFrame = vi.fn((id: number) => {
  clearTimeout(id);
});

// Mock the ResizeObserver
class ResizeObserver implements MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

// Mock the IntersectionObserver
class IntersectionObserver implements MockIntersectionObserver {
  root = null;
  rootMargin = '';
  thresholds = [0];
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
}

// Add observers to the global scope
global.ResizeObserver = ResizeObserver;
global.IntersectionObserver = IntersectionObserver;

// Mock Web Worker
global.Worker = vi.fn().mockImplementation(() => ({
  postMessage: vi.fn(),
  terminate: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
  onmessage: null,
  onmessageerror: null,
  onerror: null
})) as unknown as typeof Worker;

// Resource management mocks are imported from './mocks/resource-management.mock'

// Mock window.matchMedia
window.matchMedia = vi.fn().mockImplementation((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(), // deprecated
  removeListener: vi.fn(), // deprecated
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

// Helper function to handle async testing of error boundaries
window.asyncErrorBoundaryTest = async (callback: () => Promise<void>) => {
  try {
    await callback();
  } catch(error) {
    console.error('Error in async error boundary test:', error);
  }
};

// Reset all mocks, terminate any workers, and clear the document body after each test
afterEach(() => {
  // Clean up any registered workers
  if(window.__WORKER_REGISTRY__) {
    window.__WORKER_REGISTRY__.forEach(worker => {
      try {
        worker.terminate();
      } catch(error) {
        console.warn('Error terminating worker during test cleanup:', error);
      }
    });
    window.__WORKER_REGISTRY__.clear();
  }
  
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});
