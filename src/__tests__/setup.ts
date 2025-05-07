import '@testing-library/jest-dom';
import { vi, afterEach, beforeEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import './worker-loader';
import { MockWorker } from './mocks/mock-worker';

// Extend vitest's expect method with testing-library methods
expect.extend({});

// Cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});

// Mock ResizeObserver which is not available in test environment
class MockResizeObserver implements ResizeObserver {
  observe(target: Element) {}
  unobserve(target: Element) {}
  disconnect() {}
}

// Mock IntersectionObserver which is not available in test environment
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];

  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {}

  observe(target: Element): void {}
  unobserve(target: Element): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] { return []; }
}

global.ResizeObserver = MockResizeObserver;
global.IntersectionObserver = MockIntersectionObserver;

// Mock matchMedia
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

// Suppress console.error during tests
const originalError = console.error;
beforeEach(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterEach(() => {
  console.error = originalError;
});

// Create a global worker registry for testing
const workerRegistry = new Map<string, Worker>();

// Mock Worker globally
global.Worker = MockWorker as any;

// Reset mocks between tests
beforeEach(() => {
  workerRegistry.clear();
  vi.clearAllMocks();
  
  // Reset worker registry
  if (typeof window !== 'undefined') {
    window.__WORKER_REGISTRY__ = new Set();
  }
}); 